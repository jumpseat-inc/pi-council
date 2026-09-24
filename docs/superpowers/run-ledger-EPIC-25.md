# EPIC-25 Run Ledger — the batch-override run

- Run: `/features-deliver EPIC-25` with a **human topology override** — one
  `council-runner` for all five cards, owner-first, one branch/PR/merge
- Run id: `2026-09-24T06-55-21-019Z-582308-gule9d`
- Orchestrator: the human's agent, autonomously (attended only at the Phase-1
  rulings questionnaire)
- Phase 0 preflight: **PASS** (`council_preflight` → ok; `council/preflight.sh`
  → `PASS: preflight clean`); all nine seats resolve; `gh` authenticated
- Merge-time environment: `main` ruleset (id 23557528) requires 1 approving
  review; admin bypass authorized run-scoped by P1-4
- Gate state throughout: `.council.json` `gate.mode: active` but inert at
  read-back, so the override's owner-first sequence governed and the ROOT
  manifest recorded `mode: Verify`

## The override

The human overrode the one-runner-per-card mandate: a **single
`council-runner`** (`job-16`) handled all five EPIC-25 children, the **owner
worked on all five first**, and the **skeptic and judge ran only after all
owner implementations were committed**. All five rode **one branch
(`feat/epic25-residuals`), one PR, and one squash merge**. No deliberation
roster (no `principal`/`designer`/`consolidator`) was seated; the run is a
batch Verify lane.

## Phase 1 rulings

Recorded on `council/cards/EPIC-25.md` (`## Phase 1 rulings`), committed before
the record push.

- **P1-1** — single-runner, owner-first topology override.
- **P1-2** — one branch, one PR, one squash merge; all five cards' merge basis
  keys to the same head SHA.
- **P1-3** — all five Phase-1 open-judgment classes recorded `n/a` in
  `council/phase1-rulings.json` (docs/test-pin/engine-test epic, no
  user-facing surface).
- **P1-4** — run-scoped admin bypass (`--squash --admin --match-head-commit`)
  plus the step-12 direct record push; not extended to any later run.
- **P1-5** — all five cards in scope regardless of `Ready`/`Backlog`; no card
  retired.
- **P1-6** — first merge fully unattended.
- **P1-7** — run ends after the batch merge; `steward` rules EPIC-25 closure.

## Merge (one batch PR)

| Card | Mode | Runner ROOT | PR | Match-head SHA | Merged SHA | Basis |
|---|---|---|---|---|---|---|
| FLLWUP-117 | Verify | job-16 | #117 | `cf7abd8a60dfc749a9d4b3027d0aec94f4494686` | `02d73f287809652fbfed99b38da88a9da8f54ef2` | mode Verify, criteria 1, 2, 3, 4, 5 satisfied |
| FLLWUP-118 | Verify | job-16 | #117 | same | same | mode Verify, criteria 1, 2, 3, 4, 5 satisfied |
| FLLWUP-119 | Verify | job-16 | #117 | same | same | mode Verify, criteria 1, 2, 3, 4, 5 satisfied |
| FLLWUP-120 | Verify | job-16 | #117 | same | same | mode Verify, criteria 1, 2, 3, 4, 5 satisfied |
| FLLWUP-121 | Verify | job-16 | #117 | same | same | mode Verify, criteria 1, 2, 3, 4, 5 satisfied |

Merged with `--admin --match-head-commit cf7abd8` under P1-4; `gates` workflow
`SUCCESS` keyed on `workflow` on the head SHA and re-read on the merged SHA.
Mode read from the run substrate (`council_route op:"authority"`, `job-16`) —
never a seat's report.

**Merged-tree acceptance gates** (on `main` at `2e823df`): `bun test` **1532
pass / 6 skip / 0 fail** (113.98s); `bunx tsc --noEmit` clean; `python3
council/validate.py` → "All council artifacts valid"; `council/preflight.sh`
→ PASS.

### What each card delivered

- **FLLWUP-117** — spec/plan/JSDoc throw-site truth reconciled; two
  skeptic-driven line-ref fix cycles (`287b7e0`, `cf7abd8`); zero executable-line
  change; no version bump.
- **FLLWUP-118** — `FRONTMATTER_RE` byte-0-anchor synthetic-face test (T5) +
  contract JSDoc (`087aec7`); no version bump.
- **FLLWUP-119** — both `EPIC-*` fixture faces repaired (`193c724`); the
  `SMOKE_PHASE=7` live falsifier ran against the repaired face with the
  EV-2 workaround removed.
- **FLLWUP-120** — red-at-base reproduction + `STALE_CTX_PREFIX` guard at the
  `renderWidget` seam (`718c450`, `ea2c3e7`).
- **FLLWUP-121** — arm (b): 187 owner + 34 skeptic stress runs, 0 failures;
  root cause named (machine-load child scheduling); assertions untouched.

## Escalations and rulings

| Dispatch | Scope | Ruling seat | Outcome |
|---|---|---|---|
| job-17 | step-13 candidates | product-owner | Ratified `File` ×2 (FLLWUP-122, 123); **dropped** the watch-only stub-child candidate (FLLWUP-124 unallocated) |
| job-19 | run ending | steward | EPIC-25 closes `Done`; FLLWUP-122/123 re-homed to a new **EPIC-26**; closure + re-home in one record push |

No dispute escaped the container's skeptic, so no in-card ruling was needed.

## Follow-ups filed

- **FLLWUP-122** — Build the FLLWUP-120 stale-ctx pin on the real pi runner
  harness (`Backlog`; recorded `Mode: File — composite 0.55 < merge threshold
  1.00`)
- **FLLWUP-123** — Re-run the SMOKE_PHASE=7 live falsifier on the merged main
  tree (`Backlog`; recorded `Mode: File — actionable: confidence 0.52 < choice
  floor 0.60`)
- Candidate 3 — "Watch test/stub-child.test.ts for recurrence of the
  child-scheduling flake" — **Drop** (product-owner job-17; no card written).

Both filed cards were re-homed `epic: EPIC-26` at closure; EPIC-25 moved to
`Done` (commit `6190bff`).

## Runner usage blocks (verbatim from `council_wait`)

### Batch runner (`job-16`)

```
[job-16] seat=council-runner state=done stopReason=stop elapsed=232.6m turns=83 tokens=in 482344/out 52889/cR 5275264/cW 0/reason 27114/total 5810497 cost≈$0.3626 (catalogue)
usage  subtree     basis=stream-assistant  turns=574 tokens=in 1162998/out 417190/cR 32186752/cW 0/reason 296805/total 33766940 cost≈$1.8928 (catalogue)
```

Per-dispatch blocks the container reported:

- owner job-16.1: `turns=152 tokens=in 113379/out 34622/cR 11365568/cW 0/reason 12645/total 11513569 cost≈$0.6026` (stalled, work recovered)
- owner job-16.2: `turns=47 tokens=in 83562/out 47987/cR 2011264/cW 0/reason 39055/total 2142813 cost≈$0.1371` (cancelled at ceiling, FLLWUP-119 complete)
- owner job-16.3: `turns=57 tokens=in 84125/out 74463/cR 2802688/cW 0/reason 67889/total 2961276 cost≈$0.1900` (cancelled at ceiling, root cause settled)
- owner job-16.4: `turns=120 tokens=in 132088/out 83534/cR 7097152/cW 0/reason 59243/total 7312774 cost≈$0.4164` (complete: FLLWUP-120/121 + push + PR #117)
- skeptic job-16.5: `turns=45 tokens=in 83496/out 68995/cR 2273792/cW 0/reason 54923/total 2426283 cost≈$0.0839` (BLOCK, 1 red)
- owner job-16.6 (fix 1): `turns=10 tokens=in 28492/out 2660/cR 136384/cW 0/reason 902/total 167536 cost≈$0.0124`
- skeptic job-16.7 (re-verify 2): `turns=16 tokens=in 28255/out 17587/cR 357120/cW 0/reason 12625/total 402962 cost≈$0.0181` (BLOCK, 3 new)
- owner job-16.8 (fix 2): `turns=18 tokens=in 20984/out 12147/cR 342208/cW 0/reason 8859/total 375339 cost≈$0.0263`
- skeptic job-16.9 (re-verify 3): `turns=15 tokens=in 32522/out 14253/cR 322560/cW 0/reason 9120/total 369335 cost≈$0.0156` (NO-BLOCK)
- judge job-16.10: `turns=10 tokens=in 72968/out 5123/cR 135168/cW 0/reason 1580/total 213259 cost≈$0.0228` (PASS ×5)

### Step-13 application runner (`job-18`)

`[job-18] seat=council-runner state=done elapsed=2.4m turns=10 total 364481 cost≈$0.0264`

## Run closure

- **EPIC-25 closed `Done`** on its named acceptance; **EPIC-26 created** and
  FLLWUP-122/123 re-homed to it (steward job-19) in one record push
  (`6190bff`).
- **No `RETIRED`, no `Needs Human`, no `HALT`.** One batch container; its owner
  phase used 4 implementation dispatches (3 stall/timeout recoveries + 1
  complete) and 2 fix cycles; the verify loop used all 3 of its cycles and
  closed NO-BLOCK at the cap.
- **Process observations:**
  - The owner-first batch worked but the owner phase is long: ~4 hours wall,
    with three owner dispatches anti-stall-killed or cancelled at ceiling
    before one completed. The dispatcher must set the outer stall window above
    the longest child wait ([[hub-job-supervision]]).
  - Provider `Network connection lost` errors recurred but did not stop the run
    (retry/backoff handled them).
  - The facilitator had to revert an owner **single-writer violation** on the
    branch, reinforcing [[main-repo-immutability]]'s re-statement discipline.
  - The runner once passed an uncatalogued `model:` override and self-corrected
    by re-dispatching without it.
- Version bump: FLLWUP-117/118 are explicitly no-bump; FLLWUP-119/120/121 are
  fixture/test/engine-test changes. `package.json` remains `0.37.0`; the release
  path is the human's.