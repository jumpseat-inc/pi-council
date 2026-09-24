---
id: FLLWUP-118
title: Pin the shared FRONTMATTER_RE anchor shape at the byte-0 boundary
state: Done
owner: null
epic: EPIC-25
goal: The shared `FRONTMATTER_RE` constant (`extensions/seats.ts:598`, shared by `readProcedureBody`'s strip and `epicKeyFromFace`'s match scope) is byte-0-anchored by design, and that shape is documented as a deliberate, tested choice — a synthetic-face test in `test/card-epic-key.test.ts` pins the byte-0-anchored behavior with the caveat's disposition stated in the test header, plus a JSDoc note on the constant itself — so a future regex tweak cannot silently change which faces parse.
---

## Intent

The step-4 skeptic's documented caveat (FLLWUP-115 deliberation record, O5):
the shared `FRONTMATTER_RE` constant is byte-0-anchored, so a card face with
a leading blank line or a closing `---` at EOF without a trailing newline
would make the frontmatter-scoped derivation throw where the old whole-file
derivation derived a key (old=KEY / scoped=THROW). Zero such faces exist on
the current corpus, and the corpus equivalence sweep (T4,
`test/card-epic-key.test.ts`) would red immediately if one appeared — which
is the intended contract — but nothing yet documents the anchor's shape as a
deliberate, tested choice. The constant's existing JSDoc names the caveat,
but no test pins the behavior: a future regex tweak (loosening the anchor,
changing the closing-dash handling) could silently change which faces parse,
and only the corpus sweep would notice — and only on the packaged corpus of
the day, not on the edge shapes themselves.

This card pins the edge shape directly:

- **The test** (in `test/card-epic-key.test.ts`): synthetic faces exercising
  the byte-0 boundary — at minimum (a) a face with a leading blank line
  before the opening `---`, and (b) a face whose closing `---` sits at EOF
  without a trailing newline — asserting the derivation behavior each shape
  produces under the delivered `epicKeyFromFace`, with the caveat's
  disposition (old=KEY / scoped=THROW; zero corpus faces; T4 reds on any
  future one) stated in the test header.
- **The JSDoc note on the constant itself**, so a reader at
  `FRONTMATTER_RE` sees the anchor's shape as a contract: what the anchor
  demands, which synthetic shapes the test pins, and that a regex tweak
  changing them must update the pin deliberately.

Pin ships in `test/`, never `council/validate.py` (the EPIC-14 J2 rule:
`council/validate.py` validates board/card record structure only). No
executable line in `extensions/seats.ts` changes; the only TS edit is JSDoc
comment text. Test-only + JSDoc, zero behavior change → **no `package.json`
version bump**.

Filed from FLLWUP-115's step-13 candidate (draft title "Pin the shared
FRONTMATTER_RE anchor shape at the byte-0 boundary"), recorded gate
disposition `Mode: File — composite 0.44 < merge threshold 1.00 (active)`,
held unfiled by the FLLWUP-115 container (job-4) pending confirmation,
confirmed by the product-owner ruling (job-5).

## Acceptance

1. `test/card-epic-key.test.ts` gains a byte-0-anchor test: synthetic faces
   with (a) a leading blank line before the opening `---` and (b) a closing
   `---` at EOF without a trailing newline, driven through the real exported
   `epicKeyFromFace`, asserting the delivered derivation behavior for each
   shape (old=KEY / scoped=THROW per skeptic O5), with the caveat's
   disposition stated in the test header.
2. A JSDoc note on `FRONTMATTER_RE` in `extensions/seats.ts` states the
   anchor's shape as a deliberate contract, names the pinning test, and
   records that a regex tweak changing which faces parse must update the pin
   deliberately. No executable line in `extensions/seats.ts` changes.
3. The existing FLLWUP-115 pins stay green untouched:
   `test/card-epic-key.test.ts`'s T1–T4 and `test/ev90-runner-input.test.ts`.
4. Gates, in order: `council/preflight.sh FLLWUP-118`; `bunx tsc --noEmit`
   clean; full `bun test` green.
