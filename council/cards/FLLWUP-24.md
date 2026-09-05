---
id: FLLWUP-24
title: Local gates refuse to run when installed deps drift from bun.lock
state: Ready
owner: null
epic: EPIC-6
goal: Running the repo's local gate commands against an installed node_modules that disagrees with bun.lock produces a named failure before any gate result is trusted, proven by a drift-detection assertion that names the stale dependency and the remedy, with the owner instruction set carrying the requirement.
---

## Intent

Filed from FLLWUP-22's delivery (council-runner report): in **two
consecutive runs** (FLLWUP-21 and FLLWUP-22), the repo's installed
`node_modules/@earendil-works/pi-coding-agent` sat at a version that
disagreed with `bun.lock`'s resolution (0.84.2 installed vs 0.84.3 locked,
then the 0.85.1 re-lock), and a local `bun test` / `bunx tsc --noEmit` run
without a prior `bun install` silently verified the *wrong* pi version —
local gate evidence that CI (fresh frozen-lockfile install) would not
corroborate. Each run's Skeptic had to spend a correction discovering it.

This card adds a drift tripwire so local gate evidence is trustworthy: an
assertion (in `council/preflight.sh` — the natural home, or wherever the
deliberation rules) that the installed `@earendil-works/pi-coding-agent`
matches `bun.lock`'s resolution and fails with a named diagnostic (stale
version, installed vs locked, remedy `bun install --frozen-lockfile`)
before any gate is trusted. The deliberation rules the exact mechanism and
home; the card requires that drift be detected and named before gate
results count. Related but distinct from FLLWUP-23 — that card is about a
*consumer* installing the package without dependencies; this card is about
*this repo's dev tree* drifting from its own lock. Filed under EPIC-6 per
the run's standing orchestrator directive; surface is run mechanics.

## Acceptance

- A drift-detection assertion that compares the installed
  `@earendil-works/pi-coding-agent` version against `bun.lock`'s
  resolution, failing with a named diagnostic (both versions, remedy
  `bun install --frozen-lockfile`) — proven red on a deliberately drifted
  scratch tree and green on a matching tree.
- The mechanism's home (preflight, owner instruction set, or equivalent)
  is the deliberation's ruling, recorded on the run record.
- CI is unchanged — the `gates` workflow already enforces the lock via
  fresh frozen-lockfile install; this card is the local-evidence tripwire.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).
