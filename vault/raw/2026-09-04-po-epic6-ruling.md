# Product-owner ruling — EPIC-6 `/council-models` model-name search filter (wave 3)

Run: `/features-new` decomposition of the human's intake ("there are so many
models to choose from when we use a provider like Openrouter for the
`/council-models` command. Can we add a `/` in the model selection modal
window to search/filter model names to make it easier to select models
please? When `/` is pressed, the top row should change or render below the
top row an input text with the cursor focused there. Pressing `Esc` from the
search input removes the search input text. I want this to be EPIC-6 and I
want all follow ups or cards from EPIC-5 that hasn't been worked on yet (in
Backlog or Ready) to be reassigned to EPIC-6."). Three-wave deliberation per
[[three-wave-decomposition]]: wave-1 principal (Reframe + child goals),
wave-2 skeptic + designer in parallel, wave-3 product-owner (this ruling,
unconditional last).

Source: facilitator-assembled disagreement ledger D1–D10 + EPIC-6 child
drafts as waved by principal. References to vault wiki and recorded rulings
cited inline.

## Surface

The `/council-models` model-selection modal (the level-2 cascade of
`ModelPicker` in `extensions/model-picker.ts`) gains a `/`-triggered focused
search input below the top row that filters the visible model rows by
case-insensitive substring on `qualifiedId` as the user types. Pressing Esc
with focus in the search input clears its text; pressing Esc elsewhere at
the model level ascends to the provider level unchanged.

The surface remains token-only (per AGENTS.md 9.6 and
[[council-theme]]) and respects the ruled-copy set binding
([[council-models-picker]]): the R-1 header
`council models — pick a model per seat` is byte-exact; the four-footer
exhaustiveness rule (`footerFor(level)` returning one of three strings at
`extensions/model-picker.ts:60-65`) is intact; the R-4#1 and R-4#2 empty
states remain the only ruled empty-state strings, and any new no-match copy
on this card escalates to the human at the Phase-1 ruling gate (see ruling
B-6 below). `resolveSelection()` and the confirm-echo pipeline are
byte-verbatim unchanged: a selected filtered row still emits the catalogue's
`qualifiedId` plus thinking level exactly as before.

## Epic goal (final, binding)

> The `/council-models` model selection modal gains a `/`-triggered focused
> search input below the top row that filters the visible model rows by
> case-insensitive substring on `qualifiedId` as the user types, and
> pressing Esc with focus in the search input clears its text.

## EPIC-1 — Epic-goal Esc ambiguity (skeptic closed-red, ruled)

The wave-1 epic goal ended "Esc removes the search input text," which the
skeptic read as three different observable behaviors (clear-text,
dismiss-input, exit-search). The intake literal — "Pressing `Esc` from the
search input removes the search input text" — names one behavior with two
constraints: the action is on the input's text (not the input's existence),
and the trigger is from inside the input. Ruled: clear-text-when-focused,
with the existing model-level Esc ascend preserved elsewhere on level 2.

### Options rejected

- *Clear-and-dismiss-input.* Not the literal read; collides with model-level
  Esc ascend.
- *Clear-and-exit-search.* Same collision; one key carrying two meanings
  depending on focus state is exactly the multi-meaning problem the skeptic
  named, in the opposite direction.

### Grounding

Human intake verbatim; `extensions/model-picker.ts:257-262` (existing
model-level Esc ascend); [[council-models-picker]] ruled-copy set.

### Reversibility

Low. Single sentence replace.

## A-1 — Child A `state` (skeptic closed-red vs principal/designer Ready)

The wave-1 artifact documented four open items under "Open for wave 2":
match field, match algorithm, suffix handling, identity preservation. All
four are pinned by ruling here, not deferred, so Child A's contract is
fully deterministic and the Ready-vs-Backlog bar is met.

1. **Match field:** `qualifiedId` only. Display `name` is not rendered in
   the modal; matching an invisible field would make rows vanish under a
   query the user cannot read on screen.
2. **Match algorithm:** case-insensitive substring on `qualifiedId`.
   "Filter" implies substring (intake literal); case-insensitive is the
   only sensible default for an OpenRouter catalogue.
3. **Suffix handling:** filter *before* the `:level` suffix is rendered.
   The suffix is a render-time decoration from `modelRow()` at
   `extensions/model-picker.ts:96`; a query like `":off"` must not match
   suffixes.
4. **Identity preservation:** the filter must return the same `PickRow`
   references so `resolveSelection()` stays byte-verbatim
   (`extensions/model-picker.ts:266-275`).

**Ruling:** Child A `state: Ready`.

### Options rejected

- *Matching display `name` in addition to `qualifiedId`* (principal's open
  question). Display name is not rendered. Rejected.
- *Prefix matching* (designer preference, ranked last per
  [[designer]] "Preferences, ranked last"). The intake says "filter."
  Rejected.
- *Backlog state* (skeptic closed-red). Once the four items are pinned,
  the contract is fully deterministic. Rejected.

### Grounding

`extensions/model-picker.ts:79-87` (`rowsForProvider` output contract);
`extensions/model-picker.ts:266-275` (`resolveSelection` byte-verbatim
constraint); [[council-models-picker]] (J-2 cross-product rule, EV-23
precedent for pure-unit extraction); human intake verbatim.

### Reversibility

Low. Pure-function contract; one unit test.

## A-2 / A-3 — Child A match-field and match-algorithm (open disputes, ruled)

A-2: match field = `qualifiedId` only. Dissent named: principal opened the
question; designer's argument wins.

A-3: match algorithm = case-insensitive substring. Dissent named: designer
preferred prefix (taste, ranked last); intake's word "filter" wins.

### Grounding

Same as A-1.

### Reversibility

Trivial — one-line field set and one-line comparison function.

## B-1 — Child B goal Esc clause (skeptic closed-red vs designer clear-and-stay)

The intake literal — "Pressing `Esc` from the search input removes the
search input text" — names two constraints on Esc: the action is on the
input's text (not its existence), and the trigger is from inside the
input. Designer's clear-and-stay is the literal read.

**Ruling:** Esc with focus in the search input clears its text and keeps
the input focused. Esc elsewhere at the model level ascends to the
provider level unchanged (existing `extensions/model-picker.ts:257-262`
behavior preserved).

### Options rejected

- *Clear-and-dismiss-input.* Not the literal read; collides with
  model-level Esc.
- *Clear-and-exit-search.* Same collision, same multi-meaning-single-key
  problem.

### Grounding

Intake literal; `extensions/model-picker.ts:257-262`; [[echo-then-run]].

### Reversibility

Low. Single sentence replace.

## B-2 — Child B input placement (open dispute, ruled)

The intake offered two options: "the top row should change or render below
the top row." Ruled: render below the top row.

1. **R-1 header invariant preserved** — `HEADER = "council models — pick a
   model per seat"` is the ruled byte-exact header
   (`extensions/model-picker.ts:43`); replacing it with an input renders a
   third case the ruled-copy set does not cover.
2. **No third render branch** — the modal currently has exactly two
   branches at level 2 (rows present, rows empty per R-4#2). Adding an
   "input replaces header" branch introduces a third case the existing
   tests do not cover; "below the top row" is a clean two-element addition
   to the existing render path.
3. **Four-footer exhaustiveness rule still binds** — `footerFor(level)`
   returns one of three strings; the search row is not a footer, and the
   input row carries its own affordance hint naming the `/` trigger.

### Dissent

Principal offered this as an open option in wave 1.

### Grounding

`extensions/model-picker.ts:43-46,55-65`; [[council-models-picker]] ruled-copy
set; intake verbatim.

### Reversibility

Trivial — render-path edit.

## B-3 — Child B focus signifier (open dispute, ruled)

**Ruling:** U+258C (`▌`) at column 0 of the search-input row. EV-8's
hard-rule precedent (`vault/raw/2026-08-26-po-ev8-ruling.md` ruling 3:
"Renders as one column even at narrow widths; no direction connotation;
selected-row signifier per design"), applied by analogy to the search-input
focus row. The card's `Intent` will name the signifier.

### Options rejected

- *No signifier.* Focus without a signifier is invisible; the EV-8
  precedent exists for exactly this reason.
- *A different glyph.* No grounded case; ▌ is the precedent on a sibling
  surface and reuses the council UI vocabulary.

### Grounding

`vault/raw/2026-08-26-po-ev8-ruling.md` ruling 3; intake literal.

### Reversibility

Trivial — one character.

## B-4 — Child B `/` typeable inside the input (open dispute, ruled)

**Ruling:** `/` MUST be typeable inside the input. Capture by construction:
the input handler is reached after `/` has opened search mode; within
search mode, every printable character appends to the query. `qualifiedId`
values contain `/` (e.g. `openrouter/anthropic/claude-3.5-sonnet`), and
searching by provider namespace is the most common pattern. The trigger
key and the query character are the same character — handled by ordering,
not by exclusion.

### Grounding

Intake verbatim; [[council-models-picker]] `qualifiedId = ${provider}/${id}`
shape.

### Reversibility

Trivial — handler order edit.

## B-5 — Child B `state` (principal Backlog vs designer Ready, ruled)

**Ruling:** `Ready`. With B-1..B-4 plus B-6, the contract is fully
specified and the Council can deliberate on Child B without further
clarification.

### Dissent

Principal drafted Backlog on the grounds the intake offered two
placement options and three Esc readings; both are now ruled.

### Grounding

All rulings B-1..B-6; `council/procedures/features-new.md` Ready-vs-Backlog
bar.

### Reversibility

Low — state flip.

## B-6 — No-match copy (designer observation, escalation to Phase 1)

**Ruling:** the exact copy text is a Phase-1 ruling for the run, not a
ruling I make from this seat. The card ships with an empty list + dim
styling no-match state at level 2 (mirroring R-4#2's structural shape),
and the specific copy text escalates to the human at the step-3 / Phase-1
gate per the same preflight discipline the EPIC-5 ruled-copy set came from
(`vault/raw/2026-09-04-po-epic5-ruling.md` D1, D5; [[council-models-picker]]
"Ruled copy (Phase 1 human decisions, binding)").

### Options rejected

- *Ship with placeholder copy now.* Requires a copy-ruling I am not the
  right seat to make; the Phase-1 precedent binds the ruled-copy set as a
  recorded human decision.
- *Skip the empty state entirely.* A filter always has a possible
  no-match state; showing the unfiltered list while the user types
  `"zqzzzz"` is misleading.

### Grounding

`vault/raw/2026-09-04-po-epic5-ruling.md` D1/D5 (Phase-1 ruling preflight);
[[council-models-picker]] ruled-copy binding.

### Reversibility

High — copy decision is purely additive.

## B-7 — Search-mode auto-exit on selection (designer taste, ruled)

**Ruling:** leave to implementation with the floor: on `Enter` at the
model level, if the search input is visible, the search state clears and
the picked row's index advances into the confirm level; on Esc from
confirm (level 3), control returns to the model level with the prior
search state preserved (so the user does not lose their query when
backing out of the confirm screen). The card does not pin either
behavior further.

### Grounding

[[designer]] "Preferences, ranked last" taste convention.

### Reversibility

Trivial — render-path and state-payload edits.

## S-1 — Missing child: filter at level 0/1 (designer observation, rejected)

**Ruling:** rejected — no third card. The intake is unambiguous: *"so
many models to choose from"* and *"model selection modal"* and
*"search/filter model names"* — all three phrasings name level 2 only.
Adding a level-0/1 filter is a scope expansion the intake does not
authorize.

### Dissent

Designer argued the same affordance is wanted at all three levels and
offered a possible third card.

### Grounding

Intake verbatim; [[product-owner]] "decides what the product should be
when no test can decide it" — the human's intake is the source of the
*what*, and the what here is model names only.

### Reversibility

High — a future user need can add a follow-up card without touching
EPIC-6.

## S-2 — Missing child: FLLWUP-9 shared-render-site fold-in (rejected)

**Ruling:** rejected — not a fold-in, not a new card. FLLWUP-9 (explicit
clear-thinking-override affordance) is a writer-surface follow-up, not a
list-filter follow-up. The shared `extensions/model-picker.ts` file is
incidental, not a goal-coherence signal. Per [[product-owner]]
`<escalation>`, "work folds into the live card iff the work is needed to
honestly meet the existing goal" — meeting Child B's goal requires no
writer change. FLLWUP-9 already exists; the human's intake directs its
`epic:` field to flip to EPIC-6 (ruling M-1).

### Dissent

Designer's observational observation, not a patch request.

### Grounding

Fold-in test; `council/cards/FLLWUP-9.md` (writer-surface goal text);
`council/procedures/features-new.md` step 2 ("never re-slice children and
never rewrite undisputed child goals").

### Reversibility

High — a future card can absorb FLLWUP-9's writer affordance if needed.

## S-3 — Child B surface-naming for Bar 4

**Ruling:** ratified. Child B's `Intent` must name: the `/council-models`
modal (`ModelPicker`, `extensions/model-picker.ts`), the level-2 cascade,
the input placement below the top row, the `▌` focus signifier, the
clear-text-and-stay Esc semantics (with model-level Esc ascend preserved
elsewhere), and the empty-state copy as a Phase-1 ruling.

### Grounding

Bar 4 (`council/procedures/features-new.md` step 2 wave 1);
[[council-models-picker]].

### Reversibility

Trivial — `Intent` text edit.

## M-1 — Mechanical FLLWUP-9/10/11 reassignment to EPIC-6 (human-directed)

**Ruling:** ratified as directed. The cards retain their content and
`state: Backlog`; only the `epic:` frontmatter field flips `EPIC-5` →
`EPIC-6`. This is a mechanical portfolio-routing change, not a substantive
change to any of the three cards' goals.

### Grounding

Human intake verbatim; `council/board.md` Backlog column;
`council/cards/FLLWUP-9.md`, `FLLWUP-10.md`, `FLLWUP-11.md` `epic:` field.

### Reversibility

Trivial — single-line field flip.

## M-2 — Id allocation for EPIC-6 and the two children

**Ruling:** `EPIC-6` is the next epic id (no EPIC-6 file yet exists;
`council/cards/` shows EPIC-5 as the highest epic). The wave-1 artifact
names children "Child A" and "Child B" — per `council/procedures/features-new.md`
step 2 wave 1, the epic and child ids are allocated by the facilitator at
step 1, not by principal. I do not allocate ids in this ruling (out of
this seat's scope); the facilitator assigns the next available pair (e.g.
`EV-26` and `EV-27`) at step 1 when the human approves. The card text in
this ruling is the *goal content*; the facilitator wraps it in the
frontmatter shape with the correct ids.

### Grounding

`council/procedures/features-new.md` step 1, 2; [[card-id-allocation]].

### Reversibility

Trivial — id field edit, before any card file is written.

## Escalations to the human (carried to the step-3 gate)

**None that this seat's `<escalation>` forbids me to rule on.** Every open
in-scope judgment was ruled above. The only item that routes to the human
at the step-3 gate is the no-match copy text for Child B (B-6), and that
is a Phase-1 ruling for the run — not a portfolio change, not a reversal
of a recorded human decision, and not a "the goal itself is the defect"
item. It is a textual ruling on a string that does not yet exist, and the
Phase-1 precedent routes this kind of ruling to the human at the existing
approval gate, not to `steward`.

## Session convergence

Every open in-scope judgment is ruled. Named dissents: principal on
placement (lost, ruled B-2); designer on prefix (lost, ruled A-3);
designer on level-0/1 expansion (lost, ruled S-1); designer on FLLWUP-9
fold-in (lost, ruled S-2); skeptic on Child A state (lost, ruled A-1 with
contract pinned); skeptic on Child B goal/testability (lost, ruled B-1
with Esc pinned); skeptic on epic-goal Esc (lost, ruled EPIC-1 with literal
read).

The session **has converged**. The fallback draft is not the canonical
content; the ruled draft above is.

## Final card text (Part 1 of the step-3 gate, attribution-free)

**EPIC-6** (`state: Backlog`, `epic: null`):
> The `/council-models` model selection modal gains a `/`-triggered focused
> search input below the top row that filters the visible model rows by
> case-insensitive substring on `qualifiedId` as the user types, and
> pressing Esc with focus in the search input clears its text.

**Child A** (`state: Ready`, `epic: EPIC-6`):
> `filterModelRows` maps the model cross-product rows and a query string to
> only the rows whose `qualifiedId` contains the query case-insensitively,
> preserving each thinking-level suffix and returning the unchanged row
> objects, with an empty result for no match.

**Child B** (`state: Ready`, `epic: EPIC-6`):
> Pressing `/` while the model selection modal is at the model level opens
> a focused search input below the top row, typed characters filter the
> visible model rows to those whose `qualifiedId` contains the query
> case-insensitively, pressing Esc with focus in the search input clears
> its text, and pressing Esc elsewhere at the model level ascends to the
> provider level unchanged.

**FLLWUP-9 / FLLWUP-10 / FLLWUP-11**: `epic:` field flips `EPIC-5` →
`EPIC-6`; content unchanged.

No new card is created for S-1 or S-2; both rejected.

## Sources cited

- Human intake verbatim (the *what*).
- `vault/wiki/council-models-picker.md` (ruled-copy set binding; J-2
  cross-product rule; EV-23 pure-unit precedent).
- `vault/wiki/council-theme.md` (token-only drawing rule).
- `vault/wiki/three-wave-decomposition.md` (wave-3 ruling-only
  precedent).
- `vault/wiki/skeptic.md` (closed-red / closed-green evidence terms).
- `vault/wiki/designer.md` ("Preferences, ranked last" taste convention).
- `vault/wiki/product-owner.md` (role scope; fold-in test;
  `<escalation>` bars; phase-1 copy-routing precedent).
- `vault/wiki/echo-then-run.md` (selection-pipeline preservation).
- `vault/wiki/card-id-allocation.md` (id allocation at fetched HEAD).
- `vault/raw/2026-09-04-po-epic5-ruling.md` (Phase-1 ruling preflight
  precedent; ruled-copy binding).
- `vault/raw/2026-08-26-po-ev8-ruling.md` (▌ U+258C glyph hard-rule
  precedent; focus-signifier analogy).
- `extensions/model-picker.ts:43,55-65,79-87,96,257-275` (header
  byte-exact; footer exhaustiveness; row contract; modelRow suffix;
  Esc-ascend; resolveSelection byte-verbatim).
- `extensions/catalogue.ts` (qualifiedId shape; provider/id concat).
- `council/procedures/features-new.md` (Ready-vs-Backlog bar; Bar 4
  surface naming; facilitator id allocation; Part 1 attribution-free
  rule; Part 2 ledger presentation).
- `AGENTS.md` conventions #9.6 (token-only drawing).