# PO ruling — FLLWUP-58 gates CI runaway backstop (OJ-1/OJ-2/OJ-3)

Escalation from `council-runner` at FLLWUP-58 step 6 (`council/cards/FLLWUP-58.md`,
steps 2–5 complete, Skeptic `job-28.7` verdict "no open objections",
consolidator `job-28.8`). Three open-judgment items were routed: placement
(job vs step), the reading of "never pre-empts an arm's own ceiling"
(strict/any-arm vs single-arm), and the resulting value. **No ruling on record
answers any of the three** — PO FLLWUP-48 ruling 2 deferred this subject
("CI-timeout policy is a separate question … separate card, separate rationale,
separate decision"), and this card is that separate card, approved at job-29
from FLLWUP-48 step-13 draft 1. This ruling exercises the deferral; it does not
overturn it.

Ruling in the order that makes the dependencies explicit: **reading → placement
→ value.**

## 1. OJ-2 — the reading is strict/any-arm. No goal-text narrowing.

**"Never pre-empts an arm's own ceiling" means: every arm-bearing test in the
run gets to trip its own ceiling, including when several of them trip
serially in the same run.** The floor is therefore the default-suite serial
census sum — 16 sites, Σ = 2 585 s ≈ **43.1 min** (Skeptic O1/O9,
closed-green) — not `max_ceiling + envelope` ≈ 6.7 min.

Why the strict reading wins on the merits, not just on the letter:

- **The suite is serial** (Skeptic O3: 2 × 2 s files → 4.08 s under bare
  `bun test`). Hangs accumulate; they never overlap. So a runner-level wedge
  (network-stack, disk, OOM-thrash, wedged event loop — the class the in-process
  JS timers structurally cannot catch, per the principal's step-2 reading) is
  *realistically* a cumulative-trip schedule, not an impossible one. A reading
  that prices the backstop against one trip only is pricing against a scenario
  the repository's own recorded facts say is the mild case.
- **The value at stake is attribution completeness, and attribution is the
  product.** The whole reason per-arm ceilings exist is that a tripped ceiling
  *names the test* — `gates` green (and red) is this repo's only automated
  witness that the EV-40/41/43 mechanism actually spawned a real pi CLI
  (`vault/wiki/test-suite-budget.md`, `vault/wiki/smoke-test.md`, and
  FLLWUP-48's ruling 3 on what a default-skip gate would do to criterion-2
  evidence). A backstop set inside the cumulative schedule truncates the suite
  mid-run: the tests after the cut never execute, so the run witnesses nothing
  about them, and the developer's symptom changes from "arm X failed at its
  ceiling" to "the step was killed at N minutes." That is exactly the
  budget-keyed mask that PO FLLWUP-48 ruling 2 identified as the defect.
- **What the single-arm reading would save is runner-minutes on a run that
  fires ~never**, and would cost the one property the card exists to guarantee.
  Cheap to state, cheap to reverse, not worth it.

**The single-arm narrowing is declined.** The principal was right that
narrowing a PO-facing phrase in the goal is not a change either generator may
make unilaterally — and it is not a change I will make either, because the
literal reading is available, internally consistent, and the value-bearing one.
**The card's `goal` text stands as written; nothing here amends what the card
is for, so this item does not reach `steward`.**

The wiki must nonetheless **state which reading it adopts, in the goal's own
words**, and record that the single-arm reading was considered and rejected with
its reason (attribution completeness over runner-minute savings). Leaving the
reading implicit re-creates the 6× spread from one sentence that produced this
escalation.

Two pinned consequences of the strict reading:

- **The operative floor is the default-suite census.** The two gated sites
  (`integration.test.ts:60` = `6 * 60_000`, `mcp/integration-context7.test.ts:24`
  = `60_000`) are `test.skipIf` behind `COUNCIL_INTEGRATION` /
  `COUNCIL_MCP_INTEGRATION`, and `gates.yml` sets neither — they cannot
  contribute to the CI floor. They are recorded **separately** in the wiki
  (tree-wide Σ ≈ 50.1 min), together with the rule: **if a gated site ever
  enters the default CI run, the floor re-derives.**
- **Not summed:** the harness-internal `?? 120_000` / `280_000` `spawnSync`
  bounds (`harness.ts:302`, `:361`, `ev41-retry-e2e.test.ts:348`). Those are
  inner first-to-fire bounds *under* an outer test ceiling, not additional
  test-level ceilings (Skeptic O6 precision correction). The 5 s Bun default
  tier is vacuous for arm-bearing tests (Skeptic O5) and is not a census term.

## 2. OJ-1 — placement: `timeout-minutes` on the **`bun test` step**, not on the job.

Three grounds, in ascending order of weight:

1. **The goal already names the object.** "The gates workflow fails bounded on a
   runaway **test step**" — and *fails*, not *cancels*. Step-level kills the
   process and produces a failed step; job-level cancels the job. The literal
   text points at the step.
2. **Placement-independent attribution is what we actually rely on** — the log
   tail (last file block; the arm's own ceiling line present vs absent, per the
   agreed tripped-failure discriminator). The step-naming annotation is
   job-scoped and historically unstable (community #40582) and stays recorded as
   an unverified working assumption either way. So the owner's
   "attribution survives at job level" and the principal's "step-level names the
   step" are both secondary. What is *not* secondary is ground 3.
3. **Decisive — a job-level number's meaning drifts silently, and the
   tripwire cannot see it.** A job budget is `census floor + preamble`, and the
   preamble is `actions/checkout` with `fetch-depth: 0` plus `setup-bun`,
   `bun install`, `bunx tsc`. The full-history fetch is pinned verbatim by the
   FLLWUP-59 step-13 ruling R2 (`vault/raw/2026-09-19-po-fllwup59-step13-ruling.md`;
   mechanism rationale at `vault/wiki/retired-path-tokens.md` — *"without it
   every CI run loud-fails"*), and repository history is monotonically
   increasing: the preamble only ever gets longer, and it is the one duration in
   this design with no derived check under it (the tripwire can read the test
   tree; it cannot read the future size of `git log`). A tripwire asserting
   `job_value ≥ derived_sum + margin` would therefore certify a floor that the
   *test step* no longer actually receives — a green check on top of a
   hand-maintained invariant, which is precisely the decay class FLLWUP-59 was
   built to kill, and the owner's own round-1 objection ("the single number
   serves two purposes") accepted as a cost. At step level the shipped number
   means exactly and permanently what it says.

**The `install`/`tsc` wedge gap is accepted as a temporary, recorded residual.**
The owner is correct that job-level is the only single line bounding a wedged
`bun install` / `tsc`, and correct that it is out of this card's scope. It is
recorded in the CI-backstop section as **accepted-and-known**, with the cheaper
eventual fix named (tight per-step `timeout-minutes` on the two deterministic
steps — install ~30–60 s, tsc ~10–20 s measured locally) and brought back as a
step-13 follow-up draft for confirmation. It is **not** folded into this card:
per-step bounds on non-test steps are not needed to honestly meet this goal as
written (which names the runaway *test step*), and PO FLLWUP-48 ruling 2's
recorded logic — distinct CI-timeout rationales, distinct decisions — points the
same way. If the runner concludes that folding it in is required, that is a
goal-scope question and comes back as an escalation, not a silent widening.

## 3. OJ-3 — the number: `timeout-minutes: 60` on the `bun test` step.

| Floor | Σ | × at 45 | × at 60 |
|---|---|---|---|
| Default-suite census (operative floor) | 43.1 min | **1.04×** | **1.42×** |
| Tree-wide census incl. 2 gated sites | 50.1 min | 0.90× ✗ | 1.20× |
| Measured green envelope | 101.2 s | 26.7× | 35.6× |

**45 is rejected.** It clears the operative floor by 115 s — less than the
fast-file time (~23 s local, plausibly 2× on hosted runners) plus any hosted
variance — and it sits *below* the tree-wide sum, so the day a gated arm joins
the default CI run the line pre-empts a legitimate full-wedge schedule. A value
that thin above its own floor also makes the tripwire red-prone: a red with a
confusing symptom on a card whose rule is "this should never fire" is the
mechanism's shortest path to being loosened by hand or deleted, and a deleted
tripwire is the FLLWUP-48 lesson re-learned. `retired-path-tokens`' "a
permanently red gate is not shippable" is the same principle one notch over.

**60 is chosen**: 1.42× the operative floor, ~1 015 s of margin for fast-file
variance plus future ceiling sites, clears the gated-inclusive floor too, and is
still 6× tighter than today's effective bound (the platform 360-min job default)
and 35× looser than the drift threshold, so it is unreachable on any
correctly-behaving run. Both seats held a value in this neighborhood (owner 60;
principal 45 with "60 equally acceptable"), so this is a choice of the number,
not of a side.

**Costs accepted:** a genuinely wedged run bills up to 60 hosted runner-minutes
and its author waits up to an hour for the red — versus 45 under the rejected
value — which is the price of a backstop that provably never pre-empts a
correct run and survives a gated site joining CI. `180 s` remains the *only*
drift alarm; the wiki must say so explicitly so nobody later "tightens" 60 into
a budget enforcement, which is the FLLWUP-48 mistake re-made (both seats asked
for this line; it is mandatory under this ruling).

## 4. What the ruling leaves to the owner (the how, not the what)

Settled design (already agreed by both seats; not reopened here): the deliverable
is `(reading, census, number)`.

- **One** `timeout-minutes: 60`, on the `bun test` step; no job-level line;
  no other step gets one on this card.
- **Tree-derived tripwire, derive-never-restate** (precedent:
  `vault/wiki/retired-path-tokens.md`): recursive `test/**/*.test.ts`
  (the top-level glob misses all 8 `test/mcp/*.test.ts` — Skeptic O4),
  expression-aware (a literal `_000` regex misses `6 * 60_000`), gated
  (`test.skipIf`) sites reported separately from the default-suite floor,
  asserting `60 ≥ ceil((derived_sum + fast-file margin) / 60000)`, asserting
  placement (exactly one `timeout-minutes`, on the `bun test` step, none at job
  level — this clause mechanically encodes PO FLLWUP-48 ruling 2's boundary),
  and asserting line↔doc parity. Pure offline file reads; zero new live arms
  (FLLWUP-49 O10); no hardcoded `300_000`, `43` or `60` in the derivation.
  It is the first gate that reads `gates.yml` (Skeptic O7: `grep -rn
  'gates.yml' test/` is empty today) and this is the net that ends the
  doc↔line pair's un-netted status.
- **Wiki (`vault/wiki/test-suite-budget.md`)**, all in the same edit: correct
  the "thirteen sites" census sentence (wrong today: 16 default-suite sites,
  18 tree-wide, and it lumps two mechanisms — Skeptic O8); amend the "no
  suite-level ceiling — and none is added" bullet to state the backstop,
  **quote PO FLLWUP-48 ruling 2 and say what changed** (the ruling condemns a
  *budget-keyed* ~2–3 min timeout; a ceiling-scale 60-min backstop ≥ the serial
  census sum does not pre-empt a single trip, and the ruling's own deferral is
  what this card discharges — this narrows nothing, it applies the reserved
  "separate card" path); new CI-backstop section carrying the adopted reading,
  both census floors and ratios, the four-tier ladder (envelope → 180 s drift
  threshold → per-arm ceilings → backstop), the tripped-failure discriminator,
  the re-derivation maintenance rule in both directions, the
  accepted-and-known `install`/`tsc` gap with its named eventual fix, and the
  step-naming statement marked as the working assumption it is.
- **README / AGENTS.md**: a `## Commands` pointer line only — no new Hard
  convention (the `test/fllwup25-agents-page.test.ts` parity coupling is real;
  `vault/wiki/…sources/2026-08-23-agents.md`).
- **`fetch-depth: 0` verbatim** (FLLWUP-59 R2), and **live annotation capture
  (C8) is not adopted** — it exists to verify job-cancel step-naming, which
  step-level placement makes moot; spending a throwaway CI artifact to check
  nothing the ruling depends on is not worth a new artifact.
- Follow-ups this ruling asks the runner to **draft** (not write) at step 13:
  per-step timeouts on the deterministic `install`/`tsc` steps.

## 5. Reversibility

- Value and placement: one line in `.github/workflows/gates.yml`; the tripwire
  re-derives the floor from the tree, so a future change is a line edit plus a
  wiki paragraph. Cheap.
- The reading: the expensive-to-reverse part, because it is the *reason* for the
  number. Reversing it means editing the CI-backstop section's reading clause
  and lowering the value, and the tripwire's floor assertion is the thing that
  would then have to be re-derived. Still a one-PR change.
- The `install`/`tsc` residual: temporary by construction — a separate card
  adds two step-level numbers; nothing about this ruling forecloses it.

## Grounding

- `vault/wiki/test-suite-budget.md` — envelope, ceiling-vs-budget distinction,
  the 180 s drift threshold, the "no suite-level ceiling" bullet and the
  "thirteen sites" census sentence this card corrects.
- `vault/wiki/retired-path-tokens.md` — the derive-never-restate precedent, the
  `fetch-depth: 0` CI-substrate coupling, and "a permanently red gate is not
  shippable."
- `vault/wiki/smoke-test.md`, `vault/wiki/index.md` — what CI green witnesses;
  the catalog.
- `council/cards/FLLWUP-48.md` step 6 + `vault/raw/2026-09-19-po-fllwup48-test-suite-budget.md`
  — ruling 1 (180 s = drift threshold, descriptive envelope), ruling 2 (the
  deferral this card discharges; budget-keyed step timeouts mask attribution),
  ruling 3 (document-only; a default-skip gate empties criterion-2 evidence).
- `council/cards/FLLWUP-58.md` steps 2–5 (positions, Skeptic O1–O10,
  consolidator) — the tested census, serial accumulation, parser holes,
  inner-vs-outer binding order, and the empty `grep -rn 'gates.yml' test/`.
- `council/cards/FLLWUP-59.md` + `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md`
  — R2 (`fetch-depth: 0` stays) and the run-2 precedent that the first gate
  reading a file is how a hand-maintained invariant dies.
- `.github/workflows/gates.yml` (18 lines, no `timeout-minutes`), `AGENTS.md`
  conventions 6/12/13 (non-clobbering scaffold, ephemeral `runs/`, preflight
  trust).
