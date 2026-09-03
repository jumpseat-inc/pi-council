---
id: EPIC-3
title: Council-decomposed features-new with a bounded session
state: Backlog
owner: null
epic: null
goal: Running /features-new produces the epic and child card drafts through a bounded multi-seat council deliberation in which interested seats participate rather than a solo facilitator draft, with the human draft-then-confirm approval gate intact before anything reaches the board
---

## Intent

Today /features-new decomposes a feature solo — the facilitator running the
command reads the template and board, assigns ids, slices children, and
writes goals alone, then presents the draft. The maintainer wants the
decomposition itself deliberated by the council, with interested seats
participating, and the session bounded the way /council bounds its rounds —
not an open-ended exchange.

The gate that matters most is preserved — every card this command writes is
later executed unattended by /features-deliver, so nothing reaches the board
without the human seeing the exact draft first (step 3 draft-then-confirm,
unchanged). Seats advise on the decomposition — slicing, goal drafting,
state assignment, designer-surface flags — the human still approves the
full set.

Scope boundaries — payload changes to council/procedures/features-new.md
plus documentation; no engine work expected — parent sessions already hold
council_dispatch/council_wait/council_cancel, so seat participation needs no
new tooling. validate.py, the board format, and /board-create-card are
untouched. Meta note — this epic changes the command that produced this
epic; children must keep the command's own human gate intact while they
rewrite it.

Deliverables across children — (1) EV-10, seat participation in the
decomposition; (2) EV-11, the bounded session (round cap, convergence,
fallback); (3) EV-12, docs capture the new flow. EV-10 first; EV-11 builds
on its procedure text; EV-12 last.

## Acceptance

- Running /features-new on a toy feature dispatches council seats, and the
  draft presented to the human attributes seat contributions and names
  unresolved disagreements.
- The decomposition session terminates within its stated bound with an
  explicit convergence or fallback outcome every run.
- python3 council/validate.py stays green; the draft-then-confirm gate
  (write nothing before explicit human approval) survives verbatim.
