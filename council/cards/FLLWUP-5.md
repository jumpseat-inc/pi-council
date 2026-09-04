---
id: FLLWUP-5
title: Criterion-type-aware judge projection in projectVerdictRecord
state: Backlog
owner: null
epic: EPIC-4
goal: projectVerdictRecord classifies judge criteria from carried criterion type (or rubric derivation), never from an evidence-content convention
---

## Intent

Filed from EV-19's step-13 draft-then-confirm (Skeptic step-9 objection 1,
`closed-red`, non-blocking; confirmed by the orchestrator per
features-deliver.md's autonomous follow-up contract). Drafted by the EV-19
runner and confirmed without edit.

The latent defect, reproduced by probe: `projectVerdictRecord` identifies
judge criteria by evidence convention (`evidence ∈ {pass, fail}`), so a
gate criterion whose artifact path is literally `"pass"`/`"fail"` produces
evidence `"pass"` and is misclassified as a judge criterion. No shipped
rubric has such a path (verified across all 16 fixture rubrics), and the
gap is inherited from EV-19's spec §2's stated evidence convention — which
is why the fix is out of EV-19's scope.

Fix direction: carry criterion type on `GradedCriterion`/`ResultRecord`
(or derive judge-ness from the rubric) so projection is type-guaranteed,
not evidence-convention-based.