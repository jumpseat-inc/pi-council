---
description: Draft a new board card from a stated intent, confirm it with the human, then write it and update the board.
argument-hint: [short description of the work]
---

You are drafting a new council card from `$ARGUMENTS`. This is how work
enters the board — nothing gets onto `council/board.md` without a human
approving the exact card first.

## 1. Read the shape and the current state

Read `council/cards/_template.md` for the frontmatter shape and section
structure, and `council/board.md` for the current state of every column.

## 2. Assign the next id

Choose the prefix for the kind of work: `EV-` for planned work, `FLLWUP-`
for a follow-up filed out of another run, `BUG-` for a defect, `EPIC-` for an
epic. Scan `council/cards/` for the highest existing number under that
prefix, ignoring `_template.md` — its id is the literal placeholder
`EV-1`, which matches no prefix — and assign the next integer. **If no
card of that prefix exists yet, the first one is `<PREFIX>-1`.**
`validate.py`'s id pattern is `^(EV|FLLWUP|BUG|EPIC)-[1-9]\d*$`: numbering
starts at 1, and a zero or missing number is rejected. Card ids are globally
unique filenames — `council/cards/<id>.md` — and the frontmatter `id` field
must match the filename exactly.

## 3. Write the goal

`goal` must be **one testable sentence stating what done means** — nothing
else lives in that field. Write it so that a later seat, the `judge`, can
rule PASS or REJECT from the goal sentence and a verifier's evidence alone,
having never seen this card's `Intent` section. That means:

- **Falsifiable** — someone could point at evidence and say "this fails
  because X," not just "this seems fine."
- **Not satisfiable by a stub.** A goal like "the endpoint exists" is met by
  a handler that returns nothing useful. Say what the behavior actually is,
  not just that some code is present — name the concrete behavior and the
  required evidence (e.g. an automated test exercising that path).

**Hard failure mode — do not write a colon-space sequence (`: `) anywhere in
the goal.** This frontmatter is parsed as plain `key: value` lines with no
YAML quoting. A `: ` inside the value truncates everything after it — the
goal `validate.py` and the judge actually read will silently be the fragment
before the colon, not the sentence you wrote. If the goal needs to contrast
two things, rephrase without a colon ("rather than" or "instead of").

## 4. Set the initial state

Set `state: Ready` only if the stated intent is already detailed enough for
the Council to deliberate on without further clarification. Otherwise set
`state: Backlog` — an under-specified intent is not ready for the loop, and
forcing it to `Ready` just pushes the missing detail into deliberation where
it costs more to recover.

## 5. Draft, then stop — this is a hard gate

Write the full card body: complete frontmatter (`id`, `title`, `state`,
`owner: null`, `epic: null`, `goal`) and the `Intent` section, exactly as it
would be written to disk. Present that full draft to the human.

The human may edit the draft, drop it entirely, or approve it as-is.
**Write nothing to disk until the human approves.** There is no default
approval, no timeout that counts as consent, and no proceeding on the
assumption that silence means yes. An autonomous run that wrote its own
card without this gate would be inventing its own work; the gate is what
keeps that from happening.

## 6. On approval, write and validate

Only after explicit approval:

1. Write `council/cards/<id>.md` with the approved content.
2. Add one line under the matching state's column in `council/board.md`:
   `- <id> — <title>`, using an **em dash (—, U+2014)** between the id and
   the title, not a hyphen. `validate.py`'s board parser matches the em dash
   character exactly; a hyphen there makes the entry invisible to it, and
   the card will be reported as missing from the board even though the file
   exists and its state is correctly set.
3. Run `python3 council/validate.py` and fix anything it reports — do not
   move on while it prints any `FAIL:` line. Re-run until it prints
   `All council artifacts valid`.

## 7. Commit

Commit the new card file and the updated `council/board.md` together, in one
commit — the board and its cards must never land as separate commits, since
a board that briefly disagrees with its cards is exactly the inconsistency
`validate.py` exists to catch.
