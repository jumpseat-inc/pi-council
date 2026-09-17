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
