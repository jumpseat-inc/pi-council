---
title: 2026-08-23 "Pi-Council" Design Spec
type: source
summary: The plumbing design spec — package layout, override-aware resolution, grounding-block (replacing autoloadSkills), runtime-path substitution, commands, and engine changes. Approved design, pending implementation.
aliases: [design spec]
tags: [pi-council/source]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `docs/superpowers/specs/2026-08-23-pi-council-design.md` @ `46b9784` (captured 2026-08-23).
> Docs drift; the codebase is the source of truth — verify against code before relying on this.

The design spec behind pi-council as an installable package. It is the
generalization of the working council extension extracted from the source
repo and foundation for the implementation plan.

## What it specifies

- **Origin** — extracted from the source repo's `.pi/extensions/council/`.
- **Goal** — `pi install git:github.com/tistaharahap/pi-council` + `/council-init`
  gives any repo the identical workflow. The workflow's opinions ship as-is;
  only per-project **data** stays repo-local.
- **Package layout** — `extensions/` engine, `council/` payload (9 seats, 7
  procedures, scaffold), `test/`, `package.json`.
- **Resource resolution** — the core override model: repo override
  (`<repo>/$CONFIG_DIR_NAME/…`) first, packaged default second; package root
  resolved at runtime from `import.meta.url`.
- **Grounding model (replaces autoloadSkills)** — the `<repository_grounding>`
  block appended to every seat prompt; degraded line when no vault exists.
- **Runtime-path substitution** — `<council_runtime>` block, `$COUNCIL_PROCEDURES`
  and `$ARGUMENTS` substitution.
- **Commands** — directory scan, not hardcoded list; `/council-jobs`,
  `/council-init`.
- **Engine changes** — `PID_FILE_REL` → `<repo>/$CONFIG_DIR_NAME/council/.pids.json`,
  neutralized tool descriptions, the output-token-floor patch stays, `BUILTIN_MAP`
  stays, child mode uses override-aware loader.
- **Out of scope** — hub semantics unchanged, no new seats/procedure edits, no npm publish.
- **Testing** — describe ported suite + override-resolution idempotency web.

## Related

- [[pi-council-overview]]
- [[seats]], [[repository-grounding]], [[override-resolution]]
- [[pi-council-overview]] — the v0.1.0 result of this design

## Sources

- `docs/superpowers/specs/2026-08-23-pi-council-design.md` @ `46b9784`
- Companion implementation plan: [[2026-08-23-pi-council-implementation-plan]]