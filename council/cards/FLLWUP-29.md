---
id: FLLWUP-29
title: Persist Anthropic cacheWrite1h write-premium tokens
state: Backlog
owner: null
epic: EPIC-7
goal: A hub-dispatched seat whose assistant message reports cacheWrite1h persists that token count on the usage record while the council_wait head line stays within the 160-column budget, and an automated test asserts the persisted value and the rendered line length.
---

## Intent

EV-28's step-6 product-owner ruling (Q5) deferred `cacheWrite1h` — pi-ai
carries it, but the head-line width budget forbids a seventh field and the
card's acceptance does not name it. It is Anthropic-only (the 1h retention
write premium, charged at 2x base input) and is a real accounting gap for
Anthropic-served seats. Persisting it needs its own head-line width ruling
since the token split is already at the 160-column budget.

## Acceptance

- A fixture assistant message reporting `cacheWrite1h` persists the value on
  the usage record and the manifest.
- The `council_wait` head line still measures within 160 columns at the
  acceptance fixtures.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
