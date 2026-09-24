---
id: FLLWUP-115
title: Frontmatter-scoped epic parse in cardEpicKey with a corpus-divergence pin
state: Ready
owner: null
epic: EPIC-24
goal: cardEpicKey in extensions/seats.ts derives the epic key from the card face's frontmatter epic: field only — not from a whole-file regex that could match an epic: line in a card's body — and a corpus-wide pin asserts, per card, that the whole-file derivation and the frontmatter-scoped derivation produce the identical result (same key or same throw), so hardening the seam cannot silently change any existing derivation.
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
3. A corpus-wide test iterates every `council/cards/*.md` and asserts, per
   card, that the current whole-file derivation (`raw.match(/^epic:\s*(.*)$/m)`)
   and the frontmatter-scoped derivation (criterion 1's mechanism) produce the
   identical result — same key, or same throw. It is green on the current
   corpus and reds exactly when the scoping change would alter any existing
   derivation. The card's record additionally dispositions the known body
   occurrences of a line beginning `epic:` (a pin asserts the property, not
   corpus hygiene).
4. The existing `test/ev90-runner-input.test.ts` epic-derivation claims
   (missing face → throw; `epic: null` → throw; `epic: EPIC-9` → `EPIC-9`)
   stay green untouched.

## Phase 1 ruling (product-owner, job-2)

Acceptance criterion 3's literal text ("no card body contains a line matching
`^epic:`") is empirically false on the packaged corpus: five card files carry
nine body lines beginning with that label (EPIC-8 prose; fenced example
blocks in EV-35, FLLWUP-47, FLLWUP-49, FLLWUP-56). `cardEpicKey`'s whole-file
`match` returns the first occurrence, and every card face carries its
frontmatter key line ahead of the body, so no body occurrence ever won a
derivation. The product-owner amended the goal's pin clause and criterion 3
to the behavioral-equivalence pin above — green on the current corpus, red
exactly when the scoping change alters an existing derivation — and ratified
this card `Backlog → Ready` for the run.
