# EV-60 — Cost-per-card and cost-per-epic baseline from existing run manifests

Card: `council/cards/EV-60.md` (EPIC-13, mechanical path — the card is the spec).
Branch: `ev60-cost-baseline` (worktree `/home/tista/codes/pi-council-ev60`, off local `main` @ `240353f`).

## What the card pins (verbatim contract)

- `extensions/cost-baseline.ts` exposes **pure** `costByCard(manifests)` and
  `costByEpic(manifests, epicId)`.
- Per-card values each equal `sumSubtree(manifests, cardRootId, "cost")` over a
  hand-built two-epic fixture forest.
- A card with no settled spend appears in the result as an observed `0`, never
  omitted.
- The report names every epic in scope and its child cards.
- `formatCostBaseline(report)` returns plain text lines — one per epic, one per
  child card, each carrying its summed cost and the number of runs behind it —
  pure, no model call; a golden test pins its bytes.
- Read posture: the module consumes the exported accessors of
  `extensions/runs.ts` (`sumSubtree`) and never touches the run directory; a
  test asserts no direct run-directory access (import from the run-substrate
  module, no fs/path/runsDir use).
- No new interactive surface.

## Design decisions (grounded)

- **Grouping convention** — manifests carry no card/epic fields
  (`RunManifest` in `extensions/runs.ts`: id, seat, parentJobId, usage, …), so
  the two-epic fixture forest encodes identity structurally, and the module
  documents it: **depth-0 nodes (forest roots, `parentJobId === null`) are
  epic roots** (id = epicId); **depth-1 nodes are card roots** (id = cardId);
  anything deeper is a seat dispatch. This is the only convention that puts two
  epics in one manifests array with no schema change. Nothing wires this module
  to live data in this card — it is measurement groundwork (EPIC-13 R2 order).
- `costByCard(manifests)` → `Map<cardId, number>`: for every card root, the
  value is exactly `sumSubtree(manifests, cardRootId, "cost")` — the pinned
  equality holds by construction (one call per card root), which is also what
  makes the test meaningful: the fixture's hand-computed sums must agree.
- `costByEpic(manifests, epicId)` → `sumSubtree(manifests, epicId, "cost")`
  when `epicId` names a forest root; `0` when it does not (same missing-node
  behavior as `sumSubtree`, never a throw — the zero rule is the card's own).
  The epic root's own usage is included: spend above the card level (gate
  calls, per EPIC-13) is the epic's spend.
- **Runs behind a figure** — the count of manifests in that subtree (inclusive)
  that carry a settled `usage` tuple. Each settled dispatch is one run behind
  the number; a card with no settled spend shows `runs=0` beside `cost=$0.0000`.
- **Money literal** — `cost=$X.XXXX` (`.toFixed(4)`), matching the repo's
  existing money fragment shape in `extensions/usage-format.ts`. The summed
  scalar is basis-agnostic (it sums the scalar `cost` field); no `≈`/`(catalogue)`
  qualifier is claimed for an aggregate of mixed-basis rows.
- **Ordering** — epics and cards sorted by `id.localeCompare(…, { numeric: true })`,
  the same ordering `buildTree`/`readManifests` already establish.
- Report types: `CostBaselineReport { epics: EpicCostEntry[] }`,
  `EpicCostEntry { epicId, cost, runs, cards: CardCostEntry[] }`,
  `CardCostEntry { cardId, cost, runs }`. `formatCostBaseline(report)` →
  `string[]` (one line per entry), pure.

Golden format (pinned by test):

```
epic epic-alpha cost=$1.0000 runs=3
  card card-a1 cost=$0.7500 runs=2
  card card-a2 cost=$0.0000 runs=0
  card card-a3 cost=$0.2500 runs=1
epic epic-beta cost=$0.2000 runs=3
  card card-b1 cost=$0.2000 runs=3
  card card-b2 cost=$0.0000 runs=0
```

## TDD sequence

1. RED — `test/cost-baseline.test.ts`: fixture forest (two epics, known spend,
   one zero-spend card with a zero-spend child, one childless zero card);
   assert `costByCard` values equal `sumSubtree` at each card root; assert the
   zero card is present as 0; assert `costByEpic` for both epics and the
   unknown-id zero; assert report shape names both epics and all five cards;
   assert the no-direct-run-directory-access posture (module text imports
   `./runs.ts`, contains no `node:fs`, no `runsDir`/`readFileSync`/`readdirSync`);
   golden byte pin of `formatCostBaseline` over the fixture. Run → red (module
   absent).
2. GREEN — implement `extensions/cost-baseline.ts` (pure; imports only
   `sumSubtree` + types from `./runs.ts`).
3. Full gates in order: `bash council/preflight.sh`; `bunx tsc --noEmit`;
   `bun test`; `python3 council/validate.py`.

## Out of scope

No wiring to the hub, no board/procedure/seat changes, no card-file edits
beyond what the record push discipline handles elsewhere, no ledger (EV-61).
