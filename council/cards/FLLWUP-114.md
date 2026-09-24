---
id: FLLWUP-114
title: Live-smoke verification of the pre-injected runner transcript surface
state: In Review
owner: owner
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


## Implementation record (owner, autonomous EPIC-24 run, 2026-09-24)

Branch `feat/fllwup-114-live-startup-reader` (worktree `.worktrees/fllwup-114`, base `e6a901f` = the spec commit).
Spec: `docs/superpowers/specs/2026-09-24-FLLWUP-114-design.md`; plan: `docs/superpowers/plans/2026-09-24-FLLWUP-114-live-startup-reader.md`.

**Delivered (all five acceptances):**

- **Part A** — `smoke/read-runner-startup.ts` (pure `readRunnerStartup(repoRoot, cardId?)`, throws `fllwup114-reader: …` on every failure) + the `SMOKE_PHASE=7` isolated phase in `smoke/driver.sh` (`phase7_run`): a real parent `pi -p` turn (fixture flash model) dispatches a real `council-runner` against **EV-2** (skeptic O1's closed-red fix — never EPIC-1, whose `epic: null` face `cardEpicKey` refuses); the waiter (`smoke/phase7-wait.sh` → `smoke/phase7-dispatch.ts`) closes the startup window at the runner's first `council_dispatch` toolCall (or settle/ceiling 840s inside a 900s `timeout` envelope); cleanup kills the parent + sweeps every process carrying the phase's `COUNCIL_RUN_ID` (`smoke/phase7-sweep.sh`) — nothing survives the phase. The same reader is wired into full-path Phase 2 after the runner-evidence probe at zero added model time.
- **Reader selection** is `runsDir` → `listRunIds` (latest-first) → `readManifests` (seat = council-runner) → `findSessionFile` — the spec's named path, never the `RUNNER_SESSIONS` grep. Anchors asserted BEFORE AC2/AC3 (≥1 toolCall; ≥1 `council_dispatch`; first user block non-empty carrying both markers; exactly one `<council-procedure>` block; marker-consistency with the card id). AC2 matches the label case-insensitively (a literal `Read` match would pass vacuously); AC3 is label-agnostic on the first toolCall's `firstArgOf`.
- **Part B** — the `card_id` gap closed knob-gated (`EV40_CARD_ID` → `ArmOptions.cardId`; `dispatchStepToolCallArgs` is the pure test seam; without the env the serialized args carry no `card_id` key — every existing arm byte-identical, `test/faux-provider-shape.test.ts` pins both knob states), and the EV-56 treatment arm (`test/ev41-seat-child-live.test.ts`) re-targeted to a `council-runner` dispatch (only a runner dispatch composes the bodies — `hub-tools.ts` composes solely for that seat) with a scratch EV-2 face: `attemptEntries(manifest)` = `job-1`/`job-1-attempt2`; each transcript's FIRST user block located by the `<council-procedure>` marker (exactly one, non-empty, overlay present, carries `EV-2`); `{kind, text}` projections byte-equal across the real Hub retry seam; raw `at` asserted to DIFFER (the exclusion is load-bearing).
- **AC5** — no new file under `test/` (reader tests ride the existing `test/ev90-runner-input.test.ts`; replay assertions ride the existing live arm); `bun test smoke` discovers only the 4 pre-existing fixture tests (unchanged); phase 7 runs only under `SMOKE_PHASE=7`; artifacts under the dot-dir `smoke/.artifacts/`.

**Part B verification (both directions, recorded):** green at head `9c15fc9` — the treatment test passes through the real tool seam (dispatch → real Hub → real `createRetrySupervisor` → real child JSONLs), file wall 7.0s. Negative control: a detached scratch worktree at that head with `attemptSpec` mutated to append a per-attempt sentinel to `dispatchInput` reds the treatment test at exactly the byte-equality assertion (attempt 2's block carries ` [per-attempt 2]`, attempt 1's does not). One discarded red: the first control run transplanted only the test file (knob edits untransplanted), the arm silently fell back to the skeptic seat, and the red was **copy-set-dependent** — evidence discarded, experiment redone with the full transplant.

**Gates (final tree `b24ef50`, all four, in order):** `bunx tsc --noEmit` clean; full `bun test` **1530 pass / 6 skip / 0 fail, 113.22s** (baseline 113.22s — AC5 wall-clock unchanged; 180s drift threshold untouched); `bash council/preflight.sh FLLWUP-114` PASS; **live `SMOKE_PHASE=7 bash smoke/run.sh` → SMOKE PASS** (the deliverable; see below).

**The live phase red before it went green — and the red was the card's own mechanism working (evidence preserved: artifacts `smoke/.artifacts/20260924-115236`, run dir `2026-09-24T11-52-47-218Z-115-ybg9fc`, red tree `41c692d`):** the first live run's flash-model runner performed a startup `read` of `/pkg/council/procedures/features-deliver.md` at 11:53:16 (11:52:55 session start) before any dispatch — designer prediction 1 was **false on real behavior**: EV-90 pre-injects the bodies but nothing forbade the reads. Root cause found in the artifacts (never guessed): 66 toolCalls, zero dispatch; a 32-toolCall exploration window; manifest `cancelled` at the reader's verdict. Fix (minimal, in the seat body EV-90 owns): an explicit **never-read-the-procedure-files** rule in `council/agents/council-runner.md`'s `<procedure>` block. Second finding from the same run: the parent `pi -p` turn settled ~5s after dispatching (its toolResult returns immediately), print-mode teardown disposed the ctx, and the runner's later settle crashed the parent on the stale-ctx widget render (`Hub.onChange → renderWidget → assertActive` — the exact print-mode window FLLWUP-56 documented); fix: the phase's scripted `council_wait` now covers the runner's whole lifetime (in-turn rule). Re-run: **SMOKE PASS** — real transcript: one 40,665-char composed first user block (both markers), 34 real toolCalls, first `council_dispatch` at call index 32, zero procedure-path reads in the 32-call startup window, first visible action a `bash`; sweep killed the 1 remaining runner process (no orphan).
