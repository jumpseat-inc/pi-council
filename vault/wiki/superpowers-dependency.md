---
title: Superpowers Dependency
type: concept
summary: The council depends on the superpowers skills package (TDD, planning, debugging, worktrees) — pinned project-locally by /council-init; preflight refuses a run without it.
aliases: [superpowers, skills package]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

# Superpowers Dependency

> ⚠️ Derived from `extensions/superpowers.ts` (`resolveSuperpowers`), `extensions/index.ts` (council-init), `council/scaffold/council/preflight.sh` (captured 2026-08-23). Verify against the code.

**superpowers** (`git:github.com/obra/superpowers`) is a pi package of skills —
test-driven development, writing/executing plans, systematic debugging,
git worktrees, verification-before-completion — that the council workflow leans
on, and **depends on**. `council-runners`, seats, and the `/council` loop assume
these skills are readable in-context.

## The dependency is enforced

Starting v0.6.0:

- **`/council-init` installs it project-local** via `resolveSuperpowers` +
  `pi install -l git:.../superpowers` when the project-local pin is missing. It
  is a hard **project-local** (portable) presence, not just global.
- **`council/preflight.sh`** (run by `/council`, `/features-deliver`,
  `/features-new`) checks: the superpowers clone exists under
  `$CONFIG_DIR_NAME/git/github.com/obra/superpowers` OR `.p.settings.json` has
  the pin. If missing → `FAIL:` with remediation (run `/council-init`, `/reload`).
- **Seats pointer** to the skills most relevant to their role via a
  `<skills_guidance>` block (e.g. owner → writing-plans, skeptic →
  systematic-debugging; the three judgment seats get none).

## Config

- `SUPERPOWERS_SOURCE = "git:github.com/obra/superpowers"` in `superpowers.ts`.
- Scope resolution reads `packages` out of both project (`<repo>/$CONFIG_DIR_NAME/settings.json`)
  and global settings files; project-entry wins, and **portable** is defined as
  the project-local pin being present.
- **Made mandatory in v0.6.0** (a `feat!`): preflight refuses the council and
  `/features-new` refuses to decompose until superpowers is pinned project-local.

## Related

- [[seats]], [[preflight]], [[non-clobbering-scaffold]]

## Sources

- `extensions/superpowers.ts`
- `council/scaffold/council/preflight.sh`
- `README.md`, `AGENTS.md`