---
title: Per-Attempt Provenance
type: concept
summary: A retried dispatch keeps one job id, one manifest, and one job-tree row — an `attempt` integer, carried cumulative usage, and per-attempt session pointers — so every attempt's transcript and spend are recoverable from the manifest alone and the reported figure sums every attempt.
aliases: [attempt identity, per-attempt identity, attemptGroupId, retried dispatch]
tags: [pi-council/concept, pi-council/epic9]
sources: ["[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-16
updated: 2026-09-16
---

# Per-Attempt Provenance

The run-substrate half of hub retry (EV-39 + EV-42). A retried seat dispatch
must stay honest about how many attempts happened, what each cost, and which
transcript belongs to which: that is the whole card.

## Cardinality (A) — one id, one manifest, one row

A retried dispatch mints **one job id, one manifest, and one job-tree row**,
with an `attempt` integer on the manifest and **carried cumulative usage**. It
does **not** mint a fresh id/manifest/session per attempt. The alternative —
N jobs for one intent — made the tree show N dispatches and the subtree usage
silently absorb N attempts' tokens, two slices each assuming the other owned
the distinction.

The field name **`attempt`** is fixed by the EV-40 design agreement and may not
be renamed. There is **no `attemptGroupId`**: under cardinality (A) the
dispatch's job id *is* the group key, and a second key of identical cardinality
is a plausible-but-false distinction. See [[cost-provenance]].

R4 makes the row label `attempt 2/3`, so the denominator is carried into the
renderers as the init-time [[retry-policy]] snapshot — see [[council-job-tree-inline]].

## The traps the deliberation closed

- **`startedAt` is stable**, with an internal attempt clock — re-basing it per
  attempt double-counts elapsed time (a Skeptic `closed-red`).
- **`pid` is cleared alongside `exitCode`**, or `writePids` is guarded, so a
  stale pid never survives a retry.
- **No sidecar file** — `readManifests` would ingest it and `buildTree` throws.
- **A fresh session id per attempt is mandatory**, recorded with a provisional
  `<id>-attemptN` suffix; the per-attempt transcripts survive in the run dir.
- **`JobState "retrying"`** is a real state: `isSettledForWait` false, `cancel`
  handled, `tick()` unchanged, a `⏸` glyph, and **no usage block** while
  running. `council_wait` blocks through retries and returns `state=retrying`
  with the attempt label on a window-elapsed deadline. See
  [[hub-job-supervision]].

## The re-scope

EV-42's original premise ("each attempt currently mints a fresh job id, a fresh
manifest, and a fresh session file") was made false by EV-39's settled
cardinality. [[steward]] ruled it **re-scoped in place** — same id, same slot,
`attemptGroupId` dropped — with the orchestrator executing the card edit
between cards. A `Ready` sibling's *premise* is goal-wording, which is
steward's authority, and the runner was explicitly forbidden from editing it or
absorbing its work. See [[engineering-board]] and [[chain-promotion]].

## Closing the disclosure

The provider-*reported* figure ([[cost-provenance]]) is built from the
provider's generation endpoint, matched to a manifest by `sessionId`. With one
session path per manifest, a retried dispatch's reported figure reflected only
the **final** attempt. EV-39 shipped the interim **disclosure**; EV-42 closes
it by persisting the per-attempt session pointers and walking that list in
`usage-store`, so the reported figure sums every attempt. The disclosure's
predicate is figure-scoped — see [[figure-scoped-disclosure]].

## Related

- [[figure-scoped-disclosure]] — the `partial` predicate this substrate feeds
- [[retry-policy]] — the budget the loop consumes
- [[hub-job-supervision]] — the hub state machine it extends
- [[run-transcripts]] — the manifests + job forest it widens
- [[council-job-tree-inline]] — the `attempt N/M` row label
- [[usage-store]], [[usage-block]], [[cost-provenance]] — the spend surfaces

## Sources

- [[2026-09-16-epic9-run-ledger]]
- `extensions/hub.ts`, `extensions/job-retry.ts`, `extensions/runs.ts`,
  `extensions/usage-store.ts`
