---
description: Decompose a feature into an epic card and its child cards, each drafted and confirmed with the human.
argument-hint: [feature description]
---

You are decomposing `$ARGUMENTS` into an epic and its child cards. This
command is the entry point into `/features-deliver`'s autonomous mode: every
card `features-deliver.md` later runs unattended traces back to a card this command
wrote, so the gate that matters most here is the one that also matters most
there — nothing reaches the board without the human seeing it first.

## 0. Superpowers gate

Before touching any card, confirm the [superpowers](https://github.com/obra/superpowers)
skills package is installed project-locally — the `.pi/settings.json` install
pin carries it, or the clone exists under `.pi/git/github.com/obra/superpowers/`.
The council workflow depends on those skills (TDD, planning, debugging);
without them the later `/features-deliver` stages would run degraded. If the
pin is missing, refuse to proceed and tell the human exactly what to do: run
`/council-init` to scaffold the council AND install superpowers project-locally,
then `/reload`, then re-run this command.

## 1. Create the epic card

Read `council/cards/_template.md` for the frontmatter shape and
`council/board.md` for current state, the same way `/board-create-card`
does. Assign the next `EPIC-<n>` id by scanning `council/cards/` for the
highest existing `EPIC-` number and incrementing (first one is `EPIC-1`).

The epic card's `goal` names what the whole feature delivers, not any one
child's slice of it. `epic: null` on the epic card itself — only children
point up at it.

## 2. Decompose into child cards

Break the feature into child cards, each with:

- **A single testable `goal`** — same bar `/board-create-card` step 3 sets:
  falsifiable, not satisfiable by a stub, no colon-space sequence anywhere
  in the value.
- **`epic:` set to the epic's id** — this is what makes it a child rather
  than a freestanding card.
- **`state` set per `/board-create-card` step 4** — `Ready` only if the
  child is already detailed enough for the Council to deliberate on without
  further clarification, otherwise `Backlog`. This is not optional
  bookkeeping: `state` is one of `validate.py`'s `REQUIRED_CARD_KEYS`, and
  `council.md` step 1 hard-gates a card's Council run on `state == Ready`,
  so a card missing this or holding the wrong value either fails validation
  outright or silently blocks `/features-deliver` from ever picking it up.
- **Name the user-visible surface, if any**, in the child's `Intent` —
  which screen, which copy, which state. `council.md` step 1 reads `Intent`
  to decide whether the card seats `designer`; a child that silently
  changes what a driver sees, with an `Intent` written purely in backend
  terms, gets no design seat. This is prose in `Intent`, not a frontmatter
  key: `validate.py`'s `REQUIRED_KEYS` stays as it is.

## 3. Draft-then-confirm — every card, no exceptions

Reuse `/board-create-card`'s draft-then-confirm gate **for every card this
command produces, the epic included.** Present the full draft of the epic
and every child — complete frontmatter and `Intent` section, exactly as each
would be written to disk — to the human in one pass.

The human may edit any card, drop any child, or approve the set as-is.
**Write nothing to disk until the human approves.** There is no default
approval, no timeout that counts as consent, and no proceeding on the
assumption that silence means yes.

## 4. On approval, write and validate

Only after explicit approval:

1. Write the epic card and every approved child under `council/cards/`.
2. Add one line per card under its state's column in `council/board.md`,
   using an em dash (—, U+2014) between id and title — not a hyphen;
   `validate.py`'s board parser matches the em dash character exactly.
3. Run `python3 council/validate.py` and fix anything it reports. Re-run
   until it prints `All council artifacts valid` — do not move on while any
   `FAIL:` line remains.

## 5. Commit

Commit the epic card, every child card, and the updated `council/board.md`
together, in one commit — the board and its cards must never land as
separate commits, since a board that briefly disagrees with its cards is
exactly the inconsistency `validate.py` exists to catch.
