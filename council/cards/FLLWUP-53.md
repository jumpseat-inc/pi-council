---
id: FLLWUP-53
title: De-repo-specific council.md step 8's gate-file reference and widen the prose guard
state: Done
owner: null
epic: EPIC-9
goal: council.md no longer hard-references a gate document path that does not exist in this repo, and the packaged-prose guard covers every shipped file that could reintroduce one.
---

## Intent

FLLWUP-47 step 4 objection O7 (`closed-green`) confirmed a live, unguarded
instance of the failure FLLWUP-47 exists to prevent: `council.md` step 8
(lines 237-238 today) states "`docs/gates/GATE-EVIDENCE.md` is the
authoritative record of what those gates are and how to run them" — a hard,
source-repo-specific path presented as fact in a procedure that ships to every
consumer repo. That path does not exist in this repo (`docs/` holds only
`superpowers/`). The existing guard (`test/prose.test.ts`, the "features-deliver
does not hard-reference the repo-specific gate file" test at :28-34) reads
`features-deliver.md` alone, so it does not catch a second naming — FLLWUP-47
was explicitly constrained not to fix this (its spec §6 names it as a
step-13 residual). `owner.md` inside `<owner_mode>` carries the same path, but
as an `e.g.` example, which is weaker. The card is: replace the hard reference
with consumer-neutral phrasing (the repo's own authoritative gate record, if it
keeps one) and widen the guard to all packaged seat + procedure prose, rewording
`owner.md`'s example in the same pass if the widened guard requires it.

## Run record (features-deliver / FLLWUP-53, EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** The run-2 Phase-1
  scope ruling (284ced2, `EPIC-9.md` run-2 block) names the eleven `Backlog`
  residuals FLLWUP-50–60 as this run's delivery scope; the dispatch input
  orders this card **fifth of eleven** (steward build-order ruling, job-1).
  Run-2 precedent: each earlier card's runner applied the same autonomous
  promotion at its start (FLLWUP-60 commit `08fdb83`, FLLWUP-57 `bb5c5e8`,
  FLLWUP-51 `68e2edf`). Cited ruling: Phase-1 **scope** (this run's own
  recorded human decision). Promotion commit pushed under R3 (disclosed in
  the report).
- **Path: mechanical.** The deliverable is confined to one seam — packaged
  procedure + seat prose and its own regression guard: (1) the single
  hard-reference sentence in `council/procedures/council.md` step 8, (2) the
  widened guard in `test/prose.test.ts` (the existing `councilMarkdown()`
  helper already enumerates every packaged seat + procedure body, so the
  widening is the existing guard's scope, not a new mechanism), and (3) the
  `e.g.` example in `council/agents/owner.md` reworded in the same pass
  because the widened guard otherwise reds it. The `goal` fixes the outcome
  and the `Intent` fixes the method; the residual choices (exact replacement
  phrasing, guard's forbidden token) are implementation choices, not a real
  tradeoff. No cross-seam reach: no engine module, no `validate.py`, no
  scaffold or fixture tree carries `council/procedures/` or `council/agents/`
  (verified by find; also no `GATE-EVIDENCE` token in either), so no digest
  re-pin is owed. Steps 2–6 skipped per council.md step 1.
- **Surface-touching: yes (recorded).** The deliverable changes procedure
  prose a person (the operator/facilitator) reads. On a mechanical card this
  seats no `designer` (council.md step 1); any design concern is a step-13
  follow-up candidate, never a reason to reopen. (FLLWUP-60, the same prose
  class, recorded the same call.)
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in the installed package clone
  (`council/agents/`, byte-identical `owner.md` confirmed by diff), and no
  repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by
  this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information → `PASS: preflight
  clean`, exit 0. Main checkout clean, `HEAD` == `origin/main` at `45d3b8a`
  (the FLLWUP-51 close). `python3 council/validate.py` → `All council
  artifacts valid`. No `Needs Human` state and no outstanding ruling on this
  card — deterministic merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here — the very fact this
  card fixes): `bash council/preflight.sh FLLWUP-53`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Grounded facts (verified at this tree):** the live instance is
  `council.md:237-238` ("`docs/gates/GATE-EVIDENCE.md` is the authoritative
  record of what those gates are and how to run them"); `owner.md:97-99`
  carries the same path as an `e.g.` example ("Where the repo keeps an
  authoritative gate document (e.g. `docs/gates/GATE-EVIDENCE.md`), it
  outranks the wiki"); the guard (`test/prose.test.ts:28-34`) reads
  `features-deliver.md` alone; the `councilMarkdown()` helper at :7-17
  already scans all `council/agents/*.md` + `council/procedures/*.md`; no
  other packaged prose names the path (grep over `council/`, `docs/`,
  `test/` — card records and plans naming it are historical records and are
  not packaged prose). Existing pins that must stay green: FLLWUP-60's step-12
  record-push pin and FLLWUP-51's wrapped-goal pin (both in
  `test/prose.test.ts`), FLLWUP-41/42's pins, FLLWUP-47's red-base pins, and
  the stack-neutrality guard (replacement prose must stay free of
  `bun`/`bunx`/`tsc`/`typescript`).
- **Rulings applied here (cited, not re-asked):** R2 governs the later
  merge; R3 governs this run's record pushes (run-scoped, disclosed);
  step-13 follow-up confirmation is re-homed to `product-owner`. No
  card-specific Phase-1 ruling beyond R2/R3 (per the dispatch input).

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff: its `goal`,
`Intent`, and the step-1 grounded facts. Card set `In Progress`;
`validate.py` clean; `owner` dispatched (45-minute window).

### Step 8 — owner delivered (job-10.1), PR #71 open

`owner` (4.7m, 21 turns, `stopReason=stop`, tokens in 63771 / out 6947 /
cR 627904 / cW 0 / reason 1552 / total 698622, cost≈$0.0191 catalogue)
implemented in worktree `.worktrees/fllwup-53` (branch
`feat/fllwup-53-neutral-gate-record`, cut from `origin/main` `a54e8f8`),
pushed, PR #71 open at head `e130d9aaa1cb9ca1f11b840d4261cbc556a9e992`.
Observed directly (not from the seat's report): `gh pr view 71` → state
OPEN, base `main`, headRefOid `e130d9a…`, `mergeable: MERGEABLE`
(mergeStateStatus `BLOCKED` — the ruleset's approving-review / PR-only
requirement, which R2's `--admin` bypass clears at merge time). Diff scope
(4 files): `council/procedures/council.md` step 8 reworded to
consumer-neutral phrasing ("the repo's own authoritative gate record, if it
keeps one, is the source of truth for what those gates are and how to run
them"), `council/agents/owner.md` example reworded ("an authoritative gate
document … outranks the wiki", no path), `test/prose.test.ts` guard widened
from `features-deliver.md`-only to the `councilMarkdown()` enumeration of
all packaged seats + procedures (renamed "packaged council prose does not
hard-reference the repo-specific gate file", failure-class comment added),
plan doc `docs/superpowers/plans/2026-09-17-FLLWUP-53-neutral-gate-record.md`.
No engine change; scaffold/fixtures/vault untouched; all existing pins
preserved.

Owner gates green at head, real output: `bash council/preflight.sh
FLLWUP-53` → `PASS: preflight clean` (exit 0; branch-freshness clause green
— origin/main had not advanced past the `a54e8f8` cut); `bunx tsc --noEmit`
exit 0; `bun test` **909 pass / 2 skip / 0 fail** (911 tests, 79 files);
`python3 council/validate.py` → `All council artifacts valid`. Red-first
recorded: the widened guard FAILs pre-edit (`agents/owner.md
hard-references the repo-specific gate file` — Expected to not contain:
"GATE-EVIDENCE.md"), GREEN after the prose edits (17/17 in that file); grep
confirms the token absent from all packaged prose.

Main checkout verified clean (`git status --short` empty), `main` still at
`a54e8f8` == `origin/main` after the push. Card set `In Review` (sole
precondition: open PR, observed).

### Step 9 — Skeptic NO-BLOCK at head e130d9a (verify cycle 1 of ≤3)

Skeptic (job-10.2, 3.6m, 13 turns, tokens in 46496 / out 13661 / total
492285, cost≈$0.0096 catalogue) verified at the pinned subject — head SHA
`e130d9aaa1cb9ca1f11b840d4261cbc556a9e992`, head worktree
`.worktrees/fllwup-53` — with the loop frame stated (step 9 precedes step
10 judging and step 11's facilitator-executed mechanical merge). Verdict:
**NO-BLOCK**, eight objections, all `closed-green`, each with a real run at
the head:

1. Goal clause 1 — `grep -rn GATE-EVIDENCE council/agents/ council/procedures/`
   → 0 hits (token survives only in historical card records, plans/specs,
   wiki history, and the guard's own forbidden token). **closed-green.**
2. Goal clause 2 — widened guard reads `councilMarkdown()` over both
   subdirs; coverage demonstrated red on a seat file the old guard never
   read: live red run at `079a014` (test widened, prose unreworded) →
   `agents/owner.md hard-references the repo-specific gate file`
   (16 pass / 1 fail). **closed-green.**
3. Red-first claim — `git log` at head: `079a014` (red test) precedes
   `f2f693c` (prose reword) precedes `e130d9a` (plan); the red run matches
   the owner's recorded red verbatim. **closed-green.**
4. Sentence-meaning integrity — both reworded passages read at head; owner-
   clears-every-gate and gate-document-outranks-wiki meanings retained, only
   the consumer-specific path dropped. **closed-green.**
5. Existing pins — full suite at head **909 pass / 2 skip / 0 fail** (911
   tests, 79 files), matching the owner's counts exactly; `validate.py` →
   `All council artifacts valid`. **closed-green.**
6. Stack-neutrality — grep over the two edited prose files: zero hits
   (plan-doc hits are not packaged prose and are not scanned).
   **closed-green.**
7. Scope fences — `git diff a54e8f8..HEAD` is exactly the 3 prose/test
   files + the plan doc; no scaffold/fixtures/vault/engine/package.json; no
   historical card record edited; board/card deltas vs origin/main are this
   runner's own record push, not branch commits. **closed-green.**
8. Gates re-run in full at head — `tsc` exit 0; `bun test` 909/2/0;
   `validate.py` clean; `preflight.sh FLLWUP-53` → the branch-freshness
   clause FAIL (`local history does not descend from origin/main`) recorded
   verbatim, exit 1, all other clauses OK — the standing FLLWUP-27 known
   artifact (this runner's record push `3e81f81` advanced `origin/main`
   past the `a54e8f8` cut), not reclassified; the operative re-run set
   (tsc/bun test/validate.py) fully green. **closed-green.**

No `open-untested` residual; one non-blocking cosmetic note (a merged long
line at `council.md:239`, wrap cosmetics only).

### Step 10 — judge PASS (job-10.3)

Judge (0.2m, 3 turns, tokens in 10888 / out 1018 / total 32130,
cost≈$0.0030 catalogue), input bounded to the card's `goal` + the step-9
Skeptic evidence. Verdict: **PASS**. Basis: its own grep at the head
worktree → `GATE-EVIDENCE` zero matches in packaged prose (exit 1); its own
`bun test test/prose.test.ts` at the head → 17 pass / 0 fail, with the
widened guard's prior red at `079a014` confirming it actually catches the
failure class. Both goal clauses satisfied.

### Step 11 — deterministic merge check, merged (R2 applied and cited)

Five criteria executed mechanically at PR #71, head
`e130d9aaa1cb9ca1f11b840d4261cbc556a9e992`:

1. **Owner gates green in full** — step-9 skeptic re-ran the operative set
   at the head: `tsc` exit 0, `bun test` 909/2/0, `validate.py` clean;
   preflight's branch-freshness clause FAIL recorded verbatim per the
   standing FLLWUP-27 known-artifact note, never reclassified.
2. **`gates` workflow SUCCESS on the PR head SHA** — `gh pr checks 71
   --json name,state,workflow` → `[{"name":"gates","state":"SUCCESS",
   "workflow":"gates"}]`, asserted on the `workflow` field; `headRefOid`
   re-read immediately before the merge as `e130d9a…` and pinned via
   `--match-head-commit`.
3. **No blocking Skeptic objection** — step 9 NO-BLOCK, all eight
   objections `closed-green`.
4. **Judge PASS** (job-10.3).
5. **No `Needs Human` state / outstanding ruling** — card `In Review`,
   zero escalations; R2/R3 are recorded run-scoped Phase-1 rulings applied
   and cited, not open rulings.

Merged under R2 (run-scoped `--admin` authorization, cited):
`gh pr merge 71 --squash --admin --match-head-commit e130d9a…` exit 0 →
PR #71 **MERGED**, squash commit **`e3b070c03d7addb5b216e7c28916107a14e69cee`**
on `main`.

### Step 12 — Done

Local `main` fast-forwarded `113068f` → `e3b070c` — clean FF, no union
merge needed. **CI on the merged SHA observed directly:**
`gh api repos/.../commits/e3b070c…/check-runs` → `gates` completed
**success**. `validate.py` clean; card and board set `Done`; record commit
pushed directly to `main` under R3 (run-scoped authorization, cited;
disclosed in the report). Verify loop closed at cycle 1 of ≤3 with no
`open-untested` residual.

### Step 13 — follow-up candidates

**None.** Nothing surfaced that was not done: both goal clauses are
fixed and Skeptic-verified closed; the widened guard's substring limitation
(differently-named repo-specific gate paths are not matched) is the card
Intent's fixed forbidden token, not a deferred idea; the FLLWUP-27
preflight branch-freshness artifact is already carded; no designer seat, no
CDP smokes. The skeptic's non-blocking cosmetic note (one merged long line
at `council.md:239`, wrap cosmetics only, no meaning or pin impact) implies
no work a card should carry — any future edit to that sentence rewraps it
for free. Per the Phase-1 follow-up ruling the draft-then-confirm gate
routes to `product-owner` via the orchestrator: with no candidates drafted,
there is nothing to confirm (FLLWUP-57 precedent).

### Step 14 — ingest owed (recorded, not hand-edited)

`vault/wiki/sources/2026-08-24-bugfix-seat-prose.md` describes the
GATE-EVIDENCE guard as per-file ("no `GATE-EVIDENCE.md` in
`features-deliver.md`") — factually stale as of this card: the guard now
scans every packaged seat + procedure, and the last two live instances
(`council.md` step 8, `owner.md`'s `e.g.`) are gone (squash `e3b070c`).
Per council.md step 14, `vault/` is never hand-edited; the ingest routes to
the orchestrator's `/wiki-ingest` pass (EV-46/EV-47, Backlog, govern ingest
at card completion / run ledger). The obligation is recorded here; `vault/`
was not touched by this run.
