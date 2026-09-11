---
id: FLLWUP-32
title: Usage-store retention and compaction policy
state: Backlog
owner: null
epic: EPIC-7
goal: The durable usage store applies a bounded retention policy that keeps recent records while preserving the provenance pointers of the records it retains, and an automated test asserts that a store grown past the bound prunes the oldest records without breaking read-back for the survivors.
---

## Intent

EV-31 ships a durable store at `getAgentDir()/council/usage/` that is, by
design, never pruned — durability is the point. But an unbounded store is its
own long-term liability, and EV-31's spec §5 lists retention as a forward
decision. The policy must not defeat the traceability the store exists for:
pruning a record's file while leaving a pointer, or vice versa, breaks
read-back.

## Acceptance

- A store grown past the configured bound drops oldest-first and keeps the
  newest records.
- Read-back for every retained record still resolves its provenance pointer.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
