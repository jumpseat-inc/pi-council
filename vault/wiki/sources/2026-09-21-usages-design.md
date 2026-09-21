---
title: Usages Procedure Design
type: source
summary: The sanctioned design for `/usages <time_range>` — a packaged procedure plus a `/council-init`-copied skill/tool that reports repo-scoped per-seat token/dollar usage cross-matched to OpenRouter, with exact/estimate basis labels and a durable per-seat store sibling.
aliases: [usages design, usages procedure, 2026-09-21-usages-design, slash usages]
tags: [pi-council/source, pi-council/usages]
sources: ["[[2026-09-21-usages-design]]"]
created: 2026-09-21
updated: 2026-09-21
provenance: design-spec
source_path: vault/raw/2026-09-21-usages-design.md
captured: 2026-09-21
---

# Usages Procedure Design (2026-09-21)

The design spec for `/usages`, a repo-scoped cost-reporting capability, plus
what building and dogfooding it taught. The raw source is the design spec
filed at `vault/raw/2026-09-21-usages-design.md`; the implementation plan and
the run learnings are summarized here.

## What it is

`/usages <time_range>` (e.g. `/usages last 30 days`) reports what **one
repository's** pi/council workflow cost over a time range — token volumes and
dollar values per council seat and per main-agent session, cross-matched
against OpenRouter's billed activity with `OPENROUTER_MANAGEMENT_KEY`. It is a
different question from EPIC-7's [[usage-accounting]] ("what did this
invocation cost?"); see [[usages-report]] for the capability and
[[openrouter-analytics-surface]] for the provider facts.

Deliverables:

- **Primary** — a JSON record at `<repo>/$CONFIG_DIR_NAME/council/usages/`
  (self-gitignored), the machine-readable source of truth.
- **Secondary** — a Markdown rendering with the same stem.
- **Tertiary** — a summary in the pi session.

## Decisions (human, binding)

- **D1 — skill placement:** the procedure is **packaged**; the skill + tool
  live in the package payload at `council/skills/usages/` and `/council-init`
  copies them (non-clobbering) to `<repo>/$CONFIG_DIR_NAME/skills/usages/`,
  built from `CONFIG_DIR_NAME` and `@CONFIG_DIR@`-rendered — **outside**
  `council/scaffold/`, so no classification churn. See
  [[non-clobbering-scaffold]].
- **D2 — seat durability:** `extensions/usage-store.ts` gained an optional
  per-seat `seats[]` sibling so seat history survives `pruneRuns`. See
  [[usage-store]].
- **D3 — scope:** current repo only (pi sessions whose `cwd` is the repo or a
  descendant; this repo's runs; this repo's durable records).
- **D4 — long ranges:** split into ≤30-day windows; windows older than 30
  completed UTC days carry exact generation figures but no activity
  reconciliation, and say so.

## Constraints the live probe established

1. **`generation_id` is the only reliable join key.** Council children run
   `--session-id job-N`, so OpenRouter's `session_id` is `job-1` and collides
   across runs (grouping by it pooled 464 requests). See
   [[openrouter-analytics-surface]].
2. **`/api/v1/activity` is account-wide and retained 30 completed UTC days**
   (`?date=` outside the window → HTTP 400).
3. **`POST /api/v1/analytics/query` is the batch surface** (dims incl.
   `generation_id`/`origin`/`api_key_id`; `generation_id in […]` resolved 95
   ids in one call), capped at 31 days/query.
4. **Run dirs prune to 15**; the durable store had no per-seat breakdown.
5. **`OPENROUTER_MANAGEMENT_KEY` works for all three endpoints** and is
   mandatory — never a fallback to `OPENROUTER_API_KEY`.

## What shipped

- `council/procedures/usages.md` — the packaged `/usages` procedure with the
  env hard gate (the 8th procedure; see [[procedure-commands]]).
- `council/skills/usages/{SKILL.md,scripts/usages.py}` — stdlib-only tool.
- `extensions/scaffold.ts` `copyUsagesSkill`; `extensions/usage-store.ts`
  `seats[]`; README row; registration counts 16→17; tests.

## Run learnings (the dogfood)

- **Terminology tension:** `/usages` labels provider dollars `exact`; EPIC-7
  calls them `reported`. Canonical wiki term is **`reported`** (the shipped
  engine word); cheap to flag, not silently reconciled. See
  [[cost-provenance]].
- **End-day window bug:** the analytics `time_range` end must be
  `T23:59:59Z`, not `T00:00:00Z`, or the range's final day is silently
  excluded (185 generations unresolved in the first dogfood).
- **Cache persistence:** exact figures must be written to the cache even when
  the store starts empty, or reruns re-fetch.
- **Non-`gen-` ids:** other providers (llama.cpp `chatcmpl-…`) must not be
  harvested as cross-match candidates.
- **Test-isolation hazard:** adding a test file shifted bun's worker packing
  and surfaced a pre-existing module-state leak between `ev40-wiring` and
  `ev40-parent-retry` (the single-slot retry editor). Fixed with a test-only
  `beforeEach` reset; see [[test-suite-budget]].

## Related

- [[usages-report]] — the capability
- [[openrouter-analytics-surface]] — the provider surfaces
- [[usage-accounting]], [[usage-store]], [[cost-provenance]] — the EPIC-7 chain
- [[procedure-commands]], [[non-clobbering-scaffold]] — registration + copy

## Sources

- `vault/raw/2026-09-21-usages-design.md`
- `docs/superpowers/plans/2026-09-21-usages.md`
- `council/procedures/usages.md`, `council/skills/usages/**`,
  `extensions/usage-store.ts`, `extensions/scaffold.ts`