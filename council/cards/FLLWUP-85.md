---
id: FLLWUP-85
title: `.council.json` write-path hardening: seed the gate section with a canonical key order and add a concurrency discipline
state: Backlog
owner: null
epic: EPIC-14
goal: council/scaffold/.council.json seeds a top-level gate section {"mode":"off"} and pins a canonical top-level key order the writeGateMode insert path honors, and the shared writer gains a named concurrency discipline (lock/lease or versioned write-and-verify) so two concurrent sessions no longer silently lose an update — each proven by test with byte-preservation guarantees unchanged.
---


## Intent

EV-74's redundant-set rule means a repo that never enables the gate never has the `gate` key in its committed `.council.json` (the principal's round-2 risk 1), and the insert path invents no ordering rule (append-after-last) until a canonical order exists. Seeding makes the default visible and defines the order once, in the seed.

---

### Absorbed: FLLWUP-87 — Concurrent-session write discipline for `.council.json`

extensions/council-config-writer.ts's writeAtomic is tmp+rename; two concurrent writers in one repo race and one change is lost. EV-74 added a second write surface, making the pre-existing single-writer hazard easier to hit. The EV-74 deliberation scoped it out as a follow-up (principal round 2).

## Acceptance

- Fresh /council-init repo carries the gate section; /council-gate with no args prints off; the canonical order is pinned by a test.
- The insert path's position is revisited if the ruled order differs from append-after-last.
- Byte-preservation guarantees unchanged.

---

### From FLLWUP-87 — Concurrent-session write discipline for `.council.json`

- A test reproduces the lost-update under two interleaved writers.
- The chosen discipline is named and implemented for both writers (seat overrides and gate mode) through the shared splice module.
- Existing byte-preservation guarantees unchanged.
