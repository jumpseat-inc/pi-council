---
id: FLLWUP-4
title: Repair /council-tree RPC silent-no-op in navigator.ts:57
state: Backlog
owner: null
epic: null
goal: /council-tree in RPC mode either produces useful output or fails loudly; it never silently no-ops
---

## Intent

Filed from EV-7's step 13 sync per binding ruling **OV-2** (product-owner,
on record). EV-7 fixed the new inline panel path's guard to
`ctx.mode === "tui"`, but deliberately left the pre-existing modal path in
`navigator.ts:57` (`if (!ctx.hasUI)`) untouched — that path was out of EV-7's
scope.

The latent defect, closed as `closed-red` (C4) by EV-7's step-4 Skeptic:
`hasUI()` returns `true` in RPC mode (`runner.js:274-276` passes a real
`ExtensionUIContext`, not `noOpUIContext`), so the current `/council-tree`
guard `!ctx.hasUI` is false in RPC — it enters the TUI path, calls
`ctx.ui.custom()` which silently returns `undefined`, and produces **no
output and no error**. A user invoking `/council-tree` over RPC sees nothing
happen with zero diagnostic.

EV-7's replacement (a separate inline widget path guarded by
`surfaceForMode(ctx.mode)`) does not change whether this legacy modal path
in `navigator.ts` is still reachable. This card's `goal` deliberately leaves
the remedy open-ended, per the OV-2 ruling: **either** delete the now-dead
modal path, **or** fix its guard to `ctx.mode === "tui"` so RPC routes to the
console `textTree` fallback — whichever the engineering deliberation decides
is correct once EV-7's inline replacement is in place. The deciding fact is
whether the modal path is still reachable after EV-7:
- if EV-7 leaves the modal path dead/unreachable, delete it;
- if the modal path is still reachable and can walk the RPC silent-no-op,
  fix the guard.

Either way the observable outcome must be: invoking `/council-tree` in RPC
mode never silently no-ops — it either prints the text tree to console or
raises a clear error.

Boundaries:
- Must not regress EV-7's new inline path or its `surfaceForMode`/TUI guard.
- Must not touch the ambient above-editor widget's EV-4 plain-text/zero-ANSI
  contract.
- `navigator.ts` is the single file in scope (with tests).

## Acceptance

- `navigator.ts:57` `!ctx.hasUI` guard is either removed (dead path deleted)
  or corrected to route RPC to the console `textTree`.
- A test asserts /council-tree in RPC mode produces output or an error —
  never a silent no-op.
- All owner gates green: `bunx tsc --noEmit`, `bun test` full suite,
  `python3 council/validate.py`.
