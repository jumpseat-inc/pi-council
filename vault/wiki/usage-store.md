---
title: Usage Store
type: concept
summary: The durable usage store at `getAgentDir()/council/usage/` — one record per invocation keyed on the marker's `at`, wrapping the SpendRecord byte-verbatim, schema v2 with the provider sibling; survives run pruning via write-time `pointerSurvivable` + read-time `ResolveOutcome`.
aliases: [usage store, durable usage store, StoredUsageRecord, resolveProvenance]
tags: [pi-council/concept, pi-council/epic7]
sources: ["[[2026-09-11-epic7-run-ledger]]"]
created: 2026-09-11
updated: 2026-09-11
---

# Usage Store

`extensions/usage-store.ts` (EV-31) persists each invocation's
[[spend-record]] somewhere that outlives the **pruned run directory**. It
follows the `mcp/auth-store.ts` pattern: a `getAgentDir()`-derived default path,
atomic tmp+rename, explicit chmod so modes hold regardless of umask.

## Location and naming

- **Home** — `getAgentDir()/council/usage/` (Phase-1 ruling R-3). This is the
  council's answer to the intake's `~/.pi-council` proposal: the existing
  durable council-state precedent (0600, atomic) rather than a new top-level
  home dir. Directory `0700`, file `0600`. A `README.md` names the format.
- **Filename** — `<ISO-basic>_<runId>_<command>.json`, where ISO-basic is
  rendered from the **invocation marker's `at`** (`YYYYMMDDThhmmssSSS`, UTC) —
  the invocation time, not the write time. The record body's `writtenAt`
  carries write-time honesty.
- **Choose-once** — the store key is the invocation identity, so an existing
  file is refused, never overwritten or recomputed.

## The record

```ts
interface StoredUsageRecord {
  schemaVersion: number; // USAGE_RECORD_SCHEMA_VERSION = 2
  spend: SpendRecord;    // EV-30's record, byte-verbatim — never extended
  provenance: UsageProvenance;
  runId: string; command: string; repoRoot: string; writtenAt: string;
  basis: { trigger: UsageTrigger; manifestsObserved: number };
  provider?: ProviderCostReport; // EV-29 sibling
}
```

`spend` is **frozen** — EV-29 adds its figures as the optional `provider`
sibling, not inside `spend`, and bumps `USAGE_RECORD_SCHEMA_VERSION` 1 → 2.
The read predicate is loose enough to tolerate the sibling on v1 records.
`provider` is absent on non-OpenRouter models, a dropped fetch, or a
pending-write abort (see [[cost-provenance]]).

## Provenance and read-back

The human asked whether stored usage can be traced back to the session JSONL.
The store's answer:

- **Write-time fact** `pointerSurvivable: boolean` — true iff the session file
  existed **and was outside `runsDir(repoRoot)`** at write time, i.e. pruning
  was never expected to remove it. Stored, because it is knowable at write and
  does not go stale.
- **Read-time outcome** `resolveProvenance(pointer)` — a never-throwing pure
  function returning
  `ResolveOutcome = "resolved" | "pruned-expected" | "missing-unexpected" |
  "no-session-file" | "range-missing"`. The outcome is **derived, never
  stored** (it would go stale).

The survivability split is the load-bearing one: a record whose session lived
*inside* the pruned run dir is `pruned-expected` (by design — e.g. a
council-runner's own session), while a survivable pointer that has vanished is
`missing-unexpected` (a defect signal). `range-missing` is the orthogonal
mechanism case (file present, entry ids absent).

## Deferred

Retention/compaction policy (the store grows unboundedly by design) is
FLLWUP-32; a bounded write-failure retry is FLLWUP-34; a live write-path
falsifier is FLLWUP-33.

## Related

- [[spend-record]] — the frozen payload
- [[cost-provenance]] — the `provider` sibling
- [[run-transcripts]] — the pruned run substrate this store outlives
- [[mcp support]] — the `getAgentDir()/council/` 0600 atomic precedent

## Sources

- [[2026-09-11-epic7-run-ledger]]
- `extensions/usage-store.ts`
