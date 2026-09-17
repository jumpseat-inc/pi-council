---
id: FLLWUP-49
title: Promote the offline faux-provider harness into a shared smoke helper
state: Deliberating
owner: null
epic: EPIC-9
goal: The offline faux-provider harness is a shared test helper that both the parent-turn and seat-dispatch provider-error tests import, with no duplicated harness copy.
---

## Intent

EV-40's `test/ev40-harness/` (headless plus pty, with fail-count, arm,
context-log, and SIGINT knobs) proved its leverage by producing closed-red
findings, but EV-41 and EV-42 currently carry duplicated harness copies. A
refactor with no in-flight consumer belongs in `Backlog`, per the steward
disposition.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **Card-specific:** none on the card face. The design (which harness lives
  where, its exported surface, and which consumers import it) is for the
  deliberation, steps 2–6; this container decides nothing behind it.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **eighth** card of the run.
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

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card's `goal` fixes the outcome (one offline
  faux-provider harness, imported as a shared test helper by both the
  parent-turn and the seat-dispatch provider-error tests, with no duplicated
  harness copy) but leaves every design question that produces it open: which
  harness is the canonical one, where it lives, what its exported surface is,
  which consumers are re-pointed at it, and how much of the older copy is
  collapsed rather than deleted. That is `spec-ambiguous` per council.md
  step 1, which is sufficient for a full council on its own. It is **not**
  cross-seam in the repo-area sense (test-only plus an `ev43/` scratch tree;
  no engine module, no `.council.json` surface, no rendered council surface).
- **Surface-touching: no (recorded).** The deliverable is test/falsifier code
  and scratch extensions; it changes no person's visible surface, no
  user-visible copy, no empty state, no error state. No `designer` is seated.
  Recorded as a boundary call: if the deliberated design required
  **user-visible copy**, the orchestrator's Phase-1 card rulings make that copy
  open-judgment — this container would return `ESCALATION` with the drafted
  string rather than ship it unruled.
- **Premise to be tested in deliberation (not decided here).** The card's
  `Intent` states that "EV-41 and EV-42 currently carry duplicated harness
  copies." At the card-start tree (`main` == `origin/main` = `b95c71e`) that is
  **false as read**: EV-42's merged squash (`952d5c1`) added no harness or pty
  file, and `test/ev41-retry-e2e.test.ts` already imports
  `test/ev40-harness/harness-headless.ts`. The duplication that does exist at
  HEAD is (a) `ev43/` — a full predecessor harness
  (`ev43-falsifier-extension.ts`, `falsifier-headless.ts`, `falsifier-tui.py`)
  still imported by `test/ev43-reachability.test.ts`; (b) `test/ev41-tui.py`, a
  pty adaptation of `test/ev40-harness/tui-retry.py`; and (c) the three pty
  screen-model copies across `ev43/`, `test/ev40-harness/`, `test/ev41-tui.py`.
  Whether the goal's premise as written is a goal defect, a stale-Intent
  wording, or a mislabel is for the deliberation/Skeptic to resolve; the
  facilitator routes it, and does not decide it.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` and in the installed package clone
  (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`); no
  repo-local `.pi/agents/` override exists, so nothing shadows them. Ruling
  seats (`product-owner`, `steward`) are never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). Run for information only on
  the main checkout: **not run** by this container; `python3 council/validate.py`
  → `All council artifacts valid`; `main` clean and equal to `origin/main` at
  `b95c71e` (`FLLWUP-40` `8dbe038`, `FLLWUP-43` `e25b813`, `FLLWUP-42`
  `aff1101`, `FLLWUP-41` `9adca28`, `FLLWUP-44` `05ae348`, `FLLWUP-45`
  `2f79142`, `FLLWUP-47` `216ea34` all merged). No `Needs Human` state and no
  outstanding ruling on this card — deterministic merge check criterion 5
  holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here): `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`, plus `bash council/preflight.sh
  FLLWUP-49` (the FLLWUP-27 stale-by-construction line aside).
- **Evidence base read before this decision:** `council/procedures/council.md`
  and `features-deliver.md` in full; `test/ev40-harness/harness-headless.ts`,
  `test/ev40-harness/ev40-harness-extension.ts`, `test/ev41-retry-e2e.test.ts`,
  `test/ev41-tui.py`, `test/ev43-reachability.test.ts`, the `ev43/` tree,
  `test/stub-child.ts` consumers, `git show --stat 952d5c1` (EV-42) and
  `653ce01` (EV-41), `council/cards/EV-41.md`, `EV-42.md`, `EPIC-9.md`,
  `vault/raw/2026-09-16-epic9-run-ledger.md`, and `council/validate.py`.
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).

### Step 2 — independent first pass (round 1)

Two generators dispatched independently on the card alone (no `designer` —
not surface-touching). Jobs: `owner` `job-22.1` (6.5m, 16 turns),
`principal` `job-22.2` (6.5m, 33 turns), both settled `done`. Positions
appended verbatim.

#### Position — `owner` (job-22.1)

**Approach**

**1. The premise, read against the tree (fact, not judgment).** The card's
`Intent` sentence — "EV-41 and EV-42 currently carry duplicated harness
copies" — is **false as read at HEAD**:

- EV-42's merged squash `952d5c1` (`git show --stat`) touched
  `extensions/{hub,provider-cost,runs,usage-*}.ts`, the spec, and
  `test/provider-cost.test.ts` — **no harness or pty file**.
- `test/ev41-retry-e2e.test.ts:64` already imports
  `./ev40-harness/harness-headless.ts` — the EV-41 headless parent branch
  shares the EV-40 harness *today*.

The duplication that actually exists at HEAD is:
- **(a) `ev43/` — a full predecessor harness** (`ev43-falsifier-extension.ts`,
  `falsifier-headless.ts`, `falsifier-tui.py`), still imported by
  `test/ev43-reachability.test.ts:25`.
- **(b) `test/ev41-tui.py`** — a pty adaptation of
  `test/ev40-harness/tui-retry.py` (header says so; P6 machinery dropped).
- **(c) Three pty screen models**, and they have **already drifted**:
  `test/ev41-tui.py:114` handles CSI `D` (cursor-left-by-n) with the `G`
  clause's absolute-column semantics (`max(0, min(cols-1, n-1))`), while
  `tui-retry.py:108` and `falsifier-tui.py:111` have the correct
  relative-left form. A copy-drift bug is live on this tree.

Implication for the goal: the deliverable is a **dedup refactor** — collapse
`ev43/` and unify the pty family onto one kit — not the creation of harness
copies. The goal is satisfiable as written; its premise sentence is stale and
the spec should carry this finding so the Skeptic doesn't chase a phantom.

**2. Canonical harness: the EV-40 family, staying at `test/ev40-harness/`.**
`harness-headless.ts` + `ev40-harness-extension.ts` are already the
generalization (its own header, line 7: "Generalizes
ev43/falsifier-headless.ts"), with the superset of knobs (fail-count, arm,
partial, context/payload/settle logs, SIGINT). All four current import sites
(`test/ev40-headless.test.ts:35`, `test/ev40-live-gates.test.ts:39`,
`test/ev41-retry-e2e.test.ts:64-65`, plus the extension path constant)
already point there — canonicality is a fact, not a choice. I do **not**
rename the directory; the name is epic-flavored but a rename touches four
files for zero behavior and is out of the goal.

**3. Exported surface — unchanged, plus three surgical additions:**
- Re-pointed `test/ev43-reachability.test.ts` imports exactly what the other
  consumers import: `runHarnessArm`, `parseSessionEntries`,
  `sessionJsonlWellFormed`, `INJECTED_ERROR_MESSAGE`. No new top-level API.
- **`EV40_ERROR_MESSAGE` env knob** in `ev40-harness-extension.ts` (default =
  `INJECTED_ERROR_MESSAGE`, the with-colon literal): lets the reachability
  arms inject the original colon-less class, byte-preserving the EV-43
  falsifier identity.
- **Port the `ctx.hasUI` branch** (ev43 extension lines 72-91: TUI
  fire-and-forget send vs headless poll + guarded `waitForIdle`) into the
  shared extension's `inside` arm. Today the shared extension always
  sends-then-polls regardless of UI — the moved `falsifier-tui.py` scenario
  needs the proven TUI shape or its coverage silently changes.
- Reachability treatment/control map cleanly onto the existing surface:
  treatment = `runHarnessArm({fails: 1, arm: "inside", errorMessage:
  colon-less})` (the extension's own comment calls `inside` "the EV-43
  falsifier pattern"), control = `arm: "none"` + retry policy `enabled:
  false` via `EngineRepoOptions` — exactly the control shape
  `ev41-retry-e2e.test.ts:292` already uses.

**4. Pty family: one kit, three thin scenario runners.** New
`test/ev40-harness/pty-kit.py` (stdlib-only): `Screen`, `Session`,
`read_sequences` (returning the dict-entry form `ev41-tui.py` uses —
strictly richer than tui-retry's string form), `DA_REPLY`/`KITTY_REPLY`/`K_CR`.
The `D` clause adopts the correct relative-left semantics; `G` keeps
absolute-column. The runners keep their distinct scenarios — they assert
genuinely different things: `tui-retry.py` = harness timer arm + P6 widget
machinery (manual-only at HEAD), `ev41-tui.py` = engine parent-turn retry
(spawned by `ev41-retry-e2e.test.ts:338`, path updated to the new home),
`falsifier-tui.py` = hasUI in-handler reachability (manual-only). Moved
runners live in `test/ev40-harness/` so the whole harness family is one
directory; each becomes ~scenario-only code.

**5. Consumers — the full re-point list:**
| File | Action |
|---|---|
| `test/ev43-reachability.test.ts` | Unit attribution test unchanged (imports `pi-ai` directly, no harness); live arm re-pointed to `runHarnessArm`, treatment/control per §3; assertions keep the colon-less `stderr` / exit-1 expectations via the knob |
| `ev43/` (3 files) | **Deleted** — headless driver and extension subsumed; tui scenario moved & thinned |
| `test/ev41-tui.py` | Moved to `test/ev40-harness/ev41-tui.py`, thinned over `pty-kit.py`; one path update in `ev41-retry-e2e.test.ts:338` |
| `test/ev40-harness/tui-retry.py` | Stays, thinned over `pty-kit.py` |
| `test/ev40-headless.test.ts`, `test/ev40-live-gates.test.ts` | **Untouched** — already canonical imports |
| `test/ev41-retry-e2e.test.ts` | Only the runner path; imports unchanged |
| `test/stub-child.ts` + 5 consumers (`hub`, `job-retry`, `override`, `eval-runner`, `stub-child.test`) | **Untouched** — it is a different fixture family (a stub `pi --mode json` child for Hub dispatch), not a faux-provider harness copy. The seat-dispatch provider-error test (EV-41 (b)) stays on the stub substrate: forcing it through the CLI harness would test a different pipeline and lose the per-attempt manifest coverage. The goal's "both … import" is true at file granularity — the file carrying the seat-dispatch test imports the harness (`INJECTED_ERROR_MESSAGE`, equality-pinned to the engine constant in the preconditions test) — and that is the strongest truthful reading at HEAD. |

**Tradeoffs accepted**

- **`EV40_ERROR_MESSAGE` knob adds surface** used by exactly one test. Worth
  it: without it, the reachability test's injected class silently changes from
  the colon-less intake string to the with-colon literal, and the Skeptic's
  "no lost coverage" claim fails on falsifier identity.
- **Three pty runners, not one parametrized runner.** The scenarios assert
  different continuation shapes (timer-deferred, hasUI in-handler,
  engine-driven); collapsing them into one script would create a knob forest
  worse than the duplication. The kit is where dedup pays; the runners are
  60–100 lines each after thinning.
- **`tui-retry.py` and `falsifier-tui.py` stay manual** (not in `bun test`),
  same as HEAD. Wiring them into CI would add ~10 minutes of pty runtime per
  suite run — out of the goal's scope.
- **Directory not renamed.** Accepted cosmetic wart: `test/ev40-harness/` will
  hold a general-purpose harness with an epic's name.

**Testable claims**

1. **Premise (fact):** `git show --stat 952d5c1 | grep -Ei "harness|\.py" |
   wc -l` → `0`; `grep -n "ev40-harness/harness-headless"
   test/ev41-retry-e2e.test.ts` → hits at HEAD. The Intent sentence is stale.
2. **Drift is real (red today):** a python one-liner feeding `ESC[5D` after
   `ESC[10;20H` into `test/ev41-tui.py`'s `Screen` lands on column 4 (wrong);
   the same input into `tui-retry.py`'s `Screen` lands on column 15 (right).
   Settles that the copies diverged and the kit must pick one semantics.
3. **No duplicated copy remains (post-refactor):** `ls ev43/` → no such
   directory; `grep -rn "ev43/" test/*.ts extensions/` → no import hits;
   `grep -rln "^class Screen" test/ | wc -l` → `1` (`pty-kit.py` only).
4. **No lost coverage (post-refactor):** `bun test
   test/ev43-reachability.test.ts` green — treatment second message present,
   control absent with the colon-less literal on stderr and exit 1; `bun test
   test/ev41-retry-e2e.test.ts` green including the TUI branch through the
   moved runner.
5. **No behavior change:** `bunx tsc --noEmit` clean; `bun test` green;
   `python3 council/validate.py` → `All council artifacts valid`; `bash
   council/preflight.sh FLLWUP-49` passes with the known FLLWUP-27
   stale-by-construction line excepted per the card's binding note.
6. **Manual runners still settle green:** `python3
   test/ev40-harness/tui-retry.py <tmpdir>` and `python3
   test/ev40-harness/falsifier-tui.py <tmpdir>` each exit 0.

The gate set for the owner, per the card's own record and
`.github/workflows/gates.yml`: `bunx tsc --noEmit` → `bun test` → `python3
council/validate.py` → `bash council/preflight.sh FLLWUP-49`, in order, all
four regardless of diff size.

#### Position — `principal` (job-22.2)

## Cross-seam reading — what the contract actually is at HEAD

**The faux-provider harness is a three-part contract, and only one part is
shared.**

| part | canonical today | copies alive today |
|---|---|---|
| scripted faux provider (extension) | `test/ev40-harness/ev40-harness-extension.ts` | `ev43/ev43-falsifier-extension.ts:1-56` |
| headless arm runner (TS) | `test/ev40-harness/harness-headless.ts` | `ev43/falsifier-headless.ts:1-140` |
| pty substrate + runner (py) | `test/ev40-harness/tui-retry.py` | `test/ev41-tui.py`, `ev43/falsifier-tui.py`, (`smoke/search-smoke/driver.py`) |

Consumers, verified by grep:

- `test/ev40-headless.test.ts:35-37` and `test/ev40-live-gates.test.ts:39-40`
  import the EV-40 harness — already single-sourced.
- `test/ev41-retry-e2e.test.ts:55-65` **already imports**
  `./ev40-harness/harness-headless.ts` and
  `./ev40-harness/ev40-harness-extension.ts`. Only its pty arm is a copy:
  `test/ev41-tui.py` (spawned at `:338`, verdict strings asserted at
  `:355-357`).
- `test/ev43-reachability.test.ts:25` imports `../ev43/falsifier-headless.ts`
  — the one live headless copy.
- `test/ev40-parent-retry.test.ts` and `test/ev40-wiring.test.ts` import no
  harness (fakes + `extensions/parent-retry.ts`).
- The seat-dispatch falsifier (`test/ev41-retry-e2e.test.ts:120-262`) imports
  **no** harness: it uses `test/stub-child.ts` (`:67`), already shared by 5
  test files (`hub.test.ts:9`, `job-retry.test.ts:189`,
  `eval-runner.test.ts:121`, `stub-child.test.ts:11`,
  `ev41-retry-e2e.test.ts:67`).

The seam that makes the goal's premise fail is the **parent/seat boundary**:
the faux provider is registered by an extension loaded with `-e`, selected by
`--offline --provider`, while a real seat child is spawned by the engine as
`command: "pi"` with `buildChildArgv` = `["--mode","json","-p","-a","--session-dir",…,"--model",seat.model,…]`
(`extensions/hub-tools.ts:248-249`, `extensions/seats.ts:600-621`) — no `-e`,
no `--provider`. Wiring the faux provider into the seat path is an **engine**
change, not a test-helper change, and it would change what the seat falsifier
proves. So the seat-dispatch half cannot "import the faux-provider harness"
without the card becoming a different card.

**Premise vs tree, as fact.** `council/cards/FLLWUP-49.md:12` claims "EV-41
and EV-42 currently carry duplicated harness copies." At HEAD: **EV-42 carries
none** — its tests are `usage-store.test.ts` (5 `EV-42` tests),
`usage-block.test.ts`, `runs.test.ts`, `provider-cost.test.ts`, `hub.test.ts`,
`job-retry.test.ts`, none importing the harness or any pty runner (the Intake
record at `FLLWUP-49.md:68-80` already found this; I confirm it
independently). **EV-41's headless half is already shared**; only its pty half
is a copy. The real duplication is `ev43/` (a complete predecessor harness
still imported) plus the pty screen-model defined four times. Implication for
the goal: its *named consumers are wrong* and its seat-dispatch clause is
unsatisfiable **without an engine change**, but the outcome it names — one
harness, no duplicated copy — is real, reachable, and larger than the card
says. This is a goal-text defect (premise), not a design ambiguity, and the
spec must record the correction rather than quietly deliver something else.

## Recommended design

**Canonical home: `test/faux-provider/`** (a `git mv` of
`test/ev40-harness/`), three files:

- `harness.ts` ← `harness-headless.ts`. Its exported surface stays
  symbol-for-symbol (`HARNESS_EXTENSION:17`, `COUNCIL_EXTENSION:18`,
  `CLI_PATH:26`, `resolveNode:31`, `ArmResult:41`, `ArmOptions:58`,
  `parseSessionEntries:82`, `findSessionJsonl:108`, `EngineRepoOptions:153`,
  `prepareHarnessArm:171`, `runHarnessArm:248`, `SigintOptions:277`,
  `SigintArmResult:290`, `sessionJsonlWellFormed:362`,
  `secondMessagePresent:377`, `hasUserMessage:381`, `failedAssistantCount:385`,
  `countUsageRecords:390`, `parseContextLog:398`), **plus re-exports** of
  `INJECTED_ERROR_MESSAGE`, `PARTIAL_MARKER`, `CONTINUATION_MARKER` and a new
  `CONTINUATION_PROMPT` from the extension module, so every TS consumer has
  **one** import path and no consumer asserts a harness-internal literal.
- `extension.ts` ← `ev40-harness-extension.ts`. It is already a superset of
  the EV-43 extension (`EV40_ARM: inside|timer|none` covers `EV43_HANDLER=1|0`;
  `EV40_FAILS` covers the fail-once script).
- `pty.py` ← `tui-retry.py`, generalized into **substrate + profile table**:
  substrate = `Screen`, `Session`, `respond_queries`, `wait_stable`,
  `read_sequences`, `sweep_stub_pids`; profiles = `retry-arms` (EV-41's
  treatment/control, spawned by the test) and `widgets` (EV-40's P6
  countdown+active-jobs+tree-at-24-rows, manual). Invocation: `python3
  test/faux-provider/pty.py <profile> <outdir>` with the existing
  `NODE_BIN/CLI_PATH/EXT_PATH/COUNCIL_EXT` env.

**Consumer re-points and the fate of every copy:**

| copy | fate |
|---|---|
| `test/ev40-harness/harness-headless.ts` | → `faux-provider/harness.ts` (canonical) |
| `test/ev40-harness/ev40-harness-extension.ts` | → `faux-provider/extension.ts` (canonical) |
| `test/ev40-harness/tui-retry.py` | → `faux-provider/pty.py` (`widgets` profile) |
| `test/ev41-tui.py` | **deleted**; becomes `pty.py retry-arms`; `ev41-retry-e2e.test.ts:338` re-points; asserted lines `:355-357` byte-identical |
| `ev43/falsifier-headless.ts` | **deleted**; `ev43-reachability.test.ts` re-points (treatment `{fails:1,arm:"inside"}`, control `{fails:1,arm:"none"}`, no council extension — preserving the pi-runtime reachability claim) |
| `ev43/ev43-falsifier-extension.ts` | **deleted** |
| `ev43/falsifier-tui.py` | **deleted**; its TUI rendering claim is already pinned by the `retry-arms` profile (EV-41), so no new profile is built; the frame-delta dump is a retired manual capability, recorded in the spec |
| `smoke/search-smoke/driver.py` | **unchanged** — outside the universe (no faux provider), and `smoke/search-smoke/README.md` explicitly declares "the screen model … authored in the driver"; name it as the one pinned residual + follow-up |
| `test/stub-child.ts` | **unchanged** — the seat fixture, a different family |

Recommended split into two commits so the Skeptic can settle "no behavior
change" on the pure move (commit 1) before the naming churn (commit 2):
commit 1 = move + dedup + re-points + the shape test, `EV40_*` env names
untouched; commit 2 = `EV40_*` → `HARNESS_*`, provider id `ev40` → `harness`,
and the comment sweep (`extensions/parent-retry.ts:4` cites
`test/ev40-harness/ev40-harness-extension.ts`; `test/ev40-live-gates.test.ts:147`
cites `--provider ev40`).

**Tradeoffs I accept:** (a) `pty.py` becomes a 2-profile runner — accepted
over three near-identical files, and both profiles have documented consumers;
(b) the smoke gate keeps its own `Screen` — accepted, because sharing would
create a `smoke/ → test/` import inside the release gate that is supposed to
be independent of the suite, and would amend a ruled manual; (c) the EV-43
test's injected class moves colon-less → with-colon
(`ev43-reachability.test.ts:73`) — accepted as a declared, strengthening
change (both classes are non-pi-retryable; EV-41 pins the with-colon one at
`:158-165`); (d) I do **not** replace the independent literal
`INJECTED_ERROR_MESSAGE` with an import of `PROVIDER_FINISH_REASON_ERROR` —
the byte-equality assertions (`ev40-headless.test.ts:47-51`,
`ev41-retry-e2e.test.ts:82-88`) are meaningful only while the two literals are
authored independently.

## Blind spots

- **Owner's blind spot (inside the refactor):** the `ev43/` tree is not merely
  a copy — `test/ev43-reachability.test.ts:1-20` is a *characterization of
  pi's runtime* ("headless -p — treatment PRESENT, control ABSENT"), and
  re-pointing it swaps the extension and the forcing literal while the
  *recorded* observation was produced by the old ones (`council/cards/EV-43.md:143-153`).
  From inside an import-rewrite this is invisible; the design must state that
  the observation is preserved even though the literal moves. The same vantage
  cannot see `extensions/parent-retry.ts:4`, an engine file citing a test path.
- **The card/Intent vantage's blind spot:** the tree. It cannot see that EV-42
  carries no copy at all, nor that the seat half is structurally unreachable
  for a faux provider (`hub-tools.ts:248`, `seats.ts:613`).
- **The smoke vantage's blind spot:** that its own `driver.py` is the fourth
  screen model; from inside `smoke/`, `test/faux-provider/` looks like a
  layering inversion to import from, so the boundary must be *stated* rather
  than assumed.
- **The Skeptic's blind spot (which this design must close):** the goal's "no
  duplicated harness copy" has **no falsifier today** — the suite is green
  with all four copies present. A Skeptic that only runs `bun test` returns a
  vacuous green. Hence the shape test below is not optional decoration; it is
  the goal's only operationalization.
- **My own blind spot, stated:** I cannot run anything (no shell in this pass)
  and I did not read the EV-41/EV-42/EV-43 card bodies end to end — the EV-42
  finding rests on grepping its test surface, which is checkable but not
  exhaustive.

## Reframe

The card is framed as *spec-ambiguous design work*. It is not, quite: the
design is nearly forced by the tree (one runner, one extension, one substrate,
re-point four TS tests, retire `ev43/`). What the deliberation actually has to
produce is **(1) a premise correction**, **(2) a stated universe and identity
criterion** — otherwise the goal is unfalsifiable and any green is vacuous —
and **(3) a falsifier for the goal itself**. The natural failure mode is
spending the rounds on directory names while the EV-43 literal swap, the
FLLWUP-48 adjacency, and the unfalsifiability go unaddressed. Concretely:
**universe = the offline faux-provider falsifier family (extension + headless
runner + pty substrate) under `test/` and the retired `ev43/`; identity
criterion = one definition each of the provider script, the headless runner,
`class Screen`/`class Session`; residual = `smoke/search-smoke/driver.py`,
pinned by name.** Also note the adjacency: FLLWUP-48
(`council/cards/FLLWUP-48.md`) budgets the live pty/`-p` arms in default `bun
test` — so this refactor may add **zero** live arms or arms-new-timeouts, or
it invalidates the next card's measurement.

## Testable claims

1. **No duplicated copy remains (within the declared universe).** New
   `test/faux-provider-shape.test.ts` (no live runs) asserts:
   `readdirSync(test/faux-provider)` is exactly `{harness.ts, extension.ts,
   pty.py}`; `!existsSync("ev43")`; `!existsSync("test/ev41-tui.py")`; across
   the repo, `class Screen` and `class Session` each appear in exactly
   `{test/faux-provider/pty.py, smoke/search-smoke/driver.py}`; exactly one
   file under `test/` defines `resolveNode`. *Falsified by:* a fifth `class
   Screen`, or a reborn copy.
2. **Single import site.** `grep -rn
   "ev40-harness\|ev43/\|falsifier-headless\|ev41-tui\.py" test/ extensions/
   --include=*.ts --include=*.py` → no output; `grep -rln
   "faux-provider/harness" test/` → the four consumers + the shape test.
   *Falsified by:* one lingering old path.
3. **No behavior change beyond two declared items.** `bunx tsc --noEmit`
   clean; `bun test` green with the same test files and the same arm counts;
   the only asserted-string differences in the whole refactor are (i)
   `ev43-reachability.test.ts:66,68,72` literals → imported constants and (ii)
   `:73` colon-less → with-colon. *Falsified by:* any other test-file assertion
   changing, or any arm count/timeout changing (`git diff main --
   test/ev4*.test.ts` shows only import paths, the spawn argv, and those
   literals).
4. **No lost coverage.** The five falsifier suites still run: `ev40-headless`
   (P1 arms A/B, O3, D1), `ev40-live-gates` (P3, P4, O-P2-live, D4, T-H1),
   `ev41-retry-e2e` (preconditions, (b), (c)-headless, (c)-TUI),
   `ev43-reachability` (2 tests). Coverage *gained*: `python3 -m py_compile
   test/faux-provider/pty.py` in the shape test — today a syntax error in an
   unspawned runner breaks nobody.
5. **PTY evidence identity.** `git show main:test/ev41-tui.py > /tmp/old.py`;
   run it and `python3 test/faux-provider/pty.py retry-arms <out>` against the
   same CLI; `diff` the filtered lines `^EV41-TUI|^\[treatment\]|^\[control\]`
   → identical.
6. **Engine comlink clean.** `grep -rn "test/ev40-harness" extensions/` → no
   output (comment at `extensions/parent-retry.ts:4` updated); no historical
   record under `council/cards/` or `vault/` was edited (`git diff --stat main
   -- council/cards vault` → empty).

**Gate commands to settle all of the above** (repo gate set per
`.github/workflows/gates.yml`, plus this card's probes): `bunx tsc --noEmit`;
`bun test`; `python3 council/validate.py`; `bash council/preflight.sh
FLLWUP-49` (expect the FLLWUP-27 stale-by-construction line only); plus
claims 1–6 above, and `python3 -m py_compile test/faux-provider/pty.py`.

### Step 3 — bounded exchange (round 2)

Re-dispatched each generator with the other's round-1 position (read from this
record). Jobs: `owner` `job-22.3` (3.6m, 9 turns), `principal` `job-22.4`
(3.6m, 16 turns), both settled `done`. Positions appended verbatim. **Closed
at 2 rounds** — positions stabilised (see the facilitator note below).

#### Round 2 — `owner` (job-22.3)

### Checks I ran (real output, this tree)

1. **Premise greps / `952d5c1`:** `git show --stat 952d5c1 | grep -Ei
   "harness|\.py" | wc -l` → **`0`**. EV-42 carries no harness or pty file —
   the Intent sentence is stale as read. And `test/ev41-retry-e2e.test.ts:64-65`
   already imports `./ev40-harness/harness-headless.ts` + `INJECTED_ERROR_MESSAGE`.
2. **CSI `D` drift (red today, executable):** driving `ESC[10;20H` then
   `ESC[5D` through each `Screen._csi`: `ev41-tui.py` → **col 4**
   (absolute-column misread); `tui-retry.py` → **col 14** (correct
   relative-left). The copies have diverged and `ev41-tui.py` is the wrong one.
3. **Seat-dispatch reachability:** `extensions/seats.ts:600-617`
   (`buildChildArgv`) emits
   `["--mode","json","-p","-a","--session-dir",…,"--session-id",…,"--model",seat.model,…]`
   — **no `-e`, no `--offline --provider`**. Principal's
   structural-unreachability claim is verified fact.
4. **Literal check:** `INJECTED_ERROR_MESSAGE = "Provider finish_reason:
   error"` (`ev40-harness-extension.ts:48`); both classes are pinned
   non-pi-retryable (`ev41-retry-e2e.test.ts:88` with-colon;
   `ev43-reachability.test.ts:32-47` colon-less).

### Where I concede to `principal`

1. **Directory rename to `test/faux-provider/`** — conceded. My round-1
   "cosmetic wart, out of goal" was wrong in kind: a shared general-purpose
   helper named after one epic is an active misdirection for the next
   consumer, and `git mv` is cheap. Principal's two-commit split (pure move
   first, naming churn second) is the right settlement shape for the Skeptic.
2. **`EV40_*` → `HARNESS_*` env names and provider id `ev40` → `harness` in
   commit 2** — conceded, same argument as (1); consistency with the
   directory concession. Binding constraint: commit 1 carries **zero**
   asserted-string changes.
3. **Profile-based `pty.py` over my three thin runners** — conceded. The
   drift bug I just executed is the empirical case for maximal consolidation
   of the screen model; my "scenarios assert different things" argument is
   answered by the profile table, and principal's shape test (`readdirSync`
   exactly `{harness.ts, extension.ts, pty.py}`) is cleaner than my `grep -c
   "class Screen"` census. `falsifier-tui.py` deleted, its hasUI in-handler
   TUI scenario recorded as a retired manual capability, and with it my
   round-1 `ctx.hasUI` port into the shared extension becomes dead code —
   withdrawn.
4. **Shape test as the goal's only falsifier** — conceded and adopted. I had
   "no duplicated copy remains" as a prose claim with no operationalization;
   principal is right that `bun test` green with four copies present is a
   vacuous green. `test/faux-provider-shape.test.ts` (exact dir set,
   `!existsSync(ev43)`, one `class Screen`/`class Session` outside `smoke/`,
   one `resolveNode`, plus `py_compile pty.py` — coverage gain) goes in the
   design.
5. **`smoke/search-smoke/driver.py` boundary** — conceded: outside the
   declared universe; a `smoke/ → test/` import inside the release gate is a
   layering inversion against an independently-ruled manual. Pinned residual,
   named in the spec.
6. **FLLWUP-48 adjacency** — accepted: this refactor adds zero live arms and
   no arm-timeout changes, or it invalidates the next card's budget.

### What I still defend: the `EV40_ERROR_MESSAGE` knob (against principal's declared colon-less → with-colon swap at `ev43-reachability.test.ts:73`)

Principal's own blind-spot section names the hazard — the EV-43 test is a
*characterization of pi's runtime* whose **recorded** observation
(`council/cards/EV-43.md:143-153`) was produced by the old extension and the
**colon-less** literal — and then accepts swapping the literal anyway as
"declared, strengthening." I don't: a characterization test whose forcing
input changes relative to the recorded observation is a new observation
wearing an old name. The knob (`EV40_ERROR_MESSAGE` env in the extension,
default `INJECTED_ERROR_MESSAGE`, ~5 lines) byte-preserves the recorded
falsifier identity and makes my diff strictly smaller than principal's: only
literals→imported-constants, **no** asserted-string change in
`ev43-reachability.test.ts` (the `control.stderr` assertion at `:73` stays
`Provider finish_reason error` byte-identical to HEAD, since the with-colon
literal does not contain that substring). Principal's counter would be
"one-test surface"; I accepted exactly that trade in round 1, for this
reason. This is a ~5-line cost vs. falsifier identity — I hold it.

### Goal-text defect — I agree with principal, with the reading that keeps the oracle

Two defects, both verified above: (a) the **premise** is stale (EV-42 carries
nothing; EV-41 headless already shared; the real duplication is `ev43/` + the
pty screen models); (b) the **seat-dispatch clause is unsatisfiable as
literally read** — the seat-dispatch provider-error test is built on
`test/stub-child.ts` (shared by 5 test files, per principal's grep), and
routing a faux provider into the real seat child path requires changing
`buildChildArgv`/spawn in the engine, which would change what that falsifier
proves. The correct reading the implementation can satisfy: **"the
seat-dispatch provider-error test imports [its shared helper]" =
`stub-child.ts`**, which is itself a shared test helper with no duplicated
copy — while *the parent-turn provider-error tests* import the faux-provider
harness. Under that reading the goal's outcome is: one faux-provider harness
(extension + headless runner + pty substrate) in `test/faux-provider/`, every
provider-error test importing its shared helper and no copy, and the spec
records the premise correction, the seat-clause reading, and the named
`driver.py` residual. No engine change; the judge's oracle holds as written.

### Tradeoffs accepted

- I lose the three-runners shape and the hasUI TUI port (retired, recorded).
  The knob survives as the one deliberate divergence from principal's design;
  if the consolidator sides with principal, the fallback is principal's
  declared swap **plus** a spec note that the `:73` assertion change is a
  declared observation re-encode, not silent drift.
- The knob is one more env var in the extension's contract — accepted; it is
  also what lets the shape test's "exactly three files" stay honest while
  `ev43/`'s identity rides on behavior, not a renamed literal.

### Testable claims

1. **Settled by run this round:** drift test above (cols 4 vs 14 —
   `ev41-tui.py`'s `D` clause is wrong today); `952d5c1` stat has zero
   harness/py files; `buildChildArgv` has no `-e`/`--provider`.
2. **Knob vs swap (red/green):** under my design, `git diff main --
   test/ev43-reachability.test.ts` shows only import-path changes; `grep -n
   "finish_reason error" test/ev43-reachability.test.ts` hits survive
   byte-identical; under principal's, `:73`'s literal changes. One command
   distinguishes the two designs post-implementation.
3. **Goal operationalized (post-refactor):** principal's shape test asserts
   exactly `{harness.ts, extension.ts, pty.py}` in `test/faux-provider/`, no
   `ev43/`, one `class Screen` outside `smoke/`, and — my addition —
   `stub-child.ts` still the single seat fixture (no new seat-fixture copy
   born).
4. **Gates unchanged:** `bunx tsc --noEmit` → `bun test` → `python3
   council/validate.py` → `bash council/preflight.sh FLLWUP-49`, in order,
   plus claims 1–3 and `python3 -m py_compile test/faux-provider/pty.py`.

#### Round 2 — `principal` (job-22.4)

**Shell availability, stated up front:** this pass has
`read`/`grep`/`find`/`ls` only — **no execution**. Every fact below is settled
by reading source with line numbers; every *command* is marked `NOT RUN` and
is the Skeptic's. I claim no run I did not make.

---

### Cross-seam reading — what the contract actually is

Owner's approach §1–§2 and my §"Cross-seam" agree on the tree, and I confirm
owner's drift finding by direct read (previously unverified by me):

- `test/ev41-tui.py:113` → `self.c = max(0, min(self.cols - 1, n - 1))` — the
  `G` clause's absolute-column semantics (`:115`), which is **wrong** for CSI
  `D`.
- `test/ev40-harness/tui-retry.py:107` and `ev43/falsifier-tui.py:111` →
  `max(0, self.c - n)` — correct relative-left.

So the pty family has **already drifted**, and the kit must pick one
semantics. Confirmed, not inferred.

One contract fact I got wrong in round 1 and correct here, from both sides of
the seam:

- `test/ev41-retry-e2e.test.ts:191-215` spawns the seat arm as
  `hub.spawnJob({ seat: "stub", command: "bun", args: [STUB], … })` — it
  **never calls `buildChildArgv` and never dispatches a seat**. Its failure
  literal is engine-sourced: `test/stub-child.ts:3` imports
  `PROVIDER_FINISH_REASON_ERROR` from `../extensions/retry.ts`. The only test
  that runs a real `"pi"` child is the gated `test/integration.test.ts:33`.
- My round-1 claim "wiring the faux provider into the seat path is an
  **engine** change" is **too strong**. `buildChildArgv`
  (`extensions/seats.ts:613`) has no `-e`/`--provider`, but the child runs
  `cwd: repoRoot` with `-a` (`seats.ts:607-608`: "trust project-local files …
  so project extensions load") and `command: "pi"` (`hub-tools.ts:248-249`),
  and pi auto-discovers `.pi/extensions/*.ts` project-locally
  (`pi-coding-agent/docs/extensions.md:113-120`). With a scratch repo carrying
  `.pi/extensions/<faux>.ts` plus a `.council.json` seat-model override, a real
  seat child **can** reach the faux provider with no engine change. I did not
  run this; see `NOT RUN (b)`.

That correction does not save the goal's seat half — it moves it to a
stronger objection, below.

---

### Where I concede, point by point

1. **`EV40_*` env naming stays.** They are a private wire between the TS
   runner (`harness-headless.ts:120-140` `harnessEnv`) and the py runner;
   renaming buys zero behavior and enlarges a diff whose whole value is being
   small. Conceded — and note this **deletes my round-1 commit 2**, whose only
   content was that rename. I replace the split, I don't keep a split with
   nothing in it (see defense 4).
2. **`EV40_ERROR_MESSAGE` knob: conceded.** `council/cards/EV-43.md:149-158`
   records the observation with the colon-less class by name, and
   `test/ev43-reachability.test.ts:5-17` states the observation *is* the
   characterization. A silently swapped literal makes "observation preserved"
   unfalsifiable in the one direction that matters. Owner is right. Condition
   attached: the knob covers **one of four** moving identity strings (defense
   2).
3. **Three thin pty runners, not one profile-parametrized file: conceded.**
   The substrate is where dedup pays; a profile table adds an argv dispatch
   and a knob forest while removing no definition. Owner's `pty-kit.py` +
   three scenario runners achieves the same single-`class Screen`,
   single-`class Session` outcome with more readable per-scenario verdicts.
4. **Not renaming the directory: conceded as tradeable, defended as
   preferable (ranked last).** I will not spend a round on it. Rationale if it
   survives: `test/ev40-harness/` names the family after the *first* of three
   consumers (EV-40, EV-41, EV-43), and after this card the directory is the
   family's home; the directory name is the only discovery surface a third
   consumer has. Cost is bounded and mechanical — `HARNESS_EXTENSION`
   (`harness-headless.ts:14`) feeds `test/ev41-retry-e2e.test.ts:59,344`, the
   three TS import blocks (`ev40-headless.test.ts:35-37`,
   `ev40-live-gates.test.ts:39-40`, `ev41-retry-e2e.test.ts:64-65`),
   `test/ev43-reachability.test.ts:25`'s re-point, and five comment citations
   (`extensions/parent-retry.ts:4`, `test/ev41-tui.py:4`,
   `test/ev40-harness/tui-retry.py:4`, `test/ev41-retry-e2e.test.ts:4,32`,
   `test/ev40-live-gates.test.ts:147`). If the consolidator drops it, I take
   `test/ev40-harness/` + `pty-kit.py` without objection.

Conceded items are off the table for me. Everything below is load-bearing,
ranked.

---

### Where I still defend, and why

**1. The committed shape test — the goal has no other operationalization, and
this is now a *settled* claim, not a preference.**
The suite cannot witness this goal, in two independent ways:

- No test asserts the shape: `grep "class Screen"` repo-wide returns only
  `ev43/falsifier-tui.py:52`, `test/ev41-tui.py:54`,
  `test/ev40-harness/tui-retry.py:48`, `smoke/search-smoke/driver.py:66` —
  four `.py` definitions, **zero** assertions. All four copies exist today
  under a green suite.
- The fleet precedent is *settled*: the immediately-preceding card's PO step-6
  ruling records, as a `closed-red` fact, that "removing
  `test/ev40-harness/` and `ev41-tui.py` leaves the count identical — those
  files are inert in that configuration"
  (`vault/raw/2026-09-17-po-fllwup47-step6-ruling.md:302-307`, mirrored at
  `docs/superpowers/specs/2026-09-17-FLLWUP-47-design.md:86-91`).

So a Skeptic whose falsifier is `bun test` returns a vacuous green. Owner's
claims 3–4 (`ls ev43/`, grep counts) are *one-shot PR-time* evidence; they
prove the state at merge and nothing after. I keep the shape test, refined
against the change-detector objection: assert **identity** properties, not an
exact `readdirSync` list — one provider extension, one headless runner, exactly
one `class Screen`/`class Session` under `test/`, `ev43/` absent — plus
`python3 -m py_compile` on each pty runner (today a syntax error in an
unspawned manual runner breaks nobody; that is a real gap, not decoration).

**2. EV-43 characterization fidelity — and owner's knob covers one of four
strings.**
The recorded observation names four identity strings: extension/provider id
`ev43`/`ev43-model`, continuation `EV43-CONTINUE`, marker
`EV43-SECOND-RESPONSE`, and the injected class (`council/cards/EV-43.md:149-158`,
`:317`, `:415-418`). Re-pointing onto the shared harness necessarily moves
three of them, and the test asserts all of them: `:66` and `:72`
(`EV43-CONTINUE`), `:68` (`EV43-SECOND-RESPONSE`), `:73` (the class the knob
preserves). Two additions close it, both cheap:

- export the continuation prompt from the extension (one line;
  `CONTINUATION_MARKER` is already exported at
  `ev40-harness-extension.ts:33`) so the re-pointed test asserts **no**
  harness-internal literal — the property I argued for in round 1 and which
  owner's `EV40_ERROR_MESSAGE` knob alone doesn't reach.
- correct `test/ev43-reachability.test.ts:1-19`: its header currently
  describes extension + runner that this refactor deletes ("the EV-43 scratch
  extension"). That paragraph is live documentation, not a historical record,
  and it would lie after the re-point. Owner's consumer table (`ev43/`
  deleted, test re-pointed) does not list it.
- `EV-43.md` itself must **not** be edited — it is the record of what was
  observed (my round-1 claim 6, `git diff --stat main -- council/cards vault`
  → empty). Owner and I agree; naming it here so the Skeptic doesn't accept an
  amended record.

**3. The smoke `driver.py` boundary, unchanged — and the universe must be
*declared*, or the Skeptic settles it by grep root.**
Grounds, stronger than my round-1 "release-gate independence":
`smoke/search-smoke/README.md:114-116` pins a greppable claim — "`driver.py`
imports python3 stdlib only … The screen model and the byte table are authored
in the driver" — and `run.sh:60-83` installs a **pinned** pi 0.84.3 into a
scratch prefix (`driver.py:4`) while the test harness resolves the
**dev-installed** pi via `import.meta.resolve` (`harness-headless.ts:21-25`).
Sharing a screen model across two different pinned pi versions couples the
release gate to a module under `test/` and falsifies a pinned README claim.
This is also where owner's claim 3 and my claim 1 diverge in a way the spec
must resolve: owner greps `test/` and expects `1`; I grep repo-wide and expect
`2`. Both are right under their own scope. **The spec must pin the universe in
prose** — the faux-provider falsifier family under `test/` plus the retired
`ev43/`, with `smoke/search-smoke/driver.py` named as the one pinned residual
— or a Skeptic can make either claim red by choosing a root.

**4. The two-commit split, re-specified now that the rename is gone.**
Commit 1 = pure relocation + substrate dedup + re-points, **zero assertion or
behavior change**. Commit 2 = the declared deltas: the D-clause semantics fix,
`EV40_ERROR_MESSAGE`, the `hasUI` branch port, the EV-43 identity strings →
imports, the header/comment corrections, and the shape test. Rationale: the
Skeptic's "no behavior change" falsifier is only checkable on a commit that
*excludes* the changes we already know change behavior. Fold them together and
no reviewer can separate "moved" from "changed" without reading the whole
diff — the exact hiding place this card-class is about.
Sequencing point neither round-1 position made: **the D-clause fix changes a
live arm's screen rendering** (`ev41-retry-e2e.test.ts:338` spawns it,
`:355-357` assert its verdict). It must be re-run *after* the fix, not merely
after the move — the pty arm's current green may or may not depend on the
wrong `D` semantics, and only a post-fix run settles it.

**5. The `hasUI` port owner found (his §3): accepted, and owner is factually
right.** `ev40-harness-extension.ts:190-204` has only the send-then-poll
branch; `ev43/ev43-falsifier-extension.ts:72-91` has the `ctx.hasUI` split.
Moving `falsifier-tui.py`'s scenario onto the shared extension without that
branch silently changes the TUI shape. This is a genuine contribution from
owner's read and belongs in commit 2.

**6. Engine-comment sweep (mine, round-1 item 6) is now inside commit 2** —
`extensions/parent-retry.ts:4` cites
`test/ev40-harness/ev40-harness-extension.ts`; `test/ev40-live-gates.test.ts:147`
cites `--provider ev40`. A test path cited from an engine file is the
cross-seam tell this seat exists to catch, and it is absent from owner's
table.

---

### The goal-text question, resolved with `owner`

`goal` (card line 12): "…a shared test helper that **both the parent-turn and
seat-dispatch provider-error tests import**, with no duplicated harness copy."

There are exactly two readings, and the tree settles both:

- **File granularity:** `test/ev41-retry-e2e.test.ts` imports
  `harness-headless.ts` (`:64`) and the extension (`:65`), and the seat block
  lives in that file → **true at HEAD already**, and stays true under either
  design (both leave the seat block and `stub-child.ts` untouched). Under this
  reading the clause is **vacuous**: it moves nothing.
- **Block granularity:** the seat block imports/uses the harness → **false at
  HEAD** (its child is `bun stub-child.ts`, its literal is
  `PROVIDER_FINISH_REASON_ERROR` via `stub-child.ts:3`), and satisfiable only
  by re-architecting the seat arm into a real `pi` child under a
  config-injected faux provider — which changes what it proves (a 20-second
  deterministic Hub + `createRetrySupervisor` falsifier becomes a multi-minute
  live CLI e2e) and adds an arm to the suite whose budget is literally the next
  card's subject (`council/cards/FLLWUP-48.md`: "EV-41's live pty and `-p`
  parent-turn arms cost roughly 30 to 95 seconds inside the default `bun test`
  suite").

**My ruling, offered as agreement with owner's conclusion and a sharper
reason:** the `Intent` sentence is **stale** (both of us verified: EV-42's
squash `952d5c1` added no harness; EV-41's headless half is already shared) —
that is a fact, not a judgment. The `goal`'s "both … import" clause is
**defective as a specification**, because it is either vacuous or
unsatisfiable *and the goal text does not say which*; its second clause ("no
duplicated harness copy") is the only clause this card actually moves.
Critically, this defect **does not block delivery**: under both readings the
re-pointed design leaves the seat half exactly as it is, so no reading is
violated by shipping the dedup. The remedy is a spec sentence, not a recast:
record the operative reading (file granularity), record that the seat block
remains on `test/stub-child.ts` deliberately, and do not touch `goal`
mid-deliberation without a ruling — the card's Phase-1 face gives the
deliberation the design, not the card text.

---

### Blind spots, by vantage

- **Owner's (inside the refactor):** (i) "keep the colon-less expectations via
  the knob" is one-of-four — `:66`, `:68`, `:72` still move; (ii) the
  re-pointed test's *header prose* (`:1-19`) survives the table and would
  describe the deleted extension; (iii) the shared `secondMessagePresent`
  (`harness-headless.ts:377-379`) matches against the **whole** `sequence`,
  which includes `user` lines (`finalizeArm`, `:210-218`), while EV-43's local
  one (`falsifier-headless.ts:129-131`) is assistant-only — role-agnostic
  matching inside the very predicate that carries treatment/control
  attribution. One line to tighten; own it in commit 2.
- **The card/Intent's:** the tree. It cannot see that the seat arm is a
  Hub/supervisor test with a `seat: "stub"` *label*, or that no test
  dispatches a real seat child outside the gated integration test.
- **The smoke's:** that its own `driver.py:66,265` is the fourth
  `Screen`/`Session`, that `README.md:114-116` pins "authored in the driver"
  as a greppable claim, and that it targets a pinned external pi rather than
  the dev-installed one.
- **The Skeptic's:** that `bun test` is structurally incapable of witnessing
  this goal (above), so a green suite must not be recorded as evidence of "no
  duplicated copy."
- **Mine, restated:** I could not read EV-41/EV-42/EV-43 card bodies end to
  end, and I have no shell — every executable claim below is unrun.

---

### Reframe

**No design reframe — the agent's convergence is earned.** The tree nearly
forces it: EV-40's family is the superset, `ev43/` is a live predecessor copy,
four `Screen`/`Session` definitions exist with proven drift, and the
stub-child fixture is a different family. Owner and I now differ only on:
committed-vs-one-shot falsification (defense 1), directory name (conceded as
tradeable), runner count (conceded), and the goal reading (resolved above). I
explicitly accept owner's `pty-kit.py` + three thin runners, the `EV40_*`
naming, the `EV40_ERROR_MESSAGE` knob, the `hasUI` port, and the untouched
`stub-child.ts`/`smoke` boundary. The design is sound; the two things this
round must not lose are the **committed shape test** and the **declared
universe**.

---

### Checks: what I ran, what I did not

**Read-verified this pass (real output reported above, no execution):** the
`D`-clause divergence (`ev41-tui.py:113` vs `tui-retry.py:107` vs
`falsifier-tui.py:111`); the seat arm's `command: "bun"` spawn with no
`buildChildArgv` (`ev41-retry-e2e.test.ts:191-215`); `stub-child.ts:3`'s
engine-sourced literal; `command: "pi"` in tests only at
`integration.test.ts:33`; four unasserted `class Screen` definitions;
`read_sequences` dict-form (`ev41-tui.py:237`) vs string-form
(`tui-retry.py:250`); the `childEnv`/`cwd: repoRoot`/`-a` + `.pi/extensions`
auto-discovery path.

**`NOT RUN` — for the Skeptic:**
- **(a)** the pty drift one-liner (owner's claim 2). Read-derived expectation:
  after `ESC[10;20H` then `ESC[5D`, `ev41-tui.py` lands at 0-based `c=4`,
  `tui-retry.py` at `c=14`. Unexecuted.
- **(b)** the falsifier that decides my round-1 error: a scratch repo with
  `.pi/extensions/<faux-provider>.ts` + `.council.json` seat-model override,
  dispatched through a real `council_dispatch`, asserting the seat child's
  error carries the faux literal. **This is the check that distinguishes
  "unsatisfiable" (my round-1 claim, now doubtful) from "satisfiable but
  changes what the seat arm proves" (my round-2 claim).** A shape test
  asserting the dir contents is safe against either outcome; a design that
  re-architects the seat arm is not.
- **(c)** the gate set: `bunx tsc --noEmit`; `bun test`; `python3
  council/validate.py`; `bash council/preflight.sh FLLWUP-49` (FLLWUP-27 line
  excepted per the card's binding note).
- **(d)** the shape test itself — it does not exist yet.
- **(e)** post-D-fix re-run of the pty arm: `python3 <kit>/ev41-tui.py <out>`
  must still exit 0. Cannot be skipped on the grounds that the arm is green
  today.

**Testable claims (runnable, in priority order):**
1. **Goal has no witness (must be red today, then green with the shape
   test):** `grep -rn "class Screen" test/ --include=*.py | wc -l` → `3`;
   `ls ev43/` → exists; `bun test` → green. A shape test asserting
   single-definition/no-`ev43` is the only thing that flips this.
2. **No other assertion moved:** `git diff main -- test/ev4*.test.ts` shows
   only import paths, the pty spawn argv, the EV-43 identity strings →
   imported constants, and the `:73` class literal. *Falsified by:* any other
   assertion or any arm count/timeout delta.
3. **EV-43 characterization preserved, not re-recorded:** `bun test
   test/ev43-reachability.test.ts` green with the colon-less class on
   `control.stderr` and exit 1; the test file's header names the shared
   extension; `git diff --stat main -- council/cards vault` empty.
4. **D-clause fix is re-verified, not assumed:** `python3 <kit>/ev41-tui.py
   <out>` exit 0 **after** the fix, with the four `EV41-TUI-*` lines identical
   to pre-fix.
5. **Universe check bounded:** `grep -rln "class Screen\|class Session" . `
   → exactly `test/<kit>/pty-kit.py` + `smoke/search-smoke/driver.py`, with the
   latter named in the spec as the pinned residual.
6. **No new live arm:** `grep -c "test(" test/ev40-*.test.ts
   test/ev41-retry-e2e.test.ts test/ev43-reachability.test.ts` unchanged from
   `main` — FLLWUP-48's budget stays measurable.

#### Facilitator note — exchange closed at round 2

Positions stabilised. Both generators conceded the other's load-bearing
points: `owner` conceded the `test/faux-provider/` rename, the profile-based
`pty.py`, the committed shape test, the `smoke/search-smoke/driver.py`
boundary, and the FLLWUP-48 zero-new-live-arms constraint; `principal`
conceded the `EV40_*` env naming, the `EV40_ERROR_MESSAGE` knob, the three
thin pty runners, and did not press the rename. On the card's `goal` text both
agree the `Intent` premise is stale (verified: EV-42's squash carries no
harness file) and the "both … import" clause is vacuous-or-defective, with
the remedy a spec sentence rather than a recast of `goal` — neither proposal
changes what the re-pointed design does to the seat arm (it stays on
`test/stub-child.ts`). No third round is needed; the ≤3 cap is not reached.
Residual points carried to step 4/5, not settled by the exchange:
`principal`'s four-moving-identity-strings condition, the re-pointed EV-43
test header prose, the `secondMessagePresent` role-agnostic matching,
the declared universe' grep root, the two-commit split, the D-clause semantics
fix and its post-fix pty re-run, and the engine comment sweep.

### Step 4 — Skeptic attacks and runs tests (`job-22.5`)

3.6m / 21 turns, settled `done`. Subject: the deliberation record and the tree
it makes claims about at HEAD (no branch exists at step 4). Objections and
their **actual** results appended verbatim; all probes ran read-only from
`/tmp`, the main tree unmodified, no branch/worktree touched.

- **Objections**
  - **O1 — Intent premise stale (targets card `Intent` + both seats' §1).**
    Settling test: `git show --stat 952d5c1 | grep -Ei "harness|\.py" | wc -l`
    → `0`; `grep -n "ev40-harness/harness-headless" test/ev41-retry-e2e.test.ts`
    → hit. Status: **`closed-green`** — premise false as read; real duplication
    is `ev43/` + pty screen models, not EV-41/EV-42.
  - **O2 — Pty CSI-D drift, `ev41-tui.py` wrong (targets owner's executable
    claim).** Settling test: `/tmp/pty_drift.py` loads each `Screen`, applies
    `ESC[10;20H` then `ESC[5D`. Status: **`closed-green`** — `ev41-tui.py` →
    `c=4` (absolute-column misread, same clause as `G`); `tui-retry.py` and
    `falsifier-tui.py` → `c=14` (correct relative-left). Copies have diverged;
    kit must pick relative-left. (Owner's "col 15" vs my "c=14" is 1-based vs
    0-based — same cell.)
  - **O3 — `secondMessagePresent` attribution widens on re-point (targets
    principal's blind-spot iii).** Settling test: `/tmp/role_probe.ts` — shared
    helper on a user-line-only arm, local helper on user-line vs assistant-line
    arms. Status: **`closed-green`** — shared matches a `user` line containing
    the marker (`true`); local is assistant-only (`false` on user-line, `true`
    on assistant-line). Re-pointing EV-43 onto the shared predicate changes
    attribution semantics; commit 2 must tighten to assistant-only.
  - **O4 — Universe/grep-root + smoke residual (targets owner `grep test/`→1 vs
    principal repo-wide→2).** Settling test: `grep -rn "class Screen" test/
    ev43/ smoke/` and `grep -rln "class Screen\|class Session" .`. Status:
    **`closed-green`** — exactly 4 definitions at HEAD
    (`test/ev40-harness/tui-retry.py:48`, `test/ev41-tui.py:54`,
    `ev43/falsifier-tui.py:52`, `smoke/search-smoke/driver.py:66`); `class
    Session` likewise ×4. `smoke/search-smoke/README.md:114-116` pins "stdlib
    only … authored in the driver"; `run.sh:20` pins pi `0.84.3` vs harness
    `import.meta.resolve` dev pi. Both counts right under own root — spec must
    declare the universe with `driver.py` named residual.
  - **O5 — EV-43 identity is four strings, knob covers one (targets owner's
    knob claim).** Settling test: grep EV-43 literals + `EV40_ERROR_MESSAGE`
    absence. Status: **`closed-green`** — moving strings are provider id
    `ev43`/`ev43-model`, `EV43-CONTINUE` (`:66,:72,:75`),
    `EV43-SECOND-RESPONSE` (`:68`), colon-less class (`:73`,
    `ev43-extension:55`); `EV40_ERROR_MESSAGE` appears nowhere at HEAD;
    `CONTINUATION_MARKER` is exported but the `EV40-CONTINUE` prompt itself is
    a non-exported `const CONTINUATION`. Knob preserves 1-of-4; test header
    (`:1-19`, names deleted `ev43/` files) and `:66/:68/:72` still need the
    export/header fix. `EV-43.md` must stay unedited (record, agreed by both
    seats).
  - **O6 — `hasUI` branch differs (targets owner's §3 port / round-2
    withdrawal).** Settling test: read `ev40-harness-extension.ts:190-204` vs
    `ev43-extension:72-91`. Status: **`closed-green` on the fact, open design
    choice** — shared has send-then-poll only; ev43 has the `ctx.hasUI`
    fire-and-forget-vs-poll split. Whether commit 2 ports it (scenario moved)
    or drops it (scenario retired) is unresolved between the seats' round-2
    texts.
  - **O7 — Seat-path reachability (targets principal r1 "engine change" vs r2
    correction).** Settling tests: (a) read `buildChildArgv`
    (`seats.ts:600-621`) — no `-e`/`--provider`, confirmed; `hub-tools.ts:248-249`
    `command:"pi"`, `cwd: repoRoot` + `-a` confirmed; auto-discovery docs
    (`pi-coding-agent/docs/extensions.md:113-120`) confirmed project-local
    `.pi/extensions` loads. (b) `ev41-retry-e2e.test.ts:161-168` spawns
    `command:"bun", args:[STUB]`, `seat:"stub"` label — never calls
    `buildChildArgv`; only `integration.test.ts:33` spawns real `pi`. Status:
    **structural sub-claims `closed-green`** — r1 "unsatisfiable without engine
    change" is falsified as too strong; r2 "reachable via scratch-repo
    `.pi/extensions` + `.council.json`, no engine change" is structurally
    plausible. **Live E2E (scratch repo + real `council_dispatch` asserting the
    faux literal in a seat child) `open-untested`** — would require
    writes/dispatch outside this read-only turn; not run.
  - **O8 — Goal has no falsifier today.** Settling test: full `bun test` +
    `tsc` + `validate.py` at HEAD with all 4 copies present. Status:
    **`closed-green`** — `bun test`: 884 pass / 2 skip / 0 fail; `bunx tsc
    --noEmit` clean; `validate.py` clean. Green coexists with full duplication:
    vacuous witness confirmed. Removal half (`rm test/ev40-harness
    test/ev41-tui.py` leaves suite identical, FLLWUP-47 PO ruling
    `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md:300-307`) is **cited,
    `open-untested`** — re-running it requires modifying the tree, forbidden
    this turn.
  - **O9 — Shape test sufficient as sole operationalization?** Settling test
    (logical + grep evidence): a predicate scoped to one directory passes while
    copies survive elsewhere — demonstrated by O4's root-dependent counts.
    Status: **`closed-green` with condition** — only an identity-scoped test
    (one provider script / one headless runner / one `Screen`+`Session` inside
    the *declared universe*, `ev43/` absent, `py_compile` on runners) falsifies
    "no duplicated copy"; an exact-`readdirSync` or wrong-root variant can be
    satisfied while a copy survives. Today's `read_sequences` evidence supports
    consolidation: ev41 dict-form is strictly richer than tui-retry string-form.
  - **O10 — No new live arms (FLLWUP-48 adjacency).** Settling test: `grep -c
    "test("` baseline → ev40-headless 3, live-gates 5, ev41-retry-e2e 5,
    ev43-reachability 2. Status: **`closed-green` on baseline** — candidate
    compliance (shape test spawns nothing, no arm-count/timeout delta) is
    checkable only post-implementation.

- **What I ran** (all read-only, main tree unmodified; timeouts explicit)
  - `git show --stat 952d5c1 | grep -Ei "harness|\.py" | wc -l` → `0`. Full
    stat: 12 files, `extensions/{hub,provider-cost,runs,usage-*}.ts` +
    specs/tests only.
  - `grep -n "ev40-harness/harness-headless" test/ev41-retry-e2e.test.ts` →
    `:64: } from "./ev40-harness/harness-headless.ts";`
  - `grep -rn "class Screen" test/ ev43/ smoke/` → 4 hits listed in O4;
    `grep -rln "class Screen\|class Session" .` → same 4 (+ `.worktrees/*`
    clones only).
  - `python3 /tmp/pty_drift.py` → `t41 … c=4`; `t40 … c=14`; `t43 … c=14`
    (plus `D`-default: t41 `c=0`, t40/t43 `c=18`).
  - `bun /tmp/role_probe.ts` → `shared matches user-line marker: true`; `local
    matches user-line marker: false`; `local matches assistant-line marker:
    true`.
  - Reads (all confirmed as quoted): `seats.ts:600-621`, `hub-tools.ts:248-249`,
    `docs/extensions.md:113-120`, `ev41-retry-e2e.test.ts:161-168`,
    `stub-child.ts:3`, `ev40-harness-extension.ts:48-55`,
    `ev43-extension:37-55,72-91`, `ev43-reachability.test.ts:1-19,28-73`,
    `EV-43.md:149-158,455-457`, `README.md:114-116`, `run.sh:20`,
    `parent-retry.ts:4`, `live-gates.test.ts:147`.
  - `bun test` → `884 pass, 2 skip, 0 fail, 5620 expect() calls, 77 files,
    [94.58s]`; `bunx tsc --noEmit` → exit 0; `python3 council/validate.py` →
    `All council artifacts valid`.
  - `grep -c "test(" …` → `3 / 5 / 5 / 2` (order above); `grep -rn
    "EV40_ERROR_MESSAGE" test/ ev43/ extensions/` → no hits.

- **Verdict — candidate stands on the facts, with two named `open-untested`
  items that do not change the re-point.** No `closed-red` blocks the design:
  premise correction, drift direction, role-agnostic widening, 4-string EV-43
  identity, smoke boundary, vacuous-green, and structural seat-reachability
  correction all settled as the seats converged. Open: (1) live seat-child E2E
  through scratch-repo auto-discovery; (2) re-running the FLLWUP-47
  removal-inertness probe. Under either outcome of (1) the shipped design is
  identical (seat stays on `stub-child.ts`); the remedy is spec prose — premise
  correction, file-granularity seat reading, declared universe, identity-
  criterion shape test, `hasUI`/header/role-tightening disposition — not a
  redesign.
