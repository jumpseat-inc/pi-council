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

## Standing rulings (recorded Phase 1 — binding on every seat)

- **FLAG-POLICY** — Exactly one of `--count`, `--json`, `--images` may be
  given; any combination of two exits 2 with a usage error on stderr
  (mutual exclusion).
- **JSON-FORMAT** — Single-line compact JSON (`JSON.stringify`), trailing
  newline, fields `text` then `url` in document order; zero links prints
  `[]` plus newline. Error behavior matches EV-1 conventions: no file →
  exit 2 usage; missing file → exit 1 "cannot read"; two files → exit 2
  usage.
- **IMAGE-SCOPE** — (applies to EV-3) Inline markdown images
  `![alt](url)` with optional title, in document order, one line per
  image as `alt <url>`; empty alt prints `<url>`. Reference-style and
  HTML `<img>` are out of scope.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --json` prints a JSON array of three objects in document order; each object has exactly the fields "text" and "url".
- `--json --count` together exits 2 with a usage error on stderr.
- A test in `test/` covers the happy path and the flag conflict.
- Gates: `bun run typecheck` and `bun test` pass.
