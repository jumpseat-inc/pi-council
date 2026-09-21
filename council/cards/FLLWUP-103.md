---
id: FLLWUP-103
title: Cover the wrapper's advisory arm in EV-83's own suite and pin the two escalation-basis tokens
state: Backlog
owner: null
epic: EPIC-10
goal: `test/ev83-runner-followup.test.ts` drives `composeFollowupReview` against a fixture repo whose `gate.mode` is `advisory` and asserts the rendered line carries the `(advisory)` qualifier where the same candidate under `active` carries `(active)` with no other byte differing, and pins the shipped `<followup_decision>` block's basis tokens `confirmation-pending` and `advisory-only` verbatim — each new assertion recorded non-vacuous by a perturbation (drop the token or swap the qualifier → red), the existing byte baselines re-expressed rather than deleted, and no shipped behavior or prose changed.
---

## Intent

Confirmed and amended by the EV-83 step-13 product-owner ruling. The implementing owner
authors the prose and owns the `how`.

**The advisory-composition arm is the real gap.** `composeFollowupReview` is EV-83's own
seam; its tests cover `off`, the fail-safe-`File` trap, and resolved `active` — never
`advisory` (3 call sites in `test/ev83-runner-followup.test.ts`). EV-82's advisory
coverage sits at the pure render (`test/ev82-followup-render.test.ts`, hand-built records)
and at the parent gate tool, so the wrapper's advisory path has no test anywhere. The
confirmation-authority ruling's `advisory → ESCALATION` arm is keyed on the result-level
`mode` flag the wrapper returns, so a wiring slip there — an `(active)`-qualified line
reaching an advisory container — is exactly the collapse the ruling forbids, and nothing
catches it today.

**The token pins are the cheap half.** `confirmation-pending` and `advisory-only` are
vocabulary only the runner authors (`council/agents/council-runner.md`); no engine
constant produces them, so a prose pin is the sole mechanical guard for the ruling's
binding clause 2. Adjacent pins already catch a careless rewrite, so this half is
regression insurance, not a discovered defect.

**Dropped from the draft:** "the `(advisory)` qualifier line, no enforcement field" as a
goal clause — "no enforcement field" is structural absence in a typed result (the
skeptic established it once, probe 5, closed-green); a runtime test cannot assert it
meaningfully. The qualifier byte and the mode equality are the falsifiable form.

Prose-only; `council.md` §13 untouched; R6 byte baselines re-expressed, never deleted.

## Acceptance

- `test/ev83-runner-followup.test.ts` drives `composeFollowupReview` under `advisory` and asserts the rendered line's `(advisory)` qualifier versus `(active)` under `active`, with no other byte differing.
- The two basis tokens `confirmation-pending` and `advisory-only` are pinned verbatim in the shipped `<followup_decision>` block.
- Each new assertion is recorded non-vacuous by a perturbation (drop the token or swap the qualifier → red).
- Existing byte baselines are re-expressed, never deleted; no shipped behavior or prose changes.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.