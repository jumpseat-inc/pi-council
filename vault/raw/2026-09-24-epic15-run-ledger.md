# EPIC-15 Run Ledger

- Run: `/features-deliver EPIC-15` — "Usages tool creates its output directory before writing the cache"
- Run id: `2026-09-22T10-57-54-390Z-2547006-nsgn9w`
- Orchestrator: the human's agent, autonomously
- Phase 0 preflight: **PASS** (`council_preflight` → ok; `bash council/preflight.sh` → `PASS: preflight clean`); `gh` authenticated as `tistaharahap`; clean tree
- Seats resolved by name: all nine (`owner`, `principal`, `designer`, `skeptic`, `consolidator`, `judge`, `product-owner`, `steward`, `council-runner`), no repo-local overrides
- Build order (R2): `BUG-2 → FLLWUP-105 → FLLWUP-106`; strictly serial, one runner at a time
- Gate state throughout: `.council.json` `gate.mode: active` — **but both gate domains failed mechanically** with the `noul` answer-shape drift (open FLLWUP-104). `council_route op:route` returned fallback **Deliberate** ("no recorded decision for the current packed state") for all three cards, and the merge check read mode `Deliberate` from the run substrate. The run proceeded unchanged; the failure direction (card gate → full Deliberate) is safe.
- Merge-time environment: `main` ruleset requires 1 approving review + linear history; admin bypass authorized run-scoped by R1.

## Phase 1 rulings (binding, recorded on every card face)

- **R1 — merge authorization.** Run-scoped human authorization for `gh pr merge <PR> --squash --admin --match-head-commit <X>`, `<X>` the exact head SHA criterion 2 was read against. Run-scoped only; a SHA mismatch is a HALT, not a retry. The first autonomous merge paused for the human; the remaining merges ran unattended at the human's explicit direction.
- **R2 — build order.** `BUG-2 → FLLWUP-105 → FLLWUP-106`, serial.
- **R3 — copied-skill refresh route (the product-owner escalation resolved).** Keep the manual delete-and-recopy remediation; `/council-update` does **not** take on refresh of `/council-init`-copied payloads outside `council/scaffold/`. Widening it is separate scope.
- **R4 — cache-health report row.** Product-owner's decline stands; BUG-2 is the ordering fix only. Trigger: any post-fix cache-write failure whose parent directory *does* exist opens a new card.

## Merges (five-criteria check satisfied at the checked head for every card)

| Card | Mode | Runner result | PR | Match-head SHA | Merged SHA | Notes |
|---|---|---|---|---|---|---|
| BUG-2 | Deliberate | DONE | #104 | `8a4b2a93e1c4bd8b41aad6caf4d9c3872a64d36d` | `59fad63be0f348f240201bcc598010f376cd0d01` | first autonomous merge (paused for watch); step 13 held 4 candidates (tool gap) |
| FLLWUP-105 | Deliberate | ESCALATION → DONE | #105 | `2ebed9a3d3a33f655ded41d8de8282af91bf3b46` | `a0b27ca0ad061ea6a52842ec53babe4ec4dd29e4` | 1 product-owner ruling (job-3); 1 verify cycle |
| FLLWUP-106 | Deliberate | ESCALATION → DONE | #106 | `8cede8b58276cc4feadced3771559e6308fec120` | `98a62a95e9f9ef0f1842ca568b59fcdd3049aff8` | 1 product-owner ruling (job-6); 1 verify cycle |

Every merged SHA is an ancestor of `origin/main`; the `gates` workflow `SUCCESS` on every checked head SHA (keyed on the `workflow` field) and re-verified on every merged SHA. Owner gates re-run by the orchestrator on each merged SHA: `bunx tsc --noEmit` exit 0, `python3 council/validate.py` clean, targeted suites green (BUG-2 14 pass, FLLWUP-105 15 pass, FLLWUP-106 6 pass). No `HALT`, no `RETIRED`, no `Needs Human`, no denied merge.

## Escalations and rulings

| Escalation | Card | Ruling seat | Outcome |
|---|---|---|---|
| V1 vs V2 ship-text; pin-boundary residual; two step-13 candidates | FLLWUP-105 | product-owner (job-3) | Q1 ship **V1 verbatim**; Q2 route the pin-boundary residual to a follow-up and amend Acceptance bullet 2; Q3 **File** both candidates (FLLWUP-107, FLLWUP-108) |
| Prose (lead/body/carve-out/likelihood) + pin reading | FLLWUP-106 | product-owner (job-6) | All four prose items ruled to the tested owner text; bullet 3 confirmed as the **O-conformant pin** with three exact predicates; two step-13 candidates **Drop**ped; no escalation |

## Follow-ups filed (both `epic: EPIC-15`, `Backlog`)

- `FLLWUP-107` — "Renderer substitution-set pin for procedure copy" (candidate (a) of FLLWUP-105's step 13)
- `FLLWUP-108` — "Usages remediation pin: catch command-drop and update-step-drop" (candidate (b), carrying the measured S4/S5 boundary)

## Step-13 candidates held (no card written, no silent drop)

BUG-2's four candidates could not be gate-recorded — `council_followup_review` does not resolve in the runner container, and the orchestrator's `council_followup_gate` then failed with the `noul` drift (`followup: decideFollowup — answer duplicate of type noul is missing a usable probability`). All four remain held by draft title:

1. "Foreign `--cache-file` parent surface — absent parent keeps the silent no-cache warning"
2. "Cache hit/miss counts in the human-readable usages summary"
3. "Migrate `runTool` in test/usages.test.ts to the async spawn pattern"
4. "Record-only marker: pre-fix read-only stderr letter difference"

## What we learned

1. **An active-but-failing gate is inert, not blocking.** `gate.mode: active` did not stop the run: both the intake card gate and the follow-up gate failed with the same `noul` answer-shape drift (FLLWUP-104), yet `council_route` fell back to Deliberate and the merge check read mode from the run substrate. The card gate's failure direction (more scrutiny) is why this is safe.
2. **The follow-up gate tool is absent in-container.** Step 13 in the runner cannot call the follow-up review tool, so candidates are held by draft title across `DONE`; with the orchestrator's gate also failing, dispositions were seat-ruled by product-owner rather than gate-recorded.
3. **The orchestrator-merges reading was restored.** All three runners returned `DONE` with a PR + head SHA and did not merge; the orchestrator ran the deterministic check and merged. (EPIC-10 had recorded "the runner merged itself" as variance.)
4. **A leaked untracked worktree file blocked the post-merge fast-forward.** `test/usages-procedure.test.ts` was left untracked in the main checkout, so `git merge --ff-only origin/main` aborted; the orchestrator compared it byte-for-byte with the merged version, removed it, and re-ran the ff.
5. **The usages cache-ordering bug and its remediation route.** The tool wrote its cache before creating its output directory; on a fresh repo the temp write raised, was caught, and logged to **stderr only** — never into `report["limitations"]` — so the failure was invisible in both report artifacts. Fixed by moving `ensure_out_dir` above the first `save_cache`. For an already-initialized consumer, the fixed tool is reachable only via **package-update-first → delete `.pi/skills/usages/` → re-run `/council-init`**.
6. **Pin design: the acceptance's purpose clause selects the pin.** Only the pin asserting the glyph in a prohibition context reds on the gutted mutation; tested fact outranks predicted prose gain.
7. **Epic closure with new Backlog children.** EPIC-15 closed `Done` while FLLWUP-107/108 (filed mid-run) remain `Backlog`; its acceptance named only FLLWUP-105 as the closure blocker.

## Orchestrator-level residual (no card)

A batched `chore(release)` version bump covering the BUG-2 + FLLWUP-105 + FLLWUP-106 payload is owed; per the product-owner ruling it is not a per-card closure condition.

## Runner usage blocks (verbatim from `council_wait`)

### BUG-2 (job-1)
```
job-1.1  turns=9  in 150492/out 6871/cR 16571/cW 0/reason 4712/total 173934 cost≈$0.0268
job-1.2  turns=4  in 37586/out 4201/cR 47616/cW 0/reason 2551/total 89403 cost≈$0.0083
job-1.3  turns=4  in 45954/out 10759/cR 64969/cW 0/reason 8102/total 121682 cost≈$0.0306
job-1.4  turns=6  in 76242/out 7302/cR 39137/cW 0/reason 4919/total 122681 cost≈$0.0170
job-1.5  turns=10 in 41930/out 10893/cR 187392/cW 0/reason 8775/total 240215 cost≈$0.0134
job-1.6  turns=9  in 44271/out 10031/cR 197632/cW 0/reason 8077/total 251934 cost≈$0.0372
job-1.7  turns=22 in 49776/out 35113/cR 870400/cW 0/reason 20747/total 955289 cost≈$0.0384
job-1.8  turns=5  in 23245/out 2657/cR 63360/cW 0/reason 770/total 89262 cost≈$0.0042
job-1.9  turns=27 in 315918/out 23559/cR 743296/cW 0/reason 12840/total 1082773 cost≈$0.0963
job-1.10 turns=21 in 107711/out 16543/cR 470016/cW 0/reason 9347/total 594270 cost≈$0.0224
job-1.11 turns=5  in 13514/out 1697/cR 47424/cW 0/reason 1030/total 62635 cost≈$0.0061
job-1.12 turns=1  in 11222/out 81/cR 768/cW 0/reason 78/total 12071 cost≈$0.0018
```

### FLLWUP-105 (job-2 ESCALATION; job-4 resume)
```
job-2   turns=123 in 1356426/out 161659/cR 4144785/cW 0/reason 114137/total 5662870 cost≈$0.4696
job-4.1 turns=27  in 120257/out 8817/cR 916873/cW 0/reason 1588/total 1045947 cost≈$0.0683
job-4.2 turns=20  in 46015/out 18023/cR 695040/cW 0/reason 11243/total 759078 cost≈$0.0245
job-4.3 turns=22  in 32104/out 3766/cR 289536/cW 0/reason 2060/total 325406 cost≈$0.0231
job-4 subtree turns=117 in 375684/out 66520/cR 4452873/cW 0/reason 34305/total 4895077 cost≈$0.2880
```

### FLLWUP-106 (job-5 ESCALATION; job-7 resume)
```
job-5   turns=147 in 1244516/out 237903/cR 5543868/cW 0/reason 159337/total 7026287 cost≈$0.5582
job-7.1 turns=28  in 216879/out 20101/cR 895686/cW 0/reason 12226/total 1132666 cost≈$0.0874
job-7.2 turns=31  in 43327/out 19965/cR 1172224/cW 0/reason 10289/total 1235516 cost≈$0.0333
job-7.3 turns=4   in 12725/out 953/cR 36096/cW 0/reason 438/total 49774 cost≈$0.0047
job-7 subtree turns=98 in 490410/out 61594/cR 3487753/cW 0/reason 31217/total 4039757 cost≈$0.2374
```

### Ruling dispatches
```
job-3 (product-owner/105) turns=5 in 31266/out 8137/cR 81216/cW 0/reason 6209/total 120619 cost≈$0.0278
job-6 (product-owner/106) turns=3 in 39539/out 5878/cR 30720/cW 0/reason 3670/total 76137 cost≈$0.0243
```
