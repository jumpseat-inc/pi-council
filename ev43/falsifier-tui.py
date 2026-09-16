#!/usr/bin/env python3
"""EV-43 reachability falsifier — TUI branch (pty, python3 stdlib ONLY).

Drives the real installed pi TUI in a pty (28x80, TERM=xterm-256color,
scratch HOME, scratch cwd) with the scripted fail-once faux provider (offline,
dummy credentials — `--offline`, provider `ev43`) and the EV-43 scratch
extension. Types `start`, waits for the first turn to fail with the intake's
failure class (`Provider finish_reason error`) and settle, then observes:

  - treatment arm (EV43_HANDLER=1): the agent_settled handler fires
    sendUserMessage("EV43-CONTINUE") fire-and-forget (the TUI branch of the
    extensions/index.ts:442 pattern). The reachability question: does a
    second assistant message (marker `EV43-SECOND-RESPONSE`) render?
  - control arm (EV43_HANDLER=0): identical provider behavior, no handler
    send. Asserts NO second assistant message under identical provider
    behavior — this control is what makes the yes/no answer mean what the
    card says.

The named TUI observable is the post-settle rendered delta: the falsifier
snaps frame A at the first paint of the provider error and frame B at the
first paint of the second assistant marker, and records the changed rows
verbatim (the card's acceptance calls this an input-bar text delta; whatever
actually renders is captured raw — see the artifacts). All raw bytes are
logged with timestamps (bytes.log) so any session restart or repaint
anomaly is evidenced.

Expects env: NODE_BIN, CLI_PATH, EXT_PATH. Args: artifact dir.
Exit 0 iff both arms completed and the verdict lines were printed; the
VERDICT lines state the per-branch answer either way.
"""

import fcntl
import os
import pty
import re
import select
import struct
import sys
import termios
import time

ROWS, COLS = 28, 80

DA_REPLY = b"\x1b[?1;2c"      # primary DA: VT100-with-advanced-video
KITTY_REPLY = b"\x1b[>1u"     # kitty capability reply: flag 1 only
K_CR = b"\r"

CSI_RE = re.compile(rb"\x1b\[([0-9;?]*)([ -/]*[A-Za-z])")
OSC_RE = re.compile(rb"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")


class Screen:
    """Minimal pty screen model: a ROWSxCOLS cell grid fed raw TUI bytes."""

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
                i += 1  # lone ESC (alt-screen toggle etc.) — ignore
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
            if args_s == "2" or args_s == "3":
                self.cells = [[" "] * self.cols for _ in range(self.rows)]
                self.r = self.c = 0

    def lines(self):
        return ["".join(row).rstrip() for row in self.cells]

    def text(self):
        return "\n".join(self.lines())


def contains(text, needle):
    return needle in text


def delta(before, after):
    """Named observable: changed rendered rows (row number -> old/new)."""
    out = []
    for i, (b, a) in enumerate(zip(before, after)):
        if b != a:
            out.append(f"row{i+1}: {b!r} -> {a!r}")
    return out


class Session:
    def __init__(self, argv, work_dir, home, outdir, arm, log_path, bytelog):
        self.master = None
        self.pid = None
        self.screen = Screen()
        self.outdir = outdir
        self.arm = arm
        self.bytelog = bytelog
        env = dict(os.environ)
        for k in ("COUNCIL_SEAT", "COUNCIL_JOB_ID", "COUNCIL_RUN_ID", "PI_SESSION_FILE"):
            env.pop(k, None)
        env["TERM"] = "xterm-256color"
        env["HOME"] = home
        env["EV43_HANDLER"] = "1" if arm == "treatment" else "0"
        env["EV43_BRANCH"] = "tui"
        env["EV43_LOG"] = log_path
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", ROWS, COLS, 0, 0))
        pid = os.fork()
        if pid == 0:  # child
            os.setsid()
            fcntl.ioctl(slave, termios.TIOCSCTTY, 0)
            os.dup2(slave, 0)
            os.dup2(slave, 1)
            os.dup2(slave, 2)
            os.chdir(work_dir)
            os.execve(argv[0], argv, env)
        os.close(slave)
        self.master = master
        self.pid = pid

    def send(self, data: bytes) -> None:
        os.write(self.master, data)

    def drain(self, seconds: float) -> None:
        end = time.time() + seconds
        while time.time() < end:
            r, _, _ = select.select([self.master], [], [], 0.05)
            if self.master in r:
                try:
                    d = os.read(self.master, 65536)
                except OSError:
                    return
                if not d:
                    return
                self.bytelog.write(f"@@ {time.strftime('%H:%M:%S')} +{len(d)}b\n".encode())
                self.bytelog.write(d)
                self.bytelog.flush()
                self.screen.feed(d)

    def poll(self, quiet=0.03) -> bool:
        """One short select+read; True if data arrived."""
        r, _, _ = select.select([self.master], [], [], quiet)
        if self.master in r:
            try:
                d = os.read(self.master, 65536)
            except OSError:
                return False
            if d:
                self.bytelog.write(f"@@ {time.strftime('%H:%M:%S')} +{len(d)}b\n".encode())
                self.bytelog.write(d)
                self.bytelog.flush()
                self.screen.feed(d)
                return True
        return False

    def wait_for(self, needle, ceiling=20.0):
        """Drain until `needle` renders or the ceiling elapses."""
        end = time.time() + ceiling
        while time.time() < end:
            self.poll()
            if contains(self.screen.text(), needle):
                return True
        return False

    def wait_stable(self, require=6, quiet=0.1, ceiling=10.0) -> bool:
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
                self.bytelog.write(f"@@ {time.strftime('%H:%M:%S')} +{len(d)}b\n".encode())
                self.bytelog.write(d)
                self.bytelog.flush()
                self.screen.feed(d)
                quiet_count = 0
            else:
                quiet_count += 1
        return quiet_count >= require

    def respond_queries(self) -> None:
        if b"\x1b[c" in self.bytelog_tail() or b"\x1b[?1;2c" in self.bytelog_tail() or b"\x1b[>7u" in self.bytelog_tail():
            self.send(DA_REPLY)
            self.send(KITTY_REPLY)

    def bytelog_tail(self) -> bytes:
        try:
            with open(self.bytelog_path, "rb") as f:
                f.seek(max(0, os.path.getsize(self.bytelog_path) - 8192))
                return f.read()
        except OSError:
            return b""

    def kill(self) -> None:
        try:
            os.kill(self.pid, 15)
        except OSError:
            pass
        try:
            os.waitpid(self.pid, 0)
        except OSError:
            pass


def save_frame(outdir, name, screen):
    frames = os.path.join(outdir, "frames")
    os.makedirs(frames, exist_ok=True)
    with open(os.path.join(frames, name + ".txt"), "w") as f:
        f.write(screen.text() + "\n")


def read_settle_log(path):
    try:
        with open(path) as f:
            return f.read()
    except OSError:
        return "(no settle log)"


def read_sequences(sessions_dir):
    """User/assistant message sequence from the persisted session JSONL files."""
    import json
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
            if entry.get("type") == "session":
                seq.append(f"SESSION {os.path.basename(path)}")
                continue
            msg = entry.get("message", entry)
            role = msg.get("role")
            if role not in ("user", "assistant"):
                continue
            text = "".join(
                c.get("text", "") for c in (msg.get("content") or []) if isinstance(c, dict) and c.get("type") == "text"
            )
            if role == "assistant":
                seq.append(
                    f"assistant stopReason={msg.get('stopReason')} error={msg.get('errorMessage')!r} text={text!r}"
                )
            else:
                seq.append(f"user {text!r}")
    return seq


def run_arm(outdir, arm, scratch_root):
    work_dir = os.path.join(scratch_root, f"{arm}-cwd")
    home = os.path.join(scratch_root, f"{arm}-home")
    sessions = os.path.join(scratch_root, f"{arm}-sessions")
    for d in (work_dir, home, sessions, os.path.join(home, ".pi", "agent")):
        os.makedirs(d, exist_ok=True)
    with open(os.path.join(home, ".pi", "agent", "settings.json"), "w") as f:
        f.write('{"defaultProjectTrust":"always"}')
    log_path = os.path.join(scratch_root, f"{arm}-settle.log")
    bytelog_path = os.path.join(outdir, f"{arm}-bytes.log")

    argv = [
        os.environ["NODE_BIN"],
        os.environ["CLI_PATH"],
        "-e", os.environ["EXT_PATH"],
        "--offline",
        "--provider", "ev43",
        "--model", "ev43/ev43-model",
        "--session-dir", sessions,
        "--no-builtin-tools",
    ]
    result = {"arm": arm, "notes": [], "delta": [], "second_rendered": False, "continue_rendered": False,
              "error_rendered": False}
    bytelog = open(bytelog_path, "wb")
    session = Session(argv, work_dir, home, outdir, arm, log_path, bytelog)
    session.bytelog_path = bytelog_path
    try:
        session.drain(5.0)
        session.respond_queries()
        session.drain(1.0)
        session.wait_stable()

        # Submit the turn.
        session.send(b"start")
        session.send(K_CR)

        # Frame A: first paint of the provider error (snapped immediately —
        # no stability wait — the continuation may paint in the same burst).
        ok = session.wait_for("first-turn-fails")
        if not ok:
            result["notes"].append("first-turn-fails marker never rendered")
        frame_a = session.screen.lines()
        save_frame(outdir, f"{arm}-A-error", session.screen)

        # Frame B: first paint of the second assistant marker (treatment) or
        # the settle window elapsing (control).
        ceiling = 10.0
        end = time.time() + ceiling
        while time.time() < end:
            session.poll(0.03)
            if contains(session.screen.text(), "EV43-SECOND-RESPONSE"):
                break
        frame_b = session.screen.lines()
        save_frame(outdir, f"{arm}-B-post-settle", session.screen)
        result["delta"] = delta(frame_a, frame_b)
        result["second_rendered"] = contains(session.screen.text(), "EV43-SECOND-RESPONSE")
        result["continue_rendered"] = contains(session.screen.text(), "EV43-CONTINUE")
        result["error_rendered"] = contains(session.screen.text(), "first-turn-fails")

        # Post-settle window: confirm nothing further appears / record rest state.
        session.drain(4.0)
        session.wait_stable()
        save_frame(outdir, f"{arm}-C-rest", session.screen)
        result["second_after_rest"] = contains(session.screen.text(), "EV43-SECOND-RESPONSE")
    finally:
        session.kill()
        bytelog.close()

    result["settle_log"] = read_settle_log(log_path)
    result["sequence"] = read_sequences(sessions)
    return result


def main() -> int:
    outdir = sys.argv[1] if len(sys.argv) > 1 else "ev43-tui-artifacts"
    os.makedirs(outdir, exist_ok=True)
    scratch_root = os.path.join(outdir, "scratch")
    os.makedirs(scratch_root, exist_ok=True)

    treatment = run_arm(outdir, "treatment", scratch_root)
    control = run_arm(outdir, "control", scratch_root)

    for arm in (treatment, control):
        print(f"===== ARM {arm['arm'].upper()} =====")
        print(f"error rendered: {arm.get('error_rendered')}")
        print(f"EV43-CONTINUE rendered: {arm.get('continue_rendered')}")
        print(f"EV43-SECOND-RESPONSE rendered: {arm.get('second_rendered')} (after rest: {arm.get('second_after_rest')})")
        print("--- rendered delta frame A (error painted) -> frame B (post-settle) ---")
        for line in arm.get("delta", []):
            print(f"  {line}")
        if not arm.get("delta"):
            print("  (no rendered row changed between the error paint and the post-settle frame)")
        print("--- settle log ---")
        print(arm.get("settle_log", "").rstrip())
        print("--- session JSONL sequence ---")
        for s in arm.get("sequence", []):
            print(f"  {s}")
        for n in arm.get("notes", []):
            print(f"NOTE: {n}")
        print()

    treat_second = treatment.get("second_after_rest")
    control_second = control.get("second_after_rest")
    print("===== VERDICT (TUI) =====")
    print(
        f"EV43-TUI: second assistant message {'PRESENT' if treat_second else 'ABSENT'} in treatment; "
        f"{'PRESENT' if control_second else 'ABSENT'} in control; "
        f"attributable-to-handler={bool(treat_second and not control_second)}"
    )
    print(f"treatment A->B delta: {treatment.get('delta')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
