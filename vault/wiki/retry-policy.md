---
title: Retry Policy
type: concept
summary: The top-level `retry` sibling in the committed .council.json — enabled/maxAttempts/baseDelayMs/maxDelayMs/jitter, fail-loud validation naming file and key, a falsy enabled off switch, concrete defaults seeded in the scaffold, and no writer change because the byte-splice preserves unknown top-level keys.
aliases: [retry section, loadRetryConfig, retry defaults, retry.enabled]
tags: [pi-council/concept, pi-council/epic9]
sources: ["[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-16
updated: 2026-09-16
---

# Retry Policy

`.council.json` gains a **third top-level sibling** (EV-38): after `council`
(the per-seat overrides) and `theme` (the palette), a `retry` section carries
the policy both retry loops consume. See [[council-config]].

## Shape and shipped defaults (R2)

```json
{
  "retry": {
    "enabled": true,
    "maxAttempts": 3,
    "baseDelayMs": 2000,
    "maxDelayMs": 30000,
    "jitter": true
  }
}
```

The defaults deliberately **mirror pi's own retry settings**
(`retry.maxRetries` 3, `retry.baseDelayMs` 2000), so council's policy is
predictable to anyone who knows pi's. The concrete block is seeded into
`council/scaffold/.council.json`, because JSON has no comments — a repo with no
`retry` section would otherwise have the defaults visible only in code. The
scaffold is the visibility surface ([[non-clobbering-scaffold]]).

## Validation (R3)

A falsy `enabled` is the **off switch**. A malformed value throws naming the
file and the offending key — the `loadThemeConfig` precedent
([[council-config]]). The invalid-value set:

- `maxAttempts` — integer ≥ 1
- `baseDelayMs` — integer ≥ 100
- `maxDelayMs` — integer ≥ `baseDelayMs`
- `enabled` / `jitter` — booleans
- unknown keys inside `retry` throw (theme parity)
- a non-object `retry` value throws

`loadRetryConfig(repoRoot)` always returns a **full** policy: an absent section,
a `retry: {}`, and an absent file all return the R2 defaults; a partial section
merges over that defaults base. It is called **once per process at init**; a
malformed section disables retry with a loud warning rather than throwing
mid-dispatch.

## Delay formula

`baseDelayMs * 2^(attempt-1)`, capped at `maxDelayMs`, jittered when `jitter` is
true. pi's own agent-turn loop applies the same exponential shape but with **no
cap and no jitter** (its `maxDelayMs` key is routed to the provider-level loop
instead) — a correction the Skeptic established at EV-40, so the council loop
does not simply inherit pi's behavior. See [[headless-pi]].

## The write path needed no change

[[council config writer]] is a byte-region splice that preserves unknown
top-level keys *by construction*, so adding a `retry` sibling required no writer
change — only a test pinning that a `council.<seat>` write leaves the `retry`
bytes untouched. `loadCouncilConfig` reads only `parsed.council`, so the new
sibling is invisible to seat resolution.

## The denominator-carrier ruling

R4 requires the job-tree row to read `attempt 2/3`, so `maxAttempts` must be
readable at the render sites (`tree.ts`, `navigator.ts`). [[product-owner]]
ruled the carrier: **inject the init-time resolved `RetryPolicy` snapshot** into
the renderers, rather than persisting `maxAttempts` on the manifest — injecting
is cheaper to reverse, does not widen the substrate EV-42 owns, and keeps the
one-load-per-process rule. See [[per-attempt-provenance]] and
[[council-job-tree-inline]].

## Related

- [[council-config]] — the file this section lives in
- [[retry-classification]] — the decision the policy gates
- [[parent-turn-continuation]], [[per-attempt-provenance]] — the two consumers
- [[council config writer]], [[gate parity]], [[override-resolution]]

## Sources

- [[2026-09-16-epic9-run-ledger]]
- `extensions/seats.ts` (`loadRetryConfig`), `council/scaffold/.council.json`
- `extensions/job-retry.ts`, `extensions/parent-retry.ts`
