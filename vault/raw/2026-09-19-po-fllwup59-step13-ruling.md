---
slug: po-fllwup59-step13
card: FLLWUP-59
epic: EPIC-9
seat: product-owner
step: 13
date: 2026-09-19
kind: ruling
---

# FLLWUP-59 — product-owner step-13 ruling (follow-up draft confirmation)

Subject: the two step-13 drafts carried on `council/cards/FLLWUP-59.md`
(draft 1 "Wiki caveat precision"; draft 2 "Remaining truncated-history guard
classes"). Neither was written to `council/cards/`, per the pre-write gate.

Card state at ruling: `Done`, merged as
`e1b78017402788b976ffa055f0e5fcf594944a72` (PR #76, head `6579d68`), `gates`
`SUCCESS` on head and on the merged SHA. This ruling settles **only** the two
drafts' fate; it does not and cannot reopen a card whose five deterministic
merge criteria were observed and whose judge verdict was `PASS`.

Authority: the run-2 Phase-1 "Follow-ups (judgment row)" ruling
(`council/cards/EPIC-9.md:239-241`) re-homes `council.md` step 13's
draft-then-confirm gate to `product-owner`, "which confirms, edits, or drops
each follow-up draft before the card is written." A recorded human decision.
Dropping is the power that ruling assigns this seat, not one inferred here, so
neither disposition is the "declining a card outright" class that reaches
`steward`. Direct precedent for this exact turn:
`vault/raw/2026-09-18-po-fllwup56-step13-ruling.md` (R1 dropped a wiki-wording
draft and settled its meaning in the ruling; R2 dropped a documentation draft
and routed its content to a named ingest home).

---

## R1 — DRAFT 1 (wiki caveat precision): **dropped as a card; the item is confirmed and routed, with replacement text fixed here.**

### The fact, and why it is not cosmetics

`vault/wiki/retired-path-tokens.md` §"Red-base falsifier", field 6, caveat (a)
says that at `323abdc` the FLLWUP-55 `smoke/` driver "does not exist". It
exists: `smoke/search-smoke/driver.py` is in the base tree, with **pre-kit**
content (it does not yet `from pty_kit import`). So the transplanted witness's
tests 9–11 fail as **content assertions against a file that is there**, not as
missing-file errors.

The step-9 skeptic marked this non-blocking and got the classification right:
either way those reds are copy-set-dependent, not mechanism-absent, and the
red-base record's two-class boundary is unchanged. It is still not a cosmetic
edit, because field 6 of `[[red-base evidence]]` exists for exactly one
purpose — to let a later reader classify a base red — and a reader who is told
"the file does not exist" reasons from the wrong premise to reach the right
answer. A field whose job is classification-aiding should state the observable
truthfully.

### Disposition

**No card.** The item is confirmed as a **run-2 `/wiki-ingest` owed entry**,
to be recorded on `EPIC-9`'s residual-run-2 ledger alongside the run-1 list
(`council/cards/EPIC-9.md:186-193`, which names page + what is stale + the SHA
that made it stale — the same shape), and on this card's step-14 record.
`vault/wiki/` is never hand-edited by a seat or a card outside its own
spec-sanctioned page authoring (`council/procedures/council.md:341`;
`[[llm-wiki]]`), so a card for this sentence would have to re-author a page
this card already delivered — one round of the full loop, four gates and a
merge, for a clause the next ingest of the same material fixes for free.

### The replacement sentence (binds the ingest; use this wording)

> (a) at `323abdc` the `test/faux-provider/` station exists **and**
> `smoke/search-smoke/driver.py` exists with pre-kit content (it does not yet
> import `pty_kit`; FLLWUP-55 collapsed it later) — so the transplanted
> witness's tests 9–11 fail as content assertions on a file that is present,
> not as missing-file errors; either way copy-set-dependent, not
> mechanism-absent;

### Load-bearing warning for whoever runs the ingest

The imprecision did not originate in the wiki page. It originates in the card's
own design spec at
`docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md:180-181` ("…exists but
not the FLLWUP-55 `smoke/` driver"), which the page faithfully carried forward.
An ingest pass that re-derives the caveat from the spec will **re-import the
defect**. The owed entry must therefore carry this ruling file as its source,
not the spec. The spec is a point-in-time design record and is **not** to be
corrected retroactively.

### Rejected alternatives

- **Card it (FLLWUP-70 as drafted).** Loses: its only deliverable is an edit to
  a surface no card may hand-edit, and no test can state its acceptance
  criterion. FLLWUP-54 is the precedent for when a wiki item *does* earn a card
  — a human recorded the page as wanted scope (`council/cards/EPIC-9.md:216`).
  Nothing has recorded this, and `EPIC-10` / `EV-44` are the portfolio's stated
  correction against exactly this card-minting pattern.
- **Correct the spec file too.** Loses: specs are records of what was decided
  when; the citable surface a future reader reaches is the wiki page. Retro-editing
  the spec destroys the provenance of the very error this ruling documents.
- **Drop the item along with the card.** Loses on user value: the page is cited
  by the next red-base record, and the wrong premise propagates. Dropping the
  card while routing the content is the whole reason the two statements are
  separate here (FLLWUP-56 R2's shape).
- **Have the orchestrator hand-apply the one-line fix.** Loses: `council.md:341`
  forbids it, and a bypass of the ingest flow is a worse defect than the
  sentence it would fix.

---

## R2 — DRAFT 2 (remaining truncated-history guard classes): **dropped, as over-engineering for this property — with the residual kept named, reachable, and re-cardable on a stated trigger.**

### The argument I am weighing, and where it lands

The draft is honest about its own state: the canary's *design* is verified
against the real token set, and what is missing is **live reproduction** of
three more truncation recipes (`git replace`/grafted histories, archive
exports). Weighing mechanism against value:

1. **The untested classes are not untested branches.** All three converge on
   one assertion over one input: `assertFullRetirementHistory(retiredPaths,
   isShallow)` (`test/faux-provider-shape.test.ts:194-208`). The recipe that
   produced the truncation is not an input; the derived set is. The step-9
   skeptic already ran the *hard* case live — a `git filter-branch` truncation
   with `is-shallow` **false**, which is the case that actually needed proof,
   and it fired the named canary error (`closed-green`). `git replace` and a
   grafted history reach that same line with a smaller derived set. A falsifier
   card would convert three `open-untested` labels into three `closed-green`
   labels on a branch already proven by the only probe that could fail it.
2. **There is no silent-green surface left to find.** The archive-export class
   is a repo with no `.git`, and every read-only git call goes through
   `gitLinesOrThrow` (`:211-219`), which throws with a named cause on any error
   or non-zero status. Loud failure there is already structurally guaranteed,
   not assumed.
3. **The dangerous direction is already bounded by construction.** A truncation
   shallow enough to keep both canary targets still contains the FLLWUP-49
   deletions, hence everything at least that recent — so a canary-green partial
   history can only miss retirements *older* than the hand-maintained regex ever
   covered. That is strictly better than the card's base state, not a new
   exposure.
4. **A falsifier card's deliverable would be a record, not a mechanism.** The
   merged guard cannot be changed by a passing test, and `[[red-base evidence]]`
   forbids landing a red test. So the card ships prose. That prose already
   exists in three reachable places: this card's step-4 consolidation, the
   wiki page's "Named limitation" line, and this file.
5. **The cost is not free.** A permanent live probe for grafted/exported
   histories means a scratch-repo fixture inside `bun test`, against the ≈94 s
   envelope and its rule that any new arm states its own wall clock
   (`[[test-suite-budget]]`). Paying suite seconds to relabel an already-sound
   branch is the over-engineering the draft asked me to check for. It is.

### What keeps the residual from being silently accepted

The residual stays **named and reachable**, and this ruling makes three
dispositions concrete:

- **It stays a `named limitation`, not a claim of full coverage.** The owed
  `/wiki-ingest` entry from R1 must **keep** the page's "Named limitation"
  paragraph intact while fixing caveat (a). Polishing that page must not
  quietly promote "loud, not silent" into "verified against all truncation
  classes".
- **It is a pointer into the run's last live card, not a scope change.**
  `FLLWUP-58` (CI runaway backstop on the gates job, still `Backlog`, last in
  `steward`'s build order) edits the same file that carries the mechanism's CI
  substrate. The orchestrator carries this ruling as a named pointer in that
  runner's dispatch input, with one obligation: `fetch-depth: 0` on the
  `gates.yml` checkout step stays, and if any edit of that file introduces a
  non-full fetch depth the guard becomes load-bearing in CI. That is a
  cross-reference for the runner's step-1 context; `FLLWUP-58`'s `goal` is not
  amended, and the falsifier work is **not** folded into it (it is not needed
  to honestly meet that goal, so per `[[product-owner]]` Case 2 it would be a
  new card, not a fold-in — which is what this ruling declines to mint).
- **The re-card trigger is stated.** Card it, at the next decomposition, when
  *either* a workflow or consumer-facing path exists that fetches at a non-zero,
  non-full depth (making the canary rather than the shallow check the operative
  guard in CI), *or* any report of a silently-partial derived token set
  arrives. Absent one of those, there is no failing test to write first, and
  this repo's posture on battle-tested guards is "change behavior only with a
  failing test first" (AGENTS.md convention 7, applied by analogy).

### Rejected alternatives

- **Confirm as FLLWUP-70.** Loses on all five points above; it also pre-empts
  `EV-44`'s dedup-before-draft rule by minting a card whose content is a label
  change on a shipped guard.
- **Fold the falsifier into `FLLWUP-58`.** Loses the fold-in test: `FLLWUP-58`'s
  goal is a runaway-time backstop, and git-history falsifiers are not needed to
  meet it. Folding would be scope-shifting under a "no new card" appearance —
  the split-the-scope move this seat is told not to make.
- **Fold into `EPIC-10` / the harness line.** Loses: nothing on that epic is
  technically close to guard-coverage falsification; `EV-44` merges
  near-duplicates, not unrelated backlog.
- **Escalate to `steward` as a permanently-accepted residual.** Loses on the
  facts: the residual was already accepted as a *named limitation* by the
  deliberation this card records (step 4 consolidator, step 9 skeptic, step 10
  judge), the merge is done, and what I declined is an unfiled draft — a power
  the Phase-1 ruling assigns here. The residual is conditional, has a stated
  re-card trigger, and is reachable from the card, the wiki page and this file.
  Nothing permanent was decided, so nothing in the portfolio moved.

---

## What the runner / orchestrator does with this

1. **Write no cards.** No new `FLLWUP-` id is consumed; next free remains
   **`FLLWUP-70`** (`[[card-id-allocation]]`: ids are allocated by scanning
   `council/cards/` at fetched HEAD, never by memory of a draft not written).
2. Record on `FLLWUP-59` step 13 that **both drafts were dropped as cards by
   `product-owner`**, citing this file, with draft 1 confirmed as an ingest
   owed item and draft 2's re-card trigger carried in the record so the next
   decomposition reads it at the card, not only here.
3. Amend `FLLWUP-59` step 14: its "no further `/wiki-ingest` offering is needed
   from this card" stands for *new material* but is incomplete — the delivered
   page carries one known-imprecise clause. Record the owed entry with R1's
   replacement sentence and the spec-is-the-source-of-the-error warning.
4. Fold that owed entry into the run-2 ledger's `Owed to /wiki-ingest` list
   (run-1 precedent `EPIC-9.md:186`) so one ingest pass takes all of them.
5. Pass R2's `fetch-depth: 0` pointer into the `FLLWUP-58` dispatch input as a
   named constraint on that card's step-1 context. No goal amendment to any
   card.
6. Nothing in this ruling changes `vault/wiki/` or any file in the tree — by
   construction: this seat writes only `vault/raw/`.

## Grounding

- `council/cards/FLLWUP-59.md` — step 4 (`open-untested` disposition: "carry as
  a named limitation; flag for a later harness-hardening card if one exists"),
  step 9 (shallow + canary loud-fails both `closed-green`; the caveat-(a)
  observation, "classification unaffected"), step 13 (both drafts verbatim),
  step 14 (the page shipped in PR #76 with its index link).
- `council/cards/EPIC-9.md:209-241` — run-2 Phase-1 rulings (scope, R2 merge,
  R3 record push, follow-up confirmation re-homed to this seat, `steward`
  job-1 build order ending at `FLLWUP-58`); `EPIC-9.md:186-193` — the run-1
  owed-ingest list this item joins.
- `test/faux-provider-shape.test.ts:194-233, 363-379` — the composed guard,
  `gitLinesOrThrow`, and the shipped pure probes.
- `vault/wiki/retired-path-tokens.md`; `vault/wiki/red-base-evidence.md` (field
  6's purpose and the two-class boundary); `vault/wiki/test-suite-budget.md`
  (new-arm cost rule); `vault/wiki/product-owner.md` (Cases 1–2);
  `vault/wiki/llm-wiki.md` (raw → wiki is the only authoring path);
  `vault/wiki/card-id-allocation.md`.
- `council/procedures/council.md` §13–§14 (draft-then-confirm; `vault/`
  hand-edit prohibition); `council/procedures/wiki-ingest.md` (ingest reads a
  `vault/raw/` source); `council/procedures/features-deliver.md` Phase 3.
- `council/cards/{EV-44,EPIC-10,EV-46,FLLWUP-68,FLLWUP-69}.md` — the
  merge-before-draft posture and the step-13 precedent for a card earned only
  by a cold-read claim a *person-facing* prediction still owes.
- `docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md:176-185` — the source
  of caveat (a)'s imprecision.
- `vault/raw/2026-09-18-po-fllwup56-step13-ruling.md` — the same-turn precedent
  for both dispositions taken here.

## Reversibility, end-to-end

Cheap, and asymmetric in the safe direction.

- **R1**: nothing moves. If the routing is wrong (the ingest pass declines the
  offer), the correct next move is one drafted card at the next decomposition
  with this file as its grounding — a temporary residual, no `steward`
  ratification needed. If the replacement sentence itself turns out wrong, the
  next ingest corrects it; raw files are not deleted, so the lineage stays
  readable.
- **R2**: dropping a card unwinds nothing. If the guard proves weaker than
  argued — the trigger is stated above — `FLLWUP-70` is then free for the
  falsifier card this ruling declined to mint, and the mechanism it would test
  is already shipped, so no retraction of delivered work is implicated.
- Neither disposition reopens `FLLWUP-59`, touches `vault/wiki/`, or alters a
  recorded human decision.
