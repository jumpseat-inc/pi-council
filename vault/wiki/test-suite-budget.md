---
title: Test Suite Budget
type: concept
summary: The default bun test suite's measured wall-clock envelope, the live-arm files that carry it, the ceiling-vs-budget distinction, the CI-timeout backstop, and the rules that keep the numbers honest.
aliases: [suite budget, test suite cost, drift threshold, CI timeout backstop]
tags: [pi-council/concept, pi-council/smoke-test]
sources: ["[[2026-09-19-po-fllwup48-test-suite-budget]]", "[[2026-09-18-po-fllwup56-step13-ruling]]", "[[2026-09-20-po-fllwup58-gates-backstop]]", "[[2026-09-20-po-fllwup58-step13-confirmation]]", "[[2026-09-18-epic9-residual-run-2-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-21-po-ev77-j1-j2-ruling]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-fix-shape-witness-segment-liveness]]", "[[2026-09-23-epic15-residual-run-ledger]]"]
created: 2026-09-17
updated: 2026-09-25
---

# Test Suite Budget

FLLWUP-48. The default `bun test` suite's measured wall-clock envelope, the
live-arm files that carry most of it, and the rules that keep the number
honest. **Document-only** — the live pty/`-p` falsifier arms are not gated
(PO ruling 3): they run within the envelope, and gating reopens only if a
re-measurement ever exceeds the drift threshold below.

## Measured envelope

- **Total wall clock:** ≈**101.2s** (947 tests across 82 files; 945 pass,
  2 skip, 0 fail).
- ⚠️ **Grown since (EPIC-13, 2026-09-21, `main` at v0.28.0):** **1213 tests
  across 100 files, ≈107–109s** — the routing-gate cards and their falsifier
  arms added roughly 4–5s (and ~11 files). Still well inside the 180s drift
  threshold. The figure above remains the pinned measurement with provenance;
  re-measure for the exact post-EPIC-13 number at the next pass. See
  [[2026-09-21-epic13-run-ledger]].
- ⚠️ **Grown again (EPIC-14, 2026-09-21):** **1286 tests across 103 files,
  ≈110s** — the gate-enablement cards (EV-73…EV-77) added ~73 tests and 3
  files (the `/council-gate` command suite, the run-start preflight suite, and
  the `test/ev77-gate-docs.test.ts` wiki pin). Still inside the 180s
  threshold. See [[2026-09-21-epic14-run-ledger]].
- ⚠️ **Grown again (/usages, 2026-09-21, local `main`, unreleased):** **1463
  tests across 113 files, ≈111s** — the tests for [[usages-report]] (the Python
  tool's offline + stub-HTTP arms, `test/usage-store.test.ts`'s `seats[]`
  arms) and the two command-count assertions bumped 16→17. Still inside the
  180s threshold. **Test-isolation lesson:** adding one test file shifted bun's
  worker packing and exposed a pre-existing module-state leak between
  `ev40-wiring` and `ev40-parent-retry` (the single-slot retry editor); the
  fix is a test-only `beforeEach` reset — a reminder that shared module state
  in the engine is only as isolated as the worker partition. See
  [[2026-09-21-usages-design]].
- **Grown (shape-witness segment-liveness fix, 2026-09-22):** **1470 tests
  across 113 files, ≈112s** (1464 pass / 6 skip / 0 fail) — one new pure
  falsifier (`dir tokens colliding with a live path SEGMENT are suppressed`),
  and the FLLWUP-59 derived-token test returned to green after the
  segment-aware repair (same file count; the fix is test-only). Still inside
  the 180s threshold. See
  [[2026-09-22-fix-shape-witness-segment-liveness]].
- ⚠️ **Grown again (EPIC-15 residual run, 2026-09-23):** **1485 tests** — the
  five residual cards added the async `runTool` migration (FLLWUP-111), the
  foreign `--cache-file` parent test (FLLWUP-109), the `cache: hits=<N>
  misses=<M>` summary test (FLLWUP-110), and the procedure-copy pins
  (FLLWUP-107/108). Still inside the 180s drift threshold. See
  [[2026-09-23-epic15-residual-run-ledger]].
- ⚠️ **Grown again (EPIC-23→EPIC-25, 2026-09-24/25):** **1532 pass / 6 skip /
  0 fail across 118 files, ≈114s** — the EPIC-24/25 cards added the
  frontmatter-scoped `cardEpicKey` + corpus pin, the FLLWUP-114 live smoke, the
  quote-agnostic import pins, the stale-ctx guard, and the five batch residuals.
  Still inside the 180s drift threshold. See [[2026-09-24-epic23-run-ledger]],
  [[2026-09-24-epic24-run-ledger]], [[2026-09-25-epic25-run-ledger]].
- **Provenance:**
  - Machine: Linux 6.12.24-Unraid x86_64 (container)
  - Date: 2026-09-20 (re-measured at HEAD)
  - SHA: `675c1bf` (the `ad96c4f` FLLWUP-56 pass first recorded this envelope at
    935 tests / 81 files; the suite has since grown)
  - Exact command (the `bun install` **first** — a tree whose `node_modules`
    predates `@modelcontextprotocol/sdk` is red until installed):
    ```bash
    bun install
    time bun test
    ```
- The figure is **descriptive, not normative**: one machine's measurement,
  with provenance so the next re-measurement can be compared. 180s is **the
  drift threshold, not the budget** (below).

## Per-file table (live arms)

The live spawning arm files, measured individually (same machine, measured in
the `ad96c4f` pass; command in the next section):

| File | Arm count | Measured wall |
|---|---|---|
| `test/ev41-retry-e2e.test.ts` | 5 | **38.0s** |
| `test/ev40-live-gates.test.ts` | 5 | **16.6s** |
| `test/ev40-headless.test.ts` | 3 | **12.9s** |
| `test/ev43-reachability.test.ts` | 2 | **4.9s** |
| `test/ev41-seat-child-live.test.ts` | 2 | **5.9s** |
| `test/gate-run-live.test.ts` (EV-65) | 3 | not yet measured — gated behind `COUNCIL_INTEGRATION=1`; design-time expected ≈10s (test header; the measured figure lands here at the next re-measurement) |
| **Live-arm share** | 17 | **78.3s of 101.2s ≈ 77%** |

The other ~75 files sum to ≈23s. The suite is serial/additive
(`package.json`'s `test` script is bare `bun test` — no `--parallel`), so
per-file times sum to the suite total within run-to-run tolerance.

The EV-65 live arm (`test/gate-run-live.test.ts`, added 2026-09-20) is
**gated** (reported separately, never summed into the default-suite floor,
like the other gated sites) and is **not yet measured** — its design-time
expected wall clock (≈10s) and its per-test ceiling (120_000ms) live in the
test header per standing rule 1; the measured figure lands in the table at
the next re-measurement. It makes **no** default-suite wall-clock claim —
the arm is skipped entirely without `COUNCIL_INTEGRATION=1`.

## Ceiling vs budget — they are not the same number

- **Per-test enforced ceilings** (FLLWUP-58 census correction — this page
  previously said "thirteen sites", which undercounted and conflated two
  mechanisms): the tree carries **16 default-suite test-level ceiling
  sites** ({300_000 ×4, 180_000 ×6, 120_000 ×2, 20_000 ×1, 15_000 ×3}) plus
  **2 gated sites** (`360_000` at `test/integration.test.ts:60` — written
  as the expression `6 * 60_000`; `60_000` at
  `test/mcp/integration-context7.test.ts:24`) = **18 tree-wide**. They are
  **emergency bounds**, not budgets — e.g. the TUI pty arm's ceiling is
  `300_000` (`test/ev41-retry-e2e.test.ts:362`) against a ~32s actual. A
  tripped ceiling fails the test; a budget merely describes expected cost.
  **Two distinct mechanisms — do not conflate them:** (a) bun
  third-positional-arg test ceilings (`test(name, fn, timeoutMs)`) are the
  census terms; (b) harness-internal `spawnSync` bounds
  (`test/faux-provider/harness.ts:302` and `:361`;
  `test/ev41-retry-e2e.test.ts:348`, `timeout: 280_000`) are inner
  first-to-fire bounds under an outer test ceiling — **not census terms**.
  The gated sites carry `test.skipIf` behind `COUNCIL_INTEGRATION` /
  `COUNCIL_MCP_INTEGRATION` and are reported separately, never summed into
  the default-suite floor.
- **A suite-level backstop now exists** (FLLWUP-58): one loose,
  ceiling-scale `timeout-minutes` on the `bun test` step of
  `.github/workflows/gates.yml` — see the CI-timeout backstop section
  below. This amends, and does not contradict, PO FLLWUP-48 ruling 2
  ("no `gates.yml` `timeout-minutes`"): that ruling condemned a
  *budget-keyed* (~2–3 min) step timeout, which would pre-empt the TUI
  arm's own 300s ceiling and mask attribution. A ceiling-scale backstop ≥
  the serial census sum does not pre-empt a single trip — the condemnation
  is of the budget-keyed magnitude, not of any step timeout. FLLWUP-48
  explicitly deferred "CI-timeout policy is a separate question"; FLLWUP-58
  is that reserved separate question, now discharged. This narrows nothing.
- **180s is the drift threshold, not the budget** — and it stays **the only
  drift alarm** (see the ladder in the CI-timeout backstop section; the
  60-minute backstop is not a drift alarm). It is the maintained
  invariant the suite is tested against over time. Any re-measurement above
  180s reopens FLLWUP-48 or opens a new card — and that is the branch under
  which gating the live arms behind an opt-in reopens.

## CI-timeout backstop (FLLWUP-58)

**The adopted reading, in the goal's own words:** every arm-bearing test in
the run gets to trip its own ceiling, including several tripping serially in
one run. The **single-arm reading was considered and rejected** (floor
≈ 6.7 min, value 15): it saves runner-minutes on a run that fires ~never
and costs the one property the card exists to guarantee — **attribution
completeness** (a tripped ceiling names a test; a truncation names nothing
and silently un-runs everything after the cut). PO FLLWUP-58 ruling §1,
verbatim in substance. **Placement is step-level, on the `bun test` step**:
a job-level number's meaning drifts with the un-tripwireable preamble
(install, tsc); step-level means permanently what it says.

**Both census floors and ratios:**

| Census | Sum | Against shipped 60 min |
|---|---|---|
| Default suite — 16 sites (operative floor) | Σ 2 585 s ≈ 43.1 min | 1.42× |
| Gated-inclusive tree-wide — 18 sites | Σ 3 005 s ≈ 50.1 min | 1.20× |
| Measured green envelope | ≈ 101.2 s | ≈ 35.6× |

Floor rule: `shipped_minutes ≥ ceil(default_suite_sum_ms / 60000) + 1`
⇒ today floor 45, shipped 60. 45 was rejected (1.04× the floor, below the
tree-wide sum); the single-arm reading (15) and 120 were rejected; the
retracted ≥88 probe was retracted (PO ruling §1).

**The re-derivation rule:** if a gated site ever enters the default CI run,
its `skipIf` disappears, the tripwire's census re-derives with it included,
and the floor re-derives — named here and enforced mechanically by
`test/fllwup58-gates-backstop.test.ts` (the tripwire reds when the derived
floor exceeds the shipped value). Shrinking the shipped value also requires
re-derivation.

**The four-tier ladder** (consistent with "Ceiling vs budget" above):

1. ≈101 s measured envelope — descriptive.
2. 180 s drift threshold — **the only drift alarm**. Do not "tighten" 60
   into a budget enforcement; that is the FLLWUP-48 mistake re-made.
3. Per-arm ceilings 120–300 s — emergency bounds, fire per test.
4. 60 min gates backstop — fails bounded what in-process timers
   structurally cannot catch.

**What firing means — the tripped-failure discriminator.** The backstop
catches the failure class the inner JS timers cannot: wedged event loop,
OOM, hang outside any timed region. Read the **log tail** (last file
block): the arm's own ceiling line **absent** ⇒ genuine runaway. The arm's
own failure line **present** while the step was still killed ⇒ mis-sized
backstop (or more simultaneous hangs than the tolerance) — that is the
runaway-vs-pre-emption discriminator.

**Step-naming is an unverified working assumption.** The step-naming
annotation is job-scoped and historically unstable; the attribution
mechanism actually relied on is the **log tail**, which is
placement-independent. Marked as a working assumption, not a guarantee.
Live annotation capture (C8) is **not adopted** — step-level placement
makes it moot.

**Accepted-and-known gap (temporary):** a step-level line on `bun test`
leaves a wedged `bun install` / `tsc` bounded only by the platform 360-min
job default. The named cheaper eventual fix: tight per-step
`timeout-minutes` on those two deterministic steps (install ~30–60 s,
tsc ~10–20 s measured locally). Follow-up drafted at FLLWUP-58 step 13;
not folded into this card.

Shipped backstop value (machine-parity marker): `timeout-minutes: 60` on the `bun test` step — parity-checked against `.github/workflows/gates.yml` by `test/fllwup58-gates-backstop.test.ts`.

**Maintenance rule, both directions:** any arm addition, ceiling change, or
gated-site promotion re-derives the floor; the tripwire reds on violation.
Shrinking the shipped value also requires re-derivation.

## Shell independence (FLLWUP-57)

The suite is **shell-independent**: `test/override.test.ts` captures and
restores the ambient `COUNCIL_EVAL_MODEL` around each test, so an exported
catalogue-valid value can no longer change a later test's effective model. The
pre-fix green was **masking luck**, not correctness — an `afterEach` *deleted*
the ambient instead of restoring it, so the value never survived into later
tests. Criterion 1's local gate evidence is now deterministic for every
catalogue-valid ambient value. See [[2026-09-18-epic9-residual-run-2-ledger]].

## Census correction (FLLWUP-58 step-13 confirmation, 2026-09-20)

⚠️ **Supersedes the census and ratios stated above.** The converged
census/tripwire scans **standalone-line** ceilings only. **Compact-form
third-positional-arg ceilings** (`}, 15_000);`) are invisible to it — **19
such sites, Σ 420 000 ms**, all in non-gated files. Consequences:

| Census | Count | Floor | Against shipped 60 min |
|---|---|---|---|
| Converged default suite (above) | 16 sites | 43.1 min | 1.42× |
| **Widened default suite (true floor)** | 16 + 19 = 35 sites | **≈ 52 min** | **1.15×** |
| Tree-wide true ceiling count | **37 sites** | — | — |

So the shipped `timeout-minutes: 60` still binds (52 ≤ 60), but the **honest
headroom is ~1 minute, not 10**, and a single gated promotion puts the floor at
**59**. The page previously **over-claimed its own safety margin**. The fix —
widen the derivation to every writing form and pin these census figures to it,
plus per-step bounds on **every** non-test step (`bun install`, `bunx tsc`, and
`python3 council/validate.py` are all un-bounded; the tripwire's "exactly one
`timeout-minutes`" assertion must be **re-expressed**, not loosened, in the same
commit) — is carded as **`FLLWUP-70`**. See
[[2026-09-20-po-fllwup58-step13-confirmation]].

## Re-measure command

```bash
bun install
time bun test
```

Per-arm loop:

```bash
for f in ev41-retry-e2e ev40-live-gates ev40-headless ev43-reachability ev41-seat-child-live; do
  time bun test test/$f.test.ts
done
```

## EPIC-10 growth (2026-09-22)

The default suite grew across the epic from ~1331 pass (EV-79) to **1453 pass /
6 skip / 0 fail** at EV-84, the wall clock rising from ~110s to ~111s. The EV-84
falsifier's live arm is gated off the default suite (`COUNCIL_JEV_LIVE=1`,
`COUNCIL_INTEGRATION=1`), preserving the default-suite-stays-offline rule; the
run added no ungated network arm. Witness: [[2026-09-22-epic10-run-ledger]].

## Standing maintenance rules

1. **Any new live arm must state its expected wall clock and its ceiling in
   its test header.** ️ **Clarified (FLLWUP-56 R1, 2026-09-18):** the header
   carries the **design-time expected** figure plus the ceiling — both are what
   the design knew when the header was written. The header is **not** a
   measurement record and is not rewritten by the implementing pass. The
   **measured** figure has exactly one authoritative home: this page's per-file
   row. A header estimate beaten by measurement is **not a defect** (an
   estimate wrong in the safe direction), and a per-arm number stated anywhere
   else is a restatement, not a source. See
   [[2026-09-18-po-fllwup56-step13-ruling]].
2. **The README/wiki figures are re-measured** when an arm changes, or when
   the drift threshold trips.
3. **`bun install` first** on any tree whose `node_modules` predates
   `@modelcontextprotocol/sdk` (it is in `package.json` but was missing from
   long-lived ancestor installs — the suite is red until installed).
4. **Budget ≠ ceiling:** the docs above keep the two numbers distinct; a new
   arm's ceiling is an emergency bound, never written into the envelope.
5. **A docs card may ship test files** (EPIC-14 J2,
   [[2026-09-21-po-ev77-j1-j2-ruling]]). A card whose deliverable is a wiki page
   satisfies a "cited code paths resolve mechanically" acceptance with bun tests
   over the real `vault/wiki/*.md` (e.g. `test/fllwup25-agents-page.test.ts`,
   `test/fllwup58-gates-backstop.test.ts`, `test/ev77-gate-docs.test.ts`) —
   **in `test/`, never in `council/validate.py`**, which is packaged tooling and
   would hardcode this repo's layout into consumer repos. A new live-arm file
   owes the header rule above.
