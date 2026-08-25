---
id: EPIC-1
title: Links CLI output formats
state: Ready
owner: null
epic: null
goal: The links CLI supports machine-readable and image-focused output so documents can be inspected without reading the default line output.
---

## Intent

Bundles EV-2 (`--json`) and EV-3 (`--images`). The two flags are
independent of each other and of the default output, which stays unchanged.

## Standing rulings (recorded Phase 1 — binding on every seat)

- **STRATEGY** — Build order: EV-2 then EV-3 (board order). The two cards
  are independent; nothing about EV-3's shape affects EV-2's.
- **MERGE-CHECK** — Criterion 2 (GitHub Actions green on the PR head SHA)
  has no literal CI in this environment; it is satisfied by its local
  equivalent: the runner's `DONE` report attests the Skeptic re-ran all
  gates green on the branch-head SHA and the judge PASSed on that same
  SHA. Merge is SHA-pinned (`git merge --no-ff` on the exact verified
  SHA); any mismatch is a HALT, not a retry.
- **WATCH** — No human watcher is available for the first autonomous
  merge; it proceeds on the deterministic merge check alone, and is
  reported in the run ledger.
- **EPIC-CLOSE** — When both children are Done, move EPIC-1 to Done on
  the board and record the close in the run ledger.
