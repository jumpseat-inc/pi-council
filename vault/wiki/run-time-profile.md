---
title: Run-Time Profile
type: concept
summary: The measured time profile of council/features-deliver runs — ~52% model latency / ~44% tool, ~80% of tool time in serial single-child council_wait, ~1.4-1.7x session parallelism, and a median ~260 s runner cold start — the audit that motivated EPIC-23.
aliases: [run time profile, time audit, latency profile, council run cost]
tags: [pi-council/concept, pi-council/hub]
sources: ["[[2026-09-24-epic23-run-ledger]]", "[[2026-09-24-epic24-run-ledger]]", "[[2026-09-25-epic25-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-25
---

# Run-Time Profile

An audit of 14 sessions / 763 council job manifests plus per-seat session
transcripts in `.pi/council/runs/` (the manifest carries `startedAt`/`settledAt`
per job; each `*_job-N.jsonl` carries per-message timestamps) measured where
`/council` and `/features-deliver` time actually goes. It classified each
job-internal gap: assistant → toolResult is **tool time**, toolResult →
assistant is **model latency**.

## The split

| Bucket | Share | Detail |
|---|---|---|
| Model latency (thinking + generation) | **~52%** | ~20 s per call; owner 4727 calls, council-runner 4230, skeptic 3117 |
| Tool / wait | **~44%** | of which **~80% is `council_wait`** |
| Unattributed | ~3% | |

Within tool time: `council_wait` 57.7 h across 468 calls (avg 444 s), `bash`
14.2 h across 8347 calls (avg 6 s — tests, tsc, git, preflight), everything else
negligible.

## Serialization, not tooling, is the long pole

- **354 of the 468 `council_wait` calls are single-child waits** (avg 455 s):
  the runner dispatches one seat, waits, then dispatches the next. 105 are
  multi-child.
- Per-session **parallelism is only ~1.4–1.7×**: a 21-card session took 24.9 h
  wall for 34.5 h of seat work.
- Per card: median **4 dispatches / 4 waits**.
- Runner **orientation** (start → first dispatch) median **260 s**, mean 304 s,
  max 1389 s — each `council-runner` re-reads `council.md` + `features-deliver.md`
  (714 lines) before acting. Over 105 cards that is ~9 h of aggregate re-read
  ([[procedure-context-injection]] removes it).

## Routing is dark

Across manifests the recorded execution modes read `Deliberate` 131 / `Direct`
10 / `Verify` 1 — the [[metered-deliberation-routing]] fast paths effectively
never fire, so the full roster's latency dominates every card
([[inert-gate-fallback]]).

## Why it matters

The intuition "runs are slow because tests are slow" is wrong: `bash` is ~9% of
the total. The time is **model generation** (many turns at high thinking) plus
**serial hand-offs** (one seat waited on at a time), multiplied by **zero
cross-card concurrency** ([[engineering-board]]'s board single-writer forbids two
runners at once). The highest-leverage changes are routing discrimination
(enable the fast paths), procedure pre-injection, and — architecturally —
partitioning the board so independent cards can overlap.

## EPIC-24 witness (2026-09-24)

Another fully serial `features-deliver` run — three cards, one runner at a time,
zero cross-card concurrency ([[engineering-board]]'s single-writer rule), the same
profile this page measured. The stand-out cost is the live falsifier: FLLWUP-114's
card ran ≈215 minutes wall with an ≈$1.72 catalogue subtree, and its owner
implementation alone held a 45-minute dispatch that outlived the card's
`timeout_minutes`. Keeping a long runner alive is still the
[[hub-job-supervision]] window invariant. Witness:
[[2026-09-24-epic24-run-ledger]].

## EPIC-25 witness (2026-09-25) — the batch shape

The batch override ([[batch-runner-topology]]) ran five cards through one
container: ~4h wall and ≈$1.9 catalogue subtree, dominated by the owner phase
(four owner dispatches; the largest alone ≈$0.60). It is the serial model at the
card-batch grain — one runner, one PR/CI run, no cross-card concurrency — with
the per-card verification cost collapsed into one skeptic + one judge. Witness:
[[2026-09-25-epic25-run-ledger]].

## Related

- [[council-runner]] — the container whose cold start and fan-out this measures
- [[hub-job-supervision]] — the manifest/subtree substrate the audit reads
- [[metered-deliberation-routing]] — the fast paths that would cut the latency
- [[inert-gate-fallback]] — why they are dark
- [[procedure-context-injection]] — the fix for the ~260 s cold start
- [[live-mechanism-verification]] — the live falsifier whose cost this profile carries
- [[phase1-rulings-record]] — the fix for escalating open judgment
- [[engineering-board]] — the single-writer rule that serializes cards

## Sources

- [[2026-09-24-epic23-run-ledger]]
- `.pi/council/runs/**` manifests + transcripts (ephemeral, gitignored)