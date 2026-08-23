---
description: Ingest a source into the LLM wiki under vault/
argument-hint: [path-or-filename under vault/raw/]
---
Read `vault/CLAUDE.md` first for the schema and conventions.

Ingest this source: $ARGUMENTS
(If given a bare filename, resolve it under `vault/raw/`.)

Follow the Ingest operation in vault/CLAUDE.md exactly: discuss takeaways with me
first, then write the source summary in `vault/wiki/sources/`, create/update the
affected entity and concept pages, cross-link both directions, flag any
contradictions, update `vault/wiki/index.md`, and append to `vault/wiki/log.md`.
Then report pages created, pages updated, and contradictions flagged.
