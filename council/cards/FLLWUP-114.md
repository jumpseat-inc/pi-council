---
id: FLLWUP-114
title: Live-smoke verification of the pre-injected runner transcript surface
state: In Review
owner: null
epic: EPIC-24
goal: A live-smoke phase for the /features-deliver epic asserts, from a real runner session transcript, that a fresh council-runner's startup toolCalls contain no Read against council/procedures/council.md or council/procedures/features-deliver.md, that the first visible toolCall is not under council/procedures/, and that retried attempts carry byte-equal first user-message blocks — the transcript-level predictions EV-90's step-9 record classified as live-smoke-only verification material.
---

## Intent

EV-90 moved the runner's procedure bodies from disk reads into the dispatch
input (`composeRunnerInput`, merged `14f244f`), and its step-9 skeptic record
(job-11.2) closed the mechanism as unit-proven via the spec's §6.6–§6.8
falsifiers — but classified the transcript-level predictions as
live-smoke-only: designer prediction 1 (no procedure-file `Read` toolCall in a
runner's startup transcript), designer prediction 2 (first visible toolCall
not under `council/procedures/`), and the byte-equal-retry prediction 5
(retried attempts see byte-equal first user-message blocks). None of these is
currently exercised against a real session; the unit tests prove the composer,
not the operator-observable transcript surface. A live falsifier owed to a
shipped mechanism is board work, not a wiki note and not a drop.

Filed from EV-90's step-13 candidate (draft title "Live-smoke verification of
the pre-injected runner transcript surface"), product-owner-ratified `File`
2026-09-24 (confirmation-authority; recorded gate basis: actionable, confidence
0.50 < choice floor 0.60).

## Acceptance

1. A smoke-phase falsifier ([[smoke-test]] phases) runs a real
   `council-runner` dispatch through an epic flow and parses the runner's
   session JSONL with `parseTranscript` (`extensions/transcript.ts`).
2. Before the runner's first deliberation `council_dispatch` block, no
   `kind: "toolCall"` block labeled `Read` has a first argument ending in
   `council/procedures/council.md` or `council/procedures/features-deliver.md`
   (designer prediction 1, EV-90 round 2).
3. The runner's first `toolCall` block's first argument is not under
   `council/procedures/` (designer prediction 2 — the first visible action is
   seat-resolution, `validate.py`, or the first dispatch).
4. When the hub retries a runner dispatch, both attempts' parsed first
   user-message blocks are byte-equal (prediction 5 — the composed string is
   computed once and reused by the retry supervisor's `attemptSpec`).
5. The falsifier is opt-in under the existing smoke-phase selector and stays
   outside the default `bun test` budget ([[test-suite-budget]]).

## Deliberation

### Round 1 — owner (job-7.1, verbatim)

Grounding is complete — I've read the wiki ([[smoke-test]], [[procedure-context-injection]], [[run-transcripts]], [[retry-policy]], [[per-attempt-provenance]], [[test-suite-budget]] index entries), `composeRunnerInput` and `readProcedureBody` (seats.ts:587–657), the computed-once `dispatchInput` and both `buildChildArgv` call sites (hub-tools.ts:182–197, 285, 307–317), `buildChildArgv` (seats.ts:703–727), `parseTranscript`/`firstArgOf` (transcript.ts), the runs substrate (`findSessionFile`, runs.ts:183–203), the smoke harness (`driver.sh`, `run.sh`, phase-2 runner-evidence probe at driver.sh:258–265, `reeval.ts`/`leaderview.ts` precedent), the faux-provider harness (`harness.ts`, `extension.ts` knobs), and the existing EV-90 (§6.1–§6.8) and EV-41 ((b) seat-path retry) falsifiers. Position follows.

---

## Approach

The card splits cleanly into two observables with two different honesty requirements, and I'd build it as one opt-in smoke phase (`SMOKE_PHASE=7`, third supported isolated phase in `smoke/driver.sh`, which currently hard-fails anything but 5 and 6 at driver.sh:132–134) with a bun helper following the `smoke/reeval.ts`/`smoke/leaderview.ts` precedent:

**Part A — predictions 1+2 (startup surface), live transcripts.** Dispatch a real `council-runner` for an EPIC-1 fixture card from a real parent `pi -p` turn inside the container (same shape as phase 2, but scoped: we only need the runner's *startup* transcript, so the phase waits for the runner's first `council_dispatch` block or settle/ceiling — not full card delivery), then locate the runner session via `findSessionFile` (runs.ts:183) and parse it with `parseTranscript`. Assertions: (AC2) before the first `toolCall` labeled `council_dispatch`, no `Read`-labeled toolCall's `firstArgOf` ends in `council/procedures/council.md` or `features-deliver.md`; (AC3) the transcript's first `toolCall` block's `firstArgOf` is not under `council/procedures/`.

**Part B — prediction 5 (retry), deterministic forced retry, not a natural one.** A natural retry in a healthy flash-model run may never occur; a falsifier that's red-only-when-lucky is a defect. The deterministic construction already has all its parts in-repo: real council extension (`councilExtension: true`), faux-provider harness with `EV40_TOOLCALL_DISPATCH`+`EV40_TOOLCALL_WAIT` (extension.ts:130–160), engine `.council.json` retry policy (`EngineRepoOptions.retryPolicy`), and a **project-local extension shim** in the scratch repo (the FLLWUP-56 `extraRepoFiles` precedent) that registers a provider failing its first call with the with-colon literal keyed on `COUNCIL_JOB_ID` presence — so the hub-spawned child pi fails retryably, `classifyRetry` → `"retry"`, the supervisor respawns via the shared `dispatchInput` (hub-tools.ts:307), and two real child session JSONLs exist. The helper parses both and asserts the first user-message blocks are byte-equal — which is exactly the transcript-level corollary of the argv-level identity EV-90 §6.8 already proves (the same composed string reaches both attempts' argv; the child records it verbatim as its first user message).

**Three spec-vs-reality mismatches to pin before implementation:**

1. **`Read` vs `read`.** `BUILTIN_MAP` maps the omp grant `Read` → pi built-in `read` (seats.ts:660–667); a real pi transcript will label the block `read` (or pi's own casing), not `Read`. The falsifier must match the label case-insensitively (or against pi's actual name) — matching the literal `Read` would pass vacuously forever.
2. **"Byte-equal blocks" cannot include the whole block.** `TranscriptBlock` carries `at` (entry timestamp), which differs by construction across attempts. Byte-equality must be scoped to the stable payload (`text` + `kind`, excluding `at`/`toolCallId`) — otherwise the assertion is unfalsifiable-by-design. This needs a ruling, not an implementation choice.
3. **"First deliberation `council_dispatch`"** should be defined as the first `toolCall` block labeled `council_dispatch` in parse order — the runner's own first child dispatch — with startup Reads asserted only before it.

## Tradeoffs accepted

- **Part A doesn't run the full epic to Done.** A full phase-2 delivery costs the 90-min real-model ceiling to observe a startup surface. I accept "runner dispatched against an epic card, startup observed, bounded teardown" as satisfying "through an epic flow" — the features-deliver overlay is really bound (that's what `composeRunnerInput` guarantees), and full delivery correctness is phase 2's existing job. If other seats read AC1 as requiring full delivery, that's the one place I'd expect pushback.
- **Part B is offline-at-the-provider, live-at-the-engine.** Real pi CLI, real extension, real Hub, real supervisor, real child sessions with real session JSONLs — but the provider is scripted. I accept this because what prediction 5 claims is about *the composed input reaching both attempts identically*, which the faux provider perturbs not at all; and EV-41's precedent already established the real-Hub + forced-failure shape as legitimate falsifier material.
- **A smoke→test import direction.** The helper imports `parseTranscript` from `extensions/` (same direction as phase-3's reeval importing engine code — fine) but the retry arm's harness imports live under `test/faux-provider/`, a layering inversion the wiki already holds open by guard for `pty_kit`. I accept reusing it rather than duplicating a third harness copy — the FLLWUP-55 lesson.

## Testable claims

1. **Retry byte-identity survives the transcript boundary** (the card's core novelty): given the forced-retry arm, `parseTranscript` of attempt-1 and attempt-2 session JSONLs yields first user blocks whose stable payload (text+kind, `at` excluded) are byte-equal. Red today in the meaningful sense: no such transcript pair has ever been observed; EV-90 §6.8 proves argv identity only (`spawns[0].args` vs `respawns[0].args`), never a parsed session surface.
2. **Prediction 1 is currently true only by behavioral accident**: `composeRunnerInput` embeds the bodies (seats.ts:652–656) and no runner startup code reads the procedure files — but the live assertion would go red the moment a runner seat body or procedure text regresses to a disk read. That's the regression protection the card buys; it cannot be proven from `test/ev90-runner-input.test.ts`, which composes strings, not sessions.
3. **The harness gap is concrete and small**: `dispatchStep` (test/faux-provider/extension.ts:135–147) passes no `card_id`, so a runner-dispatch arm is impossible today — the arm needs a knob-gated `card_id` plus a scratch card face with a well-formed frontmatter block (FLLWUP-115's byte-0/trailing-newline caveat, seats.ts:592–598). A test asserting the refusal fires without it already exists (§6.7) — the shim completes the positive path.
4. **Budget neutrality is verifiable**: no new file under `test/` matching the default `bun test` discovery; the phase only runs under `SMOKE_PHASE=7`; `smoke/.artifacts/` is dot-dir-hidden. Claim: `bun test` wall-clock unchanged (the [[test-suite-budget]] 180s drift threshold stays silent).

Ambiguity I'm explicitly flagging for the round: whether AC1's "through an epic flow" requires full card delivery (my reading: no) — that's the difference between a ~90-minute phase and a ~5-minute one, and it should be settled before implementation, not discovered in the driver.

### Round 1 — principal (job-7.2, verbatim)

## Cross-seam reading

The contract the card wants to assert, read from both sides:

**Producer.** `composeRunnerInput` (`extensions/seats.ts:644`) builds one string; `council_dispatch` computes it **once** into `dispatchInput` and closes over it for both the initial `buildChildArgv` call and the retry supervisor's `attemptSpec` (`extensions/hub-tools.ts`, the `attemptSpec` at ~line 305 reads `dispatchInput`, never re-composes). `buildChildArgv` (`extensions/seats.ts:703`) appends that string as the final `-p` argv element. `job-retry.ts`'s `attemptSpec` only varies `sessionId` (`${jobId}-attempt${n}`).

**Consumer.** Pi records the `-p` argument as the session's first user message; `parseTranscript` (`extensions/transcript.ts`) emits a `user` block whose `text` is `textOf(content)` (join of text parts), and toolCall blocks whose `label` is `String(part.name)` — **pi's tool name, lowercase**. `test/transcript.test.ts:18` pins `blocks[2].label === "bash"`. The runner's manifest carries `sessionId` (attempt N per `attempts[]`, `extensions/runs.ts:70`), resolvable to the JSONL by header `id` via `findSessionFile` (`extensions/runs.ts:191`). `attemptEntries` (`runs.ts:129`) is the per-attempt accessor.

So the seam is: composed string → argv → pi-recorded first user block; and manifest.sessionId → JSONL file. Both halves exist and are pure-readable.

## Blind spots

- **Owner/pipeline vantage** proves `composeRunnerInput` bytes and argv byte-identity (§6.8, `test/ev90-runner-input.test.ts`). It cannot see that the *transcript* records `read`, not `Read`, or how pi transforms the `-p` payload into a user block — because that vantage never crosses into `transcript.ts`.
- **Render/transcript vantage** knows labels are lowercase but is not party to the card's acceptance vocabulary, which is written in seat-frontmatter omp names (`council-runner.md` `tools: Read, …`).
- **Neither vantage** sees the retry's *trigger condition*: `classifyRetry` (`extensions/retry.ts`) only returns `"retry"` when `stopReason === "error"` and the message matches the provider-error set. A green run against a healthy provider fabricates no such settle, so "the hub retries a runner dispatch" is an event a green smoke run will not produce.

## Reframe

The framing "live-smoke verification of the pre-injected runner transcript surface" bundles three predictions that do not share a verification mode, and two of the five acceptances are vacuous as written. Reframe:

1. **Predictions 1–2 are genuinely live-model-observable** (does the runner still try to `read` the procedure files?). These belong in the live smoke, and the strongest object is the **existing Phase 2 runner** (`smoke/driver.sh` already runs `/features-deliver EPIC-1` and dispatches a real `council-runner`), extended with a post-run `smoke/*.ts` reader, or a new `SMOKE_PHASE=7` isolation that reuses the fixture's standing rulings. Assertions are pure reads of the extracted run dir; zero added model time.
2. **Prediction 5 is a control-flow invariant, not a live surface.** A real provider will not retry in a green run. Acceptance 4 must be a **controlled two-attempt replay through the real Hub retry supervisor with deterministic fault injection** (the `test/faux-provider` `EV40_FAILS=1` mechanism already produces a retryable `Provider finish_reason: error` then success, offline, with real pi session JSONL — subject to the catalogue-check caveat below). A "live retry" assertion is a defect: it passes vacuously.
3. **State the assertions in pi's vocabulary, not omp's.** Acceptance 2/3 say "block labeled `Read`"; `parseTranscript` yields `read`. A literal `"Read"` match makes acceptance 2 **trivially true** — the exact vacuous-falsifier failure the board exists to prevent.

Additional vacuity guards: acceptance 3 passes if there are **no** toolCalls; acceptance 2's window is unbounded if there is no `council_dispatch`. The reader must assert the transcript contains the `<council-procedure>` marker (proving it is the composed input, not a synthetic first user block), ≥1 toolCall, and ≥1 `council_dispatch` before the read/no-read check is meaningful.

The retry replay has one real blocker to name: `council_dispatch` validates the seat model against the parent `ctx.modelRegistry` catalogue before spawn, so a faux model registered only child-side would be refused. Either the fault provider must be registered parent-side (a new smoke surface) or the replay runs below the tool seam against the real `Hub` + `createRetrySupervisor` with a real pi+faux child. That choice must be explicit in the plan — not "hope Phase 2 retries."

## Testable claims

- **Tool vocabulary (reds the literal-`Read` reading):** `parseTranscript` of a session containing `{"type":"toolCall","name":"read",...}` yields a block with `label === "read"`, never `"Read"`. Extend `test/transcript.test.ts` (it currently pins `bash`).
- **Green smoke does not retry:** the fixture `.council.json` sets no `retry` override, so `DEFAULT_RETRY_POLICY` (`seats.ts:229`, `enabled: true, maxAttempts: 3`) arms the supervisor; assert Phase 2's runner manifest has `attempt === undefined` (no `attempts[]`), i.e. no retry occurred — proving a "live retry" assertion would be vacuous.
- **Existing runner evidence is manifest-level, not transcript-level:** grep the Phase-2 run dir for `"seat": "council-runner"` and show the hits are `.json` manifests, with the actual transcript located only via `readManifests` → `findSessionFile`. This reds any planner who intends to reuse the `RUNNER_SESSIONS` grep (`smoke/driver.sh` phase 2) as the transcript locator.
- **Red-base for acceptance 2:** reintroduce a `read` of `council/procedures/council.md` into the runner's first turn (or mutate `council-runner.md`'s `<procedure>` prose back to a read instruction) and show the assertion reds; a falsifier that cannot be made red is not evidence.

**Where I disagree with the card as written:** acceptance 4's "when the hub retries" is not satisfiable by a live smoke and must become a named deterministic injection; acceptance 2/3's `Read` label must be normalized through `BUILTIN_MAP` (`seats.ts`) or lowercased; and acceptances 2–4 each need a positive liveness anchor so the mechanism-absent case reds rather than passes.

### Round 2 — owner (job-7.3, verbatim)

## Round 2 — owner

**Approach.** I checked all three disputes against the code. I concede Point 1 (Phase-2 reuse is strictly cheaper and already exercises the epic flow), I concede the catalogue blocker is real but resolve it differently than the principal's "below the tool seam" fallback: parent-side registration is already proven in-tree, so the AC4 replay rides the existing EV56 harness arm. On Point 3 I split the difference: the principal is right that raw-JSONL byte-equality is not the honest level; I hold parse-level deep-equality-except-`at` is stronger than text-equality and equally honest.

**1. Part A — adopt the principal's Phase-2-reuse architecture.** `smoke/driver.sh:232` already runs `/features-deliver EPIC-1` against the fixture, and lines 258–263 already extract the run dir and grep for `"seat":"council-runner"` — the runner dispatch inside a real epic flow exists today. My scoped-startup phase buys nothing Phase 2 doesn't already produce and costs one extra live dispatch plus new plumbing. Conceded, with one addition the principal implied but didn't state: the reader must select the **root** runner session (manifest `seat: council-runner` whose resolved JSONL's first user block carries both the `<council-procedure>` and `<features-deliver-overlay>` markers), not a runner-spawned descendant — and it must locate the JSONL via `readManifests` → `findSessionFile` (`runs.ts:191`), never the `RUNNER_SESSIONS` grep, which hits `.json` manifests only. I verified the grep at `driver.sh:261` matches manifests, not sessions.

**2. Part B — the catalogue blocker is real; the shim as I wrote it is dead; but "below the tool seam" is also unnecessary.** The blocker is confirmed: `hub-tools.ts:220–231` validates the *effective* model against parent `ctx.modelRegistry` and refuses otherwise. A project-local extension shim registers **child-side** only — `test/ev41-seat-child-live.test.ts:110` documents that project-local discovery auto-loads in *both* processes and the child is discriminated by `--session-id`, so a shim-only provider is invisible to the parent's catalogue check. **But parent-side registration is already a proven in-tree mechanism**: `harness.ts` `prepareHarnessArm` launches the parent with `-e HARNESS_EXTENSION -e COUNCIL_EXTENSION --provider ev40 --model ev40/ev40-model`, `extension.ts:208` calls `pi.registerProvider(faux.provider)` at load in the parent, and the scripted `council_dispatch` passes `model: "ev40/ev40-model"` through the loud check — `ev41-seat-child-live.test.ts` is the existence proof (treatment arm's `council_wait` returns the attempt-2 marker, which is only reachable if dispatch → real Hub → real `createRetrySupervisor` → respawn all cleared the catalogue). So: **the replay runs through the real tool seam** (council_dispatch → Hub → retry supervisor → real pi children with real session JSONL), offline, by registering the faux provider parent-side via `-e` — exactly the EV56 shape, with `.council.json` `retry: {enabled: true, maxAttempts: 2}` and the child-side shim re-keying `EV40_FAILS` off `--session-id` (the shim's existing role). No new smoke surface, no sub-tool-seam simulation: the work is extending the EV56 treatment arm to assert first-user-block equality across `job-1` and `job-1-attempt2` (both resolvable via `findSessionFile`), and the card should say so explicitly. Conceded that AC4 is a deterministic-injection assertion in the offline harness, **not** a live-smoke phase.

**3. Byte-equality — the honest level is parsed blocks, and the supervisor varies only `sessionId`.** Verified: `attemptSpec` (`hub-tools.ts:307–318`) closes over the single `dispatchInput` and varies only `sessionId = ${jobId}-attempt${n}`; `buildChildArgv` (`seats.ts:731`) appends `input` unchanged as the final argv element. Raw-JSONL byte-equality is **not** honest — per-entry envelope fields (timestamp, likely message ids) differ per session and would false-red, and I have not enumerated pi's raw first-user-entry shape, so I won't assert at that level. The honest assertion lives at `parseTranscript`: **first user blocks from both attempt sessions deep-equal after omitting `at`** (`transcript.ts:3–16` — `TranscriptBlock` fields are all derived; on a user block only `text` and `at` are ever populated). That is strictly stronger than text-equality (it would catch a future parser field on user blocks drifting per-attempt) and immune to envelope variance — it is "full-block equality except `at`" in the only vocabulary the transcript surface has. Plus the principal's liveness anchor: the block's text must contain `<council-procedure>` (composed-input proof). I accept their vocabulary correction outright — assertions match lowercase labels per `transcript.test.ts:18` (`bash`, never `Read`), and acceptances 2–4 get positive liveness anchors (≥1 toolCall, ≥1 `council_dispatch`, `<council-procedure>` marker, `attempts[]` present in the replay arm) so the mechanism-absent case reds.

**Tradeoffs accepted.** AC4 moves out of the smoke phase into the offline harness arm — we lose "retry under a real provider" (unobtainable; a green run never retries, per `classifyRetry` needing `stopReason === "error"`) and gain a deterministic, already-half-built falsifier. The smoke reader stays a pure post-run read, so a Phase-2 transcript regression reds after the fact rather than before — acceptable, since the same is true of every existing Phase-2 assertion.

**Testable claims.**
- *Parent-side registration clears the catalogue:* `ev41-seat-child-live.test.ts` treatment arm — `council_dispatch` with `model: "ev40/ev40-model"` succeeds (its `council_wait` toolResult carries the marker); if parent-side registration did not satisfy `hub-tools.ts:220`, that arm would already red. It is green today; the AC4 extension reuses this arm unchanged except for the new equality assertion.
- *Byte-equality at the honest level:* run the EV56 treatment arm, parse both attempt sessions with `parseTranscript`, deep-equal first user blocks with `at` omitted → green on current code; mutate `composeRunnerInput` to append `attempt` → red. `at`-omission is load-bearing: assert the raw `at` values *differ* between attempts, else the exclusion is vacuous.
- *Vacuity guard reds:* a Phase-2 run dir with zero `council_dispatch` toolCalls in the root runner session must fail the reader, not pass vacuously — testable by feeding the reader a manifest whose JSONL lacks dispatch (the EV56 control arm's single-attempt session is a ready-made negative fixture).

### Round 2 — principal (job-7.4, verbatim)

## Cross-seam reading

Producer side is confirmed unchanged from my round‑1 reading: `dispatchInput` is composed once in `council_dispatch` (`extensions/hub-tools.ts:182–197`) and `attemptSpec` reads only that closure, varying `sessionId = ${jobId}-attempt${n}` (`hub-tools.ts:305–317`). Consumer side: a user `TranscriptBlock` has exactly `{kind, text, at}` (`extensions/transcript.ts:4–14`), `text = textOf(m.content)` joining text parts (`transcript.ts:44–51`), and `label = String(part.name)` — pi's lowercase name.

## 1. AC1 — the owner's `SMOKE_PHASE=7` is the honest one; I concede the "extend phase 2" framing

My round‑1 "attach a post‑run reader to Phase 2" fails AC5, not AC1. The Phase‑2 runner evidence lives *inside* `phase 2` (`smoke/driver.sh:257–265`), which is only reachable by paying the 90‑minute epic. A reader bolted there is not independently selectable, so it does not satisfy "opt‑in under the existing smoke‑phase selector" (`driver.sh:131–145` already hard‑fails anything but 5/6). The owner's `SMOKE_PHASE=7` is the only shape that is selectable and fast.

"Through an epic flow" is satisfied by the **overlay binding**, not delivery completeness: `composeRunnerInput` unconditionally wraps the rendered `council.md` body in `<council-procedure>` and the epic‑derived `features-deliver.md` body in `<features-deliver-overlay>` (`extensions/seats.ts:644–657`). Once a real `council-runner` is dispatched against a real epic card, that binding is present in the child's first user message by construction. Full card delivery adds nothing to predictions 1/2 and is Phase 2's job. The owner's reading is correct.

One correction that is not cosmetic: the phase must assert the *located* transcript contains the literal `<council-procedure>` and `<features-deliver-overlay>` markers before running AC2/AC3 — otherwise "through an epic flow" is assumed, not observed, and a transcript located by the wrong seam passes. And I'd still recover my zero‑cost point: make the reader a pure function `readRunnerStartup(runDir, cardId)`, call it from `SMOKE_PHASE=7` **and** from full‑path Phase 2 (which already has a runner transcript) — Phase 2 then gets the assertion for free at zero added model time without the falsifier being coupled to it.

## 2. Retry — the catalogue blocker is resolved by the shim's own parent-loading; the model call is the only recognized seam

The blocker I named in round 1 is already answered by the repo's own documented finding. `vault/wiki/headless-pi.md` (EPIC‑9 / FLLWUP‑56 ruling) states verbatim: project‑extension discovery is *not* `-a`‑gated; a print‑mode parent loads its cwd's `.pi/extensions` on its own, so **a scratch‑repo shim placed there to reach a seat child is also loaded by the parent**, and such a shim must gate itself on the child discriminator (`--session-id` in `process.argv`) and be a no‑op otherwise — "the guard is load‑bearing, not cosmetic."

So: place the shim at `.pi/extensions/…`; `pi.registerProvider` runs in the parent too, so `ctx.modelRegistry.getAvailable()` (`hub-tools.ts:212–221`) resolves `ev40/ev40-model` and the catalogue check passes. The owner's `EV40_TOOLCALL_DISPATCH`/`EV40_TOOLCALL_WAIT` parent script (`test/faux-provider/extension.ts:133–160`) then dispatches deterministically and keeps the parent alive across the backoff. The failure gate belongs on the child discriminator; `COUNCIL_JOB_ID` presence works as an alternative (`extensions/runs.ts:235–236` sets it, and a root parent has none), but `--session-id` is the documented precedent.

The failing call must be the model call. `classifyRetry` returns `"retry"` only when `report.stopReason === "error"` **and** the message is the with‑colon literal or matches pi's retryable set (`extensions/retry.ts:97–104`); `job.stopReason`/`errorMessage` are lifted from the child's result message (`extensions/hub.ts:312–313`). `timeout`/`stalled`/`cancelled` are settled but classified terminal (`retry.ts:105–107`), and a non‑zero exit is `failed` → terminal. No other classifyRetry‑recognized seam exists that yields a retry. So the honest construction is exactly the owner's, with two pins: (a) the shim registers the provider unconditionally and fails only under the child discriminator; (b) the shim's dispatch step must carry `card_id` (`extension.ts:135–147` omits it today — the owner already flagged this). The fixture `.council.json` sets no `retry`, so `DEFAULT_RETRY_POLICY` (`seats.ts:229–231`, `enabled`/`maxAttempts:3`) arms the supervisor without a fixture change.

## 3. Byte-equality — full stable projection `{kind, text}`, and locate the composed block, not `blocks[0]`

Between attempt 1 (`sessionId = jobId`) and attempt 2 (`jobId-attempt2`) the JSONL header `id`/timestamp and the first message entry's `id`/`parentId`/`timestamp` differ, hence `parseTranscript`'s derived `at` differs (`transcript.ts:9`, `entryAt`). The `-p` argv is identical, so `message.content` → `textOf` → block `text` is identical. A user block exposes exactly `kind`, `text`, `at`; `kind` is the literal `"user"`, `at` is the sole volatile, so the honest stable projection is `{kind, text}` — which for user blocks is `text` alone. Serializing `{kind, text}` rather than `text` is near‑cosmetic; the substantive part is the **locator**: assert byte‑equality of the first user block whose text contains `<council-procedure>`, require exactly one such block per transcript, and require both non‑empty. Blindly comparing `blocks[0]` is unfalsifiable two ways — two empty/absent blocks are byte‑equal, and if pi ever prefixes a session‑start user context, `blocks[0]` is the wrong object.

**The proposed design is sound with those corrections; no reframe needed.** My round‑1 "extend Phase 2" is withdrawn as an AC5 failure.

## Testable claims

1. **Parent-visible registration** (reds the catalogue blocker): a `pi.registerProvider` shim at `.pi/extensions/` makes the parent's `ctx.modelRegistry.getAvailable()` include `ev40/ev40-model`; a real `council_dispatch({seat:"council-runner", card_id:"EPIC-1", model:"ev40/ev40-model"})` does **not** return "not in pi's catalogue". Run as an integration probe, not `bun test`.
2. **Discriminator is load‑bearing** (reds a shim without the guard): with the shim loaded and no `--session-id` in argv, the provider call does **not** fail; with it, the first call returns `stopReason:"error", errorMessage:"Provider finish_reason: error"` and `classifyRetry` returns `"retry"`.
3. **Retry byte-identity, transcript-level** (the card's novelty): the forced-retry arm yields two JSONLs under one run dir (`readManifests` → `attemptEntries`, `runs.ts:129`), each containing exactly one user block with `<council-procedure>`; their `{kind,text}` projections are byte-equal, and a negative control that re-composes per attempt (or mutates `dispatchInput`) reds.
4. **Stable-projection excludes `at`** (reds the whole-block comparison): two `parseTranscript` entries with identical `text` and different timestamps yield equal `JSON.stringify({kind: b.kind, text: b.text})` and unequal `b.at`.

### Step 4 — skeptic attack (job-7.5, verbatim report)

All probes complete, tracked tree untouched by me (only the pre-existing board/card working changes from the facilitator remain). Final report.

## Skeptic report — FLLWUP-114 (attack on the converged Part A + Part B design)

**Grounding:** read `vault/wiki/smoke-test.md`, `run-transcripts.md`, `test-suite-budget.md`, `headless-pi.md`, `procedure-context-injection.md` (via card record), `retry-policy.md` (via `extensions/retry.ts` + card cites), and the engine seams cited: `seats.ts` (`composeRunnerInput`/`buildChildArgv`/`cardEpicKey`/`epicKeyFromFace`/`DEFAULT_RETRY_POLICY`/`loadRetryConfig`), `hub-tools.ts` (`dispatchInput` closure, `attemptSpec`, catalogue check), `runs.ts` (`findSessionFile`/`attemptEntries`), `transcript.ts` (`parseTranscript`/`firstArgOf`), `retry.ts` (`classifyRetry`), `test/faux-provider/{extension,harness}.ts`, `smoke/{driver,run}.sh`. All scratch probes live under `/tmp/fllwup114/`; nothing tracked was modified.

### Objections

**O1 — Part A's named dispatch card is refused by the current engine; the design text is false as written.** Target: "dispatching a real `council-runner` against an *EPIC-1 fixture card*". The fixture's `smoke/fixture/council/cards/EPIC-1.md` frontmatter has `epic: null`, and `epicKeyFromFace` (D1 ruling) turns that into a fail-loud refusal. Settling test (offline, real engine function, no model):

```
$ timeout 60 bun /tmp/probe-a.ts
cardEpicKey(EPIC-1) THREW: council-runner dispatch for card "EPIC-1" refused: the card face's epic: field is null or absent (EV-90 D1 ruling — ...)
cardEpicKey(EV-2) = "EPIC-1"
composeRunnerInput(EV-2) len= 40588
has <council-procedure>: true
has <features-deliver-overlay>: true
```

**Status: `closed-red`.** A `SMOKE_PHASE=7` that dispatches `card_id: "EPIC-1"` never spawns a runner — setup-time refusal, vacuity-red at setup, measures nothing. The fixture face was authored 2026-08-25 (`5ec416e`), a month before the refusal landed (`14f244f`, 2026-09-24), so no post-EV-90 real transcript proves "Phase 2 already exercises the flow" either (`smoke/.artifacts/` is empty on this checkout). Fix options: dispatch the runner against a dispatchable card (EV-2/EV-3 verified — `epic: EPIC-1`, both markers present) or amend the fixture faces. The design must name the actual card.

**O2 — Part B through the real tool seam (the load-bearing novelty).** Target: "council_dispatch with card_id present → real Hub retry supervisor → both attempts resolvable → single user block each with markers → `{kind,text}` byte-equal, `at` differing". I built the full offline EV-56-shaped arm (patched copy of `test/faux-provider/extension.ts` adding knob-gated `card_id`, scratch repo with `.council.json` override + `council/cards/EPIC-1.md` face + `council-runner` seat override + `--session-id`-keyed child shim + pi launcher shim). Result (second run, identical on both runs):

```
arm exit 0   (parent stdout ends "EV40-SECOND-RESPONSE call=3")
runId manifests: job-1 seat=council-runner session=job-1-attempt2 attempts=[{"attempt":1,"sessionId":"job-1"},{"attempt":2,"sessionId":"job-1-attempt2"}] state=done stop=stop
  session job-1:           userCount=1 markerCP=true markerOv=true len=40643
  session job-1-attempt2:  userCount=1 markerCP=true markerOv=true len=40643
userBlockCounts: 1 1
byteEqual {kind,text}: true | p1 bytes: 41801 | p2 bytes: 41801
at differs: true (1790245054453 vs 1790245056397)
mutated1 reds: true / mutated2 reds: true
```

**Status: `closed-green`** — settled in the design's favor on every seam: parent-side `registerProvider` clears the catalogue check (hub-tools.ts:220–231), `composeRunnerInput` output **is** the child's first JSONL user message and first parsed block (markers intact), retry respawned attempt 2 off the single `dispatchInput` closure, `findSessionFile` resolves both, equality is non-vacuous. Housekeeping confirmed: the `card_id` gap at `extension.ts:135–147` is real (needed my patch).

**O3 — Consumer-side AC2/AC3 vocabulary.** Target: "labels are pi's lowercase names; `firstArgOf` extracts the path". Ran a real child pi whose scripted provider issued two `read` builtin toolCalls against real repo files:

```
toolCall label="read" firstArg="council/procedures/council.md"
toolCall label="read" firstArg="council/cards/EV-1.md"
AC2: read calls with arg ending in council/procedures/council.md or features-deliver.md: 1
```

**Status: `closed-green`.** Real pi JSONL records `"name":"read"` with `"arguments":{"path":...}`; the reader's case-insensitive `read` match + `endsWith` first-arg check mechanically flags a real procedure read. Part A's assertion machinery is sound against real session shapes.

**O4 — Retry armed without fixture change.** Target: "the `.council.json` sets no `retry`, so `DEFAULT_RETRY_POLICY` arms the supervisor". Verified: `loadRetryConfig` returns `{...DEFAULT_RETRY_POLICY}` (enabled:true, maxAttempts:3) when the key is absent; my arm's retry + respawn ran with the policy from the scratch `.council.json`. **Status: `closed-green`.**

**O5 — Live AC2/AC3 against a real runner startup (vacuity behavior on real runner).** The actual green/red of predictions 1+2 against a real flash-model runner is **`open-untested` by nature**: it requires the live `SMOKE_PHASE=7` run (container + OpenRouter + flash model); no offline probe can substitute and I will not pretend one did. Supporting honesty checks from my arms: a post-failure child session plausibly carries **zero** toolCalls (`totalBlocks=1`) — the design's "≥1 toolCall / ≥1 `council_dispatch` / markers present" guards are necessary anti-vacuity scaffolding, and the smoke-phase driver's wait-for-first-dispatch/ceiling mechanics are likewise only exercisable live. Also openly unverified here: whether the *model-driven* phase-2 flow today works around the O1 epic-card refusal (unproven either way without a container run).

### What I ran
`bun /tmp/probe-a.ts` (O1, real `cardEpicKey`/`composeRunnerInput`); `bun /tmp/fllwup114/arm.ts` ×2 + `cmp.ts` + `mut.ts` (O2, full offline council-runner retry arm, byte-compare, mutation sensitivity); `bun /tmp/fllwup114/read-probe2.ts` (O3, real child pi with `read` toolCalls); `bun test test/ev41-seat-child-live.test.ts` → **2 pass, 0 fail** (5.98s — EV-56 baseline green, my harness usage mirrors it); `bun test` full suite → **1518 pass, 6 skip, 0 fail, 1524 tests, 113.22s** (inside the documented 180s drift envelope); `bun test smoke` → 4 fixture tests only — `smoke/reeval.ts`/`leaderview.ts` are not discovered, so a `smoke/read-runner-startup.ts` is discovery-neutral (AC5 structurally sound). Current HEAD: `1abf55e`; only pre-existing board/card working changes present.

### Verdict
**`blocks`, on exactly one item:** O1 — as written, Part A's "dispatch a real council-runner against an EPIC-1 fixture card" is refused at dispatch time by the shipped engine (fixture `epic: null`); `SMOKE_PHASE=7` would red at setup and measure nothing. The design must name a dispatchable card (EV-2/EV-3 — mechanically verified with both liveness markers and the EPIC-1 overlay binding) or amend the fixture face, before implementation. Everything else I attacked — Part B's full-seam retry replay, byte-equality at the `{kind,text}` level, the `at`-exclusion being load-bearing, the reader's label/`firstArgOf` vocabulary, default-armed retry, and budget-neutrality of the reader file — held under real execution; my objections 2–4 are **closed-green** (I came to doubt them; the tests settled them in the design's favor). O5 is open by the card's own construction and must be treated as unverified until the live phase actually runs.

### Step 5 — consolidator synthesis (job-7.6, verbatim)

## FLLWUP-114 — Consolidator Synthesis

### Settled

1. **AC2 label vocabulary** — assertions must use pi's lowercase tool names (`read`, not `Read`), otherwise the check passes vacuously because no toolCall is ever labeled `Read`. (Principal convergence + skeptic O3 green.)
2. **AC3 liveness guard** — transcript must contain ≥1 toolCall block and ≥1 `council_dispatch` before AC2/AC3 assertions fire; otherwise a transcript with zero toolCalls passes vacuously. (Principal convergence.)
3. **AC5 locality** — SMOKE_PHASE=7 is the only selectable-and-fast shape; Phase 2 runner evidence lives inside the 90-minute phase and is not independently selectable under the smoke-phase selector. Extension of Phase 2 fails AC5. (Principal concession round 2.)
4. **Retry mechanism** — classifyRetry returns "retry" only when `stopReason === "error"` AND the message matches the with-colon literal or pi's retryable set (retry.ts:97–104); timeout/stalled/cancelled are terminal. (Principal + owner convergence.)
5. **Catalogue blocker** — project-extension discovery is not `-a`-gated; a scratch-repo shim in `.pi/extensions` is loaded by both parent and child; the shim must gate on a child discriminator (`--session-id`) and register provider unconditionally so the parent catalogue check passes. Existing proof: `ev41-seat-child-live.test.ts` treatment arm reaches attempt-2 through real Hub retry supervisor. (Owner round 2 + skeptic O2 green on full offline EV-56-shaped arm.)
6. **Byte-equality projection** — `parseTranscript` user blocks expose `{kind, text, at}`; `at` is sole volatile field; stable projection is `{kind, text}`. Assertion: first user block whose text contains `<council-procedure>` — exactly one such block per transcript, both non-empty. Blindly comparing `blocks[0]` is unfalsifiable. (Owner round 2 + skeptic O2 green — mutated dispatchInput reds.)
7. **Marker-based locator** — `composeRunnerInput` wraps rendered `council.md` in `<council-procedure>` and epic-derived `features-deliver.md` in `<features-deliver-overlay>` (seats.ts:644–657). The reader must locate the ROOT runner session whose first user block carries both literal markers. Full delivery completeness adds nothing to predictions 1/2. (Owner convergence, principal acceptance.)
8. **Retry supervisor dynamics** — `council_dispatch` computes `dispatchInput` once, closed over by `buildChildArgv` and the retry supervisor's `attemptSpec`; the retry supervisor varies only `sessionId`. (Principal seam reading, owner acceptance.)
9. **`at` values must differ between attempts** — exclusion of `at` from byte-equality is load-bearing; same timestamps would mask regression. (Owner round 2.)
10. **Pure reader function** — `readRunnerStartup(runDir, cardId)` is a pure function callable from both SMOKE_PHASE=7 and from full-path Phase 2. (Principal recovery, owner adoption.)
11. **card_id gap** — `extension.ts:135–147` currently omits `card_id` from dispatch step; the smoke-phase shim must supply it. (Owner round 2, skeptic O2 verified the gap exists.)
12. **card_id for dispatch** — The named dispatch card must be a dispatchable card (e.g., EV-2 or EV-3); EPIC-1.md has `epic: null` and `cardEpicKey` fail-loud refuses it. (Skeptic O1 closed-red, fixing the design.)

### Open judgment — for `product-owner`, escalating to `steward`

**None.** All disputes were closed by convergence or test.

### Open objections

**O5 (open-untested)** — Predictions 1+2 and the wait-for-first-dispatch/ceiling mechanics have not been exercised against a real flash-model runner session. No offline probe substitutes; the live SMOKE_PHASE=7 run is the only settling test. Routes to implementation (build it) then back to skeptic for live verification.

### Step 6 — routing

No open judgment to route (consolidator: none). No blocking open objection without a settling test: O5's settling test is the live SMOKE_PHASE=7 run — the deliverable itself — so it routes to implementation, not Needs Human. O1 (closed-red) is closed in the design by settled item 12 (dispatch EV-2/EV-3, never EPIC-1). Card proceeds to step 7.

### Step 7 — spec

`docs/superpowers/specs/2026-09-24-FLLWUP-114-design.md` committed at `e6a901f` (main). Card set `In Progress` (board validated clean), owner dispatched at step 8.

### Step 8 — owner implementation (job-7.7)

**Branch:** `feat/fllwup-114-live-startup-reader` (worktree `.worktrees/fllwup-114`, base `e6a901f`). **PR #115** opened, head SHA `384983e448b03cc034b81699f6a9a0e93d63ede9`. Owner-reported gates on the final tree: `bunx tsc --noEmit` clean; `bun test` 1530 pass / 6 skip / 0 fail, 113.22s (180s drift envelope untouched); `bash council/preflight.sh FLLWUP-114` PASS; live deliverable `SMOKE_PHASE=7 bash smoke/run.sh` → SMOKE PASS (real model, in-container).

Built: `smoke/read-runner-startup.ts` (pure reader, grep-free selection via readManifests→findSessionFile, anchors before AC2/AC3); `SMOKE_PHASE=7` in `smoke/driver.sh` (real parent `pi -p` → real council-runner against **EV-2** per skeptic O1; startup window closed at the first `council_dispatch` block; COUNCIL_RUN_ID-keyed process sweep on every exit path); reader wired into full-path Phase 2 at zero added model time; knob-gated `card_id` (`EV40_CARD_ID`, byte-identity guarded for existing arms); EV-56 treatment arm re-targeted to a runner dispatch with cross-attempt `{kind,text}` byte-equality, `at`-differ pin, and marker/location liveness (rides the existing `test/ev41-seat-child-live.test.ts` live arm — +~1.1s, no new `test/` file).

**Live finding caught on the falsifier's first run:** the flash-model runner read `/pkg/council/procedures/features-deliver.md` at startup before any dispatch — prediction 1 false on real behavior (EV-90 pre-injects the bodies but nothing forbade the reads; artifacts preserved at `smoke/.artifacts/20260924-115236`). Fix: explicit never-read-the-procedure-files rule in `council-runner.md`'s `<procedure>` block (commit `b24ef50`). Same run surfaced the print-mode stale-ctx parent crash; the phase's scripted `council_wait` now covers the runner's lifetime. Re-run green and non-vacuous: one 40,665-char composed first user block, 34 toolCalls, first dispatch at call index 32, zero procedure-path reads in the startup window.

PR observed open by the facilitator (gh pr view 115 → OPEN, head `384983e`); card and board set `In Review`, validate clean.
