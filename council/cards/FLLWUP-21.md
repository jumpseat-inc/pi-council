---
id: FLLWUP-21
title: Restore pi-council extension load on stock pi 0.85.0 and pin the devDependency
state: Ready
owner: null
epic: EPIC-6
goal: The pi-council package's extensions load and register their commands on stock pi 0.85.0 from a fresh scratch HOME with no council configuration, proven by a driven headless verification asserting command registration succeeds on the installed stock pi, with the root cause of the load failure documented and the devDependency on @earendil-works/pi-coding-agent changed to a deliberate version constraint.
---

## Intent

Filed from FLLWUP-14's delivery (council-runner report): the kitty smoke
harness discovered that stock pi 0.85.0 loads **no** pi-council extension —
both TUI and headless (themes load, extensions do not), so `/council-models`
and `/council-init` are unregistered commands that misroute to a real model
dispatch on 0.85.0 with a fresh scratch HOME (unregistered-command fallback
hits the model — an unexpected-cost hazard, not just a missing feature).
The smoke image deliberately pins `PI_VERSION=0.84.3`, and this repo's
`devDependency "@earendil-works/pi-coding-agent": "*"` is unbounded — the
package's own development environment silently rides whatever pi ships.

This card root-causes the extension-load failure on pi ≥0.85.0 (expected
shape — pi manifest/extension API drift between 0.84.3 and 0.85.0 — but the
actual cause is the card's work, not an assumption), restores command
registration on the stock pi, and replaces the unbounded devDependency with
a deliberate version constraint consistent with the root cause. The card is
filed under EPIC-6 per the run's standing orchestrator directive; the
discovery is the smoke's, the defect is the package's.

## Acceptance

- A driven headless verification (test-side, in the repo's gate set) that
  loads the packaged extension the way stock pi does and asserts command
  registration succeeds on the installed stock pi — red on the current
  `main` state if the defect reproduces, green after the fix.
- The root cause of the 0.84.3 → 0.85.0 load failure is documented on the
  card's run record (the concrete API/manifest delta, with evidence), not
  guessed.
- `package.json`'s `@earendil-works/pi-coding-agent` devDependency is a
  deliberate version constraint consistent with the root cause (pin, range,
  or bump — the deliberation rules which), and the choice is recorded.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`), and the kitty smoke harness still passes
  against its pinned 0.84.3 (unchanged contract).
