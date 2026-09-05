---
id: FLLWUP-17
title: Main-repo immutability constraint in the working seats' own guidance
state: Done
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

### Step 8 — In Review (owner implemented, PR #31 open)
Owner dispatched (job-4.1) at the card, settled in 1.6m. Delivery per its
report and confirmed observed artifacts: plan
`docs/superpowers/plans/2026-09-06-FLLWUP-17-seat-immutability.md`
(committed 2a23f2a, first); a `<main_repo_immutability>` block inserted in
each of `council/agents/owner.md` (between `</owner_mode>` and
`<bash_discipline>`), `council/agents/skeptic.md` (after
`</verification_mode>`), and `council/agents/judge.md` (adjacent to its
discipline blocks) — body text only, frontmatter untouched, voice adapted
per seat but carrying FLLWUP-16's substance: the main repository path's
branch state is immutable; `git checkout`/`git switch`/`git reset` against
the main repository path are forbidden; a violation is a `HALT` condition;
any branch state change happens in a dedicated worktree created with `git
worktree add`, never against the main checkout; the reflog-drill
consequence for the seat that mutates. Driven payload tests `owner/skeptic/
judge seat guidance forbids main-repo branch-state mutation (FLLWUP-17)` —
one per seat, five phrases each (`main repository path`, `git checkout`,
`git switch`, `git reset`, `dedicated worktree`), FLLWUP-16 runner-body
test pattern. RED→GREEN proven by the owner: each new test RED against the
unmodified seat body (first failure names the missing phrase), GREEN after
the block. No `extensions/` change; no model-picker surface. Owner gates
green in order in the worktree (`.worktrees/fllwup-17-seat-immutability` at
head): `bun install --frozen-lockfile` exit 0 ("no changes"); `bunx tsc
--noEmit` clean; `bun test` 548 pass / 2 skip / 0 fail;
`python3 council/validate.py` clean.
Facilitator-observed: PR #31 OPEN, branch `fllwup-17-seat-immutability`,
head `4da5a6b479923fc97e278258ef357f806b76cc6a`, base `main`; diff scope
exactly the five planned files (three seat bodies + plan +
`test/seats.test.ts`); test-file diff purely additive (the FLLWUP-16
runner-body test byte-identical); worktree verified at the head. Set In
Review per step 8's observed-artifact rule (branch + open PR).

### Step 9 — verified (cycle 1 of 3)
Skeptic dispatched at PR #31 head `4da5a6b` (job-4.2), settled in 3.9m.
All four gates re-run at the head in order, green with real output: `bun
install --frozen-lockfile` exit 0 ("no changes"); `bunx tsc --noEmit`
clean; `bun test` 548 pass / 2 skip / 0 fail; `python3 council/validate.py`
clean. Ten falsifiable checks, **all closed-green**: C1–C3 the
`<main_repo_immutability>` block present in each seat body — owner between
`</owner_mode>` and `<bash_discipline>`, skeptic between
`</verification_mode>` and `<bash_discipline>`, judge between
`</when_invoked>` and `<bash_discipline>` — each with the five required
phrases verbatim (driven tests green, 5 expects each); C4 the three driven
FLLWUP-17 payload tests (file run 36 pass / 0 fail / 86 expects); C5 plan
file exists; C6 `extensions/` diff empty; C7 frontmatter untouched (only
body blocks added); C8 FLLWUP-16 runner-body test byte-identical; C9 full
gate set green at the head; C10 gate integrity — defeat injection per
seat (block removed in the worktree, test RED naming the missing phrase,
restore GREEN) ×3. **Verdict: NO-BLOCK, 10/10 closed-green, no open
objection.** Verify cycles used: 1 of ≤3.

### Step 10 — judge PASS
Judge dispatched with the card's `goal` and the Skeptic's step-9 evidence
only (job-4.3), settled in 0.2m. Verdict **PASS**: re-ran the decisive
test at the head worktree (`bun test test/seats.test.ts -t "FLLWUP-17"` →
3 pass / 0 fail / 15 expect() calls), independently grep-confirmed the
five constraint phrases in all three seat bodies (owner/skeptic/judge),
the driven payload test per seat is present and green. No verify cycle
consumed (verify cycles used: 1 of ≤3).

### Step 11 — deterministic merge check (features-deliver substitution)
All five criteria met, read fresh against PR head
`4da5a6b479923fc97e278258ef357f806b76cc6a`: (1) owner gates green in
full (owner job-4.1 ran all four gates; Skeptic job-4.2 re-ran them at the
head: frozen-lockfile install exit 0, `bunx tsc --noEmit` clean, `bun
test` 548/2/0, `python3 council/validate.py` clean); (2) `gates` workflow
SUCCESS on the PR head SHA — `gh pr checks 31 --json name,state,workflow` →
`[{"name":"gates","state":"SUCCESS","workflow":"gates"}]` asserted on
the `workflow` field per the substitution, run 33958420339 completed
success at headSha 4da5a6b (the exact PR head, verified via `gh run list
--branch fllwup-17-seat-immutability`); (3) no blocking Skeptic objection
(NO-BLOCK, 10/10 closed-green); (4) judge PASS (job-4.3); (5) no Needs
Human / outstanding ruling (card In Review, zero escalations). Merged
`gh pr merge 31 --squash --match-head-commit 4da5a6b…` → PR #31 **MERGED**
(mergedAt 2026-09-05T09:41:21Z), squash commit
`f35d082208c077f140edf50e3cb61214854b44d7` on `main`. `gates` workflow
re-ran on the merged SHA: run 33958661326 (observed via `gh run list
--commit f35d082…`).

### Step 12 — Done
Local `main` reconciled by clean ort merge adopting the squash (f35d082)
while keeping this card's record commits (d83e6f1, 2613135, 32a838d,
85171a4) — the squash touches only the three seat bodies, the plan, and
`test/seats.test.ts`, no `council/` record overlap; merge exit 0,
conflict-marker sweep empty, squash confirmed an ancestor of local main.
`gates` workflow on the merged SHA (run 33958661326) completed/success
(observed via `gh run list --commit f35d082…`). Board and card set Done;
`validate.py` clean; reconciliation committed and pushed.
