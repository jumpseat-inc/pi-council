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
