---
id: FLLWUP-15
title: Search-mode modal frame fits the terminal at full window height
state: Done
owner: null
epic: EPIC-6
goal: With the search row visible at full window height the modal's frame renders without dropping its last line, achieved by shrinking the model window to `maxRows - 1` in search mode, proven by a driven render test at the tightest height asserting the frame's bottom border is present.
---

## Intent

Filed from EV-27's delivery (pre-existing tail-clip seam, made reachable
by the search row): `withModalFrame` wraps the rendered body in a frame,
and at full window height the extra search-row line pushes the frame's
bottom border past the terminal — a +1 line overrun in search mode. The
fix shape named during EV-27's deliberation is a search-mode window of
`maxRows - 1`, so the total render height is unchanged from the
non-search case while one fewer model row is visible. Surface is the
`/council-models` modal's model level at the tightest terminal heights.

## Acceptance

- A driven render test at the tightest height with search active asserts
  the frame's bottom border line is present in the output.
- The non-search rendering at every height is byte-identical to the
  pre-change suite (the window shrink applies only when the search row is
  visible).
- With search active at full height, exactly one fewer model row is
  visible than in the non-search case, and selection/clamping still
  reaches every filtered row by scrolling.

## Execution

### Step 1 gate — mechanical AND surface-touching

Mechanical: narrowly-scoped, unambiguous, fix shape ruled on the card
face (search-mode model window of `maxRows - 1`), confined to one area
(the model level's windowing when `searchActive` plus a driven render
test). The ruled copy is binding and untouched — `NO_MATCH`,
`NO_MATCH_HINT`, `PRE_SEARCH_HINT`, `SEARCH_HINT`, the four footers, and
`▌`-absent-from-non-search all stay byte-exact (Phase 1 rulings EPIC-6
R-1, FLLWUP-13 R-1, BUG-1 R-1/R-2/R-3). No `withModalFrame` core change
(council.md step 1: the fix shape applies to the model-rows window, not
fixed chrome), no cross-seam reach (`extensions/` scope is
`model-picker.ts` + the picker tests). Surface-touching: yes — the
`/council-models` modal's visible frame at tight terminal heights is the
card's entire subject. Per council.md step 1 a surface-touching
*mechanical* card seats no `designer` (no deliberation to join) and any
design concern files as a follow-up at step 13, never a reopen.
Mechanical path skips steps 2–6 and proceeds to step 7 with the card
itself as the owner handoff (no spec file under
`docs/superpowers/specs/`).

### Step 7 — In Progress, handed to owner

Card set In Progress on frontmatter and board; `validate.py` clean.
Owner dispatched (job-1.1) at the card — `goal`/`Intent`/`Acceptance`
verbatim plus the orchestrator's binding constraints (the render this
card must fit changed twice since filing: BUG-1's `press / to filter
models` pre-press hint and FLLWUP-13's `↓ then esc exits search`
no-match hint; verify the frame fits at the tightest height in ALL
search-mode render branches — rows present, and the zero-match branch
with its two ruled hint lines — or correctly scope the card to the
row-present branch and file the zero-match case as a follow-up
candidate if it needs different treatment; hiding the interaction is
not allowed), the Phase 1 rulings verbatim, this repo's gate set
(`.github/workflows/gates.yml` is the authoritative record — this repo
has no dataset-import or server-boot gate, so the owner's full gate
set is `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`,
`python3 council/validate.py`, all in order, in full), the
worktree-only binding (never `git checkout`/`switch`/`reset` in the
main repo path; worktree under `.worktrees/`), base-on-`origin/main`
(the local `main` carries the runner's council record commits that
must not appear in the PR diff), and Conventional Commits.

Facilitator probe, first-hand at the current `origin/main` head
(`/tmp/fllwup15-probe.mjs`, scratch):

- `withModalFrame(theme, w, termRows, content, { maxPanelHeight:
  termRows - 2 })` caps the panel at `termRows - 2` rows and tail-clips
  content to `min(content, termRows - 4)` lines — the frame's bottom
  border is present at every height in every branch (row 8 of 10 at the
  tightest height), so a literal "bottom border present" assertion does
  not distinguish the fix (vacuous pre-fix). The observable defect is
  the tail-clip of the ruler approach: with the window filled, the
  ruled FOOTER_MODEL copy and trailing rows are clipped from the frame.
- At the tightest height (termRows 10, maxRows 8) the `maxRows - 1`
  search window changes search-mode content from 11 lines (header +
  search row + 8 rows + footer) to 10 (header + search row + 7 rows +
  footer) — parity with the hint-dismissed non-search count of 10,
  and exactly one fewer windowed model row than non-search's 8. These
  are the assertable pre-fix/post-fix deltas; the driven test must be
  RED on the pre-fix branch.
- Zero-match search content is 5 fixed lines (header, search row,
  `No models matching "<query>".`, `↓ then esc exits search`,
  FOOTER_MODEL); at the tightest height capacity is 6, so that branch
  already fits fully — the fix touches it only via the unchanged
  +search-row line, and the driven test covers it as a distinct branch.

### Step 8 — owner implemented; In Review

Owner (job-8.1) settled in 4.0m. TDD: plan at
`docs/superpowers/plans/2026-09-05-FLLWUP-15-modal-frame-fit.md`, driven
test suite RED against the unmodified code (`bun test
test/model-picker.test.ts -t "FLLWUP-15"` → 3 fail / 1 pass, expected
length 7 vs 8), then the fix — one seam in `extensions/model-picker.ts`:
`effectiveMaxRows()` returns `maxRows - 1` only at level 2 with
`searchActive`, consumed by both `windowStart()` and `pushRows()` so
scroll centering and the row slice share one budget; zero copy /
styling / ruler-footer changes; non-search paths untouched by
construction (the probe-verified opener wiring in `council-models.ts`
stays identical) → GREEN (4 pass / 0 fail; full file 44 pass / 0
fail). All four gates in order at the head worktree:
`bun install --frozen-lockfile` exit 0 (215 packages), `bunx tsc
--noEmit` clean, `bun test` 555 pass / 2 skip / 0 fail,
`python3 council/validate.py` clean. All search-mode branches at the
tightest height (termRows 10) verified by the owner: rows-present
(search = 7 windowed rows / 10 content lines vs non-search 8/10-ish —
windowed parity, one fewer model row; border present), zero-match (5
fixed lines fit fully — NO_MATCH + NO_MATCH_HINT + FOOTER_MODEL +
border at row 7 of 10 — needs no treatment, no follow-up required),
acceptance-3 clamps over a 100-row filtered set (200×Down → tail,
Enter selects `p/m49:high`), acceptance-2 non-search byte-identity
sweep 10/12/16/24/40. Owner scoping note: `withModalFrame`'s tail-clip
(pinned by `navigator.test.ts`) drops the ruled footer from the framed
output for a full model window in BOTH search and non-search at tight
heights — a pre-existing designed cap, identical pre/post fix, out of
this card's scope; the fix restores the search branch's content-budget
parity (11→10), the +1 overrun the card named.

Facilitator-observed: PR #35 OPEN, branch `fllwup-15-modal-frame-fit`,
head `cc46e37c56549c16e4bd26c40611affeeb752926`, base `main`
(baseRefOid `3c4abb1` = current origin/main; merge-base ==
origin/main, so no council record commits ride the PR), diff scope
exactly the three planned files (plan, `extensions/model-picker.ts`,
`test/model-picker.test.ts`), worktree
`.worktrees/fllwup-15-modal-frame-fit` clean at the head. Set In
Review per step 8's observed-artifact rule (branch + open PR).

### Step 9 — verified (cycle 1 of 3)

Skeptic dispatched at PR #35 head `cc46e37` (job-8.2), settled in 8.4m
— input named the exact verification subject (PR head SHA `cc46e37` +
head worktree path `.worktrees/fllwup-15-modal-frame-fit`) and the loop
frame (step 9 verification precedes step 10 judging and step 11's
mechanical merge, facilitator-executed, no seat performs). All four
gates re-run at the head in order, green with real output: `bun
install --frozen-lockfile` 224 packages no changes; `bunx tsc
--noEmit` clean; `bun test` 555 pass / 2 skip / 0 fail (2592
expect()); `python3 council/validate.py` clean. Four objections, all
**closed-green**: O1 driven-test non-vacuity (defeat injection: fix
commit reverted → 3 fail expected-7-received-8 / 1 pass zero-match;
restored → 4/4 green — the discriminating assertion is the windowed
row count, not the always-present border); O2 acceptance-3 holds even
in the FRAMED output at the tightest height (framed model rows:
non-search 5, search 4, difference 1); O3 gate integrity — driven test
provably RED pre-fix / GREEN post-fix; O4 non-search byte-identity
sweep 10/12/16/24/40 with the `effectiveMaxRows()` guard. Diff-scope
check: `git diff origin/main...HEAD -- council/` → 0 lines (no record
commits ride the PR); 3 files. Owner's tail-clip scoping note
confirmed closed-green: pre-existing, identical pre/post fix, fix
applies to the model-rows window only; the framed difference is still
exactly one fewer model row. **Verdict: NO-BLOCK, 4/4 closed-green,
no open objection.** Verify cycles used: 1 of ≤3.

### Step 11 — deterministic merge check (features-deliver substitution)

All five criteria met, read fresh against PR head
`cc46e37c56549c16e4bd26c40611affeeb752926`: (1) owner gates green in
full (owner job-8.1 ran all four gates in the head worktree; skeptic
job-8.2 re-ran them at the head: `bun install --frozen-lockfile` 224
packages no changes, `bunx tsc --noEmit` clean, `bun test` 555/2/0,
`python3 council/validate.py` clean); (2) `gates` workflow SUCCESS on
the PR head SHA — `gh pr checks 35 --json name,state,workflow` →
`[{"name":"gates","state":"SUCCESS","workflow":"gates"}]`
asserted on the `workflow` field per the substitution, headRefOid
re-read == `cc46e37…` immediately before the merge; (3) no blocking
Skeptic objection (NO-BLOCK, 4/4 closed-green); (4) judge PASS
(job-8.3); (5) no Needs Human / outstanding ruling (card In Review,
zero escalations). Merged `gh pr merge 35 --squash --match-head-commit
cc46e37…` → PR #35 **MERGED** (mergedAt 2026-09-05T10:29:25Z),
squash commit `0be0a26e3a16fa4d1cf224c3004881383cae9288` on `main`.

### Step 12 — Done

`gates` workflow on the merged SHA `0be0a26e` (run 33960792805,
observed via `gh run list --commit 0be0a26e…`, workflowName gates)
completed success. Board and card set Done; `validate.py` clean;
reconciliation fast-forwarded cleanly — origin/main adopted the
squash `0be0a26e` directly on top of this card's record commits
(3c4abb1/18f4477/9c3a501, pushed as they happened per the record
discipline), so `git merge origin/main` was a pure fast-forward
(`git diff origin/main HEAD --stat` empty; conflict-marker sweep
clean — the lone `<<<<<<< HEAD` in `council/cards/FLLWUP-9.md` is
pre-existing record text at line 184, untouched by the squash),
committed and pushed.

Follow-up scan (step 13): no filing proposal. The run verified all
search-mode render branches at the tightest height — rows-present
window-binds parity via `maxRows - 1` (acceptance 1/3), zero-match
branch fits fully with both ruled hint lines (no different treatment
needed), non-search byte-identity (acceptance 2). A short-list probe
(scratch `/tmp/fllwup15-shortlist.mjs`) confirmed the BUG-1 hint line
balances the search row for lists shorter than the window — no
irreducible +1 residual exists there either. The only residual is
`withModalFrame`'s designed tail-clip dropping the ruled footer from
the FRAMED output for both modes at tight heights with a full window
— pre-existing, pinned by `navigator.test.ts`, identical pre/post
fix, same frame-fitting class as this card (not a genuinely new
failure class per the orchestrator's standing rule), and ruled out of
scope by EV-27 §8 and the card's "model-rows window, not fixed chrome"
binding — so no follow-up candidate is proposed.
