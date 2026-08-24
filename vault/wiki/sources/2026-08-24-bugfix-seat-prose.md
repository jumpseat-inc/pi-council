---
title: 2026-08-24 seat/procedure mechanism-reference hygiene (bugfix)
type: source
summary: A working-tree bugfix pass that purges ev-guide-era leftovers from packaged pi-council — the stale `deliver.md` filename, a repo-specific `GATE-EVIDENCE.md` gate path, a hardcoded `.pi`, and the pre-packaged "agent registry / restart" framing — locked in with regression tests.
aliases: [bugfix seat prose, mechanism-reference hygiene, deliver.md fix]
tags: [pi-council/source]
sources: []
created: 2026-08-24
updated: 2026-08-24
---

> ⚠️ Derived from the uncommitted working-tree diff over `council/agents/council-runner.md`,
> `council/procedures/features-deliver.md`, `council/procedures/features-new.md`,
> `extensions/index.ts`, `extensions/hub-tools.ts`, and `test/prose.test.ts`
> (captured 2026-08-24). Verify against those files.

Six fixes, all one family: references that were accurate for the pre-extraction
ev-guide design but wrong for pi-council, where seats and procedures are package
resources resolved from disk — not pi agents loaded into a startup registry.

## The six fixes

1. **`deliver.md` → `features-deliver.md`** — [[council-runner]] (three places)
   and `features-new.md` still named the procedure by its old filename.
2. **Dropped `docs/gates/GATE-EVIDENCE.md`** from [[council-loop]]'s
   `/features-deliver` deterministic merge check — that gate file is
   ev-guide-specific and not shipped; criterion 1 is now "every owner gate green,
   in full" (the owner seat body defines its own gates).
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

- Extraction from ev-guide left **mechanism prose** stale even where the engine
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
