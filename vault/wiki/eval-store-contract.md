---
title: Eval Store Contract
type: concept
summary: The on-disk eval results contract — ResultRecord and VerdictRecord keyed on full tuples (cellId, repeat, scoredUnder/gradedBy, fixtureVersion, rubricVersion), append-only, first-write-wins per tuple, scoredUnder "self" for gate-only, divergent payload throws.
aliases: [eval store contract, eval results store, resultrecord, verdictrecord, eval store]
tags: [pi-council/epic4]
sources: ["[[2026-09-03-po-ev19-resultrecord-key]]", "[[2026-09-03-po-ev16-grader-topology]]", "[[2026-09-04-epic4-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-20
---

# Eval Store Contract

Everything durable the harness writes lives under `council/eval-results/`
(local-only, self-gitignored — R-1; deliberately outside the ephemeral
[[run transcripts|runs/]] boundary, which is pruned to 15 runs at
session start).

## Records

- **VerdictRecord** — the grader's contribution (judge criteria only):
  `{cellId, gradedBy, fixtureVersion, rubricVersion, repeat, perCriterion,
  gradedAt, gradingUsage}`. Key `(cellId, repeat, gradedBy)`; first-write-
  wins per `(cellId, repeat, gradedBy, fixtureVersion, rubricVersion)`.
  Not written at all for gate-only cells.
- **ResultRecord** — score + merged per-criterion record, stored as
  `StoredResultRecord = ResultRecord + cellScope`. Key
  `(cellId, repeat, scoredUnder, fixtureVersion, rubricVersion)`.
  `cellScope` (stamped by the harness at settle, NOT by the pure scorer):
  `{usage{input,output,cost,turns}, elapsedMs, stopReason?, repoState:
  sha256:<64hex>}` — telemetry lives on the durable record because the
  job forest in `runs/` is pruned.

> ⚠️ **`cellScope.usage` widening is pending (EPIC-7).** EV-28 widened the
> **hub** `Usage` to the full flat tuple ([[usage-accounting]]) and
> deliberately **whitelisted** `cellScope.usage` back to the recorded
> `{input,output,cost,turns}` shape so this contract stayed intact — the
> generic `usage: input.terminal.usage` assignment would otherwise have
> silently widened the append-only store with no eval-layer code change.
> Widening the durable record to the full tuple **and** amending this page
> is FLLWUP-28 (Backlog); the whitelist is not a permanent shape.

## The key evolution (symmetric-mirror principle)

1. VerdictRecord `(cellId, gradedBy)` — grader-topology ruling.
2. O1: ResultRecord `(cellId, repeat)` collides under re-grade → extend to
   `(cellId, repeat, scoredUnder)` — "the symmetric application of the
   same rule to the same problem on the same record."
3. Q1: VerdictRecord gains `repeat` — the mirror applied back; three
   grader dispatches for repeats 1..3 produce three readable verdicts.
4. Q1-D1: the version pair rides every key (it was already in the
   filename) — a fixture/rubric bump produces a new keyed set.
5. CONFIRM-2: the READ side must honor the same identity — see
   [[cell aggregation]].

The principle at each step: **a record's existence should reflect what
happened; silent loss is dishonesty.**

## Details that bite

- `cellId` string form: `taskId|model[:thinking]` — the stable aggregation
  identity; versions ride the key, not the cellId (Q1-D1), so a fixture
  bump doesn't fragment a rank row.
- `scoredUnder: "self"` — the explicit sentinel that a cell was gate-only
  and no judge ran; it is not a model id (Q1-D2).
- Filenames carry `v__`/`s__` discriminators so verdict-vs-result records
  for the same tuple can't collide on disk.
- Append-only, never pruned (retention is FLLWUP-7); writes are atomic;
  same-payload rewrite is a no-op; divergent payload for an existing key
  throws (defect signal).

## Related

- [[model eval harness]] — the subsystem.
- [[cell aggregation]] — the reader side of the contract.
- [[grader topology]] — why the verdict links by cellId.
- [[2026-09-03-po-ev19-resultrecord-key]] — O1, the key ruling.
- [[2026-09-03-po-ev16-grader-topology]] — the verdict schema origin.
- [[usage-accounting]] — the EPIC-7 tuple whose widening is FLLWUP-28.

## Sources

- [[2026-09-04-epic4-run-ledger]]
