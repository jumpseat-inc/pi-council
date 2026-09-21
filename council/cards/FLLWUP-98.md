---
id: FLLWUP-98
title: Pin the follow-up headroom probe's tripwire on `truncated === false`
state: Backlog
owner: null
epic: EPIC-10
goal: The EV-80 real-board headroom probe asserts, in addition to each section's measured tokens ≤ its cap, that no section's drop record carries a non-false `truncated` — pinning the no-trim invariant the cap-fill guarantee otherwise leaves near-tautological — proven by the probe going red when a fattened board copy forces a trim and green on the shipped board.
---

## Intent

Skeptic step-9 non-blocking note on EV-80 (recorded for the probe's
maintainer): the probe's `measuredTokens ≤ cap` assertion is near-tautological
by construction — forward-greedy cap fill guarantees kept tokens never exceed
the cap, so that arm alone cannot distinguish a healthy board from a silently
cut one. The **genuine tripwire is `truncated === false`**: verified red in both
tamper directions during EV-80's verification (cap shrunk 22000→15000; board
fattened +40 entries), but as an observation, not a pinned assertion in the
shipped probe.

This card promotes the observation into the probe's own assertions so a future
edit that "simplifies" the probe cannot silently drop the strong arm.

## Acceptance

- The probe asserts per-section `truncated === false` over the shipped real
  board (PKG_ROOT fixture) in addition to the existing per-section cap arms.
- Tamper check shipped with the card: a fattened board copy (or shrunken cap)
  turns the probe red; the shipped board stays green.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and
  the repo's preflight pass.
