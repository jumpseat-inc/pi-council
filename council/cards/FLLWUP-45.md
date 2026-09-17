---
id: FLLWUP-45
title: Navigator attempt-awareness for retried dispatches
state: In Progress
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

Jobs: `owner` `job-12.1` (5.0m, 12 turns), `principal` `job-12.2` (5.0m, 14
turns), `designer` `job-12.3` (5.0m, 15 turns). All settled `done`. Each was
given only the card; no seat saw another's position.

#### Owner position (`job-12.1`) — verbatim

**Approach**

The three items, verified at this tree (`b340b66`):

1. **Per-attempt browsing is unreachable — confirmed.** The substrate exposes `attemptEntries(m)` (`extensions/runs.ts:119-121`) and the manifest carries `attempts` (`runs.ts:56-64`), but `navigator.ts` never imports `attemptEntries`; every resolution path keys on a single session: `keyFor` → `manifest.sessionId` (`navigator.ts:334-336`), `tailRead` looks up that session (`:339-341`), the controller row list is `manifest.sessionId`s (`:405`), selection compares `selectedSessionId === node.manifest.sessionId` (`:429-430`), and the inline progress resolves `findSessionFile(runId, selectedSessionId)` (`:459-466`). One row per job (EV-39 cardinality A), so there is exactly one browsable session per job — the latest — and attempts 1..N-1 are on disk but unwired.

2. **`openTranscript` resolves `manifest.id` — confirmed, with a finding.** `navigator.ts:869`: `findSessionFile(repoRoot, runId, node.manifest.id)`. Attempt 1's session id *is* the job id (`hub-tools.ts:250`, `sessionId: jobId`), so for a retried job the modal opens **attempt 1's transcript, not the final attempt** — silently wrong content, not just a wrong label. Additionally, the inline Enter path no longer routes through `openTranscript` at all: `activateSession` (`navigator.ts:564-572`) is passed to `installTreeEditor` (`:588`) but `CustomTreeEditor` stores `onActivate` (`focus-nav.ts:282`) and **never invokes it** — Enter calls `controller.enterProgress` (`focus-nav.ts:335-339`). So `openTranscript`'s only live caller is the legacy modal tree (`:520`); the `:571` call site is dead wiring.

3. **The backoff tail-versus-label mismatch — confirmed and it's worse than a label issue.** During backoff the job's state is `retrying`, `job.attempt` was already advanced to the **pending** ordinal N+1 by the supervisor's `onSettle` (`job-retry.ts:76-90`), but `job.sessionId` still points at attempt N's session — it only changes at respawn when the timer fires (`job-retry.ts:65-68`, `hub.ts:195-226`). The retrying manifest therefore reads `{attempt: N+1, sessionId: <attempt N's session>, attempts: [1..N]}` — pinned by `hub.test.ts:397-439`. So the row label says `attempt (N+1)/M` (`navigator.ts:372`, EV-39 R4, ruled) while `keyFor`/`setRows`/selection/`ensureView` all denote attempt N's session. Worse, `sessionId` **mutates mid-selection**: if progress is open on a retrying job when the timer fires, respawn rewrites `manifest.sessionId`, `setRows` pushes the new id (`:405`), `selectedIndex()` returns −1 for the stale selection (`focus-nav.ts:210-215`), the ▌ marker vanishes, and the cached view keeps rendering a session no row matches. That is a live glitch today, not a hypothetical.

**Design I would defend:**

- **Selection/row identity = the job id (`manifest.id`), not any session id.** Under cardinality A the job id is the only immutable identity across attempts; it is already the group key by ruling (per-attempt-provenance: "the dispatch's job id *is* the group key"). Re-key `keyFor`, `setRows`, the selection compare, and `ensureView`'s node lookup on `manifest.id`; sessions become a resolved attribute of the selected job. This dissolves the mismatch and the live-mutation glitch in one move. Honest caveat: ev8's T5/O6 test names "keyed by sessionId" — that ruling's principle is identity-not-index, and EV-42 changed the substrate's cardinality beneath it; I'd cite it as an evolution (the run-transcripts precedent) rather than treat the literal as immutable, and keep the `selectedSessionId` field name change as a cheap rename or defer it.
- **Reachability via the progress surface, not new tree rows and not a picker.** New tree rows violate R4 (one row per dispatch, already tested at `ev7-council-tree-widget.test.ts:180-199`). A picker adds a second interaction surface. The progress expansion is where a person already reads one attempt's transcript; stepping between attempts belongs there. When the selected job has >1 browsable attempt, `←`/`→` cycle attempts; the transcript view re-targets the chosen session and its title names the ordinal. Both arrows are unused in the progress surface (up/down move the cursor), so this is collision-free.
- **Browsable set:** `attemptEntries(m)` (settled prefix, legacy-safe) plus the live attempt when `state === "running"` and `manifest.sessionId` isn't in the list (running attempt N's session is appended only at settle, `hub.ts:354-363`). During backoff, `manifest.sessionId` **equals** `attempts[last].sessionId` (respawn hasn't fired), so "latest browsable" = `manifest.sessionId` in every state — that is also the fix for item 2: `openTranscript` resolves `manifest.sessionId` instead of `manifest.id`.
- **The live backoff row:** keep the ruled label exactly — `⏸ seat attempt 2/3 · retrying in Xs` (pending ordinal per EV-39's "the retrying manifest must read `attempt 2`", `hub.ts:215-217`, pinned by the ev7 test). State-machine evidence: the row cannot read the settled ordinal without contradicting the ruling, and after respawn it *would* read the pending ordinal anyway — so the label is consistent with the post-respawn frame. The mismatch is repaired not in the label but in the denotation: with job-id-keyed identity, Enter during backoff opens attempt N's transcript **and the title says so** (`attempt 1/3`), so no viewer is told they're looking at attempt 2's transcript when the session file is attempt 1's. The countdown stays `retrying in Xs` from `nextAttemptAt` (`navigator.ts:273-278`, `nextAttemptAt` cleared at respawn, `hub.ts:225` — the label self-expires at the state edge).

**Copy (open-judgment — escalate, do not ship unruled, per R3):**
- Progress title with attempts: `` `${jobId} ${seat} · attempt ${k}/${maxAttempts}` `` (e.g. `job-4.2 skeptic · attempt 1/3`).
- Progress header advertisement, only when browsable > 1: append ` · ←/→ attempts` to the existing EV-35 header line.
- Legacy modal title for a non-first attempt: append ` · attempt ${k}/${maxAttempts}` the same way.
Consistent with R3's vocabulary (`attempt N of M` vs my drafted `attempt k/N` — note the divider: R5 uses "of"; I'd flag that and draft `` `attempt ${k} of ${maxAttempts}` `` as the alternative if the judge prefers strict vocabulary parity).

**Testable claims** (each red on the current tree, green once fixed):

1. `test/ev7-council-tree-widget.test.ts` — *"selection survives an attempt respawn"*: build the widget with a controller, select a `retrying` job, rewrite its manifest to `running`/`attempt 2`/`sessionId: ${id}-attempt2` (simulating the timer fire), re-render; assert `controller.selectedIndex() >= 0` and the ▌ marker stays on that job's row. **Fails today** — selection is lost on the sessionId mutation.
2. `test/ev9-progress.test.ts` — *"Enter during backoff opens the latest settled attempt, titled with its ordinal"*: retrying manifest `attempt 2`, `attempts: [{1, id}]`, attempt-1 JSONL on disk; assert the progress title contains `attempt 1/3` and the body is attempt-1 content. **Fails today** — the title (`:463-465`) carries no attempt designation at all.
3. New `test/navigator.test.ts` case — *pure browsable-attempts resolution*: retrying attempt 2 → `[{1, id}]` and **not** the pending 2; running attempt 2 → `[{1}, {2, live}]`; settled attempt 3 → 1..3 ending at `manifest.sessionId`; legacy manifest → `[{1, sessionId}]` (via `attemptEntries`'s fail-closed fallback).
4. `test/navigator.test.ts` — *"modal transcript resolves the latest attempt's session"*: extract the resolution into a pure helper (openTranscript isn't exported); assert a retried-settled manifest whose `id ≠ sessionId` resolves the attempt-3 file, not the job-id file. **Fails today** — `:869` resolves `manifest.id`.
5. `test/ev7-council-tree-widget.test.ts:180-199` and the R5 strings in `test/ev40-parent-retry.test.ts:282` **must remain untouched and green** — they pin the ruled vocabulary this card may not contradict.

**Tradeoffs accepted**

- Re-keying on job id contradicts the *letter* of the O6 test name ("keyed by sessionId") while honoring its principle; I accept the evolution-note cost over a re-map hack that would chase a mutable key forever.
- Arrow-key attempt cycling puts new keys in `classifyProgressKey` (`focus-nav.ts`), widening the real blast radius beyond the card's stated "one file" — unavoidable under the honest-keymap rule (an unadvertised or raw-byte-compared key is exactly the EV-35 bug class). The alternative (no affordance) fails the goal.
- The dead `activateSession`/`onActivate` wiring is a finding I'm reporting, not scope I'm claiming: fixing it is a separate cleanup unless the card owner pulls it in.

**Split judgments**

- **Blocking:** (1) `openTranscript` resolving `manifest.id` — it shows the *wrong transcript* (attempt 1) for any retried job, silently; (2) selection loss on the retry→respawn sessionId mutation — a real live-surface bug, not polish; (3) Enter-during-backoff must not present attempt N's session under an attempt N+1 designation — title disambiguation is the minimum, since the label side is ruled.
- **Preference, not blocking:** `←/→` vs a letter key (`a`) for attempt cycling; whether the `selectedSessionId` field is renamed now or later; whether the legacy modal (FLLWUP-4's territory) gets the attempt-title suffix in this card or rides FLLWUP-4.
- **Genuinely open (escalate):** every new user-visible string above — drafted, not shipped, per R3.

#### Principal position (`job-12.2`) — verbatim

## Cross-seam reading

**What the contract actually is.** `RunManifest` carries four identity fields with *four different lifetimes* (`extensions/runs.ts:33-67`):

| field | cardinality | lifetime |
|---|---|---|
| `id` | job (the group key — `runs.ts:57` "one id / one manifest / one row"; EV-42 dropped `attemptGroupId` because the job id *is* the group) | stable for the row's whole life |
| `attempt` | dispatch ordinal | **pending** during `retrying`, current while `running`, final when settled |
| `attempts` | settled prefix 1..N, appended at settle (`hub.ts:354-363`), gated to `attempt > 1` (`hub.ts:132-137`) | monotone, append-only |
| `sessionId` | attempt-scoped pointer | **mutated at every respawn** (`hub.ts:210-217`); `=== id` only for attempt 1 |

The trio's consistency is state-dependent, and only one state is inconsistent:
- `running` @ ordinal N: `attempt = N`, `sessionId` = attempt N (live), `attempts = 1..N-1`.
- `retrying` @ pending N+1: `attempt = N+1`, `sessionId` = **attempt N**, `attempts = 1..N` (`hub.ts:134-136` calls this pairing out explicitly).
- settled @ N: `attempt = N`, `sessionId` = attempt N, `attempts = 1..N` complete.

The live backoff manifest on this tree is therefore `{attempt:2, sessionId:<jobId>, attempts:[{attempt:1,sessionId:<jobId>}]}` — `attempt` **names an attempt whose session does not exist yet**, and `sessionId` names the previous one.

The navigator reads `sessionId` as *three* identities at once: the tail-cache key (`navigator.ts:334-336`), the tail file (`:339-341`), the controller row list and selection (`:405`, `:429-430`), the progress view and its title lookup (`:449`, `:460-466`). It reads `m.attempt` for the label (`:372`) and `manifest.id` in the modal (`:869`). Five call sites, four fields. **EV-42's `attemptEntries(m)` (`runs.ts:119-121`) — shipped precisely so consumers stop deriving attempts from `sessionId` — has zero call sites outside `usage-store.ts:434`.**

Two consequences not in the card, both live:
1. **Row cardinality is job-scoped; its key is attempt-scoped.** `TreeFocusState`'s contract is "selected row keyed by sessionId, NEVER by index" (`focus-nav.ts:186-188`), pinned by `test/ev8-focus-navigation.test.ts:246-256` ("same session, NEW index"). At respawn the *key set changes*, not just its order: `selectedIndex()` → `-1`, so `isAtTop()` → true (Up **exits** the tree), `move(1)` jumps to row 0, and no row renders the `▌` marker (`navigator.ts:429-430`). Selection is silently discarded mid-retry.
2. **The progress view pins to the wrong attempt across a respawn.** `ensureView` early-returns while `viewFor.sessionId === sid` (`:461`), so a view opened on attempt 1 stays pinned to attempt 1's file while the row above it now reads `attempt 2/3`.
3. **Item 2 is dead code.** `openTranscript` has three references: `:520` (inside `open()`, which is itself never called), `:571` (inside `activateSession`, reachable only through `onActivate` — stored in `CustomTreeEditor` and never invoked; Enter routes to `enterProgress`, `focus-nav.ts:318`), and its own declaration at `:868`. `onActivate`/`openTranscript`/`CouncilTree`'s modal are unreachable from any key on the current tree; `tsconfig.json` has no `noUnusedLocals`, so this compiles. EV-35's record (`council/cards/EV-35.md:164,595`) and EV-42's spec §5 say the same.

## Blind spots

- **`owner` (inside the code):** sees `sessionId` as *the* session for a job, because in single-attempt code it is; sees `:372` as a one-line label edit. Cannot see that the selection key is a *documented, tested cross-module contract* (`focus-nav.ts:186-188` + ev8 T6), so the "one file" scoping in the step-1 record is false; and cannot see `onActivate`'s missing call site without reading two modules at once.
- **`designer` (inside the render path):** will treat this as an affordance problem and cannot see that the substrate accessor already exists with a fail-closed legacy fallback, nor that the selector's key set collides with EV-8's *binding* exclusivity ("consume only Up/Down/Enter/Escape", `council-job-tree-inline.md`) on the tree surface and with the enumerated `classifyProgressKey` test (`test/ev9-progress.test.ts:48-60`) on the progress surface. Cannot see the respawn flap at all: it is a model-layer event visible only as two renders 2s apart of the "same" row.
- **`copy`/`product-owner` (inside vocabulary):** will check new strings against R5's `Retrying in 2s (attempt 2 of 3) — Esc to abort` (`parent-retry.ts:111-112`) and R3's failure line, and cannot see that the defect is *denotation*, not wording — so a perfectly consistent new string can sit on top of content that belongs to a different attempt. Nor that the surface already carries three spellings of one fact (parent-retry `attempt 2 of 3`, hub-tools `attempts=2/3`, navigator `attempt 2/3` + `retrying in 2s`), so "consistent with R5" is not a well-defined bar today.

## Reframe

**Items 1 and 3 are one defect; item 2 is a second, latent one.** 1 and 3 are the same root cause — a row is keyed and labeled by two different attempt identities — surfacing at two transitions (settled-with-N-attempts; retrying-off-by-one). Item 2 is a hardcoded `manifest.id` in unreachable code.

The reframe I'd force: **separate the row's identity from the content's identity, and derive every label from the content it denotes.**

- **Row + selection identity := `manifest.id`** (job). The controller's `setRows` gets job ids; the `▌` marker, `selectedIndex`, and arrow routing become stable across every attempt transition by construction. `selectedSessionId` becomes an opaque row key and must be renamed/re-documented (`focus-nav.ts:186`) — a two-module change, not a one-file one.
- **Content identity := the attempt entry**, resolved through one extracted pure function over `attemptEntries(m)` ∪ the live `manifest.sessionId` (the settled prefix *lags* while `running`, so `attemptEntries` alone is not a live-latest accessor). The tail cache must key on `(jobId, attempt)`, not on the row key — otherwise the "obvious" fix serves attempt 1's `lastBlocks` under attempt 2's row.
- **Label ordinal := the denoted attempt's ordinal**, never `m.attempt` blindly. Under the current `>1` gate this makes the retrying-after-1 row read `⏸ job-3 owner · retrying in 2s` (no lie) — but that **collides with R4's shipped, test-pinned `attempt 2/3` on a retrying row** (`test/ev7-council-tree-widget.test.ts:180-189`). The alternative horn — keep `attempt 2/3` as the pending ordinal and name the shown attempt in the progress title — also needs new copy. One of the two needs a ruling; neither can be settled by prose.
- **Item 2 must not be patched at `:869`.** It is dead code, and `FLLWUP-4` (Backlog, `epic: null`, outside this run) will decide *delete or fix* that path. Fix it at the shared resolver (both call sites), or defer it to FLLWUP-4 explicitly. Hardening a path FLLWUP-4 may delete is wasted budget.

**Copy implied (open-judgment, escalates per R3):** clause 2 needs none. Clause 1 cannot be satisfied without it. Drafted, minimal-novelty: progress title `${id} ${seat} · attempt 2/3` (reuses the landed token `attempt 2/3`, new position); selector hint fragment in the existing progress hint line, `· [ ] attempt` (key choice is `designer`'s; `a` and `[`/`]` are unclaimed in both consumed sets, but the tree surface is closed by EV-8's binding exclusivity). R5's countdown, R3's failure line, and the navigator's existing `retrying in Ns` stay untouched. Because new copy requires `ESCALATION` with the drafted string, the design must minimize novelty — a rich picker is a pile of unruled strings.

## Testable claims

All four are RED on this tree as written:

1. **Denotation (new shape only).** Fixture `{state:"retrying", attempt:2, attempts:[{attempt:1,sessionId:"job-1"}], sessionId:"job-1", nextAttemptAt: now+7000}` + a real `job-1.jsonl`. Assert the attempt token rendered above the progress content denotes the attempt whose file `ensureView` opened. Today: row says `attempt 2/3`, file is attempt 1's. **Caveat that makes or breaks the falsifier:** the *legacy* shape `{attempt:2, attempts:undefined}` yields identical output pre/post fix (`attemptEntries` synthesizes `[{2, sessionId}]`), so a legacy fixture cannot be the RED test — and that carve-out must be pinned explicitly, exactly as EV-42 pinned `partial:"final-attempt-only"`.
2. **Selection stability across respawn.** `setRows(["job-1"])`, `enter()`, select; then advance the row's manifest to `sessionId:"job-1-attempt2"`, `attempt:2`, `state:"running"` and re-render. Assert `selectedIndex()` unchanged, `isAtTop()` false, `▌` still on the same row. Today, keyed on sessionId: `-1`, true, no marker, and one Down jumps to row 0.
3. **Item 2 falsifiable without a modal.** Extract and export the resolver; assert for a settled `{attempt:2, attempts:[{1,id},{2,"job-1-attempt2"}], sessionId:"job-1-attempt2"}` it resolves `job-1-attempt2`, not `node.manifest.id`. Today `:869` resolves attempt 1's session — unreachable from any key press, so no surface-level test can falsify it.
4. **Tail-cache scoping (falsifier for my own reframe).** After a respawn with a new file and appends, the running row's last-activity must come from attempt 2's JSONL. A fix that keys `tails`/`lastBlocks` on the row key (jobId) goes RED here; a fix that keys them on `(jobId, attempt)` passes.

**Judgments.** Blocking: (i) clause 1 cannot ship without new copy → `ESCALATION` with the drafted strings is the ruled path, and it should be raised before the design converges on an affordance; (ii) row/selection identity must become job-scoped with content identity attempt-scoped — otherwise items 1 and 3 are both still open; (iii) item 2 must be routed through a shared resolver or explicitly deferred to FLLWUP-4; (iv) the step-1 scoping claim "one file, `extensions/navigator.ts`" is false for (ii) — `focus-nav.ts`'s documented selection contract and the ev8/ev9 suites move with it. Preferences, non-blocking: selector on the progress surface rather than the tree; `selectedSessionId` renamed or re-documented rather than silently re-meaning; `retrying in Ns` left alone. Wiki: no page states the row-key identity — [[per-attempt-provenance]] documents cardinality A and [[council-job-tree-inline]] documents `attempt N/M`, but neither grounds this defect, so the fix should extend the former's related-list with the identity rule.

#### Designer position (`job-12.3`) — verbatim

Using `brainstorming` skill content as part of seat process. I'm in **deliberation mode as a generator** — I make no file edits, no rulings. Per the seat's `<grounding>` block I have read the card (full), `vault/wiki/index.md`, the four cited grounding pages, `extensions/navigator.ts`, `extensions/focus-nav.ts`, `extensions/runs.ts`, `extensions/hub.ts:100-360`, and the EV-7/EV-8/EV-9/EV-35/EV-36/EV-41/EV-43 test files. The brainstorm gate is moot here — this seat never implements; the skill's value is in the intent-grasping that follows from it, which I have.

---

## Design position

**Cardinality A is binding; do not flatten attempts into tree rows.** The settled wiki ([[per-attempt-provenance]]) and EV-42's ruling close the door: one job id, one manifest, one row. That decision holds across this card — attempts become a sub-dimension **inside the inline progress expansion**, never a sibling to jobs in the tree. The row stays a job; the progress opens attempts. A picker row per attempt would force cardinality B and re-open a debate EPIC-9 already settled, so I name that and decline it.

**The honest model a person gets:** *one row = one dispatch. Open progress → see the latest attempt live. Cycle attempts with `←/→` to see earlier attempts' transcripts. The tree row's `attempt N/M` label denotes the attempt whose transcript is currently tailable on the row.* That claim is the gulf-closing one — a person watching a retried dispatch asks "which attempt am I looking at, and how do I see a previous one?" and the surface answers both without making them reason about pending vs. settled ordinals.

**The label/tail mismatch during backoff is fixable copy-free.** Today `navigator.ts:370-373` reads `m.attempt` (the **pending** ordinal, N+1) while the tail at `:339-341` reads `m.sessionId` (the **completed** attempt's session, N). The hub comment at `hub.ts:132-137` calls out the pairing explicitly. The honest fix is to read the label from `m.attempts[m.attempts.length-1].attempt ?? 1` while `state === "retrying"` and from `m.attempt` otherwise. That makes the label denote what the tail is tailing in the card's called-out window. EV-39 R4's vocabulary (`attempt N/M`) is unchanged — only the data source flips per-state. No new copy, no escalation.

**The `openTranscript` bug at `:869` is latent but real.** EV-42's grep-backed finding: `onActivate` has no live call site; the path is dormant. The fix is still cheap and correct: resolve on the manifest's `m.sessionId` (the live tail's key) instead of `node.manifest.id` (attempt 1's session). The change is `node.manifest.id` → `m.sessionId` in `findSessionFile(repoRoot, runId, …)`. Same one-line.

**A new affordance belongs in the progress header, not the tree row.** Adding `←/→ attempt` to the progress header (next to the existing `↑↓ move · e expand · t thinking · f follow · g/G jump · esc back` per [[honest-keymap]]'s R-KEYMAP) makes the cycler a progress-domain operation. Tree focus (EV-8) and the tree-row seat field (EV-39 R4) are untouched — `←/→` while `surface === "tree"` are forwarded-unhandled (no behavior, no conflict with `Down` enters-tree-on-last-line). The cycler moves `controller.selectedSessionId` to that attempt's session id, and the inline tail (already keyed on `selectedSessionId`) rebinds on next render. `←` clamps at the first attempt; `→` clamps at the last. No wrap.

**The affordance's known honesty gaps, named openly:**

1. **At the one-row floor (termRows = 7, viewportRows = 1)**, the EV-36 projection suppresses the header; the cycler state is invisible. The cycler keys remain **consumed no-ops** at one-row — they neither fire nor forward (forwarding would let them reach the editor draft, which would silently mutate cursor position under the user's hands). Documented in the keymap as "active at multi-row progress; consumed no-op at one-row." The `←/→` keys are **not advertised** at one-row because the header that would carry them is suppressed. This is the same floor-rule pattern EV-9 already uses (`termRows ≤ 6` ⇒ Enter is consumed no-op), and it does not violate [[honest-keymap]] because the header is not asserting a behavior the keys do not have.

2. **At `termRows ≤ 6`** the surface is "tree" (EV-9 floor; Enter is consumed no-op, surface stays tree). `←/→` while in tree surface are forwarded to the editor (cursor moves), since the cycler is progress-domain and never reachable at this height.

3. **Legacy-window manifests (`m.attempt > 1 && m.attempts === undefined`)**: only one attempt is tailable, so `←` and `→` are consumed no-ops at multi-row too — and the header copy at multi-row must reflect that. R-KEYMAP discipline says "a key the header advertises must have well-defined behavior" — for a legacy-window job, advertising `←/→ attempt` is a lie. The honest header form is conditional: `←/→ attempt` only when `attemptEntries(m).length > 1`; the cycler keys remain in `classifyProgressKey` always (cleaner keymap) but the header copy is gated. The cycler keys' `viewHost.handleInput` returns a consumed no-op when there's only one attempt, matching the header.

**The header changes are new user-visible copy and escalate per R3.** I flag each:
- `←/→ attempt` — appended to the existing progress header when the selected row has >1 attempts.
- (Conditional) The header copy `g/G jump` stays as-is — no change.
- (Conditional) The tree-row label `attempt N/M` is unchanged in form; only its data source flips per-state during retrying.

**The label/tail fix is copy-free** (no new strings; only a per-state read source swap), so it does not escalate. The `openTranscript` fix is also copy-free (a one-token source change).

---

## Gulf closed

- **Evaluation gulf** for "which attempt am I looking at?" — closed by reading the label from the same source the tail reads during `state === "retrying"`. The row and its live tail agree, with zero new copy.
- **Execution gulf** for "how do I see an earlier attempt's transcript?" — closed by the `←/→` cycler in the progress header; the person cycles the bound session without leaving the surface. At multi-row, the affordance is visible and advertised; at one-row, it is consumed (no false promise).
- **Evaluation gulf** for "did the cycler work?" — closed by the live tail rebinding to the new attempt's session (the existing tail-read pathway already signals by emitting new last-activity content from the selected file).

---

## Principle and evidence

- **Cardinality A preserved** — `[per-attempt-provenance]`: "A retried dispatch mints one job id, one manifest, and one job-tree row … It does not mint a fresh id/manifest/session per attempt."
- **Signifier for "which attempt is on screen"** — `extensions/runs.ts:119-121` exports `attemptEntries(m)` as the single accessor; the navigator must consume it instead of duplicating the fallback (`[per-attempt-provenance]` "one accessor, not per-consumer derivation"). The label source becomes `attemptEntries(m)[length-1].attempt` during retrying.
- **Honest keymap discipline** — `[honest-keymap]` R-KEYMAP binds the header form; `classifyProgressKey` at `extensions/focus-nav.ts:67-99` already uses `matchesKey` (EV-35 fix). The cycler's `←`/`→` are arrow keys — they share `matchesKey` with the existing `Up`/`Down` classifier, so the CSI-u / modifyOtherKeys / kitty paths are honored by construction; no new bug class is introduced. The EV-35-style regression guard (handleInput-driven test per advertised key, with boundary clamps asserted as no-ops) applies to `←`/`→` directly.
- **One-row floor (EV-36 R3)** — `[one-row-floor]` and `extensions/focus-nav.ts:78-82` (`computeProgressLayout` tiny-regime pins). At `(7, 1)` viewportRows=1 the projection returns `[line]`; row 0 (header) is suppressed. The cycler copy is therefore only visible at multi-row, and the cycler keys' one-row no-op is consistent with the floor.
- **Forward-unhandled (EV-8 OJ-2)** — `extensions/focus-nav.ts:160-170` `routeEditorFocus` for `surface === "tree"` returns `forward` for any non-up/down/enter/escape key. Adding `←`/`→` to `classifyProgressKey` and `routeEditorFocus` keeps the tree-surface path forwarding them to the editor (cursor move), so no EV-8 binding is broken.
- **EV-9 floor guard** — `extensions/focus-nav.ts:104-107` `enterProgress` returns false at `termRowsCap < DISPLAY_FLOOR (7)`; at this height the surface is "tree" and `←/→` are forwarded. No new state required.
- **Tail/label honesty (EV-39 R4 + EV-42)** — `extensions/navigator.ts:370-373` reads `m.attempt`; `extensions/hub.ts:130-139` writes `attempt` and `attempts` under the same gate. The honest read is to consume the same accessor (`attemptEntries(m)` from `extensions/runs.ts:119`) and pick the entry whose `sessionId === m.sessionId` — which during retrying is the last completed entry. EV-42's wiki page names this exact seam ("the navigator divergence is latent").

---

## Falsifiable predictions (Skeptic inputs, never gate assertions)

1. **Label/tail agree during backoff** — at multi-row, with a manifest written `{state: "retrying", attempt: 3, sessionId: "<attempt 2's id>", attempts: [{attempt:1,...},{attempt:2,...}]}` and a populated session file at `<attempt 2's id>.jsonl`, the rendered tree row contains `attempt 2/3` (not `attempt 3/3`) and the live tail reads from `<attempt 2's id>.jsonl`. Smoke: a CDP capture of the widget's `render(120)` output for a fixture manifest under this state, asserting both substrings on the same line.
2. **`←/→` rebinds the live tail** — at multi-row, with `selectedSessionId` = attempt 3's session and an attempt-1 session file present, dispatching `←` (arrow key, kitty CSI-u form `\x1b[D`) via `controller.viewHost.handleInput` causes the next `render()` to read `findSessionFile(..., selectedSessionId)` = attempt 1's session path. Smoke: a CDP `cdp.send('Input.dispatchKeyEvent')` sequence with a `widget.render()` snapshot before/after, asserting the session id round-trips.
3. **`←/→` are consumed no-ops at one-row floor** — at `termRowsCap = 7` and `surface === "progress"`, dispatching `←` does not mutate `selectedSessionId` and does not reach the editor draft. Smoke: a `viewHost.handleInput` capture with a fake prior editor asserting no handleInput call lands on the prior.
4. **`←/→` are not advertised when only one attempt exists** — for a manifest `attempts: [{attempt:1, sessionId: j}]` (single entry, no retry), the progress header text does not contain `←/→ attempt`. Smoke: `view.render(width)[0]` substring scan.
5. **`openTranscript` resolves to the live session, not attempt 1** — for a manifest whose `m.sessionId === "<attempt 3's id>"`, the legacy modal path's `findSessionFile` call returns the path of `<attempt 3's id>.jsonl`, not the path of `<jobId>.jsonl`. Smoke: a unit test of `openTranscript` with a `tui.custom` capture (the existing modal form), asserting the file passed to `TranscriptView` is the attempt-N file.
6. **`classifyProgressKey` honors kitty/modifyOtherKeys for `←/→`** — `\x1b[D` and `\x1b[C` (legacy arrow bytes) and the CSI-u forms classify as `up`/`down` per existing test; the new cycler keys do not require a new `classifyProgressKey` branch. Smoke: a unit-level classifier test, `expect(classifyProgressKey("\x1b[D")).toBe("down")`, `expect(classifyProgressKey("\x1b[C")).toBe("up")` (these are already the existing arrows; no change expected).

---

## Copy — drafted strings, flagged for ruling (per R3)

Each string below is **new user-visible copy**. Per the card's `## Orchestrator rulings` (R3, FLLWUP-44 carried in), the runner returns `ESCALATION` with the drafted string rather than shipping an unruled one.

- **Progress header addition, multi-row, multi-attempt case** — append to the existing R-KEYMAP form:

  ```
  <title> — ↑↓ move · ←/→ attempt · e expand · t thinking · f follow · g/G jump · esc back
  ```

  `<title>` is the existing `attempt N/M · <id> <seat>` (or `<id> <seat>` when no retry has occurred). The cycler text `←/→ attempt` rides inside the same `t.bold(...)` string, so it is token-only and matches R-KEYMAP's grammar. Single-attempt case: the substring `←/→ attempt` is absent (predicate: `attemptEntries(m).length > 1`). **Open judgment; flag for `product-owner`.**

- **Tree-row label form** — UNCHANGED in copy form: `attempt N/M`. The fix is a data-source swap (see "Label/tail fix during backoff"). No new copy.

- **Empty / single-attempt states** — none new. The existing single-attempt header reads exactly as today (`<id> <seat> — ↑↓ move · e expand · t thinking · f follow · g/G jump · esc back`); the cycler text is absent. The existing `(waiting for output · idle)` and `(no transcript)` lines are unchanged.

- **`openTranscript` legacy-modal title** — unchanged. The `node.manifest.id` token in `findSessionFile` is swapped for `m.sessionId`; the title `${id} ${seat}` is the same. No new copy.

---

## Preferences, ranked last (taste, not grounded)

- **Cycler's bound symbol.** I prefer `←/→` over `[`/`]` because the binding is conceptually horizontal navigation inside a transcript (the existing header already uses arrow glyphs for vertical nav: `↑↓`), and because arrow keys are CSI-u-aware by inheritance from `Up`/`Down`. `[/]` would force a new `matchesKey` discipline on a non-arrow key, which is fine but a separate surface area. **Taste; ranked last.**
- **Cycler's clamp vs. wrap.** I prefer clamp (no wrap). The semantics "earliest attempt" / "latest attempt" are sensible endpoints and wraparound would obscure "which end am I on?" under fast cycling. **Taste; ranked last.**
- **Cycler's one-row behavior.** I prefer "consumed no-op" over "forward to editor" because forwarded arrows under progress surface would silently move the user's editor cursor, which is invisible until they try to type. Consumed no-op is consistent with the EV-9 floor guard (`Enter` is consumed no-op at termRows ≤ 6). **Taste, but with a principle behind it; could be overruled by `principal` or `product-owner`.**
- **Title cycler state vs. header copy.** I considered showing `attempt 2/3 · <id> <seat>` (cycler state in the title) instead of `←/→ attempt` in the keymap. I prefer the keymap slot because the cycler is an *affordance* — what the keys do — not a *status* (the row label already communicates status). Adding the cycler state to the title would duplicate the row's `attempt N/M` and split the truth across two surfaces. **Taste; ranked last.**

---

**Out of scope, named so it isn't smuggled in:** a per-attempt `usage` figure on the row, a sub-tree of attempts inside the progress expansion, click-to-open-attempt (no TUI click model), or a per-attempt `startedAt` age column. The card's goal is reachability + label honesty, not a richer attempt display.

### Step 3 — bounded exchange (round 2)

Round 2: each generator re-dispatched with the others' round-1 positions
(read from this card), asked to respond to what the others actually said.
Jobs: `owner` `job-12.4` (6.4m, 16 turns), `principal` `job-12.5`
(6.4m, 15 turns), `designer` `job-12.6` (6.4m, 9 turns). All settled `done`.
Positions stabilised on three of the four disputes (label source,
row/selection identity, tail-cache key). One split remains — the
disposition of item 2 (`openTranscript` at `navigator.ts:869`): owner and
principal would defer it to FLLWUP-4 (which owns the dead modal path) and
record the finding; designer would fix it in this card via the shared
resolver. Two new user-visible strings are agreed as required and both
escalate per R3. No round 3 is run: the remaining difference is a scope
judgment plus a copy ruling, and further generator rounds would re-litigate
rather than settle.

#### Owner round 2 (`job-12.4`) — verbatim

All load-bearing claims are now verified first-hand. Composing the round-2 position as **owner**.

---

## Owner — round 2 (FLLWUP-45)

**Approach.** I verified every load-bearing claim in the principal's and designer's round-1 positions against the tree before agreeing or refuting. Three of their claims survive contact with the code; two are overstated; one of my own round-1 framings was wrong and I correct it below. The disputes mostly dissolve once the ev7 fixture's *shape* and the controller's *key-agnostic machinery* are read precisely.

### 1. The retrying-row label — what the test pins vs. what R4 pins

**The ev7 test pins vocabulary, not data source — and it cannot see a source flip at all.** `test/ev7-council-tree-widget.test.ts:180-189` builds its manifest through the `m()` helper (`:24-36`), which sets `sessionId = id` and no `attempts` array. That is the **legacy-window shape** (`attempt: 2`, `attempts === undefined`). Under a per-state label source, `attemptEntries`' fail-closed fallback (`runs.ts:119-121`: `m.attempts ?? [{ attempt: m.attempt ?? 1, sessionId: m.sessionId }]`) synthesizes `[{attempt: 2, sessionId: "job-1"}]` — the last entry is still attempt 2, the row still renders `attempt 2/3`. The principal's claim that the designer's flip "collides with the shipped, test-pinned `attempt 2/3`" is **wrong about this test**: no runnable variant of the flip turns it red, because the fixture predates EV-42's substrate. This is exactly the carve-out the principal himself demanded be pinned explicitly for his own claim 1.

**But the flip is still ruled out — by R4's text, not by the test.** `council/cards/EV-39.md:56-58`: *"One job-tree row per dispatch, labeled `attempt 2/3` while retrying — no extra rows and no separate status line."* That letter fixes the **pending ordinal** on the retrying row, and it is quoted as binding in this card's `## Orchestrator rulings`. The designer's per-state source flip would render `attempt 1/3 · retrying in 7s` on a new-shape manifest — a direct contradiction of the letter of a binding ruling, which a seat cannot evolve unilaterally. It also reintroduces the exact defect class this card exists to remove: the label's meaning becomes state-dependent (settled row: final ordinal; retrying row: last-completed ordinal), i.e. one glyph, two denotations.

**So the ruling is: keep `m.attempt` (pending ordinal) on the row; repair the mismatch by naming the shown attempt where the tail is consumed — the progress title.** That is my round-1 position, and it survives. One honest cost, now stated plainly: this card's own `goal` ("the backoff row's label matches the attempt it denotes") reads, on the designer's construction, toward the source flip. Where a card goal and a binding ruling conflict, the ruling wins for shipping — and the tension should be **recorded as a candidate R4 evolution for `product-owner`**, not decided in seats. A test cannot settle this: both designs render; the dispute is which denotation is honest, and R4 has already answered it.

**Correction of my own round 1:** I cited `ev7:180-199` as pinning "the ruled vocabulary this card may not contradict." Over-pinned. The test under-pins (legacy shape); the *binding instrument is R4's text*. Same conclusion, wrong citation weight.

### 2. Row/selection identity — the re-key breaks no binding ruling and no test assertion

**The controller is key-agnostic.** `focus-nav.ts:125-126`: the field is *documented* "keyed by sessionId, NEVER by index (O6)" — but the machinery (`_rows: string[]`, `selectedIndex()` via `indexOf` at `:151-152`) requires only a stable key across `setRows` calls. The ev8 T5/O6 test (`test/ev8-focus-navigation.test.ts:246-256`) feeds opaque strings `["c","a","b"]` and asserts identity-not-index; the ev9 suite feeds its own literals into single-attempt fixtures where `id === sessionId`. **No assertion in either suite pins sessionId as the row key.** The re-key to `manifest.id` breaks no EV-8 test and — verified against `council/cards/EV-8.md` — no *binding ruling*: O6's principle is identity-not-index, which the re-key *honors*. What actually moves: the `selectedSessionId` field name/docstring (a two-module documentation surface, `focus-nav.ts` + `navigator.ts`'s four internal resolution points at `:334-336/405/429-430/461`) and the O6 test's *name*. That is an evolution of a record, not a violation of a ruling.

**I concede the principal's scoping point in full: step-1's "one file" is false.** I half-conceded this in round 1; it is now first-hand — `focus-nav.ts` carries the field, the docstring, and the selection machinery. The card's blast radius is two modules plus the ev8/ev9 test *names*, not one file.


**And the designer's alternative is unsound at this controller — this is the round-2 finding that settles the identity dispute.** The designer's cycler "moves `controller.selectedSessionId` to that attempt's session id." An attempt's session id (other than the live one) is **not in the row list** (`setRows` receives `manifest.sessionId` per job, `navigator.ts:405`). The moment the cycler sets it: `selectedIndex()` → −1 (`focus-nav.ts:151-152`), the ▌ marker vanishes, `isAtTop()` → true so **Up exits the tree**, and `backFromProgress`'s O3 contract — "return to tree *preserving* selection," pinned green at `test/ev9-progress.test.ts:95-106` — silently breaks on the next Esc. The cycler is only safe on a job-id-keyed controller with a **separate content cursor**. So the designer's affordance *presupposes* the principal's (and my) identity split; it is not an alternative to it.

### 3. Tail-cache keying — the two proposals converge; the dispute is a guard-rail, not a fork

Verified: `tails`/`lastBlocks` key on `keyFor(node)` = `manifest.sessionId` (`navigator.ts:297-298, 343-353, 381`), and `TranscriptTail` binds its file **at construction** (`:344: new TranscriptTail(file)`). Because attempt N's session id is `${jobId}-attempt${N}` and attempt 1's is the job id (`hub-tools.ts:250, 269-270`), `sessionId` *already encodes* `(jobId, attempt)` — the principal's key and the owner's "resolved session" are the same key. Today's tree therefore does **not** serve attempt 1's last-activity under attempt 2's row; the principal's hazard is real only as a constraint on the re-key: once rows key on `manifest.id`, unifying the tail key with the new row key would return the *stale `TranscriptTail` object bound to attempt 1's file* under the post-respawn row. **Rule: after the re-key, tails/lastBlocks stay keyed on the resolved `manifest.sessionId`, never on the row key.** The distinguishing test is the principal's claim 4 (respawn with a new file and appends → the running row's last-activity comes from attempt 2's JSONL; a row-key-keyed cache goes red). It is green on today's tree; it ships as the re-key's guard-rail, not as a dispute-settler. Minor residual, reported not claimed: stale per-attempt entries are never evicted from `tails`/`lastBlocks` (bounded by the 15-run retention; memory nit only).

### 4. `openTranscript` — the principal's reachability claim is confirmed; defer to FLLWUP-4

First-hand: the `/council-tree` command and shortcut handlers call `toggleWidget` (`navigator.ts:620-631`), never `open`. `open` (`:506`) is a local const with **zero call sites**. `activateSession`'s only wire is as `onActivate` into `installTreeEditor` (`:588` → `focus-nav.ts:348-351` → stored at `:282`) — and `onActivate` is **never invoked anywhere**: Enter at surface "tree" calls `controller.enterProgress(...)` (`focus-nav.ts:334`). Both `openTranscript` call sites (`:520`, `:571`) are therefore dead, and FLLWUP-4 — OV-2's named follow-up, `council/cards/EV-7.md:239-243`, "either delete the dead modal path or fix the guard" — owns that path's disposition. **Cheapest honest disposition: record the `manifest.id` bug in FLLWUP-4's card as a finding and defer the fix there.** Hardening a path another card may delete spends budget on a ghost; and since this card extracts the shared browsable-attempts accessor anyway, FLLWUP-4's fix — should it choose "fix" — is one line against that accessor. No new test for `:869` in this card beyond recording the finding.

### 5. Minimal copy set

The principal's three-spellings observation is confirmed: `attempt ${n} of ${max}` (parent-retry, `parent-retry.ts:112`, R5-bound), `attempts=${n}/${max}` (hub-tools head grammar, `:76`), `attempt ${m.attempt}/${max}` (navigator row, `navigator.ts:372`). Three spellings is already the landed state; this card must not add a fourth *spelling*, and the two drafts below reuse tokens, not spellings. **Minimal set — two strings, both escalated per R3 with these drafts:**

1. **Progress title attempt fragment** — `· attempt 1/3` appended to the existing `${id} ${seat}` title (`navigator.ts:463-465`), rendered whenever the job has >1 browsable attempt. **Reuse, new position only**: the token `attempt N/M` is the navigator surface's own R4 vocabulary (within-surface divider stays `/`; `of` stays parent-retry's R5 sentence — do not unify across surfaces in this card).
2. **Header affordance fragment** — `←/→ attempts` appended to the existing progress hint line, gated on browsable attempts > 1 (designer's gating is correct and I adopt it, including consumed no-op at the one-row floor and the legacy-window no-op). **Genuinely new**, minimal-novelty, rides the R-KEYMAP grammar.

**Not in this card:** the legacy-modal title suffix (dead path → FLLWUP-4, together with the `:869` fix). **Binding and untouched:** `The provider returned an error.` (`parent-retry.ts:126`, per backoff episode), `Retrying in 2s (attempt 2 of 3) — Esc to abort` (`:112`), `Retries exhausted after 3 attempts. The provider kept failing. Press Enter to try again.` (`:117`), and the navigator's landed `retrying in Ns` / `attempt N/M` row tokens.

---

**Design I defend now.** My round-1 design, amended in three places by the others' evidence: (a) adopt the principal's explicit split — **row/selection key = `manifest.id`; content identity = the attempt entry**, resolved by one extracted pure accessor over `attemptEntries(m)` ∪ the live `manifest.sessionId`; the attempt cycler moves a *content cursor* local to the progress surface (rebinding `ensureView`/the title), **never `controller.selectedSessionId`** — the designer's cycler mechanism is rejected on the verified selection-loss mechanism above, its affordance placement and floor/no-op gating are adopted; (b) the row label keeps `m.attempt` per R4's letter, and the mismatch is repaired by the title naming the shown attempt (escalated string 1); (c) `openTranscript` is deferred to FLLWUP-4 with the finding recorded. Red tests I commit to (all fail on this tree): selection survives a respawn transition (▲ marker + `selectedIndex() >= 0`, keyed on job id); title names the attempt whose file `ensureView` opened during backoff; browsable-set resolution across retrying/running/settled/legacy shapes with the legacy carve-out pinned; tail-keying guard (attempt-2 JSONL feeds the post-respawn row; row-key-keyed tails go red); cycler `←/→` consumed no-ops at the one-row floor and absent from the header when browsable ≤ 1; ev7 `:180-199` and R5 strings untouched and green.

**Genuinely open.** *Test-settleable:* none remaining — every behavioral disagreement above collapsed into a red test or a verified mechanism. *Open-judgment (escalate, not settle here):* the two drafted strings (judge/product-owner under R3); the `←/→` vs letter-key choice (taste; arrows are unclaimed in `classifyProgressKey` — verified `:57-77` — and forward-unhandled on the tree surface, so no EV-8 collision); and the **R4 evolution question** — whether the retrying row's label should eventually denote the tailed attempt rather than the pending ordinal. That last one is the card goal's plain reading against a binding ruling's letter; only `product-owner` can evolve it, and this card ships on R4's letter either way.

**Split judgments.** Blocking: the job-id re-key with a separate content cursor (both the respawn glitch and any cycler are unsound without it); the title naming the shown attempt during backoff (else the viewer is told nothing while being shown attempt N's file under a pending-N+1 row); defer `openTranscript` to FLLWUP-4 rather than harden dead code. Non-blocking: cycler key choice, clamp-not-wrap, `selectedSessionId` rename-now vs re-document-now (re-document is the minimum; the rename rides any later touch). Where I was wrong in round 1: the ev7 test was the wrong instrument to cite for the label ruling (R4's text is); I under-named the two-module cost of the re-key, which the principal caught and I now concede. Where the others were wrong: the principal's test-collision claim on `ev7:180-189` and his "the ev8/ev9 suites move with it" (no assertion moves — names and docstrings do); the designer's tail-rebinding mechanism (`tails`/`lastBlocks` key on `manifest.sessionId`, not `selectedSessionId`) and her cycler's selection-preservation breakage at `focus-nav.ts:151-152`.

#### Principal round 2 (`job-12.5`) — verbatim

Read the card in full, the three round-1 positions, EV-39 R4, FLLWUP-4, and the code on both sides of every claim. Findings below; two of my own round-1 claims need correcting.

---

## Cross-seam reading

**What the contract actually is, first-hand.**

Four identity fields, four lifetimes (`extensions/runs.ts:50-67`), read by six call sites in one file:

| navigator site | field read | role |
|---|---|---|
| `:334-336` `keyFor` | `manifest.sessionId` | **content**-cache key for `tails` + `lastBlocks` (`:341-353`) |
| `:405` `setRows` | `manifest.sessionId` | **row** key set |
| `:429-430` marker/selection | `manifest.sessionId` | **row** identity compare |
| `:449,:459-466` `ensureView` | `selectedSessionId` → `findSessionFile` + node lookup by `sessionId` | content resolve + title |
| `:370-373` label | `manifest.attempt` | state indicator |
| `:869` `openTranscript` | `manifest.id` | content resolve (dead path) |

The row key, the content key, and the label source are three different things that happen to be two variables today. During `retrying` for pending N+1: `attempt = N+1`, `sessionId` = attempt N (`hub.ts:132-137`), `attempts` = 1..N. So `:405`/`:429-430` (row) and `:334-336` (content) both read attempt N's session — the row key is a *content* identifier being used as an *identity*, which is exactly why it mutates at respawn.

**Dispute 1 — the retrying-row label: the test pins the vocabulary only, and R4 settles it against the flip.**

The fixture at `test/ev7-council-tree-widget.test.ts:183-184` is `m("job-1", {state:"retrying", attempt:2, nextAttemptAt:…})` — **no `attempts` field**. `test/tree.test.ts:69` is the same. So those tests exercise `attemptEntries`'s legacy synthesis (`runs.ts:119-121`: `m.attempts ?? [{attempt: m.attempt ?? 1, sessionId: m.sessionId}]` → `[{attempt:2, …}]`), and the designer's flip falls back to `m.attempt` on exactly that shape. **The test is silent on every non-legacy fixture**; it neither pins the data source nor forbids the flip. The principal's "test-pinned collision" framing and my round-1 echo of it were both over-stated — the test is not the collision.

R4 is. Verbatim (`council/cards/EV-39.md:56-59`): *"One job-tree row per dispatch, **labeled `attempt 2/3` while retrying** — no extra rows and no separate status line."* The only unambiguous instance of its own example is pending = 2, settled = 1 — i.e. **the first retry**. The designer's flip renders `attempt 1/3` in that window (`attempts = [1]`, last entry = 1). That is the ruled string, in the ruled state, changed. So: the flip is a **contradiction of a binding ruling, not an evolution**, and it is not test-detectable because no shipped test covers the shape. `[per-attempt-provenance]` also states R4's own reading — *"R4 makes the row label `attempt 2/3`, so the denominator is carried into the renderers"* — nothing there licenses a source flip.

The designer's "copy-free" claim is what makes this attractive and it is also what is wrong: a flip does not avoid new copy, it *relocates* the need for it. Once the row says `2/3` and the tail is attempt 1's, the ordinal of the shown attempt must appear somewhere, and the only non-ruled surface for it is the progress title. Both horns buy the same string; the ruled horn pays one string. **Ruling for the record: keep `m.attempt` (owner's horn).**

Settle test (red today, green after; neither shape's fixture exists yet):

```
retrying fixture: {attempt:2, sessionId:"job-1", attempts:[{attempt:1,sessionId:"job-1"}], nextAttemptAt: now+7000}
  + job-1.jsonl on disk
assert row contains "attempt 2/3"                       // R4 literal, unchanged
assert progress title contains "attempt 1/3"            // the denoted content's ordinal
assert titleOrdinal === indexOfOpenedFileIn(attemptEntries(m)) + 1
```

The third assertion is the honest-denotation predicate and the only runnable one that distinguishes the two designs regardless of wording.

**Dispute 2 — row/selection identity: the re-key costs less than either of us said; the rename costs more.**

`test/ev8-focus-navigation.test.ts:244-256` (O6) uses **opaque strings** — `setRows(["a","b","c"])`, `setRows(["c","a","b"])`, asserts `selectedSessionId === "c"` and `selectedIndex() === 0`. Its subject is identity-not-index; "sessionId" appears only in the test *name* and the field *name*. Same in ev9 (`:66-110`, `:363-405`) and ev35 (`:95,:110`). **The re-key breaks zero existing assertions** — I was wrong in round 1 ("moves the ev8/ev9 suites"), and the principal's "two-module change, ev8/ev9 suites move with it" is wrong the same way. No binding EV-8 ruling is touched: EV-8's binding content is *editor-driven focus + consume only Up/Down/Enter/Escape + forward-unhandled* (`vault/wiki/council-job-tree-inline.md`, EV-8 section); row-key type is not in it.

What it actually costs:
- `navigator.ts:405`, `:429-430`, `ensureView`'s node lookup (`:464`) change values. No test churn.
- `focus-nav.ts:126-128`'s doc comment (`"Selected row keyed by sessionId, NEVER by index (O6)"`) becomes a lie; the parameter name `sessionId` in `enterProgress(:190)` becomes a lie.
- A **rename** (my "cheap rename" and the principal's "must be renamed/re-documented") touches `selectedSessionId` in 5 test files mechanically (`ev8:108-295`, `ev9:69-405`, `ev35:95,110`, plus `ev8:266`). That is churn, not semantic change, but it is not free: it is the largest single mechanical diff in the card.

So the honest cost of the identity change is: **2 source files + doc/param names; zero test semantics; a mechanical rename across 5 test files if the name is fixed.** In scope? Yes — this card is what makes the name false; leaving `selectedSessionId` holding job ids would ship a second lie to fix a lie (gate-parity spirit, `vault/wiki/gate-parity.md`). Cheapest honest path: rename to `selectedRowKey` in the same change; it is mechanical and the compiler finds every site.

**Dispute 3 — tail-cache keying: owner's own position contains the contradiction; `sessionId` (not `(jobId, attempt)`) is the right key.**

`keyFor` (`navigator.ts:334-336`) is used **only** by `tailRead` (`:337-353`) and `rowLine`'s `lastBlocks` lookup (`:382`). It is *already* the content key and already keys on the thing that changes when content changes — `manifest.sessionId`. Measured against the tree:

- Owner's sentence "re-key `keyFor`… on `manifest.id`" is **wrong and self-defeating**: `tails.set(key, new TranscriptTail(file))` only fires when `!tails.has(key)` (`:342-344`), so a job-id key freezes the tail on attempt 1's file forever after respawn while `findSessionFile(…, manifest.sessionId)` (`:341`) points elsewhere — divergence inside one line.
- Owner's other sentence, "`sessionId` **equals** `attempts[last].sessionId` … so latest browsable = `manifest.sessionId` in every state," is **correct**, and is the same claim as mine.
- My round-1 reframe named `(jobId, attempt)`. **I was wrong on the specific key.** In the retrying window `attempt` advances while `sessionId` does not; keying on `attempt` would split the cache at the very moment the content hasn't changed. `sessionId` is EV-39's mandated fresh pointer per attempt, so it is already the exact content identity. Requirement right ("do not key on the row key"), key wrong.

Distinguishing test (red under a `keyFor → manifest.id` fix, green under today's key):

```
manifest running attempt 2, sessionId "<job>-attempt2"; job-1.jsonl and <job>-attempt2.jsonl both on disk,
attempt 2's last block has the later `at`.
assert the row's last-activity text comes from attempt 2's file
assert after advancing manifestId's attempt to 3 (new sessionId) the row's text changes again
```

**Dispute 4 — `openTranscript`: unreachable, and the disposition belongs to FLLWUP-4.**

First-hand: `open` (`navigator.ts:509-548`) is defined and never referenced — `registerNavigator` registers only `toggleWidget` (`:612-627`), and `navigator.ts:520` is the only `openTranscript` call inside it. `activateSession` (`:564-572`, the `:571` call) is passed to `installTreeEditor` (`:588`); `CustomTreeEditor` stores it (`focus-nav.ts:282`) and **never invokes it** — `handleInput`'s Enter path is `this.controller.enterProgress(...)` (`:318`). `test/ev9-progress.test.ts:371` even passes `() => {}` with the comment *"onActivate stays present but must NOT be the Enter path"*, and `test/ev8-focus-navigation.test.ts:222-223` builds an `activated` array it never asserts. Reachability of the modal: none from any command or key.

Where my round-1 claim needs a caveat: **"the whole modal path is unreachable" is true of the shipped surface, false of the module.** `CouncilTree` is exported and directly instantiated by `test/navigator.test.ts:66`, and its Enter → activate path *is* asserted (`:72-73`). So `openTranscript` is test-pinned dead code, not compiler-dead code (`vault/wiki/council-job-tree-inline.md` says the same and points at FLLWUP-4). Also: FLLWUP-4's cited `navigator.ts:57` has drifted — the `if (!ctx.hasUI)` guard is at `:510-514` today.

Cheapest honest disposition: **defer item 2 to FLLWUP-4, and do not add a test for it here.** FLLWUP-4's acceptance is literally *"guard removed (dead path deleted) **or** corrected"*, single file, with "is the modal still reachable after EV-7?" as its stated decision fact. A one-token `:869` fix is thrown away if FLLWUP-4 deletes the path — and this card's own reachability deliverable (item 1) makes deletion the likely answer. If a fix is wanted anyway, fix it at the *shared* resolver the reachable path uses, so the dead path inherits it; never at `:869` alone. Item 2 is **not blocking** for this card's goal.

**Dispute 5 — minimal copy: two strings, both reuse; and the surface's three spellings are real.**

The existing divergence the principal named is verifiable: `Retrying in 2s (attempt 2 of 3)` (`extensions/parent-retry.ts:111-112`), `attempts=2/3` (`extensions/hub-tools.ts:76`), `attempt 2/3` (`navigator.ts:372`; ruled by R4). R3's binding strings are untouched by any of this and must stay byte-identical: `The provider returned an error.` (`parent-retry.ts:124-127`, per episode), `formatRetryCountdown`/`formatRetryExhausted` (`:111-118`).

Minimum the design cannot ship without:

1. **Progress title attempt designation** — e.g. `job-4.2 skeptic · attempt 1/3`. **Genuinely new string, reusing ruled vocabulary** — `attempt N/M` is R4's ruled token, already rendered on the row (`:372`) and in `tree.test.ts:70`. New *position*, not new vocabulary. Without it, the ruled label and the shown content are indistinguishable → the card's goal unmet. **Required.**
2. **Keymap advertisement for the attempt cycler** — e.g. `· ←/→ attempt`. **Genuinely new copy**; rides the existing header string (`navigator.ts:839`) and is required only because `honest-keymap` R-KEYMAP binds an advertised-key surface: a cycler with no advertised key fails the goal's "reachable". **Required iff the cycler ships in this card.**

Cut: the legacy-modal title suffix (dead path → FLLWUP-4, string 3 in owner's list); any change to countdown/"retrying"/exhaustion copy (R5, binding). Designer's set is the same two minus the title — but dropping the title drops the goal. Owner's set is the same two plus one dead-path string.

Two corrections that bear on cost: the designer's claim that `←/→` need "no new `classifyProgressKey` branch" is false — `ProgressKey` (`focus-nav.ts:25`) has no left/right member, `classifyProgressKey` (`:62-71`) has no left/right branch, `routeEditorFocus`'s progress case consumes only `up/down/e/t/f/g/G` (`:213-224`), and delivery is gated by an explicit list (`focus-nav.ts:299`). Their smoke #6 (`classifyProgressKey("\x1b[D") === "down"`) contradicts `test/ev9-progress.test.ts:60-71`, which asserts only UP/DOWN/ENTER/ESC/e/t/f/g/G/x. And: `↑↓ move` is already advertised in the progress header — left/right would sit next to keys whose semantics in this surface are follow/scroll, so the advertisement needs a disambiguating noun, not a bare arrow.

## Blind spots

**Owner (inside the code).** Sees `sessionId` as *the* session, because in single-attempt code it is; cannot see that `keyFor` is already the correct content key (`:334-336` vs `:405`) and so reformulates the fix as re-keying both, which is the one change that breaks the tail. Cannot see that `focus-nav.ts:126-128` documents the row-key contract two modules away, nor that its own "keys them implicitly on the resolved session" contradicts its "re-key `keyFor`" sentence — the two live in the same position and were never reconciled.

**Principal (inside the reframe).** Sees the identity split correctly and the dead code correctly, but cannot see that the ev8/ev9 suites it says "move with it" assert on opaque strings and will not move at all — so it over-prices the change it is right about, and over-states the test collision on the label. It also can't see that a `(jobId, attempt)` content key splits the cache in the retrying window where `attempt` moves and `sessionId` does not.

**Designer (inside the render path).** Sees the person's question ("which attempt am I looking at?") and answers it by making the label read the tail's source — which silently reassigns, in the ruled window, the exact string R4 names. It cannot see that R4's example is the first-retry case (pending 2, settled 1) so the flip is a contradiction at the canonical instance; nor that its cycler moves `selectedSessionId` to an attempt's session id, re-collapsing row key and content key and re-introducing the respawn selection loss the re-key exists to remove. Its classifier claim is checked against a test that does not say what it thinks it says.

**copy / `product-owner` (inside vocabulary).** Will measure new strings against R5 and cannot see that "consistent with R5" is not decidable today: three landed spellings of one fact, one slashed and two "of"/`=`. Nor that the defect is denotation, not wording.

## Reframe

The proposed design is sound on identity and unsound on the cycler's state; **no wholesale reframe needed**, but one structural correction:

**Three identities, three variables — the cycler cannot reuse the row key.**

- `rowKey` = `manifest.id` (job). Drives `setRows` (`:405`), the marker compare (`:430`), `selectedIndex`, and the node lookup in `ensureView`. Stable by construction across retry transitions; kills the respawn selection loss.
- `contentKey` = the denoted attempt's `manifest.sessionId`. Drives `keyFor`/`tails`/`lastBlocks` (`:334-353`) *as today* and `findSessionFile` (`:341`). No change.
- `attemptCursor` = **new, separate state**, owned by the widget (not the controller), consumed only while `surface === "progress"`. The designer's "the cycler moves `controller.selectedSessionId` to that attempt's session id" is the defect: it puts a session id back into the row-key variable, so the next `setRows` (job ids) yields `selectedIndex() === -1` and the marker vanishes again — the identical bug, one keystroke later. With a separate cursor, the controller stays attempt-agnostic and `ensureView` resolves `(rowKey, attemptCursor) → content` through one pure helper over `attemptEntries(m)` ∪ the live `manifest.sessionId`.

This also makes items 1 and 3 one change rather than two, and reduces item 2 to a cross-reference.

## Testable claims

Runnable, red today, each distinguishing two designs rather than asserting prose:

1. **Label vs denotation (dispute 1).** Fixture `{state:"retrying", attempt:2, sessionId:"job-1", attempts:[{attempt:1,sessionId:"job-1"}], nextAttemptAt: now+7000}` + `job-1.jsonl`. Assert row contains `attempt 2/3` **and** title contains `attempt 1/3` **and** `titleOrdinal === 1 + indexOf(sessionId in attemptEntries(m))`. Red today (no title ordinal); a flip makes the first assertion red.
2. **Selection across respawn (dispute 2).** `setRows(["job-1"])`, `enter()`, `enterProgress("job-1")`; then mutate the manifest to `running/attempt 2/sessionId "<job>-attempt2"` and re-render. Assert `selectedIndex() === 0`, `isAtTop() === false`, `▌` still on that row. Red today (`-1`, `true`, no marker).
3. **Content cache scoping (dispute 3).** Same respawn, with attempt 2's JSONL carrying the later `at`. Assert the row's last-activity text derives from attempt 2's file. Red under a `keyFor → manifest.id` fix; green with `keyFor` unchanged.
4. **Cycler does not own the row key (dispute 2/3 coupling).** After one cycler press, assert `setRows` values are still job ids and `selectedIndex() !== -1`. Red under the designer's cycler as written.

Untouched and must stay green: `test/ev7-council-tree-widget.test.ts:180-189`, `test/tree.test.ts:65-73`, `test/ev40-parent-retry.test.ts` R5 strings, `test/ev8-focus-navigation.test.ts:244-256`.

## What I would defend now

- **Label source: `m.attempt`, unchanged** (R4 literal, first-retry case decides it). Designer's flip does not ship this card; if the designer wants it, it needs an orchestrator ruling that amends R4's own example, not a design argument.
- **Row key: `manifest.id`; content key: `manifest.sessionId`, unchanged; a separate `attemptCursor` for the cycler.** Rename `selectedSessionId → selectedRowKey` in the same change (mechanical, 5 test files).
- **Item 2: defer to FLLWUP-4, cross-reference it in the card record.** If a fix ships anyway, fix the shared resolver, never `:869`, and say in the PR that FLLWUP-4 may delete the path.
- **Reachability: the progress surface with a cycler**, counting on a new `ProgressKey` member, a new `classifyProgressKey` branch, a new `routeEditorFocus` case, a new delivery-list entry, and one header token — not the "no new branch" the designer claims.
- **Copy: exactly two strings**, both escalated with the drafted string per R3: the progress-title attempt designation (reuse of R4's ruled token, new position) and the cycler advertisement (genuinely new). R3's and R5's strings untouched, byte-identical.

## What remains genuinely open

- **Test-settleable, not yet settled:** the label/denotation pair (claim 1) — settle by running it, not by argument, if anyone still contests the flip after R4. Content-cache keying (claim 3) — settle by running it.
- **Open judgment, needing a ruling:** the two strings (R3 escalates); whether the cycler is in this card at all versus a follow-up; the field rename riding this card versus a naming cleanup.
- **Open judgment, cheap either way:** cycler key (`←/→` vs `[`/`]`) and clamp-vs-wrap — taste, ranked last, and the `[`/`]` horn genuinely avoids the follow/scroll semantic collision that the arrow horn creates in `TranscriptView`.

## Split judgments (honest)

- I was **wrong** in round 1 that the re-key "moves the ev8/ev9 suites" — those tests assert opaque strings and do not move. I was **wrong** that the re-key makes the step-1 "one file" claim false in any load-bearing way — it is false (two source files) but the cost is a rename, not a migration. I was **wrong** to name `(jobId, attempt)` as the tail-cache key: `sessionId` is already the right key and the requirement was simply "don't overload it with the row key."
- I was **right** that the design cannot ship copy-free, that `:869` is unreachable dead code belonging to FLLWUP-4, and that owner's `keyFor → manifest.id` re-key contradicts owner's own "keyed on the resolved session." I was **overstated** in "the whole modal path is unreachable": true of the shipped surface, false of the module — `CouncilTree`/`openTranscript` are test-pinned (`test/navigator.test.ts:66-73`) and not compiler-dead.
- The designer is **right** that per-attempt browsing belongs in the progress expansion and not in new tree rows (cardinality A is `[per-attempt-provenance]`-binding), and **wrong** on the label source and on the cycler's state, both for the same reason: the attempt is not the row.

Wiki pages used: `[[per-attempt-provenance]]`, `[[council-job-tree-inline]]`, `[[honest-keymap]]`, `[[one-row-floor]]`, `[[retry-policy]]`, `[[gate-parity]]`. No wiki page states the row-key identity; the fix should extend `[[per-attempt-provenance]]`'s Related list with the three-identity rule, as the principal proposed — that part of their position I endorse without reservation.

#### Designer round 2 (`job-12.6`) — verbatim

I've cross-checked every load-bearing claim from the other two seats against the actual source. Here is my round-2 position, structured to match the four disputes in priority order.

---

## Concessions, named up front (so the rest reads cleanly)

**On dispute 1, I was wrong to call the label/tail fix "copy-free".** I preserved the vocabulary form `attempt N/M` but flipped the data source — and that flip changes the rendered value from `attempt 2/3` to `attempt 1/3` on a retrying-after-attempt-1 row in real backoff substrate. R4's example value is `attempt 2/3` (the pending ordinal), not just the `attempt N/M` shape. The wiki page [[per-attempt-provenance]] confirms the ruling is about the value: "R4 makes the row label `attempt 2/3`". The honest path is the conservative one — keep R4's data source, disambiguate in the title. I over-corrected on a real but smaller defect.

---

## Dispute 1 — the retrying-row label

**What the test at `test/ev7-council-tree-widget.test.ts:180-189` actually pins.** I read the test first-hand. The fixture is `m("job-1", { seat: "skeptic", state: "retrying", attempt: 2, nextAttemptAt: NOW + 7_000, pid: null, exitCode: null })` — `attempt: 2`, no `attempts` field. Under `attemptEntries(m)` (`runs.ts:119-121`), `m.attempts ?? [{ attempt: m.attempt ?? 1, sessionId: m.sessionId }]` returns `[{attempt: 2, sessionId: "job-1"}]`. My flip reads `attemptEntries(m)[length-1].attempt === 2`, renders `attempt 2/3`. **The test as written passes my flip unchanged.** Principal is right that the test pins the vocabulary `attempt N/M` on a retrying row, but the fixture does NOT simulate real backoff substrate (no `attempts` field) — so the test does NOT pin which ordinal the label reads when both `attempt` and `attempts` are present.

**What R4's R4 actually says** (read at `council/cards/EV-39.md` "Orchestrator rulings" + `vault/wiki/per-attempt-provenance.md:32`). R4 is a vocabulary + example ruling: "labeled `attempt 2/3` while retrying". The example `2/3` is the pending ordinal (the next attempt that will fire). Real backoff substrate (`hub.ts:130-138`) writes `attempt: job.attempt` (pending) AND `attempts: job.attempts` (settled prefix) under the same gate. The substrate comment at `hub.ts:134-136` calls out the pairing: "inside the retrying write that pairing would be a lie: `{attempt: 2, sessionId: <attempt 1's id>}`". The pending ordinal `2` is what `m.attempt` carries during retrying-after-attempt-1; the completed ordinal `1` is what `m.attempts[last].attempt` carries.

**Is `attempt 2/3` the honest reading during backoff-after-attempt-1, or a lie the ruling inadvertently froze?** It is honest under R4's intended denotation ("the attempt about to fire, of N allowed") but a lie as a **selector of the tailed transcript** (the live tail at `m.sessionId` reads attempt 1's JSONL; nothing tailable exists for attempt 2 until respawn). Both readings are truthful statements of different facts; the design question is which fact the row label is for. My round-1 flip said "for the tail". I now withdraw that — the row label is for the budget/state ("we are between attempt 1 and attempt 2 of 3"), and the tail denotation belongs in the title where the person actually opens the transcript.

**A test that settles which denotation is honest.** Owner proposed one (T2: "Enter during backoff opens the latest settled attempt, titled with its ordinal"). I would extend it to make the contract explicit: a fixture `{state:"retrying", attempt: 2, attempts: [{attempt:1, sessionId:"job-1"}], sessionId: "job-1"}` with a populated `job-1.jsonl`, asserted to render `<row contains "attempt 2/3">` AND `<progress title contains "attempt 1/3">` AND `<ensureView opens job-1.jsonl>`. This is runnable and pins both halves (label = pending ordinal per R4; title = tailed ordinal per the open-territory title). If anyone in round 3 wants the row label to flip, the RED form of that test asserts `<row contains "attempt 1/3">` and breaks the label half — a runnable disagreement, not a prose dispute.

**Verdict.** Dispute 1 closes by **keeping R4's data source verbatim** and adding attempt-state to the progress title. The label/tail honesty gap moves to where it belongs — the title that opens with the live transcript. New copy → `ESCALATION` per R3.

---

## Dispute 2 — row/selection identity

**Visible behavior under re-keying (`manifest.sessionId` → `manifest.id`).** I walked the rendered path. Marker (`▌` at `navigator.ts:464`), row order (job-keyed vs session-keyed produces identical ordering under cardinality A because one job = one row), and focus routing (Up/Down/Enter/Escape: same arrows move the same job) — **all unchanged in the happy path**. The single-attempt case is byte-identical because `manifest.id === manifest.sessionId` for attempt 1 (`hub-tools.ts:250`). The fix is invisible until a job has >1 attempts and respawn fires.

**Does it break any binding EV-8 ruling?** EV-8 is "consume only Up/Down/Enter/Escape" on the tree surface (`focus-nav.ts:160-170` + the wiki page's bold "consumes only Up/Down/Enter/Escape"). That ruling is about **which keys the surface consumes**, not about the selection key type. Re-keying is orthogonal. The contract I break is `selectedSessionId: string | null` (`focus-nav.ts:186`), which is a TS-level binding (test-ev8 T6 at `:246-256` "same session, NEW index"). That test pins the **principle** (identity-not-index) under the pre-EV-42 substrate; re-keying under EV-42 cardinality preserves the principle (now `selectedJobId` same job, new index still maps).

**Does the step-1 "one file" scoping hold?** No. Principal is right — the move touches `focus-nav.ts` (field rename + `selectedIndex()`'s `_rows` lookup) and `navigator.ts` (5 call sites: `keyFor`, `tailRead`, `setRows`, the controller-compare, the modal-`openTranscript` resolver), plus `test/ev8-focus-navigation.test.ts` (`selectedSessionId` references) and possibly the ev9 suite. This is a 2-module change in production + a test rename in two suites. I accept that the step-1 record understated the surface and the card needs the wider scope acknowledged.

**Verdict.** Re-key on `manifest.id`. Document the rename (`selectedSessionId` → `selectedJobId`, or kept as an opaque row key with a comment update). The cross-module change is real but unavoidable — chasing a mutable key forever is the alternative, and the live-mutation glitch on respawn (`focus-nav.ts:210-215` returning `-1`) is the bigger defect. Test re-stability across respawn is the falsifier (owner's T1).

---

## Dispute 3 — the cycler affordance vs. the floors

**Re-verified at `extensions/focus-nav.ts`, not memory.** `Key.left` and `Key.right` exist in pi-tui (README line 697: `Arrow keys: Key.up, Key.down, Key.left, Key.right`) and are imported transitively via the `Key` constant at `focus-nav.ts:2`. They are not currently classified by either `classifyTreeKey` (`focus-nav.ts:43-49`) or `classifyProgressKey` (`focus-nav.ts:67-99`). Both fall through to `"other"`.

**What `routeEditorFocus` returns for them today.** `routeEditorFocus` (`focus-nav.ts:151-191`) has a single `default: return { action: "forward" }` in both surface branches. Forwarded keys go to `super.handleInput` (or `this.inner.handleInput` if composed — `focus-nav.ts:235-238`, `:307-311`). At `surface === "progress"` with `termRowsCap >= 7`, `←/→` reach the prior editor (cursor move). At `surface === "tree"`, same — cursor move. At `termRowsCap < 7`, surface stays `"tree"` (EV-9 floor at `focus-nav.ts:104-107`), `←/→` forward. **Adding `←/→` to the cycler requires four edits:**

1. `ProgressKey` union widens to include `"left" | "right"` (`focus-nav.ts:11`).
2. `classifyProgressKey` adds two branches before the `"other"` return.
3. `routeEditorFocus`'s `progress` switch consumes them and the `tree`/`editor` switches forward them — the existing `default: forward` already does this if I let `←/→` stay out of `TreeKey` and rely on `RouteKey`'s wider union.
4. `CustomTreeEditor.handleInput` (`focus-nav.ts:295-310`) must deliver `←/→` to a **controller-level handler** (mutates `selectedSessionId`/`selectedJobId` to the prior/next attempt entry), not to `viewHost.handleInput` (which only knows transcript-domain keys).

**One-row floor (EV-36 R3, `termRows === 7`, `viewportRows === 1`).** My round-1 "consumed no-op at one-row" holds: once the cycler is in `routeEditorFocus`'s progress switch, `←/→` are consumed regardless of viewport height. The view's render still suppresses nav at one-row, but the cycler is not nav — it is attempt-domain. Same floor pattern as EV-9's `Enter`-at-`termRows ≤ 6` consumed no-op.

**Term-rows ≤ 6 (EV-9 floor).** Surface stays `"tree"`. `←/→` forwarded to editor draft. Same as today. Not a regression.

**The legacy-window case (`m.attempt > 1 && m.attempts === undefined`).** `attemptEntries` synthesizes one entry from `m.attempt/m.sessionId` (`runs.ts:119-121`). One attempt exists → `←` and `→` clamp at the same point → consumed no-ops. The cycler header copy must not advertise when the row has exactly one attempt (honest-keymap).

**Ev9 test enumeration.** `test/ev9-progress.test.ts:48-60` enumerates `classifyProgressKey` for `ENTER/ESC/UP/DOWN/e/t/f/g/G/x`. The exhaustive list of named keys plus the `"other"` sentinel for `"x"` is asserted. Adding `←/→` requires adding two assertions (`classifyProgressKey(Key.left) === "left"`, `classifyProgressKey(Key.right) === "right"`) — additive, no existing assertion breaks. The "everything else 'other'" claim becomes "everything else besides left/right" and the test name must update.

**Verdict.** Cycler keys add ~5 lines to `focus-nav.ts` (union + classifier + routing) plus one delivery seam in `CustomTreeEditor.handleInput`. The blast radius is wider than the card's stated "one file", but is bounded: `focus-nav.ts` + `navigator.ts`'s `ensureView` (where `selectedSessionId` resolves to a session file via `attemptEntries`). Adding `Key.left`/`Key.right` does not collide with EV-8's exclusivity (tree-surface forward is the existing behavior); the cycler is progress-domain only.

---

## Dispute 4 — new user-visible copy

**My round-1 placement** was the **header** (`←/→ attempt` appended to the existing R-KEYMAP form). **Owner's** was **title** (`${id} ${seat} · attempt 2/3`) + header advertisement `←/→ attempts`. **Principal's** was **title** (`${id} ${seat} · attempt 2/3`) + `· [ ] attempt` hint in the progress hint line.

I now defend a **hybrid** that splits the two facts:

- **Title** carries the attempt state. Title is where the person's eye lands when they press Enter — and "what am I looking at?" is the title's question (cf. the existing transcript title `job-A designer`). Title form: `${id} ${seat} · attempt ${k}/${maxAttempts}` (when `attemptEntries(m).length > 1`), unchanged otherwise. This is **new copy** that escalates per R3. Vocabulary: `attempt k/N` reuses the landed `attempt N/M` token; the divider is `/` not `of` to match the row label (R3/R5 use "of" only in the parent-turn copy, not the navigator — so the divider is a vocabulary choice between R3 parity and row-parity; I flag this for `product-owner`).
- **Header** carries the cycler affordance. The existing R-KEYMAP grammar is `↑↓ move · <keys> · esc back`. Appending `←/→ attempt` follows the same separator discipline. This is **new copy** that escalates per R3.

Why split: the title answers a state question ("which attempt is on screen?"), the header answers an affordance question ("what keys do what?"). Putting both in the title duplicates the row label's `attempt N/M` and splits the truth across two surfaces. Putting both in the header gives the cycler no anchoring state. Putting state in the title and affordance in the header lets each surface say one thing.

**Vocabulary pivot the person reads correctly:** the row reads `attempt 2/3` (R4's pending ordinal). The title reads `attempt 1/3` (the tailed ordinal). A first-time visitor who never retries sees no title delta. A visitor whose retry succeeded sees `attempt 3/3` in both row and title — no surprise. The mismatch is bounded to the retrying-after-attempt-N window (where N >= 1), where the person just pressed Enter during a backoff — the only moment a mismatch can occur, and the only moment the title is on screen.

**The honest-keymap risk on the cycler.** The header form `←/→ attempt` must be paired with the cycler's `classifyProgressKey` / `routeEditorFocus` additions; if either lags, the cycler is a header lie. R-KEYMAP discipline (the EV-35 regression guard) applies — `classifyProgressKey(Key.left) === "left"` test, `routeEditorFocus` consumed for left/right, viewHost non-delivery (controller handles), one-row no-op — all asserted before the header form is allowed to render.

---

## Disputes genuinely open

**Test-settleable:**

- **Dispute 1's denotation** — owner's T2 ("Enter during backoff opens attempt N, titled attempt N") extended with the fixture I sketched above pins the (label = pending ordinal, title = tailed ordinal) split. Anyone who wants a different split writes the opposite assertion and the dispute becomes a runnable disagreement.
- **Dispute 3's classifier widening** — `classifyProgressKey(Key.left) === "left"` plus `routeEditorFocus` consumed are direct assertions. The ev9 test additions are mechanical.

**Open judgment:**

- **The cycler's one-row behavior** — consumed no-op (my preference, grounded in EV-9 floor pattern) vs. forwarded (today's behavior on unrecognized keys). I prefer consumed because the forward silently moves the editor cursor at termRows ≤ 6 only on the tree surface — at termRows ≥ 7 / surface === "progress", the cycler is reachable and consumed; at termRows ≤ 6, the cycler is unreachable (surface === "tree") and forwarding is harmless. Either way, the one-row floor (viewportRows === 1 with surface === "progress") needs an explicit choice — consumed is the smallest-delta choice that prevents an invisible cursor mutation under the user's hands if the keymap widens to include left/right.
- **The title divider** — `/` vs `of`. R3's `Retrying in 2s (attempt 2 of 3)` says `of`; the row's `attempt 2/3` says `/`. I would draft the title as `attempt ${k}/${maxAttempts}` (row-parity, slash) and escalate both with the string. Vocabulary parity with R3 is defensible; row-parity is defensible. The runner should escalate with both drafts.
- **Whether the legacy-modal title (`:869`'s modal path) gets the attempt suffix.** Owner proposed yes; FLLWUP-4 owns that path. Defer to FLLWUP-4; don't smuggle in.
- **Whether `selectedSessionId` is renamed now or rides the re-keying as a silent re-meaning.** I prefer the rename (`selectedJobId`) for clarity, but the rename touches the ev8 test name "keyed by sessionId" — handle by adding a comment that documents the rename and the EV-42 cardinality reason.

---

## The design I would defend now

1. **Row identity := `manifest.id` (job).** Two-module change (navigator + focus-nav), with rename to `selectedJobId` (or comment-documented opaque key). Re-keying dissolves the respawn-flap (`focus-nav.ts:210-215`) and is the only fix that makes the controller stable across `m.sessionId` mutation. Test: stability across respawn.
2. **Row label kept as `attempt ${m.attempt}/${maxAttempts}` per R4 verbatim.** No data-source flip. The label denotes the pending ordinal; this is R4's denotation.
3. **`openTranscript` fix at `:869`** (one-token source change: `node.manifest.id` → `node.manifest.sessionId`). Path is latent (no live caller); the fix is correct, cheap, and prevents a future regression if FLLWUP-4 ever revives the modal.
4. **Progress title gets `${id} ${seat} · attempt ${k}/${maxAttempts}` when `attemptEntries(m).length > 1`.** `k` is the attempt entry whose session is being tailed; `maxAttempts` is the policy denominator. The title is the open-territory surface where the person's "which attempt am I looking at?" question gets answered honestly. New copy → escalates per R3.
5. **Cycler affordance in the progress header** (multi-row, multi-attempt only). `←`/`→` consumed via widened `classifyProgressKey` + `routeEditorFocus`. ViewHost does NOT receive them; the controller mutates `(selectedJobId, ordinal)`. One-row floor: consumed no-op (not forwarded — prevents invisible editor cursor move). TermRows ≤ 6: surface stays tree, ←/→ forward to editor (same as today). New copy → escalates per R3.
6. **Shared resolver extracted** (`resolveAttemptFile(m, k)` over `attemptEntries(m)`). Both the inline `ensureView` and the legacy-modal `openTranscript` route through it. Single seam, single test.

The smallest delta from current shipped behavior: item 1 (cross-module) + item 3 (one line) + item 4 (new copy, escalate) + item 5 (header fragment + classifier widening, new copy, escalate) + item 6 (extract). The honest step-1 record update: card touches `extensions/navigator.ts`, `extensions/focus-nav.ts`, plus two test suites.

---

## Gulf closed (which, for whom, at what moment)

- **Evaluation gulf, "which attempt am I looking at?"** — closed for the person who has pressed Enter on a retrying row (title names the tailed ordinal). Not closed by the row label, which keeps R4's pending-ordinal denotation.
- **Evaluation gulf, "did the cycler work?"** — closed by the tail rebinding to the new attempt's session file. Existing `TranscriptView.poll()` is the feedback signal (new content from the cycled JSONL).
- **Execution gulf, "how do I see an earlier attempt?"** — closed by `←/→` in the progress header. Affordance discoverable, behavior matches the header.

---

## Falsifiable predictions (skeptic inputs)

1. **Title names the tailed ordinal** — fixture `{state:"retrying", attempt:2, attempts:[{1,"job-1"}], sessionId:"job-1", nextAttemptAt:now+7000}` with `job-1.jsonl` present; after Enter, the rendered progress title line contains `attempt 1/3` and the row above contains `attempt 2/3`. CDP `view.render(width)[0]` substring scan; smoke asserts both substrings on different lines.
2. **`←/→` re-bind the tail** — `controller.selectedSessionId` = attempt 3's session, then `←` via `viewHost.handleInput(\x1b[D)` causes the next `render()` to read `findSessionFile(..., attempt 1's session)` = attempt 1's JSONL. Unit-level smoke; `expect(view.file) === "attempt 1's path"` after the dispatch.
3. **`←/→` consumed no-op at one-row floor** — `termRowsCap = 7`, `surface === "progress"`, `viewportRows === 1`; dispatching `←` does not mutate `selectedJobId`/ordinal and does not reach the prior editor. Capture: prior editor's `handleInput` call count stays zero.
4. **`←/→` not advertised when single-attempt** — `attempts: [{1, "job-1"}]` (one entry, no retry); the progress header text does not contain `←/→ attempt`. `view.render(width)[0]` substring scan.
5. **`openTranscript` resolves the live session** — `{m.sessionId === "job-1-attempt3"}`; the resolver returns `job-1-attempt3.jsonl` not `job-1.jsonl`. Pure-function unit test on the extracted `resolveAttemptFile`.
6. **Selection survives a respawn** — `setRows(["job-1"])`, enter, select; rewrite manifest to `sessionId:"job-1-attempt2"`, `state:"running"`, re-render; assert `selectedIndex() >= 0` and the `▌` marker stays on row 0. Today: returns `-1`, marker absent.
7. **`classifyProgressKey` honors `Key.left`/`Key.right`** — `expect(classifyProgressKey(Key.left)).toBe("left")`, same for `Key.right`. Additive to the existing ev9 enumeration.

---

## Preferences, ranked last

- **Title divider `attempt k/N` over `attempt k of N`** — slash keeps row-parity; "of" keeps R3-parity. I'd draft slash because the row uses it and the title sits 1 line below the row; row-parity reads cleaner. **Taste.**
- **Header cycler copy as `←/→ attempt` over `←/→ attempts` (plural)** — singular is honest about "you're cycling through attempts" but plural reads as a noun ("the attempts feature"). I prefer singular for grammar. **Taste.**
- **One-row no-op over forwarding at one-row** — same as round 1; defended on principle (the EV-9 floor pattern). Could be overruled by `principal` or `product-owner` if they want the cycler keys always-forwards. **Taste, with a principle.**
- **Clamp over wrap on the cycler** — same as round 1; clamp gives a definite "I'm at the end" feel, wrap is a different navigation model. **Taste.**
- **Rename `selectedSessionId` to `selectedJobId` over keeping the name opaque** — clarity beats continuity; the comment update is the documentation cost. **Taste, with a principle.**
- **`resolveAttemptFile` extracted as a pure export vs. an internal helper** — pure export lets `openTranscript`'s legacy modal route through it and lets the unit test import it directly. The export adds a surface to `navigator.ts`; the helper keeps the test indirect via a fixture. **Taste.**

---

## What I will not relitigate

- **Cardinality A** — one job id, one manifest, one row. Closed by [[per-attempt-provenance]] + R4. Any per-attempt row would re-open EPIC-9.
- **The progress surface as the cycler's host** — settled by [[council-job-tree-inline]] ("Enter on a highlighted row opens the subagent's live transcript inline as an expansion"). The cycler lives in the expansion, not the tree.
- **`Key.left`/`Key.right` reach the prior editor today** — verified at `focus-nav.ts:235-238`, `:307-311`. Forwarding is the existing behavior on unrecognized keys; the cycler change is consumption, not introduction.
- **R3's vocabulary stays unchanged for the failure line and the countdown string** — read at `parent-retry.ts:111-126` (R3 re-shown in the card's Orchestrator rulings block); I have not proposed modifying it.

---


**Bound.** Dispute 1 settles by accepting owner's framing (label = pending ordinal per R4; title = tailed ordinal, new copy). Dispute 2 settles by re-keying (cross-module, real). Dispute 3 settles by widening `ProgressKey` + classifier + routing (bounded blast, not a bug class). Dispute 4 settles by splitting title-state from header-affordance (both new copy, both escalate per R3).

### Step 4 — Skeptic attack

Job `skeptic` `job-12.7` (4.1m, 17 turns), settled `done`. Given every
position recorded above, with instructions to treat each load-bearing claim
as broken until its own test said otherwise, to run every test it named, and
not to mutate the tree (probes in `/tmp`, one throwaway scratch copy since
removed). **Result: no open objections on behavior.** O1–O8 closed `green`,
O10 (baseline gates) green, and the one remainder (O9, item 2's scope) is
stated as not test-settleable — `open-untested` by nature.

#### Skeptic attack (`job-12.7`) — verbatim

## Skeptic attack — FLLWUP-45 step 4 (`job-12` round)

I treated every generator claim as broken and ran the settling test for each. No repo files edited, no branches, no checkout mutation — probes via `bun -e` in `/tmp` dirs plus one throwaway `/tmp` copy (since removed). Tree was clean throughout.

### Objections and terms

**O1 — ev7 fixture is legacy shape; the flip is invisible to it (targets owner/principal/designer round-2 §1).**
Settling test: `bun -e` importing `attemptEntries` on `{attempt:2, sessionId:"job-1"}` (no `attempts`, exactly the `ev7:180-189` / `tree.test.ts:69` shape) vs real backoff `{attempt:2, sessionId:"job-1", attempts:[{1,"job-1"}]}`.
Output: legacy → `[{"attempt":2,"sessionId":"job-1"}]` (flip renders `attempt 2/3`, unchanged); real → `[{"attempt":1,"sessionId":"job-1"}]` (flip renders `attempt 1/3`). Plus a live widget render of a real-shape retrying manifest: row = `⏸ skeptic attempt 2/3 · retrying in 7s`.
**Status: `closed-green`** — all three generators are right; the test pins vocabulary only. The designer's round-2 withdrawal stands on evidence, not deference.

**O2 — R4's text rules the pending ordinal (targets the flip's legitimacy).**
Settling test: read the instruments verbatim. `council/cards/EV-39.md` R4: *"One job-tree row per dispatch, labeled `attempt 2/3` while retrying — no extra rows and no separate status line."* `vault/wiki/per-attempt-provenance.md` Cardinality section: *"R4 makes the row label `attempt 2/3`, so the denominator is carried into the renderers…"*. The only unambiguous instance of R4's example is pending=2/settled=1 — the flip renders `attempt 1/3` in exactly that window.
**Status: `closed-green`** — the flip was a contradiction of a binding ruling, not an unruled evolution. (The card-goal-vs-R4 tension the owner flags is real and correctly routed to `product-owner` as an R4-evolution candidate.)

**O3 — re-key breaks zero test assertions.**
Settling test (two halves): (a) read the assertions — `ev8:244-256` feeds opaque `["a","b","c"]`/`["c","a","b"]` and asserts identity-not-index; ev9/ev35 feed literals into single-attempt fixtures where `id === sessionId`; no assertion pins a sessionId value as the row key. (b) Applied the re-key (setRows, `▌` compare, `ensureView` lookup, `activateSession` lookup → `manifest.id`; `keyFor` untouched) in a `/tmp` scratch copy and ran 7 suites: `83 pass, 0 fail` (ev8, ev9, ev7-widget, tree, navigator, ev35, ev36).
**Status: `closed-green`.**

**O4 — tail-cache must stay on `sessionId`; a row-key change freezes the tail.**
Settling test: read `navigator.ts:334-344` (`keyFor` → `manifest.sessionId`; `if (!this.tails.has(key)) this.tails.set(key, new TranscriptTail(file))` — file bound at construction), then `bun -e` probe: one `TranscriptTail` bound to attempt-1 file, then an attempt-2 file with later content appears. Reused object polls `[]` forever; a fresh object on the new file polls `["ATTEMPT-TWO"]`.
**Status: `closed-green`** — the freeze mechanism is real. Collateral findings, both already conceded in round 2: owner's round-1 "re-key `keyFor`" sentence was self-defeating (corrected round-2), and principal's round-1 `(jobId, attempt)` key was wrong on the specific key — during `retrying`, `attempt` advances while `sessionId` does not, so `sessionId` is the content key and the requirement is only "never the row key."

**O5 — respawn selection-loss glitch is live today.**
Settling test: `bun -e` against real `TreeFocusState`: `setRows(["job-1"])`, `enter()` → `selectedIndex()=0`; then `setRows(["job-1-attempt2"])` (what `render()` does at `:405` after the timer fires) → `selectedIndex()=-1`, stale `selectedSessionId` matches no row so the `▌` compare at `:429-430` fails on every row.
**Status: `closed-green`** — live defect reproduced. One precision note: `isAtTop()` is `true` both before (index 0) and after (−1) in the single-row case, so it is not a discriminating signal there; `selectedIndex() === -1` plus marker loss is.

**O6 — `openTranscript` reachability.**
Settling test: first-hand grep + read. `open` (`navigator.ts:506`) is a local const with zero call sites — the only `openTranscript` call inside it is `:520`; command/shortcut register only `toggleWidget` (`:620-631`). `onActivate` is stored (`focus-nav.ts:282`) and never invoked — Enter at tree surface calls `controller.enterProgress(...)` (`focus-nav.ts:318`), a path the ev9 integration test (`:353-371`, *"onActivate stays present but must NOT be the Enter path"*) pins green. Caveat confirmed: principal's round-2 correction holds — `CouncilTree` + Enter→activate **is** asserted at `test/navigator.test.ts:66-73`, so this is test-pinned dead code, not compiler-dead.
**Status: `closed-green` on reachability; scope judgment below in O9.**

**O7 — cycler key facts.**
Settling test: `bun -e` probe — `classifyProgressKey(Key.left)` → `"other"`, `Key.right` → `"other"`; `routeEditorFocus` progress for an unclassified key → `{action:"forward"}`. `ProgressKey` (`focus-nav.ts:25`) has no left/right member; `ev9:48-60` enumerates only ENTER/ESC/UP/DOWN/e/t/f/g/G/x.
**Status: `closed-green`** for principal's round-2 account; designer's round-1 "classify as up/down, no new branch" was wrong (corrected round-2 — left/right need a union widening + classifier branches + routing case; additive, no existing assertion breaks).

**O8 — "cannot ship copy-free."**
Attack: I tried to construct a zero-new-string design. It fails both horns: keep R4's `attempt 2/3` row + show attempt-1 content ⇒ the shown ordinal must appear somewhere, and the progress title (`navigator.ts:466`: `` `${id} ${seat}` ``, no ordinal today) is the only non-ruled surface — a new string. Flip the row ⇒ contradicts R4 (O2). A cycler without advertisement violates honest-keymap R-KEYMAP. The `/`-vs-`of` divider choice is a genuine second judgment inside the string.
**Status: `closed-green`** — I attacked the generators' consensus and lost; minimum one new string (progress-title attempt fragment), two iff the cycler ships. Both escalate per R3.

**O9 — item-2 scope split (shared-resolver fix here vs defer to FLLWUP-4).**
No runnable test distinguishes these: both horns produce identical green suites (the path is unreachable; the only test touching it, `navigator.test.ts:66-73`, asserts the `CouncilTree` activator plumbing, not the `:869` resolution). Frankly **not test-settleable — `open-untested`** by nature, not by neglect. My reading for the record: deferral is sound *only* with the finding recorded on FLLWUP-4's card (its acceptance is literally "guard removed or corrected"), and the reachable path needs no `:869`-style fix at all — `ensureView` already resolves `selectedSessionId`, never `manifest.id`. The designer's shared-resolver extraction is still worth doing here because item 1 needs the accessor anyway; FLLWUP-4 then inherits it for free.

**O10 — baseline gates on the clean tree.**
- `bunx tsc --noEmit` → exit 0, no output.
- `bun test` → `867 pass, 2 skip, 0 fail` (5564 expects, 76 files, 94.67s).
- `python3 council/validate.py` → `All council artifacts valid`, exit 0.
- `bash council/preflight.sh FLLWUP-45` → `PASS: preflight clean` (all lines OK). Note: the known FLLWUP-27 branch-freshness FAIL artifact did **not** fire on this run.
- `COUNCIL_INTEGRATION=1` not run, per instructions.
**Status: `closed-green` on all four.**

### What I ran (actual commands, abridged outputs above)

1. `bun -e` probe: `attemptEntries` legacy vs real-backoff shapes + flip rendering.
2. `bun -e` probe: `TreeFocusState` respawn transition (`selectedIndex` 0 → −1).
3. `bun -e` probe: `classifyProgressKey(Key.left/right)` → `other/other`; `routeEditorFocus` progress → `forward`.
4. `bun -e` probe: real-shape retrying manifest through `CouncilTreeWidget.render(200)` → `⏸ skeptic attempt 2/3 · retrying in 7s`.
5. `bun -e` probe: `TranscriptTail` object-reuse freeze vs fresh-object read.
6. Scratch copy in `/tmp`: 4-site re-key, `bun test` on 7 files → 83/83 (copy removed afterwards).
7. Greps/reads: `open(`/`onActivate` call sites, `navigator.test.ts:66-73`, `ev9:353-371`, `focus-nav.ts:275-325`, `navigator.ts:506-640/868-880`.
8. Gates: tsc, full `bun test`, `validate.py`, `preflight.sh FLLWUP-45`.

### Verdict

**`no open objections`** on behavior — O1–O8 closed-green (two of them closed against positions their own authors already withdrew, recorded as such), O10 green on all gates. The single remainder, O9, is a scope judgment I state frankly cannot be settled by any test; my input is that deferral is sound conditional on the `:869` finding being recorded on FLLWUP-4. Gate-integrity note: I did not inject a defect to watch a gate go red (no file edits permitted this turn); the gates are reported as observed-green only, with the full outputs above.

### Step 5 — synthesis

Job `consolidator` `job-12.8` (1.5m, 4 turns), settled `done`. Given the
full deliberation record.

#### Consolidator synthesis (`job-12.8`) — verbatim

## Synthesis — FLLWUP-45 (step 5)

I read the full card (`council/cards/FLLWUP-45.md`, 796 lines): Phase-1 rulings, step-1 grounded facts, step-2 round 1 (owner `job-12.1`, principal `job-12.2`, designer `job-12.3`), step-3 round 2 (`job-12.4`/`12.5`/`12.6`), and step-4 Skeptic (`job-12.7`, O1–O10). Below is what the record actually settled, what it left open, and what the owner must satisfy. I add no design the deliberation did not produce.

### Agreed design (what every seat converged on, with the artifact behind it)

- **Row/selection identity := `manifest.id` (job), not `sessionId`.** Re-key `setRows` (`navigator.ts:405`), the `▌` marker compare (`:429-430`), and `ensureView`'s node lookup (`:464`). Settled by **O3** (scratch-copy re-key applied, 7 suites run → 83 pass / 0 fail) and **O5** (respawn selection-loss reproduced live today: `selectedIndex()` 0 → −1, marker lost). The re-key breaks zero existing assertions — `ev8:244-256` feeds opaque strings and asserts identity-not-index, not a sessionId value.
- **Content identity := `manifest.sessionId`, unchanged.** `keyFor`/`tails`/`lastBlocks` (`navigator.ts:334-353`) stay keyed on `manifest.sessionId`, **never** on the new row key. Settled by **O4**: `TranscriptTail` binds its file at construction (`:342-344`), so a job-id key would freeze the tail on attempt 1's file forever after respawn while `findSessionFile(…, manifest.sessionId)` points elsewhere. Owner's round-1 "re-key `keyFor`" sentence and principal's round-1 `(jobId, attempt)` key were both withdrawn in round 2 (owner §3, principal dispute 3).
- **Row label keeps `m.attempt` (the pending ordinal) verbatim per R4.** The designer's data-source flip (read `attempts[last].attempt` during `retrying`) is withdrawn. Settled by **O1** (the `ev7:180-189` / `tree.test.ts:69` fixtures are legacy-shape — no `attempts` field — so `attemptEntries` synthesizes `[{attempt:2,…}]` and the flip is invisible to them; but on real backoff substrate the flip renders `attempt 1/3`) and **O2** (R4's text in `council/cards/EV-39.md` + `vault/wiki/per-attempt-provenance.md` fixes `attempt 2/3` as the pending ordinal in the first-retry window; the flip contradicts a binding ruling, not an evolution).
- **The label/tail mismatch is repaired in the progress title, not the row.** The shown attempt's ordinal appears in the progress title (`navigator.ts:463-465`, which today carries no ordinal). Settled by **O8**: no zero-new-string design exists — keep R4's row + show attempt-N content ⇒ the ordinal must appear somewhere, and the title is the only non-ruled surface; flip the row ⇒ contradicts R4 (O2).
- **Cardinality A preserved.** One job id, one manifest, one row; per-attempt browsing lives in the inline progress expansion, not new tree rows. Converged by all three seats; grounded in `vault/wiki/per-attempt-provenance.md` (not separately Skeptic-tested, but no seat contested it).
- **The cycler, if it ships, is a progress-surface affordance with a separate content cursor** (`attemptCursor`), **not** a mutation of `controller.selectedSessionId`. The designer's round-1 mechanism (move `selectedSessionId` to an attempt's session id) is rejected: an attempt's session id is not in the row list, so `selectedIndex()` → −1 and the marker vanishes again — the identical bug one keystroke later. Settled by owner round-2 §2 and principal round-2 reframe, both first-hand against `focus-nav.ts:151-152`; not separately Skeptic-probed but uncontested in round 2.
- **Cycler keys require real classifier widening.** `ProgressKey` has no left/right member, `classifyProgressKey` (`focus-nav.ts:67-99`) has no left/right branch, `routeEditorFocus`'s progress case consumes only `up/down/e/t/f/g/G`, delivery is list-gated (`focus-nav.ts:299`), and `ev9:48-60` enumerates only ENTER/ESC/UP/DOWN/e/t/f/g/G/x. Settled by **O7**: `classifyProgressKey(Key.left)` → `"other"`, `Key.right` → `"other"` today; `routeEditorFocus` forwards. The designer's round-1 "no new branch" was wrong (withdrawn round-2). Additive — no existing assertion breaks.
- **Baseline gates green on the clean tree.** Settled by **O10**: `tsc` exit 0; `bun test` 867 pass / 2 skip / 0 fail; `validate.py` valid; `preflight.sh FLLWUP-45` PASS (the FLLWUP-27 branch-freshness artifact did not fire this run).
- **`openTranscript` at `navigator.ts:869` is dead in the shipped surface, test-pinned not compiler-dead.** Settled by **O6**: `open` (`:506`) has zero call sites; command/shortcut register only `toggleWidget` (`:620-631`); `onActivate` stored (`focus-nav.ts:282`) and never invoked — Enter routes to `enterProgress` (`focus-nav.ts:318`), pinned by `ev9:353-371`. Caveat: `CouncilTree` + Enter→activate is asserted at `navigator.test.ts:66-73`, so the path is test-pinned dead code. Its *disposition* is open (see (d) below).

### Settled disputes (each with the closing test and its result)

- **The label data source.** O1 + O2, closed-green. O1 probe: `attemptEntries` on legacy `{attempt:2,sessionId:"job-1"}` → `[{attempt:2,…}]`; on real backoff `{attempt:2,sessionId:"job-1",attempts:[{1,"job-1"}]}` → `[{attempt:1,…}]`; live widget render → row `⏸ skeptic attempt 2/3 · retrying in 7s`. O2: R4 verbatim. Result: the flip is invisible to the shipped tests but contradicts R4 on real substrate — withdrawn by its author.
- **Whether the re-key moves the ev8/ev9 suites.** O3, closed-green. Result: zero assertions move; only names/docstrings do. Principal's round-1 "suites move with it" and owner's round-1 "one file" scoping were both overstated (withdrawn round-2).
- **The tail-cache key.** O4, closed-green. Result: `sessionId` is the content key; a row-key-keyed cache freezes the tail (probe: reused `TranscriptTail` polls `[]` forever vs fresh object polls `["ATTEMPT-TWO"]`).
- **The respawn selection-loss glitch.** O5, closed-green. Result: live defect reproduced (`selectedIndex()` 0 → −1, marker loss). Precision note from O5: `isAtTop()` is not discriminating in the single-row case.
- **`openTranscript` reachability.** O6, closed-green. Result: dead in shipped surface; test-pinned at `navigator.test.ts:66-73`.
- **Cycler classifier state today.** O7, closed-green. Result: `Key.left`/`Key.right` → `"other"`; widening is additive.
- **"Cannot ship copy-free."** O8, closed-green. Result: minimum one new string (progress-title attempt fragment), two iff the cycler ships; both escalate per R3.

### Open judgment — for `product-owner`, escalating to `steward`

These no test can settle. Each blocks only its own portion; the rest of the design ships independently.

- **(a) The two new user-visible copy strings.** Both escalate per R3 with the drafted string; the runner returns `ESCALATION` rather than shipping unruled copy.
  - **Progress-title attempt fragment** — drafted `` `${id} ${seat} · attempt ${k}/${maxAttempts}` `` (rendered when `attemptEntries(m).length > 1`). **Divider choice `/` vs `of` is open:** row-parity (`/`, matches `navigator.ts:372` and `tree.test.ts:70`) vs R3/R5-parity (`of`, matches `parent-retry.ts:112`). Designer drafts `/` and flags both for `product-owner`. Required regardless of divider — without it the ruled label and the shown content are indistinguishable, so the card goal is unmet.
  - **Cycler header advertisement** — drafted `←/→ attempt` appended to the existing R-KEYMAP hint line, gated on browsable attempts > 1. **Key choice `←/→` vs `[`/`]` is open** and fixes the advertised copy: `←/→` are unclaimed in `classifyProgressKey` and forward-unhandled on the tree surface (no EV-8 collision, verified O7), but principal notes `←/→` sits next to `↑↓ move` whose semantics in `TranscriptView` are follow/scroll, so the ad needs a disambiguating noun and `[`/`]` avoids that collision entirely. Taste + one grounded tradeoff. Required iff the cycler ships (see (c)).
- **(b) Whether the row's `attempt N/M` denotation should eventually follow the tailed attempt rather than R4's pending ordinal.** Owner-flagged card-goal-vs-R4 tension: the card `goal` ("the backoff row's label matches the attempt it denotes") reads toward the flip; R4's letter fixes the pending ordinal. O2 confirms the tension is real and correctly routed. Routes to `product-owner` as an R4-evolution candidate. **Does not block this card** — it ships on R4's letter either way; the title carries the tailed ordinal.
- **(c) Whether the attempt cycler ships in this card at all, vs. a follow-up.** Principal round-2 lists this explicitly as open judgment. The cycler requires the header-ad string (a), the classifier widening (O7, additive), a separate `attemptCursor`, and the one-row/no-op/legacy-no-op gating. **Blocks the cycler portion only** — the re-key, the title fragment, and item 2's disposition ship without it.
- **(d) Disposition of item 2 (`navigator.ts:869`'s `openTranscript` resolving `manifest.id`).** **O9 states this is not test-settleable** (`open-untested` by nature): both horns (fix in this card via the shared resolver, or defer to FLLWUP-4 with the finding recorded) produce identical green suites — the path is unreachable and the only touching test (`navigator.test.ts:66-73`) asserts the `CouncilTree` activator plumbing, not the `:869` resolution. Positions at equal weight:
  - **Owner + principal: defer to FLLWUP-4** (which owns the dead modal path; its acceptance is "guard removed or corrected") and record the `:869` finding on FLLWUP-4's card. Hardening a path another card may delete spends budget on a ghost; the reachable path (`ensureView`) already resolves `selectedSessionId`, never `manifest.id`, so no `:869`-style fix is needed for item 1.
  - **Designer: fix in this card via the shared resolver** (`resolveAttemptFile(m, k)` extracted from `attemptEntries(m)`), so both `ensureView` and `openTranscript` route through one seam; FLLWUP-4 inherits it for free. One-token source change at `:869` (`node.manifest.id` → `m.sessionId`); cheap and prevents a future regression if FLLWUP-4 revives the modal.
  - Skeptic's recorded input: deferral is sound *conditional* on the finding being recorded on FLLWUP-4; the shared-resolver extraction is worth doing here regardless because item 1 needs the accessor anyway. **Blocks only item 2's disposition.**
- **(e) Minor, non-blocking taste calls** (stated for the record, cheap either way, do not block the card): `selectedSessionId` rename now (to `selectedRowKey`/`selectedJobId`, mechanical across 5 test files — principal favors) vs. re-document now (designer's minimum); cycler one-row behavior — consumed no-op (designer, EV-9 floor pattern) vs. forwarded (today's behavior on unrecognized keys); clamp vs. wrap on the cycler. These ride the ruling on (c); if the cycler does not ship, (e)'s cycler items are moot.

### Open objections — Skeptic objections standing without a passing settling test

None on behavior. The record reports O1–O8 and O10 closed-green, and **O9 is `open-untested` by nature** — the Skeptic itself states no runnable test distinguishes the two horns. Per the synthesis contract, O9 is a scope judgment no test can settle, so it routes to **open judgment (d)** above, not to an open objection. I found no objection the record mislabelled: O8 is correctly closed on its actual claim ("cannot ship copy-free"); the `/`-vs-`of` divider it surfaces is a separate open judgment (a), not a hidden objection.

### Ready to hand off?

**No — not to a ruling seat on the whole card.** The behavioral design is settled and the owner can implement everything in **Agreed design** plus the test set below without further ruling, *except* for four open judgment calls that must route to `product-owner` (escalating to `steward`):

1. The progress-title string, including the `/`-vs-`of` divider (a).
2. The cycler header advertisement string, including the `←/→`-vs-`[`/`]` key choice (a).
3. Whether the cycler ships in this card at all (c). If **no**, strings (a)-2 and (e)-cycler drop and the card narrows to re-key + title + item 2 disposition.
4. Item 2's disposition — fix in-card via the shared resolver, or defer to FLLWUP-4 with the finding recorded (d). (If the cycler does not ship, the shared-resolver extraction is still wanted per Skeptic's O9 input, but its necessity is weaker.)

(b) — the R4-evolution candidate — routes to `product-owner` as a recorded finding; it does not block this card either way.

### Test set the owner must satisfy (red today, green after; plus untouched-green)

Unconditional (ship regardless of the open judgments):

1. **Selection survives a respawn transition** — `setRows(["job-1"])`, `enter()`; mutate manifest to `running`/`attempt 2`/`sessionId: "${id}-attempt2"` (simulating timer fire), re-render; assert `selectedIndex() === 0` and `▌` stays on that row. Red today (O5: −1, marker lost).
2. **Title names the tailed ordinal during backoff** — fixture `{state:"retrying", attempt:2, sessionId:"job-1", attempts:[{attempt:1,sessionId:"job-1"}], nextAttemptAt: now+7000}` + `job-1.jsonl`; assert row contains `attempt 2/3` **and** title contains `attempt 1/3` **and** `titleOrdinal === 1 + indexOf(sessionId in attemptEntries(m))`. Red today (O1, O8: no title ordinal).
3. **Browsable-set resolution** (pure helper) — retrying attempt 2 → `[{1, id}]` and **not** the pending 2; running attempt 2 → `[{1}, {2, live}]`; settled attempt 3 → 1..3 ending at `manifest.sessionId`; legacy `{attempt:2, attempts:undefined}` → `[{2, sessionId}]` via `attemptEntries`' fail-closed fallback. The legacy carve-out must be pinned explicitly (O1).
4. **Tail-cache keying guard** — after a respawn with a new file and appends, the running row's last-activity comes from attempt 2's JSONL; a fix that keys `tails`/`lastBlocks` on the row key (`manifest.id`) goes red here. Green today (O4); ships as the re-key's guard-rail.
5. **Untouched and green** — `test/ev7-council-tree-widget.test.ts:180-189`, `test/tree.test.ts:65-73`, `test/ev40-parent-retry.test.ts` R5 strings, `test/ev8-focus-navigation.test.ts:244-256`, `test/ev9-progress.test.ts:353-371` (onActivate-not-Enter).

Conditional on open judgment (c) — cycler ships in this card:

6. **Cycler does not own the row key** — after one cycler press, `setRows` values are still job ids and `selectedIndex() !== -1` (principal claim 4; red under the designer's withdrawn round-1 mechanism).
7. **`←/→` consumed no-ops at the one-row floor** (`termRowsCap = 7`, `surface === "progress"`, `viewportRows === 1`); not advertised when `attemptEntries(m).length <= 1`. Red today (O7: `Key.left`/`Key.right` → `"other"`, forwarded).
8. **`classifyProgressKey` additive** — `classifyProgressKey(Key.left) === "left"`, same for `Key.right`; additive to `ev9:48-60` enumeration, no existing assertion breaks (O7).

Conditional on open judgment (d) — in-card fix horn chosen:

9. **Shared resolver resolves the live attempt's session** — for a settled `{attempt:2, attempts:[{1,id},{2,"${id}-attempt2"}], sessionId:"${id}-attempt2"}`, `resolveAttemptFile` returns the attempt-2 file, not `node.manifest.id`. Today `:869` resolves attempt 1's session; unreachable from any key press, so no surface-level test can falsify it — must be a pure-helper unit test (principal claim 3, designer prediction 5). If the defer horn is chosen, this test is not added in this card and the finding is recorded on FLLWUP-4 instead.

Gate set the owner re-runs at step 11 (per the card's step-1 gate note): `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (the FLLWUP-27 branch-freshness clause of `preflight.sh` is a known-by-construction artifact once a facilitator commit advances `origin/main`; O10 reports it did not fire this run).

### Step 6 — routing (facilitator)

The consolidator names four blocking open-judgment calls and one
non-blocking finding. Checked against the run's Phase-1 rulings before any
routing:

- **R3 (FLLWUP-44, carried)** explicitly makes **new user-visible copy**
  open-judgment — it must be escalated with the drafted string rather than
  shipped unruled. That squarely covers open judgment **(a)** (the two new
  strings and the two choices folded into them: the `/` vs `of` divider and
  the `←/→` vs `[`/`]` key, since the key choice fixes the advertised copy).
- No Phase-1 ruling answers **(c)** (whether the attempt cycler ships in
  this card at all) or **(d)** (item 2's disposition — fix in this card via
  the shared resolver, or defer to FLLWUP-4 with the finding recorded).
  Both are scope/judgment calls on the card's own deliverable; the record
  carries positions at equal weight and no test distinguishes them
  (Skeptic O9). Under `<escalation_contract>` these are the orchestrator's
  to route to the judgment seat, not this container's to decide.
- **(b)** (the R4-evolution candidate for the row label's denotation) is
  recorded as a non-blocking finding: this card ships on R4's letter either
  way, and the candidate is a follow-up/step-13 item. Returned in the
  escalation packet as a fact for the ruling seat, not as a blocker.
- **(e)** (rename-now vs re-document-now, cycler one-row/clamp/wrap taste)
  is non-blocking and rides the ruling on (c).

Therefore this container ends its turn with an `ESCALATION` carrying the
drafted strings, the equal-weight positions on (c) and (d), and the
non-blocking (b)/(e) findings — facts only, no recommendation. The card
stays `Deliberating`; a resumed turn appends the ruling verbatim and
continues at step 7.

### Step 6b — PO ruling returned (product-owner) — APPENDED VERBATIM

The four open judgments consolidated in step 5 route here under R3 (copy
escalates with the drafted string) and the orchestrator's step-6 routing.
Recorded human decision R4 (EV-39) is binding and unchanged; this card
ships on R4's letter. The four blocking calls are ruled; (b) and (e)
are recorded/defaulted.

Appended verbatim:

- **Ruling** — **(a) Progress-title attempt fragment.** Rendered when
  `attemptEntries(m).length > 1`, form
  `` `${id} ${seat} · attempt ${k}/${maxAttempts}` `` where `k` is the
  ordinal of the tailed attempt entry
  (`attemptEntries(m)[indexOf(m.sessionId)].attempt`). **Divider: `/`**
  (row-parity, matches `navigator.ts:372` and `tree.test.ts:70`). R3's
  `Retrying in 2s (attempt 2 of 3)` is parent-turn copy at
  `parent-retry.ts:112` and is untouched; this title lives inside the
  navigator surface, and row-parity reads as one form across the row and
  the title. **(b) Cycler header advertisement.** Appended to the
  existing R-KEYMAP hint line (`navigator.ts:839`-area) when
  `attemptEntries(m).length > 1`: `· [/] attempt`. **Key choice: `[/]`
  over `←/→`.** Two reasons: (1) `↑↓ move` is already in the header; its
  semantics in `TranscriptView` are follow/scroll. `←/→` reads as a
  parallel arrow pair cueing the same "movement" operation, when the
  cycler is per-attempt, not horizontal scroll — `[/]` avoids that
  semantic collision. (2) Bracketed keys are visually distinct from the
  arrow family and reuse the EV-35 letter-key pattern (`e`, `t`, `f`,
  `g`, `G`). `matchesKey` discipline applies; CSI-u / modifyOtherKeys
  forms are honored by construction. **Q2 — cycler ships in this
  card. Yes.** The card's `goal` is "a retried dispatch's attempt
  transcripts are reachable from the navigator." Under cardinality A
  ([[per-attempt-provenance]], binding — one job, one manifest, one
  row), new tree rows are forbidden; the progress surface is the only
  place to expose per-attempt transcripts; and the cycler is the only
  affordance the record produced for reaching a non-latest attempt.
  Without it the goal is partially unmet (latest reachable, earlier
  attempts not). Cost is bounded: `ProgressKey` widening, two
  `classifyProgressKey` branches, one `routeEditorFocus` case, one
  delivery seam in `CustomTreeEditor.handleInput`, one header fragment,
  additive tests. O7 confirms `Key.left`/`Key.right` reach the controller
  today as `"other"`/forward, so the new keys are additive, not breaking.
  The cycler shares machinery with the re-key (a separate
  `attemptCursor` — designer's round-1 mechanism rejected on the
  respawn-flap basis at `focus-nav.ts:151-152`) and the title
  (`resolveAttemptFile` accessor); splitting into a follow-up duplicates
  work rather than reducing it. **Q3 — item 2's disposition. Defer to
  FLLWUP-4, with the finding recorded via the step-13 follow-up draft.**
  Three reasons: (1) `openTranscript` (`navigator.ts:869`) is test-pinned
  dead code (Skeptic O6; `test/navigator.test.ts:66-73` asserts the
  `CouncilTree` activator plumbing), not compiler-dead. FLLWUP-4's stated
  acceptance is literally *"guard removed or corrected"* — the card may
  delete the path entirely, in which case a one-line fix at `:869` here
  is thrown away. (2) The shared resolver `resolveAttemptFile` is
  extracted in this card regardless, because item 1's "title names the
  tailed ordinal" logic needs the same accessor over
  `attemptEntries(m) ∪ live manifest.sessionId`. FLLWUP-4 inherits it
  for free; if FLLWUP-4 picks "keep the modal," the fix is one token
  (`m.sessionId` against the resolver) at the shared seam. (3) The
  principal's framing — *"hardening a path another card may delete
  spends budget on a ghost"* — applies cleanly: the bug is small, the
  patch is one line, and that one line is best spent by FLLWUP-4 if it
  keeps the path or saved entirely if it deletes it. This container
  cannot write to FLLWUP-4 directly (the card's step-13 follow-up is
  re-homed to `product-owner` per R3); the `:869` finding is captured in
  the step-13 follow-up draft this card produces. **(b) R4-evolution
  candidate — recorded, not ruled.** Owner-flagged: the card `goal`
  ("the row's label matches the attempt it denotes") reads toward the
  tailed ordinal; R4 fixes the pending ordinal. Skeptic O2 confirms the
  flip contradicts R4 in the canonical first-retry window. The card
  ships on R4's letter regardless (title carries the tailed ordinal;
  row carries the pending). Evolving R4 is portfolio-level — recorded
  human decision — and belongs to `steward`. Surfaced in the step-13
  follow-up as a candidate R4 evolution; if the steward picks it up, the
  resolution is a follow-up card that flips the row source and removes
  the title-attempt fragment. **No work in this card; no scope
  change.** **(e) Defaults if the cycler ships.**
  `selectedSessionId → selectedRowKey` rename in the same change
  (mechanical across `focus-nav.ts`, `navigator.ts`, and 5 test files;
  prevents shipping a second lie under which the field still holds
  sessionIds — gate-parity spirit, `vault/wiki/gate-parity.md`).
  Cycler at one-row floor (`termRowsCap === 7`, `viewportRows === 1`):
  consumed no-op, matching the EV-9 floor pattern (`Enter` consumed at
  `termRows ≤ 6`); strongest non-color signal at a floor where the
  header that would advertise the cycler is suppressed; prevents
  invisible cursor mutation under the user's hands. Cycler endpoints:
  clamp, not wrap — "I'm at the latest attempt" is a clearer terminal
  state than wraparound; consistent with `TranscriptView` clamp
  semantics on cursor bounds.

- **Options rejected** — **(a) `of` divider** (R3/R5-parity): rejected —
  creates a third spelling of `attempt N/M` on the same navigator
  surface; this card does not unify vocabulary across surfaces in this
  scope, row-parity is the cheaper call. **(b) `←/→`**: rejected for the
  semantic-collision reason (`↑↓ move` reads as parallel arrows
  cueing "movement," when the cycler is per-attempt, not horizontal
  scroll). **`[/] attempts` (plural)**: rejected for grammar; singular
  `attempt` parallels the existing `<glyph> <verb>` pattern (`↑↓ move`,
  `e expand`, `t thinking`, `f follow`, `g/G jump`, `esc back`).
  **Q2 — "cycler is a follow-up card"**: rejected — the goal is unmet
  without it; the cycler's seam (separate `attemptCursor`,
  `resolveAttemptFile`) depends on the re-key and resolver which ship
  here, so a follow-up duplicates rather than reduces work. **Q2 — "use
  new tree rows"**: rejected — cardinality A is
  [[per-attempt-provenance]]-binding. **Q2 — "add a picker modal"**:
  rejected — adds a second interaction surface; principal's named
  blind spot. **Q3 — "fix `:869` in this card"**: rejected — if
  FLLWUP-4 deletes the modal, the patch is wasted; the resolver the
  patch would consume is in this card regardless, so FLLWUP-4 gets the
  right seam for free. **(e) "Keep `selectedSessionId` as opaque row
  key with comment only"**: rejected — the rename is mechanical and
  prevents a documented-but-not-enforced lie. **"Forwarded at one-row
  floor"**: rejected — would silently mutate the editor cursor under
  the user's hands; contradicts the EV-9 floor pattern. **"Wrap at
  endpoints"**: rejected — wraparound obscures "which end am I on"
  under fast cycling.

- **Grounding** — `vault/wiki/per-attempt-provenance.md` (cardinality A;
  `attempt N/M` token ruled by R4; the substrate accessor
  `attemptEntries`). `vault/wiki/council-job-tree-inline.md` (inline
  progress expansion as the only surface to expose per-attempt
  transcripts under cardinality A; `↑↓ move` advertisement in the
  existing header; one-row floor at `termRows ≤ 6`). `vault/wiki/honest-keymap.md`
  (R-KEYMAP discipline; `matchesKey` (CSI-u / modifyOtherKeys) for new
  keys; advertised keys must be honored; EV-35 letter-key pattern).
  `vault/wiki/gate-parity.md` (rename-vs-silent-re-meaning discipline).
  `council/cards/EV-39.md` R4 (pending-ordinal ruling, binding and
  unchanged; "labeled `attempt 2/3` while retrying — no extra rows and
  no separate status line"). `council/cards/FLLWUP-4.md` (acceptance
  *"guard removed or corrected"*; `epic: null`; outside this run).
  `council/cards/FLLWUP-45.md` step-1 ruling R3 (new copy escalates
  with the drafted string; step-13 follow-up re-homed to
  `product-owner`); step-4 Skeptic O1 (legacy-shape carve-out), O2 (R4
  binds pending ordinal), O3 (re-key breaks zero assertions), O4
  (tail-cache must stay on `sessionId`), O5 (respawn selection-loss is
  live), O6 (`openTranscript` reachability: test-pinned dead), O7
  (`Key.left`/`Key.right` widen `classifyProgressKey` additively), O8
  (cannot ship copy-free), O10 (baseline gates green) — closed-green;
  O9 `open-untested` by nature. Consolidator synthesis (re-key,
  title-as-denotation source, cycler-with-separate-cursor, FLLWUP-4
  deferral condition).

- **Reversibility** — **(a) Progress-title string**: one-line edit at
  `navigator.ts:466`-area; trivially reversible. **(b) Cycler header
  key/token**: header token + classifier branches + routing; trivially
  reversible to `←/→` or any other choice. **Q2 (cycler ships)**: if the
  cycler proves wrong, a follow-up removes it; cost is bounded to the
  cycler pieces (`focus-nav.ts` union + classifier + routing + delivery
  + header fragment + cycler tests). **Q3 (defer item 2)**: if FLLWUP-4
  picks "keep modal," a one-line amend at `:869` using the shared
  resolver closes the gap; minimal. **(b) R4-evolution candidate**:
  not a ruling; no work in this card; surfaces to `steward` as a
  candidate, where it can be promoted to a follow-up card without
  touching the live one. **(e) Rename**: mechanical across 5 test
  files; one-row behavior is the smallest-delta choice (reverses to
  forwarded in one line); clamp-not-wrap reverses to wrap in one line.

**Effect on this card.** Open judgments (a) progress-title + divider,
(a) cycler header + key, (Q2) cycler ships in this card, (Q3) defer
`:869` to FLLWUP-4 — all resolved. (e)'s cycler items ride the design;
(e)'s rename is a mechanical carry of the re-key. (b) the R4-evolution
candidate is recorded as a step-13 follow-up candidate, not a blocker.
Card may resume at step 7 with this ruling appended verbatim.
### Step 6c — facilitator consistency check on the Step 6b ruling (ESCALATED)

Before writing the step-7 spec, the facilitator checked the two predicates
the Step 6b ruling states for the title fragment and the cycler advertisement
against the substrate and against the deliberation's own settled definition
of the browsable-attempt set. Two mismatches were found. Both route to the
ruling seat per `<escalation_contract>`; neither is resolved in this
container, and no recommendation is carried.

First-hand substrate probe (`bun -e`, `attemptEntries`):

- First-retry backoff — `{state:"retrying", attempt:2, sessionId:"job-1",
  attempts:[{attempt:1,sessionId:"job-1"}]}` → `attemptEntries(m)` =
  `[{attempt:1,sessionId:"job-1"}]`, **length 1**.
- Running attempt 2 before it settles — `{state:"running", attempt:2,
  sessionId:"job-1-attempt2", attempts:[{attempt:1,sessionId:"job-1"}]}` →
  `attemptEntries(m)` = `[{attempt:1,sessionId:"job-1"}]`, **length 1** (the
  live attempt enters `attempts` only at settle, `hub.ts:354-363`).
- Legacy retrying — `{attempt:2, attempts:undefined}` → `[{attempt:2,
  sessionId}]`, length 1.

The deliberation's settled browsable set is **`attemptEntries(m)` ∪ the live
`manifest.sessionId`** (owner round 1 "Browsable set"; principal round 2
reframe "resolved through one extracted pure function over
`attemptEntries(m)` ∪ the live `manifest.sessionId`"; consolidator "Agreed
design"; synthesis test 3). The Step 6b ruling gates both surfaces on the
**raw accessor** length:

> title: "Rendered when `attemptEntries(m).length > 1`"
> header: "when `attemptEntries(m).length > 1`: `· [/] attempt`"

**Question (i) — title-fragment gate.** Under the ruling's literal
predicate the fragment is absent in the first-retry backoff window — the
window the card's Intent names ("the live backoff row's tail-versus-label
mismatch"), the window the designer's round-2 position says the title is on
screen for ("the only moment a mismatch can occur, and the only moment the
title is on screen"), and the window the synthesised **unconditional**
test 2 covers (fixture above + `job-1.jsonl`; assert title contains
`attempt 1/3`). Under the literal predicate that assertion is red and the
window shows `job-1 owner` with no ordinal while the row reads
`attempt 2/3`. Candidate predicates on the record: the literal
`attemptEntries(m).length > 1`, or one that includes the retried/backoff
window (`m.attempt > 1`, i.e. the job has retried). No test in the record
distinguishes anything else.

**Question (ii) — cycler-advertisement gate.** Under the ruling's literal
predicate a running attempt 2 (browsable = 2 via the live `manifest.sessionId`)
advertises neither `[/] attempt` nor a title ordinal, even though the cycler
would reach attempt 1 — contradicting O7's additive-cycler premise and the
deliberated "browsable > 1" gating. Candidate predicates on the record: the
literal raw-accessor length, or the resolver's browsable count
(`attemptEntries(m)` ∪ live session, length 2 in that window).

Card state remains `Deliberating`. No other part of the Step 6b ruling is in
question: the copy strings, `/` divider, `[/]` key choice, Q2 (cycler ships),
Q3 (defer `:869` to FLLWUP-4), and the (b)/(e) defaults are applied as ruled.
A resumed turn appends the ruling on (i)/(ii) verbatim and proceeds at step 7.

### Step 6d — PO ruling on the (i)/(ii) gate predicates (product-owner) — APPENDED VERBATIM

The Step 6c consistency check routed the two predicate mismatches to the
ruling seat. `product-owner` (job-15) has clarified the gate predicate. The
ruling below is appended verbatim and is binding; the facilitator writes it,
the ruling seat did not.

Appended verbatim:

- **(i) Title-fragment gate:** `m.attempt > 1`. The named first-retry-backoff window fires (`m.attempt = 2 > 1`); running and settled retried states fire too, redundantly but harmlessly (title's `attempt N/M` matches the row label's `attempt N/M` outside the retrying window). Rejected literal `attemptEntries(m).length > 1` (fails the card's named window; makes synthesised test 2 red). Rejected `state === "retrying"` (tighter but unnecessarily narrow).
- **(ii) Cycler-advertisement gate:** `browsableAttempts(m).length > 1`, where
  ```
  browsableAttempts(m) = attemptEntries(m)
    ∪ [{ attempt: m.attempt ?? 1, sessionId: m.sessionId }]   iff m.sessionId ∉ attemptEntries(m)
  ```
  Extract as a pure helper co-located with `attemptEntries` in `extensions/runs.ts`. Rejected literal raw-accessor length (fails the running-attempt-2 pre-settle window; leaves the cycler silently reachable — an `honest-keymap`/R-KEYMAP discoverability defect).
- **Companion fix (required):** replace the Step 6b ruling's `k = attemptEntries(m)[indexOf(m.sessionId)].attempt` with `k = browsableAttempts(m).find((e) => e.sessionId === m.sessionId)?.attempt ?? 1` (the live session is not in `attemptEntries` until settle, `hub.ts:354-363`).
- Nothing else in Step 6b is in question: the copy strings (`/` divider; `[/] attempt`), Q2 (cycler ships), Q3 (defer `:869` to FLLWUP-4), and the (b)/(e) defaults are settled and binding.
- Process: `product-owner` confirms the single-writer discipline — the runner, not the ruling seat, appends to the card.

### Step 7 — spec written; handed to one owner (facilitator)

Step 6d closed the last open judgment; the run resumed at step 7. The
settled design was written up (not derived):
`docs/superpowers/specs/2026-09-17-FLLWUP-45-design.md`, committed on `main`
as `f485dff`. Self-review before commit checked the four required
properties: no placeholder/TODO text; internal consistency (nothing
contradicts steps 2–6d); scope bounded to the card `goal` (FLLWUP-39, the
`:869` modal fix, and the R4-evolution candidate are named as out of
scope); and single-design unambiguity (exact strings, gates, cursor
semantics, no-op conditions all pinned).

The design is handed to the single `owner` seat (`owner` works in an
isolated worktree, never on `main`). Card set `In Progress` on frontmatter
and on `council/board.md`; `python3 council/validate.py` reports clean
before the step-8 dispatch. Step-1 seat-resolution record stands: all six
seats named this run resolve from the packaged set; this checkout has no
`.pi/agents/` override.

### Step 8 — owner implemented; PR open (facilitator)

The single `owner` seat was handed the committed spec. First dispatch
(`job-16.1`) died on a provider error (`Upstream idle timeout exceeded`)
after worktree setup only, leaving a clean worktree and no deliverable; per
the one-re-dispatch rule it was re-dispatched with the same input
(`job-16.2`, 34.2m, 63 turns, `stopReason=stop`) and produced the change.

Observed artifacts (facilitator-read first-hand, not taken from the seat's
report): branch `feat/fllwup-45-navigator-attempt-awareness` pushed to
`origin` at `e799ca1edc26d78857f0e59d54da8310845ce43f` (5 commits on
`821d717`), worktree `.worktrees/fllwup-45` clean; PR #63 `OPEN`,
base `main`, `mergeable: MERGEABLE`, same head SHA. Card set `In Review` on
frontmatter and on `council/board.md` on that observable fact alone — the
sole condition step 8 states. The owner's own gate report is recorded but is
not what the transition rests on.

Owner's local gate results on the pushed head (re-verified by the step-9
Skeptic, not trusted here): `bunx tsc --noEmit` exit 0; `bun test` 882 pass /
2 skip / 0 fail (5603 expects, 77 files, 95.4 s; baseline 867/2/0);
`python3 council/validate.py` clean. `COUNCIL_INTEGRATION=1` not run (gated).
Plan at `docs/superpowers/plans/2026-09-17-FLLWUP-45-plan.md`. New tests in
`test/fllwup45-attempt-awareness.test.ts`; the mechanical
`selectedSessionId` → `selectedRowKey` rename spans the two source files and
`test/ev8-focus-navigation.test.ts` / `test/ev9-progress.test.ts`. Branch
state of the main checkout was not mutated (still `main` at `821d717`,
clean).

### Step 9 — verify by acting: Skeptic blocks (attempt 1 of ≤3)

`job-16.3` (skeptic, 5.8m, 24 turns, `stopReason=stop`) verified the PR head
`e799ca1` in worktree `.worktrees/fllwup-45`. All gates re-run first-hand
(`tsc` exit 0; `bun test` **882 pass / 2 skip / 0 fail**, 5603 expects, 77
files, 94.60 s; `validate.py` clean); targeted 7-file run 112 pass / 0 fail;
gate-integrity failure-injection performed in a `/tmp` copy; branch worktree
left byte-identical.

The Skeptic returned **`blocks`** on exactly one item, O2b, a test-integrity
defect (not a behavior defect): the shipped tail-cache guard in
`test/fllwup45-attempt-awareness.test.ts` does not satisfy the spec §8.5
pinned property — it stays green (15/15) under a `keyFor → manifest.id`
regression because it is single-render (the attempt-2 manifest is already in
place when it renders). The branch *behavior* is correct — the Skeptic's own
two-phase probe reproduced the O4 freeze under the regression and the correct
read on the head — so the fix is test-only: extend the shipped guard to the
two-phase form. Every other objection closed `closed-green` (selection
survives respawn; tail keyed on `sessionId`; title ordinal gate; header ad
gate incl. caps 7–11 header suppression; cycler re-target + row-key stability;
cycler no-ops; classifier additive + kitty CSI-u; `browsableAttempts` shapes;
copy byte-exact; §7 boundaries; the `ensureView` undisposed-view defect is
pre-existing and merely more reachable, correctly left to FLLWUP-39; rename
left no stale references).

Per step 9 the card is returned to `In Progress` and the specific red item is
handed to the owner. This is verify→fix cycle **1 of the ≤3**. The Skeptic's
report is appended verbatim below.

#### Skeptic report (`job-16.3`) — verbatim

## Skeptic report — FLLWUP-45 step 9 (`e799ca1`, worktree `.worktrees/fllwup-45`)

All probes ran against the branch head. Main checkout untouched (`git status` clean throughout); the branch worktree was never mutated (verified clean at the end); failure-injection ran in a `/tmp` copy (since removed).

### Objections

| # | Claim → settling test | Status |
|---|---|---|
| 1 | Selection survives respawn (row keyed on job id, `▌` preserved, `selectedIndex()>=0`). Independent two-job probe (my own fixture, not the owner's test): `setRows ["job-1","job-2"]`, enter, rewrite to `running/attempt2/sessionId job-1-attempt2`, re-render. | **closed-green** — `selectedIndex()` 0→0, exactly 1 `▌` marker on the owner row. (My first probe failed on the marker only because I used `pid:1` → orphaned row; corrected with `process.pid`, it passes. Conceded as probe artifact.) |
| 2a | Tail cache keyed on `manifest.sessionId`: post-respawn row reads attempt 2's file. Two-phase probe: render attempt 1 → respawn to attempt 2 with later `at` → re-render. | **closed-green** — head shows `attempt-two-arg`, not `attempt-one-arg`; `/tmp` copy with `keyFor→manifest.id` freezes on `attempt-one-arg` (exact O4 mechanism reproduced). |
| 2b | Spec §8.5's pinned property: "*a `keyFor → manifest.id` fix goes red here*" — applied that exact mutation in the `/tmp` copy and ran the shipped test file. | **closed-red** — `bun test test/fllwup45-attempt-awareness.test.ts` → **15 pass, 0 fail** under the regression. The shipped guard is single-render (attempt-2 manifest already in place), which passes under both keys. Only the two-phase form (my probe) distinguishes them. The behavior is correct; the guard-rail test does not guard what its comment claims. |
| 3 | Title shows the **shown** attempt's ordinal in first-retry backoff; gate `m.attempt>1`; byte-identical title when `attempt<=1`. Fixture `{retrying, attempt:2, sessionId job-1, attempts:[{1,job-1}]}` + `job-1.jsonl`. | **closed-green** — row contains `attempt 2/3`, progress title contains `job-1 owner · attempt 1/3`; single-attempt job title has no `· attempt` fragment. |
| 4 | Header ad `[/] attempt` iff `browsableAttempts(m).length>1` **and** header rendered (`progressLines>1`). | **closed-green** — present at cap 24 multi-attempt; absent for single-attempt at 24; absent at caps 7 and 8 despite `browsable==2` (measured `progressLines`: 7→1, 8→1, 9→2, 10→3, 11→4). |
| 5 | Cycler re-targets content/title while `setRows` stays job ids and `selectedIndex()!==-1`. Drove `attemptHost(-1)` directly. | **closed-green** — title `attempt 2/3`→`attempt 1/3`, `_rows` contains no attempt-suffixed ids, `selectedIndex()!==-1`, pre-press view showed latest. |
| 6 | Cycler no-ops: single-attempt, legacy, one-row grant; no draft mutation. | **closed-green** — cursor unchanged in all three; owner's one-row test (asserting draft untouched) passes in-suite. |
| 7 | `classifyProgressKey("[")/" ]"` additive; kitty CSI-u honored; no collision with `e/t/f/g/G`. | **closed-green** — `[`→`prevAttempt`, `]`→`nextAttempt`, `e/t/f/g/G/x` unchanged, `\x1b[91;1u`→prev, `\x1b[93;1u`→next, `matchesKey("[","G")===false`. |
| 8 | `browsableAttempts` four shapes + `resolveAttempt` (present/absent/null/empty). | **closed-green** — retrying→`[{1,job-1}]` len 1; running-2→len 2; done-3→len 3; legacy `{attempt:2}`→`[{2,job-1}]`; resolve present→entry+index, absent/null→last, empty→`{1,"",0}`. |
| 9 | Copy byte-exact (§6); row label / `retrying in Ns` / R5 strings untouched. | **closed-green** — `· attempt ${shown.attempt}/${this.maxAttempts}`, `" · [/] attempt"` after `↑↓ move`, `` ` attempt ${m.attempt}/${this.maxAttempts}` ``, `` `retrying in ${secs}s` ``, R5 countdown/exhaustion and `The provider returned an error.` all present verbatim. |
| 10 | §7 boundaries: `:869` untouched, no second view slot, `keyFor` untouched, no new tree rows. | **closed-green** — `git diff … -- navigator.ts | grep -c openTranscript` → 0 (still `findSessionFile(repoRoot, runId, node.manifest.id)` at :952, deferred per Q3); single `viewFor` slot; `keyFor` returns `` `${node.manifest.sessionId}` ``; `setRows` maps one job id per manifest. |
| 11 | Leak question: does the cycler introduce the FLLWUP-39 undisposed-view defect, or expose a pre-existing one? | **closed-green (pre-existing, merely more reachable)** — base `821d717` `ensureView` (:462–477) already overwrote `viewFor` without disposing; head does identically (:522). Introduces nothing; out of scope by ruling, correctly left for FLLWUP-39. |
| 12 | Rename `selectedSessionId→selectedRowKey` left no stale refs; named suites green. | **closed-green** — `grep -rn selectedSessionId extensions/ test/` → none; `ev8+ev9` 32 pass/0 fail; 7-file targeted run 112 pass/0 fail (incl. R4 `attempt 2/3`, R5, onActivate-not-Enter). |

### What I ran (actual output)

- `bunx tsc --noEmit` → exit 0, no output. `python3 council/validate.py` → `All council artifacts valid`, exit 0.
- `bun test` → `882 pass, 2 skip, 0 fail, 5603 expects, 77 files, 94.60s` (matches the expected ~882/2/0).
- Targeted: `bun test test/fllwup45-attempt-awareness.test.ts test/ev7-council-tree-widget.test.ts test/tree.test.ts test/ev40-parent-retry.test.ts test/ev8-focus-navigation.test.ts test/ev9-progress.test.ts test/navigator.test.ts` → `112 pass, 0 fail`.
- Gate integrity (`/tmp` copy): appended `export const __gatecheck_defect: number = "not-a-number"` → `tsc` red `error TS2322 … runs.ts(246,14)`, exit 2; `git checkout` restore → exit 0. Behavioral gate: `keyFor→manifest.id` → two-phase probe red (`phase2 shows two: false`), single-render shipped test green (the O2b finding).
- Worktree `git status --short` → empty (byte-identical); `git rev-parse HEAD` → `e799ca1edc26d78857f0e59d54da8310845ce43f`.

### Verdict

**`blocks`** — one item: **O2b, the tail-cache guard test does not satisfy its spec-pinned property.** Spec §8.5 requires the test to go red under a `keyFor → manifest.id` regression; as shipped it stays green (15/15) under exactly that mutation. The branch *behavior* is correct (my two-phase probe proves it), so the fix is test-only: extend the shipped guard to the two-phase form — render with attempt 1 live, rewrite the manifest to attempt 2 with a later-`at` JSONL, `refresh()`, assert the row shows attempt-2 content — which I demonstrated goes red under the regression and green on the head. Everything else: no open objections.
