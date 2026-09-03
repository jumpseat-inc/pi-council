# EV-1 deliverable: --json output mode

Delivered and verified before this card's final gate:

- `src/cli.ts` gains a `--json` flag printing a JSON array of `{text, url}`
  objects; the no-flag path is unchanged.
- `test/links.test.ts` covers the JSON path (three sample links, document
  order).
- Local gates re-run clean on the deliverable branch: `bun test` 0 fail,
  `python3 council/validate.py` valid.
