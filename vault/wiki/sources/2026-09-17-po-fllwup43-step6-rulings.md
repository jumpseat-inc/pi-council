---
title: PO ruling — FLLWUP-43 step-6 (lossless goal oracle)
type: source
summary: product-owner rules FLLWUP-43's step-6 items — the colon-space ban is retracted (its recorded rationale was false), the wrap residual is documented rather than writer-gated (gate-parity), the "rephrase without a colon" advice is dropped, a single-cell eval smoke suffices, and three portfolio calls (goal conjunct-B opacity, EV-37's frozen goal, consumer-repo skew) escalate to steward.
aliases: [po-fllwup43-step6, fllwup43 step6 ruling, lossless goal oracle]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-17-po-fllwup43-step6-rulings]]"]
created: 2026-09-20
updated: 2026-09-20
---

# FLLWUP-43 — product-owner step-6 ruling

Source: `vault/raw/2026-09-17-po-fllwup43-step6-rulings.md`. Ruled while the
card was still `Deliberating`, so the goal was not yet immutable.

## Rulings

- **R1 (wrapped-line policy):** the wrap-truncation fact is settled, but the
  fix is **not** a writer-side FAIL. A wrap gate with no loader/dispatch match
  violates [[gate-parity]] (writer ⊆ loader ∪ dispatch); the correct move is to
  document the trim + line-break-ends-the-value behavior in the new copy and
  file a step-13 follow-up for the loud gate.
- **R2 (Q4 "rephrase without a colon"):** **drop permanently** — it is exactly
  the EV-37 loophole (paraphrasing a literal goes dead).
- **R3 (Q5 unrecorded rationale):** retraction is safe — the recorded
  colon-space rationale is false (`parse_frontmatter` splits on the first `: `
  and is lossless); no undocumented rationale bears the load.
- **R4 (Q6 full-matrix eval re-run):** a **single-cell smoke** on
  `board-create-card` with a treatment/control goal pair is the minimum
  sufficient evidence; the full 16-fixture matrix is not required.
- **R5 (Q7 cold-read comprehension test):** out of repo scope — record
  designer's P1 prediction on the card; do not block on a human-subject test.

## Escalations to steward

- **ESC-1:** FLLWUP-43's own goal conjunct B is referentially opaque (names no
  file) — amend it in place while `Deliberating` to name `test/retry.test.ts`
  and `PROVIDER_FINISH_REASON_ERROR` (`extensions/retry.ts:78`).
- **ESC-2:** EV-37's `Done` goal still carries the lossy colon-free spelling —
  re-state (new card) or accept the historical record.
- **ESC-3:** propagation skew — already-initialized consumer repos keep the old
  colon-space FAIL forever (no override path for `council/validate.py`) —
  decide whether mitigation is owed.

## Deliverable

One mechanical commit: delete the `": " in goal` FAIL from all ten
`validate.py` copies, correct the docstrings, update `_template.md` and both
procedure paragraphs, bump the `board-create-card` rubric + fixture versions,
and re-derive the seed `treeDigest`s. Red-first tests T1–T8; T3 (the wrap
truncation) becomes the follow-up card's test.

## Related

- [[retry-classification]] — the literal-hygiene lesson (EV-37)
- [[gate-parity]] — writer ⊆ loader ∪ dispatch (the dispositive rule)
- [[engineering-board]] — goal-as-judge's-only-input, goal immutability
- [[eval-store-contract]] — version-keyed records, divergent-payload throw
- [[deterministic-merge-check]] — the five merge criteria
- [[2026-09-16-po-ev37-merge-gate-defect]] — the runtime fix precedent
- [[2026-09-17-epic9-residual-run-ledger]] — the run this ruling belongs to

## Sources

- [[2026-09-17-po-fllwup43-step6-rulings]]