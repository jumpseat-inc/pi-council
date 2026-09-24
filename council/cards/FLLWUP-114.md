---
id: FLLWUP-114
title: Live-smoke verification of the pre-injected runner transcript surface
state: Ready
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
