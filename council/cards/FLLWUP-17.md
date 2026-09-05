---
id: FLLWUP-17
title: Main-repo immutability constraint in the working seats' own guidance
state: In Progress
owner: null
epic: EPIC-6
goal: The owner, skeptic, and judge seat bodies each carry the main-repo immutability constraint — git checkout, git switch, and git reset forbidden against the main repository path with branch state changes happening only in a dedicated worktree — proven by a driven payload test per seat asserting the constraint phrases on the packaged seat bodies.
---

## Intent

Filed from FLLWUP-16's delivery (council-runner report): FLLWUP-16
(merged `68e728d`) hardened the **runner's** side — the packaged
`council-runner` seat now carries the `<main_repo_immutability>` block and
must forward the constraint in every dispatch input it composes. But the
incident that motivated the hardening was a **working seat** violating the
main repo directly (FLLWUP-13 step 9, `git checkout <sha>` inside the main
repo, board/card faces reverted, reflog recovery). A constraint that lives
only in the runner's forward is lost the moment a forward is — the seat's
own guidance is the layer that survives every composition path.

This card puts the same block in the three working seats that actually run
git — `owner`, `skeptic`, `judge` — as payload on the packaged seat bodies
(`council/agents/owner.md`, `skeptic.md`, `judge.md`), asserted per seat by
driven payload tests in `test/seats.test.ts` (same pattern as the
FLLWUP-16 runner-body test). Belt and suspenders, matching the run's own
contamination lessons. Filed under EPIC-6 per the run's standing
orchestrator directive; surface is run mechanics, not the model picker.

## Acceptance

- Driven payload test per seat (owner, skeptic, judge) asserting the
  constraint phrases on the packaged seat body — naming `git checkout`,
  `git switch`, and `git reset` as forbidden against the main repository
  path and a dedicated worktree as the required mechanism.
- The existing FLLWUP-16 runner-body test stays green; no `extensions/`
  change; the picker surface is untouched.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution

### Step 1 gate — mechanical, not surface-touching

Mechanical: narrowly-scoped and unambiguous — three packaged seat bodies
(`council/agents/owner.md`, `skeptic.md`, `judge.md`) each gain the same
main-repo immutability constraint FLLWUP-16 shipped on the `council-runner`
(`<main_repo_immutability>`-class block: `git checkout`, `git switch`, and
`git reset` forbidden against the main repository path, branch state
changes only in a dedicated worktree), plus three driven payload tests in
`test/seats.test.ts` following the FLLWUP-16 runner-body test pattern. The
constraint content is fixed by the FLLWUP-16 block and the orchestrator
scope note — the same constraint, same voice, placed as body text adjacent
to each seat's existing discipline blocks — so there is no spec ambiguity
and no design tradeoff. No cross-seam reach: `extensions/` untouched, the
model-picker surface untouched. Not surface-touching: seat bodies are
agent guidance — nothing a person sees, reads, or does changes; no
user-visible copy, empty state, or error state (the same conclusion
FLLWUP-16 recorded for this class of change). Mechanical path skips steps
2–6 and proceeds to step 7 with the card itself as the owner handoff (no
spec file under `docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean (below).
Owner dispatched (job-4.1) at the card only — `Intent`/`goal`/`Acceptance`
verbatim plus this repo's gate set (`.github/workflows/gates.yml` is the
authoritative record — this repo has no `docs/gates/GATE-EVIDENCE.md`),
the worktree-only binding (never `git checkout`/`switch`/`reset` in the
main repo path — repeated per the runner's `<main_repo_immutability>`),
base-on-`origin/main` (`origin/main` = `39ef42f`; the local `main` carries
unpushed council record commits — `6c98d76` — that must not appear in the
PR diff), and branch/PR conventions named.
