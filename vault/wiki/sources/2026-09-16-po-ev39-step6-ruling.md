---
title: PO ruling — EV-39 step-6 (denominator carrier, tick interval, two steward escalations)
type: source
summary: product-owner settles EV-39's step-6 items — inject the init-time RetryPolicy snapshot into the renderers (not persist maxAttempts), ratify the 2 s countdown tick, and escalate two portfolio calls to steward (who corrects EV-42's premise; disclose-final-attempt-only vs persist the attempt session list), forbidding the silent partial.
aliases: [po-ev39-step6, ev39 step6 ruling]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-16-po-ev39-step6-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# EV-39 — product-owner step-6 ruling

Source: `vault/raw/2026-09-16-po-ev39-step6-ruling.md`.

## Q1 — Denominator carrier: **inject the init-time `RetryPolicy` snapshot**

The resolved policy (one `loadRetryConfig(repoRoot)` per process, `index.ts:588`)
is passed as an init-time parameter into `CouncilTreeWidget` and
`textTree(repoRoot, runIds, policy)`; renderers read `policy.maxAttempts`.
Persisting `maxAttempts?` on the manifest is rejected: it encodes session-level
state as per-dispatch, widens the substrate footprint [[per-attempt-provenance]]
owns, and is harder to reverse. Render-time `loadRetryConfig` is rejected by
Skeptic O-8 `closed-green` (exactly one call site exists).

## Q2 — Escalated to `steward`: who corrects EV-42's premise

EV-42's stated premise ("each attempt currently mints a fresh job id, a fresh
manifest, a fresh session file") is false post-EV-39 (one job id / one manifest
/ one row per dispatch, attempts distinguished by the `attempt?` field). Owner
and principal agree on the cardinality but disagree on who holds the pen; the
card text is immutable past `In Progress`, so this is a portfolio call. The
package names options (a) edit EV-42's Intent, (b) a separate harness-amendment
document, (c) re-route EV-42 — and asks `steward` to rule.

## Q3 — Tick interval: **2 s** (default ratified)

The widget already refreshes every 2 s; EV-40's input-bar countdown ticks at
1 s because it is a different surface. Cross-surface consistency is carried by
the verb `retrying` and the `attempt N/M` label, not identical ticks.

## Q4 — Escalated to `steward`: disclose vs fix the final-attempt-only reported figure

Under one-manifest-per-dispatch, `usage-store.ts:426` reads one session path, so
EV-29's provider-reported figure is **final-attempt-only**. Both paths are
portfolio-level: (1) persist `attemptSessionPaths?: string[]` and walk them, or
(2) mark the row final-attempt-only in the copy (a permanent residual). The
minimum constraint: **the silent partial is forbidden** — the Acceptance must
carry one of the two before merge.

## Residuals riding into the step-7 spec

G1 byte-identity, G2 `retrying`-half of `tick()`, G3 `retrying`-state units +
gate-closed/written-once, G4 the live OpenRouter fetch half, G5 the EV-42
premise correction (closes only when `steward` rules). No `goal` change.

## Related

- [[retry-policy]] — the `RetryPolicy` snapshot injected into the renderers
- [[hub-job-supervision]] — the battle-tested render surfaces (additive-only)
- [[run-transcripts]], [[per-attempt-provenance]] — the manifest substrate and attempt identity
- [[usage-store]], [[usage-accounting]] — the final-attempt-only reported figure
- [[2026-09-16-epic9-run-ledger]] — the run this ruling belongs to

## Sources

- [[2026-09-16-po-ev39-step6-ruling]]