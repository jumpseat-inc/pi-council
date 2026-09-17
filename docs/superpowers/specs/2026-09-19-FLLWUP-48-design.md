# FLLWUP-48 — Suite-cost budget for the live pty and -p falsifier arms

**Card:** `council/cards/FLLWUP-48.md` (EPIC-9, ninth and final card of the run).
**Status:** settled design — steps 1–6 of `/council` closed it; this file writes
it up, it does not derive it.
**Goal:** The default bun test suite's wall-clock budget is documented, and the
live pty and -p falsifier arms run within it or are gated behind an opt-in.

This spec is the owner's handoff. Everything below was settled by the
deliberation (steps 2–5, `owner` `job-26.1`/`job-26.3`, `principal`
`job-26.2`/`job-26.4`), the Skeptic's runs (`job-26.5`, O1–O13), the
consolidator's sort (`job-26.8`), the `product-owner` ruling at step 6
(`job-27`; raw text: `vault/raw/2026-09-19-po-fllwup48-test-suite-budget.md`),
and the run-wide Phase-1 rulings. **Nothing here is a facilitator choice, and
no design question below is open.**

## 0. What the design is, in one paragraph

**Document-only, ratified by ruling.** The measured default-suite wall clock
(95.83s on the step-4 verification worktree; nothing binds) discharges the
goal's "run within it" branch by fact, so the live pty/`-p` arms are **not**
gated. The delivery is: a measured, provenance-carrying budget statement in
three internal developer docs (`README.md` Development block, a new
`vault/wiki/test-suite-budget.md` linked from the wiki catalog, and a
non-decaying rewrite of the stale `AGENTS.md:17` command comment), plus three
bounded hygiene fixes that keep the budget's own verification command
trustworthy (bytecode exclusion in the shape-witness scan with a two-sided
temp-tree test; the retired-path-token comment at
`test/ev41-retry-e2e.test.ts:325`; the `AGENTS.md:17` decay fix). **No**
`gates.yml` `timeout-minutes` (ruled out), **no** new flag, **no**
`preflight.sh` string, **no** user-visible copy, **no** new live arm and no arm
moved (baseline `ev40-headless` 3 / `ev40-live-gates` 5 / `ev41-retry-e2e` 5 /
`ev43-reachability` 2 unchanged), **no** in-test elapsed assertion (rejected by
both seats), **no** extension of the shape witness's token regex.

## 1. What is settled (do not reopen)

- **Document-only, not gate (PO ruling 3, ratified).** The "run within it"
  branch is discharged by fact (95.83s measured, O1 `closed-green`). Gating
  stays available only as the branch that reopens **if the re-measured
  envelope is ever false** — protected by the re-measure rule and the 180s
  drift threshold (§2). The Skeptic's O6 (`closed-green`, demonstrated on real
  engine code) showed a default-skip gate would leave the suite green with the
  live mechanism broken, silently emptying deterministic-merge criterion 2.
- **The budget figure is descriptive, from the implementing pass (PO ruling
  1).** The figure written into `README.md`, `vault/wiki/test-suite-budget.md`,
  and `AGENTS.md` is **the measurement taken on this implementing pass** — a
  fresh head worktree, full `bun install`, recorded with machine + date + SHA +
  command. It is *not* a normative cross-machine ceiling. **180s is the drift
  threshold, not the budget**: the maintained invariant the suite is tested
  against over time. Any re-measurement above 180s reopens this card or opens
  a new one. (Step-4 reference measurement: 95.83s total, 894 tests / 78
  files, at `7da00e7` on the step-4 container.)
- **No `gates.yml` `timeout-minutes` (PO ruling 2).** Do **not** ship it on
  this card; CI-timeout policy is a separate question. Deciding fact (O7
  `closed-green`): the TUI arm's own enforced ceiling is `300_000`
  (`test/ev41-retry-e2e.test.ts:362`), which exceeds any ~180s suite budget, so
  a budget-keyed step timeout would pre-empt the arm's own timeout and mask
  attribution.
- **Arm-level enforcement already exists (O7 `closed-green`).** Eleven
  per-arm ceilings (bun third positional args + `runHarnessArm`/`spawnSync`
  `timeoutMs` at `test/faux-provider/harness.ts`), and the only elapsed
  assertion in the suite (`test/hub.test.ts:517`) is a lower bound. The docs
  state the ceiling-vs-budget distinction explicitly so the two numbers are
  not read as one.
- **Suite cost is serial/additive (O3 `closed-green`).** `bun test` without
  `--parallel` is serial across files (`package.json` `test` script is bare
  `bun test`); per-file times sum to the suite total.
- **Arms are offline by construction (O4 `closed-green`).** The live arms
  spawn `--offline --provider ev40` against the faux provider; zero
  network/credential reads in the arm path. Only `test/integration.test.ts`
  (and the context7 MCP probe) are gated, behind `COUNCIL_INTEGRATION=1` /
  `COUNCIL_MCP_INTEGRATION=1`.
- **Three hygiene fixes ride this card as one delivery (PO scope
  confirmation).** Zero new live arms, baseline 3/5/5/2 unchanged, inside the
  Phase-1 carve-out (no new flag, no `preflight.sh` string, no user-visible
  copy).
- **The `.pyc` residue is environmental; no commit touches it (principal,
  O8/O9).** `test/__pycache__/ev41-tui.cpython-312.pyc` is gitignored,
  regenerable, absent from CI and fresh worktrees. The fix is in committed
  code: the scan domain. Acceptance criterion: **test 6 of the shape witness
  passes with the orphan `.pyc` still on disk.**

## 2. Deliverable 1 — the budget documents

All strings are internal developer documentation (inside the Phase-1
carve-out; no copy escalation). Take **every figure from this implementing
pass's own measurement**, with provenance (machine, date, SHA, command). The
step-4 numbers below are the reference shape, not the numbers to copy.

### 2a. `README.md` — Development block (the existing fenced `bash` block)

Add one command comment and one prose line:

- In the fenced block, `bun test` line gains the envelope, e.g.
  `bun test              # full suite (≈<N>s here; see vault/wiki/test-suite-budget.md)`.
- One prose line beneath the block stating: the measured default-suite wall
  clock on this machine, the measuring command (`bun install` then
  `time bun test`), the date and SHA, that the live pty/CLI arms inside it are
  offline faux-provider runs needing no network or credentials, and that only
  the integration/context7 probes are opt-in-gated.

### 2b. `vault/wiki/test-suite-budget.md` — new page, added to the catalog

Linked from `vault/wiki/index.md` (catalog entry required, not just the file).
Contents:

1. **Measured envelope**: total wall clock, tests × files, provenance block
   (machine, date, SHA, exact command — `bun install` **first**, then
   `time bun test`).
2. **Per-file table**: measured wall clock per live-arm file and arm counts —
   `test/ev41-retry-e2e.test.ts`, `test/ev40-live-gates.test.ts`,
   `test/ev40-headless.test.ts`, `test/ev43-reachability.test.ts` — plus the
   share of the suite the live arms carry (step-4 reference: ~76%).
3. **Ceiling-vs-budget distinction**: per-arm enforced ceilings (the eleven
   sites, including `ev41-retry-e2e.test.ts:362` `300_000`) are emergency
   bounds, not budgets; there is no suite-level ceiling and none is added.
4. **Drift threshold**: 180s is not the budget; it is the maintained
   invariant. Any re-measurement above 180s reopens this card or opens a new
   one.
5. **Re-measure command** (provenance-complete):
   ```bash
   bun install
   time bun test
   ```
   and the per-arm loop:
   ```bash
   for f in ev41-retry-e2e ev40-live-gates ev40-headless ev43-reachability; do
     time bun test test/$f.test.ts
   done
   ```
6. **Standing maintenance rules**: any new live arm must state its expected
   wall clock and its ceiling in its test header; the README/wiki figures are
   re-measured when an arm changes or when the drift threshold trips; a
   re-measure on a tree whose `node_modules` predates
   `@modelcontextprotocol/sdk` must run `bun install` first (Skeptic O12
   record correction).

### 2c. `AGENTS.md:17` — decay fix, non-decaying wording

Replace the stale brittle count (`34 tests, 1 skipped`) with durable wording
carrying the envelope and the **full flag inventory** — both opt-in flags,
since there are two `test.skipIf` sites and two flags (O10 `closed-green`):

```bash
bun test             # full suite (≈<N>s); integration/context7 probes opt-in via COUNCIL_INTEGRATION=1 and COUNCIL_MCP_INTEGRATION=1
```

`<N>` from this implementing pass. Do **not** refresh a test count — that
guarantees the next staleness; the wording must not carry a number only a run
can verify except the wall-clock envelope, which the wiki page owns the
re-measure rule for.

## 3. Deliverable 2 — the three hygiene fixes

### 3a. Bytecode exclusion in the shape-witness scan (with two-sided test)

`test/faux-provider-shape.test.ts`: `filesUnder` walks everything and
`countMatches` reads every file as utf-8 with no binary exclusion, so
gitignored Python bytecode (written **by the suite itself** — test 8's
`py_compile`, and the TUI arm's `pty_kit` import) self-arms the witness: an
orphan `.pyc` compiled from pre-FLLWUP-49 source deterministically turns test
6 red on any dev tree holding stale bytecode. A witness that polices *source*
must not read *bytecode*.

- **Change:** in `filesUnder` (and `countMatches` if needed), skip any path
  segment named `__pycache__` and extensions `.pyc`/`.pyo`/`.pyd`, with a
  comment stating the rule (witness reads source; bytecode is derived,
  regenerable, gitignored, and re-compiled in-run by test 8 — scanning it adds
  zero information).
- **Two-sided temp-tree test, in the same file:** a `describe`/`test` block
  that `mkdtempSync`s a scratch tree containing
  `__pycache__/x.pyc` + `x.ts` carrying the **same** retired token, and
  asserts the scan drops the bytecode and still hits the source. (Two-sided:
  the `.ts` case guards against an over-broad exclusion that would weaken the
  witness.)
- **Acceptance:** test 6 passes with
  `test/__pycache__/ev41-tui.cpython-312.pyc` still on disk; a retired token
  injected into a *source* file under `test/` still fails test 6.
- **Do not** extend the witness's token regex on this branch (that amends
  FLLWUP-49's committed witness). The allowlist-decay miss
  (`test/ev41-retry-e2e.test.ts:325`'s retired token in a source comment) is
  handled by 3b and recorded as a finding at step 13, not by widening the
  regex.
- Do not commit, delete, or regenerate the orphan `.pyc` itself.

### 3b. `test/ev41-retry-e2e.test.ts:325` stale comment

The `(c)` section header comment still says "via `test/ev41-tui.py`" — a
retired path token (the pre-FLLWUP-49 location; the runner now lives at
`test/faux-provider/ev41-tui.py`). One-line comment fix; no test-name or
behavior change; zero arms touched.

### 3c. `AGENTS.md:17` decay fix

Covered in §2c.

## 4. Explicitly out of scope (rulings and settled design)

- `gates.yml` `timeout-minutes` (PO ruling 2) — do not ship, even loose.
- Any new opt-in flag; any string in `council/preflight.sh`; any user-visible
  copy beyond internal developer docs (Phase-1 carve-out; escalation would be
  required, none is anticipated).
- Gating the live arms behind an opt-in (PO ruling 3 — document-only; the
  gating branch reopens only if a re-measurement exceeds the 180s drift
  threshold).
- An in-test elapsed assertion (rejected: redundant against existing
  `spawnSync` ceilings, fresh timing-flake class on CI runners, and a suite
  total is not observable from inside `bun test`).
- A sibling test re-running an arm as a "budget check" (would add 1–5 live
  arms and double cost — violates the zero-new-live-arms constraint).
- Widening the shape witness's token regex (amends FLLWUP-49's committed
  witness).
- Touching the gitignored `.pyc` residue, `bunfig.toml`, `package.json`
  scripts, `gates.yml`, or any arm's timeout ceiling.

## 5. Gates (owner clears all, in full — one-line changes do not lower the bar)

Authoritative set for this repo: `bunx tsc --noEmit` (strict, clean); full
`bun test` (green on the fresh worktree); `python3 council/validate.py` (clean
— council artifacts); `bash council/preflight.sh FLLWUP-48` (the FLLWUP-27
branch-freshness line is stale-by-construction mid-run and never weakens a
gate). Work in a fresh `git worktree` created from current `origin/main`;
**never** checkout/switch/reset the main repository path. Push the branch and
open the PR before ending the turn.

## 6. Testable claims for the Skeptic

1. **Budget holds:** `bun install && time bun test` on the head worktree →
   exit 0, total < 180s, figure + provenance recorded into the three docs and
   matching the run.
2. **Per-arm table is honest:** the per-file loop's figures sum, within
   serial-additive tolerance, to something ≲ the total (O3 additivity).
3. **Zero-new-live-arms:** `grep -c "test("` over the four arm files → 3 / 5 /
   5 / 2, before and after.
4. **Exclusion is real and two-sided:** shape witness test 6 passes with the
   orphan `.pyc` on disk; the temp-tree test asserts bytecode-dropped /
   source-hit; a retired token in a `test/` source file still trips the
   witness.
5. **Docs are non-decaying and provenance-complete:** `AGENTS.md` carries no
   test count; all three docs state the same envelope figure; the wiki page
   carries machine/date/SHA/command and the 180s drift threshold; the wiki
   catalog links the page.
6. **Nothing gated, nothing timed:** `gates.yml` unchanged (no
   `timeout-minutes`); no new env flag greppable; no `preflight.sh` change.
7. **Stale comment fixed:** `test/ev41-retry-e2e.test.ts` no longer contains
   the retired token `test/ev41-tui.py` in the `(c)` header comment (the
   witness regex still does not cover it — that is expected; the finding is
   recorded, not regexed away).

## 7. Zero-new-live-arms attestation (FLLWUP-49 O10)

This delivery adds zero live arms and moves none. The measured arm set is
exactly the carried baseline. The added temp-tree assertions spawn nothing.
The `python3 -m py_compile` spawn in shape test 8 is a benign compile, not a
live pi/pty arm.
