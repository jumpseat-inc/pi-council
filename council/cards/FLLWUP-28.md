---
id: FLLWUP-28
title: Widen cellScope.usage to the full tuple and amend the eval-store contract
state: Backlog
owner: null
epic: EPIC-17
goal: The persisted `StoredResultRecord.cellScope.usage` carries the full usage tuple (input, output, cacheRead, cacheWrite, reasoning, totalTokens, the four cost components and costBasis) and `vault/wiki/eval-store-contract.md` records the amended shape, with an automated test asserting a written record round-trips the full tuple.
---

## Intent

The deferred half of the EV-28 step-6 product-owner ruling (Q3): EV-28
deliberately whitelisted `cellScope.usage` to the recorded store shape
`{input, output, cost, turns}` so the append-only eval-store contract stayed
intact. Widening the durable record to the full usage tuple is its own card,
because it must land together with the amendment to
`vault/wiki/eval-store-contract.md` that records the new shape — a follow-up
cannot un-write records already serialized under the narrower shape.

## Acceptance

- A written `StoredResultRecord` round-trips the full usage tuple through
  `JSON.parse`.
- `vault/wiki/eval-store-contract.md` states the amended `cellScope.usage`
  shape.
- The whitelist added at `extensions/eval-runner.ts` for EV-28 is removed
  in the same change.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
