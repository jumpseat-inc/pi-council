---
id: FLLWUP-59
title: Mechanically derive or police the shape witness's token allowlist
state: Backlog
owner: null
epic: EPIC-9
goal: The shape witness's provider-token list is derived or policed mechanically, so a future token retirement cannot silently create a miss without the hand-maintained regex being updated.
---

## Intent

`test/faux-provider-shape.test.ts`'s token regex is a hand-maintained
allowlist; FLLWUP-48 found it had already missed once (the retired-path
source-comment token at `ev41-retry-e2e.test.ts:325`), fixed on that card
without widening the regex per its principal's refinement. A mechanical
derivation or police of the token list prevents the next token retirement
from silently creating a new miss.

Approved by `product-owner` (job-29) from FLLWUP-48's step-13 draft 2.
