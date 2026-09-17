---
id: FLLWUP-48
title: Suite-cost budget for the live pty and -p falsifier arms
state: Deliberating
owner: null
epic: EPIC-9
goal: The default bun test suite's wall-clock budget is documented, and the live pty and -p falsifier arms run within it or are gated behind an opt-in.
---

## Intent

EV-41's live pty and `-p` parent-turn arms cost roughly 30 to 95 seconds
inside the default `bun test` suite. It is a measurement and retention
question rather than a defect — binding only if suite time becomes binding —
so steward dispositioned it as a `Backlog` residual.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **Card-specific (FLLWUP-48).** The `goal` is **disjunctive** — documenting a
  wall-clock budget and gating the live pty/`-p` arms behind an opt-in are
  *both* valid deliveries. The choice between them is a card-level
  open-judgment call; it is not settled here. Where the documented budget
  lives is a design/writing question for the deliberation. If the deliberated
  design introduces **user-visible copy beyond internal developer
tooling/documentation**, that copy is open-judgment under the authority map —
  the runner returns `ESCALATION` with the drafted string rather than shipping
  an unruled one.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **ninth and final** card of the
    run.
  - Merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>` per
    `features-deliver.md`; all five deterministic criteria must hold.
  - **R1** — union-merge reconcile is the sanctioned non-fast-forward repair,
    never force.
  - Step-13 follow-up confirmation is re-homed to `product-owner`: draft,
    never write an unapproved follow-up, and never dispatch `product-owner`
    from this container.
- **Known artifacts carried into this card (binding notes, not rulings):**
  - The FLLWUP-27 preflight branch-freshness `FAIL` recurs mid-card once a
    record commit advances `origin/main` past the branch cut; it is
    stale-by-construction and never weakens a gate. The step-11 re-run set is
    `bunx tsc --noEmit` / `bun test` / `python3 council/validate.py`.
  - Criterion 2 is `gh pr checks <PR> --json name,state,workflow`, keyed on
    the `workflow` field; `gates` must appear `SUCCESS`.
  - Owner gates are met in full regardless of change size.
  - If this card adds or moves any live arm, it must note the run-wide
    **zero-new-live-arms** constraint FLLWUP-49's deliberation recorded
    (`council/cards/FLLWUP-49.md` O10; spec §“FLLWUP-48 adjacency”): the
    dedup refactor added zero live arms, so this card's baseline is the
    current arm set, unchanged.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card's `goal` admits more than one reasonable
  design — and the card face itself makes the disjunction explicit: the suite's
  wall-clock budget is *documented* and the live arms *run within it* **or**
  are *gated behind an opt-in*. Those are two different deliverables (a
  measurement-plus-documentation card vs. a test-hygiene/gating card), with a
  real tradeoff between suite confidence and suite cost. That is
  `spec-ambiguous` plus `design-judgment`, either of which is sufficient for a
  full council per council.md step 1. It is **not** cross-seam in the
  repo-area sense (test files, CI, and developer documentation; no engine
  module, no `.council.json` surface, no rendered council surface). The owner
  and `product-owner` share the open-judgment decision per the card-specific
  ruling above; this container routes it and decides nothing.
- **Surface-touching: no (recorded).** The deliverable is internal developer
  tooling and/or documentation (a budget statement and/or an opt-in gate on
  the live falsifier arms). It changes no person's product-visible surface,
  no user-visible copy, no empty state, no error state. No `designer` is
  seated. Recorded honestly as a boundary call rather than a settled fact: if
  the deliberated design required **user-visible copy beyond internal developer
  tooling/documentation**, the card-specific ruling makes that copy
  open-judgment — this container returns `ESCALATION` with the drafted string
  rather than shipping it unruled.
- **Rulings applied (Phase 1, binding), not reweighed:** the card-specific
  disjunction/copy boundary above; scope = the nine promoted EPIC-9 residuals
  with EPIC-9 staying `Done`; sequencing is `steward`'s (**ninth and final**
  card); merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>`;
  **R1** union-merge reconcile never force; step-13 confirmation re-homed to
  `product-owner` (draft only — this container never dispatches
  `product-owner`). None of these is re-asked.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` (nine files: `consolidator.md`,
  `council-runner.md`, `designer.md`, `judge.md`, `owner.md`, `principal.md`,
  `product-owner.md`, `skeptic.md`, `steward.md`) and in the installed package
  clone (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`);
  no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by this
  container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). `python3 council/validate.py`
  → `All council artifacts valid`. Local `main` == `origin/main` at
  `b70aa0d` (`FLLWUP-40` `8dbe038`, `FLLWUP-43` `e25b813`, `FLLWUP-42`
  `aff1101`, `FLLWUP-41` `9adca28`, `FLLWUP-44` `05ae348`, `FLLWUP-45`
  `2f79142`, `FLLWUP-47` `216ea34`, `FLLWUP-49` `323abdc` all merged); working
  tree clean. No `Needs Human` state and no outstanding ruling on this card —
  deterministic merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here): `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`, plus
  `bash council/preflight.sh FLLWUP-48` (the FLLWUP-27
  stale-by-construction line aside).
- **Baseline arm set carried in (FLLWUP-49 record, `job-22.5` O10):**
  `ev40-headless` 3, `ev40-live-gates` 5, `ev41-retry-e2e` 5,
  `ev43-reachability` 2. FLLWUP-49 added **zero** live arms; that baseline is
  what this card measures and budgets.
- **Evidence base read before this decision:** `council/procedures/council.md`
  and `features-deliver.md` in full; `council/cards/FLLWUP-48.md`,
  `FLLWUP-49.md`, `FLLWUP-47.md`, `EV-41.md`, `EPIC-9.md`; the EV-41/EV-43
  live arms (`test/ev41-retry-e2e.test.ts` (c) headless `-p` timeout 180s and
  (c) TUI pty timeout 300s; `test/ev43-reachability.test.ts` live arm timeout
  300s); `test/ev40-live-gates.test.ts`; `.github/workflows/gates.yml`;
  `README.md:315`; `vault/raw/2026-09-16-epic9-run-ledger.md`;
  `council/validate.py`.
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).

### Step 2 — independent first pass (round 1)

Two generators dispatched independently on the card alone (no `designer` —
not surface-touching). Jobs: `owner` `job-26.1` (5.3m, 16 turns),
`principal` `job-26.2` (5.3m, 16 turns), both settled `done`. Positions
appended verbatim.

**Facilitator-observed fact (read-only, not a seat claim):** the default
`bun test` suite is **red on the main checkout** at card start from local,
gitignored bytecode residue — `test/__pycache__/ev41-tui.cpython-312.pyc`
(compiled from the pre-FLLWUP-49 runner) trips
`test/faux-provider-shape.test.ts` test 6 ("no retired path token survives
under test/"), which scans binaries. First-hand run: `7 pass / 1 fail`,
`Ran 8 tests across 1 file`. CI is unaffected (the file is gitignored and a
fresh checkout lacks it). Recorded as an observed artifact; the fix/scope is
for the deliberation and the owner, not decided here.

#### Position — `owner` (job-26.1)

**Take the *document* arm of the disjunction; do not gate.** The measured
facts do not support gating: the default `bun test` suite on this tree
(`5608ed1`, clean, main == origin/main) runs **894 tests across 78 files in
94.4s wall clock**, of which the live spawning arms — the four-file arm set
carried in from FLLWUP-49, unchanged — account for **~72s (~76%)**:

| File (arm count) | Measured wall | Notes |
|---|---|---|
| `test/ev41-retry-e2e.test.ts` (5 tests: 2 unit + 3 live) | **38.0s** | TUI pty arm **~32.5s** (35% of the whole suite by itself); `-p` headless arm **~5.3s**; (b) seat arm ~1.1s |
| `test/ev40-live-gates.test.ts` (5 arms) | **16.5s** | P3, P4, O-P2-live, D4, T-H1 |
| `test/ev40-headless.test.ts` (3 arms) | **12.8s** | |
| `test/ev43-reachability.test.ts` (2 tests: 1 unit + 1 live) | **4.9s** | |
| Rest of suite (~74 files) | **~22s** | |

94s is not binding, and the card's own intent says the constraint binds "only
if suite time becomes binding." The arms are **offline by construction**
(`--offline` + faux provider, `test/faux-provider/harness.ts:209` — no
network, no credentials), unlike the integration test whose
`COUNCIL_INTEGRATION=1` gate exists because it genuinely needs network + keys.
And gating has a structural cost: `.github/workflows/gates.yml` runs plain
`bun test` with no env opt-in, so a default-skip gate would silently strip the
merge gate's strongest falsifiers (real CLI, real extension, control arms for
attribution) unless `gates.yml` also opted in — creating a second gate mode
the deterministic merge check would have to police. The anti-gating reading of
AGENTS.md's own convention ("the integration test is the **only**
network-touching test and must stay gated") supports this: these arms earned
no gate because they need nothing.

**Deliverable shape** (documentation only, both internal developer docs — no
user-visible copy, so no open-judgment copy escalation under the card ruling):

1. **`README.md` Development section** (adjacent to the existing line 315):
one line stating the envelope — default `bun test` ≈ 90–100s wall clock; the
live pty/CLI arms inside it are offline faux-provider runs needing no network
or credentials; only `integration.test.ts` is gated behind
`COUNCIL_INTEGRATION=1`.
2. **New wiki page `vault/wiki/test-suite-budget.md`** (linked from
`vault/wiki/index.md`): the measured per-file table above with the
re-measurement command (`for f in ev41-retry-e2e ev40-live-gates
ev43-reachability ev40-headless; do time bun test test/$f.test.ts; done` plus
`time bun test`), the timeout-ceiling-vs-expected-cost distinction (`-p`
ceiling 180s vs ~5s actual; TUI ceiling 300s vs ~32.5s actual; `runHarnessArm`
default 120s — ceilings are emergency bounds, not budgets), and a standing
rule: **any new live arm must state its expected wall-clock and ceiling in its
test header, and the README budget line must be re-measured when an arm
changes.** This makes the budget a maintained artifact, not a stale number —
which matters, because I found the repo's command docs already drift (below).

**Zero-new-live-arms (FLLWUP-49 O10):** this design adds zero live arms and
moves none; the baseline arm set (`ev40-headless` 3, `ev40-live-gates` 5,
`ev41-retry-e2e` 5, `ev43-reachability` 2) is exactly what was measured.

**Proposed budget figure:** ≤ **180s** for the full default suite (2× headroom
over the measured 94.4s, same order as the per-arm ceilings). The exact figure
is card-level judgment; the table is where the real precision lives.

## Findings the runner should not lose

1. **The default suite is red on this tree right now — from local residue.**
`test/faux-provider-shape.test.ts` test 6 ("no retired path token survives
under test/") fails because a stale `test/__pycache__/ev41-tui.cpython-312.pyc`
(compiled from the pre-FLLWUP-49 runner, gitignored, regenerable) contains a
retired token, and `countMatches(TEST_DIR, …)` scans binaries. CI is unaffected
(pycache is gitignored), but any dev tree with stale bytecode goes red, which
corrupts exactly the measurement this card documents. The durable fix is
excluding binary/`__pycache__` files from the shape scan (the witness polices
*source*, not bytecode); the implementing pass will need a green `bun test`
gate, so this likely has to be handled on this card's branch regardless. I flag
it; I do not scope-decide it.
2. **`AGENTS.md:17` is stale by ~26×:** "full suite; 34 tests, 1 skipped" vs
actual 894 tests, 2 skips. If the budget is documented, this line should be
corrected in the same pass — it is the repo's own front-door command doc and
currently cannot be trusted.

## Tradeoffs accepted

- **Documentation decays.** A number in README/wiki can go stale as arms
evolve. Mitigated by putting the *measurement command* next to the number and
the standing re-measure rule in the wiki page — and by the fact that any arm
change already forces a `bun test` gate run where drift is visible.
- **No speed win.** Developers keep paying 94s per full suite run. Worth it
because the arms are the repo's strongest falsifiers, they're free of
network/credential constraints, and 94s is nowhere near binding; gating would
trade ~70s for a silently weaker merge gate.
- **One machine's timings.** My numbers are from this container; the
implementing pass must re-measure and may land on different per-file figures
(the budget's 180s headroom absorbs that). CI runner variance is unmeasured
here — acceptable because 2× headroom covers it.
- **Adjacent residue fix risk.** Handling the `.pyc`/shape-scan issue on this
card's branch is technically adjacent scope; the alternative (a red suite on
dirty dev trees making the budget unmeasurable) is worse.

## Testable claims (for the Skeptic)

1. **Budget holds:** `time bun test` on a clean tree → **< 180s** (measured
94.4s here). If this fails on CI-class hardware, the documented-budget arm of
the disjunction is wrong and gating reopens.
2. **The pty arm dominates:** `bun test test/ev41-retry-e2e.test.ts -t "TUI
branch"` → ~30–35s, i.e. ~35% of the suite from one test; all other arms
combined are ~40s.
3. **Live-arm share:** the four arm files sum to ~72s of 94.4s (~76%) — run
the per-file loop above and check the sum.
4. **No gating pretext:** the arms need no network/credentials — `grep -n
'"--offline"' test/faux-provider/harness.ts` shows the offline flag; no
credential read exists in the arm path. Contrast `test/integration.test.ts`,
which is the only network test and the only one already gated.
5. **Gating would weaken CI structurally, not just locally:**
`.github/workflows/gates.yml` runs bare `bun test` with no env opt-in — a
default-skip gate removes the arms from the merge gate unless the workflow
also opts in. Readable in one file; no run needed.
6. **The residue finding reproduces and the fix settles it:** with a stale
`.pyc` under `test/__pycache__/`, `bun test test/faux-provider-shape.test.ts`
fails test 6; excluding binary files from `countMatches` makes it pass without
weakening the witness (the pyc regenerates from current source and no longer
trips). This is the one disagreement-shaped item I'd want settled by running
rather than prose.

**Open judgment left for `product-owner`:** the budget figure itself (I
propose 180s) and whether the `.pyc` shape-scan hygiene fix rides on this card
or is split out — the deliverable choice (document-only) I settle on the
measured facts above.

#### Position — `principal` (job-26.2)

Using writing-plans only for its file-boundary discipline (naming which file
owns a contract); this is a deliberation position, no files touched.

### Cross-seam reading — what the contract actually is right now

Four files define the seam, and none of them is a test file.

1. **The cost lands serially on one command, and that command is the merge
gate.** `package.json:22` is `"test": "bun test"` — no `--parallel`, and bun
only parallelizes *files* behind the opt-in `--parallel` flag (bun docs
`test/parallel.mdx`; `--concurrent` is the within-file opt-in, also unused). So
the live arms are additive to suite wall clock. `.github/workflows/gates.yml:17`
is bare `bun test`: no `timeout-minutes`, no env gate, no `if:`. Every PR and
every push to `main` runs all 15 arms unconditionally (`ev40-headless` 3,
`ev40-live-gates` 5, `ev41-retry-e2e` 5, `ev43-reachability` 2). And the merge
criterion is `gh pr checks <PR> --json name,state,workflow`, keyed on
`gates === SUCCESS`. **The emergent contract: "gates green" currently means the
EV-40/41/43 provider-error mechanism actually spawned a real pi CLI.** That
equivalence is written nowhere; it arises from `gates.yml:17` ×
`package.json:22` × the existence of tests importing `./faux-provider/harness.ts`
(`faux-provider-shape.test.ts` test 5 pins exactly those four importers).

2. **The "budget" has no home and no measurement.** No `bunfig.toml` exists.
The only time values in the tree are *ceilings*: per-test third args
(`ev41-retry-e2e.test.ts:296` 20 s, `:308` 180 s, `:352` 300 s;
`ev40-live-gates.test.ts:68,123,178,229` 180 s; `ev43-reachability.test.ts:87`
300 s; `ev40-headless.test.ts:59,101` 300 s) and inner spawnSync timeouts
(`faux-provider/harness.ts:242` default 120 s; `ev41-retry-e2e.test.ts:342`
280 s). Ceilings are not observed cost. I found no file recording a `bun test`
wall clock anywhere — the card's "roughly 30 to 95 seconds" is an unprovenanced
range.

3. **The directory already contains the two-sided answer, one card old.**
`test/faux-provider/ev41-tui.py` is spawned from inside the suite
(`ev41-retry-e2e.test.ts:338`); `test/faux-provider/tui-retry.py` is **manual,
not CI-wired** — FLLWUP-49's spec §10: "No CI wiring of `tui-retry.py` … wiring
them in would add ~10 minutes of pty runtime per suite run." And the manual
copy **drifted** from the in-suite copy before FLLWUP-49 reconciled them (spec
§1, O2 `closed-green`: "the copies drifted; `ev41-tui.py`'s `D` clause is the
wrong one"). "Gate it and it rots" is not my hypothesis here — it is a recorded
event in the exact directory this budget covers.

4. **The one existing opt-in flag means something else.**
`test/integration.test.ts:11` and `test/provider-cost.test.ts:668` gate on
`COUNCIL_INTEGRATION === "1"`, documented at `README.md:315` and `AGENTS.md:17,23`
as *"Requires network + OpenRouter key."* The live pty/`-p` arms need neither:
they run `--offline` against the faux provider (`harness.ts:120-127,152-166`).
Reusing that flag silently redefines a documented, consumer-read contract;
minting a second flag leaves two gates distinguishable only by "expensive,"
which no gate can test.

**Where the budget belongs, and who can be bound.** A suite total is not
observable from inside `bun test` — bun prints one aggregate line, and the only
elapsed assertion in the whole suite is a *lower* bound (`test/hub.test.ts:517`,
`toBeGreaterThanOrEqual(50)`); there is zero upper-bound elapsed assertion in
`test/`. A nested `bun test` spawned from a test would be a new, recursive live
arm that doubles the cost it measures. So: a **suite** ceiling can only bind at
`.github/workflows/gates.yml` (job `timeout-minutes`, or a `timeout` wrapper)
and in the documented local command; an **arm** ceiling can bind inside each
existing live test, bracketing its own `spawnSync`; a **descriptive** number
belongs next to the command it describes (`README.md:315`), with the
measurement recorded in the PR. Prose binds nobody.

### Blind spots — by vantage

- **In-code (owner, `test/`)**: cannot see that a gate flips the meaning of
criterion 2. From inside the file, `if (!flag) return` is hygiene. The file
cannot see `gates.yml:17`, cannot see CI is the *only* automated execution of
the mechanism, and cannot see `--match-head-commit` merges keying on the
`gates` workflow. It also cannot see aggregate cost at all.
- **Invocation (`gates.yml`, `package.json`, `preflight.sh`)**: cannot tell a
falsifier from a characterization or a dead runner from a live one, and has a
single aggregate number. It also cannot see that `preflight.sh` never runs
`bun test` — it is the *precondition* for trusting local gate evidence
(AGENTS.md convention 13), so if arms become opt-in, preflight is structurally
incapable of noticing and that convention's trust statement silently
overclaims.
- **Documentation (`README.md:315`, `AGENTS.md:17`)**: cannot see that its own
numbers decay — `AGENTS.md:17`'s "34 tests, 1 skipped" is stale by construction
against ~50 test files. It also cannot resolve the goal's own ambiguity:
"budget is *documented*" is either descriptive (what it costs) or normative (a
ceiling someone must not cross), and those bind different parties.
- **product-owner's**: cannot see that electing the *gate* disjunct amends the
merge gate's confidence floor — a contract that lives in `features-deliver.md`
criterion 2, outside the slice where the ruling is made. The criteria text
would stay byte-identical while its truth value changed.
- **Mine**: I have no execution tool in this seat. Every wall-clock figure
above is unverified; I can only cite ceilings and the absence of measurements.
I also cannot state the *minimum honest* arm duration, because that requires
running `ev41-retry-e2e.test.ts`.

### Reframe

The disjunction is not two answers to one question; it is one measurement plus
two independent decisions, and the card's real open question is a third that
neither disjunct names:

- **Q-A (measurement)** — what does the suite cost, per arm and per run?
Answerable today; nobody has recorded it.
- **Q-B (ceiling)** — who fails when the cost grows? Documentation cannot
answer this; only the invoker can. The mechanism that keeps the arms in the
suite *and* keeps the budget honest is (i) an elapsed assertion inside each
existing live test (zero new arms, catches runaway not drift) plus (ii) a
ceiling at the invocation layer, the only place a suite total can bind.
- **Q-C (retention)** — what stops being true if the arms leave the default
run? Criterion 2's green stops being evidence. Not aesthetic: the repo's own
manual runner drifted.

The asymmetry is what I want on the record: the two disjuncts are not
symmetric in cost. Gating pays for wall clock with the falsification evidence
the merge gate currently reads, and this repo has a documented decay path for
gated live runners. The likely honest delivery is the **"run within it"**
branch — measure, document descriptively at `README.md:315`, enforce at
`gates.yml`, trip at arm level — with gating reserved for what is already
manual. **The choice between disjuncts remains product-owner's open judgment;
I do not decide it.** What I contribute is that if gating is elected, the
design must state explicitly that `gates` green no longer witnesses the live
arms, and must put the arms somewhere they actually run. I have no testable
fact that settles the choice — the settleable facts (T1–T8) all bear on the
mechanisms, not on the disjunction.

**Copy flag (do not ship unruled).** Test-runner output and `README`/`AGENTS`
developer prose are inside the phase-1 carve-out. But if the design adds any
string to `council/preflight.sh` (e.g. "live arms skipped") or to any runtime
council surface, that string is consumed by a person running the tool and is
open-judgment — return `ESCALATION` with the drafted string.

**Zero-new-live-arms note.** Both mechanisms above add zero arms — but two
traps: implementing the elapsed ceiling as a *sibling* test re-running an arm
adds 1–5 arms and doubles cost, so it must be an assertion inside the existing
test; and a default-run gate moves 13 of the 15 baseline arms out of the
default execution even though source counts are unchanged. Per the constraint's
letter and intent, note that as a move.

### Testable claims (Skeptic-runnable; each with an explicit timeout)

- **T1 serial/additive** — `grep -n '"test"' package.json` shows no
`--parallel`. Run `time bun test test/ev41-retry-e2e.test.ts` (400 s) and
`time bun test` (900 s). Claim: suite total ≥ sum of the four live files.
Materially less ⇒ I am wrong about additivity.
- **T2 the number** — `for f in test/ev40-headless.test.ts
test/ev40-live-gates.test.ts test/ev41-retry-e2e.test.ts
test/ev43-reachability.test.ts; do /usr/bin/time -f '%e %C' bun test $f; done`
(400 s each). Claim: the combined figure differs measurably from "30 to 95
seconds." If it lands inside that range, the card's premise is corroborated and
my "no measurement exists" claim is wrong. Either way, the number written into
the doc must come from this run.
- **T3 nothing binds today** — `grep -nE 'timeout|COUNCIL_INTEGRATION|if:'
.github/workflows/gates.yml` → no matches. Falsifier: make one arm 10× costlier
on a scratch worktree and observe `gates` still succeed (bounded only by the
platform job default, which is hours — asserted from the file's absence of a
ceiling, not fetched platform docs).
- **T4 gating empties criterion 2 (the load-bearing test)** — with the proposed
gate off, `bun test test/ev41-retry-e2e.test.ts test/ev40-live-gates.test.ts
test/ev43-reachability.test.ts test/ev40-headless.test.ts` (400 s) must exit 0
with all live tests skipped. Stronger: make `resolveNode()` throw for the run —
if the suite is still green, `gates` SUCCESS no longer witnesses the mechanism.
Break this and my case against gating collapses.
- **T5 no suite-level assertion is possible from inside** — `grep -rn
'toBeLessThan' test/` and `grep -rn 'Date.now() - \|performance.now()' test/`
show no upper-bound elapsed assertion. Falsifier: exhibit an existing test that
goes red merely because the whole suite got slower.
- **T6 doc decay** — `bun test 2>&1 | tail -3` (900 s) versus `AGENTS.md:17`'s
"34 tests, 1 skipped." If they disagree, the natural home for a budget already
carries a false number.
- **T7 manual ⇒ drift (precedent)** — `git log --oneline --
test/faux-provider/tui-retry.py` plus FLLWUP-49 spec §1 ("the copies drifted;
`ev41-tui.py`'s `D` clause is the wrong one"). Falsifier for my claim: show a
deliberately-unwired live runner in this repo kept in sync without a later card
doing it.
- **T8 zero-new-arms compliance** — count `test(` calls in the four files
before/after: baseline 3/5/5/2. Any delta means the ceiling was implemented as
a new arm rather than an added assertion.

Wiki pages used: `vault/wiki/index.md` (catalog only — no page covers suite
cost, so this position rests on source files, not wiki prose),
`vault/wiki/smoke-test.md` (the "unit decode tests remain the CI gate; the
smoke is the live-path falsifier" separation, which is the closest existing
statement of what CI green does and does not witness).
