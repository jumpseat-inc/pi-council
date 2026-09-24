# EPIC-24 Run Ledger — closing the EPIC-23 autonomous-delivery residuals

- Run: `/features-deliver EPIC-24` — "Close the EPIC-23 autonomous-delivery residuals — runner transcript live-smoke, frontmatter-scoped epic parse, and quote-agnostic import pins"
- Run id: `2026-09-24T06-55-21-019Z-582308-gule9d`
- Orchestrator: the human's agent, autonomously (attended only at the Phase-1
  rulings questionnaire)
- Phase 0 preflight: **PASS** (`council_preflight` → ok; `council/preflight.sh`
  → `PASS: preflight clean`); all nine seats resolve by name, no repo-local
  overrides; `gh` authenticated
- Merge-time environment: `main` ruleset (id 23557528) requires 1 approving
  review + linear history + PR-only; admin bypass authorized run-scoped by P1-1
- Gate state throughout: `.council.json` `gate.mode: active`, but
  `council_route op:route` returned `source: "fallback"` (inert at read-back;
  no recorded decision for the current packed state), so every card ran the
  full **Deliberate** path and the ROOT manifests recorded `mode: Deliberate`

## Phase 1 rulings

Recorded human decisions for the EPIC-24 run, written to
`council/cards/EPIC-24.md` (`## Phase 1 rulings`) and committed at `f3d6505`
before the run's first record push.

- **P1-1 (run-scoped admin authorization).** Card merges via
  `gh pr merge <PR> --squash --admin --match-head-commit <X>`; the step-12
  direct record push to `main`; and the push of `council/phase1-rulings.json`.
  Run-scoped only; a SHA mismatch is a HALT, not a retry.
- **P1-2 (record push).** Direct card-and-board state commits authorized;
  force-push/rewind/history-rewrite forbidden.
- **P1-3 (class rulings).** All five Phase-1 open-judgment classes recorded
  not-applicable in `council/phase1-rulings.json` — the epic is internal
  test/engine work with no user-facing surface.
- **P1-4 (build order — steward job-1).** FLLWUP-115 → FLLWUP-114 → FLLWUP-116,
  strictly serial; no card retired or defaulted out.
- **P1-5 (promotion — product-owner job-2).** The three children ratified
  `Backlog → Ready`; FLLWUP-115's goal and criterion 3 amended before promotion.
- **P1-6 (FLLWUP-115 criterion-3 reconciliation — product-owner job-2).**
  Criterion 3 amended from the empirically false "no card body line matches the
  key label" claim to a corpus-wide behavioral-equivalence pin between the
  whole-file and frontmatter-scoped derivations.
- **P1-7 (first merge).** The human selected fully unattended.

The class-enumeration record is an ordered five-entry array with per-class
structured `n/a: ` reasons naming the absent surface; `council/validate.py`
checks its grammar only. Committed at `e12afbd` under P1-1.

## Merges

Every card ran mode **Deliberate** (substrate read, not a seat's report);
all five criteria held at each pinned head. `gates` workflow `SUCCESS` read via
`gh pr check-runs` keyed on `workflow`, on every PR head and every merged SHA.

| Card | Mode | Runner ROOTs | PR | Match-head SHA | Merged SHA | Basis |
|---|---|---|---|---|---|---|
| FLLWUP-115 | Deliberate | job-3, job-4 | #114 | `b12149e0ac8e990d737366b3f30d77dc199169f6` | `71734775a0635059127bd265dbebf790e76a7f33` | mode Deliberate, criteria 1, 2, 3, 4, 5 satisfied |
| FLLWUP-114 | Deliberate | job-7 | #115 | `384983e448b03cc034b81699f6a9a0e93d63ede9` | `be7d6671ebd3c4a0768edfbc69044125c6b95050` | mode Deliberate, criteria 1, 2, 3, 4, 5 satisfied |
| FLLWUP-116 | Deliberate | job-10, job-12 | #116 | `4515efe9ba220b445a23923f353739797be7c51f` | `fee63349a99d20bf7cb9dbeb78cce22b82b7afff` | mode Deliberate, criteria 1, 2, 3, 4, 5 satisfied |

Each merge executed with `--match-head-commit <X>` under the P1-1 admin bypass.
The orchestrator independently re-read the substrate mode
(`council_route op:"authority"`) and the `gates` check on each merged SHA after
`DONE`. The first merge ran fully unattended at the human's explicit direction
(P1-7).

**Merged-tree acceptance gates** (at `af109e0`): `bun test` **1530 pass /
6 skip / 0 fail** (113.67s); `bunx tsc --noEmit` clean; `python3
council/validate.py` → "All council artifacts valid"; `council/preflight.sh`
→ PASS.

## Escalations and rulings

| Dispatch | Card | Ruling seat | Outcome |
|---|---|---|---|
| job-1 | EPIC-24 | steward | Build order FLLWUP-115 → FLLWUP-114 → FLLWUP-116, serial; no retirement |
| job-2 | FLLWUP-115 | product-owner | Promoted the three children `Backlog → Ready`; amended criterion 3 to the behavioral-equivalence pin |
| job-5 | FLLWUP-115 | product-owner | Ratified both step-13 candidates `File` (→ FLLWUP-117/118); candidate 1 bound to the docs-reconcile path |
| job-8 | FLLWUP-114 | product-owner | Ratified both step-13 candidates `File` (→ FLLWUP-119/120) |
| job-11 | FLLWUP-116 | product-owner | Q1 ruling (a): goal text stands, implementation record must carry the scoped-reading sentence verbatim; Q2 confirmed the `["']` widening to both `matchAll` sites |
| job-13 | FLLWUP-116 | product-owner | Ratified the single step-13 candidate `File` (→ FLLWUP-121) |
| job-15 | EPIC-24 | steward | EPIC-24 closes `Done`; re-home its five open follow-ups to a new EPIC-25 |

## Follow-ups filed

Every candidate was ratified by `product-owner` at the step-13 gate, applied on
a confirming runner dispatch, and written as its own card; none was a prose
bullet or a silent drop.

- **FLLWUP-117** — Close the cardEpicKey throw-site JSDoc drift (from FLLWUP-115)
- **FLLWUP-118** — Pin the shared FRONTMATTER_RE anchor shape at the byte-0 boundary (from FLLWUP-115)
- **FLLWUP-119** — Repair the EPIC-* smoke-fixture card faces so real model-driven flows can dispatch them (from FLLWUP-114)
- **FLLWUP-120** — Cover the print-mode stale-ctx parent crash when a dispatched job outlives its turn (from FLLWUP-114)
- **FLLWUP-121** — Pin test/stub-child.test.ts's child-scheduling race (from FLLWUP-116)

All five were filed under `epic: EPIC-24`, then re-homed to **EPIC-25** by the
steward closure ruling (job-15), because a `Done` epic must not carry open
children. No candidate was held or unresolved at run end.

## Runner usage blocks (verbatim from `council_wait`)

### FLLWUP-115

First attempt — stalled (hub anti-stall monitor killed it at 18.4m while its
`council_wait` blocked; the outer stall window was raised for the resume):
```
[job-3] seat=council-runner state=stalled stopReason=toolUse elapsed=18.4m turns=12 tokens=in 65411/out 11282/cR 371840/cW 0/reason 3522/total 448533 cost≈$0.0340 (catalogue)
usage  subtree     basis=stream-assistant  turns=27 tokens=in 158414/out 38613/cR 734144/cW 0/reason 25058/total 931171 cost≈$0.0727 (catalogue)
```
Resumed (final):
```
[job-4] seat=council-runner state=done stopReason=stop elapsed=84.4m turns=74 tokens=in 244939/out 35669/cR 4110976/cW 0/reason 14155/total 4391584 cost≈$0.2601 (catalogue)
usage  subtree     basis=stream-assistant  turns=202 tokens=in 619593/out 139992/cR 9175872/cW 0/reason 78809/total 9935457 cost≈$0.5430 (catalogue)
```
Step-13 application turn (job-6): `9.4m · turns=15 · total 674671 · $0.0495`.

### FLLWUP-114

```
[job-7] seat=council-runner state=done stopReason=stop elapsed=215.1m turns=93 tokens=in 635824/out 52454/cR 6296768/cW 0/reason 13706/total 6985046 cost≈$0.4364 (catalogue)
usage  subtree     basis=stream-assistant  turns=426 tokens=in 1730035/out 394107/cR 31107840/cW 0/reason 256506/total 33231982 cost≈$1.7160 (catalogue)
```
The card's own live smoke caught a real defect on its first run (the flash
runner read `council/procedures/features-deliver.md` at startup); the owner
fold-in added an explicit never-read rule to `council/agents/council-runner.md`
and fixed the print-mode stale-ctx parent crash. Step-13 application turn
(job-9): `3.0m · turns=9 · total 334470 · $0.0245`.

### FLLWUP-116

Step-6/7 escalation attempt:
```
[job-10] seat=council-runner state=done stopReason=stop elapsed=58.8m turns=21 tokens=in 141451/out 32340/cR 810368/cW 0/reason 9273/total 984159 cost≈$0.0779 (catalogue)
usage  subtree     basis=stream-assistant  turns=110 tokens=in 453170/out 200215/cR 5225728/cW 0/reason 142062/total 5879113 cost≈$0.2810 (catalogue)
```
Resumed after the product-owner ruling:
```
[job-12] seat=council-runner state=done stopReason=stop elapsed=113.5m turns=65 tokens=in 191478/out 35935/cR 3565760/cW 0/reason 20455/total 3793173 cost≈$0.2250 (catalogue)
usage  subtree     basis=stream-assistant  turns=227 tokens=in 689655/out 139136/cR 12288320/cW 0/reason 86513/total 13117111 cost≈$0.6996 (catalogue)
```
Step-13 application turn (job-14): `3.2m · turns=12 · total 448238 · $0.0321`.

## Run closure

- **EPIC-24 closed `Done`** on observed acceptance: all three named children
  merged with `gates` green on every merged SHA, and the three merged-tree
  commands green. Steward (job-15) ruled closure on the named acceptance, not
  "all children Done".
- **EPIC-25 created** grouping the five open follow-ups, replayed from the
  EPIC-23→EPIC-24 precedent; the five children re-homed `epic: EPIC-25` and the
  EPIC-24 board line moved to `Done` (commits `9bfbbbd`, orchestrator).
- **Board repair:** the FLLWUP-119 board line had EPIC-24's title suffix
  duplicated onto it by the step-13 application runner; the orchestrator's
  board-title audit found it, repaired it, and committed (`52ecf42`) under P1-2.
- **No `RETIRED`, no `Needs Human`, no `HALT`.** One runner stall (FLLWUP-115
  first attempt) was recovered by re-dispatch; one board record error was
  repaired; three step-6/7 or step-13 `ESCALATION`s were each serviced with a
  ruling-seat dispatch and a resuming runner.
- **Process notes:** (1) an outer runner's stall window must exceed the longest
  internal `council_wait` the runner issues — a runner blocked on a child emits
  no stdout, so `stall_minutes` below the child ceiling kills it mid-wait; the
  resumed runner used `stall_minutes: 55`. (2) A timed-out runner keeps running
  (the timeout is informational) and `council_wait` treats `timeout` as settled,
  so a timed-out runner must be polled until its process exits. (3) The steward
  closure report (job-15) truncated mid-sentence at the model's output limit;
  its operative rulings (close EPIC-24, create EPIC-25, re-home) were complete
  and were executed.
- Version bump is not a closure condition; `package.json` is unchanged by this
  run. No wiki-ingest was performed in-run; the durable material is this ledger,
  the per-card records, and the merged tree.