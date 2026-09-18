---
title: Red-Base Evidence
type: concept
summary: The convention fixing what a falsifier's red-at-base evidence record must contain (seven fields) and how records are compared across cards (the comparison triple gates count comparison; the mechanism-absent boundary is skeptic-derived, never owner-written).
aliases: ["red-at-base evidence", "red-base convention"]
tags: [pi-council/concept, pi-council/process, pi-council/epic9]
sources: ["[[2026-09-17-po-fllwup47-step6-ruling]]"]
created: 2026-09-18
updated: 2026-09-18
---

# Red-Base Evidence

A falsifier that must start red — but cannot land red through the merge gate
([[deterministic-merge-check]]) — is recorded by running it against the
pre-mechanism base in a worktree and observing red there, then green at the
head. The record is the evidence. The convention is normative packaged seat
prose, byte-identical between `council/agents/owner.md` (adjacent to
`<owner_mode>`) and `council/agents/skeptic.md` (adjacent to
`<verify_by_acting>`/`<output_format>`), bracketed by
`<!-- red-base-shared-start/end -->` markers and pinned by two
`test/prose.test.ts` tests (a byte-identity drift pin on the marked slice, and
a whitespace-flattened judge-reachability pin requiring the field vocabulary
inside `skeptic.md`'s `<output_format>`). The wiki page documents it; it does
not carry the obligation — the seat prose does ([[llm-wiki]]: grounding prose,
not normative).

## The seven required fields

1. **Base identity** — the full 40-hex sha, plus one sentence naming the
   base-selection rule it satisfies (e.g. "the commit immediately preceding
   the epic's first mechanism merge"), plus the base role: `required` or
   `optional-second`. A record that does not say which role it is cannot be
   compared across cards.
2. **Transplant identity** — the enumerated file list materialized into the
   base worktree that does not exist at the base sha, plus the source head sha
   it was copied from. At base the falsifier does not exist; it is a
   transplant, and an unrecorded transplant is an unrecorded experiment.
3. **Exact command** — the repo's test command, quoted verbatim as invoked;
   the same command applies to both halves of the pair; stack-neutral phrasing.
4. **Raw red output** — verbatim: the runner's own counts (pass / fail /
   error / skip) and every per-failure line, never paraphrased. Counts alone
   are not checkable; the per-failure lines are what a reader derives the
   mechanism-absent boundary from.
5. **Worktree provenance** — a detached checkout at the base sha in a separate
   worktree; the main checkout is never touched ([[main-repo immutability]]);
   the worktree is removed after the run.
6. **Copy set** — everything placed in the base worktree beyond the transplant
   itself, or the affirmative statement "bare copy". When two records' copy
   sets differ, their numbers were never the same experiment.
7. **Head half** — the head sha, the same exact command verbatim, and
   `0 fail`. The pair — red at base, green at head — is the obligation; no red
   test lands. (The head half replaced an earlier "landing statement"
   clause — see [[deterministic-merge-check]]; the merge gate already
   enforces that obligation, and the convention does not double-enforce it.)

## The comparison triple and its rule

The comparison triple is `(base sha, transplant identity, exact command)`.

- **Equal triple** → counts must reproduce exactly; non-reproduction is a
  defect in one of the two records.
- **Differing triple** → counts are never compared as numbers; the comparison
  first checks triple equality, and across differing triples the surviving
  claim is "red observed at base" plus the reader-derived mechanism-absent set.

If the base tree lacks a path the transplant references, the record must state
that at recording time; its counts are copy-set- or transplant-qualified from
the start and may never be presented as a base measurement of the mechanism.
Across cards, raw red counts are never aggregated; the surviving cross-card
assertions are that a required-base record exists with all seven fields, it
carries at least one mechanism-absent red, and its head half is `0 fail`.

## The mechanism-absent boundary — skeptic-derived, never owner-written

The two-class boundary between **copy-set-dependent reds** and
**mechanism-absent reds** is derived at verification time from the raw red
output's per-failure lines, the transplant identity, and the base identity. A
red whose per-failure error text names an artifact inside the copy set is
copy-set-dependent: it demonstrates nothing about the mechanism under test. A
red whose error text names an artifact of the mechanism under test that is
absent at base is the base-native red sought: the mechanism-absent class. Two
classes only — no third class is defined (a proposed three-class
`redAttribution` field with an `incidental` bucket was rejected in the
FLLWUP-47 step-6 ruling: it has no operational definition). The derived result
is carried in the skeptic's evidence row — the owner's record provides the raw
material but never the per-failure classification.

The placement logic is [[gate-parity]]: enforce at the surface — the skeptic's
reproduction — not at persistence. A required owner-written classification
field would be writer-only strictness with no matching runtime gate.

## The EV-41 causal-story correction

The convention's founding case is EV-41 (EPIC-9's end-to-end falsifier). The
recorded `7 fail / 1 error` was first explained as "copy depth of
`test/ev40-harness/`" — that explanation is **known-wrong**. Per the
Skeptic's transplant table (FLLWUP-47 step 4), the six extra fails come from
head `test/stub-child.test.ts` running against base `test/stub-child.ts`
(which lacks the `flaky`/`finish_error` modes), enabled by an unrecorded
`extensions/retry.ts` transplant; `test/ev40-harness/` and `ev41-tui.py` are
inert in that configuration (removing them leaves the count identical). The
recorded number *is* reproducible at base `3e39e66` with transplant set
`{extensions/retry.ts, test/stub-child.test.ts, test/ev41-retry-e2e.test.ts}`
(all from EV-41 head `0330274`), keeping the base `test/stub-child.ts`:
`733 pass / 2 skip / 7 fail / 1 error`, exact. The lesson the convention
encodes: an unrecorded transplant set means no author could have classified
the reds correctly after the fact — field 2 exists so the next record is.

## Lineage

Wiki-ingest was declined at EPIC-9's step-13 gate (2026-09-16), re-offered as
a separate follow-up at FLLWUP-47 R6 (2026-09-17), confirmed by
`product-owner` job-20, and executed by FLLWUP-54. The decline stands as
recorded on the EPIC-9 ledger; R6's clarification is that the earlier decline
was not a standing decline — the offer was simply kept, and this card is its
exercise.

## Related

- [[owner]] — writes the record; a missing required field is an incomplete
  gate result
- [[skeptic]] — derives the two-class boundary and carries it in the evidence
  row; compares counts only after checking comparability
- [[deterministic-merge-check]] — the merge gate that makes "cannot land red"
  true, and the head-half/not-landing-statement ruling
- [[gate-parity]] — why the boundary is enforced at reproduction, not
  persistence
- [[main-repo immutability]] — field 5's worktree-only requirement
- [[product-owner]] — the step-6 ruling that settled the open-judgment items
- [[llm-wiki]] — this page is grounding prose; the normative surface is the
  seat bodies

## Sources

- [[2026-09-17-po-fllwup47-step6-ruling]]
- `council/agents/owner.md` / `council/agents/skeptic.md` — the
  `<!-- red-base-shared-start/end -->` block
- `test/prose.test.ts` — the drift and judge-reachability pins
