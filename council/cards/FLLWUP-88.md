---
id: FLLWUP-88
title: Theme-watcher: skip the theme reload when a `.council.json` write touched no theme bytes
state: Backlog
owner: null
epic: EPIC-14
goal: watchCouncilConfig no longer triggers a theme reload/repaint for a .council.json write whose diff touched no bytes inside the theme section (e.g. a /council-gate mode flip), while preserving the existing 250ms debounce, rename re-arm, and rename-burst-fires-once semantics pinned by test.
---

## Intent

Every .council.json write — including the new /council-gate flips — re-arms loadThemeConfig + activateTheme because the watcher filters by basename only. Benign but real (skeptic O11, principal round 1); a gate-only write is observable on a surface that has nothing to do with the gate.

## Acceptance

- A write that changes only non-theme bytes fires zero theme reloads.
- A genuine theme change still reloads exactly once (existing pinned semantics unchanged).
- No polling of file contents beyond what the watcher already reads.
