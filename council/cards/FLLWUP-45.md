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

