# FLLWUP-114 — Live-smoke verification of the pre-injected runner transcript surface

Design spec written from the FLLWUP-114 deliberation record (council/cards/FLLWUP-114.md,
rounds 1–2, skeptic attack job-7.5, consolidator synthesis job-7.6). The deliberation
reached no open judgment and one implementation-routing objection (O5); everything below
is what the Council settled, not a re-derivation.

## Goal (card, binding)

A live-smoke phase for the /features-deliver epic asserts, from a real runner session
transcript, that a fresh council-runner's startup toolCalls contain no Read against
`council/procedures/council.md` or `council/procedures/features-deliver.md`, that the
first visible toolCall is not under `council/procedures/`, and that retried attempts
carry byte-equal first user-message blocks. The falsifier is opt-in under the existing
smoke-phase selector and stays outside the default `bun test` budget
([[test-suite-budget]]).

## Architecture

Two parts with two different honesty requirements:

- **Part A (acceptances 1–3, 5) — live smoke, `SMOKE_PHASE=7`.** A new isolated phase in
  `smoke/driver.sh` (which today hard-fails anything but 5 and 6 at driver.sh:131–145):
  a real parent `pi -p` turn dispatches a real `council-runner` against a **dispatchable
  fixture card**, scoped to the runner's *startup* transcript — the phase waits for the
  runner's first `council_dispatch` toolCall block or a settle/ceiling bound, not full
  card delivery. A pure reader then asserts predictions 1 and 2 on the parsed transcript.
- **Part B (acceptance 4) — deterministic two-attempt replay, offline.** NOT a
  live-smoke assertion: a green run never retries (`classifyRetry` returns `"retry"` only
  for `stopReason === "error"` with the with-colon literal or pi's retryable set,
  extensions/retry.ts:97–104; timeout/stalled/cancelled are terminal). The replay runs
  through the **real tool seam** — `council_dispatch` → real Hub → real retry supervisor
  → real pi children with real session JSONL — under the EV-56 offline harness shape
  (`test/faux-provider/`), with the first model call failing deterministically.

## Part A — `SMOKE_PHASE=7` and the pure reader

1. **Dispatchable card (skeptic O1, closed-red).** The fixture's
   `smoke/fixture/council/cards/EPIC-1.md` has `epic: null`, and `cardEpicKey` (EV-90 D1
   ruling) fail-loud refuses it at dispatch time — a phase dispatching `card_id: "EPIC-1"`
   never spawns a runner and measures nothing. The phase dispatches the runner against a
   **dispatchable fixture card** — `EV-2` (or `EV-3`) in `smoke/fixture/council/cards/`,
   verified by the skeptic: `cardEpicKey(EV-2) = "EPIC-1"`, composed input carries both
   liveness markers. The design does not amend fixture faces it does not own; if neither
   card proves dispatchable at implementation time, the minimal fixture amendment is
   adding `epic: EPIC-1` to the face actually dispatched (never a face the phase does not
   dispatch).
2. **Pure reader.** `readRunnerStartup(runDir, cardId)` in `smoke/read-runner-startup.ts`
   (the `reeval.ts`/`leaderview.ts` precedent — bun CLI scripts under `smoke/` are not
   matched by default `bun test` discovery; skeptic verified `bun test smoke` discovers
   only fixture tests): resolve the run dir via the existing extraction path, walk
   manifests with `readManifests` → `findSessionFile` (`extensions/runs.ts:191`) — never
   the `RUNNER_SESSIONS` grep, which matches `.json` manifests, not sessions — and select
   the ROOT runner session: the manifest with `seat: "council-runner"` whose resolved
   JSONL's first user block carries both literal markers (see §Liveness anchors). Parse
   with `parseTranscript` (`extensions/transcript.ts`).
3. **Assertions (AC2/AC3), in pi's vocabulary.** Transcript toolCall labels are pi's
   lowercase built-in names (`read`, `bash` — test/transcript.test.ts:18 pins `bash`);
   the omp grant name `Read` never appears as a label. AC2: before the first toolCall
   labeled `council_dispatch` (the runner's own first child dispatch, in parse order), no
   toolCall labeled `read` (matched case-insensitively) has a first argument
   (`firstArgOf`) ending in `council/procedures/council.md` or
   `council/procedures/features-deliver.md`. AC3: the transcript's first toolCall block's
   first argument is not under `council/procedures/`.
4. **Liveness anchors (vacuity guards, all asserted before AC2/AC3).** The located
   transcript contains at least one toolCall block; at least one toolCall labeled
   `council_dispatch`; exactly one first user block whose text contains
   `<council-procedure>`, non-empty, and the text also contains
   `<features-deliver-overlay>`. A transcript missing any anchor fails the reader rather
   than passing vacuously (skeptic O5: a post-failure child session can carry zero
   toolCalls).
5. **Zero-cost reuse.** The same pure reader is also called from full-path Phase 2 (which
   already produces a runner transcript), giving that phase the assertion at no added
   model time and without coupling the falsifier to the 90-minute phase.

## Part B — deterministic retry replay through the real tool seam

1. **Arm shape (EV-56 precedent, `test/faux-provider/`).** Parent launched with
   `-e HARNESS_EXTENSION -e COUNCIL_EXTENSION --provider ev40 --model ev40/ev40-model`;
   the extension calls `pi.registerProvider(faux.provider)` at load, so the provider
   resolves in the **parent's** `ctx.modelRegistry` and the loud catalogue check
   (`hub-tools.ts:212–231`) passes. `ev41-seat-child-live.test.ts` is the existence proof
   that this shape reaches a real attempt-2 through the real retry supervisor.
2. **Child-side shim.** A scratch-repo `.pi/extensions/` shim registers the provider
   unconditionally (so the parent sees it — project-extension discovery is not
   `-a`-gated; the print-mode parent loads cwd `.pi/extensions`, per the EPIC-9/FLLWUP-56
   ruling in [[headless-pi]]) and gates the **failing model call** on the child
   discriminator (`--session-id` in `process.argv` — the documented precedent; the guard
   is load-bearing, not cosmetic). The failing call returns
   `stopReason: "error"` with the with-colon literal so `classifyRetry` returns `"retry"`.
   No other seam yields a retry; the failure must be the model call.
3. **card_id gap (skeptic-verified).** `test/faux-provider/extension.ts:135–147`'s
   dispatch step omits `card_id` today; the arm's dispatch step supplies it (knob-gated),
   with a scratch card face carrying a well-formed frontmatter block
   (`cardEpicKey`'s byte-0/trailing-newline caveat).
4. **Retry arming.** The scratch `.council.json` sets `retry: {enabled: true,
   maxAttempts: 2}` (or relies on `DEFAULT_RETRY_POLICY`, which already arms enabled with
   maxAttempts 3 when the key is absent — skeptic O4 closed-green).
5. **Assertions.** Both attempt sessions (`job-1`, `job-1-attempt2`) resolvable via
   `findSessionFile` / `attemptEntries` (`runs.ts:129`); each contains exactly one user
   block whose text contains `<council-procedure>`, non-empty, with
   `<features-deliver-overlay>` also present; the two blocks' `{kind, text}` projections
   are byte-equal; the raw `at` values differ (proving the `at`-exclusion is load-bearing,
   not vacuous). Negative control: a mutated/re-composed `dispatchInput` reds the
   equality (skeptic verified both mutation directions red).

## Byte-equality level (settled)

`parseTranscript` user blocks expose exactly `{kind, text, at}`; `at` (derived timestamp)
is the sole volatile across attempts — `attemptSpec` (`hub-tools.ts:305–318`) closes over
the single computed `dispatchInput` and varies only `sessionId = ${jobId}-attempt${n}`, so
the composed `-p` argv — and therefore the recorded first user message — is identical. The
honest assertion is the **located** block's `{kind, text}` projection (not raw JSONL,
whose envelope fields differ per session; not whole-block-with-`at`; not `blocks[0]`,
which is unfalsifiable two ways).

## Budget (AC5)

No new file under `test/` matched by default `bun test` discovery; the phase runs only
under `SMOKE_PHASE=7`; artifacts live under the dot-dir-hidden `smoke/.artifacts/`. The
default suite's wall-clock envelope ([[test-suite-budget]], 180s drift threshold) is
unchanged; the skeptic verified the current full suite at 113.22s.

## Explicitly out of scope

- Full card delivery inside the phase (overlay binding, not delivery completeness,
  satisfies "through an epic flow" — `composeRunnerInput` unconditionally embeds both
  markers; full delivery is Phase 2's existing job).
- A "live retry" under a real provider (unobtainable and vacuous).
- Any user-facing surface (Phase 1 ruling `n/a: ` on all five named classes).

## Follow-ups the deliberation surfaced for step 13 (not this card's scope)

- O5's live-verification residual is inherent to the card: the live SMOKE_PHASE=7 run is
  the deliverable and its own settling test.
- Whether the model-driven Phase 2 flow currently works around the `epic: null` fixture
  refusal (skeptic, unverified either way) — a Phase-2 fixture-hygiene question, not a
  blocker for this card's EV-2/EV-3 dispatch.
