---
title: Extension Load Scope
type: concept
summary: pi resolves a package from the project settings first, then the global install — so when pi-council is pinned only globally, the running engine is the global clone, and a working-tree `extensions/` change is not live until it is pushed, the install updated, and pi reloaded.
aliases: [load scope, extension load scope, global vs project install, package resolution scope, stale clone]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-22-gate-noul-fix]]", "[[2026-08-24-ask-user-question]]"]
created: 2026-09-22
updated: 2026-09-22
---

# Extension Load Scope

pi resolves a package from the **project** settings
(`<repo>/$CONFIG_DIR_NAME/settings.json`) first, falling back to the **global**
install (`~/.pi/agent/settings.json`); a project entry wins over a global one
([[council-dependencies]]). Which clone wins decides which `extensions/` code
the running session actually executes.

## The gotcha

When pi-council is pinned **only globally** (the project settings list other
packages but not pi-council), the running engine is the **global clone** at
`~/.pi/agent/git/github.com/jumpseat-inc/pi-council` — **not** the working tree
you are editing. Editing `extensions/*.ts` in the repo changes nothing in the
live session, and `/reload` reloads the global clone.

This bit the noul fix: the fix was committed to the working tree, but the
in-session `council_followup_gate` still returned the old drift error because
the loaded clone predated it. See [[2026-09-22-gate-noul-fix]].

## Payload vs engine

The two halves load differently, which is why the symptom was confusing:

- **Repo-local `council/` payload** (procedures, cards, the board) is read from
  the working tree — so `/features-new`, `/features-deliver`, and the board
  flows work against your edits immediately.
- **`extensions/` engine code** comes from the loaded package clone — so an
  engine change is invisible until the clone is updated.

## The dev loop for an engine change

1. Commit the change.
2. **Push** it (`git push origin main`) — or otherwise make the commit reachable
   by the installed clone.
3. Update the global install (fetch/checkout the commit) or, if you want the
   working tree to win, add pi-council to the **project** `.pi/settings.json` so
   the project entry shadows the global one.
4. `/reload`.

Diagnosing a "fixed but not live" symptom: read the `packages` lists in
`<repo>/$CONFIG_DIR_NAME/settings.json` and `~/.pi/agent/settings.json`, then
compare the loaded clone's `package.json` version / a marker symbol in the
changed module against your working tree.

## Related

- [[council-dependencies]] — the project-entry-wins resolution and the pins
- [[non-clobbering-scaffold]] — project-local installs `/council-init` performs
- [[headless-pi]] — the non-interactive modes this scope also governs
- [[pi-council-overview]] — the package the scope resolves
- [[2026-09-22-gate-noul-fix]] — the incident that surfaced the scope

## Sources

- `vault/raw/2026-09-22-gate-noul-fix.md`
- `~/.pi/agent/settings.json`, `.pi/settings.json` (install pins)
