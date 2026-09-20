---
title: 2026-09-20 PO EPIC-13 Promotion Ruling
type: source
summary: The EPIC-13 promotion ratification — EV-60 promoted to `Ready` as chain head, the other ten `Backlog` children promote one at a time by the chain cadence (never bulk), and EV-65/EV-68 stay `Ready` inert.
aliases: [po-epic13-promotion-ruling, EPIC-13 promotion ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-20
updated: 2026-09-21
---

# 2026-09-20 PO EPIC-13 Promotion Ruling

product-owner ruling (job-2) during `/features-deliver EPIC-13`, the first escalation of that
run (the EV-60 runner correctly refused to decide it).

## Decision

- **P1 — EV-60 promoted to `Ready` now**, as the chain head.
- **P2 — the remaining ten `Backlog` children promote by the established chain cadence, not in
  bulk.** Each promotes the moment its predecessor's merge SHA is on local `main` and
  `validate.py` is clean. The cadence is ruled once and executed by the orchestrator without a
  further packet ([[chain-promotion]]).
- **P3 — EV-65 and EV-68 stay `Ready` as recorded**; `Ready` *permits* a run, the dependency
  order *governs* which run happens next, and the run is serial, so the two early `Readys` are
  inert.
- **P4 — no escalation to `steward`**: the ruling executes R2, declines no card, accepts no
  permanent residual, and finds no `goal` defect.

## The grounds

Bulk promotion "invites cards to spec dependencies that don't exist" (several EV-66…EV-72 cards
spec against the gate ledger, `decide()`, or a recorded mode that do not yet exist); per-card
re-asking is mechanical busywork. EV-60 alone carried urgency: its raw material is the
repository's own run history, and `runs/` keeps only the last 15 runs (AGENTS.md convention 12).

## Related

- [[chain-promotion]] — the cadence this source created for EPIC-13
- [[engineering-board]] — card promotion state
- [[product-owner]] — the ruling seat
- [[2026-09-21-epic13-run-ledger]] — the run it opened

## Sources

- `vault/raw/2026-09-20-po-epic13-promotion-ruling.md`
- `council/cards/EPIC-13.md`, `council/cards/EV-60.md`