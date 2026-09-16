#!/usr/bin/env python3
"""EV-41 TUI falsifier (pty, python3 stdlib ONLY).

Adapted from test/ev40-harness/tui-retry.py (P6 machinery dropped — no
council_dispatch tool call, no inline-tree assertions). Drives the REAL
installed pi TUI (24x80, TERM=xterm-256color, scratch HOME/cwd, `--offline`,
faux provider `ev40`) with the REAL council extension
(`extensions/index.ts`) so COUNCIL's parent-turn retry mechanism is the only
continuation mechanism under test. Both arms inject the same failure class:
the WITH-COLON literal `Provider finish_reason: error` (byte-equal to
PROVIDER_FINISH_REASON_ERROR, O3) as the first provider response's
errorMessage — NOT the classify-negative colon-less EV-43 spelling, and NOT
pi-retryable (pi's own auto-retry therefore cannot produce the second
message).

  treatment  — scratch `.council.json` retry policy ENABLED
               (maxAttempts=3, baseDelayMs=4000, jitter=false): the engine's
               agent_settled handler must arm the backoff (countdown line on
               the screen), re-send the original prompt, and the second
               assistant message must render (EV40-SECOND-RESPONSE).
  control    — identical provider behavior, retry policy DISABLED: no
               mechanism, therefore no countdown line and no second
               assistant message (EV-43 attribution discipline: a control
               with no mechanism shows no continuation).

The runner exits 0 iff BOTH verdicts hold; it prints its per-gate answers
either way (EV41-TUI-VERDICT: GREEN/RED).

Expects env: NODE_BIN, CLI_PATH, EXT_PATH (harness ext), COUNCIL_EXT.
Args: artifact dir.
"""

import fcntl
import json
import os
import pty
import re
import select
import struct
import sys
import termios
import time

ROWS, COLS = 24, 80

DA_REPLY = b"\x1b[?1;2c"
KITTY_REPLY = b"\x1b[>1u"
K_CR = b"\r"

CSI_RE = re.compile(rb"\x1b\[([0-9;?]*)([ -/]*[A-Za-z])")
OSC_RE = re.compile(rb"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")


class Screen:
    """Minimal pty screen model (the ev40/ev43 falsifiers')."""

    def __init__(self, rows=ROWS, cols=COLS):
        self.rows = rows
        self.cols = cols
        self.cells = [[" "] * cols for _ in range(rows)]
        self.r = 0
        self.c = 0

    def feed(self, data: bytes) -> None:
        i, n = 0, len(data)
        while i < n:
            b = data[i]
            if b == 0x1B:
                m = OSC_RE.match(data, i)
                if m:
                    i = m.end()
                    continue
                m = CSI_RE.match(data, i)
                if m:
                    args_s, final = m.group(1).decode("latin-1"), m.group(2).decode("latin-1")
                    i = m.end()
                    self._csi(args_s, final[-1] if final else "")
                    continue
                i += 1
                continue
            if b == 0x0D:
                self.c = 0
                i += 1
                continue
            if b == 0x0A:
                self.r = min(self.rows - 1, self.r + 1)
                i += 1
                continue
            width = 1 if b < 0x80 else 2 if b < 0xE0 else 3 if b < 0xF0 else 4
            chunk = data[i : i + width]
            try:
                ch = chunk.decode("utf-8")
            except UnicodeDecodeError:
                i += 1
                continue
            if ord(ch) >= 0x20:
                if self.c < self.cols:
                    self.cells[self.r][self.c] = ch
                self.c += 1
            i += width

    def _csi(self, args_s: str, final: str) -> None:
        if final in "Hf":
            parts = args_s.split(";") if args_s else ["1", "1"]
            self.r = max(0, min(self.rows - 1, int(parts[0] or 1) - 1))
            self.c = max(0, min(self.cols - 1, int(parts[1] or 1) - 1))
        elif final == "A":
            self.r = max(0, self.r - (int(args_s) if args_s else 1))
        elif final == "B":
            self.r = min(self.rows - 1, self.r + (int(args_s) if args_s else 1))
        elif final == "C":
            self.c = min(self.cols - 1, self.c + (int(args_s) if args_s else 1))
        elif final == "D":
            self.c = max(0, min(self.cols - 1, (int(args_s) if args_s else 1) - 1))
        elif final == "G":
            self.c = max(0, min(self.cols - 1, (int(args_s) if args_s else 1) - 1))
        elif final == "K":
            mode = int(args_s) if args_s else 0
            if mode == 0:
                for x in range(self.c, self.cols):
                    self.cells[self.r][x] = " "
            elif mode == 1:
                for x in range(0, self.c + 1):
                    self.cells[self.r][x] = " "
            else:
                self.cells[self.r] = [" "] * self.cols
        elif final == "J":
            if args_s in ("2", "3"):
                self.cells = [[" "] * self.cols for _ in range(self.rows)]
                self.r = self.c = 0

    def lines(self):
        return ["".join(row).rstrip() for row in self.cells]

    def text(self):
        return "\n".join(self.lines())


class Session:
    def __init__(self, argv, work_dir, home, env_extra, bytelog_path):
        self.bytelog_path = bytelog_path
        self.bytelog = open(bytelog_path, "wb")
        self.screen = Screen()
        # Explicit env: PATH + scratch HOME + harness vars only — nothing
        # ambient inherited (the FLLWUP-21 env-split lesson).
        env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": home, "TERM": "xterm-256color"}
        env.update(env_extra)
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", ROWS, COLS, 0, 0))
        pid = os.fork()
        if pid == 0:
            os.setsid()
            fcntl.ioctl(slave, termios.TIOCSCTTY, 0)
            os.dup2(slave, 0)
            os.dup2(slave, 1)
            os.dup2(slave, 2)
            os.chdir(work_dir)
            os.execvpe(argv[0], argv, env)
        os.close(slave)
        self.master = master
        self.pid = pid

    def _feed(self, d: bytes) -> None:
        self.bytelog.write(d)
        self.bytelog.flush()
        self.screen.feed(d)

    def send(self, data: bytes) -> None:
        os.write(self.master, data)

    def poll(self, quiet=0.05) -> bool:
        r, _, _ = select.select([self.master], [], [], quiet)
        if self.master in r:
            try:
                d = os.read(self.master, 65536)
            except OSError:
                return False
            if d:
                self._feed(d)
                return True
        return False

    def drain(self, seconds: float) -> None:
        end = time.time() + seconds
        while time.time() < end:
            self.poll()

    def wait_for(self, needle, ceiling=20.0) -> bool:
        end = time.time() + ceiling
        while time.time() < end:
            self.poll()
            if needle in self.screen.text():
                return True
        return False

    def wait_stable(self, require=6, quiet=0.1, ceiling=15.0) -> bool:
        quiet_count = 0
        end = time.time() + ceiling
        while time.time() < end and quiet_count < require:
            r, _, _ = select.select([self.master], [], [], quiet)
            if self.master in r:
                try:
                    d = os.read(self.master, 65536)
                except OSError:
                    return True
                if not d:
                    return True
                self._feed(d)
                quiet_count = 0
            else:
                quiet_count += 1
        return quiet_count >= require

    def respond_queries(self) -> None:
        try:
            with open(self.bytelog_path, "rb") as f:
                f.seek(max(0, os.path.getsize(self.bytelog_path) - 8192))
                tail = f.read()
        except OSError:
            tail = b""
        if b"\x1b[c" in tail or b"\x1b[?1;2c" in tail or b"\x1b[>7u" in tail:
            self.send(DA_REPLY)
            self.send(KITTY_REPLY)

    def kill(self) -> None:
        try:
            os.kill(self.pid, 9)
        except OSError:
            pass
        try:
            os.waitpid(self.pid, 0)
        except OSError:
            pass
        self.bytelog.close()


def read_sequences(sessions_dir):
    seq = []
    files = []
    for root, _dirs, names in os.walk(sessions_dir):
        files += [os.path.join(root, n) for n in sorted(names) if n.endswith(".jsonl")]
    files.sort()
    for path in files:
        for line in open(path):
            try:
                entry = json.loads(line)
            except Exception:
                continue
            msg = entry.get("message", entry)
            role = msg.get("role")
            if role not in ("user", "assistant"):
                continue
            text = "".join(
                c.get("text", "") for c in (msg.get("content") or []) if isinstance(c, dict) and c.get("type") == "text"
            )
            seq.append(
                {
                    "role": role,
                    "stopReason": msg.get("stopReason"),
                    "errorMessage": msg.get("errorMessage"),
                    "text": text,
                }
            )
    return seq


def run_arm(outdir, name, retry_policy):
    """One 24x80 pty session: real pi TUI + real council extension + faux
    provider failing once with the with-colon literal. Returns the verdict
    dict; countdown/second-response are read off the SCREEN, the chain off
    the session JSONL."""
    work_dir = os.path.join(outdir, name, "cwd")
    home = os.path.join(outdir, name, "home")
    sessions = os.path.join(outdir, name, "sessions")
    for d in (work_dir, home, sessions, os.path.join(home, ".pi", "agent")):
        os.makedirs(d, exist_ok=True)
    with open(os.path.join(home, ".pi", "agent", "settings.json"), "w") as f:
        f.write('{"defaultProjectTrust":"always"}')
    with open(os.path.join(work_dir, ".council.json"), "w") as f:
        json.dump({"retry": retry_policy}, f)

    argv = [
        os.environ["NODE_BIN"],
        os.environ["CLI_PATH"],
        "-e", os.environ["EXT_PATH"],
        "-e", os.environ["COUNCIL_EXT"],
        "--offline",
        "--provider", "ev40",
        "--model", "ev40/ev40-model",
        "--session-dir", sessions,
        "--no-builtin-tools",
    ]
    settle_log = os.path.join(outdir, name, "settle.log")
    env_extra = {
        "EV40_FAILS": "1",
        "EV40_ARM": "none",
        "EV40_PARTIAL": "0",
        "EV40_SETTLE_LOG": settle_log,
    }

    result = {
        "name": name,
        "countdown_rendered": False,
        "second_rendered": False,
        "chain_error_assistant": False,
        "chain_error_message": None,
        "chain_second_assistant": False,
        "chain_two_user_sends": False,
        "screen_final": "",
    }
    session = Session(argv, work_dir, home, env_extra, os.path.join(outdir, name, "bytes.log"))
    try:
        session.drain(6.0)
        session.respond_queries()
        session.drain(1.0)
        session.wait_stable()

        session.send(b"start")
        session.send(K_CR)

        # Treatment: the engine's countdown line must render while the backoff
        # ticks (the mechanism observable on the real TUI). Control: this must
        # NOT appear; give the errored turn time to land, then assert absence.
        if retry_policy.get("enabled"):
            result["countdown_rendered"] = session.wait_for("Retrying in", ceiling=20.0)
            result["countdown_rows"] = [line for line in session.screen.lines() if "Retrying in" in line]
            result["countdown_is_attempt2"] = any("(attempt 2 of 3)" in line for line in result["countdown_rows"])
            # The backoff re-send: the second assistant message renders.
            result["second_rendered"] = session.wait_for("EV40-SECOND-RESPONSE", ceiling=30.0)
        else:
            session.drain(10.0)
            session.wait_stable()
        session.drain(1.0)
        result["screen_final"] = session.screen.text()
    finally:
        session.kill()

    result["sequence"] = read_sequences(sessions)
    with open(os.path.join(outdir, name, "sequence.json"), "w") as f:
        json.dump(result["sequence"], f, indent=2)
    with open(os.path.join(outdir, name, "screen-final.txt"), "w") as f:
        f.write(result["screen_final"] + "\n")
    errored = [m for m in result["sequence"] if m["role"] == "assistant" and m["stopReason"] == "error"]
    seconds = [m for m in result["sequence"] if m["role"] == "assistant" and "EV40-SECOND-RESPONSE" in m["text"]]
    users = [m for m in result["sequence"] if m["role"] == "user"]
    result["chain_error_assistant"] = any(
        m["errorMessage"] == "Provider finish_reason: error" for m in errored
    )
    result["chain_error_message"] = errored[0]["errorMessage"] if errored else None
    result["chain_second_assistant"] = len(seconds) >= 1
    result["chain_two_user_sends"] = len(users) >= 2
    return result


def main() -> int:
    outdir = sys.argv[1] if len(sys.argv) > 1 else "ev41-tui-artifacts"
    os.makedirs(outdir, exist_ok=True)

    treatment = run_arm(outdir, "treatment", {
        "enabled": True, "maxAttempts": 3, "baseDelayMs": 4000, "maxDelayMs": 30000, "jitter": False,
    })
    control = run_arm(outdir, "control", {
        "enabled": False, "maxAttempts": 3, "baseDelayMs": 4000, "maxDelayMs": 30000, "jitter": False,
    })

    print("===== EV-41 TUI falsifier (24x80, real council extension, offline faux provider) =====")
    print(f"[treatment] countdown line rendered: {treatment['countdown_rendered']}")
    print(f"[treatment] countdown rows: {treatment.get('countdown_rows', [])}")
    print(f"[treatment] countdown names attempt 2 of 3: {treatment.get('countdown_is_attempt2')}")
    print(f"[treatment] EV40-SECOND-RESPONSE rendered: {treatment['second_rendered']}")
    print(f"[treatment] JSONL errored assistant carries the with-colon literal: {treatment['chain_error_assistant']}"
          f" (errorMessage={treatment['chain_error_message']!r})")
    print(f"[treatment] JSONL second assistant present: {treatment['chain_second_assistant']}")
    print(f"[treatment] JSONL >=2 user sends (original + retry resend): {treatment['chain_two_user_sends']}")
    print("[control] countdown line rendered (must be False): "
          f"{'Retrying in' in control['screen_final']}")
    print("[control] EV40-SECOND-RESPONSE rendered (must be False): "
          f"{'EV40-SECOND-RESPONSE' in control['screen_final']}")
    print(f"[control] JSONL errored assistant carries the with-colon literal: {control['chain_error_assistant']}")
    print(f"[control] JSONL second assistant absent (must be True): {not control['chain_second_assistant']}")
    print(f"[control] JSONL single user send (must be True): {not control['chain_two_user_sends']}")

    treatment_green = (
        treatment["countdown_rendered"]
        and treatment.get("countdown_is_attempt2")
        and treatment["second_rendered"]
        and treatment["chain_error_assistant"]
        and treatment["chain_second_assistant"]
        and treatment["chain_two_user_sends"]
    )
    control_green = (
        "Retrying in" not in control["screen_final"]
        and "EV40-SECOND-RESPONSE" not in control["screen_final"]
        and control["chain_error_assistant"]
        and not control["chain_second_assistant"]
        and not control["chain_two_user_sends"]
    )
    verdict = "GREEN" if (treatment_green and control_green) else "RED"
    print("===== VERDICT (TUI) =====")
    print(f"EV41-TUI-TREATMENT: {'GREEN' if treatment_green else 'RED'}")
    print(f"EV41-TUI-CONTROL (no mechanism => no continuation): {'GREEN' if control_green else 'RED'}")
    print(f"EV41-TUI-VERDICT: {verdict}")
    return 0 if verdict == "GREEN" else 1


if __name__ == "__main__":
    sys.exit(main())
