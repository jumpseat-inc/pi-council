---
id: FLLWUP-71
title: Add the user-visibility question to the gate question set — let a recorded Verify re-route on a surface-touching card
state: Backlog
owner: null
epic: EPIC-13
goal: council/gate/questions.json carries a user-visibility question — userVisibility, a noul asking whether the change alters what a person sees, reads, or does (any visible surface, user-visible copy including strings and error text, an empty state, or an error state) — with the set's version bumped to gate-questions-2, a pre-registration record under EV-72's discipline naming the evidence that motivated the question (EV-69's Item B residual: no gate override covered surface-touching, so a recorded Verify on a surface-touching card lost the designer review), the matching override rule in council/gate/decision.json that hard-routes to Deliberate when userVisibility answers yes, and a falsifier proving a card whose observed touched-file set makes the rebuilt state answer userVisibility yes re-routes a recorded Verify to the full path with exactly one new v2 call line.
---

## Intent

Filed from EV-69's step-6 product-owner ruling (job-22), Item B: the
designer-review loss under a recorded Verify on a surface-touching card was
accepted as a TEMPORARY, NAMED residual, conditional on its home being the
gate's QUESTION SET — a fourth user-visibility question landing under EV-72's
pre-registration discipline with the question-set version bumped. Per R4, no
designer is seated in Verify; this question is the procedural compensation
(the ruling's own words: "a fourth user-visibility question landing under
EV-72's pre-registration discipline"):
instead of seating a designer on the reduced path, a surface-touching change
stops being routable to Verify at all — the observed-set re-check re-gates on
the rebuilt state, the new question answers yes, and the escalation-only
ratchet moves the card to the full path.

Current facts at filing time: `council/gate/questions.json` is
`gate-questions-1` with four questions (`reversible`, `publicContract`,
`blastRadius`, `decidablyTestable`); no override in `decision.json` covers
surface-touching (verified during EV-69's deliberation). EV-69's step-1
amendment records the surface-touching bit regardless of recorded mode — this
card gives that bit a mechanical consequence inside the gate instead of only a
procedural one (step-13 designer routing, the Verify skeptic's dispatch input).

`state: Backlog` — the ruling files it for the epic; promotion and scheduling
follow the normal flow. The question-set version bump must go through
EV-72's pre-registration record (or its mechanism once EV-72 lands) — a
bumped question set with no record is the same taste-driven move EV-72
exists to refuse.
