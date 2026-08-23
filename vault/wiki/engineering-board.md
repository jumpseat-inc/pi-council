---
title: Engineering Board
type: concept
summary: The durable, locally-stored kanban state — council/board.md plus one card file per id, validated by validate.py, and the discipline that everything the Council does starts and records there.
aliases: [board, card, kanban]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `council/procedures/board-out-create-card.md`, `features-new.md` and `council/scaffold/council/board.md` @ `8913c6b`/`8f1882b` (captured 2026-08-23). Verify against the procedure files.

The board is the source of truth for what the Council is building. It is a git-tracked
set of markdown files under `council/`:

- **`council/board.md`** — a kanban-board listing cards in state columns.
- **`council/cards/<id>.md`** — one file per card, frontmatter + `Intent` section.
- **`council/cards/_template.md`** — the shape template.
- **`council/validate.py`** — a validator run after every board/card write;
  clean output is a hard requirement before proceeding.

## Card frontmatter

- `id` — globally unique, filename-matching; prefix `EV-` / `FULLWUP-` / `BUG-` / `EPIC-`, `[1-9]\d*`, no zero-lead.
- `title`, `state` (one of `Backlog`, `Ready`, `Deliberating`, `In Progress`,
  `In Review`, `Needs Human`, `Done`), `owner`, `epic` (null or parent epic id),
  `goal`.
- `goal` must be **one falsifiable, testable sentence** stating what done means —
  the judge later rules PASS/REJECT from it alone. A `: ` (colon-space) anywhere in
  the value silently truncates the frontmatter (inline parsing, no YAML quoting),
  so the goal may never contain a colon-space sequence.

## Lifecycle / discipline

- **Draft-then-confirm is a hard gate** — nothing reaches the board without the
  human approving the exact card.
- Board and cards must **never land as separate commits** (a board that disagrees
  with its cards is the inconsistency `validate.py` exists to catch).
- Card **goal text is immutable** once a card is `In Progress` — any work needing
  a goal edit is, by definition, a new card (not a fold-in, per the product-owner).

## Related

- [[council-loop]], [[seats]]
- [[2026-08-23-pi-council-design-spec]]

## Sources

- `council/procedures/board-create-card.md`, `council/procedures/features-new.md`
- `council/scaffold/council/board.md`, `council/scaffold/council/cards/_template.md`