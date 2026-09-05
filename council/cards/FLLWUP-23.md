---
id: FLLWUP-23
title: Named failure for pi-council installs missing node_modules
state: Ready
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
