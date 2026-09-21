---
title: OpenRouter Analytics Surface
type: concept
summary: OpenRouter exposes three cost surfaces with different scopes and caps — account-wide daily /activity (30 completed UTC days), per-generation /generation (one call each, rate-limited), and the batch /analytics/query (dims incl. generation_id/origin/api_key_id, 31 days/query) — and only generation_id joins local history reliably.
aliases: [openrouter analytics, activity endpoint, analytics query, generation endpoint, management key]
tags: [pi-council/concept, pi-council/usages, pi-council/cost]
sources: ["[[2026-09-21-usages-design]]", "[[2026-09-11-epic7-run-ledger]]"]
created: 2026-09-21
updated: 2026-09-21
---

# OpenRouter Analytics Surface

What the OpenRouter management API can and cannot tell you about spend, learned
by live probing while building [[usages-report]] (2026-09-21). All three
surfaces are authenticated with the **management** (provisioning) key, distinct
from the inference `OPENROUTER_API_KEY` — the `/usages` preflight enforces that.

## The three surfaces

| Surface | Scope | Granularity | Caps / caveats |
|---|---|---|---|
| `GET /api/v1/activity` | **account-wide**, across all machines/apps/keys | daily, per model/endpoint/provider | only the last **30 completed UTC days** (`?date=` outside → HTTP 400); **no cached-token field** |
| `GET /api/v1/generation?id=` | one generation | exact `total_cost`/`usage`, routed provider, native tokens incl. `native_tokens_cached`, `origin`, `session_id` | **one HTTP call per id**, rate-limits under concurrency (56/161 failed at 16-way) |
| `POST /api/v1/analytics/query` | account, filterable | dims `generation_id`, `model`, `session_id`, `origin`, `api_key_id`, `provider`, …; metrics `total_usage`, `tokens_prompt/completion`, `cached_tokens`, `cache_hit_rate`, `blended_cost_per_million_tokens`, latency percentiles | **≤31 days per query**; `generation_id in [...]` batches hundreds per call |

`/analytics/query` is the surface that makes cross-matching cheap: one call with
a `generation_id in [...]` filter resolved 95 harvested ids, including 25 that
the per-generation endpoint had dropped under concurrency.

## The join-key trap

A council seat child runs with `--session-id job-N`, so OpenRouter records its
`session_id` as literally `job-1`, `job-2`, … — **colliding across every run**.
Grouping activity by `session_id` therefore pools unrelated runs (a `job-1`
bucket held 464 requests). **`generation_id` is the only reliable join key**: pi
assistant messages carry the OpenRouter generation id as `responseId`, and the
durable usage record's `provider.generations[].generationId` carries it too.
Non-OpenRouter providers (e.g. llama.cpp's `chatcmpl-…`) must be excluded from
candidate harvesting.

## Activity is a ceiling, not an attribution

`/activity` is account-wide, so it can never be attributed to one repo by
itself. In the 2026-09-21 dogfood: 30-day account activity **$211.85** vs
**$1.26** attributed to the pi-council repo; a `origin=https://pi.dev/`
analytics query was **$231.76** (still all machines/apps). Exact attribution
must come from locally harvested generation ids; activity supplies the
reconciliation remainder (`unattributedUsd`).

## Refinement to [[cost-provenance]]

[[cost-provenance]] states "there is no four-component dollar split anywhere."
That remains true of the **generation** endpoint, but `/analytics/query`
exposes *component-ish* currency metrics — `usage_cache`, `usage_upstream`,
`usage_web`, `usage_file`, `byok_fees`, `byok_usage` — alongside
`total_usage`. This does not restore pi's four `cost*` slots (which stay
catalogue-estimate); it is a broader provider surface than EPIC-7 probed, and
worth knowing before declaring per-component dollars impossible.

## Related

- [[usages-report]] — the consumer of these surfaces
- [[cost-provenance]] — the `reported` provenance rule and the refinement above
- [[usage-store]] — the durable `provider.generations[]` pointer source
- [[run-transcripts]] — where local generation ids are harvested

## Sources

- [[2026-09-21-usages-design]]
- `council/skills/usages/scripts/usages.py`