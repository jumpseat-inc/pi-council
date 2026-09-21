---
id: FLLWUP-102
title: Make the http-404 unavailability literal claim only what the transport can establish
state: Backlog
owner: null
epic: EPIC-10
goal: The step-13 unavailable-state surface never claims a cause the transport cannot establish — an `http-404`, which the taxonomy produces by formatting any 404 status from any cause, no longer renders as the assertion `model-card coming-soon` while the recorded HTTP reason is discarded — proven by a re-expressed render cell that keeps the shipped literal-line shape, with the dedicated failure class and this mapping amendment landing in one diff if and when the model-card page gains a real availability signal.
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

## Acceptance

- The `http-404` render no longer asserts `model-card coming-soon`; the recorded HTTP reason is not discarded.
- A re-expressed render cell replaces the old cell (never deleted) and keeps the shipped literal-line shape.
- The goal needs no external change to be met.
- When/if the model-card page gains a real availability signal, the dedicated failure class and this mapping amendment land in one diff.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.