---
id: FLLWUP-85
title: Seed `gate: {"mode": "off"}` in the scaffold `.council.json` and pin a canonical top-level key order
state: Backlog
owner: null
epic: EPIC-14
goal: council/scaffold/.council.json seeds a top-level gate section {"mode":"off"} so the enablement key is visible in fresh repos, the scaffold pins a canonical top-level key order (council, theme, retry, gate or the ruled order), the writeGateMode insert path honors that order, and /council-gate off on a fresh scaffold repo still resolves off with byte-identical file semantics documented.
---

## Intent

EV-74's redundant-set rule means a repo that never enables the gate never has the `gate` key in its committed `.council.json` (the principal's round-2 risk 1), and the insert path invents no ordering rule (append-after-last) until a canonical order exists. Seeding makes the default visible and defines the order once, in the seed.

## Acceptance

- Fresh /council-init repo carries the gate section; /council-gate with no args prints off; the canonical order is pinned by a test.
- The insert path's position is revisited if the ruled order differs from append-after-last.
- Byte-preservation guarantees unchanged.
