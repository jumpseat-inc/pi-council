---
title: Live Mechanism Verification
type: concept
summary: A shipped mechanism's unit proof is not proof of its operator-observable behavior — a live transcript falsifier is owed to the mechanism, and when run it can catch a defect the unit suite structurally cannot (EPIC-24's pre-injected procedure still read a procedure file at runner startup until a seat-level never-read rule).
aliases: [live smoke, operator-observable verification, transcript-surface verification, unit-proof gap, live falsifier]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/smoke]
sources: ["[[2026-09-24-epic24-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-24
---

# Live Mechanism Verification

A mechanism can be **unit-proven and still wrong at the surface an operator
actually sees**. Unit tests exercise the functions the mechanism calls; they do
not exercise the model-driven transcript a real runner produces. Where a
mechanism's claim is about that transcript, only a falsifier that runs the real
flow and parses the real transcript can decide it.

## The EPIC-24 witness

EV-90's [[procedure-context-injection]] was merged with unit tests that proved
the **composer** (`composeRunnerInput`): the dispatch input carries the rendered
procedure bodies, byte-identical to `renderProcedure`'s output. The spec's §6.6–
§6.8 falsifiers closed the mechanism as unit-proven, and its step-9 skeptic
record classified three transcript-level predictions as **live-smoke-only**:
no procedure-file `Read` in a runner's startup transcript, the first visible
toolCall not under `council/procedures/`, and byte-equal first user-message
blocks across retried attempts.

FLLWUP-114 (EPIC-24) supplied that live smoke. On its **first run** it found
prediction 1 **false on real behavior**: the flash runner read
`/pkg/council/procedures/features-deliver.md` at startup. Pre-injection had not
changed what the model did — the dispatch carried the bodies, but the seat's
prose did not forbid the read, and the model still performed one. The fix was a
hard **never-read rule in `council/agents/council-runner.md`**, merged with the
card. The same live run surfaced a print-mode stale-ctx parent crash (a job
outliving its turn), filed as FLLWUP-120.

## Why it generalizes

- **The subject differs.** A unit test's subject is the function; the
  operator-observable claim's subject is the transcript (`Read X`, first
  toolCall, byte-equality). [[verification-subject-pinning]] names the wrong-tree
  verdict class; this is its transcript analogue — verifying the composer is not
  verifying the runner.
- **The model is part of the mechanism.** Any claim of the form "the agent will
  now do X instead of Y" has the model in the causal path. Unit tests cannot
  observe the model's choice; a live run can.
- **An owed live falsifier is board work.** FLLWUP-114 was filed exactly because
  a live falsifier owed to a shipped mechanism is not a wiki note and not a
  drop. This is the [[smoke-test]] standing discipline — "*the first Council
  command without an end-to-end falsifier is a defect*" — applied one level down,
  to a single mechanism rather than a command.
- **Cost is real and bounded.** The live run is expensive (FLLWUP-114's card ran
  ~215 minutes wall, ≈$1.72 catalogue subtree), which is why it is opt-in under
  a smoke-phase selector and stays outside the default `bun test` budget
  ([[test-suite-budget]]).

## Relationship to the smoke siblings

[[smoke-test]] documents the Docker command-level smoke, the in-run SMOKE-1
scratch procedure, and the kitty live-path search-smoke. Live mechanism
verification is the same principle applied to a **shipped mechanism's transcript
claim**: dispatch the real flow, parse the real transcript, assert the
operator-observable property. The EPIC-24 run is its first worked example.

## Related

- [[procedure-context-injection]] — the mechanism the live smoke amended
- [[council-runner]] — the container whose transcript is the subject
- [[smoke-test]] — the command-level and live-path sibling patterns
- [[verification-subject pinning]] — the wrong-subject verdict class
- [[transcript-unit-rendering]], [[run-transcripts]] — the transcript substrate
- [[test-suite-budget]] — why the live arm stays opt-in

## Sources

- [[2026-09-24-epic24-run-ledger]]
- `council/cards/FLLWUP-114.md`, `council/agents/council-runner.md`, `docs/superpowers/specs/2026-09-24-FLLWUP-114-design.md`