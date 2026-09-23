---
id: FLLWUP-30
title: Opt-in live falsifiers for the usage path: the compaction boundary and the EV-31 gated write seam
state: Backlog
owner: null
epic: EPIC-17
goal: With an explicit opt-in environment variable, a live end-to-end test drives a real council invocation whose session compacts before the injected user message and asserts the spend record's own-session half matches the hand sum at/after the append-order boundary, and a second live test drives a real dispatch through the EV-31 gated write path and asserts exactly one store record after settle; without the env var both skip and the default suite stays offline.
---


## Intent

EV-30's step-9 Skeptic carried one non-blocking `open-untested` residual: the
live `sendUserMessage → prompt() → _checkCompaction → message_end` sequencing
could not be exercised without a model call. The append-order boundary rule is
unit-verified against real `SessionManager` semantics, but the live compaction
path that would move the marker off the leaf chain has no end-to-end falsifier.

---

### Absorbed: FLLWUP-33 — Live end-to-end falsifier for the EV-31 gated write path

EV-31's seam-order guarantee (one store write per invocation, gated on
`agent_settled` plus forest settle) is proven with a fake loop, not a real
dispatch. A live falsifier would exercise the real `agent_settled` signal and
the composed hub `onChange` path. Sibling in shape to FLLWUP-30 (EV-30's live
boundary falsifier) but against the EV-31 write seam.

## Acceptance

- With the opt-in env var set, a real council invocation that compacts before
  the injected user message produces an own-session half equal to the hand sum
  of entries at or after the boundary.
- Without the env var, the test is skipped and `bun test` stays green offline.
- `bunx tsc --noEmit` and `python3 council/validate.py` stay green.

---

### From FLLWUP-33 — Live end-to-end falsifier for the EV-31 gated write path

- With the opt-in env var set, a real invocation writes exactly one store
  record after settle, asserted against the store directory.
- Without the env var, the test is skipped and `bun test` stays green offline.
- `bunx tsc --noEmit` and `python3 council/validate.py` stay green.
