---
title: Spend Record
type: concept
summary: The invocation-scoped two-half record — `ownSession` (session enumeration) + `subtree` (stream projection), each with its own single-valued basis, plus the R-4 boundary label; an unresolvable boundary zeroes both halves before any forest walk.
aliases: [spend record, invocation spend, ownSession, subtree half]
tags: [pi-council/concept, pi-council/epic7]
sources: ["[[2026-09-11-epic7-run-ledger]]"]
created: 2026-09-11
updated: 2026-09-11
---

# Spend Record

`spendRecord()` in `extensions/spend.ts` (EV-30) answers "what did *this
invocation* cost" — the invoking session has **no manifest at all** (the hub
writes manifests only for jobs it dispatches), so the hub's job forest is not
the invocation's spend. The record is pure: no `node:fs`, no `ctx`, no hub
import.

## The two halves

- **`ownSession`** — sum over the invoking session's active leaf chain at or
  after the invocation boundary, `usageSource: "session-reconciled"`. It counts
  assistant **plus tool-result and compaction** usage, the same way pi's own
  session totals do.
- **`subtree`** — sum over the invocation's job forest (manifest usage),
  `usageSource: "stream-assistant"`. Because the hub stream sees only assistant
  messages, this is a **lower bound**; the `usageSource` stamp *is* the
  machine-readable lower-bound statement (no separate prose field).

`Usage`'s `costBasis`/`usageSource` are single-valued, so each half carries its
own basis rather than a mixed sum — the per-half shape exists precisely so a
`session-reconciled` half and a `stream-assistant` half are never re-collapsed
into one number with one provenance. There is deliberately **no `total` field**
on the record; a combined number is the surface's render concern
([[usage-block]]).

## The boundary

The boundary is resolved in **append order** — the first on-chain user message
*after* the invocation marker — **not** `parentId === markerId`. The Skeptic
falsified the parent-id rule on a reachable path: pre-prompt compaction
re-parents the injected message, so the marker loses its direct child. The
marker id is recovered via the leaf read-back because `pi.appendEntry` returns
`void`.

`lastEntryId` is bound to the **last entry id on the active leaf chain** at
compute time (walk `parentId` from `leafId`) — "last file entry" would wrongly
include abandoned branches.

An **unresolvable boundary** (marker absent or off-chain) returns
`boundary.resolved: false` with **both halves zeroed before any forest walk** —
explicitly chosen over "compute the subtree anyway", because a subtree without
a boundary timestamp would either overcount the whole run scope or invent a
clock. Steward later added an opt-in `boundaryMode: "marker"` for invocations
whose handler awaits and never injects a user message (`/council-eval`): the
anchor *is* the marker, and the forest gate uses the marker's own recorded
`at` — an extension, never a relaxation of the zero-both path.

## The R-4 label

`formatBoundaryLabel` renders `boundary=session=<sessionId>
entries=<first>..<last> jobs=<n>`, or `entries=unresolved` (plus the
`resolved:false` flag on the record) when unresolved. It is composed verbatim by
[[usage-block]], never re-rendered.

## Related

- [[usage-accounting]] — the tuple this record sums
- [[usage-store]] — the durable wrapper that freezes this record byte-verbatim
- [[usage-block]] — the surface that renders it
- [[run-transcripts]] — the manifests + session JSONL it reads

## Sources

- [[2026-09-11-epic7-run-ledger]]
- `extensions/spend.ts`
