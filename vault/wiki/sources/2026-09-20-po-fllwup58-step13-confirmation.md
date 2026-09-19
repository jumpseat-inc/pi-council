---
title: PO ruling — FLLWUP-58 step-13 follow-up confirmation (FLLWUP-70)
type: source
summary: product-owner merges FLLWUP-58's two step-13 drafts into one card (FLLWUP-70) and re-derives the CI census — 19 compact-form ceiling sites, true floor 52 min, so the shipped 60 has ~1 minute of headroom, not the 1.42× the page advertised.
aliases: [po-fllwup58-step13-confirmation, fllwup58 step13, fllwup70]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-20-po-fllwup58-step13-confirmation]]"]
created: 2026-09-20
updated: 2026-09-20
---

# PO ruling — FLLWUP-58 step-13 follow-up confirmation

Source: `vault/raw/2026-09-20-po-fllwup58-step13-confirmation.md`.

## One card, not two — `FLLWUP-70`

The per-step CI-timeout draft (widened from `install`/`tsc` to **every**
non-test step) and the compact-form ceiling-census draft are merged into one
card: both edit the same tripwire test, the same `gates.yml`, and the same wiki
paragraph (the merge-near-duplicates posture). `FLLWUP-70` is `Backlog`,
outside run-2's scope, unpromoted.

## Re-derived facts (the packet's numbers did not survive a recount)

1. Compact-form third-positional-arg ceiling sites are **19, not 18** (the
   draft's own Σ 420 000 ms agrees, so its count was the typo). All are in
   non-gated files ⇒ widened default-suite floor **52**, tree-wide true count
   **37**.
2. Shipped `60` still binds (52 ≤ 60), but the honest ratio is **1.15×**, not
   the page's advertised 1.42×, and a single gated promotion puts the floor at
   **59** — the headroom is **~1 minute, not 10**. The page over-claims its own
   safety margin.
3. `bun install`, `bunx tsc` **and** `python3 council/validate.py` are all
   un-bounded (three steps, not two), and `gates.yml`'s shipped tripwire
   asserts "exactly one `timeout-minutes`" — so the widened bound **reds
   FLLWUP-58's own mechanism** unless the placement clause is re-expressed in
   the same commit. Deleting or loosening the assertion is the wrong shape of
   fix; no job-level line, ever.

Boundaries: the non-test bounds are hand-set constants carrying the same
line↔doc parity-marker treatment as `60`; if the widened derivation ever lifts
the floor above the shipped `60`, that sizing call returns to `product-owner`.

## Takeaways

- **A derivation is only as honest as its writing-form coverage** — a
  standalone-line scan silently missed 19 compact-form ceilings, and the page
  then advertised a margin it had not computed.
- **A tripwire that asserts placement must be re-expressed, not loosened**, when
  the policy legitimately widens.

## Related

- [[test-suite-budget]], [[retired-path-tokens]]
- [[2026-09-20-po-fllwup58-gates-backstop]], [[2026-09-18-epic9-residual-run-2-ledger]]

## Sources

- [[2026-09-20-po-fllwup58-step13-confirmation]]