# FLLWUP-50 — Supported refresh path for packaged council tooling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A consumer repo initialized against an earlier pi-council install is told at session start (non-fatally, once per drift condition, re-arming) that its packaged council tooling is out of date, and can bring that tooling up to the installed package's version through a documented, supported path (`/council-update`), without overwriting consumer-edited board, cards, or wiki.

**Architecture:** A shipped tooling/data classification constant in `extensions/scaffold.ts` (guarded by a set-equality test), a provenance record `<repo>/$CONFIG_DIR_NAME/council/scaffold.json` written by `scaffoldInto` on creation only, a new `extensions/council-update.ts` engine (plan/apply/backup/drift) behind a new TS command `/council-update` (dry-run by default, `--apply` writes `↑ behind`, per-file consent for `~ diverged`), a `session_start` drift notification, AGENTS.md #5/#6 additions, and a README command row.

**Tech Stack:** TypeScript (strict, bun), bun:test, `node:fs`/`node:crypto`, `@earendil-works/pi-tui` key matching for the TUI confirm modal.

**Spec:** `docs/superpowers/specs/2026-09-19-FLLWUP-50-design.md` (binding: R1–R6, steward Q2 + lifecycle policy; record corrections applied — 16 seed.treeDigests, P4 subsumed by P2-amended, 8 scaffold files).

## Global Constraints

- Tooling class = exactly `council/validate.py` + `council/cards/_template.md`; shipped constant, NOT repo-extensible (steward lifecycle). `preflight.sh` is data-class / report-only; copy must never claim the command updates it.
- No write under `vault/**`, `council/board.md`, `council/cards/*` (except the `_template.md` tooling write), `council/fixtures/**`, `$CONFIG_DIR_NAME/council/{procedures,agents}/`, or `mcp.json`. Package-side removals are reported (`local-only`), never deleted.
- This card must NOT modify packaged `validate.py`/`_template.md` bytes or reshape any seed tree (16 `seed.treeDigest` pins; 10-copy byte parity at `test/fllwup43-goal-oracle.test.ts:132/:144`). If a pin forces otherwise: STOP and report (spec I4).
- No hardcoded `.pi` — `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent` everywhere (convention #3).
- Paths: scaffold-relative keys are POSIX-normalized (`path.sep` → `/`).
- Headless safety: `--apply` skips all `~ diverged` in `-p`/`json` mode (no prompt); per-file accept available via repeatable `--accept <path>`.
- Engine-resolved validation stays forbidden (T2 pin): the consumer's `validate.py` copy is load-bearing (`ROOT = Path(__file__).resolve().parent.parent`).
- Drift notification: `session_start`, non-fatal try/catch, once per drift condition, re-arming on new drift, never blocks a session.
- Version NOT bumped on this card (bumps land at epic closes, per repo precedent).
- All tests: bun:test in `test/`, `fs.mkdtempSync` repoRoot-parameterized, never the real repo.

## File Structure

- Modify `extensions/scaffold.ts` — classification constants, record path/read/sha256 helpers, exported `renderScaffoldText`, optional `skip` filter, record write on creation.
- Create `extensions/council-update.ts` — plan/apply engine, diff, post-refresh validate runner, drift check (the whole refresh mechanism, no command wiring).
- Modify `extensions/index.ts` — register `/council-update` (flags, table render, TUI confirm modal, distinct validate block), `session_start` drift notification.
- Modify `AGENTS.md` — convention #5 record-type line, #6 consent-gated refresh restatement.
- Modify `README.md` — command table row (+ scaffold.json row in the repo-file table).
- Create `test/council-update.test.ts` — T1–T10.

---

### Task 1: Classification constants + provenance record in `scaffold.ts` (T4, record-on-creation, skip filter)

**Files:**
- Modify: `extensions/scaffold.ts`
- Test: `test/council-update.test.ts` (T4 + record tests; file created in this task)

**Interfaces (produced; later tasks consume):**
- `export const TOOLING_FILES: readonly string[]` — `["council/cards/_template.md", "council/validate.py"]`
- `export const DATA_FILES: readonly string[]` — `[".council.json", "council/board.md", "council/preflight.sh", "vault/CLAUDE.md", "vault/wiki/index.md", "vault/wiki/log.md"]`
- `export interface ScaffoldRecordEntry { sha256: string; packageVersion: string }`, `export type ScaffoldRecord = Record<string, ScaffoldRecordEntry>`
- `export function scaffoldRecordPath(repoRoot: string): string`
- `export function readScaffoldRecord(repoRoot: string): ScaffoldRecord` (malformed/missing → `{}`)
- `export function sha256Hex(data: Buffer | string): string`
- `export function renderScaffoldText(content: string): string` (export existing private fn)
- `scaffoldInto(repoRoot, scaffoldRoot, options?: { skip?: (rel: string) => boolean })` — default behavior unchanged; record written only when ≥1 scaffold-tree file was created.

- [x] **Step 1: Red test** — `test/council-update.test.ts` with:
  - T4 guard: walk `PKG_ROOT/council/scaffold`; assert `[...TOOLING_FILES, ...DATA_FILES].sort()` equals the walked file set (posix keys), and the two constants are disjoint. Also assert `find(council, "validate.py")` count is 10 and 16 fixture.json files contain `treeDigest` (O1 awareness).
  - Record-on-creation: `scaffoldInto(mkdtemp, SCAFFOLD)` → `scaffold.json` exists; entry for `council/validate.py` has `sha256 === sha256Hex(packaged bytes)` and a non-empty `packageVersion`; second `scaffoldInto` run → record bytes unchanged (no new entries).
  - Skip filter: consumer root with record containing `council/validate.py`; delete the consumer file; `scaffoldInto(root, SCAFFOLD, { skip: (rel) => rel in record })` does NOT recreate it and record is unchanged; without the skip option it IS recreated (plain non-clobbering semantics).
- [x] **Step 2: Run** `bun test test/council-update.test.ts` → FAIL (exports absent).
- [x] **Step 3: Implement** in `scaffold.ts`: constants, helpers, `skip` option, record merge+write (posix key normalization; digest over the **written** bytes — rendered for `preflight.sh`; `packageVersion` from `path.resolve(scaffoldRoot, "..", "..", "package.json")`, fallback `"unknown"`).
- [x] **Step 4: Run** tests → PASS. Run `bun test test/scaffold.test.ts` → still PASS (T6 baseline).
- [x] **Step 5: Commit** `feat(scaffold): tooling/data classification + scaffold.json provenance record (FLLWUP-50)`.

### Task 2: Refresh engine — plan + apply + backup (T1, T3, T5, T6, T7)

**Files:**
- Create: `extensions/council-update.ts`
- Test: `test/council-update.test.ts`

**Interfaces (produced):**
- `export type RefreshState = "unchanged" | "behind" | "diverged" | "removed" | "shadowed" | "local-only"`
- `export interface RefreshRow { rel: string; state: RefreshState; tooling: boolean; matchesPackaged?: boolean }`
- `export interface RefreshPlan { created: string[]; rows: RefreshRow[] }` — `created` = actual creations when `create: true`, planned creations when `false` (nothing written either way unless `create: true`... see below).
- `planRefresh(repoRoot, scaffoldRoot?, opts?: { create?: boolean }): RefreshPlan` — with `create: false` (dry-run) writes NOTHING; rows cover existing files; planned creations listed in `created`. With `create: true`, runs `scaffoldInto` with `skip(record-keys)` (so a record-known deleted file is NOT silently recreated → `removed` row instead).
- State logic per scaffold file `rel` (consumer bytes `c`, packaged rendered bytes `p`, recorded digest `r`):
  - `c === p` → `unchanged` (whether or not recorded — "matches-current")
  - `r && sha256(c) === r` → `behind` (pristine-stale)
  - else → `diverged` (consumer-edited OR no record — the bootstrap carve)
  - missing ∧ recorded → `removed`; missing ∧ unrecorded → cannot occur after the create pass.
- `… shadowed` rows: packaged procedures with a same-named override at `<repo>/$CONFIG_DIR_NAME/council/procedures/<name>.md`; `matchesPackaged` = byte equality. `· local-only` rows: record keys not shipped anymore whose consumer file exists.
- `applyRefresh(repoRoot, scaffoldRoot?, accepts?: ReadonlySet<string>): ApplyResult` — runs the create pass, then writes ONLY tooling rows: all `behind`, plus `diverged` where `accepts.has(rel)`. Timestamped backup of each overwritten file at `<repo>/$CONFIG_DIR_NAME/council/scaffold-backups/<UTC-timestamp>/<rel>` before the write; record entries updated to the new (packaged) digest only for written files. `export interface ApplyResult { created: string[]; written: string[]; skippedDiverged: string[]; backups: string[]; backupDir: string | null }` (`backupDir === null` when nothing written).
- `packagedBytes(scaffoldRoot, rel): Buffer` — rendered for `preflight.sh`, raw otherwise.

- [x] **Step 1: Red tests** (helpers: `seedConsumer()` — scaffoldInto + overwrite tooling with stale bytes + delete `scaffold.json` to simulate the pre-record ESC-3 population; `writeRecord(root, entries)`):
  - T1 bootstrap: seeded repo (stale tooling, edited board/card/wiki, no record) → `planRefresh(create:false)` reports both tooling files `diverged`, consumer bytes untouched; `applyRefresh(..., accepts = both)` → tooling bytes == packaged, board/cards/vault byte-identical, record carries new digests, backups exist.
  - T3 three states: three roots (pristine-stale+record, hand-edited+record, matches-current+record) → `behind` / `diverged` / `unchanged`; flag-less `planRefresh` leaves all bytes identical.
  - T5 idempotence: apply twice → second `written: []`, no new backup dir, bytes unchanged.
  - T6 non-clobbering: after apply, plain `scaffoldInto(root, SCAFFOLD)` → all skipped, record + bytes unchanged.
  - T7 override: local `procedures/council.md` (differs) + `procedures/` copy matching packaged bytes → `shadowed` rows with `matchesPackaged` false/true; apply (accepts = tooling) → zero byte changes under `$CONFIG_DIR_NAME/council/procedures/` and `mcp.json`.
- [x] **Step 2: Run** → FAIL (module absent).
- [x] **Step 3: Implement** `extensions/council-update.ts` per the interfaces above (row order: created, tooling sorted, data sorted, shadowed, local-only).
- [x] **Step 4: Run** → PASS. `bun test test/scaffold.test.ts` → PASS.
- [x] **Step 5: Commit** `feat(scaffold): /council-update plan/apply engine with consent-gated tooling writes (FLLWUP-50)`.

### Task 3: False-green pin + post-refresh validate runner (T2)

**Files:**
- Modify: `extensions/council-update.ts` (add `runPostRefreshValidate`)
- Test: `test/council-update.test.ts`

**Interfaces:** `export function runPostRefreshValidate(repoRoot: string): { ran: boolean; status: number; output: string; error?: string }` — `spawnSync("python3", ["council/validate.py"], { cwd: repoRoot })`.

- [x] **Step 1: Red test** — T2: temp root, `scaffoldInto`, corrupt `board.md` (drop a card line), run the documented invocation → `status !== 0`, stdout contains `FAIL:`, and does NOT contain `All council artifacts valid`.
- [x] **Step 2: Run** → T2 passes already (pin, reds any future "resolve from package" design); `runPostRefreshValidate` absent → compile of its test fails red. Implement, run → PASS.
- [x] **Step 3: Commit** `test(scaffold): pin the consumer-root false-green trap; post-refresh validate runner (FLLWUP-50)`.

### Task 4: Drift detection for `session_start` (T9)

**Files:**
- Modify: `extensions/council-update.ts`
- Test: `test/council-update.test.ts`

**Interfaces:** `export function checkToolingDrift(repoRoot: string): { drifted: string[]; message: string | null }` — tooling files existing on disk whose bytes ≠ packaged; state persisted at `<repo>/$CONFIG_DIR_NAME/council/tooling-drift.state.json` as `{ "notifiedCondition": <sha> }` where the condition hash covers the drifted file list + their consumer digests; empty drift best-effort-deletes the state file; same condition → `null`; changed condition → message re-arms. May throw (caller wraps in try/catch).

- [x] **Step 1: Red test** — T9: seeded repo with stale tooling → first call `message !== null` naming both files + `/council-update`; second call `null`; fix one file to packaged → `null`; re-stale it with different bytes → message again, exactly once more.
- [x] **Step 2: Run** → FAIL; **implement**; → PASS.
- [x] **Step 3: Commit** `feat(scaffold): session-start tooling drift check, once per drift condition (FLLWUP-50)`.

### Task 5: `/council-update` command + session_start wiring (T10, output surface)

**Files:**
- Modify: `extensions/index.ts`
- Test: `test/council-update.test.ts`

**Interfaces (consumes Task 2/3/4):** command handler flow —
1. Parse args: `--apply`, repeatable `--accept <path>` (validated against `TOOLING_FILES`).
2. Dry-run plan (`create: false`) → emit table: glyph column (`=`/`↑`/`~`/`-`/`…`/`·`), posix rel, state note; protected class listed even when unchanged; legend line naming what the command may write and never writes (incl. `preflight.sh: reported, never written`).
3. No `--apply` → "nothing written" footer, return.
4. `--apply`: TUI + diverged tooling not pre-accepted → per-file confirm modal (diff shown, Enter=accept / Esc=skip, via `ctx.ui.custom` + `matchesKey`); headless (`ctx.mode !== "tui"`) → skipped. Then `applyRefresh`; emit `+ created` / `↑ written (backup: <path>)` / `~ skipped (--accept <path> to accept)`; if `written.length > 0` → **distinct block**: header `Post-refresh validation (python3 council/validate.py):` + validator output + status line.
5. `session_start`: non-fatal try/catch calling `checkToolingDrift`, `notify(message, "warning")` / `console.log` per house pattern.

- [x] **Step 1: Red test** — T10: README.md contains a `| `/council-update`` table row mentioning dry-run default; `extensions/index.ts` source contains the `council-update` description naming `validate.py`, `_template.md`, and the protected-class clause ("never touches your board, cards, or wiki") and does NOT claim to update `preflight.sh`.
- [x] **Step 2: Run** → FAIL. **Implement** command + wiring + minimal confirm modal. → PASS.
- [x] **Step 3: Commit** `feat(council): /council-update command + session_start drift notification (FLLWUP-50)`.

### Task 6: AGENTS.md #5/#6 + README scaffold.json row

**Files:**
- Modify: `AGENTS.md`, `README.md`

- [x] **Step 1:** #5 gains the scaffold.json record-type line (override-first-hit semantics honored as record, never merged/shadowed; written only on creation; refresh updates only after a consented write). #6 restated to name the consent-gated refresh write path as the one sanctioned exception. README: `/council-update` row (Task 5) + `scaffold.json` row in the repo-file table (commit).
- [x] **Step 2: Commit** `docs: AGENTS.md #5/#6 scaffold record + consent-gated refresh path (FLLWUP-50)`.

### Task 7: Full gates (in order)

- [x] `bash council/preflight.sh FLLWUP-50` → no FAIL
- [x] `bunx tsc --noEmit` → clean
- [x] `bun test` → all green (≈94s)
- [x] `python3 council/validate.py` → `All council artifacts valid`

Then: push branch, `gh pr create`.
