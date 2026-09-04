---
title: Deterministic Merge Check
type: concept
summary: Under /features-deliver the human merge gate is replaced by five mechanical criteria — owner gates, gates-SUCCESS on the PR head SHA, no blocking skeptic objection, judge PASS, no open ruling — executed with no discretion, merged with --match-head-commit.
aliases: [merge gate, deterministic merge, five criteria merge]
tags: [pi-council/features-deliver, pi-council/process]
sources: ["[[2026-09-04-epic4-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Deterministic Merge Check

The features-deliver authority map re-homes the `/council` human merge
gate to a **mechanical check** for the duration of an autonomous run. No
seat — product-owner or steward included — may substitute judgment for
any criterion, and none may be skipped because a change is small. All
five must hold:

1. Every owner gate green, in full (tsc, bun test, validate.py — size of
   change irrelevant: "a one-line change clears the same gates as a
   thousand-line one").
2. **GitHub Actions green on the PR head SHA** — read via
   `gh pr checks <PR> --json name,state,workflow`, keyed on the
   `workflow` field (`gates` must appear with `state: SUCCESS`). An
   absent check is not a passing check; "nothing is failing" is not
   "gates ran and passed".
3. No blocking Skeptic objection.
4. Judge verdict PASS.
5. No `Needs Human` state or outstanding ruling on the card.

## The SHA pinning discipline

The merge must land the exact SHA the five criteria were read against:
`gh pr merge <PR> --merge --match-head-commit <X>`. A push landing between
check and merge would otherwise let the merge carry an unchecked SHA
silently. A mismatch is a **HALT, not a retry**.

## Observed practice (EPIC-3 + EPIC-4 runs)

- Status is written from **observed artifacts, never seat reports** — the
  orchestrator re-runs the owner gates at the exact head itself and reads
  the checks API before declaring criteria met.
- `Done` is set only after the merge lands **and** `gates` is green on
  the *merged* SHA.
- Skeptic gate-integrity culture complements the check: every
  verification proves each gate *can* fail before trusting a green.
- Judge REJECTs based on confabulated premises are re-dispatched with the
  corrected factual record — factual correction, never verdict coaching.
- The first autonomous merge of a run should be watched by the human, not
  merely reported.

## Observed practice (EPIC-5 run)

- Four more merges (EV-22 `07317e1`, EV-24 `5fa22a1`, EV-23 `362fe96`,
  EV-25 `467b744`), squash method this time — `--match-head-commit` pins
  the SHA regardless of merge method; the re-read-`headRefOid` fallback
  was held ready but never needed (no push raced a check).
- The watch-the-first-merge rule was honored by announcing the first
  merge in-line before the runner dispatched, not gating on a reply
  (the authority map re-homed merge authority entirely).
- **Conditional merge evidence (EV-23 J-1)** — a card may ship against a
  tracked known defect only when its step-9 verification asserts the
  follow-up-card record exists (FLLWUP-10) *before* the merge; the
  green-light is a criterion-3 sub-assertion, not a judgment call.
- Copy rulings were enforced at merge time as literal-string tests with
  gate-integrity injections (a one-word copy change turned 3 tests red).

## Related

- [[council loop]] — steps 9–12 this check overlays.
- [[card id allocation]] — the diverged-main discipline merges interact
  with.
- [[council models picker]] — the EPIC-5 surface merged under this gate.
- [[2026-09-04-epic4-run-ledger]] — eight merges executed under this gate.
- [[2026-09-04-epic5-run-ledger]] — four more, squash-method, conditional
  green-light.

## Sources

- [[2026-09-04-epic4-run-ledger]]
- [[2026-09-04-epic5-run-ledger]]
