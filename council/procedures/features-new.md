---
description: Decompose a feature into an epic card and its child cards, each drafted and confirmed with the human.
argument-hint: [feature description]
---

You are decomposing `$ARGUMENTS` into an epic and its child cards. This
command is the entry point into `/features-deliver`'s autonomous mode: every
card `features-deliver.md` later runs unattended traces back to a card this command
wrote, so the gate that matters most here is the one that also matters most
there — nothing reaches the board without the human seeing it first.

## 0. Dependencies gate

Before touching any card, confirm the council's project-local dependencies are
installed — the `.pi/settings.json` install pins carry them, or their clones
exist under `.pi/git/github.com/obra/superpowers/` (superpowers skills) and
`.pi/npm/node_modules/@juicesharp/rpiv-ask-user-question/` (the
ask-user-question extension). The workflow depends on both: superpowers'
skills (TDD, planning, debugging) and the extension a seat uses to interrupt
for a human answer. If either pin is missing, refuse to proceed and tell the
human exactly what to do: run `/council-init` to scaffold the council AND
install the dependencies project-locally, then `/reload`, then re-run this
command.

## 1. Create the epic card

Read `council/cards/_template.md` for the frontmatter shape and
`council/board.md` for current state, the same way `/board-create-card`
does. Assign the next `EPIC-<n>` id by scanning `council/cards/` for the
highest existing `EPIC-` number and incrementing (first one is `EPIC-1`).

The epic card's `goal` names what the whole feature delivers, not any one
child's slice of it — but you do not draft it. The epic goal is authored in
wave 1 of step 2 by `principal` as a one-line transcription of the human's
intake (`$ARGUMENTS`): the human is the author of what the product is for,
and principal transcribes it into the goal field. `epic: null` on the epic
card itself — only children point up at it.

## 2. Decompose into child cards

The decomposition is deliberated by the four seats SEATS-1 names —
`product-owner`, `designer`, `principal`, `skeptic` — in three waves. You
route, wait, aggregate verbatim, and author nothing.

**Wave 1 — `principal` authors the first decomposition artifact.**

Dispatch `principal` once with: the feature (`$ARGUMENTS`), the template,
the board, the assigned epic id, the procedural bars (goal falsifiability,
no colon-space sequence, state rules, Intent-surface rule, em-dash/board
rules), and the mandated output shape. The bars are the ones
`/board-create-card` steps 3–4 set: each child has a single testable `goal`
(falsifiable, not satisfiable by a stub, no colon-space sequence anywhere
in the value), `epic:` set to the epic's id, `state` `Ready` only if the
child is already detailed enough for the Council to deliberate on without
further clarification (otherwise `Backlog`), and the user-visible surface,
if any, named in the child's `Intent` — which screen, which copy, which
state. Principal's output, in its native `Reframe` format:

- the **child decomposition** — the slicing, with per-child `goal`, `state`
  (proposed `Backlog` or `Ready`), and surface flag;
- the **epic goal** — a one-line transcription of the human's intake.

**Wave 2 — `skeptic` + `designer` attack in parallel.**

Dispatch both with **identical input** (principal's artifact), each in its
native format, with the completeness charter. Independence preserved: no
input contains another seat's critique.

- `skeptic` attacks each `goal` for falsifiability / stub-satisfiability /
  colon-space and each `state` against the Ready-vs-Backlog bar, with
  runnable checks against the draft text itself.
- `designer` flags which children are surface-touching and argues the
  `Intent` must name the screen/copy/state, in its native `Design position`
  format.

**Completeness charter (scoped per-seat).** Attacking seats attack what's
missing as well as what's there; a wholesale rejection of the slicing is a
named disagreement, not a patch request. The charter is scoped so it never
collides with a seat's own body:

- `skeptic` attacks completeness **only in falsifiable form** — e.g. a goal
  satisfiable by a stub, a child whose `state` cannot be deliberated. It
  never files an observational "missing child" objection, because its
  `<how_an_objection_counts>` requires a runnable settling test and a
  missing child has none.
- `principal` and `designer` carry the **observational missing-child
  arguments** in their native formats (principal: seam-cut observations;
  designer: what the person needs).

**Wave 3 — `product-owner` rules, last, unconditionally.**

Dispatch `product-owner` with the amended draft + the disagreement ledger.
Ruling-only:

- ratify or amend the **epic goal** and each child's **`state`**;
- rule each open-judgment dispute the attackers surfaced, **dissent named**,
  in its `Ruling` / `Options rejected` / `Grounding` / `Reversibility`
  format;
- escalate what its `<escalation>` forbids (portfolio change, reversing a
  recorded human decision, the goal itself is the defect) to the human per
  SEATS-1.

It never re-slices children and never rewrites undisputed child goals — that
boundary is what keeps it ruling, not generating.

**Aggregation.** Aggregate **all recorded contributions** verbatim, labeled
by seat, by mechanical concordance — children aligned by stated scope,
agreeing elements drafted from the agreement and attributed to the seats
whose text produced them, single-source elements attributed to their
proposer, and every conflicting position recorded as a **named
disagreement** with both sides and their job ids. Never paraphrase a seat's
line and never resolve a disagreement. You author nothing at any step.

**Attribution and the disagreement ledger** live at the step-3 gate
presentation and the `runs/` transcript, **never in card files**. The gate
presentation has two clearly-separated parts: (1) the card text exactly as
it will be written, and (2) a clearly-separate, never-written ledger
surface — per-card `Contributors:` line naming every seat whose dispatch
produced a substantive contribution; a `Disagreements:` block listing any
seat that did not endorse the card as drafted, each disagreement a one- or
two-line note naming the seat and the dimension (scope, testability,
surface, state-assignment), verbatim or a faithful ≤2-line restatement;
and a `Decision: unresolved — your call` marker on every line of the
disagreement block. The ledger is **presented, never written** — it does
not survive onto the on-disk card.

**Part 1 card drafts must be attribution-free.** The card text presented
"exactly as each would be written to disk" carries no seat names, no wave
numbers, and no deliberation narrative — nothing that attributes, narrates,
or dates the deliberation. Forbidden in every card's frontmatter and
`Intent`: `(Designer, wave 2)`, `(product-owner, wave 3)`, `(skeptic, wave
2)`, "principal argued Ready; overruled", "principal flagged the drift in
wave 1", "Scope ruling (product-owner, wave 3)", "Why state is Backlog
(product-owner, wave 3)", "Evidence shape (skeptic, wave 2)" — any seat
name, wave number, or deliberation narrative, in any form. A card's
`Intent` names the user-visible surface and the goal's reasoning, never
who said what in which wave. Attribution belongs solely in the Part 2
ledger surface and the `runs/` transcript; if a card's text needs a
deliberation fact, it does not belong in the card — it belongs in the
ledger.

**Dispatch discipline.** Every dispatch is bounded: `council_dispatch` →
note the returned job id → `council_wait` with a window → on stall, cancel
+ one re-dispatch with the same input → on double-fail, stop and surface to
the human. Job ids are on record.

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
