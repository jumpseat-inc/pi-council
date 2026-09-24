# FLLWUP-120 — red-at-base record (red_base_convention, seven fields)

## 1. Base identity

- **Base sha:** `193c724531d16297f2809ab203f41fa151e31d8e`
- **Base-selection rule satisfied:** the commit immediately preceding FLLWUP-120's
  mechanism change on `feat/epic25-residuals` (the branch head at dispatch time —
  FLLWUP-119's commit, which contains no renderWidget guard and no stale-ctx
  constant).
- **Base role:** `required` (the falsifier exercises the renderWidget seam, which
  only exists unguarded before the mechanism lands).

## 2. Transplant identity

Exactly one file materialized into the base worktree that does not exist at the
base sha:

- `test/fllwup120-stale-ctx.test.ts` — copied from the owner worktree
  `/home/tista/codes/pi-council/.worktrees/epic25` (working tree, pre-mechanism
  head), with the head version's `import activateCouncil, { STALE_CTX_MARKER }`
  inlined to `import activateCouncil` and the template-literal marker
  `${STALE_CTX_MARKER}` inlined to the literal string — necessary because
  `STALE_CTX_PREFIX` is part of the head-side mechanism and does not exist at
  base. Source head for the copy: the owner worktree's working tree at base
  commit `193c724531d16297f2809ab203f41fa151e31d8e` + the in-process edit above.

## 3. Exact command (both halves)

```
bun test test/fllwup120-stale-ctx.test.ts
```

(invoked from the worktree root, as the repo's test command is.)

## 4. Raw red output (verbatim)

```
fllwup120-stale-ctx.test.ts:
65 | function makeCtx(): { ctx: any; invalidate: () => void; touches: () => number } {
66 | 	const state = { live: true, uiTouches: 0 };
67 | 	const assertActive = () => {
68 | 		if (!state.live) {
69 | 			state.uiTouches++;
70 | 			throw new Error(
                  ^
error: This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession().
      at assertActive (/home/tista/codes/pi-council/.worktrees/fllwup120-red/test/fllwup120-stale-ctx.test.ts:70:14)
      at hasUI (/home/tista/codes/pi-council/.worktrees/fllwup120-red/test/fllwup120-stale-ctx.test.ts:81:4)
      at renderWidget (/home/tista/codes/pi-council/.worktrees/fllwup120-red/extensions/index.ts:722:8)
      at <anonymous> (/home/tista/codes/pi-council/.worktrees/fllwup120-red/extensions/index.ts:775:4)
      at settle (/home/tista/codes/pi-council/.worktrees/fllwup120-red/extensions/hub.ts:396:8)
      at <anonymous> (/home/tista/codes/pi-council/.worktrees/fllwup120-red/extensions/hub.ts:290:9)
      at emit (node:events:103:22)
      at #maybeClose (node:child_process:827:16)
      at #handleOnExit (node:child_process:570:72)
(fail) FLLWUP-120: a dispatched job settling after its parent print-mode turn tore down drives renderWidget against the disposed ctx without an unhandled stale-ctx crash [268.10ms]

 0 pass
 1 fail
 3 expect() calls
Ran 1 test across 1 file. [733.00ms]
```

The identical red was also observed twice before this recorded run (first red
observation at 273.00ms, second at 270.34ms, same stack), so the red is not a
one-off scheduling accident — the close→settle→onChange fan-out deterministically
reaches renderWidget after invalidate in this harness.

## 5. Worktree provenance

`git worktree add --detach /home/tista/codes/pi-council/.worktrees/fllwup120-red 193c724`
from the owner worktree `/home/tista/codes/pi-council/.worktrees/epic25`. The main
checkout (`/home/tista/codes/pi-council`, branch state) was never touched; the
worktree was detached at the base sha and was removed after the run
(`git worktree remove --force`).

## 6. Copy set

**Bare copy** — only the transplant file (§2) was placed in the base worktree.
No other files were added or modified (verified: `git status --short` showed only
`?? test/fllwup120-stale-ctx.test.ts`). One qualification that applies equally to
the head half: `node_modules` is not tracked, so dependency resolution walks up
from `/home/tista/codes/pi-council/.worktrees/fllwup120-red` to the main
checkout's `/home/tista/codes/pi-council/node_modules`. The same walk-up serves
the head half, so both halves share one dependency set.

## 7. Head half

- **Head sha:** `718c45029310dbf812b4f8ae9a5e3cffb946df82`, the FLLWUP-120
  mechanism commit on `feat/epic25-residuals`. An intermediate commit
  `4448ae5d3612b73d7bcd3931c9911938baf8d1d2` carried the identical code tree
  and was amended only to correct this record; the diff between the two is
  artifact-file-only, and the green below was re-observed fresh at the final
  tree (`e3c5a07a0f35d7dea28ef6d663cecf963be368ca`).
- Same exact command: `bun test test/fllwup120-stale-ctx.test.ts`
- Result: **1 pass / 0 fail** (fresh run at the committed head; the test file
  as committed imports the engine-owned `STALE_CTX_PREFIX` constant).

## Mechanism-absent boundary (owner's record; derivation is the skeptic's)

The sole per-failure line names `renderWidget` in
`extensions/index.ts:722` reading the stale ctx via `settle` (`hub.ts:396`) →
`onChange` (`hub.ts:775` caller) — an artifact of the mechanism under test (the
unguarded renderWidget seam, present at base, guarded at head). No failure names
anything inside the copy set, so the red is mechanism-absent class: at base, with
the mechanism absent, the crash class escapes; at head it does not.
