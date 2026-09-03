# Design brief: a progress indicator for the links CLI

Context: the links-cli consumer repo extracts markdown links from a file and
prints one `text <url>` line per link. For large input files the command
feels unresponsive.

Task: design a small feature that reports progress while a large file is
being processed.

Constraints (binding):

- Plain text output only — no ANSI escapes, no TUI frameworks, no new
  runtime dependencies.
- The default output format must stay byte-compatible with the current
  `text <url>` lines so existing pipelines keep working.
- Progress must be skippable (`--quiet`) and disabled when stdout is not a
  TTY.
- Keep the design small enough to land as one card.
