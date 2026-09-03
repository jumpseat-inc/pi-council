# EV-16 escalation ruling — grader placement topology (binding)

This ruling resolves the one open-judgment dispute on the EV-16 deliberation
record (`council/cards/EV-16.md`, committed `5e77cf8`): where does the eval
harness place the grader. The consolidator's synthesis ("Until it is called,
the spec cannot write down grader topology, the cost-aggregation exclusion
rule, or the cellId linkage field without picking a winner the deliberation
refused to pick") is the trigger; this ruling makes that call.

The dispute also surfaced a prose mismatch (owner round-2 and principal
round-3 both said `council/eval-results/` is "committed for leaderboard
comparability," contradicting binding Phase 1 ruling R-1 — local-only,
self-gitignored, NOT committed). The consolidator classified that as a
prose mismatch the spec author corrects to R-1, not an open judgment call.
I agree and the spec must use R-1's wording verbatim; this ruling is silent
on it beyond naming it.

## Question, restated

Where does the grader (the judge-seat dispatch that grades a cell's
open-ended rubric criteria) live in the dispatch tree, and how do cell↔
verdict linkage and cost aggregation follow from that choice?

- **Option A — Harness-dispatched sibling (principal, round 3):** the harness
  spawns the grader as a child of the **command** job (same parent as the
  cell, not the cell itself). Linkage is by an explicit `cellId` field on
  the verdict record. Cell subtree = exactly the cell driver and whatever it
  spawns; the grader is structurally outside that subtree.
- **Option B — Cell-driver descendant (owner, round 2 Q4b, reaffirmed round 3
  framing):** the cell driver dispatches its own grader as a child of the
  **cell** job. `parentJobId = cell job id` links them. Cell scope =
  subtree rooted at the cell job; command scope = subtree rooted at the
  command's job.

## Facts I verified directly (not via Skeptic summary)

1. **`childEnv` (runs.ts:139–141) copies `process.env` forward and injects
   `COUNCIL_RUN_ID` / `COUNCIL_JOB_ID` per spawn.** A child process inherits
   the parent's env as the base. So if the harness sets `COUNCIL_MODEL=X`
   via the parent's env-spawn argument to a cell-driver child, that child's
   *own* `council_dispatch` calls (`hub-tools.ts:107`) spread
   `process.env` into the next spawn — the grader inherits `COUNCIL_MODEL=X`
   unless the cell driver explicitly overrides it.

2. **`hub-tools.ts:107` is `env: childEnv({ ...process.env, COUNCIL_SEAT:
   seat.name }, runId, jobId)`.** This is the single point where a cell
   driver's grader dispatch would inherit the cell's `COUNCIL_MODEL` env.
   To shadow it for the grader dispatch, the cell driver must pass an
   explicit `model` parameter on its `council_dispatch` call (Option A's
   harness-owned dispatch does this once, at the harness level; Option B's
   cell-driver-owned dispatch must do it inside the cell-driver LLM, which
   is precisely what the principal's conditional (1) requires).

3. **`writeJobManifest` (hub.ts:89–101) persists only id/seat/model/
   parentJobId/pid/sessionId/state/startedAt/settledAt/exitCode.** No
   usage, no stopReason, no elapsedMs. Forest cost aggregation requires new
   plumbing — extend `RunManifest` with usage + stopReason at `settle()`,
   then sum the subtree. Confirmed.

4. **Judge has `tools: [Read, Bash]`, `spawns: []`, no `hub` grant.**
   `judge.md` frontmatter. So the judge LLM cannot dispatch its own
   children. The "who dispatches the grader" decision is entirely the
   *caller's*, not the judge's.

5. **`gradedBy` pattern from owner's round 2 (Q2):** verdict records already
   carry `gradedBy` as the actual grader model id, append-only across
   re-grades. `cellId` is the symmetric extension to that record shape.

## Ruling

**Option A — grader is a harness-dispatched sibling of the cell. Cell↔
verdict linkage is by an explicit `cellId` field on the verdict record.
Cell subtree cost = exactly the cell-driver's own spend (and whatever the
cell driver itself spawns, which is the harness's instrumented scope);
the grader is structurally outside the cell subtree, so no exclusion
rule is needed.**

### Why

**The cell-invariance contract is honored by topology, not by bookkeeping.**
"Only the model varies" means cell subtree cost = the cell-model's cost
exactly. Option A delivers this for free — the grader is a sibling, not
in the cell's `parentJobId` chain, so summing over the cell subtree
structurally cannot include grader spend. Option B requires either (i)
the cell driver LLM to override `COUNCIL_MODEL` on its grader dispatch
every time — the principal's conditional (1) — or (ii) every cost
aggregator to know that `seat == "judge"` (or `record.gradedBy` is set)
means "exclude this node from the cell-sum." Option (i) is fragile
because it relies on the cell-driver LLM cooperating with the harness's
pin policy; Option (ii) is fragile because exclusion rules in cost
aggregators are exactly the kind of plumbing that drifts silently across
the `hub.ts is stable` boundary (AGENTS.md convention 7). Option A
removes both failure modes structurally.

**The principal's two conditional requirements are themselves the proof.**
The principal's round-3 conditional on Option B is "if the descendant
topology is kept, the spec MUST require (1) the grader dispatch always
carries the explicit fixture pin so it shadows the ambient override; and
(2) grader nodes are excluded from cell/command cost-latency
aggregation." If keeping Option B requires both of these plumbing fixes
anyway, the question is not "do we add this plumbing" — it's "do we add
this plumbing inside the cell driver LLM and inside every cost
aggregator, OR do we add one harness-owned grader dispatch site and
inherit clean topology." Option A is the cheaper and more honest choice.

**`cellId` is consistent with the existing verdict-record pattern, not a
new mechanism.** Owner's round-2 Q2 already established `gradedBy` as
the verdict record's model-id field, append-only across re-grades.
Adding `cellId` to the same record is the symmetric extension — verdict
records carry enough fields to be self-describing, independent of the
dispatch tree. The owner's `parentJobId`-based linkage conflates
"verdict lives in cell's tree" with "verdict is about cell's output" —
those are different facts. A verdict record's `cellId` makes the latter
explicit and survives any future topology rearrangement.

**Owner is right that per-cell mean/σ over the SCORE is well-defined
under either topology.** That argument does not distinguish A from B,
because mean/σ is over the cell's score, not the cell's spend. The
distinction is in cost/latency aggregation, which is what Option A
structurally cleans up.

### Spec text the runner must write

The spec's "grader placement" section commits to:

1. **Grader dispatch site is the harness, not the cell driver.** The eval
   harness, after the cell driver settles and its result record is
   written, dispatches the judge seat as a harness-owned job with the
   cell job's id as `cellId` (a parameter on `council_dispatch`, the same
   injection point EV-17 adds for `model`/`thinking`). The judge dispatch
   carries the fixture-pinned grader model as an explicit `model` param
   (no reliance on `COUNCIL_MODEL` env inheritance), and the harness
   writes the verdict record with `cellId` + `gradedBy` + per-criterion
   pass/fail + cost/latency attribution to a `grading` scope (not the
   `cell` scope).

2. **Cell subtree = `parentJobId`-chain rooted at the cell job.** Grader
   is OUTSIDE this subtree (its `parentJobId` is the command job, same
   as the cell driver). Forest aggregation sums cost/latency/turns over
   subtrees; the cell column reports cell-subtree spend, the command
   column reports command-subtree spend, the grading column reports
   grader-subtree spend. Three columns, not one. No exclusion rule.

3. **Verdict record schema is `{ cellId, gradedBy, fixtureVersion,
   rubricVersion, perCriterion: [{criterionId, verdict, evidence}],
   gradedAt }` plus a `gradingUsage: {input, output, cost, elapsedMs,
   stopReason}` block.** `cellId` is the linkage field; topology is not.
   `gradedBy` is the model id that ran the grade (appended across
   re-grades; first write wins for the cell, subsequent writes are new
   records).

4. **The cell driver does NOT have authority to dispatch a grader.** No
   fixture rubric criterion may route through a cell-driver-spawned
   grader — the harness owns all grader dispatches. The judge seat's
   `spawns: []` is already correct for this; the spec just states it
   (and the harness's grade loop is what calls the judge, never a
   cell-driver LLM).

5. **Both ambient `COUNCIL_MODEL` inheritance and harness-owned grader
   dispatch are required.** Option A's sibling topology relies on the
   round-3-converged env-carried override to carry the cell-model value
   to the cell driver; the grader dispatch then sets the fixture pin
   as an explicit `model` param on the harness's `council_dispatch` call
   so it beats the env. The spec states both, in that order, because
   the cell-model carrier and the grader-pin carrier are different
   surfaces with different precedence rules.

## Options rejected

- **Option B (cell-driver descendant)**: rejected because it requires two
  new pieces of plumbing — explicit fixture-pin shadowing at every cell
  driver + grader exclusion at every cost aggregator — to defend the
  cell-invariance contract. Option A removes both requirements
  structurally. The owner's "per-cell mean/σ is well-defined" is true
  under either topology, so it does not bear the weight the owner asks
  it to bear; the real question is cost/latency aggregation, where
  Option A wins.

- **Grader as direct child of the command job with `cellId` linking (the
  same topology as Option A but framed differently)**: this is Option A
  by another name. Adopted. The naming distinction in the ruling is
  "sibling of the cell" — both the cell driver and the grader share
  the same parent (the command job), and linkage is by `cellId`. This
  is the spec text the runner writes.

## Grounding

- `council/cards/EV-16.md` rounds 1–3 + Skeptic report + consolidator
  synthesis (the dispute as the deliberation left it).
- `extensions/hub-tools.ts:107` — `env: childEnv({ ...process.env,
  COUNCIL_SEAT: seat.name }, runId, jobId)` is the propagation point
  the principal's argument turns on.
- `extensions/hub.ts:89–101` — `writeJobManifest` field set (no usage,
  stopReason, elapsedMs), confirming forest cost aggregation is new
  plumbing either way.
- `extensions/runs.ts:139–141` — `childEnv` copies `process.env`
  forward, the env-rides-the-tree precedent.
- `extensions/child.ts` — `runChildMode` re-enters `registerHubTools`
  inside the child, so a grandchild's `council_dispatch` resolves seat
  from frontmatter / `.council.json` with no override input. Confirms
  Option B's grader-inherit-ambient risk.
- `council/agents/judge.md` — `tools: [Read, Bash]`, `spawns: []`,
  no hub grant; judge cannot dispatch.
- `vault/wiki/hub-job-supervision.md`, `vault/wiki/run-transcripts.md`
  — engine context for job forest + manifest structure.
- `AGENTS.md` convention 7 (`hub.ts is stable — change behavior only with
  a failing test first`) — bear in mind for the new
  `RunManifest`-with-usage plumbing whichever topology wins.

## Reversibility

Trivial at the spec level — this is a design document, not code. The
spec's grader-topology section + cost-aggregation section + cellId
schema are a one-PR edit away from either topology. The implementation
cost difference is asymmetric: Option A's spec commits EV-17 to
harness-owned grader dispatch and EV-20 to per-scope aggregation
columns; Option B's spec commits EV-17 to grader-shadowing plumbing
inside every cell-driver flow plus EV-20 to per-record exclusion rules.
Either way, the override mechanism (env-carried `COUNCIL_EVAL_MODEL`,
round-3 converged) is the same and is not affected by this ruling.

The cost of being wrong is rework in EV-19 (rubric verifier) and EV-20
(matrix runner) — both downstream cards stay `Backlog` per EPIC-4 and
have not started implementation. So even a wrong ruling here costs a
spec edit, not a re-implementation.

## Summary for the runner

| Question | Ruling |
|---|---|
| Grader topology | **Harness-dispatched sibling of the cell** (parent = command job, same as cell) |
| Cell↔verdict linkage | Explicit `cellId` field on the verdict record, NOT `parentJobId` |
| Cost aggregation | Cell column = cell-subtree sum; grader column = grader-subtree sum; no exclusion rule |
| Verdict schema | `{ cellId, gradedBy, fixtureVersion, rubricVersion, perCriterion: [...], gradedAt, gradingUsage: {...} }` |
| Cell-driver grader authority | Forbidden — the harness owns all grader dispatches; cell drivers cannot spawn graders |
| Prose mismatch on `council/eval-results/` | Spec uses R-1 wording verbatim (local-only, self-gitignored, NOT committed) — not a judgment call, an application |

The runner writes the spec's grader-topology section + cost-aggregation
section + verdict schema per items 1–4 above, using R-1's storage
wording verbatim, then proceeds to step 7.
