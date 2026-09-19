---
title: Engineering Board
type: concept
summary: The durable, locally-stored kanban state — council/board.md plus one card file per id, validated by validate.py, and the discipline that everything the Council does starts and records there.
aliases: [engineering board, board, card, kanban]
tags: [pi-council/concept]
sources: ["[[2026-09-04-epic4-run-ledger]]", "[[2026-09-05-epic6-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-17-epic9-residual-run-ledger]]", "[[2026-09-18-epic9-residual-run-2-ledger]]"]
created: 2026-08-23
updated: 2026-09-20
---

> ⚠️ Derived from `council/procedures/board-create-card.md`, `features-new.md` and `council/scaffold/council/board.md` @ `8913c6b`/`8f1882b` (captured 2026-08-23). Verify against the procedure files.

The board is the source of truth for what the Council is building. It is a git-tracked
set of markdown files under `council/`:

- **`council/board.md`** — a kanban-board listing cards in state columns.
- **`council/cards/<id>.md`** — one file per card, frontmatter + `Intent` and `Acceptance` sections.
- **`council/cards/_template.md`** — the shape template.
- **`council/validate.py`** — a validator run after every board/card write;
  clean output is a hard requirement before proceeding.

## Card frontmatter

- `id` — globally unique, filename-matching; prefix `EV-` / `FLLWUP-` / `BUG-` / `EPIC-`, `[1-9]\d*`, no zero-lead.
- `title`, `state` (one of `Backlog`, `Ready`, `Deliberating`, `In Progress`,
  `In Review`, `Needs Human`, `Done`), `owner`, `epic` (null or parent epic id),
  `goal`.
- `goal` must be **one falsifiable, testable sentence** stating what done means —
  the judge later rules PASS/REJECT from it alone.
  ⚠️ **RETRACTED (FLLWUP-43, 2026-09-17).** This page previously said a `: `
  (colon-space) anywhere in the value silently truncates the frontmatter and
  "the goal may never contain a colon-space sequence." That rationale was
  **false**: `parse_frontmatter` splits at the first `: ` and is lossless for
  the rest of the line — the parser was never the bug, the `": " in goal` FAIL
  *was* the lossiness — and the FAIL was deleted from all ten `validate.py`
  copies. A goal may now name an exact literal containing `: ` directly. ⚠️ The
  real remaining silent-loss path is a **wrapped/continued goal line** (`goal:
  first` + a second line parses to `first`, `validate.py` exits 0); carded as
  FLLWUP-51. The correctness lesson stands and is why the fix mattered: the goal
  is the judge's only input, so a goal forced to misspell a literal is a goal
  that lies — EV-37 shipped a dead classifier branch exactly this way
  ([[retry-classification]]).
  ✅ **FLLWUP-51 delivered (2026-09-18, `dee64c5a`).** The wrap is now a **loud
  FAIL**, not silent loss, and `goal:` is **positional**: the frontmatter block
  must carry `goal:` as its **last key**, and a wrapped/continued value, a
  non-`key: value` line inside the block, an unclosed block, and a key after
  `goal:` are each refused by `parse_frontmatter` with a distinct
  `council/validate.py` FAIL **naming the defect** rather than validating green.
  The bare-line diagnostic names **both** readings ("wrapped value, or the
  closing `---` is missing") because the parser cannot tell them apart. Green
  side preserved: single-line goals containing `: `, and cards carrying extra
  intentional keys **before** `goal:`, parse clean. ⚠️ **This is a
  consumer-visible breaking change** — a leg-but-unusual key order now goes red
  by design; release notes carry the call-out. One residual stays
  document-and-pin-not-gate: a mid-block colon-bearing continuation of a
  **non-goal** key (`FLLWUP-62`). See
  [[2026-09-18-epic9-residual-run-2-ledger]].

## Lifecycle / discipline

- **Draft-then-confirm is a hard gate** — nothing reaches the board without the
  human approving the exact card. For the step-13 **follow-up** gate, the
  confirmation is **pre-write**: the ruling seat confirms, edits, or drops each
  draft **before** the card is written. A run-2 `council-runner` inverted this
  ("cards land in Backlog, confirmed at ledger level") and wrote six cards
  before confirmation; [[steward]] ruled the framing a **false precedent**, had
  the line corrected on the card face, and carded `FLLWUP-69` to pin the
  pre-write gate in `council.md` §13 and `features-deliver.md` Phase 1. See
  [[2026-09-18-epic9-residual-run-2-ledger]].
- Board and cards must **never land as separate commits** (a board that disagrees
  with its cards is the inconsistency `validate.py` exists to catch).
- Card **goal text is immutable** once a card is `In Progress` — any work needing
  a goal edit is, by definition, a new card (not a fold-in, per the product-owner).
  While a card is still `Deliberating`, an **amended goal is legal**, and
  goal-wording authority is [[steward]]'s: EV-29's goal named a provider data
  granularity that does not exist, and steward amended it in place (EPIC-7).
  The **Acceptance section is a separate, amendable surface**: EV-33's goal
  named a post-epic endpoint (an accessor consumed by the tree *and* the
  transcript header) while its Acceptance forbade render changes, and
  [[product-owner]] amended only Acceptance bullet 3 (EPIC-8). The converse
  showed up in EPIC-9: a goal meta-clause can be satisfied by **naming** an
  observable even when that observable provably cannot exist for the card's
  scope — EV-43 required the per-branch observable be "named in the
  acceptance", the acceptance named an input-bar text delta impossible for a
  bare reachability probe, and [[product-owner]] ruled naming is a naming
  requirement, not an existence one (Acceptance amended as documentation; the
  goal stood).
- **Id allocation is a HEAD operation** (EPIC-3 collision lesson): a parallel
  session on a stale clone allocated `EPIC-3`/`EV-10..15` to itself and the
  mains diverged; reconciled by union merge, never rewrite. See
  [[card-id-allocation]].

## Related

- [[council-loop]], [[seats]]
- [[card-id-allocation]] — the id-collision/union-merge discipline (v0.15.0)
- [[chain-promotion]] — the automated Backlog→Ready cadence for dependent
  child chains (EPIC-4); follow-up cards may also be scoped under an epic
  via the `epic:` field (FLLWUP-5..8 under EPIC-4; FLLWUP-9..11
  reassigned EPIC-5 → EPIC-6 by the human at decomposition, and
  FLLWUP-12..15 filed under EPIC-6 from its run's step-13 candidates)
- [[union-merge reconcile]] — the diverged-main repair the board's record
  commits make recurring under squash merges
- [[2026-08-23-pi-council-design-spec]]
- [[2026-09-05-epic6-run-ledger]] — the board carried a five-card epic to
  fully-Done autonomously; durable state validated again
- [[2026-09-06-epic6-close-run-ledger]] — the close run: first `BUG-` card
  (BUG-1, filed through the human-approved draft gate; FLLWUP-12 dropped as
  redundant), FLLWUP-16..25 filed mid-run under the human's standing
  no-consent follow-up directive (epic: EPIC-6, each completed in-run),
  and **EPIC-6 itself marked Done** — the board's first epic-card closure
  — at v0.18.0. A seat's mid-run `git checkout` briefly reverted board
  records; reflog recovery + the hardening chain (FLLWUP-16..20) closed
  the class.
- [[2026-09-11-epic7-run-ledger]] — the board's **second epic-card closure**
  (EPIC-7, five chain-promoted children, all Done); FLLWUP-27..35 filed as
  `Backlog` residuals under the Done epic (and FLLWUP-36 dropped by the
  human at the follow-up gate).
- [[2026-09-15-epic8-run-ledger]] — the board's **third epic-card closure**
  (EPIC-8, four children merged in order); FLLWUP-36..39 filed as `Backlog`
  residuals under the Done epic, none promoted at closure. Two permanent
  residuals recorded without cards (out-of-order `toolResult`; `t`-toggle
  cursor stability).
- [[2026-09-17-epic9-residual-run-ledger]] — the EPIC-9 **residual run**: nine
  promoted residuals delivered (PRs #58–#66); the goal field made lossless
  (FLLWUP-43 — the colon rule above retracted), two goal amendments by steward
  pen, and the step-12 record-push gap.
- [[2026-09-18-epic9-residual-run-2-ledger]] — the EPIC-9 **residual run 2**:
  the remaining eleven residuals (PRs #67–#77, one R4 retirement); `goal:` made
  positional and the wrap gate loud; the pre-write step-13 gate inversion
  corrected and carded (`FLLWUP-69`); the record-push gap closed.
- [[2026-09-16-epic9-run-ledger]] — the board's **fourth epic-card closure**
  (EPIC-9, seven children); FLLWUP-40..45 + 47..49 filed as `Backlog`
  residuals, two drafts declined at the gate, two permanent residuals without
  cards. A `Ready` sibling (EV-42) was **re-scoped in place** by [[steward]]
  mid-run — premise replaced, same id and slot — the first post-promotion
  card-wording change executed by the orchestrator between cards.

## Sources

- `council/procedures/board-create-card.md`, `council/procedures/features-new.md`
- `council/scaffold/council/board.md`, `council/scaffold/council/cards/_template.md`
- [[2026-09-06-epic6-close-run-ledger]]
- [[2026-09-17-epic9-residual-run-ledger]]
- [[2026-09-18-epic9-residual-run-2-ledger]]