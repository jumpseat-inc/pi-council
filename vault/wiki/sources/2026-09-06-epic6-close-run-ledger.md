---
title: EPIC-6 Close Run Ledger
type: source
summary: The second features-deliver run on EPIC-6 — BUG-1 (backspace + first-use filter hint) and follow-ups FLLWUP-13..25 delivered, the env-split contract proven (the "0.85.0 regression" was probe contamination), the single-writer discipline hardened three layers deep, and the epic card itself closed at v0.18.0.
aliases: [epic6 close run, 2026-09-06-epic6-close-run-ledger, epic6 run 2]
tags: [pi-council/run-ledger, pi-council/epic6]
sources: ["[[2026-09-06-epic6-close-run-ledger]]"]
created: 2026-09-06
updated: 2026-09-06
provenance: run-ledger
source_path: vault/raw/2026-09-06-epic6-close-run-ledger.md
source_commit: 0f28824
captured: 2026-09-06
---

# EPIC-6 Close Run Ledger (2026-09-05 → 2026-09-06)

The second `/features-deliver EPIC-6` autonomous run, continuing
[[2026-09-05-epic6-run-ledger]]: fourteen gated merges (PRs #28–#41),
three ESCALATION round-trips (all narrow, facts-only, resolved by
[[product-owner]] in one ruling round each), and the run's crowning artifact —
**the epic card itself marked Done**, the board's first epic closure, at
v0.18.0.

## What the run delivered

- **Picker surface complete** ([[council models picker]]): backspace
  deletion, the pre-press hint `press / to filter models`, the no-match
  exit hint `↓ then esc exits search`, and search-mode frame fit
  (`maxRows - 1`). Every open follow-up from the first run is closed.
- **The single-writer discipline hardened three layers deep**
  ([[main-repo immutability]]): the runner body, the working seats' bodies,
  and every dispatch input now enforce no-branch-state-mutation on the main
  repository — plus [[verification-subject pinning]] for judge and skeptic
  dispatch inputs (PR head SHA + head worktree path + loop frame).
- **The "0.85.0 regression" proved false** ([[env-split contract]]): the
  extension-load failure was `COUNCIL_SEAT` probe contamination, not a
  version delta — clean-env 0.85.0 registers all 14 commands. The
  version-independent hazard (unregistered command → real model dispatch
  from a seat session) is documented, deliberately unfixed.
- **Local-gate evidence got a tripwire** ([[lock-drift tripwire]]):
  `council/check-pi-drift.sh` fires before preflight's frozen-lockfile
  self-heal, closing the silently-wrong-version gate class observed in
  three consecutive runs.
- **Second sibling smoke harness** ([[smoke test]]): the kitty search-smoke
  (`smoke/search-smoke/`), a pty-driven CSI-u live-path falsifier whose
  one genuine catch (prune exit 123) was found by the step-11 merge-gate
  re-run after the Skeptic dismissed it — the re-run is load-bearing.
- **Theme token drift characterized** ([[council theme]]):
  0.85.x-compatible as shipped, deltas named byte-level, the devDependency
  upper bound grounded in two-extreme gate runs.
- **Named load failure** ([[mcp support]]): a dep-less install names the
  missing module and the remedy instead of dying silently into a
  zero-command state.
- **Wiki conventions settled** ([[2026-08-23-agents]] ingest): page
  headings mirror the source verbatim; `sources:` frontmatter carries
  wiki-internal cross-refs only, the external citation lives in the four
  provenance keys.

## The escalation pattern (vs the first run's zero)

Phase-1 front-loading killed every *copy* dispute before dispatch (four
rulings, never re-asked). The three escalations were all *discovered-
mechanism* consequences no pre-flight could have named: a safety property
to trade away (dummy key), a card premise that proved false (no regression
to restore), and wiki field semantics. Each needed exactly one ruling
round on a facts-only packet. Front-loading is the escalation-killer for
foreseeable disputes; discovered mechanisms must route — that routing is
cheap when the packet carries facts, never a recommendation.

## Incidents (none verdict-invalidating)

Session disruption zeroing `.git/config` and one owner's worktree (remote
restored from the human's URL; recovery from committed board state); a
seat's main-repo `git checkout` reverting records (reflog recovery; seeded
the hardening chain); two runner stalls in silent waits (fixed by
re-stating the poll-slice protocol in dispatch inputs); one judge
empty-output dispatch (re-dispatched once); one Skeptic-dismissed defect
caught by the step-11 merge-gate re-run.

## Related

- [[council models picker]], [[two-bit focus machine]] — the completed surface
- [[env-split contract]], [[main-repo immutability]],
  [[verification-subject pinning]], [[lock-drift tripwire]] — the run's new concepts
- [[council runner]], [[hub job supervision]], [[preflight]], [[smoke test]] — the process pages it sharpened
- [[deterministic merge check]] — fourteen more merges under the gate
- [[2026-09-05-epic6-run-ledger]] — the first EPIC-6 run

## Sources

- [[2026-09-06-epic6-close-run-ledger]] (raw)
