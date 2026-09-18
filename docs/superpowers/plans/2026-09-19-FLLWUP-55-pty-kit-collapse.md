# FLLWUP-55 Implementation Plan — collapse the smoke driver's private pty screen model onto the shared kit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `smoke/search-smoke/driver.py` consumes `test/faux-provider/pty_kit.py` (Screen, Session, the ANSI regexes) instead of carrying its own `class Screen`/`class Session`, with zero diff on the kit's existing consumers and the ruled copy applied byte-exact.

**Architecture:** The kit gains three additive, default-preserving `Session` params (`rows=ROWS, cols=COLS, term_sig=9`). The driver deletes its private screen/session model (~250 lines), imports the kit through a two-line stdlib `sys.path` shim, and re-homes its session policy at the call site (28×80, SIGTERM 15, explicit env, `OPENROUTER_API_KEY` pass-through, explicit `wait_stable` timings) plus two ~10-line module-level helpers (`mark`, `answer_queries`). The witness extends its charter to `smoke/` with a four-part driver-shape ban (the red-at-base falsifier) and a two-sided stdlib-only kit guard (a charter pin, green both sides).

**Tech Stack:** python3 stdlib (kit + driver), bun:test (witness), bash (gates/smoke).

**Spec:** `docs/superpowers/specs/2026-09-18-FLLWUP-55-design.md` (self-contained; the binding product-owner copy ruling is §7 — strings byte-exact, `mark()` fixed driver-local).

## Global Constraints

- Pinned base for the red-base record: `3d55ac8235dd8190f94bd98f58e116b48f89f400` (pre-mechanism HEAD; worktree-only, main checkout never mutated).
- No changes under `council/`, `vault/`, or `council/fixtures/` (spec A10).
- `tui-retry.py` and `ev41-tui.py` take ZERO diff (spec §2.3, A5); kit `_feed` and `respond_queries` untouched (spec §2.2); NO `buf` and NO `mark()` in the kit (spec §2.2).
- Every driver `wait_stable` call passes its timing explicitly: `3, 0.08, 8.0` (except `walk_universe`'s deliberate `1, 0.12, 2.0`) — the kit gains no timing params (spec §3.7, R3).
- The driver's boot query scan is driver-local (`answer_queries` over the full stream), never the kit's last-8 KB `respond_queries` (spec §3.5, R4).
- Ruled copy (§7) byte-exact in both places; the embedded grep must remain literally true.
- Test 4 of the witness stays `TEST_DIR`-scoped and untouched (spec §6.1, A2); the FLLWUP-55 charter extension is named in the witness header.
- Gates: `bash council/preflight.sh FLLWUP-55`, `bunx tsc --noEmit`, `bun test` (≈94s envelope), `python3 council/validate.py`; obligations A1 (red-base at pinned base), A4 (copy), A5 (empty consumer diff), A7 (mark-equivalence probe), A8 (OB1 container probe), A9 (OB2 live smoke → `SMOKE PASS`).
- On OB2 red: STOP — no revert, no reword, report verbatim.

---

### Task 1: Witness — smoke-scoped driver-shape assertion + stdlib guard + header amendment

**Files:**
- Modify: `test/faux-provider-shape.test.ts` (header block, plus two new tests appended in a new nested describe; test 4 untouched)

**Interfaces:**
- Produces: `bannedScreenSessionLines(src: string): string[]` and `kitImportViolations(src: string): string[]` — pure line-checkers used both by the real-file assertions and the two-sided synthetic halves.
- Consumes: existing `REPO_ROOT`, `FAUX`, `readFileSync` imports already present in the file.

- [ ] **Step 1: Write the amended witness** (this is the failing test; TDD — the driver-shape half must red against the base driver):

Add to the header comment (after the existing scope paragraph):

```ts
// FLLWUP-55 extends the charter to `smoke/`: smoke/search-smoke/driver.py
// consumes the shared pty kit (no private Screen/Session); test 4's `test/`
// universe is unchanged.
```

Append inside the top-level describe, after the `bytecode exclusion` nested describe (helpers at module level, next to `countMatches`):

```ts
const SMOKE_DRIVER = join(REPO_ROOT, "smoke", "search-smoke", "driver.py");

/**
 * FLLWUP-55 ban checker: line-anchored regexes over source — comments and
 * strings do not false-positive (O11). Bans any private Screen/Session
 * definition (including subclasses), any screen/session ingest re-entry
 * (`feed`/`_csi`/`_feed`), on the smoke driver's source.
 */
function bannedScreenSessionLines(src: string): string[] {
	const hits: string[] = [];
	const lines = src.split("\n");
	for (let i = 0; i < lines.length; i++) {
		if (/^class\s+\w*(Screen|Session)\b/.test(lines[i])) hits.push(`line ${i + 1}: ${lines[i]}`);
		if (/^\s*def (feed|_csi|_feed)\(/.test(lines[i])) hits.push(`line ${i + 1}: ${lines[i]}`);
	}
	return hits;
}

/** FLLWUP-55 charter pin: pty_kit.py stays stdlib-only. */
const KIT_STDLIB = new Set(["fcntl", "json", "os", "pty", "re", "select", "struct", "termios", "time"]);
function kitImportViolations(src: string): string[] {
	const out: string[] = [];
	for (const line of src.split("\n")) {
		const m = /^(import|from)\s+([\w.]+)/.exec(line);
		if (!m) continue;
		if (!KIT_STDLIB.has(m[2].split(".")[0])) out.push(line);
	}
	return out;
}
```

New tests (nested describe after the `scan domain — bytecode exclusion` describe):

```ts
describe("smoke/ charter extension (FLLWUP-55)", () => {
	test("9: the search-smoke driver consumes the shared kit — no private Screen/Session", () => {
		const src = readFileSync(SMOKE_DRIVER, "utf-8");
		expect(bannedScreenSessionLines(src)).toEqual([]);
		expect(src).toContain("from pty_kit import");
	});

	test("10: ban checker is two-sided — a private session subclass reds it", () => {
		const scratch = mkdtempSync(join(tmpdir(), "fllwup55-ban-"));
		try {
			const synthetic = "class SmokeSession(Session):\n    def _csi(self, a, f):\n        pass\n";
			const hits = bannedScreenSessionLines(synthetic);
			expect(hits.length).toBe(2); // the class line + the _csi line
		} finally {
			rmSync(scratch, { recursive: true, force: true });
		}
	});

	test("11: kit stdlib-only guard (charter pin, green at base and head — never a red-base falsifier)", () => {
		const kit = readFileSync(join(FAUX, "pty_kit.py"), "utf-8");
		expect(kitImportViolations(kit)).toEqual([]);
		// two-sided: the checker reds on a non-stdlib import
		const scratch = mkdtempSync(join(tmpdir(), "fllwup55-stdlib-"));
		try {
			writeFileSync(join(scratch, "x.py"), "import requests\n", "utf-8");
			const hits = kitImportViolations(readFileSync(join(scratch, "x.py"), "utf-8"));
			expect(hits).toEqual(["import requests"]);
		} finally {
			rmSync(scratch, { recursive: true, force: true });
		}
	});
});
```

- [ ] **Step 2: Run — expect test 9 RED (test 4 stays green), tests 10/11 green**

Run: `bun test test/faux-provider-shape.test.ts`
Expected: `1 fail` — test 9 fails with lines naming `class Screen`, `def feed`, `def _csi`, `class Session` in driver.py.

- [ ] **Step 3: A1 red-base record — throwaway worktree at the pinned base**

```bash
git worktree add --detach /tmp/fllwup55-redbase 3d55ac8235dd8190f94bd98f58e116b48f89f400
cp test/faux-provider-shape.test.ts /tmp/fllwup55-redbase/test/faux-provider-shape.test.ts
cd /tmp/fllwup55-redbase && bun install
bun test test/faux-provider-shape.test.ts   # capture verbatim red output
cd - && git worktree remove --force /tmp/fllwup55-redbase
```

Transplant = the amended witness file alone; copy set = bare copy. Record per the seven fields.

### Task 2: Kit — additive rows/cols/term_sig params

**Files:**
- Modify: `test/faux-provider/pty_kit.py` (Session `__init__` + `kill` + class docstring; nothing else)

- [ ] **Step 1: Apply the diff**

```python
class Session:
    """One pty session: a forked child on a rows x cols pty (defaults 24x80), byte-logged."""

    def __init__(self, argv, work_dir, home, env_extra, bytelog_path, rows=ROWS, cols=COLS, term_sig=9):
        self.bytelog_path = bytelog_path
        self.bytelog = open(bytelog_path, "wb")
        self.screen = Screen(rows, cols)
        self.term_sig = term_sig
        # Explicit env: PATH + scratch HOME + harness vars only — nothing
        # ambient inherited (the FLLWUP-21 env-split lesson).
        env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": home, "TERM": "xterm-256color"}
        env.update(env_extra)
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
```

and in `kill`: `os.kill(self.pid, self.term_sig)`.

- [ ] **Step 2: Verify consumers untouched** — `git diff --stat test/faux-provider/tui-retry.py test/faux-provider/ev41-tui.py` is empty; `bun test test/faux-provider-shape.test.ts` still red only on test 9.

### Task 3: Driver — delete the private model, import the kit, re-home policy

**Files:**
- Modify: `smoke/search-smoke/driver.py`

- [ ] **Step 1: Imports + shim.** Keep `os, re, sys`; delete `fcntl, pty, select, struct, termios, time`; delete `ROWS, COLS` and local `CSI_RE`/`OSC_RE`; add:

```python
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, "test", "faux-provider"))
from pty_kit import Screen, Session, CSI_RE, OSC_RE
```

- [ ] **Step 2: Delete `class Screen` and `class Session` in full.** Keep everything else (`RESIDUAL_SGR`, `sanitize`, `sanitize_line`, `dechrome`, `is_border_or_blank`, `content_lines`, `id_minus_level`, `model_rows`, `strip_sgr`, `extract_ids_from_bytes`, byte table, `LEVELS`, `Failed`, `Framelog`, `assert_true`, matchers, `walk_universe`, `selected_id`, `main`).

- [ ] **Step 3: Module-level checkpoint + query + snap helpers** (after `Framelog`, where `Session` used to be):

```python
def mark(session) -> bytes:
    """Checkpoint read: the bytelog slice since the last mark. Byte-identical
    to the old in-memory buf-since-last-mark: every byte the session ingests
    is written+flushed to the bytelog by the kit's _feed in the same read."""
    size = os.path.getsize(session.bytelog_path)
    with open(session.bytelog_path, "rb") as f:
        f.seek(session._offset)
        out = f.read(size - session._offset)
    session._offset = size
    return out


def answer_queries(session, raw: bytes) -> None:
    """Boot query reply — full-stream scan (driver policy). The kit's
    respond_queries stays on its last-8 KB disk tail for the kit's own
    consumers; the boot scan must see the full stream, so it is driver-local."""
    if b"\x1b[c" in raw or b"\x1b[?1;2c" in raw or b"\x1b[>7u" in raw:
        session.send(DA_REPLY)
        session.send(KITTY_REPLY)


def snap(session) -> list:
    return content_lines(session.screen)
```

- [ ] **Step 4: `main` construction + boot flow:**

```python
session = Session([pi_bin], work_dir, home, {"OPENROUTER_API_KEY": os.environ.get("OPENROUTER_API_KEY", "sk-dummy")}, os.path.join(outdir, "bytes.log"), rows=28, cols=80, term_sig=15)
session._offset = 0
```

Boot: `session.drain(5.0)` → `boot_raw = mark(session)` → write `00-boot.raw` → `>7u` assertion unchanged → `answer_queries(session, boot_raw)` → `session.drain(1.0)` → `session.wait_stable(3, 0.08, 8.0)` → `mark(session)`.

- [ ] **Step 5: Call sites.** `assert_frame`: `session.wait_stable(3, 0.08, 8.0)`, `raw = mark(session)`, `content = snap(session)`. F3 block: same three. Walk reset: `session.wait_stable(3, 0.08, 8.0)`. `walk_universe`: `mark(session)` at start and `raw = mark(session)` at end; `session.wait_stable(1, 0.12, 2.0)`. `selected_id`: `snap(session)`. All other method calls (`send`, `drain`, `kill`) are kit-native.

- [ ] **Step 6: Docstring tail — ruled copy byte-exact (§7, second string).**

### Task 4: README — ruled copy byte-exact (§7, first string)

**Files:** Modify `smoke/search-smoke/README.md` (replace the three-line bullet).

- [ ] Verify both strings rejoin byte-exact (unwrap + compare in a script); grep `grep -nE '^(import|from)' smoke/search-smoke/driver.py test/faux-provider/pty_kit.py` stays literally true.

### Task 5: Gates + obligations

- [ ] `bun test test/faux-provider-shape.test.ts` → 0 fail (head half of A1)
- [ ] A7 mark-equivalence probe (scripted `_feed` stream, stubbed `send`, `__new__` session, no pty): `mark()` outputs == old buf-since-last-mark at every mark point; `hasattr(session, "buf")` False; `respond_queries` on an aged (>8 KB) query sends nothing.
- [ ] `git diff test/faux-provider/tui-retry.py test/faux-provider/ev41-tui.py` empty (A5)
- [ ] `bash council/preflight.sh FLLWUP-55`, `bunx tsc --noEmit`, `bun test` (~94s), `python3 council/validate.py` (A6)
- [ ] OB1: docker build `pi-council-smoke` + cheap import probe (A8)
- [ ] OB2: `bash smoke/search-smoke/run.sh` → `SMOKE PASS` (A9) — on red, STOP
- [ ] Commit (conventional), push `fllwup-55`, open PR
