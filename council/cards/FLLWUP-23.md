---
id: FLLWUP-23
title: Named failure for pi-council installs missing node_modules
state: Deliberating
owner: null
epic: EPIC-6
goal: Installing the pi-council package without its node_modules dependencies produces a named diagnostic at extension load instead of a silent zero-command state, proven by a driven test that loads the extension from a dependency-less install and asserts the diagnostic names the missing module and the remedy.
---

## Intent

Filed from FLLWUP-21's delivery (council-runner report, owner tradeoff (b),
out of that card's scope): when the package is installed by path or copy
without its `node_modules` — a real install shape for consumers vendoring
the repo — extension load currently dies with `Cannot find module
'@modelcontextprotocol/sdk'` surfaced as a generic loader error, and the
consumer-visible result is a silent zero-command state: no `/council-*`
commands, no explanation. The env-split card proved how opaque a
zero-command state is to diagnose (FLLWUP-21's whole root-cause arc); this
card closes the cheapest instance of that opacity.

This card adds a load-time guard or catch that turns the missing-dependency
case into a named diagnostic — which module is missing and what remedy
installs it (`bun install` / `npm install` at the package root) — asserted
by a driven test that loads the extension from a dependency-less install
shape and asserts the diagnostic text. The deliberation rules the mechanism
(try/catch around the dependency import, a load-time presence check, or an
equivalent); the card requires only that the failure be named, not silent,
and that the diagnostic be asserted by a driven test. Filed under EPIC-6
per the run's standing orchestrator directive; surface is extension-load
robustness, not the model picker.

## Acceptance

- A driven test loads the extension from a dependency-less install shape
  (scratch dir without `node_modules`, or an equivalent the deliberation
  rules) and asserts the diagnostic names the missing module and the
  remedy command.
- A normal install's load path is byte-identical in behavior (the guard
  fires only on the missing-dependency case).
- The diagnostic is actionable prose, not a stack trace alone.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution (run record)

### Step 1 gate (2026-09-05, runner container)

**Full council, surface-touching — designer seated.** The card is
spec-ambiguous by its own Intent ("the deliberation rules the mechanism
(try/catch around the dependency import, a load-time presence check, or an
equivalent)") — the goal admits more than one reasonable design for where
and how the guard fires. Surface-touching per the council.md test ("an
error state"): the deliverable is user-visible diagnostic prose that
replaces pi's generic loader line + silent zero-command state, and the
card's contract is that the failure be *named* — which module and which
remedy. So `designer` joins `owner`/`principal` as a third generator in
steps 2–3. Cross-seam by construction: the load path (`extensions/`),
the driven test (`test/` + a fixture), and the guard's placement all move
together.

Evidence base (this container): `extensions/index.ts` statically imports
`./mcp/index.ts`, which statically imports `./client.ts` and `./oauth.ts`
— the only `@modelcontextprotocol/sdk` import sites in `extensions/` are
`client.ts:1-4` and `oauth.ts:3,7`. With no `node_modules`, jiti fails
resolving `@modelcontextprotocol/sdk/client`, so the factory never runs
(zero commands) and pi's loader diagnostic names only the top-level entry.
Healthy install: `node_modules/@modelcontextprotocol/sdk` 1.30.0 present.
The env-split contract suite (`test/env-split-contract.test.ts` + driver
fixture) loads the packaged extension through the installed pi's loader
with fully explicit envs — the surface a guard that misfires on healthy
installs will trip (orchestrator binding: it must stay green).

Environment note (FLLWUP-24 binding): this container's
`node_modules/@earendil-works/pi-coding-agent` is **0.84.2** while
`bun.lock` resolves **0.85.1** — the installed deps drift from the lock.
Per the binding, no local gate output is trusted before the dev tree is
synced (`bun install --frozen-lockfile`), and every gate run must happen
in a worktree whose node_modules is synced from the lock first; noted
here and bound into every dispatch brief.
