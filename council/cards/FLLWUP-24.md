---
id: FLLWUP-24
title: Local gates refuse to run when installed deps drift from bun.lock
state: Deliberating
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

## Execution (run record)

### Step 1 gate (2026-09-06, runner container)

**Full council, surface-touching — designer seated.** The card is
spec-ambiguous by its own Intent ("The deliberation rules the exact
mechanism and home") — the goal admits more than one reasonable design
for where the tripwire lives (`council/preflight.sh`, the owner
instruction set, or another equivalent) and how installed-vs-locked is
compared. Cross-seam by construction: the home (run mechanics,
`council/preflight.sh`), a driven proof (test/ + a scratch-tree
fixture), and the owner-agent guidance all move together. Surface-touching
per the council.md test ("strings and error text"): the deliverable is a
named diagnostic a person reads — both versions and the remedy — replacing
a silent wrong-version gate run. So `designer` joins `owner`/`principal`
as a third generator in steps 2–3, consistent with FLLWUP-23's precedent
(named diagnostic prose judged surface-touching there).

Evidence base and environment notes (this container):

- **Drift observed and recorded, then synced per the binding.** At
  container start, `node_modules/@earendil-works/pi-coding-agent/package.json`
  read **0.84.2** while `bun.lock` resolves **0.85.1** (devDependency band
  `>=0.84.3 <0.86.0`; lock entry `@earendil-works/pi-coding-agent@0.85.1`)
  — the exact failure class this card trips on, reproduced live during
  FLLWUP-21/22/23 and confirmed here. `bun install --frozen-lockfile`
  (exit 0, 30 packages) brought the installed tree to 0.85.1; git status
  clean afterward (node_modules ignored). Every local gate run in this
  run happens on lock-synced trees only.
- The recent deliverables that must stay green under this card's change:
  `test/env-split-contract.test.ts` (FLLWUP-21), the theme token suite
  (`test/theme.test.ts`, `test/theme-activation.test.ts`, and the other
  `theme-*.test.ts` files — FLLWUP-22), and `test/fllwup23-dep-less.test.ts`
  (FLLWUP-23).
- Binding exclusions: no packaged seat/procedure content changes; no
  `smoke/` changes; no `package.json`/`bun.lock` changes. CI
  (`.github/workflows/gates.yml`) is unchanged — fresh frozen-lockfile
  install already guards CI; this card is the local-evidence tripwire
  only.
- Gate authority: `.github/workflows/gates.yml` + the FLLWUP-21 plan
  record — frozen-lockfile install, `bunx tsc --noEmit`, `bun test`, and
  `python3 council/validate.py`, all full at every gate check.
