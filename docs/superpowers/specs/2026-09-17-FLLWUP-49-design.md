# FLLWUP-49 — Promote the offline faux-provider harness into a shared smoke helper

**Card:** `council/cards/FLLWUP-49.md` (EPIC-9, eighth card of the residual run).
**Status:** settled design — steps 1–6 of `/council` closed it; this file writes
it up, it does not derive it.
**Goal (steward-amended at step 6, binding — this is the judge's oracle):**

> The offline faux-provider harness is one shared test helper under test/,
> imported by each of test/ev40-headless.test.ts, test/ev40-live-gates.test.ts,
> test/ev41-retry-e2e.test.ts and test/ev43-reachability.test.ts, with the
> seat-dispatch arm's child staying on test/stub-child.ts and no duplicated
> harness copy under test/ or in ev43/, witnessed by a committed shape test
> asserting exactly one provider extension, one headless runner, and one pty
> screen model.

This spec is the owner's handoff. Everything below was settled by the
deliberation (steps 2–5), the Skeptic's runs (step 4), the `steward` ruling at
step 6 (job-24), and the run-wide Phase-1 rulings. **Nothing here is a
facilitator choice and no design question below is open.** Where the Council
left phrasing to craft, the boundary of that freedom is named.

## 0. What the design is, in one paragraph

The **EV-40 family becomes the one shared offline faux-provider harness**, moved
by `git mv` from `test/ev40-harness/` to **`test/faux-provider/`**: one provider
extension (`extension.ts`), one headless arm runner (`harness.ts`), and one pty
screen substrate (`pty_kit.py`) shared by two thin scenario runners
(`ev41-tui.py`, spawned by the EV-41 suite; `tui-retry.py`, manual). The
`ev43/` predecessor harness is **deleted**, its reachability test re-pointed
onto the shared runner; `test/ev41-tui.py` is moved into the harness directory
and thinned over the kit. All four goal-named test files import the shared
harness. `test/stub-child.ts` and its consumers are untouched — the
seat-dispatch arm's child stays on the stub substrate deliberately. A new
**`test/faux-provider-shape.test.ts`** is the goal's committed witness: it
asserts exactly one provider extension, one headless runner, and one pty screen
model inside the goal's universe (`test/` plus a non-existent `ev43/`), that
each of the four named consumers imports the shared harness, and that every pty
runner compiles. The pty family's drifted CSI-`D` clause is fixed to the
correct relative-left semantics; `secondMessagePresent` is tightened to
assistant-only; the EV-43 characterization keeps its colon-less forcing class
byte-identical via an `EV40_ERROR_MESSAGE` knob and takes its two other moving
identity strings from exported constants. **No engine change, no new live test
arm, no CI wiring of the manual runners, no user-visible copy.**

## 1. What is settled (do not reopen)

- **Canonical harness = the EV-40 family.** `harness-headless.ts` is already
  the generalization (its own header says so) and already holds the superset of
  knobs (fail-count, arm, partial, context/payload/settle logs, SIGINT); all
  four TS import sites either already point there or will. Canonicality is a
  fact at HEAD, not a choice.
- **Home = `test/faux-provider/`** (a `git mv` of `test/ev40-harness/`).
  `owner` conceded the rename in round 2; `principal` conceded it as tradeable
  and did not press. The directory name is the only discovery surface a third
  consumer has; it must not be an epic's name.
- **`test/faux-provider/` layout is exactly:**
  `harness.ts`, `extension.ts`, `pty_kit.py`, `ev41-tui.py`, `tui-retry.py`.
  No other file. (`ev40-headless.test.ts`, `ev40-live-gates.test.ts`,
  `ev41-retry-e2e.test.ts` stay directly under `test/` — the goal names them
  there.)
- **Fate of every duplicated copy** (deliberation steps 2–5):
  | copy at HEAD | fate |
  |---|---|
  | `test/ev40-harness/harness-headless.ts` | → `test/faux-provider/harness.ts` (`git mv`) |
  | `test/ev40-harness/ev40-harness-extension.ts` | → `test/faux-provider/extension.ts` (`git mv`) |
  | `test/ev40-harness/tui-retry.py` | → `test/faux-provider/tui-retry.py` (`git mv`), thinned over `pty_kit.py` |
  | `test/ev41-tui.py` | → `test/faux-provider/ev41-tui.py` (`git mv`), thinned over `pty_kit.py`; spawn path updated |
  | `ev43/ev43-falsifier-extension.ts` | **deleted** |
  | `ev43/falsifier-headless.ts` | **deleted**; `test/ev43-reachability.test.ts` re-pointed |
  | `ev43/falsifier-tui.py` | **deleted**; its hasUI in-handler TUI scenario **retired** as a manual capability (recorded; see §8) |
  | `ev43/` directory (incl. `__pycache__`) | **removed entirely** — the goal requires `ev43/` absent |
  | `test/stub-child.ts` + 5 consumers | **untouched** — different fixture family (a stub `pi --mode json` child), the seat arm's substrate |
  | `smoke/search-smoke/driver.py` | **untouched** — named out-of-universe residual, see §2 and §10 |
- **Pty semantics: one substrate, two thin scenarios.** The substrate is where
  dedup pays; the runners keep their distinct scenarios. `D` = **relative-left**
  (`self.c = max(0, self.c - n)`); `G` = absolute-column. Settled by O2
  `closed-green` (the copies drifted; `ev41-tui.py`'s `D` clause is the wrong
  one).
- **`secondMessagePresent` is tightened to assistant-only.** Settled by O3
  `closed-green`: the shared predicate matches the whole `sequence` (including
  `user` rows) while EV-43's local one is assistant-only; re-pointing EV-43
  onto the shared predicate without tightening changes attribution semantics.
- **EV-43 characterization fidelity.** The injected class stays **byte-identical**
  (`Provider finish_reason error`, colon-less) via a new `EV40_ERROR_MESSAGE`
  env knob (O5: the knob preserves 1 of the 4 moving identity strings; the
  other three — provider id, continuation prompt, second-response marker — are
  taken from exported constants). **`council/cards/EV-43.md` and every other
  historical record are not edited** (both seats agree; it is the record of
  what was observed).
- **Committed shape test as the goal's only operationalization.** O8
  `closed-green`: `bun test` is green with all four copies present, so a
  Skeptic whose falsifier is `bun test` returns a vacuous green. The shape test
  must be **identity-scoped**, not an exact `readdirSync` list (O9
  `closed-green` with condition: a directory-scoped predicate passes while a
  copy survives elsewhere; a wrong-root variant can be satisfied while a copy
  survives).
- **Two-commit split.** Purpose: let the Skeptic check "no behavior change" on
  a commit that *excludes* the changes we already know change behavior. See §9
  for the split as specified (a craft refinement of the deliberation's split,
  stated there).
- **FLLWUP-48 adjacency: zero new live arms.** This refactor adds **no** new
  `bun test` arms and no arm-count/timeout changes. Baseline arm counts (O10):
  ev40-headless 3, ev40-live-gates 5, ev41-retry-e2e 5, ev43-reachability 2.
  The shape test spawns nothing except `python3 -m py_compile`.
- **Volume/scope: no engine change, no version bump, no user-visible copy.**
  `extensions/` changes only two comment citations (§6).

## 2. The declared universe, and the goal's witness

The goal's own words scope the universe: **"under `test/` or in `ev43/`"**.
That is the only universe the shape test may police.

- **Inside the universe:** every file under `test/`, plus `ev43/` (which must
  not exist after this card).
- **Outside the universe, named residual:** `smoke/search-smoke/driver.py`'s own
  `class Screen`/`class Session`. It is a separate, independently-ruled manual
  that pins its own screen model and a pinned external pi 0.84.3
  (`smoke/search-smoke/README.md:114-116`, `run.sh`), while the harness resolves
  the dev-installed pi. A `smoke/ → test/` import would couple the release gate
  to a `test/` module and falsify a pinned README claim. The `steward` ruling
  explicitly bounds it: excluded by the goal's scope, **not** a permanent
  portfolio acceptance. Untouched by this card.
- **Correction to a deliberation detail (craft, not design):** the deliberation
  suggested a shape assertion on "exactly one `resolveNode` under `test/`".
  That identity is **not** one of the goal's three, and it is false at HEAD:
  `test/env-split-contract.test.ts:45` defines an unrelated local `resolveNode`.
  **Do not assert it.** The three goal identities are the witness (§7).

## 3. Goal sentence → the four facts it must make true

1. **One shared test helper under `test/`** — §4/§5: `test/faux-provider/`.
2. **Imported by each of the four named test files** — §6 re-point table; each
   file's text must contain the specifier `from "./faux-provider/harness.ts"`.
3. **The seat-dispatch arm's child stays on `test/stub-child.ts`** —
   `test/ev41-retry-e2e.test.ts`'s `(b)` block (`command: "bun"`, `args:
   [STUB]`, `seat: "stub"` label) is **not** re-architected. `stub-child.ts`
   and its five consumers are untouched. This is the file-granularity reading
   the `steward` ruling codified: the file carrying the seat-dispatch test
   imports the shared harness, and the seat *child* stays on the stub.
4. **No duplicated harness copy under `test/` or in `ev43/`** — §7's shape test
   is the falsifier (O8: `bun test` cannot witness it).

## 4. The shared TS surface

### 4.1 `test/faux-provider/harness.ts`

A `git mv` of `harness-headless.ts` with **symbol-for-symbol** the same exports:
`HARNESS_EXTENSION`, `COUNCIL_EXTENSION`, `CLI_PATH`, `resolveNode`, `ArmResult`,
`ArmOptions`, `ParsedEntry`, `parseSessionEntries`, `findSessionJsonl`,
`EngineRepoOptions`, `PreparedArm`, `prepareHarnessArm`, `runHarnessArm`,
`SigintOptions`, `SigintArmResult`, `runHarnessArmSigint`,
`sessionJsonlWellFormed`, `secondMessagePresent`, `hasUserMessage`,
`failedAssistantCount`, `countUsageRecords`, `parseContextLog`.

Three changes, and only these:

1. **`HARNESS_EXTENSION` re-points** to
   `join(REPO_ROOT, "test", "faux-provider", "extension.ts")`. `REPO_ROOT` still
   resolves via `import.meta.url` (the file remains three levels under the repo
   root).
2. **Re-exports** `INJECTED_ERROR_MESSAGE`, `PARTIAL_MARKER`,
   `CONTINUATION_MARKER`, and `CONTINUATION_PROMPT` from `./extension.ts`, so
   every TS consumer has **one** import path and no consumer asserts a
   harness-internal literal. (Importing `extension.ts` in the test process is
   already done today at `test/ev41-retry-e2e.test.ts:65`; its module top level
   only constructs the faux provider and reads env — no registration.)
3. **`ArmOptions` gains `errorMessage?: string`**, passed into the arm env as
   `EV40_ERROR_MESSAGE` (see 4.2). The knob's default preserves today's
   behavior exactly.

The extension's module doc-comment header is updated for the new path and for
the two new knobs.

### 4.2 `test/faux-provider/extension.ts`

A `git mv` of `ev40-harness-extension.ts`. It is already a superset of the EV-43
extension (`EV40_ARM` `inside|timer|none` covers `EV43_HANDLER=1|0`;
`EV40_FAILS` covers the fail-once script). Three changes, and only these:

1. **`EV40_ERROR_MESSAGE` env knob.** Read at load:
   `const ERROR_MESSAGE = process.env.EV40_ERROR_MESSAGE ?? INJECTED_ERROR_MESSAGE;`
   `failStep` uses `ERROR_MESSAGE`. Default (`INJECTED_ERROR_MESSAGE`, the
   with-colon literal) preserves today's behavior byte-for-byte; the knob exists
   so the re-pointed EV-43 arm can inject its original colon-less class and keep
   `test/ev43-reachability.test.ts`'s `control.stderr` assertion meaningful
   (the with-colon literal does **not** contain the colon-less substring).
2. **`CONTINUATION_PROMPT` export.**
   `export const CONTINUATION_PROMPT = process.env.EV40_CONTINUATION ?? "EV40-CONTINUE";`
   with the existing local `CONTINUATION` replaced by it. It is exported so the
   re-pointed EV-43 test asserts the shared constant rather than a
   harness-internal literal. `harness.ts` re-exports it (§4.1). No arm passes
   `EV40_CONTINUATION`, so the test-process value and the arm-process value are
   the same string.
3. **Doc-comment header** updated for the new path and the two knobs.

`INJECTED_ERROR_MESSAGE`, `CONTINUATION_MARKER`, `PARTIAL_MARKER` and every
existing knob keep their names and values (the `EV40_*` env wire is private
between `harness.ts` and the runners; renaming it buys no behavior and enlarges
the diff — both seats conceded it stays).

**Keep the independent literal.** Do **not** replace
`INJECTED_ERROR_MESSAGE` with an import of `PROVIDER_FINISH_REASON_ERROR`: the
byte-equality assertions (`test/ev40-headless.test.ts:47-51`,
`test/ev41-retry-e2e.test.ts:82-88`) are meaningful only while the two literals
are authored independently.

## 5. The shared pty substrate and the two scenario runners

### 5.1 `test/faux-provider/pty_kit.py` (new)

Stdlib-only. The substrate shared by every pty runner, extracted from the three
HEAD copies plus `ev41-tui.py`'s strictly-richer pieces:

- `ROWS, COLS = 24, 80`; `DA_REPLY`, `KITTY_REPLY`, `K_CR`; `CSI_RE`, `OSC_RE`.
- `class Screen` — the minimal pty screen model, **exactly one definition**.
  `_csi` keeps `H`/`f` absolute positioning, `A`/`B`/`C`, `K`, `J`, and fixes
  **`D` to relative-left**: `self.c = max(0, self.c - (int(args_s) if args_s else 1))`.
  `G` keeps absolute-column. This is the O2 fix, in the one place it now lives.
- `class Session` — the pty session (`send`, `poll`, `drain`, `wait_for`,
  `wait_stable`, `respond_queries`, `kill`), parameterised by `argv`,
  `work_dir`, `home`, `env_extra`, `bytelog_path` exactly as `ev41-tui.py`'s.
- `read_sequences(sessions_dir)` — the **dict-entry** form (role / stopReason /
  errorMessage / text), which is strictly richer than `tui-retry.py`'s string
  form (O9's evidence). One definition.
- `sweep_stub_pids(work_dir)` — the P6 stub-sweep helper (needed by
  `tui-retry.py`).

Naming note (craft): the file is `pty_kit.py`, not `pty-kit.py`; a hyphenated
name is not importable, and each runner would need an `importlib` loader hack
for it. This changes no design element — the kit is one substrate file in the
harness directory either way.

### 5.2 `test/faux-provider/ev41-tui.py`

`git mv` of `test/ev41-tui.py`, thinned over `pty_kit.py` (`import pty_kit`) so
it holds only its scenario: the EV-41 treatment/control retry arms
(`.council.json` retry policy enabled / disabled, `baseDelayMs 4000`), the
countdown line, the continuation render, and the JSONL chain assertions.

**Its printed verdict lines must stay byte-identical** — the EV-41 suite asserts
them with `toContain`:
`EV41-TUI-VERDICT: GREEN`, `EV41-TUI-TREATMENT: GREEN`,
`EV41-TUI-CONTROL (no mechanism => no continuation): GREEN`.
Exit 0 iff `verdict == "GREEN"`. It keeps its env contract
(`NODE_BIN`, `CLI_PATH`, `EXT_PATH`, `COUNCIL_EXT`) and its `argv[1]` artifact
dir.

### 5.3 `test/faux-provider/tui-retry.py`

`git mv` of `test/ev40-harness/tui-retry.py`, thinned over `pty_kit.py` so it
holds only its scenario: the EV-40 P6 shape — a leading real `council_dispatch`
tool call, `EV40_OPEN_TREE=1`, the countdown line, the active-jobs widget, and
the tree widget on distinct rows at 24 rows, plus the timer-deferred
continuation render. It stays **manual** (not spawned by `bun test`), unchanged
in that respect from HEAD.

### 5.4 Retired: `ev43/falsifier-tui.py`'s hasUI scenario

Deleted with `ev43/`. The hasUI in-handler TUI scenario is **retired as a manual
capability**, recorded here. Consequence: the `ctx.hasUI` port into the shared
extension becomes dead code and is **withdrawn** (owner round-2 concession 3;
consolidator's settled disposition). See §8 for the owner's explicit
disposition call.

## 6. Consumer re-points (exact)

| consumer | change |
|---|---|
| `test/ev40-headless.test.ts` | imports (lines 30-37) → `./faux-provider/harness.ts` for the runner symbols and the re-exported `INJECTED_ERROR_MESSAGE`. No assertion change. |
| `test/ev40-live-gates.test.ts` | imports (lines 33-40) → `./faux-provider/harness.ts` for the runner symbols and the re-exported `INJECTED_ERROR_MESSAGE`, `PARTIAL_MARKER`. Line 147's `--provider ev40` comment stays true (the provider id is unchanged). No assertion change. |
| `test/ev41-retry-e2e.test.ts` | imports (lines 56-65) → `./faux-provider/harness.ts`; pty spawn path (line 338) → `path.join(import.meta.dir, "faux-provider", "ev41-tui.py")`; header comments naming `test/ev40-harness/...` and `test/ev41-tui.py` updated. The `(b)` seat block and `stub-child.ts` are untouched. No assertion change. |
| `test/ev43-reachability.test.ts` | re-pointed off `../ev43/falsifier-headless.ts` onto `./faux-provider/harness.ts`; the declared assertion re-encode below; latest header prose rewritten. |
| `test/stub-child.ts` + `test/hub.test.ts`, `test/job-retry.test.ts`, `test/eval-runner.test.ts`, `test/stub-child.test.ts` | **untouched.** |
| `extensions/parent-retry.ts:4` | comment citation → `test/faux-provider/extension.ts`. No code change. |

### 6.1 `test/ev43-reachability.test.ts` — the declared re-encode

The test stays a **characterization of pi's runtime** (treatment present,
control absent) with the **same falsifier identity**: a fail-once faux provider
whose injected class is not pi-retryable, one arm with the handler, one control
without. What moves is the spelling of three identity strings, taken from the
shared constants; what is preserved byte-identical is the fourth.

- **Test 1 (unit attribution)** — unchanged. It imports `isRetryableAssistantError`
  from `@earendil-works/pi-ai` directly and does not use the harness; the
  fabricated message's inert `provider`/`model` fields are not asserted on.
- **Test 2 (live arm)** — replace `runHeadlessArms` with two `runHarnessArm`
  calls, both carrying `fails: 1` and the colon-less forcing class via the knob:
  - `treatment` = `runHarnessArm({ label: "ev43-treatment", fails: 1, arm: "inside", errorMessage: EV43_INJECTED_ERROR_MESSAGE }, scratchRoot)`
  - `control` = `runHarnessArm({ label: "ev43-control", fails: 1, arm: "none", errorMessage: EV43_INJECTED_ERROR_MESSAGE }, scratchRoot)`
  where `const EV43_INJECTED_ERROR_MESSAGE = "Provider finish_reason error";`
  (colon-less, the recorded class).
  Assertions (the declared re-encode — nothing else in this file may change):
  - `expect(secondMessagePresent(treatment)).toBe(true)` — assistant-only after
    the §1 tightening.
  - `expect(hasUserMessage(treatment, CONTINUATION_PROMPT)).toBe(true)`
    (was the `EV43-CONTINUE` literal).
  - `expect(treatment.stdout).toContain(CONTINUATION_MARKER)`
    (was the `EV43-SECOND-RESPONSE` literal).
  - `expect(secondMessagePresent(control)).toBe(false)`.
  - `expect(hasUserMessage(control, CONTINUATION_PROMPT)).toBe(false)`.
  - `expect(control.stderr).toContain(EV43_INJECTED_ERROR_MESSAGE)` — the
    **preserved** string; the knob is what makes this assertion still mean what
    it meant at HEAD.
  - `expect(control.exitCode).toBe(1)`.
  - Keep the 300 s test timeout and the `mkdtempSync`/`rmSync` scratch discipline.
- **Header prose (lines 1-19)** must be rewritten: it currently names the
  deleted `ev43/` extension and runner and describes the mechanism as the EV-43
  scratch extension. The new header must say the falsifier now runs on the
  shared `test/faux-provider/` harness, name the colon-less class and the knob
  that preserves it, and keep the attribution claim (the class is not
  pi-retryable, so a second assistant message is attributable to the
  `agent_settled` sendUserMessage and the control's absence).

## 7. `test/faux-provider-shape.test.ts` — the committed witness

New file. **bun:test**, pure filesystem reads plus `python3 -m py_compile`
spawns — no pi arm, no pty, no live run, no new `bun test` arm count. Write it
**red first** on the pre-refactor tree (it fails there: `ev43/` exists, the
three `class Screen` copies exist under `test/`, and not all four consumers
import the shared harness), then green after the refactor. This is the card's
red-at-base discipline and the reason the witness is not decoration.

The witness file **excludes itself** from its own scans (its expected-value
strings contain the path tokens it counts).

Assertions, exactly:

1. **Universe:** `ev43/` does not exist — `expect(existsSync(join(REPO_ROOT, "ev43"))).toBe(false)`.
2. **Exactly one provider extension** — recursively over `test/**,` the number
   of files whose source contains `fauxProvider(` is exactly 1, and it is
   `test/faux-provider/extension.ts`.
3. **Exactly one headless runner** — recursively over `test/**`, the number of
   files whose source contains `export function runHarnessArm(` is exactly 1,
   and it is `test/faux-provider/harness.ts`.
4. **Exactly one pty screen model** — recursively over `test/**`, the number of
   files whose source matches `^class Screen` (multiline) is exactly 1, the
   number matching `^class Session` is exactly 1, and both are the same file:
   `test/faux-provider/pty_kit.py`. (Scope is `test/` only — the goal's
   universe; `smoke/search-smoke/driver.py` is the named out-of-universe
   residual per §2.)
5. **Each of the four named consumers imports the shared harness** — the four
   goal-named files' source each contains the specifier
   `from "./faux-provider/harness.ts"`.
6. **No retired path reference survives under `test/`** — no file under
   `test/**` (excluding the witness) contains any of the retired path tokens
   `ev40-harness/`, `ev43/falsifier`, or `ev43/ev43-falsifier`. (Provenance
   prose is fine; it must cite the card record `council/cards/EV-43.md` rather
   than a deleted path token — see §9's sweep.)
7. **The seat fixture did not move or multiply** —
   `test/ev41-retry-e2e.test.ts` still names `stub-child.ts`, and
   `test/faux-provider/` contains no seat-stub file
   (`readdirSync(test/faux-provider)` has no `stub*` entry).
8. **Every pty runner compiles** — `python3 -m py_compile` on `pty_kit.py`,
   `tui-retry.py`, `ev41-tui.py`, each exit 0 (coverage gain: today a syntax
   error in an unspawned manual runner breaks nobody).

The shape test's own source must not import the harness (it asserts on text,
not on the module), and must use `import.meta.dir`-relative paths (repo root =
`dirname(import.meta.dir)`), never a hardcoded absolute path.

## 8. Named dispositions (handed to the owner — not decided by the facilitator)

### 8.1 `hasUI` port-vs-drop — **owner's explicit call, steward-assigned**

Both seats converged on retiring the `falsifier-tui.py` hasUI scenario (§5.4);
the `steward` ruling leaves the port-vs-drop "a card-level design taste that
stays with the owner/`product-owner`". The disposition:

- **Default (and the converged design): retire the scenario, do not port
  `ctx.hasUI`.** With the scenario retired there is nothing to move and the port
  is dead code.
- **Permitted deviation, with a hard condition:** if the owner elects to *move*
  the hasUI scenario rather than retire it, it **must** port the `ctx.hasUI`
  split from `ev43/ev43-falsifier-extension.ts:72-91` into the shared extension
  in the same commit — otherwise the moved scenario's TUI continuation shape
  silently changes.
- Either way the owner must **name its choice in the plan and the step-8
  report**. Silent selection is the failure this disposition exists to prevent.

### 8.2 Two `open-untested` items ride into step 9 as named evidence (non-blocking)

- **O7 live half** — a live seat-child E2E through a scratch repo's
  `.pi/extensions` + `.council.json` auto-discovery, dispatched through a real
  `council_dispatch`, asserting the faux literal reaches the seat child's
  provider-error path. Not run; structurally plausible (`seats.ts:600-621` has
  no `-e`/`--provider`, but `command: "pi"` with `cwd: repoRoot` + `-a` and
  project-local extension auto-discovery is real). **Under either outcome the
  shipped design is identical** — the seat arm stays on `stub-child.ts`; the
  remedy is spec prose, and a satisfiable answer is follow-up territory (§10).
- **O8 removal half** — re-running the FLLWUP-47 removal-inertness probe
  (`rm test/ev40-harness test/ev41-tui.py` leaves the suite identical), cited
  from `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md:300-307`. Corroborating
  only; the vacuous-witness half already closed green and the shape test
  operationalizes the goal independently.

Neither is a blocker; neither may be claimed as closed by the owner, and the
Skeptic may re-run either now that a branch tree exists.

### 8.3 `smoke/search-smoke/driver.py`

Named residual, untouched, excluded by the goal's own scope (§2). A future card
may decide whether to collapse it; not this one.

## 9. The commit split (specified functionally)

The deliberation settled a two-commit split so a reviewer can separate "moved"
from "changed". Specified so commit 1 is verifiably pure and **green**:

- **Commit 1 — the move.** `git mv` `harness-headless.ts` →
  `faux-provider/harness.ts`, `ev40-harness-extension.ts` →
  `faux-provider/extension.ts`, `tui-retry.py` → `faux-provider/tui-retry.py`,
  `test/ev41-tui.py` → `faux-provider/ev41-tui.py`; re-point the imports and the
  pty spawn path; re-point `HARNESS_EXTENSION`. **No semantic edit:** the moved
  pty scripts keep their own `Screen`/`Session` bodies verbatim (the substrate
  extraction is *not* in this commit), `ev43/` still exists, and
  `test/ev43-reachability.test.ts` is untouched. `bun test` green with the same
  test count and the same arm counts.
- **Commit 2 — the declared deltas.** Delete `ev43/`; extract `pty_kit.py` with
  the corrected relative-left `D` clause and thin both runners over it; add the
  `EV40_ERROR_MESSAGE` knob and the `CONTINUATION_PROMPT` export; tighten
  `secondMessagePresent`; re-point and re-encode `test/ev43-reachability.test.ts`
  (§6.1) and rewrite its header; add `test/faux-provider-shape.test.ts`; sweep
  the comment citations (`extensions/parent-retry.ts:4`,
  `test/ev41-retry-e2e.test.ts:4,32`, `test/ev41-tui.py:4`,
  `test/faux-provider/tui-retry.py:4`, `test/ev40-live-gates.test.ts:147`) and
  the moved files' own provenance headers reworded so no retired path token
  survives under `test/` (`harness.ts:7`'s "Generalizes
  ev43/falsifier-headless.ts" and `extension.ts:1`'s ev43 citation cite
  `council/cards/EV-43.md` instead, and `tui-retry.py:4`'s "Based on
  ev43/falsifier-tui.py" is reworded the same way). `bun test` green.

Rationale for the boundary: the `D`-clause fix and the EV-43 re-encode are
*known* behavior changes, so they cannot sit in the "pure move" commit — and
`ev43/`'s deletion cannot either, because it forces the test re-point. A
functional split (pure move, then declared deltas) preserves the split's purpose
exactly and is the only decomposition in which commit 1 is green.

## 10. Out of scope — named boundaries (do not fold in)

- **No engine change.** `extensions/` changes only the `parent-retry.ts:4`
  comment.
- **No re-architecting the seat arm.** The seat-dispatch provider-error arm
  stays a Hub + `createRetrySupervisor` test on `test/stub-child.ts`. Turning it
  into a real `pi` child under a config-injected faux provider would change what
  it proves, add a live arm to FLLWUP-48's budget, and is a different card
  (§8.2's O7 finding, if satisfiable, is that card).
- **No CI wiring of `tui-retry.py` / the retired TUI scenario** — both stay
  manual; wiring them in would add ~10 minutes of pty runtime per suite run.
- **No new live test arm, no arm-count or arm-timeout change** (FLLWUP-48).
- **No `smoke/` change, no `test/stub-child.ts` change.**
- **No `council/cards/EV-43.md` (or any historical record) edit** —
  `git diff --stat main -- council/cards vault` must be empty for this card's
  work.
- **No user-visible copy; no `package.json` version bump** (test-only change).
- **No `vault/` write** — step 14 is an offer, routed, never hand-edited.

## 11. What the owner must produce

1. The plan under `docs/superpowers/plans/2026-09-17-FLLWUP-49-plan.md`
   (one plan, both commits), including the §8.1 `hasUI` disposition choice.
2. Commit 1 and commit 2 as specified in §9, pushed to the branch, PR opened.
3. The landed file set of §1/§3/§4/§5/§6/§7, with every sweep in §9's commit 2.
4. The full gate set (§12, in order), each result recorded verbatim with its
   real output — including the pty arm re-run **after** the `D`-clause fix
   (its green today may or may not depend on the wrong semantics).
5. The shape test red-at-base / green-at-head record.

## 12. Gates

The repo gate set (authoritative: `.github/workflows/gates.yml`; there is no
`docs/gates/GATE-EVIDENCE.md` in this repo), in order:

1. `bunx tsc --noEmit`
2. `bun test` (the EV-41 pty arm and the shape test are inside it)
3. `python3 council/validate.py`

Plus, for information: `bash council/preflight.sh FLLWUP-49` — the
branch-freshness clause is expected to FAIL mid-card as the known-by-construction
FLLWUP-27 artifact (a record commit advancing `origin/main` past the branch
cut); recorded verbatim, never used to weaken a criterion, and the step-11
re-run set remains `tsc` / `bun test` / `validate.py`.

All gates clear in full, regardless of diff size; no threshold lowered, no
finding suppressed.

## 13. Provenance

- Deliberation: `council/cards/FLLWUP-49.md` steps 2–5 (`owner` 22.1/22.3,
  `principal` 22.2/22.4, `skeptic` 22.5, `consolidator` 22.6).
- Skeptic objections O1–O10 and their actual results (step 4).
- `steward` ruling at step 6 (job-24), which amended the `goal` (applied by the
  orchestrator at `a448047`) and bounded the `driver.py` residual.
- Run-wide Phase-1 rulings (scope, ninth-file ordering note, run-scoped
  `--squash --admin --match-head-commit` merge with all five deterministic
  criteria, R1 union-merge reconcile, step-13 confirmation re-homed to
  `product-owner`).