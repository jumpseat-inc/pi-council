---
id: EV-3
title: Add --images extraction to links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI accepts an --images flag that prints every markdown image reference as alt text followed by its URL, one per line.
---

## Intent

Inspect image usage in a document the same way links are inspected today.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --images` prints exactly two lines — `logo <https://example.com/logo.png>` then `banner <https://example.com/banner.png>` — and exits 0.
- Without the flag, image syntax is not printed (current behavior unchanged).
- A test in `test/` covers image extraction against `test/fixtures/sample.md`.
- Gates: `bun run typecheck` and `bun test` pass.
