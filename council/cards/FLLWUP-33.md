---
id: FLLWUP-33
title: Live end-to-end falsifier for the EV-31 gated write path
state: Backlog
owner: null
epic: EPIC-7
goal: A live end-to-end test drives a real dispatch through the EV-31 gated write path and asserts the store writes exactly one record for the invocation after agent settle, with the test gated behind an explicit opt-in environment variable so the default suite stays offline.
---

## Intent

EV-31's seam-order guarantee (one store write per invocation, gated on
`agent_settled` plus forest settle) is proven with a fake loop, not a real
dispatch. A live falsifier would exercise the real `agent_settled` signal and
the composed hub `onChange` path. Sibling in shape to FLLWUP-30 (EV-30's live
boundary falsifier) but against the EV-31 write seam.

## Acceptance

- With the opt-in env var set, a real invocation writes exactly one store
  record after settle, asserted against the store directory.
- Without the env var, the test is skipped and `bun test` stays green offline.
- `bunx tsc --noEmit` and `python3 council/validate.py` stay green.
