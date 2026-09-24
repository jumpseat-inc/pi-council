---
id: FLLWUP-115
title: Frontmatter-scoped epic parse in cardEpicKey with a corpus-divergence pin
state: Deliberating
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

## Deliberation record

### Routing

- Execution mode: **Deliberate** (ROOT recorded; decisions gate `active` resolves fallback, so no re-route applies).
- Surface-touching: **no** — `cardEpicKey` is an internal derivation; no visible surface or user-visible copy changes. `designer` not seated.
- Phase 1 class rulings: all five named classes recorded `n/a:` in `council/phase1-rulings.json` — none applies to this card.

### Round 1 — independent first pass

**owner (job-3.1):**

Mechanism (AC1): extract the packaged-procedure frontmatter regex at `readProcedureBody` (`extensions/seats.ts:584`, `/^---\n[\s\S]*?\n---\n/`) into a shared module constant, split `cardEpicKey` (`seats.ts:598`) into a pure core `epicKeyFromFace(raw, cardId)` that matches `^epic:\s*(.*)$` **against the frontmatter block only** (absent block ⇒ absent epic ⇒ D1 throw), with the file-read/not-found refusal left in `cardEpicKey`. One call site exists (`composeRunnerInput:631`, consumed at `hub-tools.ts:197`), so blast radius is exactly the runner dispatch. The acceptance text's first phrasing is a trap: "strips the frontmatter before matching" taken literally *strips the metadata and matches the body* — the opposite of the fix. Implement the second, correct form ("scopes the match to the frontmatter block"); flag this in the card record so the implementer doesn't invert it.

Corpus (AC3): reproduced the Phase-1 ruling empirically — 203 card files, exactly 5 files carrying 9 body lines starting `epic:` (EPIC-8 ×1, EV-35 ×1, FLLWUP-47 ×3, FLLWUP-49 ×2, FLLWUP-56 ×2) — and ran a whole-file-vs-frontmatter-scoped equivalence simulation over all 203: **zero divergence**. Because JS `match` returns the *first* occurrence and every card's frontmatter precedes its body, no body occurrence can win today; the only reachable behavioral delta is a card with **no frontmatter epic line but a body `epic:` line** (currently derives the body's key — precisely the misparse). The pin should be an equivalence sweep over `council/cards/*.md` comparing an inline whole-file regex (the old derivation, kept forever as the oracle) against the real scoped derivation — same key or same throw, `_template.md` included (both sides throw). Per the binding Phase-1 amendment, the 9 known body occurrences are dispositioned in the test header, not policed: no set-equality or corpus-hygiene assertion, only the equivalence property.

Red-base record: AC3's pin must land *green* on the current corpus, so it is an invariant guard, not a red-at-base falsifier and owes no seven-field record. But the mechanism itself needs one: write the synthetic-face test through the **production path** — `composeRunnerInput(root, "X", "t")` on a face with no frontmatter epic + body `epic: EPIC-9`. At base it composes a dispatch containing "delivering `EPIC-9`" (body prose leaking into operative context — the exact EV-90 hazard); at head it throws naming the card. That red is behavioral, not scaffolding-induced. Also export `cardEpicKey`/`epicKeyFromFace` for the corpus pin — the `renderProcedure` re-export precedent (FLLWUP-107) already establishes exporting a seam for pinning.

Pins: (T1) the compose-path red-at-base falsifier; (T2) frontmatter-epic + conflicting body line → derives the frontmatter key (green at base — first-match-wins — but pins that precedence is scoping, not accident); (T3) byte-exact message pins for the three refusals — nonexistent face, `epic: null`, absent epic — in a new pure `test/card-epic-key.test.ts` (keeps `test/ev90-runner-input.test.ts` untouched per AC4); (T4) the 203-card equivalence sweep. Since this changes live engine behavior, `package.json` version bumps in the same PR per the repo's release convention. Gates: `bunx tsc --noEmit`, then `bun test`.

Tradeoffs accepted: exporting `cardEpicKey` widens the module surface for one test consumer (worth it — the alternative recomputes the regex tautologically); the corpus pin is vacuous-ish today (exactly what the ratified amendment asks — it reds the day a future corpus edit would silently change a live dispatch's epic binding); the D1 posture tightens on a hypothetical class (future card with absent frontmatter epic + body line will now refuse loudly — aligned with the D1 posture, the point of the card, and the reason for the version bump).

Testable claims: (1) zero divergence on the current corpus — ran it, identical outcomes; a red means the scoping was mis-derived, not that the corpus is dirty; (2) the synthetic precedence face is the only behavior delta — currently yields `EPIC-9` from `composeRunnerInput` and must throw at head; (3) refusal messages can stay byte-identical — the refactor moves only the match, not the throw sites; T3's exact-string pins make "unchanged messages" a checked claim; (4) strip drift is a real risk testable by inspection — both sites share one `FRONTMATTER_RE` constant; a source pin can assert both reference it; ranked optional.

**principal (job-3.2):**

Two regexes on opposite sides of the same file shape, with **opposite polarity**: `readProcedureBody` (`seats.ts:582`) strips frontmatter to yield the **body** (procedure path, body is payload); `cardEpicKey` (`seats.ts:598-620`) matches over the **whole face** (card path, **frontmatter** is payload). The card's phrase "the same `^---…\n---\n` strip the packaged-procedure scan uses" is a **category error**: that strip *returns the complement of what the card parser needs*. "Strip frontmatter, then match `^epic:`" yields the *first body* occurrence — the exact misparse the card exists to prevent. Only the trailing "or equivalently scopes the match to the frontmatter block" clause states the correct mechanism.

Corpus facts, verified: every card face carries its `epic:` line at line 6 (frontmatter). Body `^epic:` occurrences exist — `EPIC-8.md:103`, `EV-35.md:1116`, `FLLWUP-47.md:1278/1967/1998/2027/2035`, `FLLWUP-49.md:1830/1850`, `FLLWUP-56.md:977/995`. Because frontmatter always precedes the body, the whole-file first-match never loses today. **No card face lacks a frontmatter `epic:` line**, so old and correct-new derivation are identical on the entire corpus.

Blind spots named: "reuse the strip that already exists" reads as the low-risk move but inverts the parse; `test/ev90-runner-input.test.ts` §6.4's fixtures (`writeCardFace`) never place an `epic:` line in the body — "§6.4 stays green" is zero evidence that body occurrences cannot win.

Reframe — bounded, not a redesign: the core design is right (scope the match to the frontmatter block; keep the throws; pin corpus equivalence). The framing error is treating criterion 3's corpus pin as the proof — it is a *do-not-perturb-existing-derivations* guard, not a fix-verifier: on this corpus it is trivially green for both the fix and the status quo; it reds only on *over*-correction. Two obligations: (1) criterion 3 kept as the regression guard with its true claim stated (reds only on over-correction, expected-green at base); (2) add the discriminating synthetic falsifier — a face whose frontmatter has **no `epic:` line** but whose body contains `epic: EPIC-B`: at base `composeRunnerInput` returns `EPIC-B` (the bug), after the fix it must throw naming the card. Also make the pin's new side exercise **live production code** (export `cardEpicKey` or drive through `composeRunnerInput` over a temp repo — an inline copy of the regex never reds on future drift), and iterate the same path production reads (`path.join(repoRoot, "council", "cards")`), not `PKG_ROOT`.

Testable claims: (1) discriminating falsifier — red at base, green after; the only old-vs-new delta in existence; (2) pin-is-tautological-on-this-corpus witness — criterion-3 comparison green at base, evidence criterion 3 alone cannot stand as the fix's falsifier; (3) polarity trap witness — the literal strip-then-match reading returns the body key, not `null`; (4) §6.4 coverage gap — no `writeCardFace` fixture contains a body line matching `^epic:`.

Objections: the corpus pin is coupled to mutable board data (a future irregular card could red the suite with no code change — acceptable because the card scopes it to the equivalence property, but name it a property guard, not a hygiene guard); a shared frontmatter helper must expose *both* directions (frontmatter block for the card; body for the procedure) so polarity is explicit at the call site.

No reframe of the card's goal or the D1 posture; they stand.

### Round 2

Not run — positions stabilised after round 1: both generators independently propose the same mechanism (scope the match to the frontmatter block, preserve the D1 throws, export the seam so the pin exercises live code), both independently flag criterion 1's strip-first phrasing as an inversion trap, both demand the same discriminating red-at-base falsifier through `composeRunnerInput`, and neither contradicts the other on any point. No dispute exists for an exchange round to settle.

### Step 4 — skeptic attack (job-4.1)

The Skeptic ran its own probes against the real corpus and real code (all read-only; branch state untouched). Results, per objection:

- **O1 — closed-red on the principal's corpus enumeration.** FLLWUP-47.md:2027/2035 are mid-line `epic:` prose, not `^epic:` lines; the true body-occurrence count is **9 lines in 5 files** (EPIC-8×1, EV-35×1, FLLWUP-47×3, FLLWUP-49×2, FLLWUP-56×2) — matching the Phase-1 ruling's and the owner's count. The dispute is settled by the test: the principal's "verified" enumeration was wrong; the design is unaffected (those two lines never match `^epic:\s*`).
- **O2 — closed-green:** 203 card files (incl. `_template.md`); 9 body lines in 5 files; no face lacks a frontmatter `epic:` line; whole-file vs frontmatter-scoped divergence on the corpus: zero. `_template.md` is `epic: null` → both sides throw, as the owner claimed.
- **O3 — closed-green:** every card face carries its `epic:` line at line 6 (212 total `^epic:` matches = 203 frontmatter + 9 body).
- **O4 — closed-green (polarity trap proven):** synthetic face A (`epic: EPIC-A` frontmatter + body `epic: EPIC-B`): whole-file → `EPIC-A`; strip-then-match → `EPIC-B`. The AC1 literal "strip before matching" phrasing is the inversion trap both seats flagged.
- **O5 — closed-green (delta-class holds, byte-0 edge documented):** face B (`epic:`-less frontmatter + body `epic: EPIC-C`): whole-file → `EPIC-C`; frontmatter-scoped → THROW. Byte-0 anomalies (leading blank line; closing `---` at EOF without `\n`) also diverge old=KEY/scoped=THROW — 0 such faces in the corpus, and any future one reds T4 immediately, which is the goal's contract.
- **O6 — closed-green (red-at-base falsifier is real):** probe against the real exported `composeRunnerInput` on the falsifier face → no throw; composed dispatch contains "delivering `EPIC-9`". The head half expects the D1 throw naming the card; the throw site already names `${cardId}`.
- **O7 — closed-green (byte-identical refusals):** all three messages captured through real code and matched byte-for-byte against `seats.ts:605` and `:610-611`: nonexistent face → `council-runner dispatch for card "NOFACE" refused: its card face council/cards/NOFACE.md does not exist`; `epic: null` and absent epic (identical) → `…refused: the card face's epic: field is null or absent (EV-90 D1 ruling — a runner dispatched without its features-deliver scope is a degraded dispatch, not a fallback)`.
- **O8 — closed-green (blast radius):** `cardEpicKey` at `seats.ts:598` (def) + `:631` (the one call, in `composeRunnerInput`); production consumer only `hub-tools.ts:197`. No second epic derivation exists in production (`gate-route.ts:60` `parseCardFile` and `followup-state.ts:210` never read `epic:`).
- **O9 — closed-green (pin is discriminating, not vacuous):** strip-first-literal implementation vs old derivation diverges on **172** corpus files (incl. EPIC-8), so T4 doubles as the tripwire for AC1's trap phrasing. Scoped-vs-old divergence: 0.
- **O10 — closed-green (AC4 floor):** `bun test test/ev90-runner-input.test.ts` → 9 pass, 0 fail.
- **O11 — sufficiency:** mechanism + T1–T4 close all four ACs; no falsifiable gap remains. The shared `FRONTMATTER_RE` byte-0-anchor edge (O5) is the only documented caveat and sits inside the pin's throw-same contract.

What ran: corpus sweep (`/tmp/corpus-check.ts`, 203 files), `grep -n '^epic:'` across `council/cards/*.md` (212 matches), targeted `sed` probes on FLLWUP-47, call-site greps, synthetic polarity/edge/compose probes through the real `composeRunnerInput`, pin-discrimination probe, and `bun test test/ev90-runner-input.test.ts` (9 pass). Full command list and outputs in the skeptic transcript (job-4.1).

**Skeptic verdict: no open objections.** One recorded position corrected (principal's enumeration — see O1); every design claim closed-green on real runs. The mechanism + T1–T4 set is sufficient to close the card's goal.

### Step 5 — synthesis (job-4.2)

**Agreed design** (both seats converged, no dispute): (1) scope the `^epic:\s*(.*)$` match to the frontmatter block only — not strip-then-match, which inverts the parse — sharing a `FRONTMATTER_RE` constant with `readProcedureBody`; keep the three D1 throw sites byte-for-byte unchanged; export `cardEpicKey`/`epicKeyFromFace` so the pin exercises live code. (2) The discriminating falsifier: a synthetic face with no frontmatter `epic:` line but a body `epic: EPIC-B` — red at base, green after (throws naming the card), driven through `composeRunnerInput` on a temp repo. (3) Test set T1–T4 in a new `test/card-epic-key.test.ts` (compose-path red-at-base falsifier; frontmatter-vs-conflicting-body precedence pin; byte-exact refusal pins for the three refusals; the 203-card equivalence sweep, same key or same throw per card); `test/ev90-runner-input.test.ts` stays untouched. (4) Version bump in `package.json` in the same PR. (5) Gates: `bunx tsc --noEmit`, then `bun test`.

**Settled:** corpus enumeration (O1 — principal's enumeration corrected; 9 lines in 5 files stands, matching the Phase-1 ruling and the owner), polarity trap (O4), delta-class existence (O5), red-at-base falsifier reality (O6), byte-identical refusals (O7), one-call-site blast radius (O8), pin discrimination (O9 — strip-first-literal diverges on 172 files, so T4 doubles as the trap's tripwire), AC4 floor (O10), sufficiency (O11). All settled by skeptic tests that ran against the real corpus and real code.

**Open judgment — for `product-owner`, escalating to `steward`:** none.

**Open objections:** none.

### Step 6 — routing

The consolidator sorted zero items into open judgment and zero into open objections; nothing routes to a ruling seat and the card does not reach `Needs Human`. The deliberation is fully closed. (Facilitator note: the consolidator's closing line names "product-owner for implementation" — under council.md step 7 the implementer is the single `owner` seat; product-owner is a ruling seat and takes no part in implementation. Recorded here so the spec handoff follows the procedure, not the consolidator's phrasing.)
