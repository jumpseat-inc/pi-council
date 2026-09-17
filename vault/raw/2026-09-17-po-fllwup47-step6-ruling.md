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
