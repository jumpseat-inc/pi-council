---
id: EV-3
title: Add a count subcommand to the links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI prints the number of extracted links when invoked as count.
---

## Intent

Add a `count` subcommand printing a single integer: the number of extracted
links in the input file.

## Acceptance

- `bun src/cli.ts count test/fixtures/sample.md` prints `3`.
