---
id: FLLWUP-62
title: Gate the mid-block colon-bearing frontmatter continuation residual
state: Backlog
owner: null
epic: EPIC-9
goal: A mid-block colon-bearing continuation of a non-goal key (e.g. `owner:` wrapped as ` queue: …` before `goal`) is refused by `parse_frontmatter` with a FAIL naming the wrap instead of parsing the continuation as a spurious key and validating green, where the FLLWUP-51 residual pin (test R10) flips in the same change and whitespace-leading keys the loader currently accepts silently still parse clean.
---

## Intent

FLLWUP-51 shipped the loud positional gate for card frontmatter (merged
`dee64c5`) and left exactly one documented residual: a colon-bearing
continuation of a **non-goal** key inside the frontmatter block (e.g.
`owner: tista` wrapped as ` queue: ops` before `goal:`) parses as a
spurious key and `council/validate.py` exits 0 — a non-goal field
truncated silently. Product-owner (EPIC-9 run-2 escalation, PO item 1)
ruled the residual document-only for FLLWUP-51 — recorded in copy, pinned
by test R10, not gated — and ordered it filed as this step-13 follow-up
card under EPIC-9. The ruling also narrowed the justification the
deliberation gave: the cheap predicates (whitespace-in-key check, key-shape
regex) catch only the space-bearing sub-shape and would reject
whitespace-leading keys the loader currently accepts silently — a
parser-character + sub-shape-coverage tradeoff, not an impossibility. A
later card may gate this; this is that card.

## Acceptance

- Test R10 in `test/fllwup51-gate.test.ts` (currently pins the silent
  exit-0 behavior) flips in the same change; a new pin asserts the chosen
  predicate refuses the space-bearing sub-shape while whitespace-leading
  keys still parse clean.
- The gate lives in `parse_frontmatter` (loader refusal, gate-parity
  consistent per the FLLWUP-51 card-domain mapping); parity mechanics per
  T3/T5: 10 byte-identical `validate.py` copies, 8 `seed.treeDigest`
  re-pins, `fixtureVersion` bump, root-only procedure copy if copy moves.
- Green side: single-line goals with `: `, extra intentional keys before
  `goal:`, and all shipped data (cards incl. body fences, 8 seeds, smoke
  fixture) stay green; FLLWUP-51's other pins (R1–R12) stay green.
- Full council expected: the predicate design is a real parser-character
  tradeoff (the deliberation declined it once on exactly these grounds).
