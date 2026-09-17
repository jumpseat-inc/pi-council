# Shared pty substrate for the faux-provider TUI runners (FLLWUP-49).
#
# Extracted from the scenario runners' duplicated screen/session models
# (provenance: the EV-40 and EV-43 falsifier TUI runners, see
# council/cards/EV-43.md). Stdlib ONLY. Exactly one `class Screen` and one
# `class Session` definition live here; the scenario runners in this directory
# import this module and hold only their scenario.
#
# Screen semantics: `H`/`f` absolute positioning, `A`/`B`/`C` relative, `D`
# RELATIVE-LEFT (the O2 drift fix — the copies had diverged; the
# absolute-column form belonged to `G` only), `K` erase, `J` clear.

import fcntl
import json
import os
import pty
import re
import select
import struct
import termios
import time

ROWS, COLS = 24, 80

DA_REPLY = b"\x1b[?1;2c"
KITTY_REPLY = b"\x1b[>1u"
K_CR = b"\r"

CSI_RE = re.compile(rb"\x1b\[([0-9;?]*)([ -/]*[A-Za-z])")
OSC_RE = re.compile(rb"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")


class Screen:
    """Minimal pty screen model (the faux-provider family's one definition)."""

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
            # Relative-left (the O2 fix): cursor-left-by-n, never an absolute column.
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
    """One pty session: a forked child on a 24x80 pty, byte-logged."""

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
    """Per-message sequence from every session JSONL under sessions_dir — the
    dict-entry form (role / stopReason / errorMessage / text), strictly richer
    than the retired string form."""
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
