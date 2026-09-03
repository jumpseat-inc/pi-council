---
id: EV-1
title: Add a --json output mode to the links CLI
state: In Progress
owner: null
epic: null
goal: The links CLI emits extracted links as a JSON array when invoked with --json.
---

## Intent

Add a `--json` flag to the links CLI printing an array of `{text, url}`
objects instead of the plain `text <url>` lines.

## Acceptance

- `bun src/cli.ts --json test/fixtures/sample.md` prints a JSON array with
  exactly the three sample links.
- The no-flag output is unchanged.
- The test suite stays green.

## Deliverables

The implementation is complete and its doc lives at `deliverables/EV-1.md`.
This card's remaining work is the final gate: re-run the local gates, verify
the deliverables, and write the run summary to `records/EV-1-run.md`.
