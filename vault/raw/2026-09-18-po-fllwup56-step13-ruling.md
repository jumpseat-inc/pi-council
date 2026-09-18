---
slug: po-fllwup56-step13
card: FLLWUP-56
epic: EPIC-9
seat: product-owner
step: 13
date: 2026-09-18
---

# FLLWUP-56 — product-owner step-13 ruling (follow-up draft confirmation)

Subject: the two step-13 drafts carried on `council/cards/FLLWUP-56.md`
("DRAFT A (not written) — the live arm's header expectation vs measured",
next free id `FLLWUP-70`; "DRAFT B (not written) — pi's project-extension
discovery and jiti loader semantics", `FLLWUP-71`). Neither draft was
written to `council/cards/`, per the pre-write gate.

Card state at ruling: `Done`, merged as `6adbfa697f07cd4964e1d2d285a909c070eb1c5d`
with green `gates` CI on the merged SHA (first attempt; the FLLWUP-63 EV-40
jitter flake did not recur). This ruling therefore settles **only** the two
drafts' fate; it cannot and does not reopen the card, whose five deterministic
merge criteria were observed and whose judge verdict was `PASS`.

Authority: the run-2 Phase-1 ruling "Follow-ups (judgment row)"
(`council/cards/EPIC-9.md:239-241`) re-homes `council.md` step 13's
draft-then-confirm gate to `product-owner`, "which confirms, edits, or drops
each follow-up draft before the card is written." A recorded human decision.
Dropping is the power I am exercising, not one I am inferring — so this is
not the "declining a card outright" class that reaches `steward`: nothing here
declines a card a human or a run has already filed. Run-2 precedent for both
halves of the call: `FLLWUP-51` step 13 filed a draft under a PO ruling;
`FLLWUP-55` step 13 dropped candidates with reasons.

---

## R1 — DRAFT A (`FLLWUP-70`): **dropped as a card; the ambiguity it names is settled here, as a clarification of the standing rule.**

The draft's own goal offered a disjunction — "the header carries the measured
band **or** the wiki page's standing rule is amended to say which figure the
header must carry." The second half of that disjunction is a ruling about what
an existing rule means, and it is mine to make. Making it here empties the
card: there is no deliverable left that is not either a copy edit of a header
that is already correct under the clarified rule, or a sentence in a wiki page
that only `/wiki-ingest` may touch.

### The settled clarification

The standing rule is FLLWUP-48 ruling item 1 plus
`vault/wiki/test-suite-budget.md` rule 1 ("Any new live arm must state its
expected wall clock and its ceiling in its test header"). Read together, they
mean:

1. **A live arm's header carries the design-time expected wall clock plus its
   ceiling.** Both figures are what the design knew at the moment the header
   was written: an estimate of cost and an emergency bound. The header is not
   a measurement record and is not rewritten by the implementing pass.
2. **The measured cost figure has exactly one authoritative home:
   `vault/wiki/test-suite-budget.md`'s per-file row** (with the suite total
   and its provenance in the same page's measured-envelope section, mirrored
   to `README.md` and `AGENTS.md`). A per-arm number stated anywhere else is
   a restatement, not a source.
3. **A header estimate beaten by measurement is not a defect.** It is an
   estimate that was wrong, in the safe direction: `test/ev41-seat-child-live.test.ts`
   stated ≈18–30s and measured 5.96s (~4× **under**), so the risk it carries
   is that the suite looks more expensive than it is — never that anyone
   under-budgets it. The Skeptic's step-9 O9 reached the same verdict
   ("not a defect"); the step-10 judge carried it as non-blocking.

Under this reading the shipped state is already correct: the header repeats
the spec's figure verbatim per rule 1, and the wiki's per-file row carries the
true measured figure (5.9s). No file changes as a result of R1.

### Options rejected

- **Card it as drafted, then pick branch (a) — rewrite the header to the
  measured band.** Loses twice: it creates a second authoritative home for a
  figure that already has one (the per-file row), so the next re-measurement
  has two sites to update and will update one; and it puts a decaying number
  in a test header — the same class of artifact FLLWUP-48 fixed
  non-decaying at `AGENTS.md:17` ("the count is removed, not refreshed").
- **Card it as drafted, then pick branch (b) — amend the standing rule.**
  Loses: the amendment *is* the clarification above, and a ruling is not a
  card. Filed as a card, its goal would be "edit one sentence in a wiki page
  that no card may hand-edit," which is a work item with no falsifier.
- **Approve as drafted (leave the disjunction open for the implementer).**
  Loses: a card whose goal is "either update the copy or decide what the rule
  means" has not decided anything, and the deciding is this seat's job, not a
  future owner's. Splitting the scope to keep the card alive would also be
  exactly the half-settlement this seat forbids.
- **File it as cheap insurance.** Loses: no test can state its acceptance
  criterion (a 4×-off estimate is not a failure condition), so it joins the
  backlog as an item every future run must re-triage — cost with no mechanism
  behind it.

### Grounding for R1

- `vault/wiki/test-suite-budget.md` — standing rules 1 and 4 ("Budget ≠
  ceiling"; a ceiling is an emergency bound, never written into the
  envelope); the per-file table row for `test/ev41-seat-child-live.test.ts`
  (2 arms, measured 5.9s) at `ad96c4f`; 180s as drift threshold, not budget.
- `vault/raw/2026-09-19-po-fllwup48-test-suite-budget.md` ruling item 1 — the
  figure is the implementing pass's measurement **with provenance**,
  descriptive of one machine, not normative; the drift threshold is the
  maintained invariant. Item 1's "the count is removed, not refreshed"
  reasoning (via FLLWUP-48's `AGENTS.md:17` branch) is the decay argument
  reused here.
- `council/cards/FLLWUP-56.md` step 9 O9 (expected ≈18–30s vs measured 5.96s;
  "not a defect"; the wiki row carries the true measured figure) and step 10
  (judge `PASS`, overstatement explicitly non-blocking).
- `vault/wiki/product-owner.md` Cases §1 (rule for one design; do not split
  scope to half-settle) — applied in the negative here: the disjunction is
  resolved to a meaning, not divided into two cards.

### Reversibility for R1

No artifact moves, so nothing unwinds. If the clarification turns out to be
the wrong reading of FLLWUP-48 rule 1, the cost is one header edit (put the
measured band in `test/ev41-seat-child-live.test.ts`'s header) plus one
sentence in the wiki page, delivered through `/wiki-ingest`; and a
superseding ruling, written as a **new** raw file (raw is immutable), pointing
at this one. Raw docs are not deleted, so the lineage stays readable either
way.

---

## R2 — DRAFT B (`FLLWUP-71`): **dropped as a card; both findings routed to this card's step-14 `/wiki-ingest` offer, each with a named home.**

The draft's goal — the two pi-runtime mechanism findings "are documented in
one place … that future test-shim authors will find" — is a real user value,
and I am not dropping it. I am dropping the **card**, because the place that
documentation belongs already exists and the flow that writes it has already
been offered by this card at step 14. A card would either hand-edit
`vault/wiki/` (forbidden: "Never hand-edit anything under `vault/` yourself;
that bypasses the process that turns raw material into something the Council
can actually cite") or re-create `/wiki-ingest` one step later under a
different name.

The drop is only defensible if the content is routed with a home named, so it
is named at page-and-section granularity below. **The route binds the step-14
offer's content, not the ingest flow's editorial placement.**

### Route 1 — the mechanism finding → `vault/wiki/headless-pi.md`

What the page's "Distinct rules" project-trust bullet must gain: **project
extension auto-discovery is not `-a`-gated.** `-a`/`--approve` answers the
trust question for one run; it is not the switch that turns project-local
extension loading on and off. A print-mode parent loads its cwd's
`.pi/extensions` on its own, so a scratch-repo shim placed there to reach a
seat child is **also** loaded by the parent — which means such a shim must
gate itself on the child discriminator (`--session-id` in `process.argv`) and
be a no-op otherwise, and the guard is load-bearing, not cosmetic.

Evidence the ingest should carry: the implementing dispatch (`job-23.10`)'s
mechanism finding, and the Skeptic's step-9 O5, which proved it empirically
(a parent-branch-only marker in a shim variant read `"loaded"` after a green
treatment run; the parent's own run unaffected). The finding also explains why
this card's arm needed no engine change — the same rule that makes the shim
reachable from the child reaches it from the parent.

### Route 2 — the loader finding → `vault/wiki/council-theme.md` §"Locating pi's theme module (v0.12.1 fix)"

That section already documents the one thing this finding is an instance of:
pi's extension loading goes through jiti, whose remap covers the bare
specifier, while `import.meta.resolve` bypasses it and walks real
`node_modules` — the asymmetry behind the v0.12.1 silent-never-activated
failure (`vault/wiki/sources/2026-08-26-theme-module-resolution-fix.md`). FLLWUP-56
found the other face of the same asymmetry and belongs beside it:

**A nested `require()` inside a jiti-transformed extension re-resolves through
jiti's synchronous pipeline, where a file-valued alias prefix-matches a
subpath and mis-resolves** (`pi-ai/dist/compat.js/utils/uuid`, observed live
in this card's first shim attempt); **`await import()` bypasses that pipeline
and resolves correctly**, which is why the shipped shim is a dynamic-import
shim and fallback B (byte-copy) was never needed. The rule of thumb for a
future test-shim author: inside a jiti-transformed extension, prefer dynamic
`await import()` over a nested `require()` of an aliased package's subpath;
and — pairing with route 1 — prefer an env write **before** the dynamic import
over a static re-export, since ESM evaluates dependencies before the module
body (step 4 O5, `closed-green`).

The alternative home for this one is `headless-pi` too, or a short
"extension loading" note wherever the ingest flow keeps jiti/remap material;
the value is that the finding sits with the mechanism that explains it, not
that it lands in the specific page I named. The named page is a preference the
ingest may overrule; the requirement is that it is filed, near its family.

### Options rejected

- **Approve DRAFT B as drafted.** Loses: its entire deliverable is a wiki
  edit, and `[[llm-wiki]]`/step 14 make `/wiki-ingest` the only authoring
  path for `vault/wiki/`. `FLLWUP-54` is the precedent for when an ingest
  *does* want to be a card — when a human records the page as wanted scope
  (run-2 Phase-1: "`FLLWUP-54` is in scope and is delivered — the optional
  wiki page is wanted"). Nothing has recorded this as wanted scope; the offer
  has not been declined yet, and a card before the offer is inverted process.
- **Split into two cards, one per finding.** Loses: two cards, two dispatch
  chains, and 12 seat jobs' worth of ceremony to place two sentences in two
  pages the ingest flow visits anyway.
- **Fold into FLLWUP-56.** Loses on the fold-in test: the card's `goal` is the
  falsifier plus its budget accounting, both met and merged; wiki
  documentation of pi's loader behaviour is not needed to honestly meet that
  goal, so it is a new card by definition — and a new card is what I am
  declining to mint when a step-14 offer exists (same shape as FLLWUP-47 R6:
  documentation is a standing offer, not a fold-in).
- **Drop the content along with the card.** Loses on user value: this is
  precisely the class of knowledge a scratch-repo-harness author needs and
  will not find — the current record holds it in three local places (the
  shim's comments, this card's steps 8/9/13/14, PR #75's body) that no future
  author searching for "why doesn't my shim load" will reach. Dropping the
  card while keeping the content is the whole reason the two statements are
  separate in this ruling.

### Grounding for R2

- `council/cards/FLLWUP-56.md` — step 8 (`job-23.10`'s mechanism finding and
  the nested-`require()`/jiti root cause), step 9 O5/O6/O8, step 13 DRAFT B
  text, step 14's two offered items verbatim.
- `council/procedures/council.md` §13 (draft-then-confirm is the gate) and §14
  (the `/wiki-ingest` standing offer; no hand-editing `vault/`).
- `vault/wiki/headless-pi.md` — "Distinct rules" (no trust prompt;
  `--approve`/`-a`; single-shot teardown) — the bullet route 1 refines, and
  the page EPIC-9's ingest already updated with print-mode behaviour, so it is
  the live home for print-mode rules.
- `vault/wiki/council-theme.md` §"Locating pi's theme module (v0.12.1 fix)" +
  `vault/wiki/sources/2026-08-26-theme-module-resolution-fix.md` — the
  existing jiti-remap asymmetry record route 2 extends.
- `vault/wiki/llm-wiki.md` — raw → wiki is the only authoring path;
  `vault/wiki/product-owner.md` Cases §2 (the fold-in test) and the
  FLLWUP-47 R6 precedent this ruling mirrors.
- `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md` R6 — the lineage for
  "a wiki page documents, therefore it is an offer, not a deliverable," and
  the reason the FLLWUP-47 case was later carded only once the human put the
  page in scope (`FLLWUP-54`).

### Reversibility for R2

Cheap and asymmetric in the safe direction. The findings cannot be lost —
they are recorded verbatim in the card (steps 8, 9, 13, 14), in PR #75, and
in this file. If the orchestrator's step-14 pass does not take the offer, the
correct next move is one drafted card at the next decomposition with this
ruling as its grounding, and that is a **temporary** residual, not a
permanent one — no `steward` ratification is needed for it. If the findings
turn out to be narrower than generalised (e.g. jiti's behaviour differs on a
pi upgrade), the wiki sentences are corrected by the next ingest, not by a
re-ruling.

---

## What the runner / orchestrator does with this

1. **Write no cards.** `FLLWUP-70` and `FLLWUP-71` are not consumed; next
   free `FLLWUP-` id remains `FLLWUP-70` (`[[card-id-allocation]]`: ids are
   allocated by scanning `council/cards/` at fetched HEAD, never by memory of
   a draft that was not written).
2. Record on `FLLWUP-56` step 13 that both drafts were **dropped** by
   `product-owner`, citing this file, with the standing-rule clarification
   (R1's three clauses) carried in the record so the next arm's author reads
   it at the card, not only at the wiki.
3. Pass the step-14 offer onward **with the two named homes** (R2's routes)
   so the ingest has a target rather than a hint.
4. Nothing in this ruling changes `vault/wiki/` — by construction: I write
   only `vault/raw/`.

## Why none of this reaches `steward`

Checked against the portfolio criteria:

- **Declining a card outright** — no card is declined. Two unapproved drafts
  are dropped, which is the power a recorded human decision assigned to this
  seat, pre-write, for this run.
- **Permanently accepting a residual** — no. Both findings are routed to a
  live step-14 offer, and R2 names what happens if the offer goes untaken.
- **Touching a recorded human decision** — no. FLLWUP-48 ruling item 1 stands
  unamended; R1 states what it means. The Phase-1 run-2 scope rulings, R2
  (merge) and R3 (record push) are neither re-asked nor reweighed.
- **A `goal` that is itself the defect** — no. The card's `goal` was met and
  judged `PASS`; `FLLWUP-70`'s draft goal was a question about an existing
  rule, and existing rules are ruled on, not carded.

## Sources

- `council/cards/FLLWUP-56.md` — `goal`, Intent, steps 1–14 (the two drafts,
  the Skeptic's O1–O10 and step-9 O1–O9, the judge's PASS, the step-14 offer)
- `council/cards/EPIC-9.md` — run-2 Phase-1 rulings, incl. "Follow-ups
  (judgment row)" re-homing step-13 confirmation to `product-owner`, and the
  `FLLWUP-54` "the optional wiki page is wanted" scope record
- `council/procedures/council.md` §13–§14; `council/procedures/features-deliver.md`
  (authority map; the Phase 3 report duty for drafts "drafted and confirmed
  before it's written")
- `vault/wiki/test-suite-budget.md` — measured envelope (101.2s at `ad96c4f`),
  per-file table incl. the 5.9s row, ceiling-vs-budget, standing rules 1–4
- `vault/wiki/headless-pi.md`, `vault/wiki/council-theme.md`,
  `vault/wiki/sources/2026-08-26-theme-module-resolution-fix.md` — the two
  route targets and the existing jiti asymmetry record
- `vault/wiki/product-owner.md`, `vault/wiki/red-base-evidence.md`,
  `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md` (R6) — the fold-in /
  standing-offer precedent
- `vault/raw/2026-09-19-po-fllwup48-test-suite-budget.md` — the ruling whose
  item 1 R1 clarifies
- `vault/wiki/{engineering-board,llm-wiki,card-id-allocation,main-repo-immutability}.md`
  — board mechanics, the wiki authoring path, id allocation, worktree-only
  execution
- `council/cards/{FLLWUP-51,FLLWUP-55}.md` step-13 records — run-2 precedent
  for a PO-confirmed filing and a PO drop

## Reversibility, end-to-end

Both rulings are additive to the record and subtractive from nothing: no file
in the tree changes, no card is written, no wiki page is edited, and the
merged deliverable (`6adbfa6`) is untouched. The most either can cost is a
one-line header edit (if R1's reading is wrong) or one drafted card at the
next decomposition (if R2's offer goes untaken). Both are cheap, both are
reversible by the next holder of this seat with a new raw file, and neither
requires `steward`.
