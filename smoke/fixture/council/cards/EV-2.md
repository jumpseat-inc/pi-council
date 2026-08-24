---
id: EV-2
title: Add --json output to links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI accepts a --json flag that prints the extracted links as a JSON array of objects with text and url fields.
---

## Intent

Machine-readable output so downstream tooling can consume extraction
results without parsing the human-oriented line format.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --json` prints a JSON array of three objects in document order; each object has exactly the fields "text" and "url".
- `--json --count` together exits 2 with a usage error on stderr.
- A test in `test/` covers the happy path and the flag conflict.
- Gates: `bun run typecheck` and `bun test` pass.
