---
title: Override Resolution
type: concept
summary: How repo-local resources shadow packaged defaults — seats at `<repo>/$CONFIG_DIR_NAME/agents/` and procedures at `…/council/procedures/` by filename, plus mergeable model-floors, committable mcp.json, and the field-level `.council.json` seat override. The tuning mechanisms that make forking unnecessary.
aliases: [overrides, repo-override]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]", "[[2026-08-24-bugfix-seat-prose]]"]
created: 2026-08-23
updated: 2026-09-04
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
| Seat model/thinking | `<repo>/.council.json` → `council.<seat>.model`/`.thinking` (field-merge) | seat frontmatter |

The rules:

- **First hit wins** — if a repo file exists it shadows the packaged one entirely
  (no merging at file level).
- **`listSeatNames`** unions both dirs so the command/console sees the superset;
  `loadSeat` returns the override when present.
- **Procedures** are scanned as `[repoOverride, packaged]` with filename
  dedupe, so an override file shadows the packaged one of the same name as a
  slash command (see [[procedure-commands]]). The override path is built with
  `CONFIG_DIR_NAME`, never a literal `.pi` (AGENTS.md convention #3).
- **Model floors** are **merge semantics** — repo keys win, shipped entries
  remain unless replaced.
- **Field-level tier (v0.7.0)** — a committed `.council.json` at the repo root
  overrides just a seat's `model` + `thinking`, field-merge style: each field
  independently falls back to frontmatter (see [[council-config]]). This is the
  one resource type that does **not** shadow a whole file; it composes with
  filename shadowing (pick the seat body, then tune its model/thinking).
  Malformed config or invalid values throw rather than silently degrading.
- This is the sanctioned tuning mechanism — **do not fork the package** to
  specialize seats for one repo.

## Shadowing as a smoke-run technique (EPIC-3, v0.15.0)

Filename shadowing doubles as the **scratch-copy smoke technique**: to
exercise a rewritten procedure headlessly without touching the real board,
copy `council/` into a temp dir and place the rewrite at
`<scratch>/$CONFIG_DIR_NAME/council/procedures/<file>.md` — the override
path. The **user-scope install supplies the package** (do NOT project-pin
pi-council in the scratch: a project-local pin alongside the user-scope
install creates a dual-install tool conflict that broke the first attempt);
the scratch `council/` shadows the packaged payload by filename. See
[[smoke-test]] for the heavyweight Docker variant and
[[2026-09-04-epic3-run-ledger]] for the working invocation.

## Commit discipline

Repo overrides are committable `.pi/` content (but never `.pi/git/`, which is
pi's own clone).

## Related

- [[council-config]] — the field-level seat model/thinking override (v0.7.0)
- [[non-clobbering-scaffold]], [[seats]]
- [[model-output-floors]], [[mcp-support]]
- [[2026-08-23-council-json-override]], [[2026-08-23-pi-council-design-spec]] (Resource resolution)

## Sources

- `extensions/seats.ts`, `extensions/index.ts`
- `docs/superpowers/specs/2026-08-23-pi-council-design.md`
- [[2026-08-24-bugfix-seat-prose]]
- [[2026-08-23-agents]] — convention 5: repo-local resources shadow packaged ones by filename
- [[2026-09-04-epic3-run-ledger]] — the scratch-copy smoke technique built on this page