#!/usr/bin/env python3
"""EV-40 TUI named-gate runner (pty, python3 stdlib ONLY).

Based on ev43/falsifier-tui.py. Drives the REAL installed pi TUI (24x80,
TERM=xterm-256color, scratch HOME, scratch cwd, `--offline`, faux provider
`ev40` whose first call is a real council_dispatch tool call and whose second
fails, triggering the retry) with the REAL council extension
(`extensions/index.ts`) and a scratch `.council.json` retry policy
(`maxAttempts=3, baseDelayMs=6000, jitter=false`). It closes:

  - the TUI counterpart to P1: the TUI branch arms a timer and RETURNS from
    the `agent_settled` handler; the timer sends the continuation. Assert the
    nested run actually starts and a second assistant message renders
    (`EV40-SECOND-RESPONSE`).
  - Designer P6: at 24x80, the first provider call dispatches a real
    `council_dispatch` job through the council's own Hub (a hanging `pi` stub
    first on PATH keeps it active) and `EV40_OPEN_TREE=1` opens the REAL inline
    tree widget via the navigator's `/council-tree` command. The R5 countdown
    line, the `council` active-jobs widget and the tree widget must all be
    present on DISTINCT screen rows at the same instant — no occlusion.

Expects env: NODE_BIN, CLI_PATH, EXT_PATH (harness ext), COUNCIL_EXT.
Args: artifact dir. Exit 0 iff the verdict lines printed; the VERDICT lines
state the per-gate answer either way.
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
    """Minimal pty screen model (the ev43 falsifier's)."""

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
            self.c = max(0, self.c - (int(args_s) if args_s else 1))
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


def sweep_stub_pids(work_dir):
    """Kill the detached stub hub children by pid (their pi parent is SIGKILLed
    by Session.kill, so session_shutdown cleanup never runs)."""
    pid_file = os.path.join(work_dir, ".pi", "council", ".pids.json")
    try:
        with open(pid_file) as f:
            pids = json.load(f)
    except (OSError, ValueError):
        return
    for pid in pids:
        for killer in (lambda p: os.killpg(p, 9), lambda p: os.kill(p, 9)):
            try:
                killer(pid)
            except OSError:
                pass
    try:
        os.remove(pid_file)
    except OSError:
        pass


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
            seq.append(f"{role} stopReason={msg.get('stopReason')} text={text!r}")
    return seq


def main() -> int:
    outdir = sys.argv[1] if len(sys.argv) > 1 else "ev40-tui-artifacts"
    os.makedirs(outdir, exist_ok=True)
    work_dir = os.path.join(outdir, "cwd")
    home = os.path.join(outdir, "home")
    sessions = os.path.join(outdir, "sessions")
    for d in (work_dir, home, sessions, os.path.join(home, ".pi", "agent")):
        os.makedirs(d, exist_ok=True)
    with open(os.path.join(home, ".pi", "agent", "settings.json"), "w") as f:
        f.write('{"defaultProjectTrust":"always"}')
    with open(os.path.join(work_dir, ".council.json"), "w") as f:
        json.dump(
            {"retry": {"enabled": True, "maxAttempts": 3, "baseDelayMs": 6000, "maxDelayMs": 30000, "jitter": False}},
            f,
        )

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
    # Designer P6: the real council_dispatch tool spawns `command: "pi"`. Put a
    # hanging `pi` stub first on PATH so the hub job stays active (STUB_MODE=hang
    # equivalent) while the countdown ticks — a real hub job, not a fake row.
    bin_dir = os.path.join(outdir, "bin")
    os.makedirs(bin_dir, exist_ok=True)
    pi_stub = os.path.join(bin_dir, "pi")
    with open(pi_stub, "w") as f:
        f.write("#!/bin/sh\n# EV40 P6 hanging pi stub: the dispatched hub job stays active.\nsleep 3600\n")
    os.chmod(pi_stub, 0o755)
    env_extra = {
        "EV40_FAILS": "1",
        "EV40_ARM": "none",
        "EV40_PARTIAL": "0",
        "EV40_TOOLCALL_DISPATCH": "1",
        "EV40_OPEN_TREE": "1",
        "PATH": bin_dir + ":" + os.environ.get("PATH", "/usr/bin:/bin"),
    }
    settle_log = os.path.join(outdir, "settle.log")
    env_extra["EV40_SETTLE_LOG"] = settle_log

    result = {
        "countdown_rendered": False,
        "second_rendered": False,
        "rows": ROWS,
        "council_widget_rows": [],
        "tree_widget_present": False,
        "tree_widget_rows": [],
        "stub_a_in_council": False,
        "stub_b_in_council": False,
        "stub_a_in_tree": False,
        "stub_b_in_tree": False,
        "distinct_rows": False,
        "notes": [],
    }
    session = Session(argv, work_dir, home, env_extra, os.path.join(outdir, "bytes.log"))
    try:
        session.drain(6.0)
        session.respond_queries()
        session.drain(1.0)
        session.wait_stable()

        # Designer P6 precondition: the live tree widget must be open (the harness
        # dispatched /council-tree at session_start). Wait for its footer copy.
        result["tree_widget_present"] = session.wait_for("up/down move", ceiling=15.0)

        session.send(b"start")
        session.send(K_CR)

        # The countdown line must render while the backoff ticks (24 rows).
        result["countdown_rendered"] = session.wait_for("Retrying in", ceiling=20.0)
        # P6: the hub job lands via the real council_dispatch tool; the `council`
        # widget repaints on turn_end / hub onChange and the tree widget repaints on
        # its 2 s timer. Wait (inside the 6 s backoff window) until all three
        # surfaces are simultaneously on screen, then capture that instant.
        deadline = time.time() + 8.0
        while time.time() < deadline:
            session.poll(0.1)
            snap = session.screen.lines()
            if any("Retrying in" in l for l in snap) and any("\u23f3" in l for l in snap) and any(
                "\u25cf" in l for l in snap
            ):
                break
        result["countdown_rows"] = [l for l in session.screen.lines() if "Retrying in" in l]
        result["countdown_is_r5_copy"] = any("(attempt 2 of 3)" in l and "Esc to abort" in l for l in result["countdown_rows"])
        # P6: the `council` active-jobs widget (index.ts renderWidget) renders one
        # "⏳ <seat> ..." row per active job; the tree widget (navigator.ts) renders
        # "● <seat> ..." rows plus its "up/down move · enter view" footer.
        screen = session.screen.lines()
        result["council_widget_rows"] = [l for l in screen if "\u23f3" in l]
        result["tree_widget_rows"] = [l for l in screen if "\u25cf" in l]
        result["tree_widget_present"] = result["tree_widget_present"] and any(
            "up/down move" in l or "\u25cf" in l for l in screen
        )
        result["stub_a_in_council"] = any("skeptic" in l for l in result["council_widget_rows"])
        result["stub_b_in_council"] = len(result["council_widget_rows"]) >= 1
        result["stub_a_in_tree"] = any("skeptic" in l for l in result["tree_widget_rows"])
        result["stub_b_in_tree"] = len(result["tree_widget_rows"]) >= 1
        # No occlusion: the countdown line, the first council-widget row and the
        # tree-widget row must occupy distinct screen rows at this instant.
        cd_idx = [i for i, l in enumerate(screen) if "Retrying in" in l]
        wk_idx = [i for i, l in enumerate(screen) if "\u23f3" in l]
        tree_idx = [i for i, l in enumerate(screen) if "up/down move" in l or "\u25cf" in l]
        result["distinct_rows"] = (
            bool(cd_idx) and bool(wk_idx) and bool(tree_idx)
            and not (set(cd_idx) & set(wk_idx))
            and not (set(cd_idx) & set(tree_idx))
            and not (set(wk_idx) & set(tree_idx))
        )
        # No single row carries both countdown copy and widget rows (overwrite).
        result["no_overwrite"] = not any(("Retrying in" in l) and ("\u23f3" in l) for l in screen)
        result["within_rows"] = len(screen) <= ROWS
        with open(os.path.join(outdir, "frame-countdown.txt"), "w") as f:
            f.write(session.screen.text() + "\n")

        # The timer-deferred TUI send: the nested run starts and a second
        # assistant message renders.
        result["second_rendered"] = session.wait_for("EV40-SECOND-RESPONSE", ceiling=25.0)
        with open(os.path.join(outdir, "frame-post-continuation.txt"), "w") as f:
            f.write(session.screen.text() + "\n")
        session.drain(2.0)
    finally:
        session.kill()
        sweep_stub_pids(work_dir)

    result["sequence"] = read_sequences(sessions)
    result["settle_log"] = open(settle_log).read() if os.path.exists(settle_log) else "(no settle log)"

    print("===== EV-40 TUI (24 rows) =====")
    print(f"countdown line rendered: {result['countdown_rendered']}")
    print(f"countdown rows: {result['countdown_rows']}")
    print(f"countdown is the exact R5 copy (attempt 2 of 3 / Esc to abort): {result['countdown_is_r5_copy']}")
    print(f"council widget rows ({len(result['council_widget_rows'])}): {result['council_widget_rows']}")
    print(f"tree widget rows ({len(result['tree_widget_rows'])}): {result['tree_widget_rows']}")
    print(f"tree widget footer present: {result['tree_widget_present']}")
    print(f"skeptic in council widget: {result['stub_a_in_council']}; tree rows>0: {result['stub_b_in_tree']}")
    print(f"skeptic in tree widget: {result['stub_a_in_tree']}; council rows>0: {result['stub_b_in_council']}")
    print(f"countdown/council/tree on distinct rows: {result['distinct_rows']}; no overwrite: {result.get('no_overwrite')}; within {ROWS} rows: {result['within_rows']}")
    print(f"EV40-SECOND-RESPONSE rendered: {result['second_rendered']}")
    print("--- session JSONL sequence ---")
    for s in result["sequence"]:
        print(f"  {s}")
    print("--- settle log ---")
    print(result["settle_log"].rstrip())
    print("===== VERDICT (TUI) =====")
    print(f"EV40-TUI-P1-COUNTERPART: timer-deferred continuation {'STARTS (second assistant message rendered)' if result['second_rendered'] else 'DID NOT start'}")
    p6 = (
        result["countdown_rendered"]
        and result["countdown_is_r5_copy"]
        and bool(result["council_widget_rows"])
        and result["tree_widget_present"]
        and result["stub_a_in_council"] and result["stub_b_in_council"]
        and result["stub_a_in_tree"] and result["stub_b_in_tree"]
        and result["distinct_rows"] and result.get("no_overwrite") and result["within_rows"]
    )
    print(
        f"EV40-TUI-P6: at {ROWS} rows countdown={'visible' if result['countdown_rendered'] else 'MISSING'}"
        f" council-widget={'present' if result['council_widget_rows'] else 'MISSING'}"
        f" tree-widget={'present' if result['tree_widget_present'] else 'MISSING'}"
        f" distinct-rows={result['distinct_rows']} no-overwrite={result.get('no_overwrite')}"
        f" within-{ROWS}-rows={result['within_rows']} => {'GREEN' if p6 else 'NOT GREEN'}"
    )
    # Exit 0 iff the P6 verdict is green (and the P1 counterpart rendered).
    return 0 if (p6 and result["second_rendered"]) else 1


if __name__ == "__main__":
    sys.exit(main())