# FLLWUP-55 — settled design: collapse the smoke driver's private pty screen model onto the shared kit

Date: 2026-09-18 · Card: `FLLWUP-55` (EPIC-9 residuals, run 2) · Full council, surface-touching (designer seated)
Ruling applied: **`product-owner` (job-21) copy ruling** — appended verbatim to `council/cards/FLLWUP-55.md`, binding. The byte-exact strings in §7 are that ruling's product.

This spec is written from the deliberation record (3 rounds + Skeptic step 4 + consolidator step 5). An owner reading only this file must reach exactly one design. Line numbers below are content anchors re-derived from the tree at HEAD `3d55ac8235dd8190f94bd98f58e116b48f89f400`; re-derive before editing (record discipline O12b — cited lines drifted by a few in deliberation; substance holds).

## 1. Decision — SHARE both classes

`smoke/search-smoke/driver.py` stops carrying its own `class Screen` and `class Session`. Both come from the shared stdlib-only pty substrate `test/faux-provider/pty_kit.py` (the FLLWUP-49 single-definition home). The card's original coupling premise — that `pty_kit.py` "resolves the dev-installed pi" — was **falsified** in deliberation (Skeptic O1 `closed-green`): the resolver lives in `test/faux-provider/harness.ts:26` (`import.meta.resolve`); `pty_kit.py` imports exactly nine stdlib modules and nothing else. The share creates a path dependency, not a pi coupling. The second copy had already drifted twice (O2's relative-left `D` fix, plus the J-clause spelling drift found at step 4 — O3: the two `Screen`s are **behaviorally identical, source-drifted**, never "byte-identical").

**Conditions attached (all satisfied by this design):**

1. `designer`'s witness-test condition — the kit stays stdlib-only under a CI-forced guard (§6.3).
2. The live smoke re-run at step 8 (§8, OB2) — green proves the four Session-policy deltas hold against the pinned external pi 0.84.3.
3. **Pre-authorized revert branch:** if the step-8 live smoke **reds**, the middle position fires (share `Screen`, keep the driver's `Session`) and **this copy ruling is re-issued — escalate; no seat or facilitator self-adjusts the wording**. The owner does NOT implement the revert unilaterally: it stops, reports the red, and the revert routes through the facilitator.

## 2. Kit diff (`test/faux-provider/pty_kit.py`) — additive only, default-preserving

1. `Session.__init__(self, argv, work_dir, home, env_extra, bytelog_path, rows=ROWS, cols=COLS, term_sig=9)` — three new keyword params, defaults `24/80/9`:
   - `fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))` (uses the params, not the module constants);
   - `self.screen = Screen(rows, cols)`;
   - `self.term_sig = term_sig`; `kill()` uses `os.kill(self.pid, self.term_sig)`.
   - The module docstring's "24x80" phrasing may note the geometry is parameterized; keep the edit minimal.
2. **No `buf`, no `mark()` in the kit. `_feed` untouched (write+flush bytelog, feed screen). `respond_queries` untouched — it stays on the last-8 KB disk tail.** Skeptic O6 (T3′, run at HEAD) proved an in-kit `buf` is NOT default-preserving: the two non-marking consumers would gain unbounded retention and an aged boot query would flip from 0 replies to 2. `owner` conceded on exactly this.
3. **`tui-retry.py` and `ev41-tui.py` take ZERO diff** — they construct `Session(argv, work_dir, home, env_extra, bytelog_path)` positionally and never pass the new params; their executed behavior is bit-identical (asserted, §5/§6.4).

## 3. Driver diff (`smoke/search-smoke/driver.py`)

1. **Delete** `class Screen` (anchor: the `~150-line pty screen model` docstring) and `class Session` (anchor: `def __init__(self, pi_bin, work_dir, home, outdir)`) in full, including `Screen.feed/_csi/lines` and `Session.send/_ingest/drain/wait_stable/respond_queries/mark/snap/kill`.
2. **Import path shim + kit import** (stdlib only, two lines):
   ```python
   sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, "test", "faux-provider"))
   from pty_kit import Screen, Session, CSI_RE, OSC_RE
   ```
   Delete the driver's own `CSI_RE`/`OSC_RE` definitions (kit exports identical regexes). Drop stdlib imports that become unused after the deletion (`pty`, `select`, `struct`, `termios`, `time`; keep `os`, `re`, `sys`).
3. **Session construction** (in `main`): `Session([pi_bin], work_dir, home, {"OPENROUTER_API_KEY": os.environ.get("OPENROUTER_API_KEY", "sk-dummy")}, os.path.join(outdir, "bytes.log"), rows=28, cols=80, term_sig=15)`. The kit's explicit env (PATH + HOME + TERM + env_extra) replaces the driver's ambient-minus-council-vars env — **strictly stronger isolation** (FLLWUP-21 env-split lesson): council child-mode vars are never inherited, so the defensive `env.pop` loop dies with the class. The 28×80 winsize, SIGTERM(15) teardown, and `OPENROUTER_API_KEY` pass-through become **explicit driver-authored session policy** at the call site.
4. **Checkpoint layer — driver-local, ~10 lines, module-level functions** (J2 fixed by the ruling to this shape):
   ```python
   def mark(session) -> bytes:   # bytelog-offset checkpoint read
       size = os.path.getsize(session.bytelog_path)
       with open(session.bytelog_path, "rb") as f:
           f.seek(session._offset)
           out = f.read(size - session._offset)
       session._offset = size
       return out
   ```
   (`session._offset` initialized to 0 at construction; a plain attribute set after construction is fine — no kit change). Every byte that entered the driver's old `buf` also enters the kit's bytelog (both fed from the same single `os.read` per poll, order-preserving — O7's operative facts), so `bytelog[offset:size]` is byte-identical to the old `buf`-since-last-mark. **O7 accuracy flag:** this equivalence is a *planned-state* property (the driver has no bytelog today), not a HEAD fact — it is verified after implementation (§5, A7).
   **No `class *Session` subclass in driver.py** — the witness bans it (§6.2); the checkpoint layer is module-level driver code, and method-style call sites (`session.mark()`, `session.snap()`) adapt to module functions (`mark(session)`, `snap(session)` — `snap` = `content_lines(session.screen)`).
5. **Boot query reply — driver-local, never the kit's `respond_queries`.** The kit's `respond_queries` scans only the last 8 KB of the bytelog; the driver's boot scan must see the full stream. Driver-local helper (uses the driver's own `DA_REPLY`/`KITTY_REPLY` byte-table constants — the byte table stays driver-authored):
   ```python
   def answer_queries(session, raw: bytes) -> None:
       if b"\x1b[c" in raw or b"\x1b[?1;2c" in raw or b"\x1b[>7u" in raw:
           session.send(DA_REPLY)
           session.send(KITTY_REPLY)
   ```
   Boot flow becomes: `session.drain(5.0)` → `boot_raw = mark(session)` → write `00-boot.raw`, assert `b"\x1b[>7u" in boot_raw` (negotiation assertion unchanged) → `answer_queries(session, boot_raw)` → `drain(1.0)` → `wait_stable(3, 0.08, 8.0)` → `mark(session)` (advances the offset; returns empty — harmless, same semantics as the old buf-clear).
6. **Driver keeps, unchanged in substance:** the byte table (`K_*`, `DA_REPLY`, `KITTY_REPLY`), `LEVELS`, the ruled copy set, `RESIDUAL_SGR`/`sanitize_line`/`dechrome`/`is_border_or_blank`/`content_lines`, `id_minus_level`/`model_rows`/`strip_sgr`/`extract_ids_from_bytes` (fed by the imported `CSI_RE`/`OSC_RE`), `Failed`/`Framelog`/`assert_true`/`assert_frame`/`expect`/`collect`, all matchers, `line_under_header`, `walk_universe`, `selected_id`, `last_is_model_row`, `footers_absent`, and `main`'s frame sequence (nine frames, byte-exact).
7. **`wait_stable` call sites — every driver call passes its timing explicitly.** The kit's defaults are `6/0.1/15.0`; the driver's policy is `3/0.08/8.0` and the kit gains NO timing params. `assert_frame`, the boot settle, and the F3/reset call sites: `session.wait_stable(3, 0.08, 8.0)`. `walk_universe` keeps `wait_stable(1, 0.12, 2.0)`.

## 4. Behavior-preservation rules (explicit, each asserted)

- **R1 — geometry:** 28×80 winsize via `rows=28, cols=80` at the construction site; the clip behavior frames 2–8 depend on it (assertion-bearing).
- **R2 — teardown:** SIGTERM(15) via `term_sig=15`; the kit's default 9 is never used by the driver.
- **R3 — timing:** every driver `wait_stable` call passes `3/0.08/8.0` explicitly (except `walk_universe`'s deliberate `1/0.12/2.0`).
- **R4 — boot reply:** driver-local full-stream scan (`answer_queries`), never the kit's last-8 KB `respond_queries`.
- **R5 — consumers:** `git diff tui-retry.py ev41-tui.py` is **empty** after the change; `pty_kit.Session` exposes no `buf` attribute; kit `respond_queries` still reads the last-8 KB disk tail (T3/T3′ shape).
- **R6 — screen parser:** the shared kit `Screen` is behaviorally identical to the deleted driver copy (O3: all six scripted probe streams identical; the J-clause source spelling difference collapses into the kit's one form).

## 5. Acceptance criteria (owner's checklist)

1. **A1 — Red-base record (pinned base `3d55ac8235dd8190f94bd98f58e116b48f89f400`):** the new smoke-scoped driver-shape assertion (§6.2), run via `bun test test/faux-provider-shape.test.ts` **at the pinned base** (a throwaway worktree at that SHA is acceptable; the main checkout is never mutated), reds with per-failure text naming `smoke/search-smoke/driver.py`'s `class Screen`/`class Session`/`def feed`/`def _csi` (O11 verified: hits exactly those, zero comment/string false positives, line-anchored). At the branch head: `0 fail`. Transplant = the amended witness file alone (copy-set clean at base). Record both halves per `[[red-base-evidence]]`.
2. **A2 — Charter amendment named:** the witness header comment (`test/faux-provider-shape.test.ts`, top block) records that FLLWUP-55 extends the charter to `smoke/`; test 4 itself is **untouched** (`TEST_DIR`-scoped, exactly one of each class, `pty_kit.py`).
3. **A3 — stdlib guard green both sides** (§6.3), labelled in the test as a charter pin (green-at-base/green-at-head), not a falsifier.
4. **A4 — Ruled copy applied byte-exact** in both places (§7).
5. **A5 — Consumer invariance:** empty diff on `tui-retry.py` + `ev41-tui.py`; existing bun-test live arms stay green inside the full suite.
6. **A6 — Full gate set green:** `bash council/preflight.sh FLLWUP-55`, `bunx tsc --noEmit`, `bun test` (≈94s envelope per `[[test-suite-budget]]`), `python3 council/validate.py`.
7. **A7 — Mark equivalence evidenced:** a scripted-stream probe (stubbed `send`, `__new__`-constructed kit `Session` or equivalent, no pty — the Skeptic's T3′ probe pattern) showing `mark()`'s bytelog-offset read returns byte sequences identical to the old in-memory `buf`-since-last-mark at the driver's mark points. Form at owner discretion (test or recorded probe with output in the report).
8. **A8 — OB1 container evidence:** the Docker path sees the kit — either `SMOKE_PHASE=6 bash smoke/run.sh` (builds `pi-council-smoke`, installs python3, bind-mounts `$REPO_ROOT:/pkg`) or the cheap probe against a built image: `docker run --rm -v "$PWD:/pkg" pi-council-smoke python3 -c "import sys; sys.path.insert(0,'/pkg/test/faux-provider'); import pty_kit; print(pty_kit.Screen)"`. Network build; declined as not harmless at step 4, executed at step 8.
9. **A9 — OB2 live smoke:** `bash smoke/search-smoke/run.sh` on the host (~5–10 min, network: npm install of pinned 0.84.3) → `SMOKE PASS`. This is the once-per-card live-path falsifier for 28×80 geometry, SIGTERM teardown, and `wait_stable` timing against the pinned external pi (env isolation is pre-validated by the kit consumers' green arms). **Not a CI gate** (`[[smoke-test]]`). On red: STOP — do not revert, do not reword copy; report (revert branch per §1.3).
10. **A10 — Scope:** no changes under `council/`, `vault/`, or fixture seeds (blast radius verified at step 1: no fixture seed carries `smoke/` or `test/faux-provider` files; the `seed.treeDigest` machinery is untouched). The `smoke-test.md` wiki update is a step-14 ingest offer, not part of this branch.

## 6. Witness (test/faux-provider-shape.test.ts) — three additions, one amendment

1. **Test 4: untouched.** `TEST_DIR`-scoped; exactly one `^class Screen`/`^class Session`, both `pty_kit.py`. FLLWUP-49's declared universe stays true inside its own test. (O8 a fortiori record: a `REPO_ROOT`-rooted count would yield `^class Screen` **63** / `^class Session` **375** — `.worktrees/fllwup-49/...`, `ev43/`, `node_modules`; the widening is dead and is not attempted.)
2. **NEW — smoke-scoped driver-shape assertion (the red-at-base falsifier), four parts, scoped to `smoke/search-smoke/driver.py`:**
   (i) no `^class\s+\w*(Screen|Session)\b`; (ii) no screen/session internals `^\s*def (feed|_csi|_feed)\(`; (iii) `from pty_kit import` present; (iv) **two-sided synthetic half** — a scratch file carrying `class SmokeSession(Session):` and `def _csi(` reds the ban checker. Ban-list closure: `def _feed\(` is included per owner r3 (O11: its absence would not affect red-at-base — the driver's current Session ingests via `_ingest` — but it closes the Session-side ingest re-entry surface). The widened regexes are line-anchored; comments and strings do not false-positive (O11).
3. **NEW — two-sided stdlib-only kit guard (charter pin, green-at-base/green-at-head — never presented as a red-base falsifier):** extract every `^(import|from)` line from `test/faux-provider/pty_kit.py`, assert each top-level module is in the exact expected set `{fcntl, json, os, pty, re, select, struct, termios, time}`, failure text names the offending line; synthetic half: a scratch file with `import requests` reds. This is `designer`'s forcing function: a future non-stdlib kit import breaks CI before the smoke ever runs.
4. **Header amendment:** name the FLLWUP-55 charter extension (the `smoke/` residual is now policed; test 4's `test/` universe unchanged).

## 7. Ruled copy (byte-exact — binding, from `product-owner` job-21)

**`smoke/search-smoke/README.md`** — replace the three-line claim (anchor: the bullet beginning `` - `driver.py` imports **python3 stdlib only** ``) with this single bullet:

> - `driver.py` imports python3 stdlib plus exactly one repo module — the shared stdlib-only pty substrate test/faux-provider/pty_kit.py (Screen, Session, the ANSI regexes). Neither module imports any pi/extension module (greppable claim: grep -nE '^(import|from)' smoke/search-smoke/driver.py test/faux-provider/pty_kit.py). The byte table, the frame matchers, and the session policy (28×80 winsize, checkpoint-byte mark(), SIGTERM teardown, wait_stable timing, OPENROUTER_API_KEY pass-through) are authored in the driver; the screen parser is shared with the faux-provider kit so the O2 drift class cannot recur.

**`smoke/search-smoke/driver.py`** — replace the three-line docstring tail (anchor: the paragraph beginning `python3 stdlib ONLY (pty, fcntl, termios, select, struct, re)`) with:

> python3 stdlib plus one repo module — the shared stdlib-only pty substrate test/faux-provider/pty_kit.py (Screen, Session, the ANSI regexes). Neither module imports any pi/extension module (testable claim 4). The byte table, frame matchers, and session policy (28×80 winsize, checkpoint-byte mark(), SIGTERM teardown, wait_stable timing, OPENROUTER_API_KEY pass-through) are authored here; the screen parser is shared with the faux-provider kit so the O2 drift class cannot recur.

Byte-exactness governs the character sequence of the wording; the README bullet may be hard-wrapped to the file's existing style provided the wrapped lines rejoin to exactly this sequence. The greppable claim must remain **literally true** after the change: `grep -nE '^(import|from)' smoke/search-smoke/driver.py test/faux-provider/pty_kit.py` lists every import line of both files and none is a pi/extension module. If the smoke reds and the middle-position revert fires, this wording is re-issued by a fresh ruling — never self-adjusted.

## 8. Gates and obligations summary

| Gate / obligation | Command / artifact |
|---|---|
| Preflight | `bash council/preflight.sh FLLWUP-55` |
| Typecheck | `bunx tsc --noEmit` |
| Suite | `bun test` |
| Board | `python3 council/validate.py` |
| Red-base | driver-shape assertion red at `3d55ac8…`, green at head (A1) |
| OB1 container | probe or `SMOKE_PHASE=6 bash smoke/run.sh` (A8) |
| OB2 live smoke | `bash smoke/search-smoke/run.sh` → `SMOKE PASS` (A9) |
| Copy | §7 byte-exact (A4) |
| Consumers | empty diff (A5) |
| Equivalence | A7 probe |

Owner works in a dedicated `git worktree` off main `3d55ac8235dd8190f94bd98f58e116b48f89f400`, pushes a branch, opens a PR. The main checkout's branch state is never mutated by the owner or any seat.
