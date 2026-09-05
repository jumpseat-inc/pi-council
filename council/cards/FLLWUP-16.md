---
id: FLLWUP-16
title: Seat dispatch inputs forbid main-repo branch-state mutation
state: In Review
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

### Recovery drill — reflog recovery from a main-repo branch-state reversion (Acceptance 2)

Documented from this run's real FLLWUP-13 incident (recovered at commit
`85dd8c4`, record above): a seat ran `git checkout <sha>` inside the main
repo, moving main's HEAD off the runner's record commits and reverting the
board/card faces to a pre-run state. The drill below is the bounded recover
this card exists to make routine; it is executable against a simulated
board reversion in a scratch clone (never against this repo's live main):

1. **Detect** the failure class — any of: `python3 council/validate.py`
   fails or reports a stale board (a board line missing, a card face
   reverted); `git log --oneline -1` in the main repo is not the runner's
   last record commit; `git status` shows the working tree at a foreign
   commit.
2. **Check for invalidation first**: in the FLLWUP-13 class, the Skeptic
   and Judge verify the PR head SHA directly, so a local-main HEAD move
   does not invalidate a PR-head verification — re-read the last-written
   record line and the pending verification's subject SHA before
   concluding anything was lost.
3. **Restore from the reflog** (the recovery is the sanctioned exception
   to the immutability constraint — it restores the very state the
   constraint protects; it is never a normal operation): `git reflog`
   (or `git reflog show main`) to locate the runner's last record commit
   — FLLWUP-13's actual recovery was `git checkout main`, which landed
   back on `f6f8e32` because main's reflog recorded the detour;
   equivalently restore directly to the record SHA (`git checkout
   <record-sha>` or `git reset --hard <record-sha>` on the recovered
   repo), then confirm `git status` clean and the record trail intact
   (`git log --oneline -5`).
4. **Verify**: `python3 council/validate.py` prints clean; re-read the
   card face and board and confirm the last-written record is intact;
   then continue the run from the recovered state. No verdict is
   invalidated by the recovery itself — only a verification that
   actually read the moved HEAD would be, and in this failure class it
   never does.

### Step 8 — In Review (owner implemented, PR #30 open)
Owner dispatched (job-3.1) at the card, settled in 1.5m. Delivery per its
report and confirmed observed artifacts: plan
`docs/superpowers/plans/2026-09-06-FLLWUP-16-main-repo-immutability.md`
(committed a925bfd, first); a `<main_repo_immutability>` block inserted in
`council/agents/council-runner.md` between `</dispatch_discipline>` and
`<return_contract>` — the main repository path's branch state is immutable
to the runner and every seat it dispatches; `git checkout`, `git switch`,
and `git reset` against the main repository path are forbidden (violation =
`HALT`); any branch state change happens in a dedicated worktree created
with `git worktree add`, and the runner must repeat the constraint in every
dispatch input it composes; driven payload test
`council-runner dispatch guidance forbids main-repo branch-state mutation
(FLLWUP-16)` asserting all five phrases (`main repository path`, `git
checkout`, `git switch`, `git reset`, `dedicated worktree`) on
`loadSeat(tmpRepo(), "council-runner").body`. RED→GREEN proven by the owner:
RED against the unmodified seat (missing `main repository path`), and the
assertion caught a real defect in the first GREEN attempt (`dedicated
worktree` split across a line wrap — fixed, then GREEN). No `extensions/`
change; no model-picker surface touched. Owner gates green in order in the
worktree: `bun install --frozen-lockfile` exit 0; `bunx tsc --noEmit`
clean; `bun test` 545 pass / 2 skip / 0 fail; `python3 council/validate.py`
clean. Facilitator-observed: PR #30 OPEN, branch
`fllwup-16-main-repo-immutability`, head
`dacf6be422346a868538b987ffe6e211652d4fcb`, base `main`; diff scope exactly
the plan + `council/agents/council-runner.md` + `test/seats.test.ts`
(`gh pr view 30`, `gh pr diff 30 --name-only`); worktree
`.worktrees/fllwup-16-main-repo-immutability` verified at the head; the
worktree's own seat test file: `bun test test/seats.test.ts` 33 pass / 0
fail. Set In Review per step 8's observed-artifact rule (branch + open PR).
