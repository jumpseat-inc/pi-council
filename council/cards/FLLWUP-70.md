---
id: FLLWUP-70
title: Close the gates CI-timeout residuals — a per-step bound on every non-test step, and a ceiling census that covers every writing form
state: Backlog
owner: null
epic: EPIC-9
goal: Every step of the gates workflow other than the test step carries its own stated per-step timeout bound, and the FLLWUP-58 backstop tripwire derives the ceiling census from every test-ceiling writing form in the tree and pins the policy page's census figures to that derivation, so no CI-timeout number in the record can go stale silently.
---

## Intent

Filed by `product-owner` (job-31, EPIC-9 residuals run 2) from FLLWUP-58's
two step-13 drafts, merged into one card (EV-44's merge-near-duplicates
posture: both edit the same tripwire test, the same `gates.yml`, and the same
wiki paragraph). Draft 1 (the ruling-mandated accepted-and-known residual) is
widened from `install`/`tsc` to *every* non-test step; draft 2 (the step-9
skeptic's compact-form ceiling residual) is confirmed as work in the same
card. `product-owner` re-derived the numbers itself: compact-form sites are
19, not 18 (Σ 420 000 ms — its count agrees with the draft's sum, so the count
was the typo), all in non-gated files ⇒ widened default-suite floor 52,
tree-wide true count 37, and the wiki's "18" is wrong; shipped `60` still
binds (52 ≤ 60) but the honest ratio is 1.15×, not the page's advertised 1.42×,
and a single gated promotion puts the floor at 59 — the headroom is 1 minute,
not 10; `bun install`, `bunx tsc` **and** `python3 council/validate.py` are all
un-bounded (three steps, not two); `gates.yml`'s shipped tripwire asserts
"exactly one `timeout-minutes`", so the placement clause must be re-expressed
in the same commit — deleting or loosening the assertion is the wrong shape of
fix, and no job-level line is ever added (FLLWUP-58 §2's anti-drift ground).

`state: Backlog` — outside run-2's Phase-1 scope (FLLWUP-50–60); promotion is
the next decomposition's. Full ruling and arithmetic:
`vault/raw/2026-09-20-po-fllwup58-step13-confirmation.md`.

## Acceptance

Every non-test step of `.github/workflows/gates.yml` carries its own stated
per-step timeout bound (hand-set constants carrying the same line↔doc
parity-marker treatment as the test step's `60`); the backstop tripwire
derives the ceiling census from every test-ceiling writing form (including
compact-form third-positional-arg ceilings) and pins the policy page's census
figures to that derivation; the placement assertion is re-expressed rather
than deleted; the full gate set stays green. If the widened derivation lifts
the floor above the shipped `60`, that sizing call returns to `product-owner`,
not the card.