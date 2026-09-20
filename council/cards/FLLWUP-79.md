---
id: FLLWUP-79
title: Signpost the gate ledger from the usage block's exclusion surface
state: Backlog
owner: null
epic: EPIC-13
goal: The usage block's gate legend carries a signpost from the exclusion surface to the gate-ledger trace surface, naming the ledger path resolved through CONFIG_DIR_NAME (never a hardcoded .pi), with a golden test pinning the signpost text and a test that the path is built from the config-dir constant rather than a literal.
---

## Intent

Filed from EV-71's step-13 follow-up draft O3(b), which the designer flagged as
urgent once P6 closed. EV-71 establishes the division of surfaces the designer
named: the usage block is the **exclusion** surface (what is not in this total)
and the gate ledger is the **trace** surface (the per-call records). Today the
legend tells a reader that spend is excluded with no way to reach the records
that show it.

## Acceptance

- The block names a concrete path to the gate ledger, and the path resolves
  through `CONFIG_DIR_NAME` (no hardcoded `.pi`, no absolute clone path).
- A golden test pins the signpost text; the row keeps its ruled grammar, label
  column, prefix, and stack slot.
- The signpost does not change the exclusion semantics or the total.
- Works under `mode: "off"` (no ledger file yet) without claiming a file exists.