---
id: FLLWUP-47
title: Documented red-base convention for falsifier evidence
state: Deliberating
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
  - **The EV-41 discrepancy, verbatim from the card's own record:** the
    optional second pre-mechanism base `3e39e66` measured `7 fail / 1 error`
    in the owner's report versus `1 fail / 1 error` in the Skeptic's
    reproduction; "the difference tracks how much of `test/ev40-harness/` was
    copied into the base worktree (that directory does not exist at
    `3e39e66`), so it is a property of the copy depth, not of the falsifier.
    The **required** base (`3a3773f`) reproduced exactly" (EV-41 card, step 9).
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
