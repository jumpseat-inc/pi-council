# FLLWUP-58 — Runaway timeout-minutes backstop on the gates CI job — design

Status: settled design from the full-council deliberation (steps 2–6 of
`council/cards/FLLWUP-58.md`) plus the binding `product-owner` ruling
(job-29, `vault/raw/2026-09-20-po-fllwup58-gates-backstop.md`). This spec
records the ruling; it does not reopen anything the Council closed.

## Card goal (unchanged)

> The gates workflow fails bounded on a runaway test step via a loose
> timeout-minutes, sized so it never pre-empts an arm's own ceiling, with the
> CI-timeout policy documented.

## 1. The ruling, in one paragraph

Reading = **strict/any-arm**: every arm-bearing test in the run gets to trip
its own ceiling, including several tripping serially in one run. Operative
floor = the default-suite serial census sum (16 sites, Σ 2 585 s ≈ 43.1 min).
Placement = **step-level**, on the `bun test` step (a job-level number's
meaning drifts with the un-tripwireable preamble; step-level means
permanently what it says). Value = **60** (1.42× the operative floor, 1.20×
the gated-inclusive tree-wide sum). 45 is rejected (1.04× floor, below the
tree-wide sum); the single-arm reading (floor ≈ 6.7 min, value 15) is
rejected; 120 and the retracted `≥88` probe are rejected. The card's `goal`
text stands unamended.

## 2. Deliverables

Exactly these five artifacts. Nothing else changes.

### 2.1 `.github/workflows/gates.yml` — one line

Add `timeout-minutes: 60` to the `bun test` step only:

```yaml
      - run: bun test
        timeout-minutes: 60
```

- **No job-level `timeout-minutes` anywhere.** No other step gets one on this
  card — not `install`, not `tsc` (their wedge gap is an accepted-and-known
  temporary residual; see §2.3 and the step-13 follow-up).
- **`fetch-depth: 0` on the checkout step stays verbatim** (FLLWUP-59 step-13
  ruling R2 — hard constraint; any non-full fetch depth makes the
  truncated-history canary CI-load-bearing).
- Everything else in the file is byte-identical to today (18 lines).

### 2.2 New tripwire test — `test/fllwup58-gates-backstop.test.ts`

A **pure offline test** (file reads only, zero new live arms per FLLWUP-49
O10, zero new dependencies, runs in the default `bun test` suite in well
under a second). It is the first gate in the repo that reads
`.github/workflows/gates.yml` (`grep -rn 'gates.yml' test/` is empty today —
Skeptic O7) and ends the doc↔line pair's un-netted status. Precedent for the
derive-never-restate shape: `vault/wiki/retired-path-tokens.md` and
`test/faux-provider-shape.test.ts` (FLLWUP-59).

It must derive, never restate. **Hardcoded `300_000`, `2585`, `43`, `60`
literal ceiling/sum/value constants are forbidden in the derivation** — the
only numeric literals allowed are structural (e.g. parser thresholds, the
drift-threshold seconds if needed for a doc-parity label, and the shipped
value read out of `gates.yml`/the wiki, not written by the test).

Assertions:

1. **Census (derived at run time).** Recursively scan `test/**/*.test.ts`
   (recursive — the top-level glob misses all 8 `test/mcp/*.test.ts`,
   Skeptic O4) and extract every per-test ceiling: bun third-positional-arg
   literals (`_000` form) **and expression form** (`6 * 60_000` at
   `integration.test.ts:60` — a literal `_000` regex misses it, Skeptic O4).
   Split the census by whether the carrying file is skipped in the default
   run (`test.skipIf` behind `COUNCIL_INTEGRATION` / `COUNCIL_MCP_INTEGRATION`)
   — gated sites are **reported separately, never summed into the
   default-suite floor**. Harness-internal `spawnSync` bounds
   (`harness.ts:302`, `:361`; `ev41-retry-e2e.test.ts:348` inner `280_000`)
   are inner first-to-fire bounds under an outer test ceiling — **not
   census terms** (Skeptic O6; PO ruling §1). The 5 s bun-default tier is
   vacuous for arm-bearing tests (Skeptic O5) — not a census term.
2. **Floor.** Assert the shipped value (read from `gates.yml`) satisfies
   `shipped_minutes ≥ ceil(default_suite_sum_ms / 60000) + 1`. Derived sum
   today ≈ 43.1 min ⇒ floor 45 ⇒ shipped 60 passes. If a gated site ever
   enters the default run, its `skipIf` disappears, the census re-derives
   with it included, and the tripwire reds — mechanically encoding the
   ruling's re-derivation rule.
3. **Placement.** Parse `gates.yml` and assert: exactly **one**
   `timeout-minutes` in the whole file, located on the `bun test` step, and
   **none at job level** — this clause mechanically encodes PO FLLWUP-48
   ruling 2's boundary. Parsing must not require a new YAML dependency: the
   file is 18 lines and stable in shape; a minimal indentation-aware read is
   acceptable (same spirit as FLLWUP-59's file-based derivation).
4. **`fetch-depth: 0` parity.** Assert the checkout step still pins
   `fetch-depth: 0` (FLLWUP-59 R2) — one more net under a pinned invariant.
5. **Line↔doc parity.** Assert the `gates.yml` value equals the value the
   wiki CI-backstop section states (extract the number from
   `vault/wiki/test-suite-budget.md` both ways — the wiki must name the
   shipped value in machine-extractable form, e.g. `` `60` `` in a fixed
   marker line the test defines and the wiki section carries).
6. **Mutation-proven.** The test reds when the line is moved to job level,
   removed, or lowered below the derived floor. (Owner proves this by
   temporary local mutation during implementation, then restores; the
   mutations are not committed.)

### 2.3 `vault/wiki/test-suite-budget.md` — amendments, all in the same edit

1. **Correct the census sentence** ("Per-arm enforced ceilings (thirteen
   sites …)"): the tree carries **16 default-suite test-level ceiling sites**
   ({300_000 ×4, 180_000 ×6, 120_000 ×2, 20_000 ×1, 15_000 ×3}) plus **2
   gated sites** (`360_000` at `test/integration.test.ts:60` = `6 * 60_000`,
   `60_000` at `test/mcp/integration-context7.test.ts:24`) = **18 tree-wide**;
   and it must **separate the two mechanisms** (bun third-positional-arg test
   ceilings vs harness-internal `spawnSync` bounds — the latter are not
   census terms). Wrong today, before this card ships (Skeptic O8).
2. **Amend the "There is no suite-level ceiling — and none is added" bullet:**
   state that a backstop now exists (one `timeout-minutes: 60` on the
   `bun test` step), **quote PO FLLWUP-48 ruling 2 and say what changed** —
   the ruling condemns a *budget-keyed* ~2–3 min timeout that would pre-empt
   the TUI arm's 300s ceiling; a ceiling-scale backstop ≥ the serial census
   sum does not pre-empt a single trip, and FLLWUP-58 is the reserved
   "separate question" that ruling deferred to. This narrows nothing; it
   discharges the deferral.
3. **New CI-backstop section** (after "Ceiling vs budget"), carrying all of:
   - **The adopted reading, in the goal's own words:** every arm-bearing test
     in the run gets to trip its own ceiling, including several tripping
     serially in one run. Record that the **single-arm reading was
     considered and rejected** (floor ≈ 6.7 min, value 15): it saves
     runner-minutes on a run that fires ~never and costs the one property the
     card exists to guarantee — attribution completeness (a tripped ceiling
     names a test; a truncation names nothing and silently un-runs everything
     after the cut). Ruling §1, verbatim in substance.
   - **Both census floors and ratios:** default-suite Σ 2 585 s ≈ 43.1 min
     (operative floor; 60 = 1.42×); gated-inclusive tree-wide Σ 3 005 s ≈
     50.1 min (60 = 1.20×); measured green envelope ≈ 101.2 s (60 ≈ 35.6×).
     The **re-derivation rule**: if a gated site ever enters the default CI
     run, the floor re-derives — named in the wiki and enforced by the
     tripwire's census split.
   - **The four-tier ladder:** measured envelope ≈101 s (descriptive) → 180 s
     drift threshold (**the only drift alarm — say so explicitly** so nobody
     later "tightens" 60 into a budget enforcement; that is the FLLWUP-48
     mistake re-made) → per-arm ceilings 120–300 s (emergency bounds, fire
     per test) → gates backstop 60 min (fails bounded what in-process timers
     structurally cannot catch).
   - **What firing means / the tripped-failure discriminator:** the backstop
     catches the failure class the inner JS timers cannot (wedged event loop,
     OOM, hang outside any timed region). Read the **log tail**: last file
     block; the arm's own ceiling line **absent** ⇒ genuine runaway; the
     arm's own failure line **present** while the step was still killed ⇒
     mis-sized backstop (or more simultaneous hangs than the tolerance) —
     that is the runaway-vs-pre-emption discriminator, verbatim in the wiki.
   - **Step-naming as an unverified working assumption:** the step-naming
     annotation is job-scoped and historically unstable; the attribution
     mechanism actually relied on is the log tail, which is
     placement-independent. Marked as a working assumption, not a guarantee.
     Live annotation capture (C8) is **not adopted** — step-level placement
     makes it moot.
   - **The accepted-and-known `install`/`tsc` gap:** a step-level line on
     `bun test` leaves a wedged `bun install` / `tsc` bounded only by the
     platform 360-min job default. Recorded as **accepted-and-known,
     temporary**, with the named cheaper eventual fix: tight per-step
     `timeout-minutes` on those two deterministic steps (install ~30–60 s,
     tsc ~10–20 s measured locally). Follow-up drafted at FLLWUP-58 step 13;
     not folded into this card.
   - **The maintenance rule, in both directions:** any arm addition, ceiling
     change, or gated-site promotion re-derives the floor; the tripwire reds
     on violation. Shrinking the shipped value also requires re-derivation.
4. Leave the four-tier framing consistent with the existing "Ceiling vs
   budget" section — the drift threshold stays 180 s and stays the only drift
   alarm.

### 2.4 `README.md` — one pointer line

Append one clause to the Development/`## Commands` block pointing at the
CI-timeout policy in `vault/wiki/test-suite-budget.md`, so the
developer-facing paragraph does not imply "there is no CI ceiling".

### 2.5 `AGENTS.md` — `## Commands` pointer line only

One pointer line in `## Commands`. **No new Hard convention** — a 14th
convention reds `test/fllwup25-agents-page.test.ts` (it diffs AGENTS.md's
`## Hard conventions` slice against
`vault/wiki/sources/2026-08-23-agents.md` across four sites) until all four
move. The `## Commands` pointer avoids that parity coupling entirely.

## 3. Constraints (all binding)

- `fetch-depth: 0` stays verbatim (FLLWUP-59 R2).
- Zero new live arms (FLLWUP-49 O10). Zero new dependencies.
- No hardcoded `300_000` / `43` / `60` in the tripwire's derivation.
- The `goal` text is not amended; the wiki states the reading in its own
  words.
- Gates to clear, in full (owner gates): `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py`, `bash council/preflight.sh FLLWUP-58`.
- PR-head work must happen in a git worktree, never against the main
  checkout's branch state; no `git checkout`/`switch`/`reset` against the
  main repo path.

## 4. Out of scope (explicitly)

- Per-step timeouts on `install`/`tsc` — step-13 follow-up draft only.
- Live annotation capture (C8) — not adopted.
- Any change to arm ceilings, arm files, or the drift threshold.
- Any narrowing of the card `goal`.
