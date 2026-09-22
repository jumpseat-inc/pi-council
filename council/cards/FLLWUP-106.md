---
id: FLLWUP-106
title: The usages procedure forbids inventing framing around the tool's stderr
state: Deliberating
owner: null
epic: EPIC-15
goal: council/procedures/usages.md instructs the agent to surface every non-empty stderr line from usages.py verbatim, with no added prefix such as a warning glyph and no invented cause, and to state only what the line itself reports.
---

## Intent

`council/procedures/usages.md` says to surface the tool's printed summary and
its `!` limitation lines verbatim, but it does not classify a non-`!` stderr
line. In the run behind this epic, the warning `usages: could not write cache: …`
was wrapped in an invented `⚠️ One non-fatal issue:` prefix with an appended
cause and likelihood the procedure never authorized. The gap outlives the
specific warning: once the cache-ordering bug is fixed, the next non-`!` stderr
line can be framed the same way. This card makes the verbatim rule explicit and
routes system-status signals into the limitations block instead of an invented
narration.

## Acceptance

- A paragraph appended after `council/procedures/usages.md`'s `**Report.**`
  section: any non-empty stderr line is quoted verbatim; no `⚠️`/`!` prefix is
  added to a line that does not itself carry one; no cause, consequence, or
  "non-fatal issue" count is asserted beyond what the tool printed;
  system-status signals are described as uninterpreted tool output.
- The paragraph names the intake's own failure mode as the worked example —
  the seat wrapped `usages: could not write cache:` in `⚠️ One non-fatal issue:`
  and appended an invented likelihood — so the rule is pinned to a real case,
  not an abstraction.
- A mechanical pin in `test/` asserts the procedure contains the literal `⚠️`
  in a prohibition context and the phrase `verbatim` for stderr, so the rule
  cannot be dropped silently.
- `council/procedures/usages.md`'s existing `!`-limitation sentence and the
  `OPENROUTER_MANAGEMENT_KEY` hard-gate paragraph are unchanged; the edit is
  additive, and `bun test test/procedures.test.ts` (or the procedure-count pin
  covering registration) stays green.
## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, this card.** The human authorized, for this run
  only, the admin-bypass merge `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA merge-check
  criterion 2 (`gates` workflow `SUCCESS`) was read against. Not extended to any
  later run; a SHA mismatch is a HALT, not a retry.
- **R2 — build order.** EPIC-15 runs serially: BUG-2, then FLLWUP-105, then
  FLLWUP-106. One runner at a time; never two against the board.

## Run record (features-deliver / FLLWUP-106 — EPIC-15)

### Step 1 — gate, mode, surface bit (facilitator)

- **Card state promoted `Backlog` → `Ready` at container start.** Basis: the
  orchestrator's dispatch names this card explicitly with its Phase-1 rulings
  and binding acceptance (chain-promotion cadence,
  `vault/wiki/chain-promotion.md` — promotion trigger observed, not decided:
  predecessor FLLWUP-105 merged `a0b27ca` (PR #105) is on local `main`,
  `python3 council/validate.py` clean). This container is the only runner in
  flight (R2); single-writer discipline holds.
- **Execution mode: `Deliberate`**, recorded on this dispatch's ROOT manifest
  (EV-68). Full path, steps 2–14. The full-vs-mechanical judgment is not made —
  a recorded mode is authoritative (council.md step 1). Roster: `owner`,
  `principal`, `designer`, `skeptic`, `consolidator`, `judge`; ruling seats are
  never dispatched by this container.
- **Surface-touching: yes.** The deliverable is user-facing copy on the
  `/usages` person surface: the appended paragraph in
  `council/procedures/usages.md`'s `**Report.**` section changes what a person
  is told when the tool's stderr carries a non-`!` line — the invented
  `⚠️ One non-fatal issue:` framing this card forbids is exactly a mis-told
  report. On a full-council card this seats `designer` as a third generator in
  steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine packaged
  seat files are present in the installed package clone (`council/agents/`),
  and no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them.
- **Environment:** step-0 preflight skipped per the autonomous-run substitution
  (Phase 0 cleared it). `python3 council/validate.py` → `All council artifacts
  valid`. Local `main` == `origin/main` at `8d47637` before this card's first
  record push.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (run on PR via
  the `gates` workflow). Card-specific acceptance adds the mechanical pin in
  `test/` (the literal `⚠️` in a prohibition context and `verbatim` for
  stderr), requires the FLLWUP-105 remediation sentence and the
  `OPENROUTER_MANAGEMENT_KEY` hard-gate paragraph unchanged, and keeps
  `test/usages-procedure.test.ts`'s existing three-literal pin green. Owner
  gates met in full regardless of change size.
- **Rulings applied here (cited, not re-asked):** R1 — merge authorization is
  run-scoped, but the merge is the orchestrator's act; this container opens the
  PR, gets `gates` green on the PR head, and reports `DONE` with the PR number
  and head SHA. R2 — serial build order (BUG-2 at `59fad63` and FLLWUP-105 at
  `a0b27ca` both merged; this card is the last link in the chain).
- **Decisions gate:** `active` per `.council.json` `gate.mode`, with the known
  `noul` answer-shape drift (FLLWUP-104) making gate calls fail mechanically.
  Expected; a failed gate call is not re-run. No ruling on this card face
  pre-authorizes step-13 follow-ups, so any candidate that surfaces is held by
  draft title and carried in this container's report for orchestrator
  ratification — no card is written before that confirmation.
- **Predecessor context (dedup inputs for step 13):** FLLWUP-107 and FLLWUP-108
  are open cards (filed by FLLWUP-105); BUG-2 holds four step-13 candidates by
  draft title — not this card's to touch, but checked for duplicate homes.
