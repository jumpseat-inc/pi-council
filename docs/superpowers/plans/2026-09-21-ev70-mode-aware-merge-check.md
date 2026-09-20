# EV-70 Mode-Aware Merge Check — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/features-deliver`'s deterministic merge check becomes mode-aware: a recorded `Direct` card merges on green owner gates + green CI with no judge verdict present; a `Verify` card with none HALTs; a card with no recorded mode HALTs — proven by a fixture run over real run-substrate forests.

**Architecture:** A new pure module `extensions/merge-check.ts` expresses the mode→criteria table (one function, three outcomes: merge / halt / no-merge). The mode input is read from the run substrate via EV-69's authority read — its throwing wrapper gets a pure discriminated core (`readCardMode`) so "no recorded mode" is distinguishable from "no ROOT" without string-matching errors. `council/procedures/features-deliver.md` carries the two verbatim HALT lines and the Phase 3 ledger wording; `test/prose.test.ts` pins the copy (FLLWUP-42 precedent), `test/ev70-merge-check.test.ts` is the fixture.

**Tech Stack:** bun:test, TypeScript strict, extensions/runs.ts readers (`readManifests`/`writeManifest`).

**Spec:** `council/cards/EV-70.md` (goal + Acceptance verbatim) + EPIC-13 settled design (EV-69's ratified record; R3, R4).

## Global Constraints

- Verbatim HALT lines (asserted exactly): `HALT: EV-<n> has no recorded execution mode — the merge check cannot infer one; route the card at the approval gate` and `HALT: EV-<n> — mode <mode> requires a goal evaluation and none is recorded`.
- The mode is read from the run substrate (ROOT manifest `mode` field, EV-68) via the real readers — never from a seat's report.
- Criterion 2 stays `gates` workflow SUCCESS keyed on the `workflow` field (`gh pr checks <PR> --json name,state,workflow`); the merge stays pinned with `--match-head-commit <X>` — byte-unchanged in meaning.
- Direct column = criteria 1, 2, 5 only (R4: the test suite is its only gate); Verify/Deliberate = all five, criterion 3 mode-scoped to the single Verify skeptic dispatch (Deliberate: verbatim five).
- Packaged procedure prose must not pin a tech stack (no `bun`/`bunx`/`tsc`/`typescript` tokens — prose.test.ts guard) and must not hard-reference repo-specific paths.
- Phase 3 change is the ONLY Phase 3 report change: the per-card entry names the recorded execution mode beside its merge basis.
- Card frontmatter state stays `In Progress` (facilitator's write); owner appends a run-record section only.
- Red-base record (FLLWUP-47 convention, seven fields) for the falsifiers, observed at base `6e369b2` (pre-mechanism base; base role `required`), head half `0 fail` at the PR head sha.

## Review Focus

- A `Verify` card with a *recorded* REJECT verdict must be a criteria-not-met (no merge), never the missing-record HALT — the HALT is only for an absent goal evaluation.
- Criterion 5 (no `Needs Human`/outstanding ruling) must still bind a `Direct` card — Direct relaxes criteria 3 and 4 only.
- The mode must not be passable as a parameter anywhere on the merge path — only the substrate read supplies it (test: flipping the manifest's `mode` bytes flips the decision).
- `effectiveModeForCard`'s throw messages must stay byte-identical (EV-69's fixture pins `/no ROOT manifest/`); the extraction is behavior-preserving.
- A `Deliberate` card with no goal-evaluation record must HALT too (the mode-scoped HALT names `Deliberate`), not just `Verify`.

---

### Task 1: Red — prose pins (test/prose.test.ts)

**Files:**
- Modify: `test/prose.test.ts` (append two tests after the FLLWUP-42 merge-check pin)

**Interfaces:**
- Produces: two red tests asserting (a) the merge-check section carries both verbatim HALT lines, the goal-evaluation rule, `only Direct merges with no judge verdict present`, and criterion 2's unchanged text; (b) the Phase 3 section names the recorded execution mode beside its merge basis with the example ledger line `EV-<n> — mode Direct, criteria 1, 2, 5 satisfied`.

- [ ] **Step 1: Write the two failing tests** (whitespace-normalized section slices, per the FLLWUP-42 precedent at test/prose.test.ts:256).
- [ ] **Step 2: Run** `bun test test/prose.test.ts` — expect exactly the two new tests FAIL (copy absent), all existing tests pass.

### Task 2: Red — the fixture (test/ev70-merge-check.test.ts)

**Files:**
- Create: `test/ev70-merge-check.test.ts`

**Interfaces:**
- Consumes: `readCardMode` (to be extracted in gate-route.ts), `evaluateMergeCheck` (to be created in extensions/merge-check.ts), `readManifests`/`writeManifest`/`ensureRunDir` (extensions/runs.ts — the real readers).
- Produces: arms — (1) headline pair: green Direct + no goal-evaluation record → merge with ledger basis `EV-<id> — mode Direct, criteria 1, 2, 5 satisfied`; otherwise-identical Verify → verbatim mode-HALT line; (2) mode-less ROOT → verbatim no-recorded-mode HALT line; (3) substrate authority: flipping the ROOT manifest's `mode` field flips the decision; (4) Deliberate: full five → merge; missing goal evaluation → HALT naming `Deliberate`; (5) Verify with recorded PASS → merge; recorded REJECT → no-merge [4]; skeptic objection → no-merge [3]; (6) Direct criteria 1/2/5 failures → no-merge; (7) `effectiveModeForCard` still throws byte-identically on absent ROOT.

- [ ] **Step 1: Write the fixture** (scratch repos via `fs.mkdtempSync`; forests via real `writeManifest`; mode read via `readCardMode(readManifests(...))` plus one `effectiveModeForCard` cross-check through the disk path).
- [ ] **Step 2: Run** `bun test test/ev70-merge-check.test.ts` — expect FAIL/error naming the absent `extensions/merge-check.ts` artifact (mechanism absent), not a typo.

### Task 3: Red-base record (FLLWUP-47, seven fields)

- [ ] **Step 1:** `git worktree add --detach <tmp>/ev70-base 6e369b2` (main checkout untouched).
- [ ] **Step 2:** Transplant `test/ev70-merge-check.test.ts` (new) + `test/prose.test.ts` (head version) from the worktree; symlink `node_modules`.
- [ ] **Step 3:** Run `bun test test/ev70-merge-check.test.ts` and `bun test test/prose.test.ts` in the base worktree; capture raw output verbatim (per-failure lines).
- [ ] **Step 4:** Remove the base worktree; record the seven fields in the PR body.

### Task 4: Green — implement

**Files:**
- Modify: `extensions/gate-route.ts` (extract `readCardMode` pure core; `effectiveModeForCard` becomes a thin wrapper with byte-identical throws)
- Create: `extensions/merge-check.ts` (`MergeCheckObservations`, `evaluateMergeCheck`, `mergeCriteriaFor`)
- Modify: `council/procedures/features-deliver.md` (HALT lines + goal-evaluation rule + Phase 3 wording)

- [ ] **Step 1:** Extract `readCardMode` in gate-route.ts; run `bun test test/ev69-verify-manifests.test.ts` — must stay green (throw messages byte-identical).
- [ ] **Step 2:** Create `extensions/merge-check.ts`; run `bun test test/ev70-merge-check.test.ts` — green.
- [ ] **Step 3:** Edit features-deliver.md; run `bun test test/prose.test.ts` — green.

### Task 5: Owner gates, in order

- [ ] `bash council/preflight.sh EV-70` — no `FAIL:` line.
- [ ] `bunx tsc --noEmit` — exit 0.
- [ ] `bun test` — full suite, 0 fail.
- [ ] `python3 council/validate.py` — `All council artifacts valid`.

### Task 6: Records, commit, push, PR

- [ ] Append owner implementation record to `council/cards/EV-70.md` (run-record section; frontmatter untouched).
- [ ] Commit `feat(council): EV-70 — the mode-aware merge check (Direct merges, verbatim HALTs)`; push branch.
- [ ] `gh pr create` against `main`, body carrying the red-base record.
