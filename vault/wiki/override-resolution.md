---
title: Override Resolution
type: concept
summary: How repo-local resources shadow packaged defaults by filename — seats at `<repo>/$CONFIG_DIR_NAME/agents/`, procedures at `…/council/procedures/`, plus mergeable model-floors and committable mcp.json. The tuning mechanism that makes forking unnecessary.
aliases: [overrides, repo-override]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

# Override Resolution

> ⚠️ Derived from `extensions/seats.ts` (`seatDirs`, `loadSeat`, `proceduresDir`),
> `extensions/index.ts` (command scan), docs / AGENTS.md (captured 2026-08-23). Verify against `seats.ts`.

pi-package's per-repo tuning mechanism. Every resource of a name resolves to the
**first hit in a precedence list**:

| Resource | Repo override path | Packaged default |
|---|---|---|
| Seat | `<repo>/$CONFIG_DIR_NAME/agents/<name>.md` | `<pkgRoot>/council/agents/<name>.md` |
| Procedure | `<repo>/$CONFIG_DIR_NAME/council/procedures/<file>.md` | `<pkgRoot>/council/procedures/<file>.md` |
| Model floors | `<repo>/$CONFIG_DIR_NAME/council/model-floors.json` (merge) | `<pkgRoot>/council/model-floors.json` |
| MCP config | `<repo>/$CONFIG_DIR_NAME/council/mcp.json` | scaffold default |

The rules:

- **First hit wins** — if a repo file exists it shadows the packaged one entirely
  (no merging at file level).
- **`listSeatNames`** unions both dirs so the command/console sees the superset;
  `loadSeat` returns the override when present.
- **Procedures** are scanned as `[repoOverride, packaged]` with filename
  dedupe, so an override file shadows the packaged one of the same name as a
  slash command (see [[procedure-commands]]).
- **Model floors** are **merge semantics** — repo keys win, shipped entries
  remain unless replaced.
- This is the sanctioned tuning mechanism — **do not fork the package** to
  specialize seats for one repo.

## Commit discipline

Repo overrides are committable `.pi/` content (but never `.pi/git/`, which is
pi's own clone).

## Related

- [[non-clobbering-scaffold]], [[seats]]
- [[model-output-floors]], [[mcp-support]]
- [[2026-08-23-pi-council-design-spec]] (Resource resolution)

## Sources

- `extensions/seats.ts`, `extensions/index.ts`
- `docs/superpowers/specs/2026-08-23-pi-council-design.md`