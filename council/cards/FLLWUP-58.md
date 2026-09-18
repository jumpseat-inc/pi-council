---
id: FLLWUP-58
title: Runaway timeout-minutes backstop on the gates CI job
state: Deliberating
owner: null
epic: EPIC-9
goal: The gates workflow fails bounded on a runaway test step via a loose timeout-minutes, sized so it never pre-empts an arm's own ceiling, with the CI-timeout policy documented.
---

## Intent

`product-owner`'s FLLWUP-48 ruling 2 deferred a `gates.yml` `timeout-minutes`
as "CI-timeout policy is a separate question (different rationale, revision
path, and interaction with the per-arm `spawnSync` ceilings)" — a deferral,
not a rejection. The deciding arithmetic is recorded on FLLWUP-48 and in the
test-suite-budget page: the TUI arm's own `300_000` ceiling at
`ev41-retry-e2e.test.ts:362` exceeds any ~180s suite budget, so a
budget-keyed step timeout masks attribution. This card owns the runaway
backstop variant, sized loose enough never to pre-empt an arm.

Approved by `product-owner` (job-29) from FLLWUP-48's step-13 draft 1.

## Run record (features-deliver / FLLWUP-58 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`council/cards/EPIC-9.md` run-2 block): `FLLWUP-50` through
  `FLLWUP-60` "are this run's delivery scope". `FLLWUP-58` is the
  **eleventh and final** card of the `steward` job-1 build-order ruling
  ("…the allowlist policing (`59`) over the settled harness, and the CI
  runaway backstop (`58`) last, sized against the final arm set"). Run-2 precedent (FLLWUP-59, which itself cited run-1 precedent
  `5608ed1`): the autonomous promotion moves the residual card to its working
  state at its runner's start. The card's creation was already ratified by
  `product-owner` (job-29, FLLWUP-48 step-13 draft 1 confirmed) — the
  promotion-ratification power re-homed per `features-deliver.md`'s authority
  map.
- **Path: full council.** The `goal`'s sizing decision — a loose
  `timeout-minutes` "sized so it never pre-empts an arm's own ceiling" —
  admits more than one reasonable design, and the deferred FLLWUP-48 item
  carried exactly two positions on it (owner: ~10 min, 6.4× headroom;
  principal: the 300s TUI-ceiling arithmetic argues the cutoff must sit well
  above it). That is `spec-ambiguous` plus `design-judgment`; either
  suffices per council.md step 1. Not cross-seam in the repo-area sense (one
  CI workflow file plus developer documentation only).
- **Surface-touching: no (recorded).** The deliverable is internal CI
  tooling and developer documentation: no product-visible surface, no
  user-visible copy (platform-generated GH Actions failure text is not our
  copy), no empty state, no error state. No `designer` is seated. A design
  concern on this card would be filed as a step-13 follow-up, not used to
  seat `designer`.
- **Card-specific constraint recorded (FLLWUP-59 step-13 ruling R2,
  `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md`):** `fetch-depth: 0` on
  the `gates.yml` checkout step (added by FLLWUP-59, PR #76) **stays**, and
  any edit introducing a non-full fetch depth makes FLLWUP-59's
  truncated-history canary CI-load-bearing. A constraint, not a goal
  amendment — the falsifier work is not folded into this card. Preserved in
  every edit to `gates.yml` this card makes.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position (last,
  sized against the final arm set); **R2** governs the later merge
  (`gh pr merge <PR> --squash --admin --match-head-commit <X>`, all five
  deterministic criteria); **R3** governs record pushes (direct to `main`,
  admin identity, disclosed); the run-wide **zero-new-live-arms** constraint
  (FLLWUP-49 O10) applies — a `timeout-minutes` line binds the existing run
  and is neither an arm nor a move, but the final arm set is what the
  sizing is checked against; and step-13's draft-then-confirm gate is
  re-homed to `product-owner` as **pre-write** (this container drafts, never
  writes an unapproved follow-up, and never dispatches `product-owner`).
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` (nine files) and in the installed package
  clone (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`);
  no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by
  this container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). `python3
  council/validate.py` → `All council artifacts valid`. Local `main` ==
  `origin/main` at `b0af8a4` (FLLWUP-59's merge `e1b7801` and its step-13
  ruling record are the newest history; FLLWUP-50–57 and 59 all merged;
  working tree clean). No `Needs Human` state and no outstanding ruling on
  this card — deterministic merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`, plus
  `bash council/preflight.sh FLLWUP-58` (the FLLWUP-27
  stale-by-construction line aside, when it recurs).
- **Final arm set carried in (verified on this tree, `b0af8a4`):**
  `ev40-headless` 3, `ev40-live-gates` 5, `ev41-retry-e2e` 5,
  `ev43-reachability` 2, `ev41-seat-child-live` 2 — **17 live arms**, the
  set `steward` job-1 sized this card against. The deciding arithmetic is
  verified in the tree: the TUI arm's enforced ceiling is `300_000` at
  `test/ev41-retry-e2e.test.ts:362` (measured actual ≈32s per
  `vault/wiki/test-suite-budget.md`); the largest suite-envelope figure in
  play is the 180s **drift threshold** (PO FLLWUP-48 ruling 1 — descriptive,
  not normative). The backstop must be sized loose enough to never pre-empt
  any arm's own ceiling.
- **Evidence base read before this decision:** `council.md` and
  `features-deliver.md` in full; `council/cards/FLLWUP-58.md`,
  `FLLWUP-48.md` (full run record, including PO ruling 2's deferral and
  step-13 draft 1), `FLLWUP-59.md` (run record and its step-13 ruling
  pointer); `.github/workflows/gates.yml` (current: `fetch-depth: 0` on the
  checkout step, bare `bun test`, **no** `timeout-minutes` anywhere);
  `vault/wiki/test-suite-budget.md` (envelope 101.2s, per-arm table, the
  "no suite-level ceiling — and none is added" line this card now amends);
  `EPIC-9.md` (run-2 Phase-1 block).
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently
  on the card alone (no `designer` — not surface-touching).


### Step 2 — independent first pass (round 1)

Two generators dispatched independently on the card alone (no `designer` — not
surface-touching). Jobs: `owner` `job-28.1` (5.3m, 5 turns), `principal`
`job-28.2` (5.3m, 19 turns), both settled `done`. Positions appended verbatim.

#### Position — `owner` (job-28.1)

**Approach — job-level `timeout-minutes: 120`, sized by the strict
never-pre-empt floor.** Re-derived the sizing from the ceiling inventory on
this tree rather than from FLLWUP-48's remembered numbers, departing from
FLLWUP-48's own owner position (~10 min): that figure predates the
principal's 300s-ceiling arithmetic and only tolerates a *single* hung arm.
The never-pre-empt rule, taken strictly, prices the backstop at the worst
schedule in which every arm hangs and each trips its **own** ceiling before
the backstop can fire — because that is the only scenario in which the
backstop is guaranteed to fire last. Everything else is a probabilistic
compromise. Also decides **job-level**, not step-level, placement, and
documentation in the wiki budget page plus an inline YAML comment.

**1. The number: `timeout-minutes: 120` on the `gates` job.** Arithmetic
against the strict never-pre-empt floor:

| Quantity | Value | Source |
|---|---|---|
| Live arms (verified on this tree) | 17 (`ev40-headless` 3, `ev40-live-gates` 5, `ev41-retry-e2e` 5, `ev43-reachability` 2, `ev41-seat-child-live` 2) | wiki `test-suite-budget.md`, confirmed in run record |
| Largest arm ceiling | `300_000` ms (`ev41-retry-e2e.test.ts:362` TUI pty; also `ev40-headless.test.ts:66,117`, `ev43-reachability.test.ts:106`) | grep on tree |
| Other ceilings | 6×180s (`ev40-live-gates` ×5, `ev41-retry-e2e.test.ts:320`), 2×120s explicit (`ev41-seat-child-live.test.ts:227,303`), harness default 120s (`test/faux-provider/harness.ts:302`) | grep on tree |
| **Strict floor: all 17 arms hang at max ceiling** | 17 × 300s = **5100s ≈ 85 min** | derived |
| Non-arm suite time (75 fast files) | ≈23s local; ~2× on hosted runners ≈ 1 min | wiki table |
| **Strict never-pre-empt floor** | **≈ 86–87 min** | derived |
| **Proposed backstop** | **120 min** | ≈1.4× floor, 3× under the platform default 360 |

Why the strict bound rather than a sum-of-actual-ceilings figure (~52 min by
site: 4×300 + 6×180 + 7×120): the site→arm mapping is not 1:1 verifiable
from the code without reading every arm call (13 explicit sites + harness
default vs 17 arms), and a sum keyed on that mapping is a fragile invariant.
`arms × max-ceiling` needs only two numbers anyone can re-derive from the
wiki table and one grep. The ~33 min of slack above the floor is deliberate:
it absorbs runner variance on the fast files and any future arm whose
ceiling exceeds 300s by a little.

**Why not the 10 minutes FLLWUP-48's owner round once floated:** a single
hung TUI arm fires its 300s ceiling at minute ~5 only if the suite reaches
it fast; but a two- or three-arm hang cascade (~7–10.5 min of serial
ceilings) blows past 10 min with arms still inside their ceiling windows —
exactly the attribution masking the PO deferred to avoid. 10 min was sized
against 94.4s envelope arithmetic, not ceiling arithmetic. The principal was
right.

**Why job-level, not step-level:** the only step with an open-ended failure
mode is `bun test`; `bun install --frozen-lockfile` (~30–60s),
`bunx tsc --noEmit` (~10–20s), and `python3 council/validate.py` (<1s) are
deterministic and bounded, and job-level bounds them for free. One line, one
invariant. When the job timeout fires, GitHub marks the step that was
running — step attribution survives — and bun's partial log shows how far
the suite progressed. Step-level would add a second knob with no additional
guarantee.

**What firing means (the designed division of labor):** an arm that hangs
trips its *own* ceiling (spawnSync `timeout` at `harness.ts:302`, bun
per-test third positional arg) and fails **that test** with test-level
attribution — the suite continues and exits failed. The only failures that
can reach the 120-min backstop are ones the ceilings structurally cannot
catch: a wedged `bun test` process, a hang in module top-level or a hook
outside the timed region, an install/runner wedge. That is the "runaway
backstop" the card names, and it is why the number can be loose without ever
racing an arm.

**Interaction risks:**

- **GitHub cancel semantics.** Job timeout cancels the job; the hosted
  runner kills the step's process tree. The pty/spawnSync grandchildren die
  with the ephemeral VM — no orphan contamination across runs, worst case a
  wasted run. No `cancel-timeout` knob needed.
- **bun's kill behavior.** On cancellation bun abandons in-flight tests;
  per-test results up to the kill are in the log. Leaked `mkdtemp` scratch
  dirs die with the VM. No cleanup obligation.
- **Drift coupling.** The 120 must never be read as "the suite may take up
  to 120": the 180s drift threshold remains the only drift alarm. If the
  suite silently drifted to, say, 30 min, the backstop would still never
  fire — by design. The wiki section must say this explicitly or someone
  will later "tighten" the number as a drift enforcement, which is precisely
  the FLLWUP-48 mistake re-made.
- **Maintenance coupling.** Every new arm adds ≤ its ceiling to the strict
  floor. The wiki maintenance rule must extend FLLWUP-48's rule 1: *new arm
  ⇒ re-derive the backstop floor; shrinking also requires re-derivation.*
  The static falsifier below enforces it mechanically.
- **O10.** A `timeout-minutes` line binds the existing run — not an arm, not
  a move. The 17-arm set is untouched; `fetch-depth: 0` stays verbatim.
- **Accepted cost.** A truly wedged run now burns up to 120 hosted-runner
  minutes before failing. That is the price of a provably never-pre-empting
  backstop; at ~3× under the platform default it is still a 4× tightening of
  today's ceiling.

**2. Documentation: two places, not README, not AGENTS.md.**

- **`vault/wiki/test-suite-budget.md`** — new section *"CI backstop
  (`gates.yml` `timeout-minutes`)"* after "Ceiling vs budget". Must state:
  (a) the four-tier ladder — measured envelope ≈101s (descriptive) → 180s
  drift threshold (the alarm) → per-arm ceilings 120–300s (emergency bounds,
  fire per test) → gates backstop 120 min (fails bounded what the ceilings
  can't catch); (b) the never-pre-empt rule **with its arithmetic** (≥ arms
  × max-ceiling + fast-file drift; currently 17 × 300s + slack ≈ 87 min
  floor, shipped 120); (c) what firing means — a failure class outside any
  timed region, attribution is step-level, not test-level; (d) the
  maintenance rule — any arm addition or ceiling change re-derives the
  floor, in either direction.
- **A comment in `gates.yml`** on the line itself naming the rule and
  pointing at the wiki page.

Not README (consumer-facing install/usage; this is contributor CI policy).
Not AGENTS.md (package conventions, not CI arithmetic).

**3. Tradeoffs accepted.** The backstop cannot be proven never-pre-empting
by a *cheap* behavioral test; the guarantee is enforced by static derivation
+ probes. 33 min of slack above the strict floor buys robustness at the cost
of longer wedged-run billing. Job-level placement means the single number
serves two purposes (test runaway + install wedge). Accepted for one-knob
simplicity.

**4. Testable claims for the Skeptic (each with an explicit timeout):**

1. **Static invariant probe** (60s): count arms from the wiki table (17),
   find max ceiling by grep (300_000), parse `gates.yml`'s job
   `timeout-minutes`, assert `timeout-minutes ≥ ceil((17 × 300s + 180s) /
   60s)` = 88. Shipped 120 passes; FLLWUP-48's floated 10 **fails** this
   probe.
2. **`fetch-depth` probe** (10s): `fetch-depth: 0` survives the edit
   verbatim (FLLWUP-59 R2 constraint).
3. **Green-envelope probe** (900s): `bun install && time bun test` completes
   under 180s (drift threshold) and under 2% of the backstop — the backstop
   is unreachable on green runs.
4. **Slowest-arm probe** (420s): `time bun test
   test/ev41-retry-e2e.test.ts` completes ≈38s ≪ its 300s ceiling —
   13%-of-ceiling daylight.
5. **Doc probe** (10s): wiki CI-backstop section asserts all three required
   statements (ladder, never-pre-empt arithmetic, firing semantics);
   `gates.yml` inline comment names the rule.
6. **YAML parse probe** (10s): parse `gates.yml` — the edit must not break
   workflow parseability.

Behavioral claim stated but deliberately not gated as a red: a hung arm
trips its own ceiling first and fails only that test (`harness.ts:302`
passes `timeout` to `spawnSync`); a live red would cost ≥5 CI-minutes to
confirm what the harness's timeout semantics already guarantee.

#### Position — `principal` (job-28.2)

**Cross-seam reading — two record files on one side, one YAML file on the
other, and nothing joining them.**

**The enforced record.** `.github/workflows/gates.yml` is 15 lines:
`fetch-depth: 0` on checkout (FLLWUP-59's CI substrate), then
`bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`,
`python3 council/validate.py` — no `timeout-minutes` at job or step level.
The only ceiling today is the platform's 360 min job default.

**The per-arm record.** Twelve test-level ceilings (bun's third positional
arg) plus one harness default: `300_000` ×4 (`ev41-retry-e2e.test.ts:362`,
`ev40-headless.test.ts:66,117`, `ev43-reachability.test.ts:106`), `180_000`
×6 (`ev40-live-gates.test.ts:84,135,174,209,246`,
`ev41-retry-e2e.test.ts:320`), `120_000` ×2
(`ev41-seat-child-live.test.ts:286,348`), and `timeoutMs ?? 120_000` at
`test/faux-provider/harness.ts:302` (and `:361`). Sums to **2520 s = 42.0
min** if every ceiling trips. Largest single ceiling: **300 s = 5.0 min**.

**The descriptive record.** ≈101.2 s envelope, 180 s drift threshold. CI-class
hardware is explicitly unmeasured (PO ruling 1's O11 split).

**The gap that is the card.** `gates.yml:54-56` of the wiki currently asserts
*"There is no suite-level ceiling — and none is added (PO ruling 2)"*.
Shipping the line without amending that bullet ships a repo where the
enforced artifact and the authoritative doc contradict each other, and
nothing detects it: **`grep -rn 'gates.yml' test/` returns zero matches** —
no test in this repo reads the workflow file at all. The doc↔line pair is a
hand-maintained invariant with no net under it, which is precisely the decay
class FLLWUP-59 built a derived mechanism to kill for path tokens.

**Why the backstop is not redundant with the arm ceilings.** The per-arm
ceilings are JS timers *inside* the process the backstop would kill. A
wedged event loop, an uninterruptible sync block, OOM thrash, or a hung
`bun install`/`tsc` cannot fire its own inner ceiling, because the thing
that would fire it is the thing that is stuck. So the backstop is the only
bound in that failure class — and conversely it can never attribute *inside*
the process: it only truncates the log. Neither subsumes the other; the
complementarity is the design.

**Where it binds — job vs. step.** Per the workflow-syntax reference:
step-level "maximum number of minutes to run the step before **killing the
process**" → **failed step** → failed job, names the step, truncation point
names the file in flight. Job-level **cancels** the job — same class as a
manual cancel; names no step. The card's own rule — "a tripped backstop must
name the runaway, not pre-empt a correctly-attributed arm failure" — makes
step-level the primary. Also: the harness builds a **whitelist** env
(`harness.ts:158-165`, comment "nothing else inherited (FLLWUP-21
env-split lesson)"), dropping `RUNNER_TRACKING_ID`, so harness
pty/CLI grandchildren are invisible to the runner's orphan sweep; the bound
still holds because `runs-on: ubuntu-latest` destroys the VM at job end.
Documented-reading consequence: **absence of "Terminate orphan process"
lines is not evidence nothing hung.**

**Sizing.** Floor = largest single ceiling + a full envelope-sized
remainder: 300 + 101 ≈ 401 s ≈ **6.7 min** is the mathematical minimum;
anything ≤ 5 min is disqualified outright (it pre-empts the TUI arm at
`:362`). From one arm to several simultaneously, the number becomes a
truncation policy:

| trips | wall clock | backstop that tolerates it |
|---|---|---|
| 1 | 401 s (6.7 min) | ≥ 10 min (2× envelope remainder slack) |
| 2 | 701 s (11.7 min) | **15 min** |
| 3 | 1001 s (16.7 min) | 20 min |
| 4 (all 300 s-class files) | 1301 s (21.7 min) | 30 min |
| all 12 ceilings | 2520 s (42.0 min) | 45 min — the literal never-pre-empt-any-arm reading |

**Every additional 5 minutes buys exactly one more simultaneous 300 s-class
arm hang.** That is the entire design space.

**Recommendation: `timeout-minutes: 15` on the `bun test` step.** Arithmetic:
900 s = 3.0× the largest arm ceiling, 8.9× the measured envelope, 5.0× the
drift threshold, 2.15× the 6.7 min one-trip worst case, tolerates a two-arm
hang (701 s) with 199 s slack. Also the number already in the record ("a
cutoff loose enough not to fire (~15 min)", FLLWUP-48 step-3/principal;
step-4 consolidator) — one number in the repo's vocabulary instead of a
third. Because a backstop is supposed to fire approximately never, the
argument for going higher is genuine, not taste — which is exactly why **the
policy must state the tolerance depth, not just the number**.

**No job-level line in this card.** A job-level net coupled to a step-level
line makes the step's effective window a function of an **unmeasured
preamble** (`fetch-depth: 0` full-history checkout + `bun install` + `tsc`),
and history growth silently eats step headroom under a fixed job number. If
whole-job coverage is wanted later: job-level must be ≥ preamble_max + 15 +
validate, and the inequality goes in the policy.

**Documentation.** (a) **Amend `test-suite-budget.md:54-56`** ("no
suite-level ceiling — and none is added") — leaving it is the single largest
silent-drift risk. (b) New section: the backstop line, budget≠ceiling
restated, the never-pre-empt rule *with its tolerance reading and the
5-min-per-300 s-trip table*, and the read-the-failure rule. (c) New standing
maintenance rule 5: any change to an arm ceiling or any new live arm
re-derives the number; the tripwire test reds if the floor is violated.
(d) `README.md` Development block — one clause appended so the
developer-facing paragraph does not imply "there is no CI ceiling". (e)
`AGENTS.md` — **do not add a new Hard convention unless the wiki source page
is also updated**: `test/fllwup25-agents-page.test.ts` diffs AGENTS.md's
`## Hard conventions` slice against `vault/wiki/sources/2026-08-23-agents.md`
(ordered labels + per-label bold-lead equality + three stated-count sites);
a 14th convention reds `bun test` until all four sites move. A one-line
pointer in `## Commands` avoids that coupling entirely.

**What a tripped backstop must be readable as:** the `bun test` step failed
at N minutes → grep the log for the last file block. If the arm's **own**
ceiling line is *absent*, it was a genuine runaway. If the arm's own failure
line is *present* and the step was still killed, the number is mis-sized (or
the run had more simultaneous hangs than the tolerance) — that is the
discriminator between "runaway" and "pre-emption", and it belongs in the doc
verbatim.

**Reframe: the deliverable is not a number, it is a reading plus a number.**
"Never pre-empts an arm's own ceiling" supports 7 min (one arm, floor), 15
min (two arms), 45 min (all twelve ceilings) — a 6× spread from one
sentence. A YAML line can only carry the number, so unless the policy
paragraph states the tolerance depth and the amendment to
`test-suite-budget.md:54-56`, the shipped artifact re-creates the exact
ambiguity this card exists to close. Second, this is the first CI artifact
in the repo with no gate reading it: the honest form is a pure, offline
tripwire (precedent: `test/fllwup25-agents-page.test.ts`) that *derives* the
max ceiling from `test/*.test.ts` — no hardcoded `300_000` — and asserts the
shipped value exceeds `max_ceiling + drift threshold`, and equals the number
stated in the policy. Pure file reads, zero new live arms, no new
dependency.

**Testable claims:**

- **T1 (30s)** ceiling census: exactly 12 test-level sites (4×300, 6×180,
  2×120) + 2 harness defaults; max = 300_000 = 5 min; test-level sum = 2520
  s.
- **T2 (15s)** `gates.yml`: `fetch-depth: 0` count 1 on the checkout step;
  `timeout-minutes` count 1, on the `bun test` step.
- **T3 (30s)** shipped value positive integer, > 5, ≤ 360; equals the number
  written in the new wiki policy section (doc parity, extractable both
  ways).
- **T4 (60s, offline, pure)** the tripwire reds by mutation: line = 5 → red;
  7 → red at `max_ceiling + 180 s` = 8 min; 15 → green. Must stay a pure
  read.
- **T5 (120s, offline probe, never committed as an arm)** descendant-residue
  claim: detached child survives parent kill → confirms the policy must say
  "the step is killed and the job ends", not "the tree is reaped".
- **T6 (one CI run)** preamble wall clock from a PR run's step timestamps —
  required *only* if a job-level net is ever adopted; currently
  **unmeasured**.
- **T7 (15s)** baseline: `grep -rn 'gates.yml' test/` is empty today; if the
  tripwire is added it is the only such reader — if it stays empty, the
  doc↔line pair has no net and that must be recorded as an owned residual
  rather than an implied guarantee.

**Position:** ship `timeout-minutes: 15` on the `bun test` step (step-level,
not job-level); amend `test-suite-budget.md:54-56` and add the CI-backstop
section with the tolerance reading, the never-pre-empt rule, the
tripped-failure discriminator, and the re-derivation rule; one pointer line
in README/AGENTS `## Commands` (not a new hard convention, to avoid the
FLLWUP-25 parity coupling); one pure offline tripwire test that derives the
ceiling census and pins line↔doc parity.


### Step 3 — bounded exchange (round 2)

Both generators re-dispatched with the other's round-1 position. Jobs: `owner`
`job-28.3` (5.9m, 4 turns), `principal` `job-28.4` (5.9m, 21 turns), both
settled `done`. Positions appended verbatim. Each seat's round 2 responds to
the other's round 1, so the two converge asymmetrically; the remaining
divergence (placement + value + floor model) goes to round 3.

#### Round 2 — `owner` (job-28.3)

**Round-1 self-correction first, because two of my load-bearing numbers were
wrong and the repo's own records say so.**

**Concession 1 — the arm count.** My "17 arms × 300s ≈ 85 min" floor was
doubly wrong. (a) The census is 13 records, not 17: `300_000` ×4, `180_000`
×6, `120_000` ×2, plus the `timeoutMs ?? 120_000` harness default at
`test/faux-provider/harness.ts:302` and `:361`. The principal's count is
exact. (b) Worse, my multiplication assumed arms can hang *simultaneously*.
They cannot: the wiki itself records the suite is serial —
`vault/wiki/test-suite-budget.md`: *"The suite is serial/additive
(`package.json`'s `test` script is bare `bun test` — no `--parallel`)"* —
and I confirmed it empirically: two 2s tests in two files under bare
`bun test` took **4.08s**, not 2s. Hangs accumulate; they never overlap. The
true every-ceiling-trips bound is the **sum** (4×300 + 6×180 + 2×120 ≈
2520s, plus harness-default riders ≈ 42–44 min), not the product. My
≥88-min static invariant was derived from a model the repo's own recorded
facts refute. Retracted.

**Concession 2 — step-level, not job-level.** The attribution argument is
sound: job-level `timeout-minutes` *cancels* (names no step, same class as a
manual cancel), step-level *fails the step* (names the step; the truncation
point names the file in flight). The card's own "must name the runaway" rule
decides this, and coupling a fixed job number to an unmeasured preamble
under `fetch-depth: 0` is a real headroom leak. I withdraw the job-level 120
line from this card. One honest-cost rider: the principal's own motivation
for the backstop cited "a hung `bun install`/`tsc` cannot fire its own inner
ceiling" — but their line does not bound that class either; with no
job-level and no step-level on those steps, a preamble hang is bounded only
by the platform 360-min default. That gap must be *stated* in the wiki
section as accepted-and-known, not left silent (the same inequality clause
the principal reserves for a future job-level line; step-level ceilings on
`install`/`tsc` are the cheaper eventual fix if that class ever bites).

**Correction — the tolerance table's semantics, not its arithmetic.** The
principal's table ("1 trip → ≥10 min; 2 → 15 min; 3 → 20…") is modeled on
overlapping hangs and is wrong in structure: with serial execution, "1 trip"
needs only `max_ceiling + envelope ≈ 400s ≈ 6.7 min`. The table's K×300s
arithmetic coincidentally matches *cumulative* same-class trips, but a doc
written from the simultaneous model lets the next maintainer re-derive a
wrong floor in both directions. The policy must read: **tolerance depth = N
largest-class cumulative trips plus a full drift-threshold envelope.** On
that model, 15 min = 900s tolerates 2 × 300s-class trips beyond a full 180s
drift-threshold envelope (780s, 120s slack) and pre-empts a third ~180s
before its own ceiling would fire — acceptable, because three hung arms is
catastrophic breakage where truncation is diagnostic, not a loss. The
discriminator (last file block; own-ceiling line present vs absent) survives
truncation either way.

**Acceptance — 15 min, with the derivation pinned, not the number.** 900s =
5.0× the 180s drift threshold (the normative bound, not the descriptive
101.2s), > 2 cumulative largest-class trips + full envelope, and it's
already in the record's vocabulary (FLLWUP-48 step-3/4). Two pins required
so it never becomes a magic constant: (a) the wiki sizing rule states the
formula (≥ 5× drift threshold **and** ≥ max_ceiling + drift threshold at
minimum); (b) the wiki bullet amendment must *quote PO ruling 2 and state
what changed* — the ruling's stated reason ("a budget-keyed step timeout
would pre-empt the TUI arm's own 300s ceiling") condemns envelope-scale
values, ~2–3 min, and a 900s ceiling-scale value does not pre-empt a single
trip; the amendment narrows the ruling, it doesn't contradict it.

**Acceptance — tripwire and AGENTS.md.** The principal's tripwire design is
strictly better than my round-1 static invariant: derive the max ceiling
from `test/*.test.ts` (no hardcoded `300_000`), assert shipped >
`max_ceiling + drift threshold`, assert line↔doc parity. I'd add one
relation: assert shipped ≥ 5× the drift threshold. Baseline confirmed:
`grep -rn 'gates.yml' test/` → zero matches; `gates.yml` is 15 lines with no
`timeout-minutes` anywhere. The AGENTS.md `## Commands` pointer-line-only
approach correctly avoids the `fllwup25-agents-page.test.ts` parity
coupling; no new hard convention. The `harness.ts:158-165` whitelist claim
checks out and is neutral between job- and step-level.

**Approach:** Concede the principal's structure (step-level 15,
tolerance-depth policy, derived tripwire, README/AGENTS pointer) — my
round-1 floor was refuted by the repo's own serial-execution record and by
probe. Push back on one thing with evidence: the tolerance model must be
restated as *cumulative* trips (measured 4.08s for 2×2s), and the wiki must
own the preamble-hang gap the step-level line doesn't cover.

**Tradeoffs accepted:** A third simultaneous largest-class hang would be
pre-empted ~180s early — accepted because serial execution makes that a
cumulative-breakage scenario where truncation is diagnostic; preamble hangs
stay bounded only by the platform 360-min default until a later card;
pinning ≥5× drift threshold accepts that a drift-threshold trip reopens
sizing rather than silently absorbing it.

**Testable claims:** T-A serial model (10s, run this round, green —
evidence for the cumulative-trips restatement); T-B census (30s): exactly
{4×300_000, 6×180_000, 2×120_000} + harness default; T-C parity (30s):
shipped value = wiki number, ≥ 5 × 180s, tripwire reds on any mutation; T-D
wiki amendment (15s): the "no suite-level ceiling" bullet amended with PO
ruling 2 quoted and the 900s/serial-cumulative-tolerance basis; section
states the install/tsc-hang coverage gap explicitly; T-E baseline (15s):
`grep -rn 'gates.yml' test/` empty at base, non-empty after the tripwire
lands.

#### Round 2 — `principal` (job-28.4)

Read before this: `vault/wiki/index.md`, `[[test-suite-budget]]`,
`.github/workflows/gates.yml`, `package.json`,
`test/faux-provider/harness.ts`, the four live-arm test files,
`vault/raw/2026-09-19-po-fllwup48-test-suite-budget.md`,
`docs/superpowers/specs/2026-09-19-FLLWUP-48-design.md`. Bun semantics
verified via Context7 (`oven-sh/bun`, "the default value is 5000 ms");
GitHub semantics verified against docs.github.com workflow-syntax plus
community discussion 40582.

**Cross-seam reading — what the two records actually say.**

**Enforced side.** `gates.yml` is 15 lines; no `timeout-minutes` at job or
step level; `fetch-depth: 0` at checkout (`:11-12`). `package.json:28` is
bare `"test": "bun test"` — no `--timeout` global override and no
`--parallel`, so per-test ceilings come only from third-positional-args, and
the suite is serial/additive.

**Ceiling side.** Grep on `test/**/*.test.ts` yields exactly **12 per-test
ceilings**: `300_000` ×4 (`ev43-reachability:106`, `ev41-retry-e2e:362`,
`ev40-headless:66,117`), `180_000` ×6 (`ev40-live-gates:84,135,174,209,246`,
`ev41-retry-e2e:320`), `120_000` ×2 (`ev41-seat-child-live:286,348`). Sum =
**2 520 000 ms = 42.0 min**. Arms and ceilings are *different objects*: the
`ev43-reachability:106` test calls `runHarnessArm` twice; the
`ev41-retry-e2e:320` test calls it for treatment+control; the `:362` test
wraps a `spawnSync(..., { timeout: 280_000 })` — one site, several arms.
Hence 17 arms / 12 sites, not 17 ceilings. Separately, `harness.ts:302` sets
`timeout: opts.timeoutMs ?? 120_000` on a **blocking** `spawnSync`, and
where an arm-bearing test carries no third arg, **Bun's documented default
is 5 000 ms** and a bun-machinery timeout "terminates spawned child
processes."

**Doc side.** `test-suite-budget.md:44-49` lumps "thirteen sites: bun third
positional args plus the `runHarnessArm`/`spawnSync` `timeoutMs`", omitting
the 5 s default; `:54-56` asserts "no suite-level ceiling — and none is
added." `grep -rn 'gates\.yml' test/` is still **zero** — no gate reads the
workflow.

**Platform side.** Docs: step-level = "before **killing the process**"
(failed step); job-level = "GitHub automatically **cancels** it." Community
#40582 records the job-timeout annotation degrading to "The operation was
canceled." and later being restored — the annotation is job-scoped and has
been unstable across the platform's history.

**Point-by-point on the `owner` position:**

1. **10 min is disqualified — conceded.** The TUI arm's own 300 s window
   consumes it alone.
2. **The `owner` is right that 15 min is under-sized — conceded, on the
   strict reading.** My round-1 table already contained the correct "all 12
   ceilings → 45 min" row and then declined to recommend it. With a serial
   suite, the never-pre-empt rule's honest form is a sum, not a tolerance
   count. The `owner`'s reframe ("the deliverable is a reading plus a
   number") is right, and I extend it: the reading is not a tolerance table,
   it is **the census**.
3. **Job-level — conceded, with my round-1 objection withdrawn *for this
   shape*.** My "unmeasured preamble eats step headroom" point only binds
   when a job net is paired with a tight *step* line. With a job-level
   number ≥ ~45 min, the preamble (checkout with `fetch-depth: 0`,
   setup-bun, install, tsc ≈ 1–2 min) is ~2% of the budget. And the `owner`
   under-used their own strongest argument: job-level is the only single
   line that bounds an install/runner wedge at all. Job-level it is.
4. **Push back — the floor arithmetic is wrong by ~2×.** `17 × 300 s = 85
   min` is *not* "the strict never-pre-empt floor". The tree carries exactly
   four `300_000` sites; the rest are 180 s and 120 s, and unlisted tests
   fall to Bun's 5 s default. The realizable strict floor is the serial sum
   **≈ 42.0 min** (+ ~1 min of fast files). So the shipped 120 is **2.9× the
   floor, not 1.4×**. `arms × max` also puts the maintenance rule in the
   wrong **unit** — the unit that changes is arm-bearing *tests* (sites),
   not arms.
5. **Push back — testable claim #1 is an over-constrained probe.**
   `timeout-minutes ≥ 88` would **red a correct 45-min backstop** and
   encodes the impossible schedule into CI. A probe must assert the
   census-derived floor, not `arms × max`.
6. **Push back — the attribution claim is unverified and load-bearing.**
   Job-level's stated advantage is "GitHub marks the step that was running —
   step attribution survives." That is not documented; the annotation is
   job-scoped and historically unstable. The discriminator we actually rely
   on is the **log tail** — which is placement-independent. So placement
   should rest on the install/tsc coverage, and the wiki must state the
   step-naming behavior as a working assumption, not a guarantee.
7. **Doc scope — the new section is not enough.** `test-suite-budget.md:44-49`
   is the sentence the new policy section derives its census from, and it
   currently lumps two mechanisms and omits the 5 s default. That sentence
   must be corrected in the same edit.
8. **Agreed and not contested:** wiki over README/AGENTS (the FLLWUP-25
   parity coupling is real); the amended `:54-56` bullet; the inline YAML
   comment; one offline tripwire pinning line↔doc parity; zero new live
   arms (O10); `fetch-depth: 0` verbatim.

**Reframe.** The deliverable is not the number and not the tolerance depth —
it is **the census the number is derived from, and the census must be
derived from the tree by the tripwire rather than restated in prose.** Once
the census is derived (12 sites: 4 × 300 s, 6 × 180 s, 2 × 120 s, plus
derived 5 s-default sites; serial sum ≈ 42 min), the never-pre-empt rule has
exactly one honest form:

```
timeout-minutes ≥ ceil(census_serial_sum + fast_files) / 60
```

and every value at or above that floor is a pure cost decision about
wedged-run billing, with zero attribution difference. On that reading my
shipping recommendation is **`timeout-minutes: 60` at job level — 1.4× the
census floor, the ratio the `owner` argued for, at the correct floor** —
with the wiki stating floor ≈ 42 min, ratio 1.4×, and the census. If the
`owner` prefers 120, I do not block: 120 is safe. But it must then be
described as "2.9× the census floor, chosen for wedged-run log
completeness", and the probe must still assert the 42-min floor. What I do
not accept shipping is the combination of (a) the 85-min floor, (b) the
"1.4× floor" framing at 120, and (c) the `≥ 88` probe.

**Testable claims:** C1 census (30s, offline): multiset
{300_000: 4, 180_000: 6, 120_000: 2}, Σ = 2_520_000 ms; falsifies
`17 × 300_000` as a realizable schedule. C2 default tier (30s): count
arm-bearing tests with no third arg (Bun's 5 s default), add `n × 5_000 ms`.
C3 mechanism split (60s, probe): sync arm's binding bound is the inner
`spawnSync` timeout; the async pty arm's is the outer test timer. C4
tripwire mutation (30s, pure): reds at 42 (below floor), green at 45, 60,
120. C5 doc parity (10s): shipped number = wiki number; section states the
census-derived floor, not `arms × max`; `:44-49` corrected. C6 placement
(10s): parse rejects a step-level `timeout-minutes`; mutation red. C7
`fetch-depth: 0` count 1 after the edit (10s). C8 attribution claim (one
live run, throwaway ref): run the workflow once with `timeout-minutes: 2`
and record verbatim the job annotation text and whether the UI names the
running step — otherwise the wiki marks the step-naming statement as
unverified, not a guarantee.


### Step 3 (cont.) — round 3 (final; ≤3-round cap hit) — exchange CLOSED

Both generators re-dispatched with the other's round-2 position. Jobs: `owner`
`job-28.5` (5.6m, 7 turns), `principal` `job-28.6` (5.6m, 15 turns), both
settled `done`. **The exchange is closed at the cap.** The two round-2 outputs
were cross-purposed in time (each seat conceded toward the other's round-1
shape while the other reversed), so round 3 re-established the real state:
both seats now hold the census-sum floor and the derived tripwire, but
**placement** (owner: job-level; principal: step-level) and **the reading**
(strict/any-arm vs single-arm, deciding 45/60 vs 15) remain open-judgment —
routed via the consolidator at step 5 to `product-owner` at step 6.

#### Round 3 — `owner` (job-28.5) — FINAL

**Convergence: job-level `timeout-minutes: 60`, floor derived from the tree,
not from prose.**

**Approach.** I withdraw the step-level-15 + cumulative-tolerance model from
my round 2. The model dies on a scenario I can verify from the tree: the
suite is serial and additive (bare `bun test`, `package.json:28`), so in a
full network wedge all ceiling-bearing tests can *each* run to their ceiling
serially in one run — the ceiling trip fails the test, the suite moves on,
and the next arm hangs too. The serial sum is the realizable worst case, not
the impossible schedule I called it in round 1. Under that schedule the
`bun test` step legitimately runs ≈42 minutes, and step-level 15 pre-empts a
correct run. The tolerance table was a hand-maintained guess at trip counts;
the census-sum rule is mechanical and tripwire-checkable. The principal's
reframe is the honest form and I adopt it.

**One correction to the principal's census (C1 as stated is wrong, and
proves the tripwire's own point).** Verified against the tree:
`ev41-retry-e2e.test.ts:259` carries a third-arg `20_000` (the hub
job-tree-row unit test) that the multiset `{300_000:4, 180_000:6, 120_000:2}`
omits. The strict third-arg census is **{300_000:4, 180_000:6, 120_000:2,
20_000:1} = 13 sites, Σ = 2 540 000 ms ≈ 42.33 min**. All other anchors
confirmed verbatim; `gates.yml` has 15 lines, no `timeout-minutes`,
`fetch-depth: 0` at `:11-12`; `package.json:28` bare `bun test`. The
recommendation is unchanged — 60 is 1.42× the corrected floor — but a pinned
multiset in C1 would go red against the tree within weeks. **The tripwire
must derive the sum from the test tree at tripwire-run time and assert
`timeout-minutes ≥ ceil(derived_sum + fast_files_margin)/60000`; it must
never restate the multiset or the 42 as constants.**

**Position points, final form:**

1. **Placement: job level.** At 60, the ~1–2 min preamble is ~2%. Job level
   is also the only single line bounding an install/runner wedge, and the
   log tail (the attribution mechanism we actually rely on) is
   placement-independent.
2. **Value: 60** — 1.42× the corrected census floor. I do not reopen 120.
3. **My `≥ 88` probe: withdrawn** — it encoded my retracted 85-min floor
   into CI and would red a correct 45-min backstop.
4. **Wiki/doc scope: agreed.** Amend the "no suite-level ceiling" bullet to
   state the backstop, quote PO ruling 2 and what changed (the ruling's
   pre-emption objection binds a *tight budget-keyed* timeout, not a backstop
   ≥ the serial sum), and correct the "Ceiling vs budget" census sentence.
5. **Attribution (C8): optional-second.** The 2-minute live run gates
   nothing; the wiki states step-naming as a working assumption either way.
   Marking it unverified in the wiki is acceptable and unblocks shipping.
6. **C6 amendment:** the tripwire asserts not just presence and floor but
   *placement* — exactly one `timeout-minutes`, at job level, none under any
   step (that encodes the PO-ruling-2 boundary mechanically).

**Tradeoffs accepted.** A wedged run now bills up to 60 runner-minutes where
a step-15 net would have cut the test step at 15; I accept ~1.42× floor as
the price of never pre-empting a correct full-wedge run and of one line
bounding every wedge class including install. I give up step-level annotation
granularity — accepted because the attribution mechanism we rely on (log
tail) doesn't depend on it and the step-naming claim is unverified anyway.

**Testable claims (carried, with C1 amended):** C1′ tripwire derives Σ from
the tree = 2 540 000 ms over the 13-site multiset, greens at 60 / reds at 45
or below (pure, ~30s); C2 Bun 5 000 ms default tier counted for arm-bearing
tests lacking a third arg; C3 sync arm binds at inner `spawnSync` timeout,
pty arm at outer test timer; C4 mutation red/green per C1′; C5 shipped =
wiki number, census-derived-floor language, census sentence corrected; C6′
placement-parsing red on step-level placement; C7 `fetch-depth: 0` count 1;
C8 optional-second live annotation capture, wiki marks unverified otherwise.

**Nothing further to add — placement, value, tripwire derivation rule, and
doc scope are agreed at: job-level `timeout-minutes: 60`, tree-derived floor
≈ 42.33 min, derived-not-restated tripwire with placement assertion, wiki +
`test-suite-budget.md` corrected in the same edit, C8 optional-second.**

#### Round 3 — `principal` (job-28.6) — FINAL

Read for this round: `vault/wiki/index.md`, `[[test-suite-budget]]` (full),
`[[gate-parity]]`, `.github/workflows/gates.yml`, `package.json`,
`test/faux-provider/harness.ts:290-365`, all five live-arm test files,
`test/hub.test.ts:88-125`, `test/integration.test.ts`,
`test/mcp/integration-context7.test.ts`, `council/cards/FLLWUP-58.md`.

**Cross-seam reading — the two records, and the one both seats read wrong.**

**Enforced side (unchanged).** `gates.yml` is 15 lines; no `timeout-minutes`
at job or step level; `fetch-depth: 0` at checkout. `package.json:28` is
bare `"test": "bun test"`. The only ceiling is the platform 360-min job
default.

**The census — a correction both seats need.** The card, the `owner`'s
round-2 "13 records," and my own round-1 "12 sites" all scanned **only the
five live-arm files**. A whole-tree scan (`^\s+\d[\d_]*_000,$`, plus the
expression form) yields:

| Ceiling | × | Sites | In default `bun test`? |
|---|---|---|---|
| `300_000` | 4 | ev43:106, ev41-retry-e2e:362, ev40-headless:66,117 | yes |
| `180_000` | 6 | ev40-live-gates:84,135,174,209,246; ev41-retry-e2e:320 | yes |
| `120_000` | 2 | ev41-seat-child-live:286,348 | yes |
| `20_000` | 1 | **ev41-retry-e2e:259** | yes |
| `15_000` | 3 | **hub.test.ts:96,109,121** | yes |
| `60_000` | 1 | **mcp/integration-context7:24** | no (`test.skipIf` on `COUNCIL_MCP_INTEGRATION`) |
| `6 * 60_000` = `360_000` | 1 | **integration.test.ts:60** | no (`test.skipIf` on `COUNCIL_INTEGRATION`) |

Default-suite explicit ceilings: **16 sites**, Σ = 2 585 s ≈ **43.1 min**.
Include the two gated sites: 18 sites, Σ ≈ 50.1 min. The two inner harness
bounds (`harness.ts:302`, `:361`, `?? 120_000`) are *not* test-level ceilings
and must not be summed into the census. `test-suite-budget.md:48-50` already
says "thirteen sites" and lumps the two mechanisms — that sentence is a
hand-maintained census that is **wrong today**, before this card ships.

Two consequences neither position priced:

1. **The card's "largest ceiling = 300 s" is a default-suite fact, not a
   tree fact.** The tree's largest test-level ceiling is `360_000`
   (`integration.test.ts:60`), gated. Nothing in the record says that
   scoping, so a future maintainer re-deriving from the tree gets 360 s and
   possibly a gated test that isn't in CI.
2. **The proposed tripwire is under-scoped and its parser is fragile.** My
   round-1 phrasing derived the census from `test/*.test.ts` — that glob
   does **not** match `test/mcp/integration-context7.test.ts`, and a literal
   `_000` regex does **not** match `6 * 60_000` at `integration.test.ts:60`.
   A "derived" census with those two holes re-creates exactly the
   hand-maintained drift the tripwire exists to kill, but with a green check
   on top of it.

**Gap that is the card.** `test-suite-budget.md:54-56` still asserts *"There
is no suite-level ceiling — and none is added."* `grep -rn 'gates.yml'
test/` is zero. Shipping the line without amending that bullet ships an
enforced artifact contradicted by the authoritative doc with no net under
the pair.

**Reframe.** "Never pre-empts an arm's own ceiling" has two readings:

- **Single-arm (PO's stated reason):** floor = `max_ceiling + envelope ≈ 6.7
  min`. Every value ≥ ~10 is a pure billing choice. **15 and 45 are both
  conformant.**
- **Any-arm / strict:** floor = default-suite census-sum ≈ 43 min. **15 is
  non-conformant** — it truncates the third cumulative arm before its own
  ceiling, which is the literal text.

The `owner`'s tolerance model is the strict reading's arithmetic with a
deliberate *count cap*; that cap is a policy choice the card does not
authorize in prose. So the deliverable is **(reading, census, number)** — and
the census must be machine-derived from `test/**/*.test.ts` (recursive)
parsing both literal `_000` and expression ceilings, with gated
(`test.skipIf`) sites reported separately from the default-suite floor.

**My final position:**

1. **Placement: step-level `timeout-minutes` on the `bun test` step.** The
   `owner`'s attribution argument is sound and it is the card's central value
   (PO ruling 2's own words: "step timeout would … mask attribution"); the
   job-level coverage advantage over `install`/`tsc` is real but out of card
   scope. I **withdraw** my round-2 job-level placement.
2. **Value: 45 min** (default-suite census-sum ≈ 43.1 min, rounded). This
   satisfies the strict reading with no carve-out, and it is "loose" per the
   card. **60 is equally acceptable** (my round-2 number; ≥ floor). **15 is
   acceptable only if** the wiki explicitly narrows "never pre-empts an
   arm's own ceiling" to the single-arm reading — and that narrowing is a
   PO-facing change, not one either generator may make unilaterally.
3. **Pins (both seats agree, keep them):** amend `test-suite-budget.md:54-56`
   quoting PO ruling 2 and stating what changed; add the CI-backstop section
   with the reading, the census, and the tripped-failure discriminator; one
   pure offline tripwire pinning line↔doc parity; README/AGENTS `##
   Commands` pointer only (no new Hard convention — `fllwup25-agents-page`
   parity coupling); `fetch-depth: 0` verbatim; zero new live arms (O10).
4. **New pins this round's census forces:** correct `test-suite-budget.md:48-50`
   (16 default-suite sites, not 13; separate the two mechanisms); the
   tripwire scans `test/**/*.test.ts` (recursive) and parses expression-form
   ceilings; gated-integration ceilings (`360_000`, `60_000`) are listed
   *separately* from the default-suite floor; the `install`/`tsc` hang gap is
   recorded as accepted-and-known, with the cheaper eventual fix (tight
   step-level ceilings on those deterministic steps) named.

**Testable claims:** C1 census (30s, offline, fails today): recursive scan
returns exactly `{300_000: 4, 180_000: 6, 120_000: 2, 20_000: 1, 15_000: 3}`
default-suite plus `{360_000: 1, 60_000: 1}` in `test.skipIf` files. C2
parser (15s): the scan must return `integration.test.ts:60`'s `6 * 60_000`;
a literal-`_000` regex returns 17, not 18. C3 scope (15s):
`test/*.test.ts` misses `test/mcp/integration-context7.test.ts`;
`test/**/*.test.ts` catches it. C4 floor (15s): assert
`shipped ≥ ceil(census_sum / 60) + 1`; 15 fails, 45 and 60 pass. C5 reading
pin (10s): the wiki section states which reading it adopts. C6 parity +
placement (30s): shipped = wiki value; exactly one `timeout-minutes`, on the
`bun test` step; `fetch-depth: 0` count = 1. C7 doc (15s): `:48-50`
corrected; `:54-56` quotes PO ruling 2; the `install`/`tsc` gap named as
accepted.

**Final:** step-level `timeout-minutes: 45` on `bun test`; the census
corrected and machine-derived from `test/**/*.test.ts` parsing literal **and**
expression ceilings; the single-vs-any-arm reading stated explicitly; wiki
amendment quoting PO ruling 2; one pure offline tripwire pinning line↔doc
parity; `install`/`tsc` hang gap recorded as accepted residual. The remaining
open item for the consolidator is a single binary: **the reading** — strict
(45/60) or single-arm (15) — plus the placement dispute (owner: job-level
60; principal: step-level 45/60).


### Step 4 — Skeptic attacks and runs tests (`job-28.7`)

`skeptic` (13.2m, 17 turns) ran against `0e3220a` with a clean tree, scratch
dirs under /tmp created and removed, no live arms, no CI, no full-suite run.
Report appended verbatim below. **Facilitator transcription (counting only):
ten objections — nine `closed-green` (two with precision corrections), one
`closed-red` that is a record correction (non-blocking), zero
`open-untested`, verdict "no open objections."** The open-judgment disputes
(placement, reading/value) route via the consolidator.

#### skeptic — step 4 (`job-28.7`) — verbatim

**Objections**

1. **Whole-tree ceiling census** — *claim.* Principal round-3: default-suite
   explicit ceilings `{300_000:4, 180_000:6, 120_000:2, 20_000:1, 15_000:3}`
   = 16 sites, Σ = 2 585 s ≈ 43.1 min, plus gated `{360_000:1, 60_000:1}`
   (18 tree-wide). *Settling test.* Recursive `_000` scan of
   `test/**/*.test.ts` + expression-form scan; verify each site is a real
   third positional arg; sum. **closed-green.** Literal scan found exactly 17
   sites; each verified as a third arg of `test(...)`; `integration.test.ts:60`
   is `6 * 60_000` (expression), tree total 18. Default-suite sum = 2 585 000
   ms = 43.08 min; tree incl. gated = 3 005 000 ms = 50.08 min. Both gated
   sites confirmed on `test.skipIf(!enabled)` with
   `COUNCIL_INTEGRATION`/`COUNCIL_MCP_INTEGRATION` env guards.
2. **Owner's 13-site variant** — *claim.* "Strict third-arg census is
   {300_000:4, 180_000:6, 120_000:2, 20_000:1} = 13 sites, Σ = 2 540 000 ms ≈
   42.33 min … verified against the tree." *Test.* Same scan; count hub
   sites. **closed-red (record correction, non-blocking).** The tree carries
   16 default-suite sites: the owner's multiset omits `15_000` ×3 at
   `hub.test.ts:96,109,121` (real third args, default-suite, no skip). The
   multiset as printed is wrong against the whole tree; the owner's own
   design rule ("tripwire must derive the sum at run time, never restate")
   covers it, and round-3 arrived at the right 16/18 via the principal.
   Record note only.
3. **Serial accumulation** — *claim.* Two 2 s tests in two files under bare
   `bun test` take ≈4.08 s (owner). *Test.* Two scratch files with
   `Bun.sleep(2000)`, bare `bun test`. **closed-green.** Ran 2 tests across 2
   files in `[4.08s]` — matches the owner's figure exactly.
4. **Parser fragility** — *claim.* A literal `_000` regex returns 17 not 18
   tree-wide; `test/*.test.ts` misses `test/mcp/…`. *Test.* Both scans.
   **closed-green.** Literal regex = 17 matches (misses `6 * 60_000`);
   top-level glob matches 64 files vs 72 recursive, missing all 8
   `test/mcp/*.test.ts` incl. `integration-context7.test.ts`.
5. **Bun 5 s per-test default + citation** — *claim.* Default third-arg
   timeout is 5000 ms (Context7 `oven-sh/bun`) and a machinery timeout
   terminates spawns; question: does the 5 s tier have members? *Test.* Live
   scratch test with no third arg sleeping 6 s; Context7 lookup; grep all
   `test(` in the five live-arm files. **closed-green.** Empirical:
   `(fail) no-third-arg sleeps 6s [5001.32ms]` — "timed out after 5000ms".
   Context7 confirms "the default value is 5000 ms" and "terminates spawned
   child processes". **Refinement:** the 5 s tier is *vacuous for
   arm-bearing tests* — every test that actually calls
   `runHarnessArm`/`runHarnessArmSigint`/spawns an arm carries an explicit
   third arg; the no-third-arg tests in live-arm files (`ev40-headless:71`,
   `ev41-retry-e2e:83,88`, `ev43:45`) are unit-level and spawn nothing.
6. **Mechanism split** — *claim.* Sync arm binds at inner `spawnSync` timeout
   (`harness.ts:302`, `timeoutMs ?? 120_000`); async pty arm binds at outer
   test timer; `:362` wraps an inner `spawnSync(…, { timeout: 280_000 })`.
   *Test.* Read-only code paths. **closed-green with precision corrections.**
   `:302` passes `timeout: opts.timeoutMs ?? 120_000` into `spawnSync` ✓.
   `ev41-retry-e2e.test.ts:336-348` calls `spawnSync("python3",
   [ev41-tui.py…], { …, timeout: 280_000 })` ✓. Correction: first-to-fire at
   `:362` is the *inner* spawnSync 280 s; the outer 300 s test timer is its
   backstop. Similarly the sigint arms (`ev40-live-gates:219`) have inner
   ceiling `sigint.timeoutMs ?? opts.timeoutMs ?? 120_000` = 120 s default,
   below their 180 s outer. "Binds at the outer test timer" is imprecise as
   binding order; as a test-level ceiling it is correct and all bounds stay ≫
   180 s, so sizing conclusions are unaffected.
7. **Zero net under doc↔line pair** — *claim.* `grep -rn 'gates.yml' test/`
   is empty. *Test.* Run it. **closed-green.** Zero matches (exit 1).
8. **Census sentence drift** — *claim.*
   `vault/wiki/test-suite-budget.md:48` "thirteen sites" is wrong today.
   *Test.* Compare to scan. **closed-green.** Whole-tree default-suite
   third-arg sites = 16 (13 + hub 15 s×3); the sentence also lumps the
   harness default into the same count. Wrong today, before this card ships.
9. **Serial-sum arithmetic** — *claim.* Default Σ = 2 585 s ≈ 43.1 min; tree
   incl. gated ≈ 50.1 min. *Test.* Sum. **closed-green.** 2 585 s = 43.08
   min; 3 005 s = 50.08 min. Also confirmed `package.json:28` is bare
   `"test": "bun test"`, `gates.yml` has no `timeout-minutes`,
   `fetch-depth: 0` count 1 (file is 18 physical / 16 non-blank lines, not
   15 — trivial).
10. **Envelope file count consistency** *(own objection).* Claim: wiki says
    81 files but `test/` holds 72. *Test.* Discovery probe with nested
    `seed/test/*.test.ts` + count. **closed-green (explained, no defect).**
    Bun discovers the 9 fixture-seed test files outside `test/` (72 + 8
    `council/fixtures/*/seed/test/` + 1 `smoke/fixture` = 81), and skips
    dot-dirs (stale `.worktrees/` — 26 of them, 1949 `.test.ts` files total
    — do not contaminate the suite). Fixture seeds carry no `_000` ceilings,
    so a `test/**`-scoped tripwire is adequate for ceiling derivation.

**What I ran** (all with explicit timeouts; no live arms, no CI, no
full-suite run — the envelope is already recorded and a timing census needs
no full run)

- `find test -name '*.test.ts'` → 72 files.
- `grep -rnE '^\s+[0-9_]+_000,' test --include='*.test.ts'` → 17 sites
  (4×300_000, 6×180_000, 2×120_000, 1×20_000, 3×15_000, 1×60_000); each
  confirmed as third positional arg; plus `integration.test.ts:60:
  6 * 60_000`.
- awk sum: default 2 585 000 ms = 43.08 min; tree 3 005 000 ms = 50.08 min.
- Serial probe: `Ran 2 tests across 2 files. [4.08s]` (2×2001.39 ms sleeps).
- 5 s default probe: `(fail) no-third-arg sleeps 6s [5001.32ms]` / "timed out
  after 5000ms".
- `test/*.test.ts` = 64 vs recursive 72; `grep -c mcp` under top-level glob
  = 0.
- `grep -rn 'gates.yml' test/` → zero matches.
- Discovery probe: nested `council/fixtures/x/seed/test/links.test.ts` ran
  under bare `bun test` (2 files, 2 tests); gitignored *and* dot-dir probes
  confirmed bun skips dot-dirs but not gitignored non-dot dirs.
- Read: `harness.ts:150-175` (env whitelist `harnessEnv`, FLLWUP-21 comment)
  ✓; `harness.ts:290-400` (spawnSync timeout at :302; sigint
  `ceiling = sigint.timeoutMs ?? opts.timeoutMs ?? 120_000` with SIGKILL
  deadline) ✓; `ev41-retry-e2e.test.ts:259,320,336-362` (20_000; 180_000;
  inner `spawnSync` `timeout: 280_000` under outer 300_000) ✓;
  `ev40-live-gates:214-246` sigint arm ✓; `ev43-reachability:73-106` (double
  `runHarnessArm`) ✓; `.github/workflows/gates.yml` (18 lines,
  `fetch-depth: 0`, no timeout-minutes) ✓.
- Context7 `/oven-sh/bun`: "the default value is 5000 ms" + "terminates
  spawned child processes" — citation real.
- Scratch dirs under `/tmp` created and removed.

**Record corrections for the card**

- Owner round-3 C1′ "13 sites, Σ = 2 540 000 ms, verified against the tree"
  is wrong whole-tree: it omits `hub.test.ts` 15_000×3 (true default-suite
  sites). Correct default-suite census = 16 sites, 2 585 000 ms.
  Non-blocking (tripwire derives at run time).
- "The async pty arm binds at the outer test timer" should read: the pty arm
  first-to-fire is the inner `spawnSync` 280 s (`:348`); the sigint arms'
  first-to-fire is the harness inner deadline (120 s default); the outer test
  timers are test-level ceilings and backstops. No sizing impact.
- The 5 s-default tier has no *arm-bearing* members; the "n × 5 000 ms" term
  in any census is 0 unless non-spawning tests are deliberately included.
- `gates.yml` is 18 physical / 16 non-blank lines (not 15) — cosmetic.
- The wiki's 81-file envelope figure is consistent with the current tree (72
  + 9 fixture seeds). Not a defect.

**Verdict: no open objections.** Every factual claim with a runnable test is
settled; the only uncounted-seat items are the open-judgment disputes
catalogued as routed to `product-owner` (placement job- vs step-level, value
45/60 vs 15, and the single-vs-any-arm reading) — all the arithmetic those
decisions rest on (16-site/18-site census, 43.1/50.1 min serial sums, `:362`
inner 280 s vs outer 300 s, step-naming as an *unverified* working
assumption) has been tested and stands. The two corrections above are
record-only and do not block.
