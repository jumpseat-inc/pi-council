---
id: FLLWUP-16
title: Seat dispatch inputs forbid main-repo branch-state mutation
state: In Progress
owner: null
epic: EPIC-6
goal: Working seats dispatched by council-runner receive dispatch inputs that forbid git checkout, git switch, and git reset against the main repository path and require any branch state change to happen in a dedicated worktree, proven by a driven test asserting the constraint is present in the packaged council-runner seat's dispatch discipline plus a documented reflog recovery drill executable against a simulated board reversion.
---

## Intent

Filed from this run's own incidents (council-runner report, FLLWUP-13
delivery): twice in this run, board/card record state was lost to
branch-state tampering from inside seat or container runs. The BUG-1
container died with zeroed worktree admin metadata (`.git/config` wiped,
worktree HEAD/ORIG_HEAD/index zeroed), and during FLLWUP-13's step 9 a seat
ran `git checkout <sha>` inside the **main repo**, moving main's HEAD off
the runner's record commits and reverting the board and card faces to a
pre-run state — recovered from reflog, no verdict invalidated, but the
single-writer board discipline was violated by construction.

The council-runner's `<board_discipline>` makes the runner the single
writer of `council/board.md` and the card file, but nothing in the dispatch
inputs the runner composes for its working seats forbids a seat from
mutating the main repository's branch state directly. This card hardens the
dispatch guidance so every working seat is told, in its input, that the
main repo path's branch state is immutable to it — any checkout, switch, or
reset happens in a dedicated worktree — and pins the constraint with a
driven payload test plus a documented recovery drill, so the next
disruption is a bounded recover instead of a rediscovery.

Filed under EPIC-6 per the run's standing orchestrator directive
(run-filed follow-ups carry `epic: EPIC-6` and complete within the run),
though the surface is run mechanics rather than the model picker.

## Acceptance

- Driven test asserting the packaged `council-runner` seat's dispatch
  guidance contains the main-repo immutability constraint — naming
  `git checkout`, `git switch`, and `git reset` as forbidden against the
  main repository path and a dedicated worktree as the required mechanism
  for any branch state change.
- A documented reflog recovery drill (detect board/card reversion, restore
  main from reflog, verify `validate.py` clean) recorded on the card's run
  record, executable by a runner that hits the failure class.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution

### Step 1 gate — mechanical, not surface-touching

Mechanical: narrowly-scoped, unambiguous, confined to one area — the
council payload/test surface (packaged `council-runner` seat at
`council/agents/council-runner.md` plus a driven payload test in
`test/seats.test.ts`), with no cross-seam reach into the engine
(`extensions/` untouched; the orchestrator's scope note binds: do not
touch `extensions/hub.ts` semantics), no spec-ambiguity, no design
tradeoff — the constraint's placement is fixed by the orchestrator scope
note (the runner's `<dispatch_discipline>` or an adjacent block). Not
surface-touching: nothing a person sees, reads, or does changes; the
constraint addresses working seats (agents), not persons, and no
user-visible copy, empty state, or error state is touched. Mechanical path
skips steps 2–6 and proceeds directly to step 7 with the card itself as
the owner handoff (no spec file under `docs/superpowers/specs/`).

Mapping finding (recorded per the orchestrator scope note, not escalated):
the card face's "dispatch input builder" wording maps to `council-runner`
composing each dispatch input itself per its procedure, with its seat body
as the standing guidance it always holds while composing — so the
enforceable, testable artifact is the packaged `council-runner` seat's
dispatch discipline block (plus the driven payload test), exactly as the
scope note concluded.

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean (below).
Owner dispatched (job-3.1) at the card only — `Intent`/`goal`/`Acceptance`
verbatim plus the scope note's binding mapping — with this repo's gate set
(`.github/workflows/gates.yml` is the authoritative record — this repo has
no `docs/gates/GATE-EVIDENCE.md`, purged in the domain-neutralization
commit), the worktree-only binding (never `git checkout`/`switch`/`reset`
in the main repo path), base-on-`origin/main` (the local `main` carries
unpushed council record commits that must not appear in the PR diff), and
branch/PR conventions named.
