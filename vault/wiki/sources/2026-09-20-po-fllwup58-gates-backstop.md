---
title: PO ruling — FLLWUP-58 gates CI runaway backstop
type: source
summary: product-owner rules the CI-timeout policy — the strict/any-arm reading of "never pre-empts an arm's own ceiling", one timeout-minutes 60 on the bun-test step (never job-level), against a default-suite serial census floor of 43.1 min.
aliases: [po-fllwup58-gates-backstop, fllwup58 backstop ruling, CI timeout policy]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-20-po-fllwup58-gates-backstop]]"]
created: 2026-09-20
updated: 2026-09-20
---

# PO ruling — FLLWUP-58 gates CI runaway backstop

Source: `vault/raw/2026-09-20-po-fllwup58-gates-backstop.md`. Discharges the
CI-policy question FLLWUP-48 ruling item 2 deferred.

## OJ-2 — the reading is strict/any-arm (no goal-text narrowing)

"An arm" means **every arm-bearing test in the run**, including several
tripping *serially*. The suite is serial, so a runner-level wedge is a
cumulative-trip schedule; the value protected is **attribution** — a tripped
ceiling names a test, a truncation names nothing and silently un-runs everything
after the cut. Operative floor = the default-suite census; the two gated sites
(`360_000`, `60_000`) are reported **separately**, and opting any gated site
into the default CI run **re-derives the floor**. Harness-internal `spawnSync`
bounds are not summed.

## OJ-1 — placement: the `bun test` step

A job-level number is `census floor + preamble`, and the `fetch-depth: 0`
checkout is pinned verbatim and only grows — so a tripwire asserting
`job ≥ derived_sum` would certify a floor the test step no longer receives.
The step-level number means permanently what it says, and the goal's own wording
("fails bounded on a runaway **test step**") agrees.

## OJ-3 — the number: `timeout-minutes: 60`

| floor | value 45 | value 60 |
|---|---|---|
| default-suite census 43.1 min | 1.04× | **1.42×** |
| gated-inclusive 50.1 min | below | 1.20× |

45 is rejected: it clears its floor by 115s, less than fast-file variance, and a
value thin above its own floor makes the tripwire red-prone and therefore
deletable.

> ⚠️ **Superseded in part** ([[2026-09-20-po-fllwup58-step13-confirmation]]):
> the census was later re-derived — 19 compact-form ceiling sites make the true
> default-suite floor **52 min**, not 43.1, so the honest ratio for `60` is
> **1.15×**, not the 1.42× tabulated above. This page records the ruling as
> issued.

## Consequents

`install`/`tsc` wedge coverage is a **temporary** residual (a per-step bound on
those deterministic steps), drafted at step 13, not folded in. Live annotation
capture is not adopted.

## Takeaways

- A **truncation is silent evidence loss**; that is why the strict reading wins
  over the cheaper single-arm floor.
- Never place a CI backstop at the job level when a pinned, growing preamble
  sits between the floor and the number.

## Related

- [[test-suite-budget]] — the policy page this ruling amends
- [[retired-path-tokens]] — the derive-never-restate precedent
- [[2026-09-18-epic9-residual-run-2-ledger]], [[2026-09-20-po-fllwup58-step13-confirmation]]

## Sources

- [[2026-09-20-po-fllwup58-gates-backstop]]