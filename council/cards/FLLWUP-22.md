---
id: FLLWUP-22
title: Theme token drift vs pi 0.85.x grounds the devDependency upper bound
state: Deliberating
owner: null
epic: EPIC-6
goal: The scrollbar theme token drift between pi 0.84.x and 0.85.x is characterized by driven tests that are green on the version range the repo declares supported, and the run record states whether council themes are 0.85.x-compatible with the specific token deltas named, grounding the devDependency upper bound in evidence rather than an untested bound.
---

## Intent

Filed from FLLWUP-21's delivery (council-runner report, Skeptic-verified):
the env-split card's step 8 discovered that pi 0.85.0 and 0.85.1 —
bundle-identical to each other — changed the theme machinery's
`scrollbarThumb`/`scrollbarTrack` tokens (`selectedBg` → `text`), breaking
4 committed theme tests. The FLLWUP-21 ruling (R-2) set the devDependency
to `">=0.84.3 <0.86.0"` as verified-interval housekeeping, and the Skeptic
confirmed the lock resolution at 0.84.3 because the 0.85.x band breaks the
theme tests (byte-diff substantiated). Today the upper bound's *meaning* is
only "untested beyond it" — this card makes it mean something: characterize
the drift with evidence, decide whether council themes are reconcilable
with 0.85.x or genuinely incompatible, and record that decision as the
named reason for the bound (or the basis for widening it).

The reconciliation decision itself — adapt the theme tests/tokens to 0.85.x
vs document incompatibility — is the deliberation's to rule with evidence;
this card requires only that the decision be made, evidenced, and recorded,
with tests green on whichever side holds. Filed under EPIC-6 per the run's
standing orchestrator directive; surface is the theme contract, adjacent to
EPIC-1's shipped themes.

## Acceptance

- Driven tests characterizing the scrollbar token behavior across the
  supported version range, green in the repo's gate set on the declared
  side.
- The run record names the decision (0.85.x-compatible after adaptation, or
  incompatible as shipped) with the specific token deltas and byte-level
  evidence, and states what the devDependency upper bound therefore means.
- If the decision is to adapt, the adaptation keeps the ruled theme
  contract intact (EPIC-1/EV-4 precedents — council-drawn UI draws only
  from pi theme tokens); if the decision is to document incompatibility,
  the record names the upstream delta precisely enough for a future bump
  to act on.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution (run record)

### Step 1 gate (2026-09-05, runner container)

**Full council, surface-touching — designer seated.** The card is
cross-seam (theme machinery `extensions/theme-activation.ts`, the theme
tests `test/theme.test.ts` + `test/theme-activation.test.ts`, and the
devDependency `package.json`/`bun.lock`), and the reconciliation decision
(adapt the theme tests/tokens to 0.85.x vs document incompatibility) is
explicitly design-judgment per the card's own Intent — a real tradeoff,
not an implementation choice. Surface-touching per the card's own
framing ("surface is the theme contract"): the decision governs which pi
token the scrollbar thumb draws from and therefore what a person sees on
the 0.85.x band; the deliverable keeps the EV-4 token-only contract only
as a constraint on the drawing mechanism, not on the color decision.
So `designer` joins `owner`/`principal` as a third generator in steps 2–3.

Evidence base (reproduced on this container, `/tmp/fllwup22-ev/theme-*`):
pi 0.85.0 ≡ 0.85.1 byte-identical theme dirs; against 0.84.3 both
`dark.json`/`light.json` add `scrollbarTrack` and remap `scrollbarThumb`
`selectedBg` → `text`; 0.85.x `theme.js` resolves `scrollbarThumb` in the
**fg** map with `?? text` fallback (and `scrollbarTrack ?? muted`) where
0.84.3 resolved it in the **bg** map with `?? selectedBg` fallback — the
mechanism behind the 4 failing tests (FLLWUP-21 record).
