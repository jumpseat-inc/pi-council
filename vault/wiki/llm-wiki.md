---
title: LLM Wiki
type: concept
summary: The three-layer LLM-maintained knowledge base pattern — vault/raw/ immutable sources → vault/wiki/ generated pages → vault/CLAUDE.md schema — that gives the Council compounding memory.
aliases: [wiki, karpathy wiki, vault]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-24
---

# LLM Wiki

> ⚠️ This is the Karpathy LLM-wiki pattern instantiated in this repo's `vault/`
> subtree (schema: `vault/CLAUDE.md`; scaffold template: `council/scaffold/vault/CLAUDE.md`)
> (captured 2026-08-23). Verify against `vault/CLAUDE.md` for the live operating rules.

Unlike a retrieval system that An-Indexes and rebuilds at query time, this wiki
is a **persistent, compounding artifact**: the LLM ingests each source once,
updates entity/concept pages, cross-references, and keeps the synthesis current.
It's edited (via `/wiki-*` procedures); never hand-edited by a seat.

## Three layers

1. **`vault/raw/`** — immutable sources (articles, transcripts, rulings). Read
   only, never edit. Images in `vault/raw/assets/`.
2. **`vault/wiki/`** — generated pages: `sources/<n></n> one per source; plus
   flat entity/concept/comparison/overview/synthesis pages (Obsidian resolves
   `links` by note title, not path).
3. **`vault/CLAUDE.md`** — the schema/rules the maintainer follows ($LAYERS,
   ops, page format). It is co-evolved with the human.

## Page format (frontmatter)

`title / type (source|entity|concept|comparison|overview|synthesis) / summary
(one sharp sentence) / aliases / tags / sources / created / updated`.
Body in concise prose, `wikilinks` on every concept that has/ought to have a
page, `## Related` + `## Sources` to close.

## The two nav files

- **`index.md`** — content-oriented catalog, updated on every project ingest.
- **`log.md`** — append-only timeline (`## [date] op | title`), newest first;
  greppable to see the wiki's evolution.

## The Council's relationship

Rulings land in `vault/raw/` as `*-rulings.md`; `/wiki-ingest` files them; seats
ground their positions via [[repository-grounding]]. The **council↔wiki flywheel**
is a feature — not an add-on (both ship together). This wiki page itself was
written by the repo-seed ingest skill.

## Related

- [[repository-grounding]], [[council-loop]]
- [[2026-08-23-pi-council-design-spec]]

## Sources

- `vault/CLAUDE.md`, `council/scaffold/vault/CLAUDE.md`
- the Karpathy bootstrap doc (`vault/.llm-wiki-bootstrap.md`)