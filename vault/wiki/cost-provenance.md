---
title: Cost Provenance
type: concept
summary: pi computes cost from the static catalogue and never reads a provider charge; OpenRouter reports generation-level dollars plus a BYOK-only two-way split and native token counts — so the honest figure is labelled estimate vs reported, and per-component dollars do not exist.
aliases: [cost provenance, catalogue estimate, reported cost, provider-reported cost]
tags: [pi-council/concept, pi-council/epic7]
sources: ["[[2026-09-11-epic7-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-11
updated: 2026-09-16
---

# Cost Provenance

Why the dollar figure needs a provenance label, and what a provider can
actually report.

## pi computes the estimate itself

`parseChunkUsage` (`pi-ai/dist/api/openai-completions.js`) reads **only token
fields** and sets `cost:{0,0,0,0,0}`; then `calculateCost`
(`pi-ai/dist/models.js`) overwrites it from the **static catalogue** `model.cost`
— `cost.total = input + output + cacheRead + cacheWrite`, with optional tiers
and the Anthropic 1h-write special case. **pi never reads a provider cost
field.** That computation is what `costBasis: "catalogue-estimate"` labels.

## What OpenRouter actually reports

The generation endpoint returns **generation-level dollars** — `total_cost`,
`upstream_inference_cost`, a nullable `cache_discount`, `is_byok` — plus a
**BYOK-only** two-component split `upstream_inference_prompt_cost` /
`upstream_inference_completions_cost`, and native **token** counts
(`native_tokens_prompt/completion/reasoning/cached`). There is **no
four-component dollar split anywhere**, and cache appears as a token count, not
a dollar. This is why EV-29's goal had to be amended: naming
"per-component cost figures reported by the provider" described a unit the
provider does not produce.

## The finding that reframed the intake

The intake hypothesised stale catalogue rates behind a 2–5x inflation. A
spot-check compared pi's **runtime** price table
(`~/.pi/agent/models-store.json`) against OpenRouter's live `/api/v1/models`
for the three models the run used — `meta/muse-spark-1.3` `$1.25/$4.25/$0.15`,
`minimax/minimax-m3` `$0.30/$1.20/$0.06`, `deepseek/deepseek-v4.1-flash`
`$0.15/$0.60/$0.003` — **exact matches**. So the divergence is most likely
**upstream routing**: OpenRouter fronts many providers, and a model's default
listed price need not be the routed provider's charge. This is why R-7 makes
the **routed upstream provider id** a persisted, rendered fact.

## The honesty rules

- **`(reported)`** means "what this provider reported for this generation",
  **never** "what you were billed". For `is_byok: true`, `total_cost` reflects
  credit accounting; `is_byok` is persisted verbatim for an auditor.
- **The four `cost*` slots stay `catalogue-estimate`** — no pro-rated
  per-component `(reported)` dollar is ever synthesised; that is the
  plausible-but-false figure the epic exists to kill.
- **Coexistence, not replacement**: the reported figure renders as its own row
  `usage  reported  cost=$Σ.XXXX (reported) routed=<name>x<n>` after the
  boundary row; it never overwrites a half whose `basis=` says
  `catalogue-estimate`.
- **Unavailability is explicit**: record-only reasons
  `no-generation-id | session-missing | fetch-failed:<error> | timeout |
  no-api-key`; the rendered slot is `n/a` with the conditional legend
  `n/a = provider figure unavailable`. There is no in-band unavailability
  signal on `Usage.cost` (a `number`), which is why the `n/a` acceptance was
  deferred until EV-29 supplied one.

## Figure-scoped disclosure (EPIC-9)

A retried dispatch's provider-*reported* figure reflects only the final attempt
until the per-attempt session list is walked ([[per-attempt-provenance]]). When
an attempt is unaccounted, the qualifier is **figure-scoped** — `partial` is set
iff a figure exists *and* an attempt is unaccounted, so an all-unaccounted
retried record renders the `n/a` legend only (a qualifier on a null figure would
be the standing-legend principle violated in the symmetric direction). See
[[figure-scoped-disclosure]].

## Related

- [[figure-scoped-disclosure]] — when a reported figure is marked incomplete
- [[per-attempt-provenance]] — the substrate that makes it whole
- [[usage-accounting]] — the `costBasis` label this explains
- [[usage-store]] — the `provider` sibling that carries the reported figures
- [[usage-block]] — the coexistence row + `n/a` legend
- [[model-eval-harness]] — the other consumer of cost columns

## Sources

- [[2026-09-11-epic7-run-ledger]]
- `extensions/provider-cost.ts`, `pi-ai/dist/models.js`
