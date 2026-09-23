---
id: FLLWUP-31
title: Per-node subtree reconciliation against seat session files
state: Backlog
owner: null
epic: EPIC-17
goal: The invocation-scoped spend record's subtree half reconciles each job's usage from that job's seat session file rather than the stream projection, and an automated test asserts the record's subtree total matches the hand sum over the seat session JSONLs for a fixture run.
---

## Intent

The EV-30 step-6 product-owner ruling named this as its own follow-up (M4):
the subtree half is currently a `stream-assistant` lower bound, because the hub
stream filters tool-result usage at `hub.ts:191` and compaction usage never
traverses stdout, while each seat's session JSONL (beside its manifest, via
`findSessionFile`) holds strictly more usage. Per-node reconciliation would
make the subtree half a session enumeration matching the own-session half's
basis.

## Acceptance

- The subtree half sums each job's seat session JSONL usage rather than the
  hub stream projection, asserted against a fixture run with a hand sum.
- `usageSource` on the reconciled half reflects the session-enumeration basis.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
