---
id: FLLWUP-45
title: Navigator attempt-awareness for retried dispatches
state: Deliberating
owner: null
epic: EPIC-9
goal: A retried dispatch's attempt transcripts are reachable from the navigator, and the backoff row's label matches the attempt it denotes.
---

## Intent

Three items produced by EV-42's shipped per-attempt substrate: per-attempt
transcript browsing is currently unreachable, `navigator.ts:869`'s
`openTranscript` path resolves `manifest.id` rather than an attempt's session,
and the live backoff row's tail-versus-label mismatch sits at
`navigator.ts:335/405/430`. One subject, one file — steward dispositioned them
as a single `Backlog` residual.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R3 (FLLWUP-44, carried into this card).** The backoff surface's failure
  line is `The provider returned an error.` (`formatRetryFailure`,
  `extensions/parent-retry.ts:125-126`), re-shown **per backoff episode**;
  R5's countdown string (`Retrying in 2s (attempt 2 of 3) — Esc to abort`) and
  its terminal exhaustion string (`Retries exhausted after 3 attempts. The
  provider kept failing. Press Enter to try again.`) remain **binding and
  unchanged**. Any navigator label or copy this card introduces must be
  consistent with that vocabulary and must not contradict it. If this card's
  surface introduces **new user-visible copy**, that copy is open-judgment
  under the authority map — the runner returns `ESCALATION` with the drafted
  string rather than shipping an unruled one.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **sixth** card of the run.
  - Merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>` per
    `features-deliver.md`; all five deterministic criteria must hold.
  - **R1** — union-merge reconcile is the sanctioned non-fast-forward repair,
    never force.
  - Step-13 follow-up confirmation is re-homed to `product-owner`: draft,
    never write an unapproved follow-up, and never dispatch `product-owner`
    from this container.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card is spec-ambiguous and carries design
  judgment: the `goal` fixes the outcome (attempt transcripts reachable; the
  backoff row's label matches the attempt it denotes) but leaves open *how*
  a person reaches a non-latest attempt's transcript (tree rows vs. progress
  surface vs. a picker), what identity the tree rows/selection key on once a
  job has N attempts, and what the live backoff row should show while the
  manifest pairs a pending ordinal with the previous attempt's session. That
  is a deliberation-plus-ruling path, not an implementation choice — per
  council.md step 1 the card runs steps 2–6 then 7–14. It is **not**
  cross-seam in the repo-area sense (one file, `extensions/navigator.ts`,
  plus its tests), but it is `spec-ambiguous` and `design-judgment`, either
  of which is sufficient for a full council.
- **Surface-touching: yes (recorded).** The deliverable changes what a person
  sees and does in the `/council-tree` inline surface: the row label that
  currently reads `attempt N/M` (`navigator.ts:370-373`), any per-attempt
  affordance, and any copy that affordance needs. A full-council,
  surface-touching card seats `designer` as a third generator in steps 2–3.
- **Rulings applied (Phase 1, binding), not reweighed:**
  - **R3 (carried from FLLWUP-44)** is re-quoted verbatim in this card's
    `## Orchestrator rulings` section: the failure line is `The provider
    returned an error.`, re-shown per backoff episode; R5's countdown and
    exhaustion strings are unchanged. This card may not contradict that
    vocabulary, and any **new** user-visible copy it introduces is escalated
    with the drafted string rather than shipped unruled.
  - Scope = the nine promoted EPIC-9 residuals, EPIC-9 stays `Done`;
    sequencing is `steward`'s (sixth card); merge =
    `gh pr merge <PR> --squash --admin --match-head-commit <X>`; step-13
    follow-up confirmation is re-homed to `product-owner` (draft, never
    write an unapproved follow-up); R1 (union-merge reconcile) is the
    sanctioned non-fast-forward repair, never force.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches
  `owner`, `principal`, `designer`, `skeptic`, `consolidator`, and `judge`.
  All six resolve from the packaged seat set
  (`/home/tista/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/*.md`);
  this checkout has **no `.pi/agents/`** directory, so nothing shadows them
  and no repo-local override exists. `product-owner` / `steward` are never
  dispatched by this container (escalation-only). No `Unknown seat` is
  possible on the seats named here.
- **Environment (facilitator-read, first-hand):** main checkout clean;
  `HEAD = origin/main = b340b6694c9bb228cbba6dbc13d1dbfe6ecf8cb7`. FLLWUP-40
  (`8dbe038`), FLLWUP-43 (`e25b813`), FLLWUP-42 (`aff1101`), FLLWUP-41
  (`9adca28`), FLLWUP-44 (`05ae348`) merges are ancestors of `HEAD` with
  their cards `Done`. This card is `Ready` at the start of the run; no
  `Needs Human` state and no outstanding ruling — deterministic merge check
  criterion 5 holds at the start of the card.
- **Gate set for this repo (authoritative; `docs/gates/GATE-EVIDENCE.md`
  does not exist here):** `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py` (AGENTS.md §Commands + `.github/workflows/gates.yml`).
  `council/preflight.sh FLLWUP-45` is run as a card-aware check, but its
  branch-freshness clause (FLLWUP-27) is known to FAIL by construction once
  a facilitator record commit advances `origin/main` past a branch cut; per
  the standing known-artifact note the step-11 re-run set is `tsc` /
  `bun test` / `validate.py`. This repo defines no database/import/server
  gate; `COUNCIL_INTEGRATION=1` stays gated and is not run. Criterion 2 is
  read as `gh pr checks <PR> --json name,state,workflow` keyed on
  `workflow`; `gates` must appear `SUCCESS`.
- **Grounded facts carried into deliberation (inputs, not a settled design;
  the Council verifies them at this tree):**
  - EV-42's shipped substrate exposes one accessor:
    `attemptEntries(m: RunManifest)` (`extensions/runs.ts:119-121`) returns
    `m.attempts ?? [{ attempt: m.attempt ?? 1, sessionId: m.sessionId }]`.
    `RunManifest.attempt?: number` and
    `RunManifest.attempts?: { attempt; sessionId }[]` are documented at
    `extensions/runs.ts:56-64` as present only when `attempt > 1`, and
    `attempts` is the **settled prefix** of completed attempts (appended at
    settle, before the retry hook advances the ordinal — `extensions/hub.ts:354-363`).
  - `findSessionFile(repoRoot, runId, sessionId)` (`extensions/runs.ts:155-172`)
    resolves a session id to its `.jsonl`. Attempt 1's session id is the
    **job id** (the dispatch passes `sessionId: jobId`, `extensions/hub-tools.ts:250`);
    attempt N≥2's session id is `` `${jobId}-attempt${n}` ``
    (`extensions/hub-tools.ts:269-270`).
  - The manifest pair during backoff is **not** `(pending ordinal, that
    ordinal's session)`: `writeJobManifest` gates `attempt` and `attempts`
    on `attempt > 1`, so while `state === "retrying"` for attempt N+1 the
    manifest reads `attempt = N+1` with `sessionId` still = attempt N's
    session (`extensions/hub.ts:132-137` and the comment there: pairing
    `{attempt: 2, sessionId: <attempt 1's id>}` is called out explicitly).
  - `extensions/navigator.ts`: `keyFor` returns `manifest.sessionId`
    (`:334-336`); `tailRead` looks up `findSessionFile(..., node.manifest.sessionId)`
    (`:339-341`); the row label appends `` attempt ${m.attempt}/${this.maxAttempts} ``
    when `m.attempt > 1` (`:370-373`); `render()` pushes
    `manifest.sessionId` into the controller row list (`:405`) and selects on
    `controller.selectedSessionId === node.manifest.sessionId` (`:429-430`);
    the inline progress view resolves `findSessionFile(runId, selectedSessionId)`
    (`:459-466`); the legacy modal `openTranscript` resolves
    `findSessionFile(repoRoot, runId, node.manifest.id)` (`:869`) — the job
    id, which equals attempt 1's session id but **not** a retried attempt's.
  - The tree renders **one row per job** (`flattenTree(buildTree(readManifests(...)))`,
    `navigator.ts:344-352`), so with EV-42's cardinality A there is exactly
    one navigator row per retried dispatch and no row per attempt.
  - `maxAttempts` is injected at init time as the retry-policy denominator
    (`navigator.ts:321, 330`; `ROWS_MAX` etc. unchanged).
  - The card's three specifics (unreachable per-attempt browsing;
    `openTranscript` resolving `manifest.id`; the live backoff row's
    tail-versus-label mismatch at `:335/405/430`) are the subject; the
    EV-42 wiki page [[per-attempt-provenance]] and
    [[council-job-tree-inline]] are the grounding pages.

### Step 2 — independent first pass (round 1)

