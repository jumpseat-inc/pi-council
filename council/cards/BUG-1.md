---
id: BUG-1
title: Backspace deletion in the model search input and a first-use `/` filter hint
state: In Review
owner: null
epic: EPIC-6
goal: Pressing backspace while the model search input in the `/council-models` modal is focused deletes the last character of the query and recomputes the filtered list, and before any `/` press the model-level view shows a visible hint that `/` filters models, proven by driven handleInput and render tests.
---

## Intent

Filed from a human bug report naming two defects on the `/council-models`
model picker, deliberately kept in one card.

**Backspace does not delete.** Since EV-27, `\x7f` is a guard-only no-op in
the search input (the settled convergence: `matchesKey(data, Key.backspace)`
guards before the printable decode, and Esc-clear is the sole deletion
mechanism), so a one-character typo costs clear-and-retype. This card gives
`\x7f` its ordinary meaning — delete the last query character and recompute
the filtered rows — under the same two-bit focus machine EV-27 shipped.

⚠ **Overlap resolved pre-run.** FLLWUP-12 (Ready) carried exactly this
backspace contract; per recorded human decision it was dropped before this
card's dispatch and its pins are folded into this card's acceptance.

**No indicator that `/` filters.** The only `/` affordance on screen lives
inside the search row itself (`▌ / filter · esc clears`), which renders only
after `/` is pressed — invisible before the first press. The model-level
footer (`↑/↓ move · enter select · esc back`) does not mention `/`, and
EV-27 explicitly ruled no `/ filter` addition to the ruled footers
(four-footer exhaustiveness), recording this discoverability gap as an
unauthorized follow-up. The hint's placement, copy, and dismissal are
Phase-1 rulings recorded on this card face below.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (pre-press hint placement)**: a first-render hint line below the
  model rows at the model level, rendered only while search has never been
  opened in the current modal-open. The line is not the search row, carries
  no `▌` (U+258C) focus signifier (which appears in no non-search state,
  per EV-27), and is not a footer — the ruled footer stays byte-exact.
- **R-2 (pre-press hint copy)**: the hint line renders the byte-exact
  literal `press / to filter models`.
- **R-3 (dismissal)**: the hint stops rendering at the first `/` press in
  the current modal-open and returns on the next fresh entry to the model
  level. No session-scoped persistence.

Recorded human decisions — immutable for the run and binding on every seat,
`steward` included.

## Acceptance

- Driven `handleInput` test — `\x7f` with a non-empty query and focus in the
  input deletes exactly one trailing character, the filtered list recomputes
  through `filterModelRows`, and focus stays in the input.
- `\x7f` on an empty query and `\x7f` while unfocused remain no-ops; other
  control bytes keep their existing behavior (the FLLWUP-12 pins, if folded
  here).
- Driven render test — the first model-level render of a fresh picker shows
  a visible hint naming `/` as the filter trigger, before any `/` press.
- The hint half's copy, placement, and dismissal semantics are the ruled
  literals in the Phase 1 rulings above (R-1 placement, R-2 copy,
  R-3 dismissal).

## Execution

### Step 1 gate
Mechanical, surface-touching. The backspace half is fully pinned on this
face — the folded FLLWUP-12 contract fixes the exact byte (`\x7f`), the
exact guards (non-empty query AND input focus for delete-one; empty query
and unfocused stay no-ops), the exact effect (delete one trailing character,
recompute through the existing `filterModelRows` seam), and an unchanged
contract for every other control byte. The hint half has no open design
question: R-1 pins placement (first-render line below the model rows at the
model level, only while search has never been opened in the current
modal-open, not a footer, no `▌`), R-2 pins copy (byte-exact `press / to
filter models`), R-3 pins dismissal (stop at the first `/` press, return on
next fresh entry to the model level, no session persistence). The change is
confined to one area (`extensions/model-picker.ts` and its driven tests in
`test/`) — no cross-seam reach, no design judgment left, no ambiguity an
owner could resolve two ways. Surface-touching by definition (a visible
hint line and a visible deletion behavior), but per council.md step 1 a
surface-touching mechanical card seats no `designer`; any design concern
this run surfaces routes to step 13 as a follow-up candidate, never to
reopening the card.

State note: card dispatched at `Backlog`; the features-deliver
card-selection substitution replaces `Ready` promotion — the orchestrator selects epic-scope cards in dependency order,
and every EPIC-6 card this run (EV-26, EV-27, FLLWUP-10, FLLWUP-11)
executed from `Backlog` the same way. Mechanical path: skips steps 2–6,
proceeds directly to step 7 with the card itself as the owner handoff (no
spec file under `docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean (below).
Owner dispatched at the card only — the mechanical-path handoff is the
card's own Intent, goal, and Acceptance (plus the folded FLLWUP-12 pins and
Phase 1 rulings on this face), with this repo's gate and branch/PR
conventions named.

### Step 8 — re-dispatch after session disruption (resumed run)
The above owner dispatch produced nothing that survived: a session
disruption zeroed the `feat/bug-1-backspace-hint` branch, its worktree
registration, and its reflog before any commit or PR existed. The
`.worktrees/feat-bug-1-backspace-hint` directory remains on disk as
hollowed debris (all files 0 bytes, not registered in `git worktree
list`, no gitdir, no branch) — not usable as prior work. No commits and
no PR exist for this card. Re-dispatched the owner (job-1.1) on the
mechanical-path handoff: the card's own Intent, goal, and Acceptance,
the folded FLLWUP-12 pins, Phase 1 rulings R-1/R-2/R-3 and EPIC-6 R-1
restated, this repo's four gates (`bun install --frozen-lockfile`,
`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`), and
the branch/PR conventions. Job settled (job-1.1, done): branch
`feat/bug-1-backspace-hint` pushed, PR #28 open at head
`5cedc1e896bd69a2c5a0d2dc2367ee4a26ca015a` (observed via `gh pr view`
28 — state OPEN), gates workflow `IN_PROGRESS` at verification time.
Owner-reported gates all exit 0 (bun install --frozen-lockfile, bunx
tsc --noEmit, bun test 541 pass/2 skip, validate.py clean); driven
tests 5/5. Card set In Review on frontmatter and board per observed
artifacts (council.md step 8).
