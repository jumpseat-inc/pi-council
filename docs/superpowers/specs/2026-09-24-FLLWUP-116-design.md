# FLLWUP-116 — Quote-agnostic file-content import pins across the suite (design)

Card: `council/cards/FLLWUP-116.md` · Epic: EPIC-24 · Deliberate path.
This spec writes up the design the Council settled in deliberation rounds 1–5
(owner, principal, skeptic, consolidator) plus the confirming product-owner
ruling (job-11). It does not derive or reopen anything; the deliberation
record on the card is authoritative for *why* each point below holds.

## Goal (as recorded, unchanged)

The suite's file-content import pins (tests that read packaged `.md`/`.ts`
sources and assert on their contents) match the pinned sentence regardless of
whether it is wrapped in double quotes or single quotes — a
convention-conforming requote of pinned source lines cannot red a pin.

**Scoped reading (product-owner ruling Q1, binding).** "Convention-conforming
requote" means a formatter-produced delimiter requote in packaged `.ts`
sources. The implementation record must state, as part of acceptance 1,
verbatim:

> "convention-conforming requote" means a formatter-produced delimiter requote in packaged `.ts` sources; Class-2 interior-content pins (ev77 `SOURCE_SEGMENTS`, `op:`/`status:` prose tokens, JSON-shape pins) and byte-identity pins are exact-by-design and intentionally red on content change.

## Arm choice

**Arm (a)** — quote-agnostic normalization in the pins. Arm (b) (pin the
double-quote convention and document a requote as an intended red) was
rejected by both generators: no formatter config exists in this repo to
enforce such a convention, and arm (b) leaves the negative canaries
false-green against a single-quoted requote (a requote *silently weakens*
them instead of loudly reding). Arm (a) applied to the scoped class makes
requote green on positive pins and makes the canaries strictly stronger.

## Architecture

One shared helper, `test/src-pin.ts` (new file, test-side only):

- `srcPin(text: string): string` — normalizes **both** haystack and needle:
  - whitespace collapse (`\s+` → `" "`, the suite's existing prose-pin
    convention), then
  - symmetric quote canonicalization: map both `"` and `'` to one canonical
    delimiter (backticks are markdown code markers, not string delimiters —
    they stay literal).
- Every converted pin site normalizes **once into a local**, then derives
  every assertion in the block from that local (needle and haystack both go
  through `srcPin`). This block-level discipline is required because several
  blocks use the same literal as both a `toContain` needle and an `indexOf`
  slice anchor (e.g. `test/council-models.test.ts:240-247`): normalizing only
  the assertion calls while the anchor stays raw would still red (or slice
  nothing) on a convention-conforming requote.
- The helper's doc comment states the contract where the pins live: what is
  covered, what is excluded and why, and the accepted canary tradeoff (see
  below).

## Covered class (Class-1: formatter-mutable delimiter pins)

The matched quote is JS/TS *syntax wrapping a literal* in a packaged source
file — exactly what a formatter's `singleQuote` setting rewrites:

1. **Import-specifier `.includes`/`toContain` pins** — e.g.
   `test/gate-tool.test.ts:420` (`from "./gate-tool.ts"`),
   `test/ev90-runner-input.test.ts:144-145` (negative, `from "./index.ts"`),
   `test/gate-spend-reconcile.test.ts:152` (negative, `from "./catalogue`),
   `test/faux-provider-shape.test.ts:281`, `test/rubric.test.ts:338`.
2. **`registerCommand` pins and their `indexOf` slice anchors** —
   `test/council-models.test.ts:240/246`, `test/ev74-council-gate-command.test.ts:386-388`,
   `test/eval-leaderboard.test.ts:226/229`, `test/eval-runner.test.ts:560`,
   `test/council-update.test.ts:500`.
3. **The negative canaries** — `test/ev80-followup-state.test.ts:266` and
   `test/gate-ledger.test.ts:224` (`not.toContain('".pi"')`), plus the
   `from "./index.ts"` negatives in (1). Under symmetric normalization these
   catch both quote styles. Accepted, documented tradeoff: near-miss bytes
   like `x".pi'y` normalize to a red — for a hardcoded-`.pi` fence that is
   the right error direction (false alarm beats missed detection); the doc
   comment states it so a future maintainer does not "fix" the false positive
   by reverting the normalization and silently reopening the hole. Skeptic
   O4 confirmed no current-tree regression (`followup-state.ts`/`gate-ledger.ts`
   contain no `.pi` variant today).
4. **The three regex pins, widened to `["']` — not normalized.** The
   normalize-both-sides helper cannot be applied to these: whitespace
   collapse destroys the raw `\n` the `(?:^|\n)` anchor needs (skeptic O2:
   normalized haystacks make `matchAll` return `[]` on the *current* tree).
   Leaving them raw reds on requote. The remediation is quote-class widening,
   the same mechanism the design already assigns to the mode-literal regex,
   backed by repo precedent (`test/rubric.test.ts:318-320`,
   `test/gate-route.test.ts:251`). These pins assert the import set / mode
   literals, not the quote style. Widening is a test-side change only:
   - `test/gate-ledger.test.ts:230` — `/(?:^|\n)import\s[^;]*from\s*"([^"]+)";/g`
     → `/(?:^|\n)import\s[^;]*from\s*["']([^"']+)["'];/g`
   - `test/cost-baseline.test.ts:163` — same shape, same widening
   - `test/gate-route.test.ts:398` — `/"(Deliberate|Verify|Direct)"/g`
     → `/["'](Deliberate|Verify|Direct)["']/g`

## Excluded classes (exact-by-design)

Their quotes are *content*, not delimiters; no formatter ever rewrites them,
so normalization buys nothing against the hazard and only widens the blind
spot — or, for ev77, silently disables a byte-verbatim guard:

- **ev77 `SOURCE_SEGMENTS` byte-verbatim pins and the EV75/EV76 byte-copy
  literals** (`test/ev77-gate-docs.test.ts`). The pinned `"` sits inside a
  template literal (`extensions/preflight.ts:29` — `` `(mode "${mode}")` ``)
  — formatter-immune interior. Skeptic O3's discriminator: the byte-verbatim
  check reds on a `(mode '` mutant while blanket normalization would pass
  it — excluding this class is what keeps the guard real.
- **`op:`/`status:` prose tokens** in packaged `.md` procedures and
  rendered-output pins (`test/gate-route.test.ts:545-573`,
  `test/ev83-runner-followup.test.ts:350`) — interior to markdown code spans;
  `.md` bytes are never formatter-requoted.
- **JSON-shape pins** (`test/council-config-writer.test.ts:188-189`) — the
  quotes are data of the JSON format.
- **Byte-identity pins** (sha256 pins, `toEqual` slices, digest pins) — a
  different machine shape, not `.includes` sentence pins.
- Dropped from earlier drafts as miscounted: `test/prose.test.ts:47` — the
  actual needle is `not.toContain("named agent")`; the quote appears only in
  the assertion *message*, so it is not quote-sensitive.

## Survey (acceptance 2)

The recorded survey of `test/*.ts` for packaged-source exact-sentence pins is
the Class-1 enumeration in this spec **plus** the excluded classes above,
each marked with its class. It must include both `matchAll` import-extraction
sites (`test/gate-ledger.test.ts:230`, `test/cost-baseline.test.ts:163`) and
`ev77` — the two survey amendments the skeptic (O1) and the ruling (Q2)
require before acceptance 2 can read as met. The survey is recorded in the
card's implementation record.

## Constraints

- **No packaged source file is edited** (acceptance 3). This is a test-side
  change only: the new helper, conversions at the Class-1 pin sites, and the
  three regex widenings — all under `test/`.
- `bun test` and `bunx tsc --noEmit` pass with no threshold lowered and no
  finding suppressed. Baseline (skeptic, step 4): 1530 pass / 6 skip / 0
  fail; tsc clean.
- The owner works in an isolated git worktree, pushes a branch, opens a PR;
  the main checkout's branch state is never touched.

## Verification hooks (for the Skeptic, step 9)

1. **Requote survival:** in a temp copy of a packaged source, requote a
   pinned line (`from "./gate-tool.ts"` → `from './gate-tool.ts'`,
   `pi.registerCommand("council-models"` → `pi.registerCommand('council-models'`);
   the corresponding pins must stay green — including `indexOf`-anchored
   ordering assertions at block sites.
2. **Canary strengthening:** a source containing `'.pi'` must red the
   `not.toContain` canary after the change (it false-greens today).
3. **Class-2 exclusion intact:** a `(mode "` → `(mode '` content change in a
   copy of `extensions/preflight.ts` must still red ev77's byte-verbatim
   check.
4. **Regex pins:** the widened regexes still extract the full import set /
   mode literals on the current tree, and still do so on a requoted copy.
5. **Content change still reds:** `op: "route"` → `op: "recheck"` in a copy
   must still fail the normalized pin (normalization blurs wrap style, never
   content).

## Implementation record obligation

The card's implementation record states (a) the scoped-reading sentence
verbatim (above), (b) the survey with both `matchAll` sites and ev77 present,
and (c) that arm (a) was implemented over the scoped Class-1 population with
the excluded classes exact-by-design.
