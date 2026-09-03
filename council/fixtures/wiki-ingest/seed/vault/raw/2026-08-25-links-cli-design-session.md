# Links CLI design session (raw notes)

Discussion notes from a working session on the links-cli consumer repo.
These notes are the raw material for the wiki — they have not been
summarized, cross-linked, or verified.

## What links-cli does today

- `bun src/cli.ts <file>` extracts markdown links from a file and prints one
  `text <url>` line per link.
- Extraction uses a single regex over `[text](url)` and `[text](url "title")`
  forms, with a negative lookbehind so image syntax `![alt](src)` is skipped.
- The repo test suite runs under bun; ten behavioral tests are green.

## Design discussion

- The team wants a `--json` flag for machine-readable output: one JSON array
  of `{text, url}` objects, deterministic ordering (document order).
- They discussed a `--skip-images` flag; the extraction layer already skips
  images, so the team leaned toward keeping the flag as an explicit CLI
  surface rather than a hidden default.
- A `count` subcommand was proposed to make pipeline scripts simpler: print
  a single integer, exit 0.

## Open questions

- Should `--json` pretty-print or emit compact JSON? Undecided.
- Should the CLI exit non-zero on an unreadable file? Yes, this is expected
  behavior (exit 1 currently).

## Facts to capture (entities/concepts)

- Entity: links-cli (the consumer CLI).
- Concept: markdown link extraction.
- Concept: machine-readable output.
