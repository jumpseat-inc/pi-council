---
id: FLLWUP-42
title: Make the deterministic merge check independent of a human-granted admin bypass
state: Backlog
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
