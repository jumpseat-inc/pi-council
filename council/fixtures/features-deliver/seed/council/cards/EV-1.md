---
id: EV-1
title: Add a --json output mode to the links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI emits extracted links as a JSON array when invoked with --json.
---

## Intent

Add a `--json` flag printing an array of `{text, url}` objects instead of the
plain `text <url>` lines.

## Acceptance

- `bun src/cli.ts --json test/fixtures/sample.md` prints a JSON array with
  exactly the three sample links.
- The no-flag output is unchanged.
