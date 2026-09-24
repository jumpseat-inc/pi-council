---
id: FLLWUP-116
title: Quote-agnostic file-content import pins across the suite
state: Backlog
owner: null
epic: EPIC-24
goal: The suite's file-content import pins (tests that read packaged .md/.ts sources and assert on their contents) match the pinned sentence regardless of whether it is wrapped in double quotes or single quotes, or one pin arm documents the double-quote convention as the contract — whichever arm the implementation takes, a convention-conforming requote of pinned source lines cannot red a pin.
---

## Intent

Several suite tests pin packaged source content by reading the file and
asserting a `.includes(...)` on an exact sentence (e.g. `test/prose.test.ts`
pins seat-block and procedure sentences this way). Those pins break if the
pinned source line's quotation style changes — a double-quoted string
requoted as single quotes (or vice versa) shifts the bytes the pin matches,
even though every gate stays green and no behavior changed. Small test-hygiene
work with a binary outcome: either widen the pins to be quote-agnostic
(normalize both the file text and the expected sentence before matching), or
pin the double-quote convention as the contract and document that a requote is
a pin-breaking change by design. Either arm closes it cheaply.

Filed from EV-90's step-13 candidate (draft title "Quote-agnostic file-content
import pins across the suite"), product-owner-ratified `File` 2026-09-24
(confirmation-authority; recorded gate basis: composite 0.45 < merge threshold
1.00).

## Acceptance

1. One arm is implemented and stated in the card's record: either (a) the
   file-content pins normalize quote style on both sides before asserting, so
   a convention-conforming requote stays green, or (b) a test pins the
   double-quote convention for the pinned surfaces and the convention is
   documented where the pins live, making a requote a loud, intended red.
2. Every file-content pin that reads a packaged source file and asserts an
   exact sentence is covered by the chosen arm — a survey of `test/*.ts` for
   `readFileSync` + `.includes(` pins is recorded in the card.
3. `bun test` and `bunx tsc --noEmit` pass; no packaged source file is edited
   (the card touches tests and, under arm (b), docs only).
