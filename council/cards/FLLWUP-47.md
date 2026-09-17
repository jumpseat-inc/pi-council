---
id: FLLWUP-47
title: Documented red-base convention for falsifier evidence
state: In Review
owner: null
epic: EPIC-9
goal: A written convention fixes what a falsifier's red-at-base evidence must record and how it is compared across cards.
---

## Intent

Red-at-base is core falsifier evidence, and its counts varied with harness
copy depth on EV-41 (an optional second base measured 7 fail/1 error by the
owner versus 1 fail/1 error by the Skeptic). A written convention is a
different subject from the suite-cost budget, so steward dispositioned it as
its own `Backlog` residual.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **Card-specific (FLLWUP-47).** Where the convention should live is a
  design/writing question for the deliberation. If the convention would
  introduce **user-visible copy beyond internal documentation**, that copy is
  open-judgment under the authority map — the runner returns `ESCALATION`
  with the drafted string rather than shipping an unruled one.
- **Run-wide Phase-1 rulings (binding; apply and cite, do not re-ask):**
  - Scope = the nine promoted EPIC-9 residuals; EPIC-9 stays `Done`.
  - Sequencing ruled by `steward`; this is the **seventh** card of the run.
  - Merge = `gh pr merge <PR> --squash --admin --match-head-commit <X>` per
    `features-deliver.md`; all five deterministic criteria must hold.
  - **R1** — union-merge reconcile is the sanctioned non-fast-forward repair,
    never force.
  - Step-13 follow-up confirmation is re-homed to `product-owner`: draft,
    never write an unapproved follow-up, and never dispatch `product-owner`
    from this container.
- **Known artifacts carried into this card (binding notes, not rulings):**
  - The FLLWUP-27 preflight branch-freshness `FAIL` recurs mid-card once a
    facilitator record commit advances `origin/main` past a branch cut; the
    step-11 re-run set is `tsc` / `bun test` / `validate.py`, and the FAIL is
    recorded verbatim, never reclassified, never used to weaken a criterion.
  - Criterion 2 is `gh pr checks <PR> --json name,state,workflow` keyed on
    `workflow`; the `gates` workflow must appear `SUCCESS` on the PR head SHA.

## Run record (features-deliver)

### Step 1 — classification (facilitator)

- **Path: full council.** The card's `goal` fixes an outcome — a *written*
  convention governing what a falsifier's red-at-base evidence must record and
  how it is compared across cards — but leaves open every design question that
  produces it: where the convention is written (packaged seat prose, a
  procedure, a durable repo document, the scaffold template set, the wiki), who
  it binds, whether it is normative or advisory, and what a cross-card
  comparison actually keys on given that a red count is a function of the
  base tree plus the harness copy depth (EV-41). That is spec-ambiguous and
  design-judgment, either of which is sufficient for a full council per
  council.md step 1. It is **not** cross-seam in the repo-area sense (no
  engine module, no `.council.json` surface, no rendered council surface).
- **Surface-touching: no (recorded).** The deliverable is internal
  documentation and/or packaged prose read by seats and engineers; it changes
  no person's visible surface, and adds no user-visible string, empty state,
  or error state. No `designer` is seated on this card. Recorded honestly as a
  boundary call rather than a settled fact: if the deliberated design required
  **user-visible copy beyond internal documentation**, the orchestrator's
  Phase-1 card ruling makes that copy open-judgment — this container returns
  `ESCALATION` with the drafted string rather than shipping it unruled.
- **Rulings applied (Phase 1, binding), not reweighed:** the card-specific
  copy/escalation boundary above; scope = the nine promoted EPIC-9 residuals
  with EPIC-9 staying `Done`; sequencing is `steward`'s (seventh card); merge
  = `gh pr merge <PR> --squash --admin --match-head-commit <X>`; step-13
  follow-up confirmation is re-homed to `product-owner` (draft, never write an
  unapproved follow-up); **R1** union-merge reconcile as the sanctioned
  non-fast-forward repair, never force. None of these is extended to a
  question it did not answer.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches
  `owner`, `principal`, `skeptic`, `consolidator`, and `judge`. All five
  resolve from the packaged seat set
  (`/home/tista/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/*.md`,
  each file's `name:` matching its filename); this checkout has **no
  `.pi/agents/`** directory (`ls -d .pi/agents` → `No such file or
  directory`), so nothing shadows them and no repo-local override exists. No
  `designer` (not surface-touching). `product-owner` / `steward` are
  escalation-only and are never dispatched by this container. No `Unknown
  seat` is possible on the seats named here.
- **Environment (facilitator-read, first-hand):** main checkout clean
  (`git status --short` empty); `HEAD = origin/main =
  a55db92609094c791f235366c0f385a8fb21e029`. The six earlier cards of this run
  are merged with their records ancestors of `HEAD`: FLLWUP-40 `8dbe038`,
  FLLWUP-43 `e25b813`, FLLWUP-42 `aff1101`, FLLWUP-41 `9adca28`, FLLWUP-44
  `05ae348`, FLLWUP-45 `2f79142`. `bash council/preflight.sh FLLWUP-47` →
  `PASS: preflight clean`, exit 0. This card is `Ready` at the start of the
  run; no `Needs Human` state and no outstanding ruling — deterministic merge
  check criterion 5 holds at the start of the card.
- **Gate set for this repo (authoritative; `docs/gates/GATE-EVIDENCE.md` does
  not exist here):** `bunx tsc --noEmit`, `bun test`, `python3
  council/validate.py` (AGENTS.md §Commands + `.github/workflows/gates.yml`,
  whose `gates` job runs exactly the last three). `council/preflight.sh
  FLLWUP-47` is run as a card-aware check, but its branch-freshness clause
  (FLLWUP-27) is known to `FAIL` by construction once a facilitator record
  commit advances `origin/main` past a branch cut; per the standing
  known-artifact note the step-11 re-run set is `tsc` / `bun test` /
  `validate.py`. This repo defines no database/import/server gate;
  `COUNCIL_INTEGRATION=1` stays gated and is not run. Criterion 2 is
  `gh pr checks <PR> --json name,state,workflow` keyed on `workflow`; `gates`
  must appear `SUCCESS`.
- **Grounded facts carried into deliberation (inputs, not a settled design;
  the Council verifies them at this tree):**
  - **No red-at-base convention exists anywhere today.** `grep -rn
    "red-at-base\|pre-mechanism\|base run\|red at base"` across
    `council/agents/*.md` and `council/procedures/*.md` matches nothing (the
    only `red` tokens in those files are `closed-red`, the `red flag`
    escalation warning, and generic "a red test" prose). There is no
    normative text for a seat to follow.
  - **Packaged seat/procedure prose is regression-guarded**, by
    `test/prose.test.ts`: no bare `deliver.md`; no `GATE-EVIDENCE.md` in
    `features-deliver.md`; no "registry"/"named agent" framing; no hardcoded
    product domain; and **no pinned tech stack** — the forbidden pattern is
    `/\b(bun|bunx|typescript|tsc)\b|bun test|bun run|@ts-expect-error/i`
    over every packaged seat and procedure body. Any convention sited in seat
    prose must therefore be stack-neutral ("the repo's test command", not a
    named runner) or it breaks the suite.
  - **`docs/gates/GATE-EVIDENCE.md` does not exist in this repo.** `owner.md`
    names it only as an example ("where the repo keeps an authoritative gate
    document"). The wiki records it was deliberately dropped from
    `features-deliver.md` as source-repo-specific
    ([[2026-08-24-bugfix-seat-prose]], fix 2, locked by `test/prose.test.ts`).
  - **`vault/` cannot be authored directly.** council.md step 14 forbids
    hand-editing anything under `vault/`; the wiki is written only through
    `/wiki-ingest`. `vault/wiki` has no page for red-at-base evidence today
    (`grep -rl falsifier vault/wiki/` finds smoke-test/headless-pi/
    transcript pages, none for red-base).
  - **The scaffold is the only channel to consumer repos.**
    `council/scaffold/` ships `council/board.md`, `council/cards/_template.md`,
    `council/preflight.sh`, `council/validate.py`, `vault/CLAUDE.md`,
    `vault/wiki/index.md`, `vault/wiki/log.md`, `.council.json`, copied
    non-clobberingly (AGENTS.md convention #6; `scaffoldInto` never overwrites
    an existing file). Anything intended to travel to consuming repos has to
    ride that template set.
  - **`docs/` holds only per-card working documents today**
    (`docs/superpowers/{specs,plans}/`); there is no durable top-level `docs/`
    convention file in this repo.
  - **The EV-41 discrepancy (corrected at step 6; see the correction below):**
    the optional second pre-mechanism base `3e39e66` measured `7 fail / 1 error`
    in the owner's report versus `1 fail / 1 error` in the Skeptic's
    reproduction. The **required** base (`3a3773f`) reproduced exactly.
    - **Record correction (applied at step 6 per the Skeptic's O1/O2
      `closed-red` results; the true causal story supersedes the harness-copy
      sentence the card previously carried):** EV-41 step 9's sentence — the
      difference "tracks how much of `test/ev40-harness/` was copied into the
      base worktree (that directory does not exist at `3e39e66`), so it is a
      property of the copy depth, not of the falsifier" — is **known-wrong**.
      Removing `test/ev40-harness/` and `ev41-tui.py` from the reconstructed
      base state leaves the count identical (`7 fail / 1 error`); those files
      are inert in this configuration. The six extra fails come from head
      `test/stub-child.test.ts` running against the base `test/stub-child.ts`
      (which lacks the `flaky`/`finish_error` modes), enabled by an
      **unrecorded `extensions/retry.ts` transplant** — not from harness copy
      depth.
    - **The `7 fail / 1 error` number IS reproducible** (owner round-2's
      "unreproducible" finding is refuted). Recipe: base `3e39e66`, transplant
      `{extensions/retry.ts, test/stub-child.test.ts, test/ev41-retry-e2e.test.ts}`
      from EV-41 head `0330274`, keep the base `test/stub-child.ts`, run the
      repo's test command → `733 pass / 2 skip / 7 fail / 1 error`, exact.
      Composition: 6 assertion fails in the transplanted head
      `stub-child.test.ts` (its 6 tests, against the base stub) plus 1
      file-level `Cannot find module '../extensions/job-retry.ts'` counted as
      1 fail + 1 error.
  - **The only standing statement of the red-base obligation** is EPIC-9's
    steward ruling applied on EV-41: EV-41 "cannot land red through the merge
    gate, so its 'starts red' obligation is met by running the authored
    falsifier against the merge-base / pre-mechanism base in a worktree and
    observing red there, then green at the head. The base-commit red run is
    recorded as evidence; **no red test lands**" (EV-41 card, step 1). It
    names no required fields, no base-selection rule, and no comparison rule —
    precisely the gap this card's `goal` closes.
- **Deliberation opened (step 2).** `owner` and `principal` are dispatched in
  parallel with this card only (no designer; not surface-touching); no seat
  sees the other's position in round 1.

### Step 2 — independent first pass (round 1)

`owner` (`job-17.1`, 3.7m, 12 turns, `stopReason=stop`, tokens in 74057 / out
9545 / cR 326400 / cW 0 / reason 6437 / total 410002, cost≈$0.0154 catalogue)
and `principal` (`job-17.2`, 3.7m, 16 turns, `stopReason=stop`, tokens in
207666 / out 18330 / cR 549248 / cW 0 / reason 12830 / total 775244,
cost≈$0.0438 catalogue) were dispatched **in parallel** with the card only —
neither saw the other's position. Both resolved from the packaged seat set.
Positions appended verbatim, labeled by seat.

#### owner — round 1 (`job-17.1`) — verbatim

## Approach

The convention belongs in the packaged seat prose of the two seats the
obligation actually lands on — `owner` records the run, `skeptic` reproduces and
compares it — because a seat obeys only what is in its own system prompt, and
seat prose is the only packaged text guaranteed in-context at evidence time. The
convention is normative but self-enforcing through the loop's existing step-9
reproduction duty; I argue against adding a mechanical field parser to
`validate.py`, citing gate-parity. The required-field list falls out of EV-41's
own record: the one field the two incomparable numbers lacked was the
**transplant identity** — which files were copied into the base worktree, from
which head sha. Below, line references are to files I opened this turn.

## The four questions, answered

### 1. Where the convention is written

**Binding site: `council/agents/owner.md` and `council/agents/skeptic.md` — one
canonical convention block, present byte-identically in both files.** Reasoning
from the tree:

- The obligation lands on exactly two seats. EV-41's card record shows the owner
  recording the base run at step 8 (EV-41.md lines ~166–168: "(d) The
  pre-mechanism base red run… raw red output recorded verbatim") and the Skeptic
  reproducing and comparing it at step 9 (EV-41.md lines ~218–221, objection 5).
  Neither seat reads `docs/`, the scaffold, or the wiki at dispatch time; each
  gets its own agent file as its system prompt (`buildSystemPrompt`, per
  AGENTS.md convention #2 — grounding comes via `<repository_grounding>`, which
  surfaces wiki pages, not binding process). A convention anywhere else is
  advice a seat can be ignorant of without breach.
- Duplicated-block drift is a solved problem in this repo: `test/prose.test.ts`
  lines 74–93 pin `features-new.md` step 3 to a byte-identical fixture
  (`STEP3_FIXTURE`). The same mechanism pins the red-base block byte-identical
  across `owner.md` and `skeptic.md`.
- **Site the card-specific copy boundary respects:** this is internal
  documentation in packaged prose, not user-visible copy, so the Phase-1
  escalation clause is not triggered by the siting itself.

**Record site (non-binding): a wiki page via `/wiki-ingest`** at EPIC-9 residual
closure, per `council/procedures/council.md` step 14 ("Offer to file anything
durable… Never hand-edit anything under `vault/`"). The wiki page is cite-able
grounding, not the normative text — `vault/` cannot be authored directly, and
each consumer repo's `vault/wiki` is instance-local (the scaffold ships only a
starter `index.md`/`log.md`), so a wiki-sited convention would not travel with
the package.

**Rejected sites, with what breaks:**
- *A durable `docs/` file* (e.g. `docs/conventions/red-at-base.md`): reaches only
  this repo; no consumer repo's seats ever read it, and no seat reads it
  in-context during steps 8–9. It documents the convention to humans while
  leaving the bound seats unbound — the `GATE-EVIDENCE.md` failure mode again
  (grounded fact 3: that doc was deliberately dropped from `features-deliver.md`
  as source-repo-specific).
- *A procedure* (`features-deliver.md`, `council.md`): a third copy needing the
  same prose pins, with no added reach — the facilitator only appends positions
  verbatim (council.md step 2) and decides nothing; the writers of the evidence
  are the seats. Adding it to `features-deliver.md` also puts process prose into
  the file whose deterministic-merge-check section is deliberately mechanical.
- *The scaffold* (`council/cards/_template.md`): the template is read at card
  creation, not at evidence time, and it binds card authors, not seats. Also,
  red-at-base evidence does not live in card frontmatter or a fixed card
  section — it lives in the deliberation/owner-report record the facilitator
  appends verbatim.

### 2. Who it binds; normative vs advisory

**Binds `owner`** (a red-at-base record that omits the required fields is an
incomplete gate result, same class as an uncleared gate) **and `skeptic`** (a
reproduction that compares counts without first checking comparability is a
defective verification). **Normative, not advisory.** The goal says "fixes," and
the analogous standing obligations in these same files — verification-subject
pinning, gate integrity (skeptic.md `<gate_integrity>`) — are normative prose,
not style. An advisory convention would not have prevented the EV-41 discrepancy
from being recorded as an unexplained "non-blocking measurement discrepancy"
(EV-41.md lines ~290–295) rather than as a comparability failure the convention
predicts.

**Enforcement cost, and what this repo can carry:**
- *What it can carry, and what actually enforces:* two mechanisms, both already
  built. (a) **Structural**: council.md step 9 makes the Skeptic treat the
  owner's claims as broken until re-run — an under-specified record fails its
  own reproduction by construction, exactly how EV-41's discrepancy was caught in
  practice. The convention doesn't need a new enforcer; it needs to arm the
  existing one. (b) **Static**: prose pins in `test/prose.test.ts` (the required
  field names, and byte-identity of the shared block), the same mechanism that
  already guards all seat/procedure prose.
- *What I argue against:* a `validate.py` field check. `validate.py` is
  scaffold-shipped to every consumer repo and parses card prose; a "record must
  contain fields X–Y" check must first heuristically detect that a record *is*
  red-at-base evidence, which is brittle against legitimate phrasing variance
  across consumer repos — it false-FAILs honest records. Gate-parity
  (vault/wiki/gate-parity.md, "The placement rule") settles the placement
  principle: a layer may be stricter than the runtime only where an existing
  gate is also that strict, and "teach at the surface; don't gate at
  persistence." Here the surface is the Skeptic's reproduction duty; there is no
  existing mechanical gate that parses evidence prose, so a new one would be
  writer-only strictness — exactly the asymmetry EV-24 rejected.

### 3. What a red-at-base record must contain

Seven fields — each traceable to a real failure or a real success in EV-41's
record:

1. **Base identity** — the full 40-hex sha *plus one sentence stating the
   base-selection rule it satisfies* (e.g. "the commit immediately preceding the
   epic's first mechanism merge"). EV-41 did this right (EV-41.md lines 66–68:
   sha + relationship). A bare sha without the rule is unauditable — a later
   reader can't tell whether it's the merge-base or a cherry-picked convenient
   ancestor.
2. **Transplant identity — the falsifier's own identity/version: the enumerated
   file list copied into the base worktree, and the head sha they were copied
   from.** At base the falsifier does not exist; it is a transplant. This is the
   field EV-41 lacked and is precisely what varied between the two runs
   (`test/ev40-harness/` copy depth — EV-41.md lines ~290–293). Without it, "the
   same falsifier" is an assertion, not a fact.
3. **The exact command, verbatim** — phrased stack-neutrally ("the repo's test
   command as invoked," not a named runner), because the prose test forbids stack
   pinning (`test/prose.test.ts` lines 62–67).
4. **The raw red output, verbatim — counts *and* the failure lines, never
   paraphrased.** This is what made the Skeptic's "byte-for-byte the owner's
   recorded red" reproduction checkable (EV-41.md lines ~218–221: `0 pass / 2
   fail / 2 errors` with the `Cannot find module` lines). Counts alone would have
   made even the matching reproduction unverifiable.
5. **Worktree provenance** — detached checkout at the base in a separate
   worktree, main checkout untouched, worktree removed after. Recorded on EV-41
   and required by main-repo immutability.
6. **The explicit copy set** — everything placed in the base worktree beyond the
   falsifier itself, or the affirmative statement "bare copy." This is field 2's
   superset and the direct fix for the EV-41 discrepancy: when the copy set
   differs, the numbers were never the same experiment.
7. **The landing statement** — "no red test landed," the standing rule from
   EPIC-9's steward ruling (EV-41 card step 1; grounded fact 8). It is a rule
   restated per record, because its violation is silent and catastrophic (a red
   test landing is the merge gate's failure, not a documentation gap).

### 4. What a cross-card comparison keys on

**The comparability triple: (base sha, transplant identity = file list + source
sha, exact command).** The rule I would write:

- *Within an identical triple*, counts must reproduce exactly; non-reproduction
  is a defect in one of the two records (EV-41's required base `3a3773f`
  reproduced byte-for-byte — the triple was identical).
- *Across different triples*, counts are **not comparable numbers**. The only
  comparable assertion is the binary "red observed at base." Any count
  difference must be attributed to the differing leg of the triple — copy depth,
  population, or command — and never read as a property of the falsifier or the
  mechanism under test.
- *Population-difference sub-rule (the EV-41 copy-depth case):* if the base tree
  lacks any path the transplant references (at `3e39e66`, `test/ev40-harness/`
  did not exist), the record must state that at recording time, and its counts
  are copy-depth-qualified from the start — they may not be presented as a base
  measurement even provisionally.

This also answers "compared across cards": two cards' red-at-base evidence
compares only when their triples match (rare — different cards cut branches at
different heads); otherwise the cross-card claim that survives is the binary
red-observed one plus the explained difference. That is the honest maximum, and
it is still useful: it makes "red at base" an auditable, reproducible claim per
card while preventing cross-card count numerology.

**Genuinely open (my reading, not settled):** whether the canonical block lives
in `owner.md` with `skeptic.md` carrying the byte-identical copy (my position,
per the STEP3_FIXTURE pattern) versus a single packaged file both seats
reference — seat prompts are standalone, so I believe duplication-with-a-fixture-pin
is the only option that puts the full convention in each bound seat's context,
but this is a judgment call a round-2 exchange could move on. Also open: whether
the card's step-14 wiki-ingest offer is *mandated* by this card or left as the
standing offer — I lean leave-as-offer, since the `goal` ("a written
convention") is satisfied by the seat prose alone.

## Tradeoffs accepted

- **Duplicated prose in two seat files** instead of a single shared document —
  accepted because seat prompts are standalone and a cross-file reference is not
  guaranteed in-context; the drift risk is bought off with a byte-identity
  fixture test, the repo's established pattern.
- **No runtime enforcement** (no `validate.py` field parser) — accepted because
  the Skeptic's reproduction duty already enforces the convention where it
  matters, and gate-parity forbids writer-only strictness without a matching
  runtime gate.
- **No scaffold change** — accepted because the bound seats are packaged; seat
  prose travels to every consumer repo automatically, so the scaffold's role as
  "the only channel to consumer repos" (grounded fact 5) is satisfied by the
  package itself, not the template set. Nothing consumer-facing is lost.
- **Counts demoted to within-triple-only comparability** — accepted cost: we give
  up the hope of a cross-card red-count metric, which was never a real
  measurement anyway (EV-41 proved two well-intentioned runs of the same
  falsifier at the same base sha could differ 7×1 vs 1×1).

## Testable claims

1. **Stack-neutrality is load-bearing, not stylistic.** A drafted convention
   that names a concrete runner as the "exact command" example goes red
   immediately: run `bun test test/prose.test.ts` after placing any draft in
   `owner.md`/`skeptic.md` — the "no pinned tech stack" test (prose.test.ts
   lines 62–67) matches `/[\b(bun|bunx|typescript|tsc)\b|bun test|bun run/i`
   over every packaged seat and procedure body. The convention must say "the
   repo's test command, verbatim."
2. **No packaged prose carries red-at-base normative text today** — settled
   closed-green this turn: my grep over `council/` matches `red-at-base`/`pre-mechanism`
   only in `council/cards/EV-41.md` and `council/cards/FLLWUP-47.md` (run
   records), zero hits in `council/agents/*.md` or `council/procedures/*.md`.
3. **Duplication drift is testable**: the new guard — a prose test asserting the
   convention block is byte-identical in `council/agents/owner.md` and
   `council/agents/skeptic.md` (the `STEP3_FIXTURE` mechanism, prose.test.ts
   lines 74–93) — is red until the block lands identically in both, and red again
   the moment one side is edited without the other. That test *is* the
   enforcement of my Q1 position; a single-file counterproposal must answer how
   each standalone seat prompt gets the full text.
4. **The field list is adequate if it retro-predicts EV-41 rather than being
   surprised by it.** Concretely: apply the seven fields to EV-41's owner record —
   fields 2 and 6 (transplant identity / copy set) are absent from the `3e39e66`
   run and present-in-spirit only for `3a3773f`; the convention must therefore
   classify the `7 fail / 1 error` vs `1 fail / 1 error` pair as *not comparable*
   (differing triple leg), which is exactly the conclusion the card record
   reached ad hoc. A convention that instead produces "one of the two runs was
   wrong" fails this check.
5. **Against a `validate.py` enforcement counterproposal**: the settling test is
   a synthetic consumer card whose red-at-base record contains all seven fields
   in legitimate phrasings a parser wasn't written for — `python3
   council/validate.py` must stay clean; a field-checking gate false-FAILs it,
   and per gate-parity (vault/wiki/gate-parity.md) writer-side strictness with no
   matching runtime gate is the rejected asymmetry.

#### principal — round 1 (`job-17.2`) — verbatim

## Cross-seam reading

Two things on opposite sides of this seam, both opened:

**Producer/consumer.** `extensions/seats.ts:592-597` builds a seat's prompt as
`seat.body` + `<council_runtime>` (the procedures **directory path only**) +
`<repository_grounding>`. A seat never receives procedure text. So a convention
sited in `council/procedures/council.md:201-267` reaches the *facilitator*, not
`owner` or `skeptic`; a convention sited in `council/agents/owner.md` /
`skeptic.md` lands in the seat's system prompt by construction. And
`council.md:268-280` constructs the judge's input as the card `goal` + the
skeptic's step-9 evidence only — matching `judge.md:31,55-57`. Three different
readers, three different channels.

**Guard.** `test/prose.test.ts:8-16` enumerates only `council/agents/*.md` and
`council/procedures/*.md`. The GATE-EVIDENCE guard is *per file* — `:28-34` reads
`features-deliver.md` alone — and `council/procedures/council.md:238` still names
`docs/gates/GATE-EVIDENCE.md`, a path that does not exist here (`docs/` holds
only `superpowers/`). That is a live, unguarded instance of exactly the failure
this card must not repeat. `council/scaffold/**` is outside the scan entirely,
and `extensions/scaffold.ts:50-51` copies only when `!existsSync(dst)`.

## The four questions, answered

### 1. Where it is written — two sites, not one, because there are two readers

- **Normative home: `council/procedures/council.md`** — a block in step 7
  (`:201-229`, the spec must name the base-selection rule and the record's
  fields) and in step 9 (`:257-267`, the skeptic reproduces the base record).
  This is where the obligation is created and checked per card.
- **Binding home: `council/agents/owner.md` (`<owner_mode>`) and
  `council/agents/skeptic.md` (`<verify_by_acting>`, `<output_format>`).** Not
  decoration — per `seats.ts:592-597` this is the *only* channel that puts the
  convention in front of the seats that act. A `council.md`-only convention
  depends on the facilitator paraphrasing it into every dispatch, which is
  exactly the drift the repo already fights.
- **Lock: a pin in `test/prose.test.ts`** on the whitespace-flattened block,
  same pattern as `:231-266` and `:267-...`.
- **Constraint on the site:** stack-neutral wording or `test/prose.test.ts:58-64`
  reds (`bun|bunx|typescript|tsc|bun test|bun run|@ts-expect-error` over every
  seat and procedure). "the repo's test command", never a runner name. Also: do
  not name `docs/gates/GATE-EVIDENCE.md`; `council.md:238` already carries that
  dead path and the guard will not catch a second one.
- **Ruled out, with what breaks:**
  - *Wiki* — `council.md:329-334` forbids hand-editing `vault/**`; only
    `/wiki-ingest` writes it. This card's owner cannot author it, and the wiki is
    grounding prose, not a normative surface.
  - *Scaffold-only* — `extensions/scaffold.ts:50-51`: an already-initialized
    consumer repo keeps its existing file, so a scaffold-sited convention never
    reaches adopters. Combined with the guard gap above, nothing protects it
    either.
  - *A new top-level `docs/` document* — repeats the `council.md:238` /
    `owner.md:96-99` failure in a repo that has never grown a durable `docs/`
    file.

**Is "a written convention" the right frame for the deliverable?** Yes, and I
would *not* replace it with a structured artifact. `council/validate.py` reads
frontmatter and board columns only, and it ships to consumer repos via the
scaffold; adding a required card-body section would retroactively fail every
existing card here (`council/cards/*.md`, ~100+ files) unless newly gated, for an
artifact — a base worktree's mutation history — that does not survive on disk.
The durable home already exists: the per-card run record, the same file
`validate.py` already requires. A JSON sidecar would be unread by anyone: seats
see prompts, not sidecars.

### 2. Who it binds, and whether it is normative

**Normative**, in two grades:

- **Normative on `owner`** (produces the record at step 8) **and `skeptic`**
  (reproduces it at step 9). A missing field is a breach, and the existing step-9
  objection row (`skeptic.md:151-160`: "each one with the claim it targets, the
  settling test") is where the breach gets caught — reproduction is already the
  Loop's mechanism.
- **Advisory to the judge unless the skeptic's evidence shape carries it.**
  `council.md:268-280` means the judge sees goal + skeptic evidence only
  (`judge.md:31,55-57`). Binding the judge requires putting the fields in the
  *skeptic's* output row, not adding an instruction to `judge.md`.

**Enforcement cost.** One `prose.test.ts` pin is cheap and this repo already
carries six of them. A validator-level check is a new consumer-facing schema
with no evidence of need. Important limitation to state plainly: a prose pin
proves the convention is *written*; it never proves a seat *followed* it. Only
step 9's reproduction does that, which is why the mirror into `skeptic.md` is
load-bearing rather than tidy.

**Copy boundary:** this design adds no user-visible string — internal
documentation and packaged seat/procedure prose only. No `ESCALATION` is
triggered on it.

### 3. What a record must contain

Fields, each earned from EV-41's own record:

1. `baseCommit` — full 40-hex SHA + `baseRole` ∈ {required, optional-second} +
   `baseRule` (how it was chosen). EV-41 recorded both SHA and rule
   (`council/cards/EV-41.md:59-70`): "the commit immediately preceding the epic's
   first mechanism merge (EV-37 `6a375c4`)".
2. `falsifierIdentity` — repo-relative path(s) and blob hash of each falsifier
   file at the head SHA. "the same authored falsifier" (`EV-41.md:167`) is prose
   a second party must decompose by hand.
3. `transplantManifest` — **the decisive missing field.** The exact set of files
   materialized into the base worktree that do not exist at `baseCommit`, each
   with a blob hash, plus the exact command that put them there, plus "everything
   else in the worktree is base-native."
4. `command` + `exitCode` — the command verbatim as run (packaged phrasing: "the
   repo's test command, quoted exactly as run").
5. `observedCounts` **with shape** — `pass/fail/error/skip` and the runner's own
   summary line verbatim. EV-41 has `0 pass / 2 fail / 2 errors` and `7 fail / 1
   error`.
6. `redAttribution` — per failing test: test id, first failing assertion or
   error, and a class ∈ {`mechanism-absent`, `harness-absent`, `incidental`}.
7. `headGreen` — head SHA + same command + `0 fail`. The steward ruling
   (`EV-41.md:59-70`) makes the *pair* the obligation.
8. `worktreeRecipe` — the commands that rebuild the base worktree. The worktree
   does not survive; without this, reproduction is re-derivation.

Not required: a runner name/version literal beyond "the runner's self-reported
version", log attachments beyond the summary line plus per-failure assertions,
or any numeric threshold.

### 4. The cross-card comparison rule

I would write:

- **Same falsifier, same base commit:** compare `(baseCommit, transplantManifest
  digest, command, falsifierIdentity)` for equality **first**; only then compare
  counts. If the tuples are equal and counts differ, that is a *finding*, not a
  discrepancy.
- **Tuples differ:** do not compare counts. Attribute the delta to the named
  field, and require the `redAttribution` sets restricted to `mechanism-absent`
  to be equal. If they are equal, the difference is explained and is not a
  defect. If they differ, the record is defective.
- **Base trees differing in population (the EV-41 case):** the population
  difference lives *exactly* in `transplantManifest` — `council/cards/EV-41.md:283-287`
  already says the delta "tracks how much of `test/ev40-harness/` was copied into
  the base worktree (that directory does not exist at `3e39e66`)". Recorded, the
  two records are comparable at the `mechanism-absent` level; unrecorded, they
  are incomparable and the record fails. Machine form: subtract the transplant
  sets; every count delta must be attributable to entries in the difference.
- **Across cards:** never aggregate raw red counts — the population is the base
  tree *plus* the transplant set, so a cross-card red total is not a statistic.
  Compare only: a required-base record exists with all fields; it carries ≥1
  `mechanism-absent` red; its `headGreen` is `0 fail`.

**Genuinely open:** whether the mirror into `skeptic.md` should be required text
or merely a field vocabulary in `<output_format>`; and whether `redAttribution`
classification is an owner obligation, a skeptic obligation, or both (I lean
owner-produces/skeptic-audits). **Settled by my reading:** the site (packaged
prose is the only channel), the deliverable type (prose, not validator schema),
and the anti-scaffold and anti-wiki arguments.

## Blind spots / reframe

**Per vantage, separately:**

- *Owner (inside the worktree):* the transplant is invisible **because the owner
  performed it** — copying the harness in feels like setup, not evidence-relevant
  state. The owner also cannot see that its numbers will be compared at all;
  nothing in step 8 (`council.md:230-256`) tells it the record is a cross-card
  invariant.
- *Card-record/facilitator vantage:* it transcribes both counts into the card
  (`EV-41.md:255,283-287`) and has nowhere to put the transplant, so it lands as
  prose narrative ("copy depth") that the next card cannot key on. This vantage
  sees the discrepancy only once it is unresolvable.
- *Judge:* cannot enforce shipped prose at all — it is handed goal + skeptic
  evidence and nothing else.
- *My own blind spot:* there is no consumer repo in this checkout, so my claim
  that packaged prose reaches consumers rests on
  `vault/wiki/non-clobbering-scaffold.md:19-30` and `extensions/scaffold.ts:50-51`,
  not on an observed consumer.

**Reframe (earned, and only about emphasis):** the card asks what a record must
contain so the numbers are comparable. EV-41's numbers were already recorded
completely — SHA, counts, even the explanation. What was missing was not a
*recording* field but a **predicate deciding which failures are red-at-base**.
Both numbers were true; one counted harness-absence reds as though they were the
falsifier's reds. So the convention's center of mass belongs on `redAttribution`
and `transplantManifest`, with the comparison keyed on attribution — not on a
longer list of descriptive metadata. A convention that fixes only field names
and leaves "which failures count" to prose would have made EV-41's two records
*both conforming* and still incomparable. I would not reframe the deliverable
**type**: prose is right.

## Tradeoffs accepted

- **Prose is the weakest enforcement** (a seat can read and ignore). Accepted:
  the alternative is a consumer-facing schema that retroactively fails ~100
  existing cards and cannot see the evidence artifacts anyway.
- **A `prose.test.ts` pin is a maintenance tax** — rewording the block reds the
  suite. Accepted; it is the repo's established pattern (`:231-266`, `:267-...`).
- **Stack-neutral phrasing loses runner specificity.** Accepted — forced by
  `:58-64`, and correct at this seam: the package cannot know the consumer's
  runner.
- **`redAttribution` raises owner step-8 cost** (classify each red rather than
  count). This is the price of comparability; without it the convention buys
  nothing.

## Testable claims

1. **Stack guard.** Name `bun test` in the drafted `council.md` block →
   `bun test test/prose.test.ts` reds on "council prose does not pin a specific
   tech stack" (`:58-64`). Reword to "the repo's test command" → green.
2. **Guard gap is real.** Add `docs/gates/GATE-EVIDENCE.md` to the new block in
   `council.md` → `bun test test/prose.test.ts` **stays green**, proving the
   per-file scope at `:28-34`. The convention's remedy is to not name a path that
   does not exist (`find docs -type d` → `docs/superpowers` only), not to widen
   the guard on this card.
3. **Scaffold unreachability.** In a fresh `fs.mkdtempSync` dir (AGENTS.md test
   convention), run `scaffoldInto` twice with a first-run edit → second run
   reports the file in `skipped` and the edit survives
   (`extensions/scaffold.ts:50-51,69`). A scaffold-sited convention cannot reach
   an initialized repo.
4. **Validator non-involvement.** `python3 council/validate.py` on a card
   carrying a new `## Red base` section and nothing else → `All council
   artifacts valid` (frontmatter + board only). Proves the prose design needs no
   validator work, and that a validator-policed design is new surface.
5. **The decisive EV-41 equivalence claim — runnable.** At base `3e39e66`, (a)
   transplant only the files in `falsifierIdentity` and run the repo's test
   command; (b) transplant `falsifierIdentity` + all of `test/ev40-harness/` and
   run the same command. Claim: the `mechanism-absent` red sets are **identical**
   while the counts differ, and the delta lies wholly in
   `harness-absent`/`incidental`. If true, the comparison key is
   `redAttribution` and the reframe holds; if false, `mechanism-absent` is
   empty/false, counts do carry mechanism information, and my reframe is wrong
   and I will concede it in round 2.
6. **Judge reachability, pinned as prose.** Assert (whitespace-flattened,
   `prose.test.ts`-style) that the base-red field vocabulary appears inside
   `skeptic.md`'s `<output_format>` block (`skeptic.md:151-160`), not only in
   `council.md`. A pin that only touches `council.md` passes while the judge's
   actual input (`council.md:268-280`) still cannot carry the record.

### Step 3 — bounded exchange (round 2) — **closed at 2 rounds, positions stabilised**

Each generator was re-dispatched with the other's round-1 position (verbatim in
this card, §Step 2) and asked to engage it point by point. `owner` (`job-17.3`,
12.6m, 19 turns, `stopReason=stop`, tokens in 134076 / out 19147 / cR 774656 /
cW 0 / reason 15944 / total 927879, cost≈$0.0318 catalogue) and `principal`
(`job-17.4`, 12.6m, 14 turns, `stopReason=stop`, tokens in 368172 / out 25728 /
cR 513152 / cW 0 / reason 20823 / total 907052, cost≈$0.0722 catalogue) both
settled. Positions appended verbatim.

**Facilitator's round read (counting only, deciding nothing):** the exchange
produced a signed convergence — `principal` withdrew the two-site design and the
required `redAttribution` field and signed `owner`'s design with refinements;
`owner` conceded the reader-derived mechanism-absent predicate and the
skeptic-evidence-row placement. No round 3 is warranted: the two round-2
positions agree on the site, the field list, the comparison key, and the pin
class, and the residual differences (field-7 shape, pin granularity, whether the
boundary bit is a written field or a skeptic derivation) are refinements inside
one design, not competing designs. **Per council.md step 3 the exchange was
stopped early at 2 of ≤3 rounds because positions stabilised.**

#### owner — round 2 (`job-17.3`) — verbatim

## Round 2 — owner

### Concessions

1. **Site (partial concession, conclusion rejected).** My round-1 "a procedure is
   a third copy with no added reach" was imprecise, and `principal`'s rebuttal
   exposed the imprecision: there *is* one facilitator action that touches the
   convention — writing the spec at `council.md:201-229` — so a block in step 7
   has a real, if narrow, function (carrying the convention into future
   full-council specs). What I concede. What I do not concede: `principal`'s
   step-9 half. `council.md:257-259` gives the facilitator exactly two step-9
   acts — "Dispatch `skeptic` at the branch" and appending the evidence verbatim;
   `council.md:8` says "The facilitator decides nothing." The check is performed
   by the `skeptic`, and `seats.ts:592-597` (`buildSystemPrompt`) proves the
   skeptic's only in-context text is its own body plus the procedures *directory
   path* — a step-9 block in `council.md` has one actual reader (the facilitator)
   who performs no check. And `principal`'s step-7 half is a paraphrase channel —
   the exact drift mode `principal` itself named against a `council.md`-only
   design. I also concede `principal`'s claim 6 pin placement: the field
   vocabulary must surface in the skeptic's *evidence output*, i.e. inside/near
   `skeptic.md:151-160`'s `<output_format>`, not only in a `verify_by_acting`
   paragraph — my round-1 block wording didn't say this explicitly; it is wording
   of the shared block, not a site change.

2. **Comparison key (partial concession).** `principal`'s equality-first tuple
   `(baseCommit, transplantManifest digest, command, falsifierIdentity)` **is** my
   triple — they adopted it as their own precondition, so the "competing design"
   framing is already collapsed. The genuinely new element is `redAttribution`
   as the cross-triple residual. I concede the *predicate*: the cross-triple
   claim that survives should be upgraded from my binary "red observed at base"
   to "the mechanism-absent red set is the same." I do not concede the *field*:
   per-failure classification into `{mechanism-absent, harness-absent,
   incidental}` is an asserted interpretation, and my experiment below shows
   nobody could have classified EV-41's `7 fail / 1 error` record correctly,
   because its transplant set is unknowable from the record.

3. **Per-failure attribution (no concession on the required class field;
   concession on placement).** `principal`'s core argument — "fields alone would
   have made EV-41's two records *both conforming* and still incomparable" — is
   factually false against my actual field list: the owner's `7 fail / 1 error`
   record lacked my fields 2 and 6 (transplant identity, copy set), so it is
   **non-conforming** under my convention; the incomparability is *detected* by
   the field mismatch, not papered over. What I concede: the separation of
   `mechanism-absent` from `harness-absent` must be explicitly assigned, and I
   assign it to the **reader** (the `skeptic` at step 9), not the writer — it is
   derivable from already-required fields (raw per-failure lines + transplant
   manifest + base identity), and the skeptic's derivation duty gets a sentence
   in the shared block.

4. **Judge reachability (correctly out of scope, one refinement conceded).**
   `principal`'s channel reading is right (`council.md:268-280`;
   `judge.md:31,55-57` — goal + skeptic evidence, nothing else) but it is not a
   defect: the judge's own contract (`judge.md` `<when_invoked>` §2, "Confirm
   rather than trust... re-run the decisive test yourself") makes judge-side
   schema enforcement redundant, and binding the judge would require widening the
   judge's input — the exact contamination firewall the step-10 text
   (`council.md:268-271`) calls deliberate. The refinement I accept is from
   concession 1: the skeptic's evidence rows must carry the triple and the
   comparison outcome so the judge *sees* the record — a pin inside `skeptic.md`'s
   `<output_format>`, which is compatible with my one-site design.

### What I still defend

- **Seat prose is the single normative site.** `seats.ts:592-597` is decisive: a
  seat's context is `seat.body` + `<council_runtime>` (directory path only) +
  `<repository_grounding>`. No bound actor ever reads `council.md`. If
  `council.md` were "the normative home" and seat prose a "binding mirror,"
  drift between them resolves — by the design's own priority — toward text no
  bound actor can read at evidence time. The normative site must be the one in
  the actors' context. The step-7 site also reaches **zero mechanical cards**
  (`council.md:217-221`: "Do not create a file under `docs/superpowers/specs/`
  for a mechanical card") — and EV-41, the card that generated this residual,
  *was* mechanical; every future mechanical falsifier card gets the convention
  from `owner.md` only. Counter-reasoning that defeats the two-site design: it
  buys a paraphrase-dependent, full-path-only spec channel at the cost of a
  third copy and a normativity inversion, when the direct channel (`owner.md`)
  already covers both paths with zero paraphrase.
- **My field list, with two wording amendments** (skeptic-derivation duty per
  concession 3; evidence-row placement per concession 4). Fields: base identity
  + selection rule; transplant identity (file list + source sha); exact command
  verbatim; raw red output verbatim — counts *and* per-failure lines; worktree
  provenance; explicit copy set; landing statement. The record that would have
  made EV-41 reproducible rather than merely explained.
- **The three-class taxonomy is the wrong mechanism.** `incidental` has no
  operational definition and no settling test; a required classification
  converts a derivable fact into an unauditable assertion. The comparison rule:
  equality of `(base, transplant, command)` gates count comparison; across
  differing triples, counts never compare — the surviving claim is
  red-observed-at-base plus *reader-derived* mechanism-absent set equality,
  checked by the `skeptic` from the raw lines against the manifest.

### Runnable checks (run this round, real output)

I ran `principal`'s settling experiment (claim 5) at `3e39e66` in
`/tmp/fllwup47-exp` (detached worktree, `bun install`, removed after; main
checkout untouched):

- **Bare copy** (`test/ev41-retry-e2e.test.ts` only), scoped command: `0 pass / 1
  fail / 1 error` — `Cannot find module '../extensions/job-retry.ts'`.
  Reproduces the Skeptic's `1 fail / 1 error` exactly.
- **Deep copy** (+ head `stub-child.ts`, `test/ev41-tui.py`, all of
  `test/ev40-harness/`), same scoped command: **still `1 fail / 1 error`**, same
  module-not-found.
- **Deep copy, full `bun test`:** `733 pass / 2 skip / 1 fail / 1 error`.
- **Deepest copy** (+ `test/ev40-headless.test.ts`, `test/ev40-live-gates.test.ts`),
  full suite: `733 pass / 2 skip / 3 fail / 3 errors` — all three errors are
  `Cannot find module` on `job-retry.ts`/`parent-retry.ts`.

Two results, both stronger than either round-1 claim: **(a)** `7 fail / 1 error`
was not reproducible from *any* transplant/command combination I could
reconstruct — the owner's record is unreproducible, not merely incomparable,
because its transplant set and command were never recorded. This is the decisive
case for the shared fields (transplant manifest + exact command), and it shows
the classification field would have been worthless here: no one could classify
the `7 fail` record correctly. **(b)** At every depth, the mechanism-absent
signature was visible in the *raw failure lines themselves* — the
module-not-found error stayed constant across depths while the fail count grew
with the copy set. Reader-side derivation from field 4 + field 2 identified it
with no taxonomy required. Per `principal`'s own claim-5 concession terms: the
"identical mechanism-absent set" half held on the errors, but the "delta lies
wholly in harness-absent" half is **unverifiable against the actual record** —
the experiment cannot be fully specified without the fields this convention
mandates. That is the convention's thesis demonstrated.

Remaining settling test, named for the consolidator: the drafted block must
survive `bun test test/prose.test.ts` (stack-neutrality,
`test/prose.test.ts:62-67`) and the new byte-identity pin (fixture pattern,
`test/prose.test.ts:68-93`) must be red until both seat files carry the
identical block.

### What remains genuinely open

- Whether a facilitator-facing sentence in `council.md` step 7 is worth its third
  copy despite being redundant with `owner.md` on both paths — my lean is no; it
  is defensible, and this is a judgment call, not a testable dispute.
- Whether the step-14 wiki-ingest offer is mandated by this card or left as the
  standing offer (unchanged from round 1: leave as offer).
- The exact wording of the reader-derived mechanism-absent rule in the shared
  block (the *rule* is settled by the experiment; the phrasing is craft).

### Bottom line

One canonical convention block, normative, byte-identical in
`council/agents/owner.md` and `council/agents/skeptic.md` (pinned by a
`prose.test.ts` fixture, with the vocabulary surfaced in the skeptic's
`<output_format>` rows), requiring base identity+rule, transplant identity,
exact command, verbatim raw red output with per-failure lines, worktree
provenance, copy set, and the landing statement; comparison keyed on equality of
`(base, transplant, command)` gating count comparison, and across differing
triples only red-observed-at-base plus reader-derived mechanism-absent set
equality — no `validate.py` parser, no `redAttribution` class field, no
normative `council.md` site.

#### principal — round 2 (`job-17.4`) — verbatim

## Round 2 — `principal`

### Concessions (named up front, per disagreement)

**1. Site — I concede the normative site to `owner`, and withdraw my two-site
design.** I re-read both sides of the channel this round.
`extensions/seats.ts:592-597` builds a seat prompt as `seat.body` +
`<council_runtime>procedures directory: <path>` + grounding — the procedure
*directory*, never procedure text. The only proof I have that a procedure's
*body* reaches any model at all is `test/ev40-harness/harness-headless.ts:144-150`,
where a written procedure is what carries the probe turn into the **parent's**
user message — i.e. `council.md` enters the facilitator's turn, not a seat's. So
on the question "which site is normative when the two disagree": there will be
exactly one site, `owner.md` + `skeptic.md`, and no disagreement is possible.
Nothing normative in `council.md` needs to change, and I will not claim it does.
Asked plainly, the facilitator's step-7/step-9 role in this convention is
**transcription**: step 7 writes the spec the owner reads (`council.md:201-229`),
step 9 dispatches the skeptic at the branch (`council.md:257-267`) and the
facilitator appends the resulting record verbatim (`council.md:132`, `:170`).
The facilitator decides nothing, so a procedure copy of the field list would give
it nothing to do differently — `owner`'s "third copy with no added reach" is
right, and my round-1 claim that the obligation is "created and checked per
card" in the procedure was a claim about *where it is felt*, not about where
text must live. Withdrawn.

**2. Comparison key — I concede `redAttribution` as a required field.** Not
merely on redundancy; it is **inoperative at a pre-mechanism base**, which is the
only case the card exists for. At a base that predates the mechanism, the
falsifier file usually cannot load: `test/ev41-retry-e2e.test.ts:44-67` imports
`../extensions/job-retry.ts` (EV-39, merged after `3e39e66`) and
`../extensions/parent-retry.ts` and `./ev40-harness/harness-headless.ts` (both
EV-40, merged after `3e39e66`). A missing import fails the *file*; no test runs;
there are no per-test failures to assign `{mechanism-absent, harness-absent,
incidental}` to. The repo's own recorded bun shapes confirm the unit is the file,
not the test: `0 pass / 2 fail / 2 errors` at `3a3773f` for two unresolvable
imports (`council/cards/EV-41.md:216-219`) versus `1 fail / 1 error` on the
skeptic's bare copy at `3e39e66` (`EV-41.md:283-284`). "Zero pass" *is* the load
failure. So my predicate had no observable to read at base, and `owner`'s field 4
(raw red output verbatim) carries the information my classification could only
have paraphrased. I also accept `owner`'s point that counts are **not comparable
across differing triples** — under that rule my predicate was licensing a
comparison `owner`'s rule refuses, which is exactly the discipline the EV-41 pair
needs. My field set *was* a superset of the triple (`baseCommit`,
`falsifierIdentity`+`transplantManifest`, `command`) plus a predicate; the
predicate is what I drop.

**3. Claim 5 — I could not run it, and I say why precisely rather than hedging.**
My seat's frontmatter grants me `tools: Read, Grep, Glob`
(`council/agents/principal.md:5`). I have no Bash this round (confirmed: the only
tools in this session are read/grep/find/ls and network). Round 1's claim 5 named
a check I am structurally unable to execute; that is a defect in how I framed it,
and it is itself design-relevant: a convention whose settling test is owned by a
seat without Bash will never be run on the cards that need it. I substitute the
strongest static bound below.

**4. Judge reachability — held, narrowed, and now it is a hard constraint.** I
keep the claim but restate it where it actually bites: the vocabulary must sit
inside `skeptic.md`'s `<output_format>` (`skeptic.md:151-163`), because
`council.md:268-280` and `judge.md:31,55-57` make the judge's substantive input
the skeptic's evidence row and nothing else. It is **hard, not nice-to-have** —
and it is a constraint *on `owner`'s design*, which I take up in §5. It is not a
request to widen the judge's input (`council.md:274-276` forbids that) and adds
nothing to `judge.md`.

**5. Enforcement — I accept the byte-identity pin, but it cannot be the only one,
and as stated it conflicts with my §4.** A byte-identity pin across `owner.md`
and `skeptic.md` survives a single-site design *only if* the two seats' text is
genuinely identical. It is not: `owner` *records* the base run, `skeptic`
*reproduces and compares* it. Forcing both duties into one byte-identical block
means each seat's prompt tells it to do the other seat's job. And if the
vocabulary must also land in `skeptic.md`'s `<output_format>`, a whole-file
byte-identity pin is unsatisfiable — `owner.md` has no objection row to mirror.
Conceded: byte-identity on the *shared* part; refined: not on the whole block.

---

### What I still defend

**(a) One bit of attribution survives, read off the output — not a taxonomy.**
`owner`'s cross-card residual is the bare binary "red observed at base". That
binary admits a record whose only reds exist because the *transplant* referenced a
path the base lacks — e.g. an unloadable `test/ev40-harness/*.ts` — which
demonstrates nothing about the mechanism under test. The cure is one bit per red,
derived verbatim from the output, no closed vocabulary: red whose error text
names an artifact **inside the copy set** ⇒ copy-set-dependent; red whose error
text names an artifact of the **mechanism under test, absent at base** (e.g.
`Cannot find module '../extensions/job-retry.ts'`) ⇒ the base-native red sought.
`owner`'s fields 4 and 6 supply the raw material; the bit is what makes them a
predicate instead of two lists. This is observable, and it is the **skeptic's**
obligation at step 9, because only the skeptic holds both trees
(`council.md:257-267`; `skeptic.md:108-118`).

**(b) `owner`'s field 1 needs the base *role*, and field 7 is the wrong shape.**
EPIC-9's standing ruling distinguishes the *required* base from an *optional-second*
extra (`EV-41.md:63-70`); a record that does not say which it is cannot be
compared across cards, because the required-base record is the one that must
exist. And "no red test landed" (`owner`'s field 7) is an assertion, while its
referent is observable: head sha + same command verbatim + `0 fail`
(`owner.md:87-93`). Field 3 should be understood as the command for *both* halves.
Replace field 7 with the head half; keep field 3 relational.

**(c) Fields I would drop as redundant.** My `falsifierIdentity` blob hashes and
`transplantManifest` blob hashes: base sha + source sha + path list already pins
content. My `worktreeRecipe`: the recipe is a function of the base sha and the
transplant path list. `owner`'s field 5 (worktree provenance): already normative
in `owner.md`/`skeptic.md` `<main_repo_immutability>` (`skeptic.md:120-130`) and
re-stated by the loop — a record field, not evidence. `owner`'s field 7 as
written: replaced per (b). Nothing else of `owner`'s seven goes.

**(d) EV-41's stated cause does not explain its own numbers — check this before
writing the convention around it.** `test/ev40-harness/` at head contains three
files and **no test file**: `ev40-harness-extension.ts`, `harness-headless.ts`,
`tui-retry.py` (`ls test/ev40-harness`). Copying a directory of modules cannot
turn one file-level load error into six additional failing tests. And `3e39e66`'s
suite was green at its own merged SHA — `gates` `conclusion: success`
(`council/cards/EV-38.md:344-348`) — so every red in the owner's `7 fail / 1 error`
was *caused by the transplant*. Therefore the transplanted set contained more
than `test/ev40-harness/` and more than the falsifier file (most plausibly head's
`test/stub-child.test.ts`, whose `finish_error` pins cannot pass against base's
`stub-child.ts`). The card's explanation — "tracks how much of `test/ev40-harness/`
was copied" (`EV-41.md:284-286`) — is a **facilitator-authored causal claim that
the artifact does not support**, written into the run record by the one role that
decides nothing. That is not a separate card; it is the strongest single argument
for `owner`'s triple, sharpened: with base sha + exact command + per-file copy set
recorded, the 7-vs-1 pair is either explained in one line or exposed as an
unreproduced number. The triple is doing the work; my predicate was not.

---

### Runnable checks

**Actually run this round: none — I have no Bash grant** (`principal.md:5`:
`Read, Grep, Glob`). The evidence I gathered this round is first-hand *reads*,
which I name as such: `extensions/seats.ts:592-597`;
`council/procedures/council.md:132,201-229,257-280`;
`council/agents/skeptic.md:120-130,151-163`; `council/agents/judge.md:31,55-57`;
`council/agents/owner.md:5,87-99`; `test/prose.test.ts:58-66,68-93`;
`test/ev41-retry-e2e.test.ts:44-67`; `ls test/ev40-harness`;
`council/cards/EV-41.md:63-70,216-219,281-288`; `council/cards/EV-38.md:344-348`.
No worktree was created, so none is left behind; main checkout untouched.

**The settling test for disagreement #3, with its prediction** — for `owner` or
the `skeptic` to run, in a throwaway clone (never the main checkout):

```
git clone --no-hardlinks <repo> /tmp/ev41-base && cd /tmp/ev41-base
git checkout 3e39e66
git checkout <ev41-branch-sha> -- test/ev41-retry-e2e.test.ts test/ev41-tui.py
timeout 900 bun install --frozen-lockfile
timeout 900 bun test test/ev41-retry-e2e.test.ts        # (a) bare
git checkout <ev41-branch-sha> -- test/ev40-harness/
timeout 900 bun test test/ev41-retry-e2e.test.ts        # (b) harness copied
```

Prediction (unverified, stated so it can be refuted): both runs produce the
**same single file-level red** — `Cannot find module '../extensions/job-retry.ts'`
(0 pass, exit 1) — because `job-retry.ts` (EV-39) and `parent-retry.ts` /
`ev40-harness` (EV-40) are all post-`3e39e66`, so copying the harness cannot
resolve the falsifier's load; (b)'s count may rise only by reds from files *inside*
the copy set. Classification is by the module path in the error text, per §(a):
paths in the copy set ⇒ copy-set-dependent; `job-retry.ts` / `parent-retry.ts` ⇒
the base-native red sought. If instead (a) and (b) differ in the base-native reds,
claim 5 is refuted and I concede the reframe outright — but note the prediction is
falsifiable *and* already consistent with the two recorded numbers
(`EV-41.md:216-219,283-284`), which is why I hold it.

**The two pins (settling tests for #5), both red-first:**

1. *Drift pin.* Fetch both seat bodies (`PKG_ROOT/council/agents/{owner,skeptic}.md`,
   the `councilMarkdown()` helper at `test/prose.test.ts:6-16`), slice between two
   literal markers (the `STEP3_FIXTURE` style, `prose.test.ts:88-92`),
   `expect(ownerBlock).toEqual(skepticBlock)`. Red until the shared block lands
   identically; red the moment one side is edited alone. It proves *non-drift only*.
2. *Judge pin.* Whitespace-flatten `skeptic.md` (`prose.test.ts:337-342` style),
   require the field vocabulary to appear between `<output_format>`
   (`skeptic.md:151`) and `</output_format>` (`:163`) — not merely somewhere in
   the file. Red while the vocabulary lives only in the shared block. This is the
   pin my §4 obligation requires and which a whole-file byte-identity pin cannot
   express.

Neither pin proves a seat *followed* the convention on any card — only step 9's
reproduction does that. Both are inside the existing stack guard's scan
(`prose.test.ts:58-66`), so the block must stay runner-neutral.

---

### What remains genuinely open

- Whether the boundary bit (§a) belongs in the owner's record, the skeptic's
  evidence row, or both. My reading: owner produces it, skeptic audits it — but
  that is a division of labour, not a test.
- Whether the base *role* label is required or idiomatic. It is one word; I would
  require it; no test settles whether a reader needs it.
- Whether the convention should be offered to `vault/` at step 14
  (`council.md:329-334`). The `goal` is satisfied by seat prose alone; the wiki
  page is grounding, not normativity, and cannot be authored directly. Leave as
  the standing offer.
- Where the shared block sits in each seat file (which section boundary the
  markers bracket) — taste, and it will decide whether the block is read at the
  moment the seat writes its evidence. I would bracket it with the
  recording/reproduction duty, not park it at file end.

### One-sentence bottom line

I sign `owner`'s design — seat-prose only, no procedure copy, no validator — with
the comparison triple `(base sha, transplant identity, exact command)` plus raw
red output verbatim as the comparison key, three refinements (base role on field
1; the head half replacing the landing statement; one output-derived boundary bit
on each red), `redAttribution` and the blob hashes dropped, and two
`prose.test.ts` pins — byte-identity on a marked shared block in
`owner.md`/`skeptic.md`, plus a judge-reachability pin placing the field
vocabulary inside `skeptic.md`'s `<output_format>`.

**Convergence recorded (facilitator, facts only):** the two round-2 positions
agree on one normative site (`council/agents/owner.md` + `council/agents/skeptic.md`,
seat prose only), on the comparison triple gating count comparison, on raw red
output verbatim as the evidence, and on `prose.test.ts` as the enforcement class.
They differ only inside that design: whether the mechanism-absent boundary is a
owner-written bit audited by the skeptic (`principal`) or a skeptic derivation
from the raw lines (`owner`), whether `owner`'s field 7 (landing statement) is
kept alongside the head-half (`principal` would replace it), and the pin
granularity. `owner` also ran `principal`'s settling experiment first-hand; its
result (`7 fail / 1 error` reproducible at no transplant/command depth tried) is a
**fact of this deliberation**, and the two seats' shared reading of it — the
unrecorded transplant set is the defect — is recorded as their position, not as a
facilitator conclusion.
### Step 4 — Skeptic attacks and runs tests

`owner` and `principal` positions through round 2 were handed to `skeptic`
(`job-17.1`, 5.7m, 20 turns, `stopReason=stop`, tokens in 294165 / out 14606 /
cR 1273300 / cW 0 / reason 8586 / total 1582071, cost≈$0.6208 catalogue). It
filed eight falsifiable objections, ran its own settling tests in a detached
worktree at `/tmp/fllwup47-skeptic` (removed after; main checkout verified
clean at `daa8e43` before and after), and reported actual output. Its verdict
was **no open objections against the converged design**; its two `closed-red`
results strike the seats' supporting experimental/causal claims, not the
design. Objections appended verbatim.

#### skeptic — step 4 (`job-17.1`) — verbatim

## Objections

### O1 — Owner round-2: "`7 fail / 1 error` was not reproducible from any transplant/command combination" → **closed-red**

- **Claim targeted:** owner round-2 result (a): the recorded `7 fail / 1 error` is "unreproducible, not merely incomparable, because its transplant set and command were never recorded."
- **Settling test (run):** detached worktree at `3e39e66` (`git worktree add /tmp/fllwup47-skeptic 3e39e66`), transplant files from EV-41 head `0330274`, `bun install --frozen-lockfile`, full `bun test`. Controls first: bare copy (falsifier file only) → `0 pass / 1 fail / 1 error`; deep copy (+ head `stub-child.ts`, `ev41-tui.py`, all of `test/ev40-harness/`) → `733 pass / 2 skip / 1 fail / 1 error`; deepest (+ `ev40-headless`, `ev40-live-gates`) → `733 pass / 2 skip / 3 fail / 3 errors`. All three reproduce owner's round-2 numbers exactly.
- **Actual output observed:** with transplant set `{extensions/retry.ts, test/stub-child.test.ts, test/ev41-retry-e2e.test.ts}` (all from `0330274`) over base `3e39e66` keeping base `test/stub-child.ts`:
  ```
  733 pass
  2 skip
  7 fail
  1 error
  ```
  Composition (`bun test | grep -E "^\(fail\)|^error:"`): 6 unique assertion fails, all in transplanted head `test/stub-child.test.ts` run against base `test/stub-child.ts` (which has no `flaky`/`finish_error` modes); plus `error: Cannot find module '../extensions/job-retry.ts' from '.../test/ev41-retry-e2e.test.ts'` (1 fail + 1 error — bun counts each unloadable file as one of each). 6 + 1 = 7 fail, 1 error. Exact match.
- **Term: closed-red.** The number IS reproducible. Owner's search was incomplete: it never tried transplanting an engine file. Note the arithmetic the record missed: head `test/stub-child.test.ts` contains exactly 6 `test(` blocks (`grep -c` → 6) — the "six extra fails" is the whole file running, not six mysteries.

### O2 — The card's stated cause: the 7-vs-1 "tracks how much of `test/ev40-harness/` was copied" → **closed-red**

- **Claim targeted:** EV-41 step 9's causal sentence, carried into FLLWUP-47's grounded facts: copy depth of `test/ev40-harness/` explains the discrepancy.
- **Settling test (run):** from the O1 state, `rm -rf test/ev40-harness test/ev41-tui.py`, re-run full `bun test`.
- **Actual output observed:** identical `733 pass / 2 skip / 7 fail / 1 error`. The harness files are inert in this configuration — nothing in the suite imports them once the ev40 test files are absent.
- **Term: closed-red.** Copy depth of `test/ev40-harness/` explains nothing about the 7/1 number; the six fails come from a file the record never mentions (head `test/stub-child.test.ts` vs base stub). Principal's charge stands: this is a facilitator-authored causal claim the artifact does not support.

### O3 — Principal claim (d), split: harness premise confirmed, stub hypothesis confirmed-with-a-missing-leg → **closed-green (amended)**

- **Claim targeted:** "(d): `test/ev40-harness/` holds no test file… the transplanted set contained more than the falsifier file (most plausibly head's `test/stub-child.test.ts`)."
- **Settling tests (run):** `ls test/ev40-harness/` → `ev40-harness-extension.ts, harness-headless.ts, tui-retry.py` (no test file); `grep ^import` over all head ev40/ev41/stub test files → every one imports `../extensions/retry.ts`, absent at `3e39e66`; O1 repro above.
- **Actual output observed:** as in O1/O2. Amendment principal did not state: `test/stub-child.test.ts` imports `../extensions/retry.ts` (line 9), so it can only RUN-and-fail if `extensions/retry.ts` was also transplanted — otherwise it ERRORS like every other head test file. Principal's hypothesis needs that leg; with it, it is the confirmed causal chain.
- **Term: closed-green** on both halves, with the `retry.ts` leg added by my run.

### O4 — Owner round-2: "no one could classify the `7 fail` record correctly; reader-side derivation is worthless" → **closed-red**

- **Claim targeted:** owner's refusal of the attribution predicate on grounds the record is underivable.
- **Settling test (run):** the O1 decomposition itself — classify the reproduced 7/1 from raw lines + transplant manifest alone.
- **Actual output observed:** clean split with no taxonomy needed: 6 fails all carry `stub-child.test.ts` test ids asserting stub modes absent at base (copy-set/stub-absent reds); the 1 error names `../extensions/job-retry.ts` (the mechanism under test, absent at base — the base-native red sought). A reader holding fields 2+4+6 derives the boundary exactly.
- **Term: closed-red** on the "worthless/unreproducible" framing. This does NOT reinstate a required 3-class field (`incidental` still has no operational definition — that part of owner's objection stands); it reinstates the reader-derivation duty both seats already converged on, and it is evidence for principal's conceded round-1 position, which I so record rather than bury.

### O5 — Owner testable claim 4 (seven fields retro-predict EV-41 as not-comparable) → **closed-green (narrowed)**

- **Claim targeted:** applying the field list classifies the pair as not-comparable rather than one-run-wrong.
- **Settling test:** paper check against the artifact — the 7/1 record lacks fields 2/6 (transplant identity, copy set) and the exact command, so the triple mismatches by construction.
- **Term: closed-green**, narrowed: the diagnosis is now stronger than "not comparable" — the cause is identified (O1–O3), and the triple would have forced the actual transplant set into the record. The claim holds; its "unreproducible" framing does not.

### O6 — Site claim (`seats.ts` prompt = body + procedures *directory path*; no procedure text reaches seats) → **closed-green**

- **Settling test (run):** read `extensions/seats.ts` `buildSystemPrompt`.
- **Actual output observed:** `return [seat.body, \`<council_runtime>\nprocedures directory: ${procDir}\n</council_runtime>\`, groundingBlock(repoRoot)].join("\n\n")`. First-hand confirmation of principal's channel reading and owner's single-site conclusion.
- **Term: closed-green.**

### O7 — Guard claims (stack-neutrality reds on runner-naming; GATE-EVIDENCE per-file gap; byte-identity pin reds on drift) → **closed-green**

- **Settling tests (run):** (a) the prose.test.ts regex `/\b(bun|bunx|typescript|tsc)\b|bun test|bun run|@ts-expect-error/i` against a runner-naming draft sentence → `true` (reds), against neutral phrasing → `false` (greens). (b) `grep GATE-EVIDENCE`: guard reads `features-deliver.md` alone; `council/procedures/council.md:238` still names the nonexistent `docs/gates/GATE-EVIDENCE.md` — gap real. (c) `STEP3_FIXTURE`-style `toEqual` on drifted block copies → reds, including on trailing-whitespace drift.
- **Term: closed-green** on all three. Principal's caveat stands with them: a whole-file byte-identity pin is unsatisfiable alongside the `<output_format>` vocabulary requirement (skeptic.md:151–163) — the pin must bracket a marked shared block, which is what both seats converged on.

### O8 — EV-38 green-at-base premise; judge input contract → **closed-green**

- **Settling tests (run):** read `council/cards/EV-38.md:340-348` → `{"conclusion":"success","name":"gates","status":"completed"}` on merged SHA `3e39e66`. Read `judge.md` `<when_invoked>` → "You are given the card's `goal` and the Skeptic's evidence."
- **Term: closed-green** on both.

## What I ran

All in `/tmp/fllwup47-skeptic` (detached worktree at `3e39e66`, removed after; main checkout verified clean at `daa8e43` before and after — `git status --short` empty, worktree list no longer contains it):

| Transplant (from `0330274`) onto base `3e39e66` | Command | Result |
|---|---|---|
| `test/ev41-retry-e2e.test.ts` only | `bun test test/ev41-retry-e2e.test.ts` | `0 pass / 1 fail / 1 error` (skeptic's number) |
| \+ head `stub-child.ts`, `ev41-tui.py`, `test/ev40-harness/` | `bun test` (full) | `733 pass / 2 skip / 1 fail / 1 error` |
| \+ `ev40-headless`, `ev40-live-gates` | `bun test` (full) | `733 pass / 2 skip / 3 fail / 3 errors` (all `Cannot find module`) |
| `extensions/retry.ts` + `test/stub-child.test.ts` + `test/ev41-retry-e2e.test.ts`, base stub kept | `bun test` (full) | **`733 pass / 2 skip / 7 fail / 1 error`** — owner's number, exact |
| same minus `test/ev40-harness/`, `ev41-tui.py` | `bun test` (full) | identical `7 fail / 1 error` — harness irrelevant |

Static reads: `extensions/seats.ts` prompt builder; `test/ev41-retry-e2e.test.ts:40-67` imports; `test/stub-child.test.ts` (6 tests, imports `retry.ts`); base stub (no `finish_error`); `test/prose.test.ts` guards; `council.md:238`; `judge.md` input contract; `skeptic.md:144-163`; `EV-38.md:340-348`.

## Verdict

**No open objections against the converged design** — seat-prose-only site, the triple gating count comparison, raw-lines-verbatim evidence, prose-test pins. My two reds (O1, O2) strike the seats' *supporting experimental/causal claims*, not the design; O4's red strengthens the reader-derivation duty the design already contains. The design emerges stronger: the triple is now demonstrated, not merely argued, to be the load-bearing element.

**Corrections the record requires before this card proceeds** (not design defeats, but the convention must be written against the true story, not the harness-copy story):
1. The grounded fact repeating EV-41's "copy depth" explanation is known-wrong — the 6 fails are head `test/stub-child.test.ts` vs the base stub, enabled by an unrecorded `extensions/retry.ts` transplant.
2. Owner's round-2 "unreproducible" finding is refuted — the reconstruction recipe is in the table above.

**Remains open (untestable by construction, correctly left to consolidator/judge):** shared-block wording, pin granularity, field-7 vs head-half shape, boundary-bit placement. No user-visible copy is introduced by this design — no escalation triggered.

**Facilitator's transcription (counting only, deciding nothing):** eight objections
recorded — O1 `closed-red`, O2 `closed-red`, O3 `closed-green` (amended), O4
`closed-red`, O5 `closed-green` (narrowed), O6 `closed-green`, O7
`closed-green`, O8 `closed-green`. **No objection is `open-untested`.** The two
reds (O1, O2) are defects in the *supporting claims* — the seats' experimental
reading and one sentence carried in the card's own grounded-facts list — not in
the converged design, whose two `closed-red` targets the skeptic explicitly
files as "not design defeats". `consolidator` (step 5) sorts these; the card's
`goal` (a written convention for red-at-base evidence) is untouched by them, and
the measured 7-vs-1 discrepancy that motivated the card stands, reproduced
exactly this turn.### Step 5 — synthesis (consolidator)

`consolidator` (`job-17.2`, 1.4m, 3 turns, `stopReason=stop`, tokens in 32747 /
out 6398 / cR 225952 / cW 0 / reason 3752 / total 265097, cost≈$0.1056
catalogue) was handed the full deliberation record (steps 1–4) and returned the
three-bucket sort below. Appended verbatim.

#### consolidator — step 5 (`job-17.2`) — verbatim

## Settled

### Settled by a Skeptic run (O1–O8, this card)

- **O1 — `closed-red`.** The `7 fail / 1 error` number **is reproducible**. Reconstructed at base `3e39e66` with transplant set `{extensions/retry.ts, test/stub-child.test.ts, test/ev41-retry-e2e.test.ts}` (all from EV-41 head `0330274`), base `test/stub-child.ts` kept. Composition: 6 assertion fails in transplanted head `test/stub-child.test.ts` run against the base stub (which lacks `flaky`/`finish_error`), plus 1 file-level `Cannot find module '../extensions/job-retry.ts'` counted as 1 fail + 1 error. This refutes owner's round-2 claim that the number was "unreproducible from any transplant/command combination." **What it settles about the design: nothing as a verdict.** It settles a *fact about EV-41's record* — the number has a known reconstruction recipe — and, together with O4, demonstrates that the unrecorded transplant set is precisely what the convention's triple would have forced into the record.
- **O2 — `closed-red`.** The card's stated cause — "the difference tracks how much of `test/ev40-harness/` was copied into the base worktree" (carried in FLLWUP-47's grounded-facts list, sourced from EV-41 step 9) — is **false**. Removing `test/ev40-harness/` and `ev41-tui.py` from the reconstructed state leaves the count identical (`7 fail / 1 error`); the harness files are inert in that configuration. The six extra fails come from head `test/stub-child.test.ts` vs the base stub, enabled by an unrecorded `extensions/retry.ts` transplant. **What it settles about the design: nothing as a verdict.** It is a documented defect in the *record's causal sentence*, not in the converged design; the skeptic files it as "not a design defeat."
- **O3 — `closed-green` (amended).** Principal's claim (d) confirmed on both halves with one leg added: `test/ev40-harness/` holds no test file (confirmed); the stub hypothesis is the confirmed causal chain **but only with the `extensions/retry.ts` transplant leg** (which `test/stub-child.test.ts:9` imports and which principal did not name). Settles the causal chain as a fact.
- **O4 — `closed-red`.** Owner's "no one could classify the `7 fail` record correctly; reader-side derivation is worthless" is **refuted**. The reproduced 7/1 decomposes cleanly from raw lines + transplant manifest alone: 6 fails carry `stub-child.test.ts` test ids (copy-set/stub-absent reds); the 1 error names `../extensions/job-retry.ts` (the mechanism under test, absent at base — the base-native red). A reader holding fields 2+4+6 derives the boundary. **What it settles about the design:** it reinstates the reader-derivation duty both seats already converged on, as feasible. It does **not** reinstate a required three-class field — "incidental has no operational definition" (owner's objection) **stands**, and O4 explicitly does not overturn it.
- **O5 — `closed-green` (narrowed).** Owner's "seven fields retro-predict EV-41 as not-comparable" holds, narrowed: the diagnosis is stronger than "not comparable" — the cause is now identified (O1–O3), and the triple would have forced the actual transplant set into the record.
- **O6 — `closed-green`.** `extensions/seats.ts:592-597` `buildSystemPrompt` confirmed first-hand: a seat's prompt is `seat.body` + `<council_runtime>` (procedures **directory path only**) + grounding. **No procedure text reaches a seat.** This is the channel fact underpinning the site decision.
- **O7 — `closed-green`.** All three guard claims confirmed: (a) the stack-pin regex `/\b(bun|bunx|typescript|tsc)\b|bun test|bun run|@ts-expect-error/i` reds on runner-naming drafts, greens on neutral phrasing; (b) the GATE-EVIDENCE guard is per-file (`features-deliver.md` only) while `council.md:238` still names the nonexistent `docs/gates/GATE-EVIDENCE.md` — gap real; (c) a `STEP3_FIXTURE`-style `toEqual` reds on drifted block copies, including trailing-whitespace drift. Plus principal's caveat confirmed: a **whole-file** byte-identity pin is unsatisfiable alongside the `<output_format>` vocabulary requirement — the pin must bracket a **marked shared block**.
- **O8 — `closed-green`.** EV-38's `3e39e66` was green at its merged SHA (`gates` `conclusion: success`); the judge input contract is goal + skeptic evidence only (`judge.md` `<when_invoked>`).

### Settled by convergence only (shared position; **no test** — rests on agreement, not evidence)

- **One normative site: `council/agents/owner.md` + `council/agents/skeptic.md`, seat prose only.** Principal withdrew its two-site design in round 2; owner held. Rests on the O6 channel fact plus the judgment that the bound actor's context is the normative site.
- **No normative `council.md` site, no `validate.py` parser, no JSON sidecar / structured artifact.** Both rejected; deliverable type is prose.
- **Comparison key: `(base sha, transplant identity, exact command)` gates count comparison.** Across differing triples, counts are never compared; the surviving cross-triple claim is red-observed-at-base plus reader-derived mechanism-absent set equality.
- **Raw red output verbatim — counts *and* per-failure lines — as the evidence.**
- **No required three-class `redAttribution` field.** Principal conceded/dropped it; owner rejected; O4 sustains the rejection of the class field while reinstating reader-derivation.
- **`prose.test.ts` as the enforcement class:** two pins — byte-identity on a marked shared block across `owner.md`/`skeptic.md`, plus a judge-reachability pin placing the field vocabulary inside `skeptic.md`'s `<output_format>` (`:151-163`). Both seats converged on two pins.
- **Stack-neutral phrasing** ("the repo's test command, verbatim") — forced by O7(a).
- **Required field set (converged shape):** base identity + base-selection rule + base role; transplant identity (enumerated file list + source head sha); exact command verbatim, stack-neutral; raw red output verbatim including per-failure lines; worktree provenance; explicit copy set; and the head half (head sha + same command + `0 fail`). *(Note: "field 7 / landing statement" shape is open — see open judgment.)*
- **No user-visible copy introduced.** Both seats agree; skeptic confirms. The Phase-1 escalation boundary is **not triggered** by this design.
- **Step-14 wiki-ingest offer left as the standing offer** (both seats lean leave-as-offer). Rests on convergence only.

## Open judgment — for `product-owner`, escalating to `steward`

Each is a values/craft call no test can settle. Both sides stated at equal weight.

1. **Mechanism-absent boundary — placement.** Both seats agree the skeptic derives/audits it at step 9 from raw lines + transplant manifest (O4 shows this is feasible). They differ on whether the owner **also** writes the bit in its record. `owner`: skeptic-derives-only — the bit is derivable from already-required fields, so a written field is an unauditable assertion. `principal`: owner-produces, skeptic-audits — a division of labour, not a test. No test settles who must produce it.
2. **Field 7 / landing statement vs head half.** `owner`: keep the "no red test landed" landing statement alongside the head half (it restates a standing rule whose violation is silent and catastrophic). `principal`: replace the landing statement with the head half (head sha + same command + `0 fail`) — its referent is observable, whereas the landing statement is an assertion. Both the head-half and the rule's existence are converged; the open question is whether the rule is *restated as a field* or *replaced by its observable proxy*.
3. **Shared-block wording.** The *rule* (reader-derived mechanism-absent, keyed on the module path in the error text vs the copy set) is settled by O4; the *phrasing* of the sentence in the shared block is craft.
4. **Section boundary the pin markers bracket** (where the shared block sits in each seat file — adjacent to the recording/reproduction duty vs parked at file end). Taste; decides whether the block is read at the moment the seat writes its evidence.
5. **Pin granularity** — the marker placement and exact scope of each of the two pins (which slice of the shared block the byte-identity pin brackets; how tightly the judge-reachability pin scopes the vocabulary to `<output_format>`). Both seats converged on two pins of this class; the granularity inside is craft.
6. **Step-14 wiki-ingest offer — mandated vs standing.** Both seats lean "leave as standing offer"; no ruling has been made. (Listed here per the runner's residual list; note both seats agree, so it is the lightest of the open items — a confirmation, not a live dispute.)

## Open objections

**None blocking.** The skeptic's verdict is no `open-untested` and no blocking objection against the converged design. The two `closed-red` results (O1, O2) are **documented, reproducible defects in the record's supporting text**, not in the design — "documented is not fixed," but they are closed (tests ran), not open. They require two **record corrections before this card proceeds** (the skeptic's stated terms, not design defeats):

1. The grounded-facts list's repetition of EV-41's "copy depth of `test/ev40-harness/`" explanation is known-wrong (O2); the 6 fails are head `test/stub-child.test.ts` vs the base stub, enabled by an unrecorded `extensions/retry.ts` transplant (O1/O3).
2. Owner's round-2 "unreproducible" finding is refuted (O1); the reconstruction recipe is the skeptic's transplant table.

Neither correction alters the `goal` or the converged design; both must be reflected in the spec/record so the convention is written against the true causal story.

## What remains before this card can proceed to a spec

The design has converged on site, field set, comparison key, enforcement class, and copy boundary, and the skeptic closed every objection with no blocking item remaining. What stands between this record and a spec is: (a) the two record corrections above (mechanical, the skeptic already supplied the true story); and (b) six open-judgment calls — boundary-bit placement, field-7-vs-head-half, shared-block wording, pin-marker section, pin granularity, and the wiki-ingest-offer confirmation — none of which a test can settle and all of which are craft/placement decisions a ruling seat (`product-owner`, escalating to `steward`) must decide before the owner writes the block, since the owner cannot pick a winner on them. No user-visible copy is introduced, so no escalation is triggered on the design itself.

**Facilitator's transcription (counting only, deciding nothing):** the
consolidator sorted 8 Skeptic-closed items (O1–O8, all closed by a run), 10
convergence-only settled items (explicitly *not* test evidence), **6 open-judgment
items**, and **0 open objections** (none blocking; the two `closed-red` results
are documented defects in the record's supporting text, already closed by the
Skeptic's runs). The consolidator's own stated precondition for step 7 is that
the six open-judgment items are decided by a ruling seat first, because "the
owner cannot pick a winner on them". Per `<escalation_contract>`, this
container routes them rather than deciding them: none is answered by a Phase-1
ruling (the card-specific ruling assigns *siting* to the deliberation — which
settled it — and makes only user-visible copy beyond internal documentation
open-judgment; the design introduces none, so that clause is not triggered).
This container does not dispatch `product-owner`; step 6's open-judgment items
are carried to the orchestrator as an `ESCALATION`.
### Step 6 — route what does not close (facilitator) — **`ESCALATION` returned, ruled, appended**

The step-5 consolidator synthesis closed with **six open-judgment items** and
**zero open blocking objections**. Per `<escalation_contract>` step 2 and the
consolidator's own stated precondition ("the owner cannot pick a winner on
them"), this container did not decide them: the prior runner ended its turn
with an `ESCALATION` carrying the six items as facts and no recommendation.

The orchestrator dispatched `product-owner` (`job-18`) on that packet; the
ruling came back to this container as (a) the seat's ruling document (below,
committed alongside this record) and (b) the orchestrator's resume packet
restating R1–R6 in condensed form. The two agree item-for-item and in every
constraint; the seat's own document is reproduced here verbatim, and the
packet's condensed restatement is therefore not duplicated — it is identical
in substance on all six items (skeptic-derives-only boundary; head half
replacing the landing statement; owner-delegated craft for wording, pin-marker
section, and pin granularity; two `prose.test.ts` pins including the
`<!-- red-base-shared-start/end -->` drift pin and the `<output_format>`
judge-reachability pin; wiki-ingest left as the standing offer; settled design
unchanged).

No Phase-1 ruling already covered these six items, so `<escalation_contract>`
step 1 had nothing to apply and step 2 was the correct route — this was not a
re-ask of a recorded decision.

**Items closed by the ruling:** item 1 → R1; item 2 → R2; item 3 → R3; item 4
→ R4; item 5 → R5; item 6 → R6. All six are ruled; **no item remains open**,
no `Needs Human` state arose, and no further escalation is outstanding. The
settled design is unchanged from the consolidator's convergence-only bucket —
site, field set (with field 7 replaced by the head half), comparison key,
enforcement class, and copy boundary all stand.

**Ruling source file:** `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md`
(committed with this record).

#### product-owner step-6 ruling (`job-18`) — verbatim

---
slug: po-fllwup47-step6
card: FLLWUP-47
epic: EPIC-9
seat: product-owner
step: 6
date: 2026-09-17
---

# FLLWUP-47 — product-owner step-6 ruling

Card state at ruling: `Deliberating`. Head SHA at subject: main checkout
`daa8e43` == `origin/main` (the Skeptic's pre/post-worktree check). Step-6
escalation facts (consolidator's synthesis, verified by `job-17.1` against
the live tree at `daa8e43`): eight Skeptic-closed objections (O1–O8, all
`closed` — six green, two red), ten convergence-only settled items, **six
open-judgment items**, and **zero blocking open objections**. The two
`closed-red` results (O1, O2) are defects in the *record's supporting
claims*, not in the design; both file as "documented is not fixed" but
neither is open.

The ruling below is grounded in wiki pages and the card record. The two
record corrections the Skeptic requires (mechanical; the true story is
in the Skeptic's transplant table) are listed separately at the end and
must land before step 7 reads this card as ground truth.

---

## R1 (item 1) — Mechanism-absent boundary: **skeptic-derives-only; owner does not write the bit.**

The skeptic derives and carries the bit in its evidence row at step 9
from raw lines + transplant manifest + base identity (the already-required
fields 2 + 4 + 6). The owner's record provides the raw material; it does
not contain a per-failure classification. The skeptic's evidence row is
where the bit reaches the judge (per the judge-reachability pin below).

- **Options rejected**:
  - "Owner produces, skeptic audits" (principal r2) — creates a
    two-seat parallel derivation that can disagree on the same record;
    no test settles the disagreement because both reads are
    interpretive. The skeptic already holds both trees
    (`council/procedures/council.md:257-267`; `skeptic.md:108-118`) and
    the reader-derivation duty is the seat's standing role.
  - "Three-class `redAttribution` field with `incidental`" (principal
    r1) — `incidental` has no operational definition; O4 explicitly
    does not reinstate it, and the EV-41 record shows no author could
    have classified the 7/1 correctly because the transplant set was
    unrecorded. The two-class split that the skeptic derives
    (mechanism-absent vs copy-set-dependent, per the module path in
    the error text vs the copy set) is the maximum the artifact
    carries.
  - "Both owner and skeptic write the bit" — worst of both: the
    owner's record cannot be audited against the skeptic's
    derivation, and the convention must then specify which bit is
    binding when they disagree.

- **Grounding**:
  - `council/cards/FLLWUP-47.md` step 4 O4 (the Skeptic's
    `closed-red` on the "worthless/unreproducible" framing — reader
    derivation from fields 2 + 4 + 6 works cleanly, but a required
    three-class field is *not* reinstated);
  - `council/cards/FLLWUP-47.md` step 5 "settled by convergence only"
    (the seven-field set without `redAttribution` and the
    comparison-key gating);
  - `vault/wiki/gate-parity.md` (the placement rule: enforce at the
    surface — the skeptic's reproduction — not at persistence; a
    new required field would be writer-only strictness with no
    matching runtime gate, the asymmetry the page forbids);
  - `vault/wiki/product-owner.md` Cases §2 (the fold-in test: a
    new field is not needed to honestly meet the existing `goal`;
    it is, in fact, the predicate the existing fields produce, so
    it folds in only as the skeptic's evidence-row obligation).

- **Reversibility**: trivial. Adding an owner-written bit later is a
  one-sentence copy change in the shared block plus a third pin
  (optional); re-pinning the byte-identity block is mechanical.

## R2 (item 2) — Field 7 / landing statement: **replace with the head half.**

The convention's record carries the head half (head SHA + same command
verbatim + `0 fail`). The landing statement ("no red test landed") is
removed from the convention's record. The standing rule continues to
exist as a merge-gate obligation; the convention does not double-enforce
it.

- **Options rejected**:
  - "Keep landing statement alongside head half" (owner) — mixes
    assertions with evidence in the same record. The convention's
    purpose per its `goal` is to fix what *evidence* must record
    and how it is compared; the landing statement is attestation
    about the merge window, not evidence of the base run. The
    merge gate is where "no red test lands" is enforced; a second
    enforcement in the convention's record invites drift and
    invites a future reader to mistake the assertion for
    evidence.
  - "Keep only the landing statement" — the head half is the
    observable referent; dropping it loses the auditable half.

- **Grounding**:
  - `council/cards/FLLWUP-47.md` `goal` text: "what a falsifier's
    red-at-base evidence must record and how it is compared across
    cards" — evidence is observable; the head half is observable,
    the landing statement is not.
  - `council/cards/EV-41.md:59-70` and the EPIC-9 steward ruling
    on EV-41: "the base-commit red run is recorded as evidence;
    no red test lands" — the "no red test lands" clause is the
    merge-gate obligation, distinct from the evidence record.
  - `vault/wiki/engineering-board.md` (the EPIC-8 EV-33 precedent:
    when a goal and a checklist diverge, the checklist is amended,
    not the goal; here the convention's record is the checklist
    surface and the goal fixes evidence; the landing statement is
    removed from the checklist).
  - `vault/wiki/gate-parity.md` (the merge gate already enforces
    "no red test lands"; the convention does not re-enforce).

- **Reversibility**: low. Restoring the landing statement is a
  one-sentence copy edit in the shared block; the byte-identity
  pin would need a re-run.

## R3 (item 3) — Shared-block wording: **delegated to owner (craft).**

The rule is settled by O4 (reader-derived mechanism-absent, keyed on
the module path in the error text vs the copy set; two-class split,
not three). The phrasing of the sentence in the shared block is
craft. The owner writes the shared block and the spec; this ruling
fixes the constraints the block must satisfy, not the words.

- **Constraints**:
  1. Stack-neutral phrasing — no runner name (`bun test`,
     `pytest`, `npm test`, etc.), no language name in any code
     fence, no `@ts-expect-error`. Forced by `test/prose.test.ts`
     lines 58–66; one runner-named sentence reds the whole file.
  2. The skeptic's derivation duty per R1 must be a sentence in
     the shared block (the bit the skeptic carries in its
     evidence row, derived from raw lines + transplant manifest +
     base identity).
  3. The field vocabulary (the seven fields, the comparison triple,
     the head-half substitution per R2) must appear inside
     `skeptic.md`'s `<output_format>` block — see R5 for the pin
     that enforces this. The shared block's `skeptic.md` side may
     be a subset; the `<output_format>` is where the judge sees
     the vocabulary.
  4. Do not name `docs/gates/GATE-EVIDENCE.md` — that path does not
     exist in this repo and the per-file guard
     (`test/prose.test.ts:28-34`) does not catch a second naming
     of it (per O7's settled gap).

- **Options rejected**: ruling on the wording itself — the
  consolidator correctly identified this as craft, not judgment;
  the rule settled by O4 is what the wording must express.

- **Grounding**: `council/cards/FLLWUP-47.md` step 5 "settled by
  convergence only" (the rule); `test/prose.test.ts:58-66` (the
  stack-pin guard); `test/prose.test.ts:28-34` (the
  `GATE-EVIDENCE` per-file gap, settled by O7).

- **Reversibility**: trivial. Rewording the shared block is a
  copy edit plus a pin re-run.

## R4 (item 4) — Pin-marker section boundary: **delegated to owner (craft, with a directional preference).**

The shared block should be bracketed adjacent to the recording /
reproduction duty in each seat file, not parked at file end.

- **Directional preference**:
  - In `council/agents/owner.md`: bracket the shared block inside
    or immediately after `<owner_mode>` (the four-gate discipline
    that produces the record). A block in this position is read at
    the moment the owner writes its evidence.
  - In `council/agents/skeptic.md`: bracket the shared block
    inside or immediately after `<verify_by_acting>` and adjacent
    to `<output_format>` (the step-9 reproduction duty and the
    evidence-row shape). A block in this position is read at the
    moment the skeptic writes its evidence row, which is where
    the judge-reachability pin (R5) attaches.

- **Options rejected**:
  - "File-end parking" (principal's optional placement) —
    defers the convention to a turn the seat may not have. A
    block at file end is read during the seat's own intake
    phase, but not necessarily re-read when the seat is
    composing its output. The block is evidence-bearing; it
    must be in the section the seat acts on, not in a footer.
  - "Whole-file byte-identity pin" (owner's round-1 framing,
    refined by principal) — unsatisfiable alongside the
    judge-reachability pin (whole-file byte-identity forbids
    the skeptic-specific `<output_format>` vocabulary). The
    block is marked; the pin brackets the marked slice.

- **Grounding**: `council/cards/FLLWUP-47.md` step 2 owner r1
  (the "adjacent to the recording duty" framing); principal r2
  §5 (the unsatisfiability of whole-file byte-identity); O7
  settled-green on the marked-shared-block shape.

- **Reversibility**: trivial. Moving the block is a copy edit
  plus a pin re-run.

## R5 (item 5) — Pin granularity: **delegated to owner (craft, with shape constraints).**

Two `prose.test.ts` pins; granularity inside each is craft.

- **Shape constraints**:
  - **Drift pin** (byte-identity on marked shared block across
    `owner.md` and `skeptic.md`):
    - Brackets must be literal HTML-comment markers
      (e.g. `<!-- red-base-shared-start -->` /
      `<!-- red-base-shared-end -->`), not line numbers — line
      numbers drift when surrounding prose is edited.
    - Slices must be the *shared* block only, not whole-file.
      A whole-file byte-identity pin is unsatisfiable alongside
      the judge-reachability requirement (the skeptic carries
      the field vocabulary in `<output_format>`, the owner does
      not — they cannot be byte-identical end-to-end).
    - Style: `expect(ownerBlock).toEqual(skepticBlock)` on the
      marked slice, mirroring the `STEP3_FIXTURE` pattern at
      `test/prose.test.ts:68-93`.
  - **Judge-reachability pin** (vocabulary inside skeptic.md's
    `<output_format>`):
    - Whitespace-flatten the file (matching the EV-11/EV-12
      patterns at `test/prose.test.ts:337-342` style), so the
      pin survives line wrapping.
    - Require the field vocabulary (the seven-field names, the
      comparison triple, the head-half wording per R2) to appear
      between `<output_format>` (`skeptic.md:151`) and
      `</output_format>` (`skeptic.md:163`), not merely
      somewhere in the file.
    - The vocabulary's contents are the owner-written shared
      block per R3, surfaced in the skeptic's evidence row.

- **Options rejected**:
  - "Whole-file byte-identity" (owner r1, refined) —
    unsatisfiable alongside the judge-reachability pin, per
    O7's settled caveat.
  - "Loose vocabulary check file-wide" (no `<output_format>`
    scoping) — passes when the vocabulary lives anywhere in the
    file, including a footer; fails the per-section
    enforcement.

- **Grounding**: `council/cards/FLLWUP-47.md` step 2 principal r1
  (the two-pin design + the unsatisfiability caveat, settled by
  O7); `test/prose.test.ts:68-93` (the `STEP3_FIXTURE` byte-
  identity pattern); `test/prose.test.ts:337-342` style (the
  whitespace-flattened per-section pattern).

- **Reversibility**: trivial. Tightening or loosening the slices
  is a test edit.

## R6 (item 6) — Wiki-ingest offer: **leave as the standing offer; not a fold-in.**

The convention's `goal` ("A written convention fixes what a falsifier's
red-at-base evidence must record and how it is compared across cards")
is met by the seat prose alone — the prose is what fixes what evidence
must record. A wiki page documenting the convention does *not* fix what
evidence must record; it documents. The wiki-ingest is therefore not
needed to honestly meet the existing `goal`, by the fold-in test
(`vault/wiki/product-owner.md` Cases §2).

The standing offer at `council/procedures/council.md:329-334` (step
14: "Offer to file anything durable… never hand-edit anything under
`vault/`") continues to apply at run end. A wiki page for the
red-base convention may be filed as a separate follow-up card (e.g.
at step 13 of this run, or at a later run's decomposition) if the
team wants it; the wiki-ingest itself is owned by the `/wiki-ingest`
procedure, which `vault/` cannot be hand-edited into.

Both seats lean this way; the consolidator flagged it as "the
lightest of the open items — a confirmation, not a live dispute."
This ruling confirms.

- **Options rejected**:
  - "Mandate the wiki-ingest from this card" — scope creep beyond
    the `goal`; the convention ships without it; the merge gate
    does not require it; the next reader (skeptic, judge,
    future engineer) gets the convention from seat prose.
  - "Mandate the wiki page content in this card" — the wiki is
    grounding prose, not normative; `vault/` is not authorable
    by this card; only `/wiki-ingest` writes it.

- **Grounding**:
  - `council/cards/FLLWUP-47.md` `goal` text (the scope of the
    card is the evidence convention, not its documentation);
  - `council/procedures/council.md:329-334` (the standing offer
    at step 14);
  - `vault/wiki/product-owner.md` Cases §2 (the existing-goal /
    fold-in test);
  - `vault/wiki/llm-wiki.md` (the wiki is grounding prose, not
    normative; seat prose is the normative surface per R3's
    site decision).

- **Reversibility**: trivial. Promoting the wiki-ingest to a
  follow-up card or to a step-13 residual is cheap (one card
  draft).

---

## Two record corrections required before step 7 (mechanical)

These are the Skeptic's settled `closed-red` facts, not design
defeats. The spec must be written against the true causal story, not
the harness-copy story. Required:

1. **The "copy depth of `test/ev40-harness/`" explanation is known-wrong**
   (O2 `closed-red`). The 6 extra fails in the recorded `7 fail / 1
   error` come from head `test/stub-child.test.ts` running against the
   base `test/stub-child.ts` (which lacks `flaky`/`finish_error` modes),
   enabled by an unrecorded `extensions/retry.ts` transplant. Copying
   `test/ev40-harness/` and `ev41-tui.py` is inert in this configuration
   (their removal leaves the count identical).
2. **Owner's round-2 "unreproducible" finding is refuted** (O1
   `closed-red`). The recorded number IS reproducible at base `3e39e66`
   with the transplant set
   `{extensions/retry.ts, test/stub-child.test.ts, test/ev41-retry-e2e.test.ts}`
   (all from EV-41 head `0330274`), keeping the base `test/stub-child.ts`.
   Output: `733 pass / 2 skip / 7 fail / 1 error`, exact.

The Skeptic's transplant table (in step 4 of the card) is the
reconstruction recipe. The true story must replace the harness-copy
sentence in the card's grounded-facts list and in any place the spec
or the convention block cites the cause. The corrections are mechanical
and do not change the card's `goal` or the converged design.

---

## What the resumed runner hands off

With R1–R6 ruled and the two record corrections scheduled, the resumed
runner can resume FLLWUP-47 at step 7 with the ruling appended
verbatim. The deliverable moves as the consolidator's converged design
states, with the constraints above:

- **One normative site**: `council/agents/owner.md` and
  `council/agents/skeptic.md`, seat prose only; no `council.md` copy,
  no `validate.py` parser, no JSON sidecar / structured artifact.
- **Required field set**:
  1. Base identity (40-hex sha + base-selection rule + base role),
  2. transplant identity (enumerated file list + source head sha),
  3. exact command verbatim, stack-neutral,
  4. raw red output verbatim including per-failure lines,
  5. worktree provenance,
  6. explicit copy set,
  7. head half (head sha + same command + `0 fail`) — **replaces**
     owner's original field-7 landing statement per R2.
- **Comparison key**: `(base sha, transplant identity, exact command)`
  gates count comparison; across differing triples, counts are never
  compared; the surviving cross-triple claim is red-observed-at-base
  plus reader-derived mechanism-absent set equality (skeptic derives
  the bit per R1).
- **Enforcement**: two `prose.test.ts` pins (R5): drift pin
  (byte-identity on marked shared block, `<!-- red-base-shared-start/end -->`
  markers), and judge-reachability pin (vocabulary inside
  `skeptic.md`'s `<output_format>`, whitespace-flattened).
- **Site**: shared block bracketed adjacent to the recording /
  reproduction duty (R4) — in `owner.md` near `<owner_mode>`, in
  `skeptic.md` near `<verify_by_acting>` and adjacent to
  `<output_format>`.
- **Wiki-ingest**: standing offer only (R6); not a fold-in.

The two `closed-red` Skeptic corrections (record sentences, not
design) must land before the spec is read against this card as ground
truth. None of R1–R6 changes the `goal` or the converged design; both
record corrections are pre-step-7 mechanics.

## Reversibility, end-to-end

The single change is one commit on a worktree branch with no
main-repo state mutation (per `vault/wiki/main-repo-immutability.md`);
the five merge criteria (`vault/wiki/deterministic-merge-check.md`)
apply at head SHA. The resume path is the standard EPIC-9 form: PR
with squash method, `--match-head-commit` pinning, merged-SHA gates
re-verified, step-12 union-merge-reconcile if the runner's record
commits advanced `origin/main` between branch cut and merge. No
escalation to `steward` is needed — none of R1–R6 changes the
portfolio (no recorded human decision is touched; no card is declined;
no permanent residual is accepted; the card `goal` is not amended).

## Sources

- `council/cards/FLLWUP-47.md` — steps 1–5 verbatim (the two seats'
  positions, the Skeptic's eight objections, the consolidator's
  synthesis)
- `council/cards/EV-41.md:59-70` — the standing "no red test lands"
  obligation
- `council/agents/owner.md:78-114` — `<owner_mode>` (the four-gate
  discipline; the natural anchor for the shared block per R4)
- `council/agents/skeptic.md:108-118,120-130,151-163` —
  `<verify_by_acting>`, `<main_repo_immutability>`, `<output_format>`
  (the natural anchors and the judge-reachability scope)
- `council/procedures/council.md:257-280,329-334` — step 9
  skeptic dispatch + step 10 judge input + step 14 wiki-ingest
  standing offer
- `test/prose.test.ts:8-16,28-34,58-66,68-93` — the guards the
  shared block must satisfy (council-markdown scope; per-file
  GATE-EVIDENCE gap; stack-pin regex; STEP3_FIXTURE pattern)
- `extensions/seats.ts:592-597` — `buildSystemPrompt` (seat prompt
  = body + procedures directory path + grounding; no procedure text
  reaches a seat)
- `vault/wiki/product-owner.md` — Cases §1 (open-judgment disputes),
  §2 (fold-in / existing-goal test)
- `vault/wiki/gate-parity.md` — the placement rule; the
  writer-alone asymmetry the page forbids
- `vault/wiki/engineering-board.md` — the EPIC-8 EV-33
  goal/checklist amendment precedent; the EPIC-7 EV-29 goal-as-
  defect escalation precedent
- `vault/wiki/council-runner.md` — escalation contract (facts-only
  packets; resume with ruling appended verbatim)
- `vault/wiki/main-repo-immutability.md` — worktree-only state
  changes; the FLLWUP-16/17/18 enforcement chain
- `vault/wiki/deterministic-merge-check.md` — the five merge
  criteria the resumed runner re-runs
- Skeptic `job-17.1` report (O1–O8) — every load-bearing fact in
  this ruling


#### Record corrections applied before step 7 (mechanical)

The ruling schedules two corrections; both landed above, in the step-1
grounded-facts list, before the spec was written (per the consolidator: "the
spec must be written against the true causal story, not the harness-copy
story"):

1. **Correction (a)** — the "copy depth of `test/ev40-harness/`" explanation is
   replaced in place by the true causal story (head `test/stub-child.test.ts`
   vs the base stub, enabled by the unrecorded `extensions/retry.ts`
   transplant; `test/ev40-harness/` and `ev41-tui.py` inert in that
   configuration). Marked as a step-6 correction.
2. **Correction (b)** — owner round-2's "unreproducible" finding is recorded as
   refuted, with the exact reconstruction recipe and the resulting
   `733 pass / 2 skip / 7 fail / 1 error`.

Neither correction changes the card's `goal`, the converged design, or any
ruling; both are record sentences, and neither is a design defeat.

**Step 6 outcome: closed by ruling; procedure continues at step 7.**

### Step 7 — spec written and handed to one owner (facilitator)

With R1–R6 applied and both record corrections landed (step 6), the settled
design was written up verbatim at
`docs/superpowers/specs/2026-09-17-FLLWUP-47-design.md` (commit `58cd1f5`).
Nothing was reopened and nothing was derived here: the spec states the
converged design, the ruling's constraints, and the true causal story the
block must be written against (the unrecorded `extensions/retry.ts`
transplant, not harness copy depth).

Self-review before commit: no placeholder/TODO text; internally consistent
with steps 2–6 (field 7 = head half per R2; no `redAttribution` class field
and no owner-written boundary bit per R1; two `prose.test.ts` pins per R5; no
`council.md` copy, no `validate.py` parser, no structured artifact, no
scaffold change); in scope for the card's `goal`; and unambiguous — siting,
marker names, the seven fields, the comparison triple and rule, the
`<output_format>` requirement, both pin shapes, the out-of-scope boundaries,
and the gate set are all stated, so an owner reading only the spec cannot
reach two different designs.

The design is handed to the single owner (`owner`), which works in an
isolated git worktree, never on `main`. Card set `In Progress` (frontmatter
and board) before the step-8 dispatch; `python3 council/validate.py` clean.

### Step 8 — owner plans then implements (facilitator, observed artifacts)

`owner` (`job-19.1`, 8.6m, 23 turns, `stopReason=stop`, tokens in 98539 / out
14687 / cR 1148160 / cW 0 / reason 6754 / total 1261386, cost≈$0.0339
catalogue) was dispatched with the committed spec only (no other seat's
positions). It cut `feat/fllwup-47-red-base-convention` from `0759761` in an
isolated worktree, wrote the plan, landed the block + the `<output_format>`
vocabulary + the two pins red-first, ran the gates, pushed, and opened a PR.

**Observed artifacts (facilitator-read, first-hand):** `gh pr view 64` →
`state: OPEN`, `headRefName: feat/fllwup-47-red-base-convention`,
`headRefOid a1d805a901b25e3c2dc2d29aa72dfa6a8905d4e6`, `baseRefName: main`.
`gh pr checks 64 --json name,state,workflow` →
`[{"name":"gates","state":"IN_PROGRESS","workflow":"gates"}]`. The PR is
open, so per council.md step 8 the card transitions to `In Review` on that
observable fact alone — not on the owner's report that its gates are clear.

The owner's claim set (recorded as its report, not as verified fact — step 9
tests it): red-first pin output `14 pass / 2 fail` before the block, `16 pass /
0 fail` after; `bunx tsc --noEmit` exit 0; `bun test` → `884 pass / 2 skip / 0
fail` across 77 files; `python3 council/validate.py` → clean; `bash
council/preflight.sh FLLWUP-47` → `PASS: preflight clean`, with the
branch-freshness clause **not** triggered (`origin/main` was still `0759761` at
gate time). Commits `7439d0b` (red-first pins) and `a1d805a` (the block); plan
at `docs/superpowers/plans/2026-09-17-FLLWUP-47-plan.md`. Markers:
`<!-- red-base-shared-start -->` / `<!-- red-base-shared-end -->`;
`<output_format>` addition outside the markers.

### Step 9 — verify by acting (skeptic)

`skeptic` (`job-19.2`, 4.4m, 22 turns, `stopReason=stop`, tokens in 75845 / out
10480 / cR 811574 / cW 0 / reason 4734 / total 897899, cost≈$0.2611 catalogue)
was dispatched at the **PR head** — subject `a1d805a901b25e3c2dc2d29aa72dfa6a8905d4e6`,
head worktree `/tmp/fllwup47-verify` (removed after; main checkout left clean) —
with the frame that step 9 precedes step 10 judging and step 11's mechanical
merge, which the facilitator executes and no seat performs. It re-ran the full
gate set, read the landed prose against the spec, and ran a perturbation
battery with sha256-verified restores.

**Facilitator transcription (counting only, deciding nothing):** seven
objections — O1–O7 — **all `closed-green`; no `closed-red`, no
`open-untested`. Verdict: `no open objections`.** The head SHA it verified
equals `a1d805a` first-hand. The card therefore stays `In Review`; no fix
cycle is triggered (step-9 iteration count: cycle 1 of ≤3, clean).

Observed gate evidence at head (read by the Skeptic, its actual output): `bunx
tsc --noEmit` exit 0 (after `bun install`; a raw worktree lacks `node_modules`,
an environment cause the Skeptic named); `bun test` → `884 pass / 2 skip / 0
fail`, 886 tests across 77 files; `python3 council/validate.py` → `All council
artifacts valid`.

`bash council/preflight.sh FLLWUP-47`, run on the named branch worktree, →
verbatim: `FAIL: local history does not descend from origin/main (stale before
running a card)`, exit 1 — the known-by-construction FLLWUP-27 branch-freshness
artifact, now live because a facilitator record commit advanced `origin/main`
past the branch cut. Recorded verbatim, not reclassified, and **not** used to
weaken any criterion; the step-11 re-run set remains `tsc` / `bun test` /
`validate.py`.

The Skeptic's one non-blocking remark for the judge: field 7's landed text ends
"…is the obligation; no red test lands." — a present-tense rule restatement, by
its reading, not a per-record assertion and not an eighth evidence field. It is
carried verbatim into the step-10 judge packet as part of the evidence.

#### skeptic — step 9 (`job-19.2`) — verbatim

Verification complete. Worktrees removed, main checkout clean (the `ln -s`
never executed — target was a pre-existing directory; `git status --porcelain`
empty). Report:

**Head SHA verified: `a1d805a901b25e3c2dc2d29aa72dfa6a8905d4e6`** — `gh pr view
64 --json headRefOid` returned exactly that SHA, and both worktrees I checked
(`/tmp/fllwup47-verify`, owner's `.worktrees/fllwup-47`) resolved to it.

## Objections

- **O1 — Gates pass (tsc / bun test / validate.py).** Settling test: run all
  three in order at head. `bunx tsc --noEmit` → exit 0 (after `bun install`;
  raw worktree lacks node_modules so tsc exits 1 pre-install — environment, not
  branch, cause). `bun test` → `884 pass / 2 skip / 0 fail`, 886 tests across
  77 files. `python3 council/validate.py` → `All council artifacts valid`.
  **closed-green.**
- **O2 — Seven fields + triple + rule + Skeptic-derived boundary in landed
  prose.** Settling test: first-hand read of the `git diff 0759761 a1d805a`
  hunks against spec §3. All seven present with required substance (40-hex sha
  + selection-rule sentence + `required`/`optional-second` role; transplant
  file list + source head sha; stack-neutral "the repo's test command, quoted
  verbatim"; counts + per-failure lines verbatim; detached-worktree provenance
  + removal; copy set / "bare copy"; head sha + same command + `0 fail`).
  Comparison triple `(base sha, transplant identity, exact command)` with
  equal-triple-exact-reproduction and differing-triple-never-compare rules,
  population sub-rule, and cross-card non-aggregation all present. Shared block
  contains the Skeptic-derivation sentence ("The skeptic — not the owner —
  derives the two-class boundary…"), two classes only ("Two classes only — no
  third class is defined"), zero hits for `incidental`/`redAttribution` in
  either seat. **closed-green.**
- **O3 — Drift pin can fail.** Settling test: one-word perturbation inside
  skeptic's marked block → `bun test test/prose.test.ts` → `(fail) red-base
  convention block is byte-identical in owner and skeptic seats`, 15 pass/1
  fail; restored byte-exact (sha256 match) → 16/0. **closed-green** (objection
  I raised and lost — the pin holds).
- **O4 — Reachability pin can fail and is region-scoped.** Settling test:
  `Copy set` → `Copy collection` inside `<output_format>` only (shared-block
  occurrence untouched) → `(fail) red-base convention vocabulary reaches the
  skeptic's output format`, exit 1; restored → green. This simultaneously
  proves vocabulary parked outside the region cannot satisfy the pin. All seven
  field names + triple + `` `0 fail` `` confirmed inside the region via
  whitespace-flattened check; test uses `lastIndexOf("<output_format>")` as
  claimed. **closed-green.**
- **O5 — Stack guard covers the new block.** Settling test: inject `(bun test)`
  into owner's block → `(fail) council prose does not pin a specific tech
  stack` naming `agents/owner.md` (plus drift pin red); restored byte-exact.
  Block contains zero runner names / `@ts-expect-error` by direct grep.
  **closed-green.**
- **O6 — Scope discipline.** Settling test: `git diff --stat 0759761 a1d805a` →
  exactly 4 files (`owner.md`, `skeptic.md`, `test/prose.test.ts`, one plan
  file); zero diff in `council/procedures/`, `judge.md`, `validate.py`,
  `scaffold/`, `vault/`; no `package.json` change; `GATE-EVIDENCE.md` appears
  only twice, both in the plan file's out-of-scope list (zero in seat prose);
  full diff read shows no user-visible copy. **closed-green.**
- **O7 — Red-first is real.** Settling test: throwaway worktree at pins-only
  commit `7439d0b` → `bun test test/prose.test.ts` → `14 pass / 2 fail` (both
  new pins red); at head → `16 pass / 0 fail`. Matches the claimed `14/2 →
  16/0` exactly. **closed-green** (reproduced, not merely asserted).

## What I ran

- `gh pr view 64 --json headRefOid…` → `a1d805a…`; `git worktree add --detach
  /tmp/fllwup47-verify a1d805a…` → HEAD confirmed.
- `bun install` + `bunx tsc --noEmit` → `TSC_EXIT=0`; `bun test` → `884 pass /
  2 skip / 0 fail / 77 files`; `python3 council/validate.py` → `All council
  artifacts valid`.
- Full `git diff 0759761 a1d805a -- council/agents/` read (both hunks pasted
  in-session); byte-identity script → `True`, len 3815, 0 trailing-ws lines;
  region-scoped vocab script → 9/9 in-format.
- Perturbation battery (drift-word, output_format vocab, runner-name injection)
  with red-then-restore cycles, sha256-verified restores, all green after.
- Red-first worktree at `7439d0b` → `14 pass / 2 fail / REDFIRST_EXIT=1`.
- `bash council/preflight.sh FLLWUP-47` on the named branch worktree →
  verbatim: `FAIL: local history does not descend from origin/main (stale
  before running a card)`, exit 1. (In a detached worktree the freshness clause
  is skipped by construction — `symbolic-ref` fails → branch defaults to
  `main` — so the FAIL is observable only on the named branch. Recorded
  verbatim, not reclassified, not used to weaken any criterion, per the card's
  standing note.)

## Verdict

**No open objections.** One remark for the judge, not a block: field 7's landed
text ends "…is the obligation; no red test lands." — a present-tense rule
restatement, not a per-record "no red test landed" assertion and not an 8th
evidence field; the head half (sha + same command + `0 fail`) is fully present
and no prohibited field rides with it. All spec hard boundaries (no three-class
field, no owner-written bit, no `GATE-EVIDENCE.md` in the block, no
out-of-scope files, no version bump, no user-visible copy) verified holding by
runnable checks.

### Step 10 — judge the stop condition (judge)

`judge` (`job-19.3`, 2.3m, 9 turns, `stopReason=stop`, tokens in 29089 / out
1861 / cR 155520 / cW 0 / reason 984 / total 186470, cost≈$0.0124 catalogue)
was dispatched with **the card's `goal` and the Skeptic's step-9 evidence only**
— no spec, no deliberation record, no positions — subject-pinned to the PR head
`a1d805a901b25e3c2dc2d29aa72dfa6a8905d4e6` and to the frame that step 10
precedes step 11's mechanical merge, which the facilitator executes and no seat
performs.

**Verdict: `PASS`** (verbatim basis): at head `a1d805a`, `bun test
test/prose.test.ts` passes both goal-specific tests ("red-base convention block
is byte-identical in owner and skeptic seats"; "red-base convention vocabulary
reaches the skeptic's output format"), and the block itself records both halves
of the goal (seven required fields; the comparison triple with equal-triple
exact reproduction, differing-triple non-comparison, and cross-card
non-aggregation). Full gate suite re-run by the judge: `bunx tsc --noEmit` exit
0, `bun test` `884 pass / 2 skip / 0 fail`, `python3 council/validate.py` →
`All council artifacts valid`.

No REJECT, so the card remains `In Review` and proceeds to step 11.
