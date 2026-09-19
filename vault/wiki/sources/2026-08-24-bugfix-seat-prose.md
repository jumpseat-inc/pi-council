---
title: 2026-08-24 seat/procedure mechanism-reference hygiene (bugfix)
type: source
summary: A working-tree bugfix pass that purges extraction-era leftovers from packaged pi-council — the stale `deliver.md` filename, a repo-specific `GATE-EVIDENCE.md` gate path, a hardcoded `.pi`, and the pre-packaged "agent registry / restart" framing — locked in with regression tests. Its guard was widened to every packaged seat and procedure in 2026-09-18 (FLLWUP-53), after a second gate-path naming survived in `council.md`.
aliases: [bugfix seat prose, mechanism-reference hygiene, deliver.md fix]
tags: [pi-council/source]
sources: ["[[2026-09-18-epic9-residual-run-2-ledger]]"]
created: 2026-08-24
updated: 2026-09-18
---

> ⚠️ Derived from the uncommitted working-tree diff over `council/agents/council-runner.md`,
> `council/procedures/features-deliver.md`, `council/procedures/features-new.md`,
> `extensions/index.ts`, `extensions/hub-tools.ts`, and `test/prose.test.ts`
> (captured 2026-08-24). Verify against those files.

Six fixes, all one family: references that were accurate for the pre-extraction
source-repo design but wrong for pi-council, where seats and procedures are package
resources resolved from disk — not pi agents loaded into a startup registry.

## The six fixes

1. **`deliver.md` → `features-deliver.md`** — [[council-runner]] (three places)
   and `features-new.md` still named the procedure by its old filename.
2. **Dropped `docs/gates/GATE-EVIDENCE.md`** from [[council-loop]]'s
   `/features-deliver` deterministic merge check — that gate file is
   source-repo-specific and not shipped; criterion 1 is now "every owner gate green,
   in full" (the owner seat body defines its own gates).
   ️ **Superseded in part (FLLWUP-53, 2026-09-18, `e3b070c0`).** This fix
   covered **`features-deliver.md` alone**, and a **second naming survived
   unguarded**: `council.md` step 8 presented the same source-repo-specific
   `docs/gates/GATE-EVIDENCE.md` path as fact (and `owner.md` carried it as an
   `e.g.`). FLLWUP-53 replaced it with consumer-neutral phrasing ("the repo's own
   authoritative gate record, if it keeps one"), reworded `owner.md`'s example,
   and **widened the guard from `features-deliver.md` to every packaged seat and
   procedure** (`councilMarkdown()` enumeration). Lesson: a guard scoped to one
   file does not cover a second emitter of the same defect class. See
   [[2026-09-18-epic9-residual-run-2-ledger]].
3. **Hardcoded `.pi` → `CONFIG_DIR_NAME`** in the [[procedure-commands]] scan
   loop (`extensions/index.ts`), consistent with AGENTS.md convention #3 and
   [[override-resolution]].
4. **`council_dispatch` seat description** corrected in [[hub-job-supervision]] —
   was "Seat name from .pi/agents/"; now states seats resolve from disk at
   dispatch time, shadowed by a repo-local override.
5. **"Registry/restart" → disk resolution** in [[council-runner]]'s
   `<seat_resolution_check>` and `HALT` example, and in `/features-deliver`
   Phase 0. `loadSeat` reads seat files fresh per dispatch; a missing seat is a
   missing seat file (package or override), not a session that needs restarting.
6. **`test/prose.test.ts`** — regression guards: no bare `deliver.md`, no
   `GATE-EVIDENCE.md` in `features-deliver.md`, and no `registry`/`named agent`
   framing in council prose.

## Takeaways

- Extraction from the source repo left **mechanism prose** stale even where the engine
  was already generalized — filenames and resolution framing, not just path
  literals.
- Seat resolution is now explicitly **disk-at-dispatch-time** ([[seats]],
  [[override-resolution]]); there is no agent registry to refresh.

## Related

- [[council-runner]], [[council-loop]], [[procedure-commands]]
- [[hub-job-supervision]], [[override-resolution]], [[seats]]

## Sources

- Working-tree diff: `council/agents/council-runner.md`,
  `council/procedures/features-deliver.md`, `council/procedures/features-new.md`,
  `extensions/index.ts`, `extensions/hub-tools.ts`, `test/prose.test.ts`
