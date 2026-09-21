# EV-80 — Follow-up review state packing: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `extensions/followup-state.ts` — a pure packer that builds the follow-up decision's Jev input from the candidate, every board entry on `boardPath`, and the run's not-yet-drafted siblings — budget-bounded with a declared drop record and a `sources` drift record.

**Architecture:** One new pure module, sibling to `extensions/gate-state.ts`, with a forked (not shared-core) pack loop that mirrors gate-state's drop mechanics; one test file `test/ev80-followup-state.test.ts` covering the spec §8 list (17 items). `gate-state.ts`, `gate.ts`, `gate-route.ts` stay byte-untouched — EV-80 only imports from them.

**Tech Stack:** TypeScript (strict, bun), bun:test, tmpdir fixtures via `fs.mkdtempSync`; the only repo-filesystem read used as a fixture is the read-only `PKG_ROOT` pin (headroom probe + caps-sum invariant).

**Spec:** `docs/superpowers/specs/2026-09-21-EV-80-design.md` (settled; the binding product-owner ruling of 2026-09-21 is recorded at the end of `council/cards/EV-80.md`).

## Global Constraints

- `buildFollowupState(candidate, repoRoot, siblings, boardPath)` — `boardPath` is a **required** 4th parameter (compile-time requirement; no derived default).
- Import edges fixed: `loadGatePolicy` (value) from `./gate.ts`; `estimateTokens` (value) + `ParsedCard` (type) from `./gate-state.ts`; `parseCardFile` (value) from `./gate-route.ts`. No other engine imports.
- Caps: candidate **2,000**, board **22,000** (ruling Q1, raised from 16,000), siblings **6,000**. Caps sum 30,000 < packaged `gateStateBudgetTokens` 32,000 — policy.json is NOT touched.
- Pair rule (ruling Q2, one module comment, near-verbatim): "The board and its cards are one resource; the cards dir is derived from `boardPath`, never from `repoRoot`." Goals resolve at `path.join(path.dirname(boardPath), "cards", "<id>.md")`.
- Budget seam: `loadGatePolicy(repoRoot).gateStateBudgetTokens`; absent → the packer's own single-line FAIL naming `gateStateBudgetTokens`; no code-side default; budget value never packed into the state.
- Section order fixed `candidate → board → siblings`; shapes: candidate `{title, goal}` (field-granular, stays non-empty); board `{id, title, state}` + `goal` for open (column ≠ `Done`); Done entries exactly `{id, title, state}`; siblings `{title, goal}` in `(title, goal)` canonical order, **no `id` key**.
- Sibling identity: duplicate sibling titles throw naming the title; sibling title == candidate title throws.
- Board reader mirrors `council/validate.py` `board_columns`: strip-then-match, em dash U+2014 only, entries before the first `## ` header are column `None` → not packed; hyphen-minus lines parse as nothing; duplicated ids keep every column, first occurrence wins for the packed entry; absent board → empty board section + `sources.board.present: false`.
- `sources = { board: { present, skippedLines }, cards: { missingGoal } }` is returned beside `drops`, **not hashed** (`!('sources' in JSON.parse(stateBytes))`); `missingGoal` is sorted, covering open ids whose resolved goal is empty (missing file or absent/empty frontmatter both degrade to `goal: ""` via `parseCardFile`).
- Determinism: `stateBytes = new TextEncoder().encode(JSON.stringify(stateWithoutSources))`; `stateHash = sha256(stateBytes).digest("hex")`; round-trip pin `JSON.parse(stateBytes)` deep-equals canonical `sections`.
- Never reads: git commands/diff, anything under runs/, network. Accessor canary: no `runs/`, `fetch(`, `".pi"` in module source.
- `FollowupState.drops` structurally assignable to `GateDropRecord[]` (gate-ledger.ts) — pinned by test.
- Justification language for the raised cap: "the kept entries carry real evidence" — never "the cut only drops stale work".
- Conventional commits (`feat(gate): EV-80 ...`); bump `version` in `package.json` (0.29.0 → 0.30.0) in the same PR.
- Gates in full, in order: `bunx tsc --noEmit`; full `bun test` (~101s; leave COUNCIL_INTEGRATION/COUNCIL_MCP_INTEGRATION unset); `python3 council/validate.py`; `bash council/preflight.sh EV-80`.

## Review Focus

- **Absent board read as "no duplicates found"** — `kept: 0, truncated: false` is byte-identical to genuinely empty; `sources.board.present` must make absence visible (test 11).
- **Board grammar drift** — a hyphen-minus entry line or a pre-header entry must never silently become an open card (test 10).
- **Board growth past the cap** — the real-board headroom probe (test 17) must go red before any consumer sees a silently cut pack of Done titles.
- **Sibling order leakage** — caller order is caller-discovered; canonical `(title, goal)` order pins the bytes (test 12).
- **Mode-off silent path** — under resolved `off`, `loadGatePolicy` returns the budget key as `undefined`; the packer must FAIL loudly naming the key rather than read `undefined` (test 6 arm i).

---

### Task 1: The module — `extensions/followup-state.ts`

**Files:**
- Create: `extensions/followup-state.ts`

**Interfaces:**
- Consumes: `loadGatePolicy` (gate.ts), `estimateTokens`/`ParsedCard` (gate-state.ts), `parseCardFile` (gate-route.ts).
- Produces: `buildFollowupState(candidate, repoRoot, siblings, boardPath): FollowupState`; `FOLLOWUP_SECTIONS`, `FollowupSection`, `FOLLOWUP_SECTION_CAPS`, `FollowupCandidate`, `FollowupBoardEntry`, `FollowupSiblingEntry`, `FollowupSections`, `FollowupDropRecord`, `FollowupState`.

- [ ] **Step 1: Write the failing test file** `test/ev80-followup-state.test.ts` covering spec §8 items 1–17 (structure below in Task 2).
- [ ] **Step 2: Run it — red** (`bun test test/ev80-followup-state.test.ts` — module absent).
- [ ] **Step 3: Implement the module** per spec §1–§7:

  - Header comment: pure packer, first engine reader of the board, forked-loop rationale, pair-rule comment.
  - Types as in the constraint list; `FOLLOWUP_SECTION_CAPS` exported (candidate 2000 / board 22000 / siblings 6000) with the ruling justification comment.
  - `validateCandidate(c, label)` — non-empty trimmed `title`/`goal`, throw naming `candidate.title` / `candidate.goal` / `siblings[i].*`.
  - Sibling pre-checks: duplicate titles throw naming the title; sibling title == candidate title throws; canonical sort by `(title, goal)`.
  - Board reader `readBoard(boardPath)`: mirrors `board_columns` — split lines; `## ` headers set the current column (stripped); entry lines (stripped `- `) failing `/^- ([A-Z]+-\d+) — (.*)$/` (U+2014) count into `skippedLines`; matching pre-header entries parse as column `null` and are not packed; first occurrence wins (state = first column); open = column ≠ `Done`.
  - Goal resolution: for open entries, `path.join(path.dirname(boardPath), "cards", id + ".md")` → `parseCardFile(md).goal`; missing file / empty goal → `goal: ""` and the id into `missingGoal` (sorted at the end).
  - Budget: `loadGatePolicy(repoRoot)`; `gateStateBudgetTokens === undefined` → single-line FAIL naming the key. Frame `{candidate:{},board:[],siblings:[]}` measured first; frame > budget → throw.
  - Forked pack loop (same shape as `buildGateState`, no wiki side effect): forward-greedy cap fill per field (candidate) / per entry (board, siblings); `truncated: false | "cap" | "budget"`; on budget bind largest whole-entry prefix, later sections dropped entirely (`kept: 0, measuredTokens: 0`). Candidate degenerate defense: if zero fields fit the cap, hard-truncate the first field to a non-empty prefix (halving loop) — recorded as `"cap"`, `kept: 1`.
  - Return: `{ stateBytes, stateHash, drops, sections, sources }` — hash over `stateBytes` only; `sources` built from the board read, `missingGoal` sorted.

- [ ] **Step 4: Run the test file — green.**
- [ ] **Step 5: Commit** `feat(gate): EV-80 — follow-up review state packer (candidate + board + siblings)`.

### Task 2: The test file details (executed inside Task 1's Step 1, refined to green)

One file `test/ev80-followup-state.test.ts`, bun:test, tmpdir fixtures; shared builders:

- `tmpRepo(opts)` — mkdtemp root + `<root>/$CONFIG_DIR_NAME/council/gate/policy.json` (default budget 1,000,000, `policyVersion/model/endpoint` valid); optional `.council.json` gate section + budget override.
- `boardFixture(root, boardRel, cardsDirRel, entries)` — writes a board file and card files; relocated pair support (board in a non-`council/` dir with its own sibling `cards/`, plus a decoy `<root>/council/cards/<id>.md` carrying a different goal — the discriminating fixture, spec §8 item 16).
- The R0 headline proofs (hash changes on board-card change and sibling change; unchanged on unrelated repo file change incl. an `extensions/gate.ts` bytes rewrite inside the fixture tree) run over the single relocated pair.

Test list (spec §8):

1. Pack shape + section order (`Object.keys(parse(stateBytes))` = FOLLOWUP_SECTIONS).
2. Byte/hash identity across calls + independent sha256 recompute.
3. Round-trip pin: `JSON.parse(stateBytes)` deep-equals canonical `sections`; `!('sources' in parsed)`.
4. Hash sensitivity: open-card goal change → changes; sibling change → changes; Done-card change → unchanged; unrelated repo file (incl. `extensions/gate.ts` bytes) → unchanged; sources change (present vs absent board, same board content emptiness) → hash unchanged.
5. Accessor canary: module source contains no `runs/`, `fetch(`, `".pi"`; runtime sentinel under `<root>/.pi/council/runs/` never in `stateBytes`.
6. Budget two-arm: mode off + absent key → packer's own FAIL naming `gateStateBudgetTokens`; mode advisory + absent key → loadGatePolicy's FAIL surfaces (message names the resolved mode).
7. Budget mechanics: tiny budget → board `"budget"` cut, siblings `kept: 0, measuredTokens: 0`; cap overfill → board `"cap"` trim, siblings untouched; frame > budget → throw.
8. Degenerate over-budget candidate → non-empty prefix truncate (per-field, and first-field-itself-over-cap arm).
9. Validation FAILs naming `candidate.title` / `candidate.goal`; missing `boardPath` is a compile-time type error (`@ts-expect-error` probe, never invoked).
10. Board-grammar parity: U+2014 strip-then-match; hyphen-minus line → skipped, count 1, no entry; pre-header entry not packed; duplicate ids → one entry, first-occurrence column wins.
11. Drift visibility: absent board → `present: false`, kept 0, `truncated: false`; skipped-line count; open id with absent card file and with empty-goal frontmatter → `missingGoal` (sorted).
12. Sibling canonicalization `(title, goal)`; duplicate-title throw naming the title; sibling==candidate-title throw; structural no-`id` pin (`Object.keys` of a sibling entry = `["title","goal"]`).
13. Cross-module drop parity: equivalent shapes through `buildGateState` and `buildFollowupState` produce identical drop semantics (same `truncated` sequence pattern, cap-trim keeps a whole-entry prefix under cap, budget cut zeroes all later sections, both throw on frame > budget).
14. Done-entry shape pin: Done entries carry exactly `{id, title, state}`; open entries `{id, title, state, goal}`.
15. Caps-sum invariant: `FOLLOWUP_SECTION_CAPS.candidate + .board + .siblings < loadGatePolicy(PKG_ROOT).gateStateBudgetTokens` (through the loader, never a literal).
16. Discriminating cards-dir fixture: relocated `boardPath` with a distinctive goal in its sibling `cards/` and a different goal at `<root>/council/cards/`; assert the dirname-derived goal packs.
17. Headroom probe over the real board (`boardPath = join(PKG_ROOT, "council", "board.md")`, `repoRoot = PKG_ROOT`, minimal candidate, no siblings): every section's `measuredTokens` ≤ its cap AND no section is cap-truncated (`truncated !== "cap"`); `sources.board.present === true`. Reads packer output only.

### Task 3: Version bump + gates + PR

- [ ] **Step 1:** Bump `package.json` `version` 0.29.0 → 0.30.0.
- [ ] **Step 2:** Gate 1 `bunx tsc --noEmit` — clean.
- [ ] **Step 3:** Gate 2 full `bun test` — all pass, no skips beyond the standing opt-ins.
- [ ] **Step 4:** Gate 3 `python3 council/validate.py` — clean.
- [ ] **Step 5:** Gate 4 `bash council/preflight.sh EV-80` — PASS.
- [ ] **Step 6:** Commit bump, push branch `ev-80-followup-state-packer` to origin, open PR to `main` via `gh` (title `feat(gate): EV-80 follow-up review state packing`; body references EV-80 and the spec path). Do not poll CI; do not merge.
