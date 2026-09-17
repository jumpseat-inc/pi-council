---
id: FLLWUP-58
title: Runaway timeout-minutes backstop on the gates CI job
state: Backlog
owner: null
epic: EPIC-9
goal: The gates workflow fails bounded on a runaway test step via a loose timeout-minutes, sized so it never pre-empts an arm's own ceiling, with the CI-timeout policy documented.
---

## Intent

`product-owner`'s FLLWUP-48 ruling 2 deferred a `gates.yml` `timeout-minutes`
as "CI-timeout policy is a separate question (different rationale, revision
path, and interaction with the per-arm `spawnSync` ceilings)" — a deferral,
not a rejection. The deciding arithmetic is recorded on FLLWUP-48 and in the
test-suite-budget page: the TUI arm's own `300_000` ceiling at
`ev41-retry-e2e.test.ts:362` exceeds any ~180s suite budget, so a
budget-keyed step timeout masks attribution. This card owns the runaway
backstop variant, sized loose enough never to pre-empt an arm.

Approved by `product-owner` (job-29) from FLLWUP-48's step-13 draft 1.
