---
title: Council Setup
type: concept
summary: EPIC-11 (Backlog) — a planned /council-setup procedure that grounds itself in the consuming repo, interviews the human with a recommendation on every question, and writes a fitted configuration without forking the packaged seat convictions.
aliases: [council setup, /council-setup, interview-driven setup]
tags: [pi-council/concept, pi-council/plan]
sources: []
created: 2026-09-20
updated: 2026-09-20
---

> ⚠️ **Planned — EPIC-11 is `Backlog` as of 2026-09-20; no `/council-setup`
> procedure is shipped yet.** This page records the epic's stated intent so the
> board and the wiki do not drift apart.

`/council-init` scaffolds a consumer repository mechanically and blind: it
installs the council's dependencies and copies the scaffold tree, seeding
`.council.json` with the council's own packaged defaults — so a consumer
receives the council's opinions with no fit to their codebase, stack, or
surfaces.

EPIC-11 adds `/council-setup`, a model-run procedure that:

1. **grounds itself in the consuming repository before asking anything**
   ([[repository-grounding]]),
2. **interviews the human** through the `rpiv-ask-user-question` extension
   ([[ask-user-question]]), with a recommendation attached to every question,
3. **writes a fitted configuration** through a consent-gated, non-clobbering,
   code-validated path.

The council's core opinions stay frozen: seat convictions modeled on a real
person, the `<repository_grounding>` block in every seat, a per-seat
intelligence tier, and model diversity across the roster. `/council-init` keeps
its engine duties (deps + non-clobbering scaffold) and hands off to
`/council-setup` in the same turn; `/council-setup` is independently re-runnable
and shows the current effective configuration as the default answer.

## Related

- [[non-clobbering-scaffold]] — `/council-init`, the engine half it hands off from
- [[council-config]], [[override-resolution]] — where the fitted configuration lands
- [[ask-user-question]] — the interview mechanism
- [[repository-grounding]] — the grounding the procedure front-loads

## Sources

- `council/cards/EPIC-11.md` (Backlog)
- `vault/raw/2026-09-19-po-epic11-decomposition-ruling.md` (not yet ingested as a source page)