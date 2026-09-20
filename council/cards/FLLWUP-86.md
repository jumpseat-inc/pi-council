---
id: FLLWUP-86
title: Run-config-stability Phase-0 assertion: gate.mode is a second mid-run-flippable config input
state: Backlog
owner: null
epic: EPIC-14
goal: The run's Phase 0 asserts gate-mode stability the way seat-model stability is asserted: a run started with the gate in one mode that finds a different gate.mode on a later loadGateConfig read surfaces the run-config-stability hazard (routing and intake change mid-run) instead of silently proceeding, with the loader's lazy-at-call posture unchanged.
---

## Intent

EV-74 made gate.mode a second config input a mid-run edit can flip (loadGateConfig reads fresh at every gate/route call). The wiki page run-config-stability names the hazard class; gate.ts's docstring names it for gate.mode. Phase 0 checks seat-model stability but not gate mode.

## Acceptance

- A Phase-0 (or equivalent run-start) check detects a gate.mode change after the run's first gate read and surfaces it; the wiki page run-config-stability.md gains the gate.mode hazard line.
- The gate stays lazy-at-call; no new runtime gate (gate-parity).
