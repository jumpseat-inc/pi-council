---
id: EV-1
title: Add a --json output mode to the links CLI
state: Ready
owner: null
epic: null
goal: The links CLI emits extracted links as a JSON array when invoked with --json.
---

## Intent

The consumer repo is a small markdown link-extraction CLI (`bun src/cli.ts
<file>`). This card adds a `--json` flag so the output is a machine-readable
JSON array of `{text, url}` objects instead of the plain `text <url>` lines.

## Acceptance

- `bun src/cli.ts --json test/fixtures/sample.md` prints a JSON array with
  exactly the three sample links.
- The default (no flag) output is unchanged.
- The design spec and implementation plan land under `docs/superpowers/`.
