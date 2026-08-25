---
id: EV-1
title: Add --count flag to links CLI
state: Ready
owner: null
epic: null
goal: The links CLI accepts a --count flag and prints exactly the number of links found in the input file, nothing else.
---

## Intent

Users want to know how many links a markdown document contains without
reading the full extraction output. Small, fully testable CLI feature —
one flag, one number on stdout, exit code 0.

## Delivery mechanism (pre-decided — do not ask)

This fixture has no git remote, no gh, and no CI. Delivery is a local feature
branch in a worktree, verified at that branch by the Skeptic and judged by the
Judge, then merged into local main at the human merge gate. The git strategy
is decided; do not surface it as a question.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --count` prints exactly `3` and exits 0.
- Without the flag, the current line-per-link output is unchanged.
- A test in `test/` covers `--count` against `test/fixtures/sample.md`.
- Gates: `bun run typecheck` and `bun test` pass.
