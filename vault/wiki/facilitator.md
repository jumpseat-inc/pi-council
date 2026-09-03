---
title: Facilitator
type: concept
summary: The routing-and-bookkeeping role at the center of a council run — fans seats out, counts rounds and dispatches, writes the board, enforces the gates — and decides nothing.
aliases: [facilitator role, the facilitator]
tags: [pi-council/concept]
sources: ["[[2026-08-23-pi-council-design-spec]]"]
created: 2026-09-03
updated: 2026-09-03
---

# Facilitator

The **facilitator** is the role the parent session plays while running
`/council` ([[council-loop]]) or, per card, the [[council-runner]] inside
`/features-deliver`. Its defining property: **the facilitator decides
nothing.** It routes work, fans seats out, counts rounds and dispatches, and
writes the board. Tests decide testable disputes; ruling seats decide
judgment; the human decides the rest.

## What it does

- **Gates** — runs [[preflight]] (step 0) and reads the card before anything
  dispatches; decides full-council vs. mechanical and surface-touching.
- **Fans out** — dispatches the seats ([[seats]]) via the hub
  ([[hub-job-supervision]]), each dispatch bounded and awaited.
- **Counts** — enforces the ≤3-round exchange cap, per-run token ceilings,
  step-9 iteration caps, and the never-dispatch-a-third-time rule.
- **Writes** — is the single writer of board/card state transitions during a
  run, `validate.py` after every write (see [[engineering-board]]).
- **Routes what doesn't close** — open-judgment to [[product-owner]] /
  [[steward]]; unresolved objections to `Needs Human`.
- **Never merges** — the human merge gate is reserved; the facilitator only
  records the merged-with-green-CI outcome.

## Facilitator ≠ skeptic ≠ judge

The design deliberately separates the three authorities a naive agent loop
collapses: the facilitator (process), the [[skeptic]] (evidence), the
[[judge]] (stop condition). A facilitator that argued its own position would
be a single-model monologue with extra steps — the failure mode the council
exists to avoid.

## Related

- [[council-loop]] — the procedure the facilitator runs
- [[council-runner]] — the facilitator role instantiated for one card
- [[hub-job-supervision]] — the spawn/monitor substrate it dispatches through
- [[engineering-board]] — the state it writes

## Sources

- `council/procedures/council.md`, `council/procedures/features-deliver.md`
- [[2026-08-23-pi-council-design-spec]]
