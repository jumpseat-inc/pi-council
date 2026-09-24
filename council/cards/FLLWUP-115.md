---
id: FLLWUP-115
title: Frontmatter-scoped epic parse in cardEpicKey with a corpus-divergence pin
state: Backlog
owner: null
epic: EPIC-23
goal: cardEpicKey in extensions/seats.ts derives the epic key from the card face's frontmatter epic: field only — not from a whole-file regex that could match an epic: line in a card's body — and a corpus-wide pin asserts no current card body carries such a line, so hardening the seam cannot silently change any existing derivation.
---

## Intent

EV-90's step-9 skeptic record (job-11.2) filed a non-blocking observation: the
epic derivation at `extensions/seats.ts:598` reads
`raw.match(/^epic:\s*(.*)$/m)` against the **whole card-face file**, so a card
whose body contains a line starting `epic:` (a quoted example, a record of a
failed derivation, a code block) is theoretically misparseable. The skeptic
scanned the packaged corpus and found no current divergence — but since this
card's D1 ruling, `cardEpicKey` is load-bearing: it feeds
`composeRunnerInput`'s `features-deliver.md` rendering, so a misparse would
land false `$ARGUMENTS` substitutions in the runner's operative context.
Hardening a now-live seam plus a corpus pin is legitimate follow-up work, not
a prose finding. EV-90 is `Done`; its goal (dispatch composition) does not
subsume this, so it is not a fold-in under [[engineering-board]]'s test.

Filed from EV-90's step-13 candidate (draft title "Frontmatter-scoped epic
parse in cardEpicKey with a corpus-divergence pin"),
product-owner-ratified `File` 2026-09-24 (confirmation-authority; recorded
gate basis: composite 0.35 < merge threshold 1.00).

## Acceptance

1. `cardEpicKey` strips the card face's frontmatter (the same
   `^---\n[\s\S]*?\n---\n` strip the packaged-procedure scan uses) before
   matching `^epic:\s*(.*)$`, or equivalently scopes the match to the
   frontmatter block, so body occurrences of `epic:` cannot win.
2. The fail-loud refusals EV-90's D1 ruling requires are preserved byte-for-byte
   in behavior: nonexistent face, null epic, and absent epic each throw
   naming the card, with unchanged messages (or a test pins the new shape).
3. A corpus-wide test iterates every `council/cards/*.md` and asserts no card
   body (frontmatter stripped) contains a line matching `^epic:` — pinning
   that the hardening changes no existing derivation; the test reds before
   the scoping change if any card body would previously have been misparsed.
4. The existing `test/ev90-runner-input.test.ts` epic-derivation claims
   (missing face → throw; `epic: null` → throw; `epic: EPIC-9` → `EPIC-9`)
   stay green untouched.
