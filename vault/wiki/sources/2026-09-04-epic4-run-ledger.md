---
title: EPIC-4 Run Ledger
type: source
summary: The autonomous /features-deliver EPIC-4 run (v0.15.0 + v0.16.0) — six merged PRs building the model eval harness (/council-eval + /council-leaderboard), the binding ruling chain, divergent-main repair, and the four approved follow-ups.
aliases: [epic4 ledger, model eval harness run record]
tags: [pi-council/epic4, pi-council/run-ledger]
sources: []
created: 2026-09-04
updated: 2026-09-04
---

# EPIC-4 Run Ledger (2026-09-03/04)

Raw record of the `/features-deliver EPIC-4` run that shipped the [[model
eval harness]]. Six PRs, each merged on the [[deterministic merge check]]
with `--match-head-commit` and CI re-verified green on the merged SHA:

- EV-16 (PR #11, `d7f97d8`) — the design spec; R-1/R-2 rulings; E1/E2/E3
  confidence methodology.
- EV-17 (PR #12, `ad53248`) — per-run model override dispatch parameter.
- EV-18 (PR #14) — 16 fixtures (7 gate-only, 9 judge-bearing), pinned seed
  digests, whole-task-dir override-first-hit.
- EV-19 (PR #15, `402abb7`) — pure scorer; VerdictRecord/ResultRecord
  split; O1 key ruling.
- EV-20 (PR #16, `fb858b0`) — `/council-eval` matrix runner; the store;
  `cellScope`; smoke Phase 3; Q1/Q2/Q3 rulings.
- EV-21 (PR #18, `22630ff`) — `/council-leaderboard`; CONFIRM-2 live-summary
  fix; smoke Phase 4; σ-not-VARIANCE ruling.

## Key learnings

- **Symmetric-mirror store evolution**: each key dispute resolved by
  applying the sibling record's rule one layer over — see
  [[eval store contract]].
- **Records-alone-suffice by construction**: `cellScope` stamped at settle
  because `runs/` is ephemeral (see [[run transcripts]]); the summary is a
  pure function of records ([[cell aggregation]]).
- **Cell-invariance by topology**: grader as harness-dispatched sibling —
  no exclusion rule ([[grader topology]]).
- **CONFIRM-2**: the landed live summary blended rubric versions after a
  fixture bump (empirically reproduced); the byte-identity contract forced
  fixing both surfaces together, failing-test-first.
- **Divergent-main repair under parallel orchestrator sessions**: union
  merge chosen over rebase to preserve SHAs cited in card records; the
  in-flight card's own run record is authoritative for its board state
  (extends [[card id allocation]]).
- **Skeptic gate-integrity culture**: every verification proves each gate
  can fail before trusting green.

## Related

- [[model eval harness]] — the subsystem this run shipped.
- [[deterministic merge check]] — the merge gate every PR passed.
- [[chain promotion]] — the automated Backlog→Ready cadence (P1–P5).
- [[smoke test]] — Phases 3 and 4 were born in this run.
- [[2026-09-04-epic3-run-ledger]] — the EPIC-3 predecessor ledger.

## Sources

- `vault/raw/2026-09-04-epic4-run-ledger.md`
