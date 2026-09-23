---
id: FLLWUP-26
title: Per-run cumulative token ceiling guard in /council
state: Backlog
owner: null
epic: EPIC-17
goal: While a /council run is in progress, the facilitator tracks cumulative input, output and cost across all dispatched seats and stops the run to surface the situation to the human before a configurable cumulative dollar ceiling is exceeded.
---

## Intent

`council.md` already names a per-run token ceiling as a guard the facilitator
enforces, but nothing implements it. It is a guard (stop before overspend), not
a report (honest accounting after spend), so it is adjacent to this epic but
mechanically orthogonal; it is filed as a follow-up rather than a child.

## Acceptance

- An automated test drives a fixture run past a configured cumulative ceiling
  and asserts the run halts and surfaces the cumulative figure.
