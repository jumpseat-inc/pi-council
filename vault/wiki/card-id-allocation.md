---
title: Card ID Allocation
type: concept
summary: Board ids (EV-/FLLWUP-/BUG-/EPIC-) are allocated at fetched HEAD, never from a stale clone's memory — the EPIC-3/EPIC-4 collision lesson, with union-merge reconciliation and validate.py as the net.
aliases: [id allocation, id collision, numbering discipline]
tags: [pi-council/concept, pi-council/board]
sources: ["[[2026-09-04-epic3-run-ledger]]", "[[2026-09-04-epic4-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Card ID Allocation

Board card ids are **globally unique filenames** (`council/cards/<id>.md`,
prefix `EV-`/`FLLWUP-`/`BUG-`/`EPIC-`, `[1-9]\d*` — see
[[engineering-board]]). The allocation procedure ("scan `council/cards/` for
the highest existing number and increment") is only as good as the card
directory you scan. The EPIC-3 run (2026-09-03/04) proved the failure mode:

## The collision

A parallel session (the model-eval harness) worked from a clone whose base
**predated EPIC-3 entirely**, scanned its stale `council/cards/`, and
allocated `EPIC-3` + `EV-10..15` to itself. Our autonomous run held the real
EPIC-3 + EV-10..12. The other session noticed and renumbered itself to
`EPIC-4` + `EV-16..21` — but on a remote tip that still did not contain our
epic, so the two mains **diverged** (16 vs 3 commits past a merge base older
than either epic). Both "fixes" were correct locally; neither was globally
consistent.

## The rules the collision bought

1. **Allocate at fetched HEAD.** Before assigning any id: `git fetch`,
   confirm local main == origin/main, then scan. An id assigned from a stale
   clone's memory is a collision committed to history.
2. **Reconcile divergence by union merge, never rewrite.** The fix merged
   both card sets (`13af33e`), resolved `board.md` by taking **both**
   sessions' lines under their frontmatter-state columns, and pushed. Gaps
   in numbering (EV-13..15 went unused) are harmless; duplicates are not.
3. **validate.py is the net, and it bites the reconciler too.** It caught
   **both** of the orchestrator's own board-resolution mistakes during that
   merge (a duplicate EPIC-4 line; cards placed under the wrong state
   column). Run it after every conflict resolution step — the union you
   think you wrote is not always the union on disk.
4. **In a multi-session repo, every push re-fetches.** The model-eval epic
   kept landing alongside the EPIC-3 run; three separate
   fetch/rebase/resolve cycles were needed. Resolve every board conflict by
   union — never drop the other session's lines.
5. **EPIC-4 escalated the pattern to divergent mainline history.** Local
   main held five unpushed EV-20 record commits while origin/main carried
   parallel EV-11/EV-12 runs; reconciled by union *merge*, deliberately
   NOT rebase — rebase would have rewritten SHAs cited verbatim in card
   records. A parallel reconcile from a stale snapshot twice regressed
   the in-flight card's board state (In Progress → Ready); resolution
   rule: the card's own run record is authoritative for its own state.
   Push rejections are routine, not errors — fetch, reconcile, retry.

## Related

- [[engineering-board]] — the id schema and board discipline
- [[three-wave-decomposition]] — the run that collided
- [[2026-09-04-epic3-run-ledger]] — the full incident record

## Sources

- [[2026-09-04-epic3-run-ledger]]
- `council/procedures/board-create-card.md` step 2 (the id-assignment rule this page hardens)
