---
id: FLLWUP-86
title: `.council.json` mid-run write side-effects: assert gate.mode stability and skip theme reloads on non-theme writes
state: Backlog
owner: null
epic: EPIC-14
goal: The run's Phase 0 surfaces a gate.mode change after the run's first gate read (with the wiki page run-config-stability.md gaining the gate.mode hazard line), and watchCouncilConfig no longer triggers a theme reload/repaint for a .council.json write whose diff touched no theme bytes — the gate stays lazy-at-call and the existing debounce/re-arm/rename-burst semantics are unchanged.
---


## Intent

EV-74 made gate.mode a second config input a mid-run edit can flip (loadGateConfig reads fresh at every gate/route call). The wiki page run-config-stability names the hazard class; gate.ts's docstring names it for gate.mode. Phase 0 checks seat-model stability but not gate mode.

---

### Absorbed: FLLWUP-88 — Theme-watcher: skip the theme reload when a `.council.json` write touched no theme bytes

Every .council.json write — including the new /council-gate flips — re-arms loadThemeConfig + activateTheme because the watcher filters by basename only. Benign but real (skeptic O11, principal round 1); a gate-only write is observable on a surface that has nothing to do with the gate.

## Acceptance

- A Phase-0 (or equivalent run-start) check detects a gate.mode change after the run's first gate read and surfaces it; the wiki page run-config-stability.md gains the gate.mode hazard line.
- The gate stays lazy-at-call; no new runtime gate (gate-parity).

---

### From FLLWUP-88 — Theme-watcher: skip the theme reload when a `.council.json` write touched no theme bytes

- A write that changes only non-theme bytes fires zero theme reloads.
- A genuine theme change still reloads exactly once (existing pinned semantics unchanged).
- No polling of file contents beyond what the watcher already reads.
