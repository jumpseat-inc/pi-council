---
title: Usages Report
type: concept
summary: `/usages <time_range>` — a package-shipped procedure plus a `/council-init`-copied Python tool that reports one repo's per-seat and main-agent token/dollar usage, cross-matched to OpenRouter generation figures, as JSON + Markdown under .pi/council/usages/; since EPIC-15 the tool creates its output directory before the cache write, and a stale copied tool is refreshed by update→delete→re-init.
aliases: [usages, slash usages, usages report, usages procedure, council usages]
tags: [pi-council/concept, pi-council/usages]
sources: ["[[2026-09-21-usages-design]]", "[[2026-09-22-fix-shape-witness-segment-liveness]]", "[[2026-09-22-epic15-run-ledger]]", "[[2026-09-23-epic15-residual-run-ledger]]"]
created: 2026-09-21
updated: 2026-09-23
---

# Usages Report

`/usages <time_range>` answers a **range-scoped** cost question that
[[usage-accounting]] does not: *what did this repository's pi/council workflow
cost over a period, per seat and per main session, and how does that compare to
what the provider actually charged?* It was designed and built on 2026-09-21
([[2026-09-21-usages-design]]).

## The three artifacts

| Artifact | Responsibility |
|---|---|
| `council/procedures/usages.md` | **Packaged** procedure: the `OPENROUTER_MANAGEMENT_KEY` hard gate, then load the skill and surface its summary. Registers as `/usages` (8th procedure, [[procedure-commands]]). |
| `<repo>/.pi/skills/usages/SKILL.md` | Consumer copy of the package payload — the agent's on-demand instruction set. |
| `<repo>/.pi/skills/usages/scripts/usages.py` | Stdlib-only Python tool: the only network surface; harvests, cross-matches, aggregates, writes outputs. |

The skill is copied by `/council-init`, not scaffolded — see
[[non-clobbering-scaffold]].

## Preflight

`OPENROUTER_MANAGEMENT_KEY` is **mandatory** and is the *provisioning*
(management) key, not the inference key. Missing → stop, run nothing, print the
mint-and-export remedy; `OPENROUTER_API_KEY` is never a fallback. This is the
same key the provider's `/activity` and `/analytics/query` surfaces require
([[openrouter-analytics-surface]]).

## Range grammar and chunking

English or ISO: `today`, `yesterday`, `last N days|weeks|months`, `this
week|month`, `last week|month`, `YYYY-MM-DD`, `A to B`. Ranges longer than 30
days are split into ≤30-day windows (the provider's per-query cap, D4); windows
older than 30 completed UTC days carry exact generation figures but no
activity reconciliation, and say so.

## Pipeline

1. **Harvest** generation ids + local token/cost facts from three sources,
   each row tagged with seat/model/date and a source rank (`seats` > `main` >
   `durable`):
   - **main** — pi session JSONL under `<agentDir>/sessions/*/` whose header
     `cwd` is the repo (or a descendant); assistant messages carry
     `responseId` + `usage`.
   - **seats** — `<repo>/.pi/council/runs/<runId>/*_job-*.jsonl`, joined to
     `job-N.json` for seat/model ([[run-transcripts]]).
   - **durable** — `<agentDir>/council/usage/*.json` `seats[]` + `provider`
     generations for runs pruned past 15 ([[usage-store]]).
2. **Dedupe** generation ids by source rank.
3. **Exact cross-match** — batch `POST /analytics/query` with
   `generation_id in […]` (chunks, one query per ≤30-day window) → `total_usage`
   + prompt/completion/cached tokens; figures cached immutably.
4. **Account reconciliation** — per-day `GET /activity` over the retained
   window; `attributedUsd` (this repo, in-window) vs `unattributedUsd`
   (account remainder).
5. **Aggregate** per seat/model/day + totals, with derived metrics
   (per-1M-input/output cost, medians, cache hit rate, blended $/1M).
6. **Write** `usages-<start>_<end>.{json,md}` into a self-gitignored
   `.pi/council/usages/`; the cache lives beside them.

## The cache write and its output directory (EPIC-15)

The tool writes an immutable per-generation cache beside its reports at
`.pi/council/usages/.cache.json` so reruns are cheap. Until **BUG-2** (EPIC-15,
PR #104, `59fad63`) the order was wrong: `main` called `save_cache()` **before**
`ensure_out_dir()`, and `save_cache` writes a `.tmp-<pid>` file beside its target
with no parent mkdir. On a fresh repo the temp write raised `FileNotFoundError`,
was caught, and logged `usages: could not write cache: …` to **stderr only** —
never into `report["limitations"]` — so the failure was invisible in both the
JSON and Markdown artifacts, while the report still wrote once the directory was
created moments later. The fix moves `ensure_out_dir(out_dir)` above the first
`save_cache`; the tool's invariant is that its output directory exists before
anything is written into it. `T-U7` (default path, second run `cache.hits === 1`)
and `T-U8` (fresh `--out-dir`) pin it; an `EMPTY_DIRS` scaffold pre-seed must not
satisfy them ([[2026-09-22-epic15-run-ledger]]).

## Foreign `--cache-file` parent and the summary line (FLLWUP-109/110)

Two EPIC-15 residual cards completed the cache surface. **FLLWUP-109** (PR #108,
`3d62b3a`): `--cache-file` is decoupled from `--out-dir`, and `save_cache` still
wrote its `.tmp-<pid>` beside a target with no parent mkdir, so a custom
`--cache-file` naming an absent parent raised and logged the same stderr warning.
The fix creates the parent (`p.parent.mkdir(parents=True, exist_ok=True)`); the
ratified design was *create*, never reject a foreign parent — consistent with the
tool's create-on-demand behavior, and rejecting would break the rerun-cheap
promise. **FLLWUP-110** (PR #109, `9da7ff1`): `human_summary()` now prints
`cache: hits=<N> misses=<M>` equal to the JSON report's `cache.hits`/`cache.misses`,
so the "reruns are cheap" promise is visible on the surface the person reads (a
separate card from BUG-2 per the run's R4; the declined `.md` cache-health row is
still declined). Witness: [[2026-09-23-epic15-residual-run-ledger]].

## The stale-copy remediation route (FLLWUP-105/106)

A consumer that ran `/council-init` before BUG-2 still has the buggy **copied**
tool at `<repo>/.pi/skills/usages/scripts/usages.py`, and the fix reaches only
future copies ([[non-clobbering-scaffold]]). The route, shipped in the
procedure's `**Report.**` section, is **update the pi-council package first →
delete `<repo>/$CONFIG_DIR_NAME/skills/usages/` → re-run `/council-init`**; the
package-update-first order is load-bearing, because a recopy from a stale
installed package loops the old tool back. A second paragraph forbids inventing
framing around non-`!` stderr: every non-empty stderr line is quoted verbatim,
no added `⚠️`/`!` prefix, no invented cause or "non-fatal issue" count
(FLLWUP-106). Both are pinned in `test/usages-procedure.test.ts`.

## Basis labels

Every dollar figure is labelled: **`exact`** (provider-reported charge for the
generation), **`catalogue-estimate`** (pi's catalogue rates, not a bill), or
**`mixed`**. Note the vocabulary collision with EPIC-7's `reported` — see
[[cost-provenance]].

## Always-rendered limitations

Run pruning to 15; activity account-wide + 30-day retention; analytics 31-day
cap/chunking; the `job-N` session-id collision (join by `generation_id`); the
current day sits in totals but not in `attributedUsd`.

## Related

- [[openrouter-analytics-surface]] — the provider surfaces + join-key trap
- [[usage-accounting]], [[usage-store]], [[cost-provenance]] — the EPIC-7 chain
- [[run-transcripts]] — the pruned run substrate the durable rows outlive
- [[procedure-commands]], [[non-clobbering-scaffold]] — registration + copy
- [[2026-09-22-fix-shape-witness-segment-liveness]] — this procedure's copy
  destination (`skills/usages/`) drove the shape witness's segment-liveness
  repair

## Sources

- [[2026-09-21-usages-design]]
- [[2026-09-22-epic15-run-ledger]] — the cache-ordering fix and the stale-copy route
- `council/procedures/usages.md`, `council/skills/usages/scripts/usages.py`