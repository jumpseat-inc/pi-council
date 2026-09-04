---
title: EPIC-5 Run Ledger
type: source
summary: The autonomous /features-deliver EPIC-5 run — four merged PRs shipping /council-models (catalogue resolver, first .council.json writer, token-only modal, command wiring), the gate-parity principle, the Phase 1 copy-ruling preflight, three product-owner escalations, and two infrastructure-stall recoveries with zero work lost.
aliases: [epic5 ledger, council-models run record]
tags: [pi-council/epic5, pi-council/run-ledger]
sources: ["[[2026-09-04-epic5-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# EPIC-5 Run Ledger (2026-09-04)

Raw record of the `/features-deliver EPIC-5` run that shipped the
[[council models picker]]. Four PRs, each merged on the
[[deterministic merge check]] with `--match-head-commit` and CI green on
the merged SHA:

- EV-22 (PR #19, `07317e1`) — the pure catalogue resolver
  (`extensions/catalogue.ts`); id-asc ordering and the four-flat-data
  signature ruled by product-owner.
- EV-24 (PR #20, `5fa22a1`) — the first `.council.json` write path
  (`extensions/council-config-writer.ts`); splice-not-re-serialize,
  gate parity (no capability gate in the writer).
- EV-23 (PR #21, `362fe96`) — the token-only modal
  (`extensions/model-picker.ts`); echo-then-run confirm, N-rows
  thinking affordance, shipped against the tracked FLLWUP-10 seam.
- EV-25 (PR #22, `467b744`) — `/council-models` command wiring
  (headless grammar + notify copy ruled byte-exact); smoke Phase 5.

## Key learnings

- **Gate parity** — the writer may be stricter than the runtime only
  where dispatch is also stricter; capability enforcement lives at
  selection (the picker), not persistence (see [[gate parity]]).
- **Splice over re-serialize** for byte-preservation on a committed,
  tab-indented config — a whole-object emitter fails the card's own
  SHA acceptance on real files.
- **Echo-then-run matured** into the house forcing function, including
  the non-assertive echo rule (see [[echo-then-run]]).
- **Phase 1 rulings preflight works** — copy/strategy front-loading
  saved escalations; one card (EV-25) ran the mechanical path entirely.
- **Stall-window invariant** — the no-activity window must exceed the
  longest legitimate silent wait at every dispatch layer; the runner-side
  poll-slice fix (EPIC-3) needed an orchestrator-side counterpart.
- **Committed-board-state recovery validated** — two dead containers
  resumed with zero work lost.

## Related

- [[council models picker]] — the surface this run shipped
- [[gate parity]], [[echo-then-run]], [[council config writer]]
- [[deterministic merge check]], [[council-runner]], [[hub job supervision]]
- [[2026-09-04-epic4-run-ledger]] — the precedent run ledger
- decomposition ruling packet: `vault/raw/2026-09-04-po-epic5-ruling.md` (raw, no page)

## Sources

- [[2026-09-04-epic5-run-ledger]]
