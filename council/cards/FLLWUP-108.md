---
id: FLLWUP-108
title: Usages remediation pin: catch command-drop and update-step-drop
state: Backlog
owner: null
epic: EPIC-15
goal: The usages-procedure pin goes red when a later edit drops either refresh command or the package-update step from the remediation sentence, without going red on a claim-preserving rewording of the sentence.
---

## Intent

FLLWUP-105's pin (`test/usages-procedure.test.ts`) asserts containment of
exactly three literals, and its measured boundary is that both command
literals already live in `usages.md`'s `**Run.**` section — so the pin reds
only on wholesale-removal and trigger-reword classes (skeptic arms S4/S5,
O-A/B, re-verified at step-9 O-s45: command-drop and update-step-drop stay
green). Catching the dropped-command/dropped-update-step class requires a
wording-coupled literal (e.g. an operative-step or sentence-exclusive
literal) — precisely the over-pin class the FLLWUP-105 convergence rejected
for that card (a 4th lexical literal reds on claim-preserving rewords). The
product-owner ruling of 2026-09-24 (Q2, Q3b) routed the residual here
instead of accepting it as final: the design problem — red on element-drop,
green on claim-preserving rewording — is this card's to solve, with the
A/B-variant test discipline the FLLWUP-105 deliberation established (variant
A: claim-preserving reword → must stay green; variant B: element dropped →
must go red).

## Acceptance

- The pin (or its successor) reds when either refresh command (`rm -rf` of
  the copied skill directory; the `/council-init` re-run) or the
  package-update step is dropped from the remediation sentence.
- The pin stays green on a claim-preserving rewording of the sentence — all
  remediation elements intact, different wording (the FLLWUP-105 round-2
  A/B variants are the calibration set).
- `test/usages-procedure.test.ts`'s existing three-literal behavior is
  preserved or its replacement carries the same wholesale-removal and
  trigger-reword sensitivity (arms (a)/(b) of the step-9 matrix).
- `council/validate.py` gains nothing — the pin stays in `test/`, per the
  docs-card rule.
- `bunx tsc --noEmit`, `bun test`, and `python3 council/validate.py` pass.
