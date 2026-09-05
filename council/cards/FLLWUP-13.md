---
id: FLLWUP-13
title: No-match state names how to leave search mode
state: In Progress
owner: null
epic: EPIC-6
goal: When the model search query matches zero rows, the modal's no-match rendering includes a hint naming the key sequence that leaves search mode without clearing it, byte-distinct from the ruled no-match literal and both R-4 empty states, proven by driven render tests at the zero-match state.
---

## Intent

Filed from EV-27's delivery (principal's discoverability item): exiting
search mode is invisible at zero rows — the two-bit state machine routes
focus out on Down and ascend on a second Esc, but at zero rows the person
sees only "nothing matches" and has no visible affordance telling them the
list (and search) is recoverable without clearing. The ruled no-match copy
(`No models matching "<query>".`, EPIC-6 R-1) stays byte-exact; this card
adds a second line naming the focus-out key sequence. Surface is the
`/council-models` modal's model level, no-match state. The hint's exact copy is a Phase-1 ruling recorded
on this card face below.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (no-match exit hint copy)**: the no-match region renders a dim
  second line under the ruled `No models matching "<query>".` literal, with
  the byte-exact copy `↓ then esc exits search` — naming the real two-key
  walk (Down moves focus out of the input, Esc then ascends and search
  state dies with the level). The ruled footer stays byte-exact; the hint
  lives in the no-match region, never a fifth footer.

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.

## Acceptance

- Driven tests: a zero-match query renders the ruled no-match literal
  unchanged plus the ruled hint line; both are byte-distinct from the two
  R-4 empty states.
- The footer remains the ruled model-level string (four-footer rule
  intact — the hint lives on the search row or no-match region, never a
  fifth footer).
- The hint's key names match the actual handler behavior (focus-out then
  ascend verified by driven key walks).

## Execution

### Step 1 gate
Mechanical, surface-touching. The goal is fully pinned by Phase 1 rulings:
R-1 fixes the hint copy byte-exact (`↓ then esc exits search`, `↓` is
U+2193 — transcribe from this face, never retype), placement (a dim second
line directly under the ruled `No models matching "<query>".` literal in
the no-match region, never a fifth footer), and the ruled footer stays
byte-exact; EPIC-6 R-1 fixes that the `NO_MATCH` literal itself is
unchanged (the hint is an addition, never a modification); BUG-1
R-1/R-2/R-3 fix that the pre-press hint line is untouched — the no-match
frame is the `searchActive` zero-row branch, which renders only with a
non-empty query, so the two hint lines can never render in the same
frame. The behavior the hint names (Down moves focus out of the input,
Esc then ascends, search state dies with the level) is already shipped
and driven-tested (EV-27 tests 8/9/12/13 walk exactly these keys). Change
is confined to one seam — the no-match render branch of
`extensions/model-picker.ts` plus additive driven tests in
`test/model-picker.test.ts`; no cross-seam reach (the Phase 5 smoke
greps usage/write/error lines, never the no-match frame; `NO_MATCH` and
`NO_MATCH_HINT` render only inside `ModelPicker.render`). The one
latitude — a new byte-exact exported constant for the hint plus a second
`lines.push` in the zero-row branch — is an implementation choice, not a
design tradeoff. Surface-touching by definition (visible modal copy), but
per council.md step 1 a surface-touching mechanical card seats no
`designer`; any design concern this run surfaces routes to step 13 as a
follow-up candidate, never to reopening the card.

State note: card dispatched at `Backlog`; the features-deliver
card-selection substitution replaces `Ready` promotion — the orchestrator
selects epic-scope cards in dependency order, and every EPIC-6 card this
run (EV-26, EV-27, FLLWUP-10, FLLWUP-11, BUG-1) executed from `Backlog`
the same way. Mechanical path: skips steps 2–6, proceeds directly to step
7 with the card itself as the owner handoff (no spec file under
`docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean (below).
Owner dispatched at the card only — the mechanical-path handoff is the
card's own Intent, goal, and Acceptance (plus the Phase 1 rulings on this
face), with this repo's gate set (`.github/workflows/gates.yml` is the
authoritative record — this repo has no `docs/gates/GATE-EVIDENCE.md`,
purged in the domain-neutralization commit) and branch/PR conventions
named.
