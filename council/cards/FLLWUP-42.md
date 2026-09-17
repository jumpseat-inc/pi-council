---
id: FLLWUP-42
title: Make the deterministic merge check independent of a human-granted admin bypass
state: Ready
owner: null
epic: EPIC-9
goal: The deterministic merge check succeeds under a repository ruleset that requires an approving review without a human-granted admin bypass, or the procedure names the bypass explicitly as the sanctioned step.
---

## Intent

A `main` ruleset created mid-run requires 1 approving review plus linear
history, so every autonomous merge depended on the human's run-scoped
`--admin` authorization. The authority map replaces the human merge gate with
the five criteria, and the human's authorization is explicitly not extended
to the next run. Named by the steward closure ruling as owed before the next
autonomous run.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R2 (merge authorization).** The human has explicitly authorized, for
  this run only, `gh pr merge <PR> --squash --admin --match-head-commit <X>`
  — the `--admin` bypass is the sanctioned merge step under the active
  `main` ruleset (1 approving review + linear history + thread resolution).
  This satisfies the goal's second disjunct, "or the procedure names the
  bypass explicitly as the sanctioned step"; the card's delivery is to make
  the procedure name it explicitly, not to remove the bypass. The
  authorization is run-scoped and is **not** extended to any later run.
