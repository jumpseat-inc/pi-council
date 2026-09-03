---
id: EV-2
title: Add a --skip-images flag to the links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI omits image-markdown links when invoked with --skip-images.
---

## Intent

`extractLinks` already skips image syntax at extraction time; this card
exposes that as an explicit `--skip-images` flag on the CLI.

## Acceptance

- `bun src/cli.ts --skip-images test/fixtures/sample.md` prints only the
  three non-image links.
- The default output is unchanged.
