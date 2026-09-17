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

### Step 3 — bounded exchange (round 2) — **closed at 2 rounds, positions stabilised**

Re-dispatched each generator with the other's round-1 position (read from this
record). Jobs: `owner` `job-26.3` (3.3m, 5 turns), `principal` `job-26.4`
(3.3m, 13 turns), both settled `done`. Positions appended verbatim.
**Closed at 2 rounds** — both seats converged on one branch (document-only;
bytecode exclusion in the shape witness; `AGENTS.md:17` decay fix; no new live
arm), and the only remaining divergence is the optional `gates.yml`
`timeout-minutes` backstop, which is a card-level judgment item.

#### Round 2 — `owner` (job-26.3)

Verification base for this round (run, not recalled): reproduced the residue
failure first-hand (`bun test test/faux-provider-shape.test.ts` → `7 pass / 1
fail`, test 6 tripping on `test/__pycache__/ev41-tui.cpython-312.pyc`, which
contains exactly one occurrence of the retired token `ev40-harness/`);
confirmed `gates.yml` is bare `bun test` with no `timeout-minutes`, no env
gate, no `if:`; confirmed `package.json:28` is `"test": "bun test"` (no
`--parallel`); confirmed `.gitignore:20` ignores `__pycache__/` (CI
unaffected); confirmed T5 — every `toBeLessThan` in `test/` is an
index/ordering/count comparison; the only elapsed assertion in the suite is
`hub.test.ts:517` and it is a **lower** bound; confirmed `runHarnessArm` passes
`timeoutMs` to `spawnSync` (`harness.ts:242` default 120s).

### Engaging the principal point by point

**Where the principal is right and I concede:**

1. **"Prose binds nobody" — correct, and my round-1 shape under-specified
this.** I proposed a README number plus a wiki page; that documents, it does
not bind. I accept the correction. Where I refine rather than concede: see Q2
below — the arm-level trip they propose is largely redundant with bindings that
already exist.
2. **A suite total is not observable from inside `bun test`** — verified.
Their Q-B insight ("only the invoker can bind a suite ceiling") is correct, and
T5 confirms no upper-bound elapsed assertion exists anywhere in `test/`.
3. **The elapsed-ceiling-as-sibling-test trap** — correct and worth keeping on
the record verbatim: the constraint (FLLWUP-49 O10) would be violated by a
sibling re-running an arm; any trip must be an assertion inside the existing
test.
4. **Q-C (retention) and the manual-runner drift precedent** — accepted as the
standing argument against gating anything in this directory. Their "gate it and
it rots" is a recorded event in this repo, not a hypothesis.
5. **Q-A (measurement first)** — both our positions already contain it; the
card's number must come from a recorded run, not the card face's unprovenanced
"30 to 95 seconds."

**Where I push back, on file evidence:**

- **The arm-level elapsed assertion is mostly redundant, and its marginal
value is near zero against a real flake cost.** Their claim "an arm ceiling can
bind inside each existing live test" is true, but an arm ceiling **already
binds there today**: every arm's `spawnSync` carries `timeoutMs`
(`harness.ts:242` default 120s; per-test 180s/300s args in the four arm files).
A runaway arm is already hard-killed and fails downstream. An added `Date.now()`
assertion buys only "fail at 150s instead of 300s" — while introducing a fresh
timing-flake class on shared CI runners, which is exactly the failure mode a
merge gate must never gain. The unique missing binding is the **suite total**,
and that can only live at the invocation layer.

### Q1 — the `.pyc` residue: **(a) in scope, as a minimal blocking prerequisite**

Classification, settled on evidence: **(c) is wrong** — the residue is the
trigger, not the defect. The defect is in committed code: `countMatches`
(`faux-provider-shape.test.ts:26`) reads every file under `test/` as utf-8 with
no binary exclusion, so a gitignored, regenerable `.pyc` compiled from
*pre-FLLWUP-49* source deterministically turns the witness red on any dev tree
holding stale bytecode. A witness that polices *source* must not read
*bytecode*. **(b) split-out is the purist answer but loses to the coupling:**
this card's deliverable is a documented budget whose standing re-measure
command is `time bun test` — on a residue-bearing tree that command is **red**,
so the card would ship a budget whose own verification path fails. It also
corrupts the criterion-2 trust chain ("green = witnesses") the principal
correctly elevates to Q-C: a repo that normalizes red-by-residue has decayed
its own evidence semantics. The fix is ~2 lines — skip `__pycache__/`
directories in `filesUnder` — adds zero arms, and is fully TDD-able (below).
Scope note: the implementing worktree, being fresh, would pass gates without
the fix; the fix rides this card not because a gate forces it but because the
card's documented budget is only trustworthy when the default suite is green on
dirty trees. If `product-owner` prefers strict scope discipline, the honest
fallback is **(b)** with the follow-up drafted by `product-owner` per the
step-13 ruling — but I recommend (a).

### Q2 — where the budget binds: **invocation layer or nowhere; descriptive prose documents**

Settled mechanism, refining both round-1 positions:

- **Q-A (measurement):** the card records measured per-file wall-clock (my
round-1 table; re-measured on the implementing pass). This is the foundation
both seats share.
- **Documentation:** README Development section (the `README.md:315` block) gets
one descriptive line; `vault/wiki/test-suite-budget.md` (new, linked from
`vault/wiki/index.md` — verified the catalog has no suite-cost page) carries the
table, the re-measure command, the ceiling-vs-budget distinction, and the
standing re-measure rule. This is *description*, and it binds nobody — fine,
because description is all the goal's first clause asks for.
- **Binding (Q-B):** if anything binds, it binds at `.github/workflows/gates.yml`
— a `timeout-minutes` on the `gates` job (e.g. 10 minutes against 94.4s
measured ≈ 6.4× headroom, versus the platform's default 360) is the **only**
mechanism that can observe a suite total, costs one line, moves zero arms, and
cannot flake at that headroom. **I now endorse it as the optional enforcement
piece.** The arm-level elapsed assertion I **reject** on the redundancy grounds
above: the existing `spawnSync` ceilings already bind each arm, and the added
assertion is flake risk without unique catch.
- Whether the `timeout-minutes` line ships is **product-owner's open judgment**
— the goal text does not require it ("run within it" is satisfied by
measurement against the documented figure). My recommendation: ship it; it is
the one cheap way to make "run within it" a maintained invariant instead of a
stale fact.

### Q3 — gates or documents: **document-only, and I claim this is fact-settled, not merely open judgment**

The orchestrator ruling leaves the choice as card-level open judgment unless a
testable fact settles it. I claim the settling fact exists, and it is the
card's own recorded premise: *"binding only if suite time becomes binding."*
The measurement (round-1, 894 tests / 78 files / **94.4s**) shows nothing binds
— no CI ceiling, no platform limit, no constraint anywhere in the tree.
Gating's **only** benefit is suite-time relief, and it buys that by deleting the
merge gate's strongest falsifiers: verified structurally — `gates.yml` runs
bare `bun test`, so a default-skip gate either silently empties criterion 2's
evidence (principal's T4, which I co-sign) or forces a second gate mode. And
the arms need no gate justification: they are offline faux-provider runs
(`harness.ts` spawn args: `--offline --provider ev40`), unlike the integration
test whose `COUNCIL_INTEGRATION=1` gate exists because it needs network + an
OpenRouter key. So gating is strictly dominated *under the card's recorded
intent*: the premise that would justify it is measured false. That is a fact
settling the direction. What remains genuinely open for `product-owner`: (1)
the budget figure (I propose ≤180s, 2× headroom), (2) whether the optional
`gates.yml` `timeout-minutes` line ships. I note honestly: the principal
concluded "I have no testable fact that settles the choice"; my claim is that
the measurement itself is that fact — the choice was open when it was
unmeasured, and it no longer is. If `product-owner` still elects gating, they
are overriding the card's recorded premise, not weighing fresh evidence — and
the design must then state explicitly that `gates` green no longer witnesses
the live arms and place them somewhere they actually run (principal's Q-C
condition, which I adopt for that contingency).

**Zero-new-live-arms:** the design adds zero arms and moves none; the arm set
measured is exactly the carried baseline (3/5/5/2). The `timeout-minutes` line
binds the existing run and is neither an arm nor a move; the sibling-test trap
is noted and avoided.

**Copy flag:** all deliverable strings (README line, wiki page, AGENTS.md line)
are internal developer documentation — inside the phase-1 carve-out, no
escalation. If gating were elected and any string were added to
`council/preflight.sh` ("live arms skipped"), that string is open-judgment —
escalate, don't ship. Platform-generated GH Actions failure text from
`timeout-minutes` is not our copy.

### Q4 — `AGENTS.md:17`: **fix in this card, but fix the decay vector, not the number**

Verified: line 17 reads "full suite; 34 tests, 1 skipped" against ~894 tests, 2
skips — stale by ~26×, and it is the front-door doc for the exact command this
card budgets. Shipping a budget number next to a false count recreates the
decay the principal documented (their T6). The right fix is **not** refreshing
the count (that guarantees the next staleness) but replacing the brittle number
with durable wording — e.g. "full suite; integration test skipped unless
`COUNCIL_INTEGRATION=1`" — so the line stops carrying a count that only a run
can verify. One line, same doc family as the deliverable, in scope. A separate
card for one line of prose would be process overhead the run doesn't need.

### Tradeoffs accepted

- **Adjacency:** the `.pyc` fix widens this card's diff beyond the budget
deliverable. Accepted because the budget's own verification command must be
runnable on dirty trees; the fallback (b) is named if `product-owner` rules
otherwise.
- **`timeout-minutes` adds a (thin) new failure mode to CI.** At 6.4× headroom
it fires only on genuine runaway — which is precisely what it exists to catch.
Accepted as optional-but-recommended.
- **No local speed win:** developers keep paying ~94s. Accepted per Q3; the arms
are the falsifiers and nothing binds at 94s.
- **My claim that the disjunction is fact-settled is itself a judgment about how
much a measurement can settle.** I state the chain explicitly so `product-owner`
can accept the chain or reopen the choice — either is cheap now that the number
exists.

### Testable claims (Skeptic-runnable)

1. **Residue reproduces and the fix settles it:** with the stale `.pyc` present,
`bun test test/faux-provider-shape.test.ts` (timeout 120s) fails test 6 —
verified this round (`7 pass / 1 fail`; the `.pyc` matches `ev40-harness/`
exactly once). After skipping `__pycache__/` in `filesUnder`, it passes; and
injecting a retired token into a *source* file under `test/` still fails test 6
— the witness survives, only bytecode is out of scope.
2. **Budget holds:** `time bun test` on a clean tree → < 180s (measured 94.4s
round-1). If CI-class hardware breaks this, the document arm reopens.
3. **Only the invoker can bind a suite total:** `grep -rn 'toBeLessThan' test/`
shows no upper-bound elapsed assertion (verified this round); the sole elapsed
assertion, `hub.test.ts:517`, is a lower bound. Falsifier: exhibit an existing
test that goes red merely because the suite got slower.
4. **Arm ceilings already bind today:** `grep -n 'timeoutMs\|timeout'
test/faux-provider/harness.ts` plus the per-test 180s/300s third args — a
runaway arm is already killed and fails. Falsifier for my "redundant" claim:
name a runaway scenario the existing ceilings miss that an in-test elapsed
assertion would catch materially earlier, without flake.
5. **Gating empties criterion 2** (principal's T4, co-signed): with a proposed
env gate off, the four arm files skip green; make `resolveNode()` throw and the
suite stays green — `gates` SUCCESS no longer witnesses the mechanism. Run only
if gating is still on the table.
6. **AGENTS.md:17 is false today:** `bun test 2>&1 | tail -3` (timeout 900s) vs
the line's "34 tests, 1 skipped" — mismatch confirms; the card fixes the line
by removing the count, not refreshing it.

**Converged shape I believe both seats can sign:** measure → document (README +
wiki, descriptive) → minimal in-scope hygiene fix to the shape witness (skip
`__pycache__`) → AGENTS.md:17 decay fix → optional one-line `timeout-minutes`
at `gates.yml` as the only binding, product-owner's call. Gating rejected on the
measured premise; the budget figure and the timeout line are what remains open
for `product-owner`.

#### Round 2 — `principal` (job-26.4)

### Cross-seam reading — what the contract is, on both sides of the seam

Three seams, not one, and round 1 named only the first two.

1. **Cost → gate (agreed).** `package.json:22` is `"test": "bun test"` (no
`--parallel`), `.github/workflows/gates.yml:17` is bare `- run: bun test` with
no `timeout-minutes`, no `if:`, no env. So the live arms are additive to the
merge gate's wall clock, and "gates green" is the only automated witness that
the EV-40/41/43 mechanism spawned a real pi CLI. Confirmed in files; I keep
this.
2. **Enforcement — I mis-read this side in round 1, and so did the owner.**
Every live arm is *already* ceilinged at the arm level by bun's third positional
argument: `ev41-retry-e2e.test.ts:259` `20_000`, `:320` `180_000` (`-p`),
`:362` `300_000` (TUI pty); `ev40-live-gates.test.ts:84,135,174,209,246`
`180_000`; `ev40-headless.test.ts:66,117` `300_000`; `ev43-reachability.test.ts:106`
`300_000`; plus the inner spawn ceiling `harness.ts:264` (`opts.timeoutMs ??
120_000`) and the arm ceiling `harness.ts:323`. That *is* an enforced upper
bound on each arm, and bun fails the test when it trips. My round-1 T5 (`grep
-rn 'toBeLessThan' test/`) tested the wrong surface and I withdraw it as stated
— there is an enforced ceiling per arm; there is none per suite. The only
unguarded layer today is the invocation layer, which has nothing.
3. **The witness seam (round 1 under-weighted).** `test/faux-provider-shape.test.ts:33-35`
`countMatches` = `filesUnder(dir).filter(f => re.test(readFileSync(f, "utf-8")))`
— no exclusion; `:36-38` `filesUnder` walks everything. Test 6 (`:89-95`) scans
for `ev40-harness/|ev43/falsifier|ev43/ev43-falsifier`. Test 8 (`:97-105`) runs
`python3 -m py_compile` on `pty_kit.py`, `tui-retry.py`, `ev41-tui.py` — into
`test/faux-provider/__pycache__/`. Independently, the live TUI arm spawns
`test/faux-provider/ev41-tui.py`, which does `from pty_kit import K_CR, Session,
read_sequences` (line 40) — CPython writes
`test/faux-provider/__pycache__/pty_kit.cpython-312.pyc`, inside the tree test 6
scans, during the same suite run. On disk right now:
`test/__pycache__/ev41-tui.cpython-312.pyc` (orphan — its source
`test/ev41-tui.py` no longer exists; that path is the *pre-FLLWUP-49* location)
and `test/faux-provider/__pycache__/{ev41-tui,pty_kit,tui-retry}.cpython-312.pyc`.
`.gitignore` covers `__pycache__/` and `*.py[cod]`, which is why CI and a fresh
worktree are unaffected. So the residue class is **self-arming**: the suite
writes the scan targets that trip its own witness, and the trip is
order-dependent (test 6 runs before test 8 only because of declaration order in
that file; the live arm in a *different* file can be ordered either way, and
`--parallel` would make it arbitrary). A witness that can go red for a
tree-history reason is precisely the failure the repo already paid for once
(FLLWUP-49 O9: a predicate scoped to one directory passing while copies
survive).
4. **Third stale artifact, same class as `AGENTS.md:17`.**
`test/ev41-retry-e2e.test.ts:325` still says "TUI branch (pty, via
`test/ev41-tui.py`)" — a retired path token *in a source file*, which test 6's
hand-maintained regex does not cover. The witness's token list is an allowlist
and it already has a miss, one commit after the move that created the miss.

### Blind spots — per vantage, not mirror images

- **In-code (`owner`, `test/`)**: cannot see the cross-run/cross-file ordering
of its own scan. From inside one green `bun test`, `countMatches` and
`py_compile` never appear in the same frame; the failure only materializes in a
*different* run or a different file order. It also cannot see the tree state the
doc reader has (READMEs are read on long-lived checkouts, not fresh worktrees).
- **Mine (`principal`)**: no execution tool. I can cite ceilings and absences,
never durations; and in round 1 I read the enforcement surface through the wrong
instrument (an assertion grep) — I could see "no `toBeLessThan`" and missed
that the timeout argument is the ceiling. A reframer without a run can mis-locate
a mechanism while being right about the seam.
- **Documentation vantage (`README.md:315`, `AGENTS.md:17`)**: cannot observe
its own drift, and specifically cannot see the part that is checkable
*statically*: there are exactly two `test.skipIf` sites
(`test/integration.test.ts:13`, `test/mcp/integration-context7.test.ts:7`) and
two distinct opt-in flags (`COUNCIL_INTEGRATION`, `COUNCIL_MCP_INTEGRATION`),
while `AGENTS.md:17` says "34 tests, 1 skipped unless COUNCIL_INTEGRATION=1" and
names neither the second flag nor the second skip. A doc cannot see that its own
Command block is stale in three ways.
- **Invocation (`gates.yml`, `preflight.sh`)**: cannot distinguish "an arm hit
its documented 180/300 s ceiling" from "the runner was slow" — both surface as
a long job — and today has no ceiling at all, so a hung arm burns the platform
default. It also cannot see FLLWUP-49's own compliance note: "shape test spawns
nothing" is literally false (`faux-provider-shape.test.ts:97-105` spawns
`python3`); it is compliant only because the constraint is about *live pi/pty*
arms, and that same benign spawn is the residue mechanism.
- **`product-owner`'s**: cannot see that electing the gate changes what
criterion 2's `SUCCESS` *means* while its text stays byte-identical (round-1
point, still standing).

### Reframe

The disjunction collapses once the measurement exists, and "budget" needs
splitting into two words the card currently conflates.

- **Observed envelope** — one number, per machine, re-measurable, no
enforcement. This is what belongs at `README.md:315` and in the wiki page.
- **Enforced ceiling** — per arm, already exists at the eleven sites cited
above. Nothing to add; say so in the docs so the two numbers are not read as
one.
- **Maintenance condition** — the standing re-measure rule the owner proposed.
This is not a nice-to-have: it is what keeps the goal's "**run within it**"
branch *true*. Without it the deliverable decays into a false statement of
fact, which is worse than no doc.

**Settlements on the four items.**

1. **`.pyc` residue — (a) in scope, narrowly; (c) for the file itself.** The
residue file is environmental (gitignored, regenerable, absent from CI and from
a fresh worktree) and no commit may touch it. But the *scan domain* fix rides
this card. I correct the owner's inference: the residue does **not** block this
card's gates — `council/agents/council-runner.md` (`<main_repo_immutability>`,
`<skeptic_dispatch_subject>`) pins the implementing and verifying runs to a head
worktree created with `git worktree add`, which carries no gitignored residue
(`vault/wiki/main-repo-immutability.md`). It rides anyway because the deliverable
is a *re-measurable* command (`time bun test` + the per-file loop) that the
README addresses to exactly the tree where the residue survives, and because the
trap re-arms at every future token retirement (test 8 × the pty import). Fix =
exclude generated bytecode from `countMatches` (path segment `__pycache__`,
extensions `.pyc/.pyo/.pyd`) with a comment stating the rule. This does not
weaken the witness: every `.py` still under `test/` is re-compiled in-run by
test 8, so scanning its bytecode adds zero information, and orphaned bytecode is
derived from a source that no longer exists, is gitignored, and can never ship.
Testability without polluting the repo: add a `describe("scan domain")` block
**in the same file** that `mkdtempSync`s a temp tree containing a
`__pycache__/x.pyc` with a retired token and a `x.ts` with the same token, and
asserts excluded/hit — two-sided. Acceptance is the orphan criterion: **test 6
passes with `test/__pycache__/ev41-tui.cpython-312.pyc` still on disk.** Fold in
the one-line comment fix at `test/ev41-retry-e2e.test.ts:325`; do **not** extend
the witness's token regex on this branch (that amends FLLWUP-49's committed
witness; record the allowlist-decay as a finding instead).
2. **Where the budget binds — the owner's README + wiki is right; drop the
pretence of a suite ceiling.** `gates.yml` gets no `timeout-minutes` keyed to
the budget, and here is the file-grounded reason: the TUI arm's own enforced
ceiling is `300_000` at `ev41-retry-e2e.test.ts:362`, **larger than any proposed
~180 s suite budget**, so a step timeout tight enough to express the budget would
pre-empt the arm's own timeout and convert a correctly-attributed arm failure
into an infrastructure cancel. A cutoff loose enough not to fire (~15 min)
cannot express a 2-minute budget. So: enforced = per-arm ceilings (exist);
documented = README line + wiki page with provenance (machine, date, SHA,
command) and the re-measure trigger. If the repo wants a `gates.yml` runaway
backstop, that is a separate small item with its own rationale, not this card's
budget.
3. **Document vs gate — "document" is permitted as a *fact*, not a judgment,
once measured.** The goal is a conjunction whose second half is a disjunction:
`(documented) and (run within it or gated)`. A measurement showing the suite
inside the documented envelope discharges the "run within it" branch by truth,
not by taste. So the card needs **no ruling-seat decision on gate-vs-document**;
the residual open judgment is only the figure and the doc locations (phase-1
already assigned "where it lives" to the deliberation as a design/writing
question). Gating stays available as the branch that reopens *if* the envelope
is ever false — that is what the re-measure rule protects. Agreement with the
owner's conclusion, with the reasoning corrected from "gating would be worse" to
"gating is not the branch the measurement picks".
4. **`AGENTS.md:17` — fix it here, and make it non-decaying.** It is the same
file family the card is already documenting and it is provably stale from files
alone: two `test.skipIf` sites vs "1 skipped"; two opt-in flags vs one named.
Replace the brittle count with the envelope and the flag list (`bun test  # full
suite (≈2 min); integration/context7 probes are opt-in — COUNCIL_INTEGRATION=1,
COUNCIL_MCP_INTEGRATION=1`), take the wall-clock figure from the
implementation-pass run, and keep `README.md:315` and the wiki page stating the
same number. Docs only → inside the phase-1 carve-out, **no escalation**; the
escalation trigger remains what round 1 flagged: any new flag name or any string
added to `council/preflight.sh`, and no new flag is minted under this delivery.

Zero-new-live-arms (FLLWUP-49 O10): the delivery adds zero live arms and moves
none — baseline `ev40-headless` 3, `ev40-live-gates` 5, `ev41-retry-e2e` 5,
`ev43-reachability` 2 unchanged; the added scan-domain assertions spawn nothing.
Docs: `vault/wiki/index.md` (catalog — no page covers suite cost, so the new page
must be added to the catalog, not just created) and
`vault/wiki/main-repo-immutability.md` (worktree-only, which is why the residue
does not gate this card).

### Testable claims (runnable; explicit timeouts; each falsifiable)

1. **Residue is orphan bytecode, not source.** `timeout 60 grep -a -o -e
'ev43/ev43-falsifier' -e 'ev43/falsifier' -e 'test/ev41-tui.py'
test/__pycache__/*.pyc test/faux-provider/__pycache__/*.pyc | sort -u` (use
shell grep, not a gitignore-aware tool) → hits in
`test/__pycache__/ev41-tui.cpython-312.pyc`. Falsifier: no hit ⇒ the residue is
not the token carrier and my Q1 story is wrong.
2. **Orphan acceptance, with the file left in place.** `timeout 120 bun test
test/faux-provider-shape.test.ts` → pre-fix `7 pass / 1 fail`; post-fix `8 pass
/ 0 fail` **with `test/__pycache__/ev41-tui.cpython-312.pyc` still on disk**.
Falsifier: post-fix green only after deleting the orphan ⇒ the exclusion did not
take.
3. **The witness is not weakened (two-sided).** In the committed temp-tree
test: a `x.ts` containing `ev43/ev43-falsifier` must still produce a hit, and a
`__pycache__/x.pyc` containing the same token must not. Falsifier: the `.ts` case
stops hitting ⇒ exclusion is too broad.
4. **Enforcement already exists per arm; none per suite.** `timeout 60 grep -nE
'^[[:space:]]*[0-9_]+000,$' test/ev41-retry-e2e.test.ts test/ev40-headless.test.ts
test/ev40-live-gates.test.ts test/ev43-reachability.test.ts` → the eleven sites
above, including `362: 300_000`. `timeout 60 grep -nE 'timeout-minutes|timeout '
.github/workflows/gates.yml` → no match. Falsifier: exhibit a live arm with no
timeout argument.
5. **Nothing in `gates.yml` may be keyed to the budget.** `timeout 60 grep -n
'300_000' test/ev41-retry-e2e.test.ts` (362) vs the proposed suite budget: the
arm ceiling exceeds it. Falsifier: show a suite-level ceiling that coexists with
the arm's own 300 s timeout without masking attribution.
6. **The "run within it" branch is discharged by measurement.** `timeout 600 bash
-c 'time bun test'` on the head worktree, recording SHA (`timeout 60 git -C
<worktree> rev-parse HEAD`), machine, and date → exit 0 and total inside the
documented envelope. Falsifier: green run materially above the envelope on
CI-class hardware ⇒ the document branch is false and gating reopens (the owner's
claim 1, which I accept).
7. **`AGENTS.md:17` staleness is provable statically.** `timeout 60 bash -c 'grep
-rn "skipIf" test/ | wc -l'` → 2; `timeout 60 grep -rn
'COUNCIL_INTEGRATION\|COUNCIL_MCP_INTEGRATION' test/ README.md AGENTS.md`.
Falsifier: one skip-gated test and one flag ⇒ the block is not stale.
8. **Zero-new-live-arms.** `timeout 60 bash -c 'for f in ev40-headless
ev40-live-gates ev41-retry-e2e ev43-reachability; do printf "%s " $f; grep -c
"test(" test/$f.test.ts; done'` → 3 / 5 / 5 / 2, unchanged before and after. Any
delta means the ceiling work was implemented as an arm rather than as
documentation or an in-file assertion.

No reframe is needed beyond the vocabulary split in "Reframe" (observed
envelope vs enforced ceiling vs maintenance rule); the design the owner and I
are converging on is one branch — README envelope + maintained wiki page with
provenance and re-measure rule + no new gate + three bounded hygiene fixes
(bytecode exclusion with a two-sided temp-tree test, `:325` stale comment,
`AGENTS.md:17`) — and both seats should sign it as-is.
