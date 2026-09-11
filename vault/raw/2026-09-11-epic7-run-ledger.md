# EPIC-7 Run Ledger (2026-09-10 → 2026-09-11)

Raw record of the `/features-new` decomposition and `/features-deliver EPIC-7`
autonomous run: the **honest token/cost usage accounting** epic. Five children
(EV-28, EV-30, EV-31, EV-32, EV-29) decomposed from a human intake, then
delivered end to end — five PRs (#42–#46), each squash-merged on the
[[deterministic merge check]] with `--match-head-commit` and CI re-verified
green on the merged SHA. 66 commits, test suite 587 → 668 pass (2 gated skips),
epic card itself closed `Done` (the second epic-card closure on the board).
Version stays 0.18.0 — no bump commit.

The run is notable for the opposite of EPIC-6's zero-escalation close: **every
child escalated** (5 cards, 7 ruling dispatches — 5 to `product-owner`, 2 to
`steward`), because the feature's premise collided with the provider's real
data granularity. One escalation was the card's **own goal** (EV-29), amended
by `steward`.

## The human intake (verbatim, the epic's source of truth)

> I want to record the spendings in input/output tokens, cached (if available)
> and the dollar value. What I found in my usages in pi is that the dollar
> value is an estimate as well as the cache. What's weird is that the dollar
> value is inflated by a factor of 2-3x and in some cases 5x while cache hits
> are more optimistic. ... The best bet would be to query OpenRouter itself? ...
> We will report token usages [after /features-new, /features-deliver, /council,
> and a council-runner's execution]. ... we should have a `~/.pi-council`
> directory where we store information there. Stored information should be able
> to be traced back to the session's JSONL history? A question for the council
> to answer.

## Decomposition (the `/features-new` three-wave session)

Four seats deliberated (principal authored; skeptic + designer attacked in
parallel; product-owner ruled last). Epic `EPIC-7`;
children **EV-28** (full usage tuple + cost provenance), **EV-30**
(invocation-scoped spend record), **EV-31** (durable store with session
provenance), **EV-32** (usage block at every autonomous exit), **EV-29**
(provider-reported actual cost). **FLLWUP-26** filed for the unimplemented
per-run token ceiling. Phase-1 rulings front-loaded six surface copy/format
literals and the scope/order/merge settings.

## Cards and merges (execution order)

- **EV-28** (PR #42, squash `6768d25`, head `d4119759`) — the hub's `Job.usage`
  widened from `{input, output, cost, turns}` to the full **flat** tuple
  (`input, output, cacheRead, cacheWrite, reasoning, totalTokens, costInput,
  costOutput, costCacheRead, costCacheWrite, cost, turns, costBasis,
  usageSource`). Wire→record clause (pi-ai's nested `cost.*` flattened on
  ingestion; missing components coerce to 0, never NaN). `costBasis` stamps
  `catalogue-estimate`; `usageSource` stamps `stream-assistant`. Head line
  re-budgeted to ≤160 cols (label collapse `cR`/`cW`, no thousands separators,
  rightmost money `cost≈$X.XXXX (catalogue)`). Suppression predicate
  `turns === 0 && output === ''` keeps the identity prefix. Eval-store
  `cellScope.usage` **whitelisted** to its recorded `{input,output,cost,turns}`
  shape.
- **EV-30** (PR #43, squash `f33cbdf`, head `ba9d27c5`) — the pure
  invocation-scoped **`SpendRecord`** (`extensions/spend.ts`): two halves, each
  with its own single-valued basis — `ownSession` (session enumeration,
  `session-reconciled`) and `subtree` (stream projection,
  `stream-assistant`). Boundary resolved as the **first on-chain user message
  after the invocation marker** in append order (the owner's `parentId ===
  markerId` rule falsified by the Skeptic — pre-prompt compaction re-parents);
  `lastEntryId` = leaf-chain end; unresolvable boundary → **zero both halves**
  before any forest walk. R-4 label
  `boundary=session=<id> entries=<first>..<last> jobs=<n>`. One union merge
  (`540aca6`).
- **EV-31** (PR #44, squash `f3bcd8a`, head `22cc08ab`) — the durable
  **usage store** at `getAgentDir()/council/usage/` (`extensions/usage-store.ts`),
  one record per invocation keyed on the marker's `at`, files
  `<ISO-basic>_<runId>_<command>.json`, `README.md`, dir `0700`/file `0600`.
  Wraps `SpendRecord` byte-verbatim (`spend` frozen). Write-time
  `pointerSurvivable`; read-time never-throwing `resolveProvenance` →
  `ResolveOutcome = resolved | pruned-expected | missing-unexpected |
  no-session-file | range-missing`. Survives `pruneRuns`. First container
  stalled (see incidents).
- **EV-32** (PR #45, squash `32a67a3`, head `f2690922`) — the deterministic
  **usage block** (`extensions/usage-block.ts` + `extensions/usage-format.ts`)
  at five autonomous exits: `/features-new`, `/features-deliver` (Phase 3),
  `/council`, `/council-eval`, and a `council-runner`'s report. R-6 is
  **grammar identity**, not line-count; the runner form omits the `ownSession`
  row. Three whole-block states, precedence failed > unresolved > empty:
  `usage  no usage recorded` | `usage  accounting boundary unresolved` |
  `usage  accounting failed — <reason>`; conditional legend
  `usage  n/a = provider figure unavailable`. Steward ruled the opt-in
  `boundaryMode: "marker"` extension so `/council-eval` (a TS command that
  injects no user message) resolves against its own marker timestamp without
  relaxing EV-30's zero-both invariant.
- **EV-29** (PR #46, squash `ec33fc0`, head `02e573bf`) — **provider-reported**
  figures (`extensions/provider-cost.ts`): the OpenRouter generation endpoint's
  generation-level dollars (`total_cost`, `upstream_inference_cost`, BYOK-only
  `upstream_inference_prompt_cost`/`_completions_cost`, nullable
  `cache_discount`, `is_byok`) plus native token counts, fetched per
  `responseId` and persisted as the optional `StoredUsageRecord.provider`
  sibling (`USAGE_RECORD_SCHEMA_VERSION` 1 → 2). Record-only unavailability
  reasons `no-generation-id | session-missing | fetch-failed:<error> | timeout |
  no-api-key`. Coexistence render `usage  reported  cost=$Σ.XXXX (reported)
  routed=<name>x<n>` (ASCII `x`, descending count then ascending name, omitted
  only when nothing was reported). Goal amended by steward (see rulings).

Suite progression: 577 (pre-run) → 587 → 602 → 619 → 644 → 668 pass (2 skip),
0 fail. Merges: 5; judge PASS and Skeptic PASS on every card; step-9 cycles
1/3 on every card.

## The rulings (all appended verbatim to card faces, binding)

- **Phase 1 preflight (run start)**: scope (EV-28/30/31/32/29; FLLWUP-26
  deferred); build order; auto chain-promotion; gate set
  (preflight/tsc/bun test/validate); squash `--match-head-commit`; and six
  copy/format literals — the money signifiers (`cost≈$… (catalogue)` /
  `cost=$… (reported)`), the `n/a` marker + legend, the store path/mode, the
  R-4 boundary label, the empty/failure states, and EV-29's R-7 provider-id
  scope.
- **product-owner, EV-28 step 6** (five items): flat cost shape + wire→record
  clause; suppression predicate + identity-prefix survival + `turns` stays;
  eval-store whitelist (no amendment); persisted `usageSource`; head-line
  width re-budget (`cR`/`cW`, `reason` label, ≤160).
- **product-owner, EV-30 step 6** (seven items): `branch_summary` included;
  no `total` on the record; `entries=unresolved` + `boundary.resolved` flag;
  "rotated session" defined as boundary-unresolvable; `usageSource` is the
  lower-bound statement; valid-only-written-once (no idempotence stamp);
  `lastId` = active leaf-chain end.
- **product-owner, EV-31 step 6** (one item): stored `pointerSurvivable` +
  read-time `ResolveOutcome` (Position B primary, `range-missing` as a fifth
  mechanism value); the EV-31 write notify wording deferred to EV-32.
- **product-owner + steward, EV-32 step 6** (ten items): C–H/J ruled by
  product-owner (coexistence, `routed=` copy, reason literals, partiality,
  no mixed-basis signifier, `basis=` format, render at the `written`
  transition, notify/console satisfies the acceptance, notify replaced);
  **A/B/I escalated to steward**, which ruled the `boundaryMode: "marker"`
  extension and the third R-5 state `usage  accounting boundary unresolved`.
- **steward + product-owner, EV-29 step 6**: **steward amended the card `goal`**
  — the provider has no per-component dollar source, so the goal now names
  generation-level dollars, the optional BYOK two-way split, and native token
  counts; `(reported)` pinned to mean "what the provider reported for this
  generation", never the billed amount, with `is_byok` persisted. product-owner
  ruled C1–C5/D/E (coexistence; `routed=`; reason literals; no rendered partial
  retention; record-only reasons; `StoredUsageRecord.provider` sibling +
  schema bump; R-2 satisfied per-half + record-level marker).
- **steward, run close**: EPIC-7 → `Done`; run ends; FLLWUP-26..35 ride as
  `Backlog` residuals under a Done epic.

## The pricing finding (the intake's central question)

pi computes `cost` itself from the **static catalogue** (`calculateCost`,
`pi-ai/dist/models.js`) and never reads a provider cost field —
`parseChunkUsage` sets `cost:{0,0,0,0,0}` and then the catalogue overwrites
it. OpenRouter's API reports **generation-level** dollars plus a **BYOK-only
two-component** `upstream_inference_prompt_cost`/`_completions_cost` split and
native token counts — **there is no four-component dollar split anywhere**, and
cache appears as a token count, not a dollar.

A spot-check during `/features-new` compared pi's runtime price table
(`~/.pi/agent/models-store.json`) against OpenRouter's live `/api/v1/models`
for the three models the run used: `meta/muse-spark-1.3` `$1.25/$4.25/$0.15`,
`minimax/minimax-m3` `$0.30/$1.20/$0.06`, `deepseek/deepseek-v4.1-flash`
`$0.15/$0.60/$0.003` — **exact matches**. So the human's 2–5x inflation is most
likely **OpenRouter routing to an upstream provider whose actual charge differs
from the model's default listed price**, not a stale catalogue rate. This is
why R-7 persists the routed provider id.

## Incidents (none verdict-invalidating)

1. **Package root removed mid-session** — the running extension's `PKG_ROOT`
   (a global clone) was deleted after the parent loaded it, so every child
   `pi` process re-resolved packages, found no pi-council, and ran as a vanilla
   agent with **no hub tools**. EV-28's first container correctly `HALT`ed at
   step 2 (`Tool council_dispatch not found`). Repair: re-install as a global
   **local-path** package (`pi install /home/tista/codes/pi-council`) plus a
   symlink; verified by a no-op dispatch probe. Phase 0 hardening candidate:
   assert the dispatch *tools* exist, not just that seat names resolve.
2. **Runner stall recurrence #3** — EV-31's first container was set a 30-min
   stall window, below the 45-min owner dispatch ceiling it waited on; the hub
   anti-stall-killed it at ~34 min. Recovered from committed board state; a
   fresh runner with a 75-min window finished. The EPIC-5/EPIC-6 invariant
   ("the no-activity window must exceed the longest legitimate silent wait
   below it") is documented and was *still* re-learned — the durable fix
   belongs in the dispatch tool's default, not in orchestrator discipline.
3. **Preflight branch-freshness artifact** (filed FLLWUP-27) — `preflight.sh`
   goes red at merge time on a correctly-based card branch once the runner
   pushes its board/card record commits to `main` mid-card; resolved by
   recorded practice (preflight is the run-start/owner-time gate; the step-11
   re-run set is tsc/bun test/validate), not by weakening a criterion.
4. **One union merge** (EV-30, `540aca6`) — the "base PRs at origin/main, push
   records as they go" avoidance recipe did not fully hold; the squash folded
   record commits and the reconcile kept the newer record side.
5. **Bootstrapping** — this session could not render its own usage block (the
   pre-merge extension was loaded in memory), so the run's own spend was
   hand-computed from the manifests + seat session JSONLs. The first run whose
   feature reports on *later* runs, not itself.

## Run spend (catalogue-estimated, recovered from the substrate)

| seat | jobs | turns | input | output | cacheRead | reasoning | cost |
|---|---:|---:|---:|---:|---:|---:|---:|
| owner | 19 | 559 | 3,929,204 | 435,632 | 51,945,536 | 272,155 | $2.3352 |
| skeptic | 11 | 240 | 3,284,954 | 126,473 | 12,899,015 | 33,428 | $6.5786 |
| council-runner | 12 | 545 | 5,446,492 | 557,614 | 48,841,870 | 238,271 | $1.2981 |
| principal | 12 | 260 | 3,364,923 | 275,421 | 17,123,684 | 204,029 | $0.7214 |
| designer | 10 | 104 | 678,993 | 64,616 | 5,056,139 | 23,046 | $0.5846 |
| product-owner | 6 | 85 | 537,065 | 53,807 | 3,928,774 | 7,106 | $0.4614 |
| consolidator | 5 | 17 | 193,746 | 40,699 | 361,547 | 23,849 | $0.3806 |
| steward | 3 | 33 | 543,956 | 42,734 | 1,373,824 | 32,438 | $0.1114 |
| judge | 5 | 40 | 563,722 | 11,576 | 586,720 | 5,814 | $0.0961 |
| **seat total** | **83** | **1,883** | **18,543,055** | **1,608,572** | **142,117,109** | **840,136** | **$12.5672** |
| orchestrator | — | 147 | 4,420,441 | 167,470 | 25,771,302 | 72,370 | $0.8409 |
| **total** | | **2,030** | **22,963,496** | **1,776,042** | **167,888,411** | **912,506** | **$13.4081** |

Billed tokens ≈ **192.6M**; `cacheWrite` 0 throughout. Dollar figures are
`costBasis: catalogue-estimate` (EV-29's provider path was shipped at the very
end and not loaded in this session).

## Standing learnings

- **A card's premise can be the defect** — the strongest case yet: EV-29's goal
  named a data granularity the provider does not produce. Goal-wording authority
  is `steward`'s; the amendment is the honest contract, not a scope retreat.
- **Phase-1 front-loading fixes literals, not discovered mechanisms.** Placement,
  trigger, multiplicity and durable-carrier questions surfaced in every card;
  facts-only packets still resolved each in one ruling round.
- **Provenance labels are the honesty mechanism** — `costBasis` (estimate vs
  reported) and `usageSource` (stream projection vs session enumeration) make a
  number's basis machine-readable; an estimate must never stand as a charge.
- **The stall invariant needs a tool-level guard.** Three runs have re-learned
  "window > longest silent wait"; the next fix is a default, not a discipline.
- **A vanished package root silently degrades children to vanilla agents** —
  Phase 0 should assert dispatch tools, and the dev pattern for a repo consuming
  itself is a global local-path `pi install`.
- **The usage chain mirrors the eval chain** — capture seam → pure record →
  durable store → surface, each with a schema-freeze discipline.

## Board deltas

- EPIC-7 filed by `/features-new` with EV-28..32 + FLLWUP-26; all five children
  chain-promoted and delivered; EPIC-7 → `Done` (second epic-card closure).
- FLLWUP-27..35 filed during the run (nine cards); FLLWUP-36 dropped by the
  human. All FLLWUP-* ride as `Backlog` residuals under the Done epic.
- Version unchanged at 0.18.0.
