---
id: FLLWUP-72
title: Make step 11 execute the merge-check table, not a prose mirror of it
state: Backlog
owner: null
epic: EPIC-13
goal: The orchestrator's step-11 merge check is executed by invoking the pure mode→criteria table (`evaluateMergeCheck` over `readCardMode`) rather than by hand-following the procedure prose, so the mode-keyed ruleset the fixture proves and the ruleset the orchestrator executes cannot drift.
---

## Intent

EV-70 shipped the mode-aware merge check as a pure module
(`extensions/merge-check.ts`) whose two verbatim HALT lines and three mode
columns are fixture-proven, while the orchestrator still executes the merge
check by reading the procedure prose and mirroring it by hand. The EV-70
Skeptic recorded this as an observation, not an objection: the two sides are
held together only by the prose pin and the fixture. Every new criterion or
column edit re-opens a hand-mirroring surface — the exact drift class the
fixture exists to close. Filing the executable path (a runner-invocable
entry point over the pure table, fed by the observed artifacts) removes the
second copy.

Out of scope: changing the criteria, the HALT lines, or the mode authority;
the orchestrator's `gh` artifact reads stay prose-described (network facts,
untestable offline — the EV-70 owner's recorded tradeoff).
