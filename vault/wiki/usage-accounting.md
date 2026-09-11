---
title: Usage Accounting
type: concept
summary: The EPIC-7 subsystem — the full flat token/cost tuple with `costBasis`/`usageSource` provenance labels, captured at the hub, recorded per invocation, stored durably, and rendered at five autonomous exits.
aliases: [usage accounting, token accounting, cost accounting, usage tuple]
tags: [pi-council/concept, pi-council/epic7]
sources: ["[[2026-09-11-epic7-run-ledger]]"]
created: 2026-09-11
updated: 2026-09-11
---

# Usage Accounting

The EPIC-7 subsystem that makes a council invocation's spend **honest and
traceable**: what it spent in input, output and cached tokens, plus a
provenance-labelled dollar value, recorded durably and reported explicitly at
every autonomous exit. Before it, the hub kept four numbers
(`input, output, cost, turns`), silently dropped the cache/reasoning fields and
the per-component cost breakdown, and printed a scalar `cost=$X` with no basis.

## The tuple (`extensions/runs.ts`)

`Usage` is a **flat** record (EV-28's step-6 Q1 ruling; the nested wire shape is
flattened on ingestion, never persisted):

`input, output, cacheRead, cacheWrite, reasoning, totalTokens, costInput,
costOutput, costCacheRead, costCacheWrite, cost, turns, costBasis, usageSource`

Two invariants are load-bearing:

- **`reasoning` is a subset of `output`** (pi-ai) — accumulated independently,
  never re-added into `output` or any total.
- **`totalTokens` is provider-reported**, not derived from the component sum
  (Google/Vertex copies the provider's `totalTokenCount`; it may diverge).

The **wire→record clause**: on ingestion `u.cost.input → costInput`, …,
`u.cost.total → cost`, and partial cost objects coerce missing components to
`0`, never `NaN`. The card goal's dotted `cost.input|…` name the *wire*
components, not a nested record shape.

## The two provenance labels

- **`costBasis`** (`catalogue-estimate` | `reported`) — whether the dollar
  figure is pi's catalogue computation or the provider's own report. See
  [[cost-provenance]].
- **`usageSource`** (`stream-assistant` | `session-reconciled`) — what the
  totals are a projection of. The hub's capture is a **stream projection of
  assistant `message_end` events only**; tool-result and compaction usage are
  absent. The persisted field is the machine-readable statement of that scope.

An estimate must never stand as a charge, and a projection must never be
mistaken for a total — the labels are how a reader tells which is which.

## The chain

1. **Capture** — the hub accumulates the tuple from the child's stdout NDJSON
   ([[hub-job-supervision]]), persists it on the run manifest
   ([[run-transcripts]]).
2. **Record** — the pure [[spend-record]] sums the invoking session's own
   chain and the invocation's job forest into two halves.
3. **Store** — the durable [[usage-store]] wraps that record and keeps it past
   run pruning.
4. **Surface** — the deterministic [[usage-block]] renders it at five
   autonomous exits.
5. **Provider** — [[cost-provenance]]'s per-generation reported figures ride
   the store record as an optional sibling.

## Capture scope and its honesty

The manifest tuple and the child's session JSONL are **two views of the same
spend**, on different bases: the stream sees only assistant messages; the
session enumeration also sees tool-result and compaction usage. EV-30's
[[spend-record]] labels each half with its own basis rather than summing them
silently. Per-node subtree reconciliation is deferred (FLLWUP-31).

## Related

- [[spend-record]], [[usage-store]], [[usage-block]], [[cost-provenance]] — the
  rest of the chain
- [[hub-job-supervision]] — the capture seam
- [[run-transcripts]] — the manifest + session substrate
- [[eval-store-contract]] — the sibling "keyed records, append-only" discipline

## Sources

- [[2026-09-11-epic7-run-ledger]]
- `extensions/runs.ts`, `extensions/hub.ts`, `extensions/spend.ts`
