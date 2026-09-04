# EPIC-4 run ledger — model eval harness for council commands and seats (2026-09-03/04)

Immutable raw record of the autonomous `/features-deliver EPIC-4` run that
shipped in v0.15.0 (EV-16..EV-19) and v0.16.0 (EV-20..EV-21). Compiled by the
orchestrator from the committed card records (`council/cards/EPIC-4.md`,
`EV-16.md`..`EV-21.md`), the specs (`docs/superpowers/specs/2026-09-03-EV-16-design.md`,
`2026-09-03-EV-19-design.md`, `2026-09-03-EV-20-design.md`,
`2026-09-03-EV-21-design.md`), and the binding ruling packets under
`vault/raw/`. Prose below is summary; verbatim records live in the cards and
specs, which this ledger points at.

## What shipped

Six PRs, each merged on the deterministic five-criterion gate (owner gates
green in full; `gates` workflow SUCCESS on the PR head SHA; no blocking
Skeptic objection; judge PASS; no Needs Human / outstanding ruling), pinned
with `gh pr merge --match-head-commit`, CI re-verified green on each merged
SHA before the card was set `Done`:

- **EV-16** (PR #11, merged `d7f97d8`) — the design spec: what "accurately
  measure" means for agent commands and seats, the harness architecture,
  R-1 (`council/eval-results/` local-only gitignored) / R-2 (repeat default
  3), the per-run model override seam, the rubric/verifier split, and the
  repeat-run confidence methodology (E1 CI-on-mean-difference triage, E2
  length-flagged-never-zero, E3 terminal-state histogram).
- **EV-17** (PR #12, merged `ad53248`) — the per-run model override: a
  `model`/`thinking` dispatch parameter that shadows `.council.json` and
  frontmatter for eval dispatches (spawned-job env, never parent
  `process.env`).
- **EV-18** (PR #14) — 16 shipped fixtures: one per packaged seat and one
  per shipped procedure, each with `fixture.json` (kind: seat|procedure,
  pinned seed `treeDigest`, graderModel) + rubric; whole-task-dir
  override-first-hit; 7 gate-only fixtures (no judge criteria), 9
  judge-bearing.
- **EV-19** (PR #15, merged `402abb7`) — the pure scorer: `gradeCell` over
  a GradeIO bound to a persisted snapshot; VerdictRecord
  (`cellId, gradedBy, fixtureVersion, rubricVersion, perCriterion,
  gradingUsage`) append-only keyed `(cellId, gradedBy)`; ResultRecord
  keyed `(cellId, repeat, scoredUnder)` per the O1 escalation ruling.
- **EV-20** (PR #16, merged `fb858b0`) — `/council-eval`: the matrix runner
  (task × models × repeat; no-arg lists fixtures; catalogue pre-validation
  before any dispatch; echo-then-run before any spawn; per-repeat
  `[council-eval]` transcript lines). New `extensions/eval-runner.ts`
  (store writers keyed on the full tuple with `v__`/`s__` filename
  discriminators; `cellScope` terminal block stamped at settle: usage,
  elapsedMs, stopReason, repoState; snapshot persistence default ON at
  `council/eval-results/<cellId>/r<N>/snapshot/`; scratch-tree cell
  execution through the shared dispatch primitive parameterized by cwd;
  same-hub spawn, both roots sharing one COUNCIL_RUN_ID). RunManifest
  gains usage/stopReason + pure `sumSubtree` (failing-test-first, the one
  sanctioned hub.ts touch). VerdictRecord gains `repeat` (Q1, mirror of
  O1); version pair rides every store key (Q1-D1); `scoredUnder: "self"`
  sentinel for gate-only fixtures (Q1-D2). Smoke Phase 3 (Q3): headless
  `/council-eval --repeat 2` against the `eval-smoke` gate-only fixture
  with live-vs-re-derivation byte-identity.
- **EV-21** (PR #18, merged `22630ff`) — `/council-leaderboard`: pure read
  over the store; group-by `(taskId, model, thinking, fixtureVersion,
  rubricVersion, scoredUnder)` with kind from a read-time `loadFixture`
  join (+ `unknown` bucket, J-3); rank axis `model[:thinking]`, grader
  never a ranked row, gate-only rows separated; mean-desc sort +
  adjacent-pair `compareCellTriage` tie-bands via additive
  `CellSummary.gradedScores`; four truthful empty states (A dir-missing /
  B gate-only-only / C n<2 / D length-majority); σ header not "VARIANCE"
  (J-1); CONFIRM-2 fixed the landed live `/council-eval` summary's
  version-blind group key in place (failing-test-first, additive
  `CellSummary.fixtureVersion/rubricVersion`, `summaryLines` version
  stamp, single-version byte-identity preserved); smoke Phase 4 (J-2,
  mandatory; optional bump+rerun out of default scope).

## The binding ruling chain

- **Grader topology** (`2026-09-03-po-ev16-grader-topology.md`): Option A —
  grader is a harness-dispatched sibling of the cell; cell↔verdict linkage
  by explicit `cellId`; cell-invariance honored by topology, not
  bookkeeping; three cost columns (cell/command/grading), no exclusion
  rule.
- **O1** (`2026-09-03-po-ev19-resultrecord-key.md`): ResultRecord store key
  extended to `(cellId, repeat, scoredUnder)` — the symmetric mirror of the
  VerdictRecord's `gradedBy` dimension; silent loss of M2's score rejected.
- **Promotion cadence** (`2026-09-03-po-epic4-promotion-cadence.md`):
  P1–P4 chain (EV-18 → EV-19 → EV-20 → EV-21), P5 automated — the
  orchestrator promotes as soon as the predecessor's merge SHA is on local
  main and `validate.py` is clean, no re-asking. Applied at every link.
- **EV-20 Q1/Q2/Q3** (on `council/cards/EV-20.md`): Q1 VerdictRecord gains
  `repeat` (key `(cellId, repeat, gradedBy)`) + D1 version-pair-in-key +
  D2 `scoredUnder: "self"` sentinel + cellId string form
  `taskId|model[:thinking]`; Q2 persist snapshots default ON with
  `treeDigest` in `cellScope`; Q3 smoke Phase 3 mandatory ("the first
  Council command without an end-to-end falsifier is a defect").
- **EV-21 ruling** (`2026-09-03-po-ev21-ruling.md`): CONFIRM-1 name
  `/council-leaderboard`; CONFIRM-2 fold-in (version-pair-aware
  `summarizeStore` rides EV-21 — byte-identity contract forbids fixing one
  side); J-1 copy bound (σ not VARIANCE; four-state empty spectrum; tier
  phrases; both slices default); J-2 Phase-4 mandatory, bump+rerun out of
  default scope; J-3 kind = current-fixture-kind accepted with disclosure.

## Run mechanics worth keeping

- **Skeptic gate-integrity culture**: every verification re-ran all three
  gates AND proved each gate can fail (injected type break, injected test
  failure, invalid card state). Adversarial probes were reproducible
  commands, not assertions.
- **Empirical bug confirmation**: the EV-21 skeptic reproduced the
  version-blindness defect with a throwaway two-version store before the
  fix plan was blessed (`n_attempted=4, mean=0.625` blended across
  incomparable rubric versions).
- **Divergent-main repair**: the run raced a parallel orchestrator session
  pushing EV-11/EV-12 runs to origin/main. Local main held five unpushed
  EV-20 record commits. Reconciled by union merge (merge commits
  `04ba11c`, `6a24eca`), deliberately NOT rebase — rebase would have
  rewritten SHAs cited in card records ("based at c850d29"). A later
  EV-12 reconcile had regressed EV-20's board state to `Ready` from a
  stale snapshot; the union restored `In Progress`. A release commit
  (`v0.15.0`) raced a third push and was rebased over. Each reconcile:
  fetch → merge → union-resolve board/cards → validate.py → push.
- **Judge REJECT precedent (from EPIC-3, reused here)**: a judge dispatch
  that rests on confabulated premises is re-dispatched with the corrected
  factual record — verdict coaching is not permitted, factual correction
  is.
- **Board-state races**: parallel sessions reconciling from stale board
  snapshots repeatedly regressed EV-20's state (Ready vs In Progress).
  Resolution rule that worked: the card's own run record is authoritative
  for its own state; the union merge takes the in-flight card's state.

## Follow-ups filed (human-approved at run close, scoped under EPIC-4)

- FLLWUP-5 — criterion-type-aware judge projection (from EV-19 step 13).
- FLLWUP-6 — judge-bearing fixture smoke (Phase 5): ranked rows, grader
  rows, and tie rendering have unit-test falsifiers only; the smoke
  exercises gate-only stores exclusively.
- FLLWUP-7 — eval-results retention: the store is append-only and never
  pruned; snapshots default ON; disk growth unbounded.
- FLLWUP-8 — `/council-leaderboard [task]` drill-down (deferred from v1 by
  CONFIRM-1).

## Versions

v0.15.0 carried EV-16..EV-19 (release commit raced this session's pushes);
v0.16.0 carried EV-20..EV-21 (bumped in PR #18).
