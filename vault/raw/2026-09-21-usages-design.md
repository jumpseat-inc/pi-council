# `/usages` design — repo-scoped agent-cost reporting

Status: settled design (brainstorming complete; decisions D1–D4 taken by the
human). This spec writes up what was validated hands-on against the live
OpenRouter API and the machine's pi/council history; the cross-match probe is
reproduced in §Appendix A. It derives nothing that the probe did not show.

## Goal

`/usages <time_range>` (e.g. `/usages last 30 days`) produces a report of what
the pi/council workflow in **this repository** actually cost: per seat and
per main-agent session, token volumes and dollar values, cross-matched against
OpenRouter's billed activity using `OPENROUTER_MANAGEMENT_KEY`. Outputs:

1. **Primary** — a JSON record under `<repo>/$CONFIG_DIR_NAME/council/usages/`
   (gitignored), the machine-readable source of truth.
2. **Secondary** — a Markdown rendering of the same data under the same
   directory, with the same stem so the pair lists together.
3. **Tertiary** — a compact summary surfaced in the pi session.

Every dollar figure carries its basis (`exact` provider-reported /
`catalogue-estimate` / `interpolated`); approximated figures are allowed only
when named as such in the report body and in `limitations[]`.

## Decisions (human, binding)

- **D1 — Skill placement: scaffolded by `/council-init`.** The procedure ships
  packaged (`council/procedures/usages.md`, auto-registered by the existing
  procedure scan). The skill and its tool live in the package payload at
  `council/skills/usages/` and `/council-init` copies them (non-clobbering)
  into `<repo>/$CONFIG_DIR_NAME/skills/usages/` so consumers can read, edit,
  and override them. They are **not** part of the `council/scaffold/` tree and
  carry no `scaffold.json` provenance: they are engine-synthesized consumer
  files, exactly like the `.pi/council/mcp.json` default. This honors hard
  convention #3 (no hardcoded `.pi` in filesystem paths — the destination is
  built from `CONFIG_DIR_NAME` at runtime) and leaves `TOOLING_FILES` /
  `DATA_FILES` untouched.
- **D2 — Seat durability: extend the durable store.** `extensions/usage-store.ts`
  gains an optional per-seat sibling (`seats[]`) so seat history survives
  `pruneRuns`. Red-first tests in `test/usage-store.test.ts`.
- **D3 — Scope: current repo only.** pi sessions whose `cwd` is this repo (or a
  descendant), plus this repo's `.pi/council/runs/`, plus this repo's durable
  usage records. No cross-repo scan.
- **D4 — Long ranges: chunk.** Ranges longer than 30 days are split into
  ≤30-day windows. Windows older than 30 completed UTC days carry exact
  generation figures but **no** account-activity reconciliation, and say so.

## Hard constraints discovered (the probe's findings)

These are facts the design must respect, each verified in Appendix A:

- **C1 — `generation_id` is the only reliable join key.** Council seat children
  run with `--session-id job-N`; their OpenRouter `session_id` is literally
  `job-1`, `job-2`, … and therefore collides across runs. Grouping activity by
  `session_id` pools unrelated runs. Generation ids are unique.
- **C2 — `/api/v1/activity` covers only the last 30 completed UTC days**
  (`GET /activity` → 30 days; `?date=` outside the window → HTTP 400
  `"Date must be within the last 30 (completed) UTC days"`). It is
  **account-wide**, not repo-scoped: 2026-09-18 account activity was `$8.86`
  while this repo's attributable spend that day was `< $0.5`; over 30 days
  `origin=https://pi.dev/` alone was `$128.10` across all machines/apps.
- **C3 — `POST /api/v1/analytics/query` is the batch cross-match surface.**
  Dimensions include `generation_id`, `model`, `session_id`, `origin`,
  `api_key_id`; metrics include `total_usage`, `tokens_prompt`,
  `tokens_completion`, `cached_tokens`, `cache_hit_rate`,
  `blended_cost_per_million_tokens`, and latency percentiles. Filter
  `{field:"generation_id", operator:"in", value:[…]}` resolved 95 harvested
  ids in a single call — including 25 the per-generation endpoint had
  dropped under concurrency. **Query time range is capped at 31 days**
  (`"time_range exceeds maximum of 31 days …"`); longer ranges must chunk.
- **C4 — run directories are pruned to the last 15 runs** at parent
  `session_start`; the durable usage store has no per-seat breakdown today.
  Seat detail is therefore short-lived until D2 lands.
- **C5 — `OPENROUTER_MANAGEMENT_KEY` works for all three endpoints**
  (`/activity`, `/analytics/query`, and `/generation`). It is mandatory; the
  skill must never fall back to `OPENROUTER_API_KEY`.

## Components

### 1. `council/procedures/usages.md` (packaged procedure)

Frontmatter:

```
description: Report per-seat and main-agent token/dollar usage for a time range, cross-matched against OpenRouter billed activity.
argument-hint: [time_range]
```

Body (agent instructions, not code) in order:

1. **Env preflight (hard gate).** Check `OPENROUTER_MANAGEMENT_KEY`. If unset or
   empty, STOP without running anything and print the remediation: mint a
   *provisioning* key at OpenRouter → Settings → Keys → "Provisioning key",
   then `export OPENROUTER_MANAGEMENT_KEY=sk-or-…` (or set it in the shell /
   secret store that launches pi). Never suggest or use `OPENROUTER_API_KEY`.
2. **Load the skill** at `.pi/skills/usages/SKILL.md` (the copied
   consumer copy — procedure prose follows the existing repo convention of
   naming the config dir literally). If it is absent, tell the user to run
   `/council-init` to copy it.
3. **Run the tool** exactly as the skill documents (default range `last 30 days`
   when `$ARGUMENTS` is empty).
4. **Surface the summary** the tool prints; never paraphrase dollar figures —
   paste them. Point at the JSON and MD paths.

The procedure does no analysis itself; all logic lives in the skill and tool.

### 2. `council/skills/usages/SKILL.md` (package payload, copied by `/council-init`)

Frontmatter `name: usages`, a description naming the `/usages` trigger. Body
documents: preflight, range grammar, the exact command line, the output paths,
the basis legend, and the known limitations from §Limitations. The skill is the
agent's on-demand instruction set; it is deliberately short and points at the
tool for mechanics.

### 3. `council/skills/usages/scripts/usages.py` (package payload, copied by `/council-init`)

Python 3, standard library only (precedent: `council/validate.py`; invocation
precedent: `spawnSync("python3", …)`). It performs the entire pipeline and
writes both outputs.

**CLI**

```
usages.py [--range "<english|ISO>"] [--start YYYY-MM-DD] [--end YYYY-MM-DD]
          [--repo PATH] [--config-dir NAME] [--agent-dir PATH]
          [--out-dir PATH] [--cache-file PATH] [--api-base URL]
          [--offline] [--json]
```

- `--range` accepted forms: `today`, `yesterday`, `last N day(s)|week(s)|month(s)`,
  `this week`, `this month`, `last week`, `last month`,
  `YYYY-MM-DD`, `YYYY-MM-DD..YYYY-MM-DD`, `YYYY-MM-DD to YYYY-MM-DD`.
  Explicit `--start/--end` win. Default = `last 30 days`.
- `--offline` forbids network calls and uses only the cache; used by tests and
  as a safe retry mode.
- `--api-base` overrides `https://openrouter.ai/api/v1` (test seam).
- `--json` prints the full report JSON to stdout instead of the human summary.

**Resolution of paths**

- repo root: `--repo` or cwd.
- config dir: `--config-dir`, else the copy-time `CONFIG_DIR` constant baked
  in by `/council-init` (see §5), else `.pi`.
- agent dir: `--agent-dir` or `PI_CODING_AGENT_DIR` or `~/.pi/agent`.
- out dir: `<repo>/<configDir>/council/usages/`.

**Pipeline** (each step pure where possible, so tests can drive it offline):

1. **Harvest** generation ids + local token/cost facts from three sources,
   each row tagged `{source, seat, model, sessionId, runId, timestamp,
   responseId, tokens, catalogueCost}`:
   - `main`: every `*.jsonl` under `<agentDir>/sessions/*/` whose session
     header `cwd` is the repo root or a descendant; assistant messages with a
     `responseId`. Seat label `main`.
   - `seats`: every `<runDir>/*_job-*.jsonl` whose run started in range; join
     `job-N.json` for `seat`/`model`/`usage`. Seat label = manifest `seat`.
   - `durable`: `<agentDir>/council/usage/*.json` with `writtenAt`/key time in
     range and `repoRoot` == repo; contribute `seats[]` rows (catalogue
     tokens/cost) and `provider.generations[]` ids for pruned runs. Rows are
     marked `basis: catalogue-estimate` unless joined to an exact generation.
2. **Dedupe** generation ids; a generation belongs to the first source in the
   order `seats` > `main` > `durable` (a run transcript is authoritative over a
   durable pointer).
3. **Exact cross-match.** For each ≤30-day window, `POST /analytics/query`
   with `dimensions:["generation_id"]`, metrics `request_count,total_usage,
   tokens_prompt,tokens_completion,cached_tokens,cache_hit_rate`, and a
   chunked `generation_id in […]` filter (chunk size configurable, default
   500; a chunk that fails is retried once, then recorded as a miss). Join on
   `generation_id`. Persist each generation's figures to the cache.
4. **Account reconciliation.** For each UTC day in the intersection of the
   range with the last 30 completed UTC days, `GET /activity?date=…`; sum
   `usage` and index by model/day. Compute `attributedUsd` (Σ exact
   generation costs), `unattributedUsd = activityTotal − attributedUsd`, and
   `piOriginUsd` from one `origin=https://pi.dev/` analytics query per window.
   Days outside the activity window are listed with `available:false`.
5. **Aggregate** per seat, per model, per day, plus main-agent and totals.
6. **Derive** metrics: `costPerMillionInputUsd`, `costPerMillionOutputUsd`,
   their medians across turns, `cacheHitRate = cached / (cached + prompt)`,
   `blendedCostPerMillionTokensUsd = total_usage / total_tokens × 1e6`.
   Medians are over per-generation values; averages are stated as averages.
7. **Write** `<outDir>/usages-<start>_<end>.json` and `.md` (range-first
   names so `ls` sorts chronologically), ensure the directory exists, and
   ensure a self-ignoring `.gitignore` (`*`) is present (mirrors
   `runs/.gitignore`). The cache lives at `<outDir>/.cache.json` (also
   gitignored by `*`).
8. **Print** the human summary (totals, per-seat table, basis legend,
   limitations) unless `--json`.

**Failure policy.** Missing `OPENROUTER_MANAGEMENT_KEY` → exit 2 with the
remediation text, no files written. Network failure for the analytics step →
exit 3 after writing the report with `basis: catalogue-estimate` fallbacks and
the failure in `limitations[]` (a partial report beats no report, and it is
labelled). No sessions/runs in range → a valid empty report, exit 0.

### 4. `extensions/usage-store.ts` — durable per-seat sibling (D2)

Add an optional sibling to `StoredUsageRecord`, parallel to `provider`/`gate`
(never nested inside `spend`, which stays byte-verbatim):

```ts
export interface StoredSeatRow {
  jobId: string;
  seat: string;
  model: string;
  usage: Usage;           // manifest usage, catalogue-estimate
  attempts?: { attempt: number; sessionId: string }[]; // copied when present
}
```

- `PersistUsageInput` gains `seats?: StoredSeatRow[]`; `persistInvocationUsage`
  copies it only when defined (absent ⇒ byte-identical to the pre-change
  record, `schemaVersion` stays `2` — the additive-sibling precedent set by
  `provider` and `gate`).
- The flush populates it from the already-read invocation-window `manifests`
  (`m.startedAt >= p.markerAt`), mapping `{id, seat, model, usage, attempts?}`.
  No new file reads, no new network.
- Exact per-seat dollars for these records are recoverable by joining
  `seats[].jobId` to the existing `provider.generations[].jobId` when the
  provider block is present; otherwise the catalogue fallback is used and
  labelled.

### 5. `/council-init` skill copy (engine, `extensions/index.ts`)

Add a non-clobbering copy step to the existing `/council-init` handler,
adjacent to the `DEFAULT_MCP_CONFIG` synthesis: walk the packaged
`<PKG_ROOT>/council/skills/usages/` tree and copy each file into
`<repo>/<CONFIG_DIR_NAME>/skills/usages/<rel>` when the destination does not
exist. Text files pass through `renderScaffoldText` so the tool's
`CONFIG_DIR = "@CONFIG_DIR@"` constant resolves to the real config-dir name at
copy time (the same renderer `preflight.sh` already uses — no new mechanism,
and `scaffoldInto`'s behavior is unchanged). Reported in the command's
`+ created` / `= skipped` output.

The two skill paths are deliberately **outside** `council/scaffold/`, so
`scaffoldInto`, `TOOLING_FILES`, `DATA_FILES`, the T4 set-equality guard, and
the `scaffold.json` provenance record are all untouched. Consequence to
accept: `/council-update` does not know about the skill; a consumer refreshes
it by deleting `.pi/skills/usages/` and re-running `/council-init`.

## Output record (JSON, `schemaVersion: 1`)

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-21T…Z",
  "tool": { "name": "usages", "version": "<package version>" },
  "range": { "input": "last 30 days", "start": "2026-08-22", "end": "2026-09-21", "windows": [/* ≤30d */] },
  "repo": { "root": "/abs/path", "configDir": ".pi" },
  "sources": {
    "sessions": { "files": 5, "generations": 1234 },
    "runs":     { "runs": 3,  "generations": 237 },
    "durable":  { "records": 34, "generations": 0 }
  },
  "limitations": [ "…" ],
  "totals": {
    "requests": 0, "turns": 0,
    "tokens": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0, "reasoning": 0, "total": 0 },
    "exactCostUsd": 0.0, "catalogueCostUsd": 0.0,
    "cacheHitRate": 0.0, "blendedCostPerMillionTokensUsd": 0.0
  },
  "main":  { /* same row shape as a seat, seat: "main" */ },
  "seats": [ { "seat": "principal", "models": ["…"], "requests": 0, "turns": 0,
               "tokens": { /* … */ },
               "exactCostUsd": 0.0, "catalogueCostUsd": 0.0,
               "basis": "exact|catalogue-estimate|mixed",
               "derived": { "costPerMillionInputUsd": 0.0, "costPerMillionOutputUsd": 0.0,
                            "medianCostPerMillionInputUsd": 0.0, "medianCostPerMillionOutputUsd": 0.0,
                            "cacheHitRate": 0.0, "blendedCostPerMillionTokensUsd": 0.0 } } ],
  "models": [ { "model": "…", "requests": 0, "tokens": { /* … */ }, "exactCostUsd": 0.0, "catalogueCostUsd": 0.0 } ],
  "days":   [ { "date": "2026-09-18", "requests": 0, "exactCostUsd": 0.0, "tokens": { /* … */ } } ],
  "account": {
    "activity": { "available": true, "start": "2026-08-22", "end": "2026-09-20",
                  "totalUsd": 0.0, "byModel": [ /* … */ ], "byDay": [ /* … */ ] },
    "piOriginUsd": 0.0,
    "attributedUsd": 0.0, "unattributedUsd": 0.0
  },
  "cache": { "file": ".cache.json", "hits": 0, "misses": 0 }
}
```

The Markdown file renders `totals`, `main`, the `seats` table, `models`,
`days`, `account`, a **basis legend** (`exact = provider-reported charge`,
`catalogue-estimate = pi catalogue rates, not a bill`, `interpolated = derived
or split, named in limitations`), and the `limitations` list verbatim.

## Limitations (always present, always rendered)

1. Run directories are pruned to the last 15 runs; seat detail before the
   retained window comes from durable records (catalogue basis) or is absent.
2. OpenRouter activity is account-wide and retained 30 completed UTC days;
   windows older than that have no reconciliation and are marked
   `available:false`.
3. Analytics queries are capped at 31 days and are chunked; a failed chunk's
   generations are reported as `misses` and fall back to catalogue cost.
4. Council child `session_id` is `job-N` and collides across runs; the join is
   by `generation_id` only.
5. `cached_tokens` / `cache_hit_rate` come from OpenRouter's analytics; the
   activity endpoint does not carry cached tokens.
6. BYOK and non-pi traffic on the same account is excluded from attributed
   totals by construction (generation ids are harvested locally), and shows up
   in `unattributedUsd`.

## Tests (red-first, `bun:test`, mkdtemp repos, no live network)

- `test/usage-store.test.ts` additions:
  - a flush with two settled manifests writes a `seats[]` row per seat with
    the manifest usage; absent `seats` input keeps the record byte-identical
    to today (regression pin); `schemaVersion` stays 2.
  - a pre-existing record is never rewritten (choose-once unchanged).
- `test/usages.test.ts`:
  - runs `usages.py` with `--offline` against a temp repo fixture: fixture
    session JSONL + a fake `runs/<id>/{run.json,job-N.json,*_job-N.jsonl}` and
    a pre-seeded `.cache.json`; asserts the JSON shape, per-seat aggregation,
    basis labels, range parsing, and the MD stem pairing.
  - `--offline` with an empty cache and no network asserts the catalogue
    fallback + `limitations[]` entry.
  - missing `OPENROUTER_MANAGEMENT_KEY` asserts exit 2, no files written, and
    the remediation text.
  - an HTTP layer test using a `--api-base` pointed at a local `Bun.serve`
    stub returning the analytics/activity shapes asserted from a recorded
    fixture (no external network).
- `test/scaffold.test.ts` / `test/council-update.test.ts`:
  - T4 and T4b stay green with no classification change;
  - a new `/council-init` copy test (mkdtemp root) asserts the skill lands at
    `<CONFIG_DIR_NAME>/skills/usages/…` with `@CONFIG_DIR@` resolved and that a
    second init is a no-op; `preflight.sh` bytes unchanged.

The full suite must stay green.

## Out of scope (fenced)

- Cross-repo / machine-wide reporting (D3).
- Any change to seat frontmatter or a new autoload-skill mechanism (AGENTS #2).
- Network probes outside `usages.py` (the engine's two sanctioned network
  surfaces are unchanged).
- Reclassifying `TOOLING_FILES`; a future card may promote the skill to
  tooling-class refresh if consumer feedback warrants it.
- Live integration tests; the tool is exercised offline/doubles only.

## Appendix A — the manual cross-match probe (evidence)

Reproduced on 2026-09-21 against the live API and this machine.

1. **Harvest.** Retained run `2026-09-18T22-41-41-853Z-3760756-hys5zi` yielded
   95 distinct generation ids across 4 seat transcripts (`designer`,
   `principal`, `product-owner`, `skeptic`); seat mapping from `job-N.json`.
2. **Per-generation lookup.** `GET /generation?id=` (management key) returned
   exact `total_cost`/`usage`; Σ = `$0.166295`. Under 16-way concurrency 56/161
   lookups failed (rate limit); sequentially all 30 probed succeeded — the
   per-generation path does not batch.
3. **Batch analytics.** `POST /analytics/query` with
   `generation_id in [95 ids]` returned 95 rows, Σ `total_usage` = `$0.279702`,
   recovering generations the per-generation path dropped. Analytics rounds
   `total_usage` to 6 decimals; that is the only observed precision loss.
4. **Activity scope.** `GET /activity?date=2026-09-18` = `$8.8598`
   account-wide (`deepseek-v4.1-flash` `$4.1087`, `glm-5.3-flash` `$3.1952`,
   …) — an order of magnitude above this repo's spend. `origin=pi.dev`
   over 30 days = `$128.10` / 33,851 requests, still not repo-scoped.
5. **Windows.** `activity?date=` outside 30 days → HTTP 400; analytics
   >31 days → HTTP 400. Both confirm C2/C3 and the D4 chunking decision.
6. **Session-id collision.** A council child generation's
   `session_id` is `job-1` while its parent session is a UUID; an
   `analytics/query` grouped by `session_id` pools `job-1` across runs
   (464 requests) — confirming `generation_id` is the only join key.