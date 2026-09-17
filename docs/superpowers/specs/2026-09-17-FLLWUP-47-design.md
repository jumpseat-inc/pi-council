# FLLWUP-47 — Documented red-base convention for falsifier evidence

**Card:** `council/cards/FLLWUP-47.md` (EPIC-9, seventh card of the run).
**Status:** settled design — steps 1–6 of `/council` closed it; this file writes
it up, it does not derive it.
**Goal:** A written convention fixes what a falsifier's red-at-base evidence
must record and how it is compared across cards.

This spec is the owner's handoff. Everything below was settled by the
deliberation (steps 2–5), the Skeptic's runs (step 4), the `product-owner`
rulings R1–R6 at step 6, and the run-wide Phase-1 rulings. **Nothing here is a
facilitator choice, and no design question below is open.** An owner reading
only this file must be able to implement without reopening anything; where the
Council deliberately left phrasing to craft, the boundary of that freedom is
named.

## 0. What the design is, in one paragraph

One **normative convention block**, **byte-identical** in the two packaged
seats it binds — `council/agents/owner.md` (records the red-at-base run) and
`council/agents/skeptic.md` (reproduces and compares it) — bracketed by literal
HTML-comment markers and locked by a `test/prose.test.ts` drift pin, with the
convention's field vocabulary also surfaced inside `skeptic.md`'s
`<output_format>` block (locked by a second, judge-reachability pin). The block
fixes **seven required evidence fields**, a **comparison triple** that gates
whether two records' counts may be compared at all, and a **reader-derived
mechanism-absent boundary** the Skeptic derives at step 9 from the raw evidence
it already holds. There is **no** `council.md` copy, **no** `validate.py`
parser, **no** structured artifact / JSON sidecar, **no** scaffold change, and
**no new user-visible copy**.

## 1. What is settled (do not reopen)

- **One normative site: packaged seat prose only.** `council/agents/owner.md`
  and `council/agents/skeptic.md`. The channel fact is first-hand
  (`extensions/seats.ts:592-597`, O6 `closed-green`): a seat's prompt is
  `seat.body` + `<council_runtime>` (the procedures **directory path** only) +
  grounding. No procedure text ever reaches a seat, so a convention sited in
  `council/procedures/council.md` would bind no actor. `principal` withdrew its
  two-site design in round 2; `owner`'s single-site design is signed by both.
- **No `council.md` change, no `validate.py` parser, no structured artifact, no
  scaffold change, no JSON sidecar.** Convergence-only settled (deliberation
  steps 2–5) plus the gate-parity placement principle: a writer-only strictness
  with no matching runtime gate is the asymmetry the repo forbids.
- **The mechanism-absent boundary is Skeptic-derived-only (R1).** The owner does
  **not** write the bit. The Skeptic derives and carries it in its step-9
  evidence row, from the raw lines + transplant manifest + base identity — the
  already-required fields. No three-class `redAttribution` field is
  reinstated; `incidental` has no operational definition (O4 sustains its
  rejection while reinstating the derivation duty, which O4 shows is feasible).
- **Field 7 is the head half, not the landing statement (R2).** The record
  carries head sha + the same command verbatim + `0 fail`. "No red test landed"
  is removed from the convention's evidence record; it remains a merge-gate
  obligation and is not double-enforced here.
- **Enforcement is two `test/prose.test.ts` pins (R5):** a drift pin
  (byte-identity on the marked shared block across the two seat files) and a
  judge-reachability pin (field vocabulary between `skeptic.md`'s
  `<output_format>` tags). A prose pin proves the convention is *written*; only
  step 9's reproduction proves a seat *followed* it.
- **Comparison key:** `(base sha, transplant identity, exact command)` gates
  count comparison. Across differing triples, counts are never compared; the
  surviving cross-triple claim is *red observed at base* plus the
  reader-derived mechanism-absent set equality.
- **Raw red output verbatim — counts *and* per-failure lines — is the
  evidence.** Counts alone were never checkable (O5, narrowed).
- **Stack-neutral phrasing is load-bearing, not stylistic** (O7(a), `closed-green`):
  `test/prose.test.ts`'s guard is
  `/\b(bun|bunx|typescript|tsc)\b|bun test|bun run|@ts-expect-error/i` over
  every packaged seat and procedure body, case-insensitive. One runner-named
  sentence reds the whole file.
- **No user-visible copy is introduced.** Both seats agree; the Skeptic
  confirmed it. The card's Phase-1 copy/escalation boundary is **not
  triggered** by this design (internal documentation and packaged seat prose
  only), so no `ESCALATION` rides on it.
- **The wiki-ingest is left as the standing step-14 offer, not a fold-in
  (R6).** The `goal` is met by seat prose alone. A wiki page for the convention
  may be filed as a separate follow-up card; `vault/` is never hand-edited.

## 2. The true causal story the convention must be written against (record corrections)

Both corrections are mechanical record sentences the Skeptic settled `closed-red`
at step 4 (O1, O2) and the ruling schedules before step 7. **The block and the
spec must state the cause this way, never the harness-copy story:**

1. **The card's carried explanation is known-wrong.** EV-41's *optional
   second* pre-mechanism base `3e39e66` measured `7 fail / 1 error` in the
   owner's report versus `1 fail / 1 error` in the Skeptic's reproduction. The
   sentence that explained the delta as "how much of `test/ev40-harness/` was
   copied into the base worktree" is **false**: removing `test/ev40-harness/`
   and `ev41-tui.py` leaves the count identical (`7 fail / 1 error`) — those
   files are inert in that configuration. The six extra fails come from head
   `test/stub-child.test.ts` running against the base `test/stub-child.ts`
   (which lacks the `flaky`/`finish_error` modes), enabled by an **unrecorded
   `extensions/retry.ts` transplant**.
2. **The number is reproducible** — owner round-2's "unreproducible from any
   transplant/command combination" finding is refuted. Recipe: base `3e39e66`,
   transplant `{extensions/retry.ts, test/stub-child.test.ts,
   test/ev41-retry-e2e.test.ts}` from EV-41 head `0330274`, keep the base
   `test/stub-child.ts`, run the repo's test command →
   `733 pass / 2 skip / 7 fail / 1 error`, exact. Composition: the transplanted
   head `stub-child.test.ts`'s 6 tests (6 assertion fails against the base stub)
   plus 1 file-level `Cannot find module '../extensions/job-retry.ts'` counted
   by the runner as 1 fail + 1 error. The **required** base (`3a3773f`)
   reproduced exactly.

The convention is the thing that would have forced the unrecorded
`extensions/retry.ts` transplant into the record. That is the thesis the block
must carry; the harness-copy sentence must not reappear anywhere.

## 3. The shared block — required content

The block is **normative** and binds both seats: for `owner`, a red-at-base
record missing a required field is an incomplete gate result; for `skeptic`, a
reproduction that compares counts without checking comparability is a defective
verification.

### 3.1 The seven required fields

Exact wording is the owner's craft (R3); the substance and the field set are
fixed. Use short, literal field names that the `<output_format>` restatement
(§4) can reuse verbatim — that is what makes the two pins expressible, which
both R3 and R5 require.

1. **Base identity** — the full 40-hex sha, the base-*selection rule* it
   satisfies (one sentence, e.g. "the commit immediately preceding the epic's
   first mechanism merge"), and the base *role* — `required` versus
   `optional-second`. The role is one word and is required (EPIC-9's standing
   ruling distinguishes the required base from an optional extra; a record that
   does not say which it is cannot be compared across cards).
2. **Transplant identity** — the enumerated list of files materialized into the
   base worktree that do not exist at the base sha, and the **source head sha**
   they were copied from. At base the falsifier does not exist; it is a
   transplant. This is the field the EV-41 pair lacked.
3. **Exact command, verbatim** — stack-neutral ("the repo's test command, as
   invoked", never a runner name). Relational: the same command applies to both
   the base half and the head half (§3.1.7).
4. **Raw red output, verbatim** — the runner's own counts (`pass / fail /
   error / skip`) **and** the per-failure lines, never paraphrased. Counts alone
   are not checkable; the per-failure lines are what let a reader derive the
   mechanism-absent boundary.
5. **Worktree provenance** — detached checkout at the base in a separate
   worktree, main checkout untouched, worktree removed after.
6. **Explicit copy set** — everything placed in the base worktree beyond the
   falsifier itself, or the affirmative statement "bare copy". Field 2 is the
   transplant; this is the superset that also captures incidental copies. When
   the copy set differs between two records, the numbers were never the same
   experiment.
7. **Head half** — head sha + the same command verbatim + `0 fail`. This
   **replaces** the landing statement (R2). The pair is the obligation.

### 3.2 The comparison triple and rule

- **Comparison triple:** `(base sha, transplant identity = file list + source
  sha, exact command)`.
- **Equal triple:** counts must reproduce exactly. Non-reproduction is a defect
  in one of the two records.
- **Differing triple:** counts are **not comparable numbers**. The comparison
  must first check triple equality; only on equality may counts be compared.
  Across differing triples the surviving claim is *red observed at base* plus
  the reader-derived mechanism-absent set (§3.3).
- **Population-difference sub-rule:** if the base tree lacks a path the
  transplant references, the record must state that at recording time; its
  counts are copy-depth- or transplant-qualified from the start and may not be
  presented as a base measurement of the mechanism.
- **Across cards:** never aggregate raw red counts. The surviving cross-card
  assertions are: a required-base record exists with all fields; it carries ≥1
  mechanism-absent red; its head half is `0 fail`.

### 3.3 The mechanism-absent boundary (R1 — the Skeptic's derivation duty)

The block **must contain a sentence assigning this duty to the Skeptic** — it
is a requirement of the shared block, not a footnote (R3 constraint 2). The
rule, settled by O4, is:

- The Skeptic derives the bit at step 9 from the raw per-failure lines + the
  transplant manifest + the base identity — no new owner-written field.
- Two classes, keyed on the artifact path named **in the error text**:
  - a red whose error text names an artifact **inside the copy set** ⇒
    **copy-set-dependent** (it demonstrates nothing about the mechanism under
    test);
  - a red whose error text names an artifact **of the mechanism under test,
    absent at base** (e.g. a module the mechanism adds) ⇒ the **base-native
    red** sought.
- This two-class split is the maximum the artifact carries. Do **not** add
  `incidental`, and do **not** require the owner to classify per-failure.
- The derived result is carried in the Skeptic's step-9 evidence row, which is
  the judge's substantive input (`council.md:268-280`; `judge.md`), so the bit
  reaches the judge through the evidence row rather than through widened judge
  input.

## 4. Siting, markers, and the `<output_format>` vocabulary

### 4.1 Where the block sits (R4)

Bracket the shared block **adjacent to the recording/reproduction duty**, not
parked at file end:

- `council/agents/owner.md` — inside or immediately after `<owner_mode>` (the
  four-gate discipline that produces the record).
- `council/agents/skeptic.md` — inside or immediately after
  `<verify_by_acting>`, and adjacent to `<output_format>`.

### 4.2 Markers (R5)

- Two literal HTML-comment markers bracket the shared block:
  `<!-- red-base-shared-start -->` and `<!-- red-base-shared-end -->`. Never
  line numbers — surrounding prose edits would drift them.
- The markers live in **both** files, and the text between them must be
  **byte-identical** across the two files.
- **Pitfall (must not happen):** the Skeptic-specific `<output_format>`
  addition of §4.3 must sit **outside** the markers. A marked slice that
  includes the `<output_format>` tags cannot be byte-identical to `owner.md`,
  which has no `<output_format>` block. The marked slice is the *shared* block
  only.

### 4.3 The field vocabulary inside `skeptic.md`'s `<output_format>` (R3(c), R5)

`council/agents/skeptic.md`'s `<output_format>` block (currently lines 151–163)
must carry the convention's vocabulary — the seven field names **as written in
the shared block**, the comparison triple, and the head-half wording — plus the
Skeptic's derived mechanism-absent bit in its evidence row. This is the block
the judge sees; a convention whose vocabulary lives only in the shared block
still cannot reach the judge.

- Reuse the shared block's field names **verbatim** in the `<output_format>`
  restatement. This is the conservative reading of R3(c)'s "must appear"
  combined with R5's pin — a pin can only key on literal strings, and a pin
  whose strings drift from the block is not enforcement.
- Do not move the `<output_format>` / `</output_format>` tags; additions go
  between them.
- The `<output_format>` addition is Skeptic-specific prose and must not be
  copied into `owner.md` (that is why the drift pin brackets a slice, not the
  whole files).

## 5. The two pins (R5 shape constraints — the enforcement)

Both live in `test/prose.test.ts` and both are **red-first** on the pre-change
tree.

1. **Drift pin.** Read both seat bodies through the existing `councilMarkdown()`
   helper (`test/prose.test.ts:6-16`) / `PKG_ROOT`; slice each file's marked
   region by the `red-base-shared-start` / `red-base-shared-end` markers; assert
   `expect(ownerBlock).toEqual(skepticBlock)`. Style mirrors the `STEP3_FIXTURE`
   pin at `test/prose.test.ts:68-93`. Assert the start/end markers exist (a
   `-1` index is the red state before the block lands). Red until the block
   lands in both files; red again the moment one side is edited alone,
   including trailing-whitespace drift.
2. **Judge-reachability pin.** Whitespace-flatten `skeptic.md`
   (`text.replace(/\s+/g, " ")`, mirroring `test/prose.test.ts:337-342`),
   locate the `<output_format>` … `</output_format>` region, and require the
   seven field names, the comparison triple, and the head-half clause to appear
   **inside** that region — not merely somewhere in the file. Red while the
   vocabulary lives only in the shared block.

Neither pin proves a seat followed the convention on any card; that is step 9's
job. Both are inside the stack guard's scan, so the block and the
`<output_format>` addition must stay runner-neutral.

## 6. Out of scope — named boundaries (do not fold in)

- **No `council/agents/judge.md` change.** The judge's input is goal + Skeptic
  evidence only, by design; the vocabulary reaches it through
  `<output_format>`.
- **No `council/procedures/council.md` change.** In particular, do **not** fix
  the dead `docs/gates/GATE-EVIDENCE.md` reference at `council.md:238` — that is
  a separate residual, a candidate for a step-13 follow-up, and fixing it here
  is scope creep. Correspondingly, **never name `docs/gates/GATE-EVIDENCE.md` in
  the block** (R3 constraint 4): the per-file guard
  (`test/prose.test.ts:28-34`) does not catch a second naming.
- **No `council/procedures/features-deliver.md` change.**
- **No `council/validate.py` change**; no new card-body section; no structured
  artifact.
- **No `council/scaffold/` change.** The seats are packaged, so they travel to
  every consumer repo without a scaffold edit.
- **No `vault/` change.** The wiki is written only through `/wiki-ingest`; the
  step-14 offer stands (R6).
- **No new user-visible copy.**
- **Do not reinstate a three-class `redAttribution` field** (no `incidental`),
  and **do not add an owner-written mechanism-absent bit** (R1).
- **Do not silently fold in any `Backlog` residual** (e.g. FLLWUP-50/51/52) —
  they are not this card's `goal`.

## 7. What the owner must produce

- The marked shared block in `council/agents/owner.md` (near `<owner_mode>`) and
  `council/agents/skeptic.md` (near `<verify_by_acting>`), byte-identical
  between the markers.
- The field-vocabulary restatement inside `skeptic.md`'s `<output_format>`,
  reusing the block's field names verbatim.
- The two new pins in `test/prose.test.ts`, written red-first.
- A plan under `docs/superpowers/plans/` (e.g.
  `2026-09-17-FLLWUP-47-plan.md`), a branch in an isolated worktree, and a PR.

## 8. Gates

The owner clears its own agent's gates **in full, in order, no threshold
lowered, regardless of how small the change is**. On this repo that is (the
card's step-1 gate note; `docs/gates/GATE-EVIDENCE.md` does not exist here):

- `bunx tsc --noEmit`
- `bun test`
- `python3 council/validate.py`

`council/preflight.sh FLLWUP-47`'s branch-freshness clause (FLLWUP-27) is a
known-by-construction artifact once a facilitator record commit advances
`origin/main` past the branch cut; the step-11 re-run set is `tsc` / `bun test`
/ `validate.py`, and the FAIL is recorded verbatim, never reclassified and
never used to weaken a criterion. `COUNCIL_INTEGRATION=1` stays gated and is
not run. This repo defines no database/import/server gate.

## 9. Provenance

Deliberation record: `council/cards/FLLWUP-47.md` steps 1–6 — owner
`job-17.1/job-17.3`, principal `job-17.2/job-17.4`, skeptic `job-17.1` (O1–O8),
consolidator `job-17.2`; `product-owner` step-6 ruling `job-18`, recorded
verbatim in the card and at
`vault/raw/2026-09-17-po-fllwup47-step6-ruling.md`. Two record corrections
(O1/O2) applied at step 6, in the card's grounded-facts list. Wiki grounding:
[[council-runner]], [[product-owner]], [[gate-parity]], [[llm-wiki]],
[[main-repo-immutability]], [[deterministic-merge-check]]. Binding
instruments: the EPIC-9 steward ruling on EV-41 ("the base-commit red run is
recorded as evidence; no red test lands"); `test/prose.test.ts` guards;
`extensions/seats.ts:592-597`.