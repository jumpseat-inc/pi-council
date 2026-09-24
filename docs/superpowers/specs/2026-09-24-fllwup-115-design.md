# FLLWUP-115 — Frontmatter-scoped epic parse in `cardEpicKey` with a corpus-divergence pin

Card: `council/cards/FLLWUP-115.md` · Epic: EPIC-24 · Mode: Deliberate · 2026-09-24

## Problem

`cardEpicKey` (`extensions/seats.ts:598`) derives the epic key by matching
`/^epic:\s*(.*)$/m` against the **whole card-face file**. A card whose body
contains a line starting `epic:` (a quoted example, a record of a failed
derivation, a code block) is theoretically misparseable: a body occurrence
could win the derivation. Since EV-90's D1 ruling, `cardEpicKey` is
load-bearing — it feeds `composeRunnerInput`'s `features-deliver.md`
rendering — so a misparse would land false `$ARGUMENTS` substitutions in the
runner's operative context.

## Mechanism (AC1) — scope the match to the frontmatter block

Extract the packaged-procedure frontmatter regex
(`/^---\n[\s\S]*?\n---\n/`, currently inline at `readProcedureBody`,
`extensions/seats.ts:584`) into a shared module constant (e.g.
`FRONTMATTER_RE`). Split `cardEpicKey` into a pure core
`epicKeyFromFace(raw, cardId)` that matches `^epic:\s*(.*)$` **against the
frontmatter block only**; the file-read/not-found refusal stays in
`cardEpicKey`. Absent frontmatter block ⇒ absent epic ⇒ the D1 throw.

**Polarity — read this twice.** The card's AC1 first phrasing ("strips the
frontmatter before matching") is an inversion trap: taken literally it strips
the metadata and matches the **body** — the opposite of the fix, and the
exact misparse the card exists to prevent. Skeptic probe O4 proved the
inversion on a synthetic face (`epic: EPIC-A` frontmatter + body
`epic: EPIC-B`: whole-file → `EPIC-A`; strip-then-match → `EPIC-B`). Implement
the **second** form: scope the match to the frontmatter block. The pin T4
below doubles as the tripwire for this trap (probe O9: a strip-first-literal
implementation diverges from the old derivation on 172 corpus files, so T4
reds on it).

Blast radius (skeptic O8): `cardEpicKey` has exactly one call site —
`composeRunnerInput` (`seats.ts:631`), consumed in production only at
`hub-tools.ts:197`. No second epic derivation exists in production
(`gate-route.ts:60` `parseCardFile` and `followup-state.ts:210` never read
`epic:`).

## Refusals (AC2) — byte-for-byte unchanged

The three D1 refusals keep their exact messages (skeptic O7 captured all
three through the real code and matched them byte-for-byte; at the
delivered tree, the epic-field refusal's throw lives at
`extensions/seats.ts:617-619` and the nonexistent-face read refusal's at
`extensions/seats.ts:637-639`):

1. Nonexistent face →
   `` council-runner dispatch for card "<id>" refused: its card face council/cards/<id>.md does not exist ``
2. `epic: null` →
   `` council-runner dispatch for card "<id>" refused: the card face's epic: field is null or absent (EV-90 D1 ruling — a runner dispatched without its features-deliver scope is a degraded dispatch, not a fallback) ``
3. Absent epic (identical message to #2).

The refactor moves only the match scope — not the message bytes; `cardId`
remains in scope at both throw sites. As delivered (FLLWUP-117's
reconciliation — this section's original prose said the opposite), the
**epic-field refusal (`epic: null` or absent) throws inside
`epicKeyFromFace` itself** (`extensions/seats.ts:617-619`): the pure core
throws the named-card D1 refusal byte-for-byte. `cardEpicKey` retains only
the nonexistent-face read refusal (`extensions/seats.ts:637-639`) and
delegates the derivation (`extensions/seats.ts:641`). Observable behavior —
the three messages, byte-for-byte — is unchanged from the pre-refactor shape
(skeptic O2 verified base-vs-head).

## Corpus pin (AC3) — behavioral equivalence, not hygiene

Per the binding Phase-1 product-owner ruling (job-2) recorded on the card
face: five card files carry nine body lines beginning `epic:` (EPIC-8 ×1,
EV-35 ×1, FLLWUP-47 ×3, FLLWUP-49 ×2, FLLWUP-56 ×2 — skeptic O1 closed-red
the principal's 11-line enumeration; the true count is 9 in 5 files). Every
card face carries its frontmatter `epic:` line ahead of its body, so no body
occurrence ever won a derivation, and **no card face lacks a frontmatter
`epic:` line** — old and new derivations are identical on the entire corpus
(skeptic O2: 203 files incl. `_template.md`, zero divergence;
`_template.md` is `epic: null` → both sides throw).

The pin is an **equivalence sweep** over `council/cards/*.md` (via
`path.join(repoRoot, "council", "cards")` — the same path production reads,
never `PKG_ROOT`): for each card, the whole-file derivation
(`raw.match(/^epic:\s*(.*)$/m)` — the old derivation, kept inline in the test
forever as the oracle) and the frontmatter-scoped derivation (AC1's
mechanism, exercising **live production code** — export both `cardEpicKey`
and `epicKeyFromFace`; the `renderProcedure` re-export precedent, FLLWUP-107)
must produce the identical result — same key, or same throw. Green on the
current corpus; reds exactly when the scoping change (or any future edit)
would alter an existing derivation. The nine known body occurrences are
**dispositioned in the test header, not policed** — no set-equality or
corpus-hygiene assertion, only the equivalence property.

Documented caveat (skeptic O5): the shared `FRONTMATTER_RE` anchor is
byte-0-anchored, so a face with a leading blank line or a closing `---` at
EOF without a trailing newline would diverge old=KEY / scoped=THROW. Zero
such faces exist in the corpus, and any future one reds T4 immediately —
which is the goal's "cannot silently change" contract working as intended.

## Test set (new file `test/card-epic-key.test.ts`; `test/ev90-runner-input.test.ts` untouched per AC4)

- **T1 — compose-path red-at-base falsifier.** Through the **production
  path**: `composeRunnerInput(root, "X", "t")` on a face with no frontmatter
  `epic:` line but a body `epic: EPIC-9`. At base it composes a dispatch
  containing "delivering `EPIC-9`" (body prose leaking into operative
  context — the EV-90 hazard, demonstrated live by skeptic probe O6); at
  head it must throw naming the card. This is the mechanism's behavioral
  red-at-base record — the AC3 pin itself is an invariant guard, expected
  green at base, and owes no seven-field red-base record.
- **T2 — precedence pin.** Frontmatter `epic: EPIC-A` + conflicting body
  `epic: EPIC-B` → derives `EPIC-A` (green at base — first-match-wins —
  but pins that precedence is scoping, not accident).
- **T3 — byte-exact refusal pins.** Exact-string assertions for the three
  refusals (messages above), in the new pure test file, keeping
  `test/ev90-runner-input.test.ts` untouched per AC4.
- **T4 — the 203-card equivalence sweep** (shape as in AC3 above).

## Release convention

`package.json` version bump in the same PR (live engine behavior change).
Conventional Commit, e.g. `fix(seats): scope cardEpicKey's epic match to the frontmatter block (FLLWUP-115)`.

## Gates

`bunx tsc --noEmit`, then `bun test` (full suite ≈101s; integration/context7
probes stay opt-in and untouched). Owner gates are met in full regardless of
change size.

## What the deliberation settled

Owner (job-3.1) and principal (job-3.2) independently converged on this exact
mechanism, test set, and version-bump convention (round 2 not needed —
positions stabilized). The step-4 skeptic (job-4.1) closed eleven objections
O1–O11 on real runs: corpus facts, delta-class, one-call-site blast radius,
byte-identical messages, polarity inversion, red-at-base availability, pin
discrimination, AC4 floor, sufficiency. Step-5 consolidation: zero open
judgment, zero open objections. Step-6 routing: nothing to route; no ruling
seat dispatched.
