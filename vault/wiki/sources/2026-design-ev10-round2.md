---
title: Designer — EV-10 round 2 (attribution on the gate, not the card)
type: source
summary: The designer's round-2 position on EV-10 — attribution (`Contributors:` + `Disagreements:` + an unresolved marker) belongs on the step-3 gate presentation, never in card files; the decomposition should be generate-then-attack (principal/designer/skeptic attack a facilitator first pass, product-owner rules last) on seat-charter-fit grounds.
aliases: [design-ev10-round2, ev10 round2, features-new attribution design]
tags: [pi-council/source, pi-council/epic3]
sources: ["[[2026-design-ev10-round2]]"]
created: 2026-09-20
updated: 2026-09-20
---

# Designer — EV-10 round 2

Source: `vault/raw/2026-design-ev10-round2.md`. Round 2 revises the round-1
position and engages owner and principal.

## Revised position

- **Attribution is gate-presentation, not card content.** The
  `Contributors:` line, `Disagreements:` block, and
  `Decision: unresolved — your call` marker belong on the step-3 draft the
  facilitator puts in front of the human — never in
  `council/cards/<id>.md` frontmatter or `Intent`. After approval the card
  carries the approved state; the deliberation trace survives in the run
  substrate (`runs/<runId>/…`, 15-run retention).
- **Generate-then-attack, not parallel-generate.** The facilitator produces a
  first-pass decomposition; `principal`, `designer`, `skeptic` attack it in
  parallel within their charters; `product-owner` rules disputes **last** and
  does not generate. Parallel-generate asks `product-owner` and `skeptic` to
  author goals their seat bodies forbid — a `Contributors: product-owner` line
  on a generated goal is a **false signifier**.

## Key arguments

- A `Disagreements:` block inside `Intent` reads as surface-naming prose to
  `council.md` step 1's designer-seating test — a false signifier; `validate.py`
  does not parse `Intent`, so it is inert text the loop never grounds in.
- The step-3 gate block in `features-new.md` must survive byte-identical
  (round-1 P5, retained).
- `validate.py` cannot catch a malformed `features-new.md`; the smoke run is
  the only check that exercises the rewrite (principal's claim 6), so the gate
  is the byte-identity test **plus** the smoke run.

## Falsifiable predictions

P-rev-1 (charter-fit dispatch produces role-consistent output), P-rev-2
(attribution on the draft, zero in card files), P-rev-3 (no false-signifier
`Contributors:` line), P-rev-4 (step-3 byte-identity preserved).

## Related

- [[three-wave-decomposition]] — the shipped structure this position shaped
- [[presented-never-written]] — the two-part gate it produced
- [[council-loop]] — the verbatim-labeled aggregation convention reused
- [[product-owner]], [[skeptic]], [[designer]], [[principal]] — the seat charters that constrain generation
- [[2026-09-04-epic3-run-ledger]] — the run this design belongs to

## Sources

- [[2026-design-ev10-round2]]