---
title: Council Dependencies
type: concept
summary: The packages /council-init pins project-locally and preflight enforces — the superpowers skills package and the ask-user-question extension — resolved as a COUNCIL_DEPENDENCIES list with project-entry-wins semantics.
aliases: [superpowers-dependency, superpowers, dependencies, council dependencies]
tags: [pi-council/concept]
sources: ["[[2026-08-24-ask-user-question]]"]
created: 2026-08-23
updated: 2026-08-24
---

# Council Dependencies

> ⚠️ Derived from `extensions/dependencies.ts` (`COUNCIL_DEPENDENCIES`, `resolveCouncilDependencies`), `extensions/index.ts` (council-init), `council/scaffold/council/preflight.sh` (captured 2026-08-24). Verify against the code.

The council workflow depends on two pi packages, both pinned **project-locally**
by `/council-init` so they travel with the repo:

| Dependency | Source | Kind | Project install location |
|---|---|---|---|
| superpowers | `git:github.com/obra/superpowers` | skills package | `$CONFIG_DIR_NAME/git/github.com/obra/superpowers` |
| ask-user-question | `npm:@juicesharp/rpiv-ask-user-question` | extension | `$CONFIG_DIR_NAME/npm/node_modules/@juicesharp/rpiv-ask-user-question` |

`superpowers` supplies the skills (TDD, planning, debugging, worktrees); the
[[ask-user-question]] extension supplies a human-in-the-loop question tool.

## The list is the mechanism

`COUNCIL_DEPENDENCIES` (in `extensions/dependencies.ts`, formerly
`superpowers.ts`) is the single source of truth. `resolveCouncilDependencies`
reads the `packages` list out of both project
(`<repo>/$CONFIG_DIR_NAME/settings.json`) and global settings; a project entry
wins, and **portable** means the project-local pin is present. Adding a third
dependency is a list entry plus a preflight gate, not a new code path.

## Enforcement

- **`/council-init`** installs every missing dependency project-locally via
  `pi install -l <source>` (see [[non-clobbering-scaffold]]). On a headless or
  remote session (no trust prompt), it passes `--approve` to the install when
  the project isn't already trusted — running `/council-init` *is* the approval
  (v0.11.3; previously the install failed with "Project is not trusted").
  `--approve` is scoped to that single command, not a persistent grant.
- **`council/preflight.sh`** (run by `/council`, `/features-deliver`,
  `/features-new`) asserts each dependency's clone or settings pin; a missing
  dependency is a `FAIL:` with remediation (run `/council-init`, `/reload`)
  (see [[preflight]]).
- **`/features-new` step 0** — the "Dependencies gate" checks both pins before
  decomposing.

Made mandatory in v0.6.0 (superpowers, a `feat!`); ask-user-question landed
later as a second entry in the same list.

## Related

- [[ask-user-question]], [[seats]], [[preflight]], [[non-clobbering-scaffold]],
  [[headless-pi]]
- [[2026-08-25-council-init-approve]] — the v0.11.3 --approve fix

## Sources

- `extensions/dependencies.ts`
- `council/scaffold/council/preflight.sh`
- `README.md`, `AGENTS.md`
- [[2026-08-25-council-init-approve]]
