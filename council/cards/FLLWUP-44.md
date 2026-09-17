---
id: FLLWUP-44
title: Name the provider failure before the backoff countdown
state: Deliberating
owner: null
epic: EPIC-9
goal: During a retried parent turn's backoff the surface names the provider failure once, distinct from the countdown line, and the copy is ruled before it ships.
---

## Intent

EV-40's round-2 `designer` position — a transient line naming the failure,
distinct from the countdown — was endorsed by the owner but not adopted,
because R5's copy is binding and does not include it. R5 is a recorded human
Phase-1 ruling, so only the human re-opens the copy; steward dispositioned
this as a `Backlog` residual under the `Done` epic.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R3 (R5 re-opened — transient failure line).** R5's copy is re-opened for
  this card: the backoff surface may name the provider failure once, in a
  transient line distinct from the countdown line. The exact string is
  drafted by `designer` and the final copy ruled by `product-owner` before
  merge; R5's countdown string and its terminal exhaustion string remain
  binding and unchanged. This is the human re-opening R5, which R5 itself
  reserved to the human.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card is spec-ambiguous: `goal` fixes the
  outcome (the surface names the provider failure once, distinct from the
  countdown line, copy ruled before ship) but leaves the placement of the
  transient line, its transient lifetime, whether it re-shows per attempt,
  and the exact string open. R3 assigns the string draft to `designer` and
  the final copy to `product-owner`, which is a deliberation-plus-ruling
  path, not an implementation choice. Per council.md step 1 this card runs
  steps 2-6 and then 7-14.
- **Surface-touching: yes (recorded).** The deliverable is user-visible
  copy on the EV-40 backoff surface (the `RetryEditor` editor region in the
  TUI; the stdout countdown in headless). A full-council, surface-touching
  card seats `designer` as a third generator in steps 2-3.
- **Rulings applied (Phase 1, binding), not reweighed:**
  - **R3 (R5 re-opened — transient failure line)** applies directly and is
    quoted verbatim in this card's frontmatter `## Orchestrator rulings`
    section: the backoff surface MAY name the provider failure once, in a
    transient line distinct from the countdown line; the exact string is
    drafted by `designer` and finally ruled by `product-owner` before
    merge. Because this container may not dispatch `product-owner`, the
    draft is escalated to the orchestrator for the copy ruling, and the
    card does not ship an unruled string.
  - **R5's binding strings are unchanged and re-cited:** countdown
    `Retrying in 2s (attempt 2 of 3) — Esc to abort`; exhaustion
    `Retries exhausted after 3 attempts. The provider kept failing. Press
    Enter to try again.` Neither is opened by R3 (R3 opens only the
    transient failure line) and neither is editable by any seat.
  - Scope = the nine promoted EPIC-9 residuals, EPIC-9 stays `Done`;
    merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>`;
    step-13 follow-up confirmation is re-homed to `product-owner` (draft,
    never write an unapproved follow-up); R1 (union-merge reconcile) is the
    sanctioned non-fast-forward repair, never force.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches
  `owner`, `principal`, `designer`, `skeptic`, `consolidator`, and `judge`.
  All six resolve from the packaged seat set (`council/agents/*.md`); this
  checkout has **no `.pi/agents/`** directory, so nothing shadows them and
  no repo-local override exists. `product-owner` / `steward` are never
  dispatched by this container (escalation-only). No `Unknown seat` is
  possible on the seats named here.
- **Environment (facilitator-read, first-hand):** main checkout clean;
  `HEAD = origin/main = b90d60b03b2ac230ddda644b31b1c2037ecfe76a`;
  `gh` authenticated as `tistaharahap`. FLLWUP-40/43/42/41 merges are
  ancestors of `HEAD` with their cards `Done`. This card is `Ready` at the
  start of the run; no `Needs Human` state and no outstanding ruling —
  deterministic merge check criterion 5 holds at the start of the card.
- **Gate set for this repo (authoritative; `docs/gates/GATE-EVIDENCE.md`
  does not exist here):** `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py` (AGENTS.md §Commands +
  `.github/workflows/gates.yml`). `council/preflight.sh FLLWUP-44` is run
  as a card-aware check but its branch-freshness clause (FLLWUP-27) is
  known to FAIL by construction once a facilitator record commit advances
  `origin/main` past a branch cut; per the standing known-artifact note the
  step-11 re-run set is `tsc` / `bun test` / `validate.py`. This repo
  defines no database/import/server gate; `COUNCIL_INTEGRATION=1` stays
  gated and is not run.
- **Grounded facts carried into deliberation (inputs, not a settled design;
  the Council verifies them at this tree):**
  - The mechanism this card completes already shipped in EV-40
    (`extensions/parent-retry.ts`, merged). The backoff surface is
    `RetryController.lineText()` -> `RetryEditor.render()`, which appends
    exactly one extra editor-region line (`extensions/parent-retry.ts:250-256,
    296-307`). Headless prints the same countdown via
    `runHeadlessCountdown` (`extensions/index.ts:435-460`).
  - The parent-loop predicate `classifyParentTurnRetry`
    (`extensions/retry.ts:110-121`) retries ONLY the exact literal
    `Provider finish_reason: error` (`extensions/retry.ts:103`) and
    deliberately excludes every pi-retryable message; the pending errored
    message is available to the engine as `pendingError` at settle
    (`extensions/index.ts:461`).
  - R5's surface is the `CustomEditor` subclass (`RetryEditor`), whose
    countdown is a rendered line, never buffer text and never
    `setEditorText` (EV-40 PO ruling Q1 / Skeptic O6).
  - EV-40's own designer filed the non-adopted position this card adopts:
    "a transient toast/log line naming the failure, distinct from the
    countdown itself" (`council/cards/EV-40.md` step-2 designer position);
    the owner endorsed it ("I'd carry it into A") and principal did not
    engage it. R3 is the human re-opening R5 to permit it. The card
    delivers the surface naming plus its tests; the mechanism is already
    merged.
