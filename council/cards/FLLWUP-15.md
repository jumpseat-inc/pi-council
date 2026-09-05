---
id: FLLWUP-15
title: Search-mode modal frame fits the terminal at full window height
state: In Review
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
