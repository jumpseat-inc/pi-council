#!/usr/bin/env python3
"""FLLWUP-14 kitty-protocol search-smoke driver (spec docs/superpowers/specs/2026-09-05-FLLWUP-14-design.md).

Runs the pinned pi 0.84.3 TUI in a pty (80x28, TERM=xterm-256color, scratch HOME),
answers terminal queries deterministically, drives the model search input with
bare CSI-u kitty-protocol sequences, and asserts nine falsifier frames against
the ruled copy set byte-exact: (1) seat level, (2) model level pre-press,
(3) search opens, (4) the `é` anti-legacy-fallback falsifier, (5) cla,
(6) backspace -> cl, (7) zz no-match, (8) Esc-Esc clear-and-stay,
(9) Down+Esc -> provider level.

python3 stdlib ONLY (pty, fcntl, termios, select, struct, re) — no pi/extension
module is imported (testable claim 4). The screen model and the byte table are
authored here.

Expects env: PI_BIN, WORK_DIR, HOME, OPENROUTER_API_KEY, TERM. Args: artifact dir.
Exit 0 iff all frames green; 1 on any red (per-line diffs + artifacts kept).
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

# ---- ruled copy set — byte-exact, source-verified against extensions/model-picker.ts ----
HEADER = "council models \u2014 pick a model per seat"
SEARCH_HINT = "/ filter \u00b7 esc clears"
SEARCH_ROW_EMPTY = "\u258c " + SEARCH_HINT  # U+258C at column 0, then the hint
PRE_SEARCH_HINT = "press / to filter models"
NO_MATCH_HINT = "\u2193 then esc exits search"  # U+2193
FOOTER_SEAT_PROVIDER = "\u2191/\u2193 move \u00b7 enter open \u00b7 esc back"
FOOTER_MODEL = "\u2191/\u2193 move \u00b7 enter select \u00b7 esc back"
EMPTY_NO_PROVIDERS = "No providers configured \u2014 authenticate a provider in pi, then reopen /council-models."
NO_MATCH = lambda q: f'No models matching "{q}".'

# Thinking levels the picker cross-product appends as a `:level` suffix
# (source: catalogue.ts via getSupportedThinkingLevels; seen in the 0.84.3
# live catalogue). Only the FINAL segment is stripped — `:batch`-style id
# segments are preserved, mirroring filterModelRows' suffix-safe contract.
LEVELS = ("off", "minimal", "low", "medium", "high", "xhigh", "max")

# ---- keystroke byte table (kitty flag-1 CSI-u, bare form; spec §4.2) ----
K_SLASH = b"\x1b[47u"
K_C, K_L, K_A, K_Z = b"\x1b[99u", b"\x1b[108u", b"\x1b[97u", b"\x1b[122u"
K_EACUTE = b"\x1b[233u"  # é — U+00E9, unreachable by the legacy bare-byte arm
K_BS = b"\x1b[127u"
K_ESC = b"\x1b[27u"
K_CR = b"\r"
K_DOWN = b"\x1b[B"  # legacy CSI — flag-1 kitty scope keeps special keys legacy
K_UP = b"\x1b[A"

DA_REPLY = b"\x1b[?1;2c"      # primary DA: VT100-with-advanced-video
KITTY_REPLY = b"\x1b[>1u"     # kitty capability reply: flag 1 (CSI-u printables) only

CSI_RE = re.compile(rb"\x1b\[([0-9;?]*)([ -/]*[A-Za-z])")
OSC_RE = re.compile(rb"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")


class Screen:
    """~150-line pty screen model: a 28x80 cell grid fed raw TUI bytes.

    Handles cursor addressing (CUP/CHA/Up/Down/Left/Right), erase-in-line,
    UTF-8 multi-byte writes, CR/LF, OSC hyperlink runs, and SGR (ignored —
    the assertion is on the stripped text). Width-80 truncation is the
    terminal's, not ours: long rows already arrive truncated.
    """

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
                i += 1  # lone ESC (e.g. alt-screen toggle) — ignore
                continue
            if b == 0x0D:  # CR — column 0
                self.c = 0
                i += 1
                continue
            if b == 0x0A:  # LF
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
        if final in "Hf":  # CUP/CHA position
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
        elif final == "K":  # erase in line: 0=EOL 1=BOL 2=all
            mode = int(args_s) if args_s else 0
            if mode == 0:
                for x in range(self.c, self.cols):
                    self.cells[self.r][x] = " "
            elif mode == 1:
                for x in range(0, self.c + 1):
                    self.cells[self.r][x] = " "
            else:
                self.cells[self.r] = [" "] * self.cols
        elif final == "J":  # erase in display — coarse full clear
            if args_s == "2" or args_s == "3":
                self.cells = [[" "] * self.cols for _ in range(self.rows)]
                self.r = self.c = 0
        # m (SGR), s/u (dec save/restore), ?-prefixed private modes: ignored

    def lines(self):
        return ["".join(row).rstrip() for row in self.cells]


# Belt-and-suspenders: a mid-stream partial row paint can leave an SGR remnant
# (`[39m`) in a cell row when the terminal writes a row spanning two drain
# chunks. Real modal text never starts a bracket with a digit (`[Themes]` has a
# letter), so this anchor only removes escape remnants.
RESIDUAL_SGR = re.compile(r"\[\d+(?::\d+)*m?")


def sanitize(line: str) -> str:
    return RESIDUAL_SGR.sub("", line)


def dechrome(line: str) -> str:
    """Strip the modal frame chrome: the `│ ` border prefix (possibly preceded
    by the panelLeft offset) and the trailing ` │`, plus padding."""
    s = line
    if s.endswith(" \u2502"):
        s = s[:-2]
    s = s.lstrip()
    if s.startswith("\u2502 "):
        s = s[2:]
    return s.rstrip()


BORDER_CHARS = set("\u250c\u2500\u2510\u2514\u2518\u2502")


def is_border_or_blank(line: str) -> bool:
    return all(ch in BORDER_CHARS or ch.isspace() for ch in line)


def content_lines(screen) -> list:
    return [dechrome(sanitize_line(l)) for l in screen.lines() if not is_border_or_blank(l)]


def sanitize_line(line: str) -> str:
    return RESIDUAL_SGR.sub("", line)


def id_minus_level(row: str) -> str:
    """Render row -> matchable qualifiedId: strip leading marker + one trailing
    :level. The marker column can be repainted partially (`> `, `  `, or a bare
    id under incremental paints), so parsing is leading-space tolerant."""
    s = row.lstrip()
    for lvl in LEVELS:
        suffix = ":" + lvl
        if s.endswith(suffix):
            return s[: -len(suffix)]
    return s


def model_rows(content: list) -> list:
    """Content lines that look like model rows, normalized to markerless id
    rows (e.g. `openrouter/aion-labs/aion-2.0:minimal`). The marker column can
    be repainted partially, so parsing is tolerant of missing marker cells."""
    out = []
    for ln in content:
        t = ln[2:] if ln.startswith(("> ", "  ")) else ln
        t = t.lstrip()
        if t.startswith("openrouter/"):
            out.append(t)
    return out


def strip_sgr(raw: bytes) -> str:
    s = OSC_RE.sub(b"", raw)
    s = CSI_RE.sub(b"", s)
    return s.decode("utf-8", "replace")


def extract_ids_from_bytes(raw: bytes) -> list:
    """Unique rendered rows (id:level strings) seen in ANY repaint row-write.

    The TUI repaints per row as `CSI pos CR ESC[2K <styled row> CR CR LF`;
    every row that ever became visible during a walk passes through the stream,
    so the deduped union of these row writes is the full rendered catalogue —
    the driver-independent universe for the structural filter assertions.
    Row strings (e.g. `openrouter/anthropic/claude-fable-5:low`) preserve the
    cross-product level dim, matching the modal's own row set exactly.
    """
    seen = []
    known = set()
    for chunk in raw.split(b"\x1b[2K"):
        row_bytes = chunk.split(b"\r")[0]
        row = dechrome(strip_sgr(row_bytes).rstrip()).lstrip()
        if not row.startswith("openrouter/"):
            continue
        if row not in known:
            known.add(row)
            seen.append(row)
    return seen


class Failed(Exception):
    pass


class Framelog:
    def __init__(self, outdir):
        self.outdir = outdir
        self.parts = []
        os.makedirs(os.path.join(outdir, "frames"), exist_ok=True)

    def save(self, name, raw, screen=None):
        with open(os.path.join(self.outdir, "frames", name + ".raw"), "wb") as f:
            f.write(raw)
        if screen is not None:
            with open(os.path.join(self.outdir, "frames", name + ".txt"), "w") as f:
                f.write("\n".join(screen.lines()) + "\n")


class Session:
    def __init__(self, pi_bin, work_dir, home, outdir):
        self.master = None
        self.pid = None
        self.buf = b""  # bytes since last mark (anything under-out)
        self.screen = Screen()  # persistent screen state — repaints are incremental
        self.outdir = outdir
        env = dict(os.environ)
        for k in ("COUNCIL_SEAT", "COUNCIL_JOB_ID", "COUNCIL_RUN_ID", "PI_SESSION_FILE"):
            env.pop(k, None)
        env["TERM"] = "xterm-256color"
        env["HOME"] = home
        env["OPENROUTER_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "sk-dummy")
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
            os.execve(pi_bin, [pi_bin], env)
        os.close(slave)
        self.master = master
        self.pid = pid

    def send(self, data: bytes) -> None:
        os.write(self.master, data)

    def _ingest(self, d: bytes) -> None:
        self.buf += d
        self.screen.feed(d)

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
                self._ingest(d)

    def wait_stable(self, require=3, quiet=0.08, ceiling=8.0) -> bool:
        """Drain until `require` consecutive quiet polls; timeout-ceiled."""
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
                self._ingest(d)
                quiet_count = 0
            else:
                quiet_count += 1
        return quiet_count >= require

    def respond_queries(self) -> None:
        """Answer deterministic terminal queries (DA + kitty capability)."""
        if b"\x1b[c" in self.buf or b"\x1b[?1;2c" in self.buf or b"\x1b[>7u" in self.buf:
            self.send(DA_REPLY)
            self.send(KITTY_REPLY)

    def mark(self) -> bytes:
        b = self.buf
        self.buf = b""
        return b

    def snap(self):
        return content_lines(self.screen)

    def kill(self) -> None:
        try:
            os.kill(self.pid, 15)
        except OSError:
            pass
        try:
            os.waitpid(self.pid, 0)
        except OSError:
            pass


def assert_true(cond, msg, flog, name, raw, screen):
    if not cond:
        flog.save(name, raw, screen)
        raise Failed(msg)


def footer_is(content, literal):
    return len(content) > 0 and content[-1] == literal


def assert_frame(flog, session, name, matcher):
    """Wait for quiescence, snapshot the checkpoint bytes (artifacts), assert
    against the PERSISTENT screen state (repaints are incremental — rows the
    TUI does not re-send stay from earlier paints). On red keep the raw +
    stripped frame and raise."""
    ok = session.wait_stable()
    raw = session.mark()
    flog.save(name, raw, session.screen)
    content = session.snap()
    errors = [] if ok else ["TUI did not reach quiescence in the ceiling"]
    errors += collect(matcher(content))
    if errors:
        detail = "\n".join(f"  expected: {e}" for e in errors)
        raise Failed(f"frame {name} red:\n{detail}\n--- actual content lines ---\n" + "\n".join("  | " + l for l in content))


def expect(cond, msg):
    return None if cond else msg


def collect(errors):
    """Drop the None entries `expect` emits on success."""
    return [e for e in errors if e is not None]


def line_under_header(content):
    """Spec §4.3 'line 1' — the body row directly below the modal header."""
    for i, ln in enumerate(content):
        if ln == HEADER or ln.startswith(HEADER):
            return content[i + 1] if i + 1 < len(content) else None
    return None


def main() -> int:
    outdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.getcwd(), "search-smoke-artifacts")
    os.makedirs(outdir, exist_ok=True)
    pi_bin = os.environ["PI_BIN"]
    work_dir = os.environ["WORK_DIR"]
    home = os.environ["HOME"]
    flog = Framelog(outdir)
    session = Session(pi_bin, work_dir, home, outdir)
    boot_log = open(os.path.join(outdir, "frames", "00-boot.raw"), "wb")
    try:
        # ---- boot: pi emits its kitty negotiation query; answer it ----
        session.drain(5.0)
        boot_raw = bytes(session.buf)
        boot_log.write(boot_raw)
        boot_log.close()
        if b"\x1b[>7u" not in boot_raw:
            raise Failed("boot stream lacks pi's own emitted kitty query \\x1b[>7u (negotiation assertion, objection-7 scope)")
        session.respond_queries()
        session.drain(1.0)
        if not session.wait_stable():
            raise Failed("TUI did not settle after the query replies")
        session.mark()  # drop the boot bytes from the checkpoint stream

        # ---- F1: seat level ----
        session.send(b"/council-models" + K_CR)
        assert_frame(flog, session, "01-seat-level", seat_level_matcher)

        # ---- F2: model level (Enter Enter); pre-press hint + footer ----
        session.send(K_CR)
        session.send(K_CR)
        assert_frame(flog, session, "02-model-level", model_level_matcher)

        # ---- pre-press universe walk (spec §4.3 structural rule, live-render clause) ----
        universe = walk_universe(session, flog)
        with open(os.path.join(outdir, "universe.txt"), "w") as f:
            f.write("\n".join(universe) + "\n")
        if len(universe) < 20:
            raise Failed(f"pre-press walk captured only {len(universe)} catalogue rows — walk failure, not a product finding")
        # reset to index 0: Esc ascends, Enter re-enters the model level
        session.send(K_ESC)
        session.send(K_CR)
        if not session.wait_stable():
            raise Failed("TUI did not settle after the walk reset")

        # ---- F3: search opens ----
        session.send(K_SLASH)
        frame3_ok = session.wait_stable()
        raw3 = session.mark()
        flog.save("03-search-open", raw3, session.screen)
        content3 = session.snap()
        line1 = line_under_header(content3)
        errors = [] if frame3_ok else ["no quiescence"]
        errors += collect([
            expect(line1 == SEARCH_ROW_EMPTY, f"line 1 == {SEARCH_ROW_EMPTY!r}, got {line1!r}"),
            expect(not any(PRE_SEARCH_HINT in l for l in content3), f"{PRE_SEARCH_HINT!r} still present after /"),
            expect(last_is_model_row(content3), "search frame did not stay at the model level (ascended?)"),
            expect(footers_absent(content3), "FOOTER_MODEL rendered (below the panel clip at this size)"),
        ])
        if errors:
            raise Failed("frame 03 search-open red:\n" + "\n".join(errors) + "\n--- actual ---\n" + "\n".join("  | " + l for l in content3))
        W = len(model_rows(content3))  # FLLWUP-15 search window (maxRows-1)
        if W < 1:
            raise Failed("frame 03: search window empty — registry empty (No providers configured?)")

        # ---- F4: the é anti-legacy-fallback falsifier ----
        session.send(K_EACUTE)
        assert_frame(flog, session, "04-e-acute", lambda c: no_match_matcher(c, "\u00e9"))
        # backspace deletes é -> back to the empty hint row
        session.send(K_BS)
        assert_frame(flog, session, "05-e-acute-cleared", lambda c: [
            expect(line_under_header(c) == SEARCH_ROW_EMPTY, "line 1 != SEARCH_ROW_EMPTY after backspace"),
            expect(last_is_model_row(c), "frame did not stay at the model level"),
            expect(footers_absent(c), "FOOTER_MODEL rendered (below the panel clip at this size)"),
        ])

        # ---- F5: cla ----
        session.send(K_C + K_L + K_A)
        assert_frame(flog, session, "06-cla", lambda c: filtered_matcher(c, "cla", universe, W))

        # ---- F6: backspace -> cl ----
        session.send(K_BS)
        assert_frame(flog, session, "07-cl", lambda c: filtered_matcher(c, "cl", universe, W))

        # ---- clear (intermediate, spec flow: the no-match query alone) ----
        session.send(K_ESC)
        assert_frame(flog, session, "08-cleared", lambda c: [
            expect(line_under_header(c) == SEARCH_ROW_EMPTY, "line 1 != SEARCH_ROW_EMPTY after Esc-clear"),
            expect(last_is_model_row(c), "frame did not stay at the model level"),
            expect(footers_absent(c), "FOOTER_MODEL rendered (below the panel clip at this size)"),
        ])

        # ---- F7: zz no-match ----
        session.send(K_Z + K_Z)
        assert_frame(flog, session, "09-zz-no-match", lambda c: no_match_matcher(c, "zz"))

        # ---- F8: Esc Esc — clear-and-stay ----
        session.send(K_ESC)
        session.send(K_ESC)
        assert_frame(flog, session, "10-esc-esc", lambda c: [
            expect(line_under_header(c) == SEARCH_ROW_EMPTY, "line 1 != SEARCH_ROW_EMPTY after Esc Esc (clear-and-stay)"),
            expect(any((l == HEADER or l.startswith(HEADER)) for l in c), "header missing after Esc Esc"),
            expect(last_is_model_row(c), "a second Esc ascended (must stay at the model level)"),
            expect(footers_absent(c), "FOOTER_MODEL rendered (below the panel clip at this size)"),
        ])

        # ---- F9: Down then Esc -> provider level ----
        session.send(K_DOWN)
        session.drain(0.3)
        session.send(K_ESC)
        assert_frame(flog, session, "11-provider-level", provider_matcher)

        session.kill()
    except Failed as e:
        session.kill()
        print(str(e), file=sys.stderr)
        diff_path = os.path.join(outdir, "diff.txt")
        with open(diff_path, "w") as f:
            f.write(str(e) + "\n")
        print(f"SMOKE FAIL — search-smoke frames red (artifacts: {outdir})", file=sys.stderr)
        return 1
    except Exception as e:  # unexpected — still a red, keep artifacts
        session.kill()
        print(f"SMOKE FAIL — driver error: {e!r}", file=sys.stderr)
        return 1

    print("search-smoke: 9 frames green (seat, model, search, é falsifier, cla, cl, zz no-match, esc-esc, provider)")
    return 0


def last_is_model_row(content) -> bool:
    return len(content) > 0 and content[-1].lstrip().startswith("openrouter/")


def footers_absent(content, literal=FOOTER_MODEL) -> bool:
    return not any(literal in l for l in content)


def seat_level_matcher(content):
    errors = []
    errors += [expect(any((l == HEADER or l.startswith(HEADER)) for l in content), f"header {HEADER!r} missing")]
    seats = [l for l in content if l.lstrip().startswith(("> ", "  ")) and " \u2014 using " in l]
    errors += [expect(len(seats) >= 1, "no seat rows rendered")]
    errors += [expect(footer_is(content, FOOTER_SEAT_PROVIDER), "FOOTER_SEAT_PROVIDER not last")]
    errors += [expect(not any("\u258c" in l for l in content), "U+258C present at the seat level")]
    return errors


def model_level_matcher(content):
    """Pre-press model frame. Live-render note (bring-up settled): with the
    full catalogue the hint and footer sit below the modal panel's clip
    (withModalFrame shows maxPanelHeight-2 content lines), so the POSSIBLE
    assertions here are: a non-empty row list, no U+258C, no empty-providers
    state, and the deterministic clip (last visible line is a model row, no
    hint/footer text rendered anywhere). The PRE_SEARCH_HINT/footer copy is
    byte-exact-pinned by the unit suite; the smoke asserts what the live
    terminal render shows per spec §4.4's live-render clause."""
    errors = []
    errors += [expect(any((l == HEADER or l.startswith(HEADER)) for l in content), f"header {HEADER!r} missing")]
    errors += [expect(len(model_rows(content)) >= 1, "no model rows (registry empty?)")]
    errors += [expect(last_is_model_row(content), "last visible line is not a model row (clip check)")]
    errors += [expect(footers_absent(content), "FOOTER_MODEL rendered (below the panel clip at this size)")]
    errors += [expect(not any(PRE_SEARCH_HINT in l for l in content), f"{PRE_SEARCH_HINT!r} rendered (below the panel clip at this size)")]
    errors += [expect(not any("\u258c" in l for l in content), "U+258C present pre-press")]
    errors += [expect(not any(EMPTY_NO_PROVIDERS in l for l in content), f"{EMPTY_NO_PROVIDERS!r} present at the model level")]
    return errors


def no_match_matcher(content, query):
    errors = []
    line1 = line_under_header(content)
    errors += [expect(line1 == "\u258c " + query, f"line 1 == \u258c {query}, got {line1!r}")]
    errors += [expect(NO_MATCH(query) in content, NO_MATCH(query))]
    errors += [expect(NO_MATCH_HINT in content, NO_MATCH_HINT)]
    errors += [expect(footer_is(content, FOOTER_MODEL), "FOOTER_MODEL not last (no-match frame)")]
    errors += [expect(content.count(FOOTER_MODEL) == 1, "a fifth footer rendered")]
    return errors


def filtered_matcher(content, query, universe, window):
    """Spec §4.3 structural rule: the visible row strings equal the python-
    derived filter of the pre-press universe (same predicate as
    filterModelRows — case-insensitive substring on qualifiedId minus the
    `:level` suffix), every visible row contained in the universe
    (walk-coverage guard), every visible row contains the query. Empty derived
    set -> the no-match copy renders instead (the assertion follows the live
    render, never both)."""
    errors = []
    line1 = line_under_header(content)
    errors += [expect(line1 == "\u258c " + query, f"line 1 == \u258c {query}, got {line1!r}")]
    derived = [u for u in universe if query.lower() in id_minus_level(u).lower()]
    visible = model_rows(content)
    if not derived and not visible:
        errors += [expect(NO_MATCH(query) in content, NO_MATCH(query))]
        errors += [expect(NO_MATCH_HINT in content, NO_MATCH_HINT)]
        errors += [expect(footer_is(content, FOOTER_MODEL), "FOOTER_MODEL not last")]
        return errors
    if not derived and visible:
        errors += [f"derived set empty but {len(visible)} rows visible for query {query!r}"]
    if derived and not visible:
        errors += [f"derived set has {len(derived)} rows but nothing visible for query {query!r}"]
    if derived:
        expected = derived[:window]
        errors += [expect(visible == expected, f"visible rows != derived[:{window}] (equal/ordered)")]
        errors += [expect(not any(v not in universe for v in visible), "a visible row is outside the captured universe (walk coverage)")]
        errors += [expect(not any(query.lower() not in id_minus_level(v).lower() for v in visible), "a visible row does not contain the query")]
        errors += [expect(last_is_model_row(content), "filtered frame did not stay at the model level")]
        errors += [expect(footers_absent(content), "FOOTER_MODEL rendered (below the panel clip at this size)")]
    else:
        errors += [expect(footer_is(content, FOOTER_MODEL), "FOOTER_MODEL not last (short no-match frame)")]
    return errors


def walk_universe(session, flog):
    """Walk the model list to the bottom, capturing every rendered id row.

    Per spec §4.3 with the spec's own live-render clause (§4.4): the pre-press
    snapshot is expanded to the whole catalogue so the structural derivation is
    exact for queries whose matches sort deeper than the first window.
    Batches of 10 Downs with a settle poll; stop after 3 batches where the
    selected row's id did not change (bottom reached) or a hard batch cap."""
    session.mark()
    last_id = None
    unchanged = 0
    MAX_BATCHES = 400
    for _ in range(MAX_BATCHES):
        session.send(K_DOWN * 10)
        if not session.wait_stable(1, 0.12, 2.0):
            break
        # the selected row id at the current screen:
        cur = selected_id(session)
        if cur is None:
            continue
        if cur == last_id:
            unchanged += 1
            if unchanged >= 3:
                break
        else:
            unchanged = 0
            last_id = cur
    raw = session.mark()
    flog.save("12-universe-walk", raw)
    ids = extract_ids_from_bytes(raw)
    # dedupe preserving id-ascending first-seen order
    return ids


def selected_id(session):
    """The currently selected row's id-minus-level from the live screen."""
    for l in session.snap():
        t = l.lstrip()
        if t.startswith("> openrouter/"):
            return id_minus_level(t)
    return None


def provider_matcher(content):
    errors = []
    errors += [expect(any((l == HEADER or l.startswith(HEADER)) for l in content), f"header {HEADER!r} missing")]
    provs = [l for l in content if l.lstrip().startswith(("> ", "  "))]
    errors += [expect(len(provs) >= 1, "no provider rows")]
    errors += [expect(footer_is(content, FOOTER_SEAT_PROVIDER), "FOOTER_SEAT_PROVIDER not last")]
    errors += [expect(not any("\u258c" in l for l in content), "U+258C present at the provider level")]
    return errors


if __name__ == "__main__":
    sys.exit(main())