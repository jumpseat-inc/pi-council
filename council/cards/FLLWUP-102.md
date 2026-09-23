---
id: FLLWUP-102
title: Follow-up surface amendments: stop asserting `model-card coming-soon` on http-404 and cover the wrapper's advisory arm
state: Backlog
owner: null
epic: EPIC-16
goal: The step-13 unavailable-state render no longer asserts `model-card coming-soon` on an http-404 (the recorded HTTP reason is not discarded), and test/ev83-runner-followup.test.ts drives composeFollowupReview under advisory and asserts the `(advisory)` qualifier versus `(active)` with the basis tokens `confirmation-pending`/`advisory-only` pinned verbatim — each new assertion recorded non-vacuous, existing byte baselines re-expressed, no shipped behavior or prose changed.
---


## Intent

Confirmed and re-grounded by the EV-82 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev82-step13-confirmation.md`, Item 2). The implementing owner
authors the prose and owns the `how`.

**The two verified facts.**
- `extensions/gate-run.ts` — the taxonomy is
  `no-api-key | timeout | network | http-<status> | http-400-refusal | invalid-response | internal-error`
  with `class: refusal ? "http-400-refusal" : \`http-${res.status}\``. There is **no
  dedicated 404 class**; `http-404` fires for a 404 from any cause (wrong base URL,
  retired alpha path, renamed model id). `http-400-refusal` is the shipped precedent for a
  semantic sub-class *inside the transport*.
- `extensions/followup-render.ts` maps that formatted status to the bare literal
  `model-card coming-soon`; `test/ev82-followup-render.test.ts` proves the loss — the
  record's basis is `gate call failed: HTTP 404: page gone` and the render returns
  `["model-card coming-soon"]`. The reason the transport recorded is discarded in favour
  of an inference about a third party's webpage.

**The defect exists today.** The card's precondition cannot be the external trigger. This
repo runs `gate.mode: active`, so a 404 reaches a person here, and EV-84's third arm
drives the unreachable endpoint.

**Obligations.**
- The two verified facts with their sites, as above.
- The goal is satisfiable **without** any external change; no acceptance clause may depend
  on the model-card page gaining a signal. That is the trigger for the coupling only.
- Keep the shape: R8's one literal line per unavailable state, replaced not appended, zero
  lines when the gate resolves; the corrected literal keeps the shipped literal-line shape.
- The stale render/transport header claim, if any, moves in the same diff.
- A taxonomy-side fix (a dedicated failure class) is this card's own work, not a follow-up.

---

### Absorbed: FLLWUP-103 — Cover the wrapper's advisory arm in EV-83's own suite and pin the two escalation-basis tokens

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

- The `http-404` render no longer asserts `model-card coming-soon`; the recorded HTTP reason is not discarded.
- A re-expressed render cell replaces the old cell (never deleted) and keeps the shipped literal-line shape.
- The goal needs no external change to be met.
- When/if the model-card page gains a real availability signal, the dedicated failure class and this mapping amendment land in one diff.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.

---

### From FLLWUP-103 — Cover the wrapper's advisory arm in EV-83's own suite and pin the two escalation-basis tokens

- `test/ev83-runner-followup.test.ts` drives `composeFollowupReview` under `advisory` and asserts the rendered line's `(advisory)` qualifier versus `(active)` under `active`, with no other byte differing.
- The two basis tokens `confirmation-pending` and `advisory-only` are pinned verbatim in the shipped `<followup_decision>` block.
- Each new assertion is recorded non-vacuous by a perturbation (drop the token or swap the qualifier → red).
- Existing byte baselines are re-expressed, never deleted; no shipped behavior or prose changes.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.
