---
id: FLLWUP-30
title: Live end-to-end falsifier for the invocation boundary under pre-prompt compaction
state: Backlog
owner: null
epic: EPIC-7
goal: A live end-to-end test drives a council invocation whose session compacts before the injected user message and asserts the spend record's own-session half matches the hand sum of the entries at or after the append-order boundary, with the test gated behind an explicit opt-in environment variable so the default suite stays offline.
---

## Intent

EV-30's step-9 Skeptic carried one non-blocking `open-untested` residual: the
live `sendUserMessage → prompt() → _checkCompaction → message_end` sequencing
could not be exercised without a model call. The append-order boundary rule is
unit-verified against real `SessionManager` semantics, but the live compaction
path that would move the marker off the leaf chain has no end-to-end falsifier.

## Acceptance

- With the opt-in env var set, a real council invocation that compacts before
  the injected user message produces an own-session half equal to the hand sum
  of entries at or after the boundary.
- Without the env var, the test is skipped and `bun test` stays green offline.
- `bunx tsc --noEmit` and `python3 council/validate.py` stay green.
