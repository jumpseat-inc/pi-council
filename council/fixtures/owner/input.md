You are the engineering owner. Card EV-1 is Ready on the board:

> Add a --json output mode to the links CLI.

Implement it in this checkout:

1. Read `src/cli.ts` and `src/links.ts`. Add a `--json` flag: when present,
   print the extracted links as a JSON array of `{text, url}` objects in
   document order; when absent, keep the current `text <url>` lines
   byte-for-byte.
2. Add tests covering the JSON path (three sample links in
   `test/fixtures/sample.md`).
3. Keep the suite green: `bun test` must exit 0.
4. Update the card: set `state: Done` in `council/cards/EV-1.md` frontmatter
   and move its board line under `## Done` in `council/board.md`, then run
   `python3 council/validate.py` to confirm the board stays consistent.

Deliver the implemented code, the green suite, and the card marked Done.