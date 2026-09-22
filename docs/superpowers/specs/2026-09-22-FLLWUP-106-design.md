# FLLWUP-106 — The usages procedure forbids inventing framing around the tool's stderr

**Status:** design settled (deliberation steps 2–6 complete; product-owner
ruling on the step-6 escalation binding). This spec writes up the settled
design; it derives nothing.

**Epic:** EPIC-15 (serial: BUG-2 `59fad63` → FLLWUP-105 `a0b27ca` → this
card). **Execution mode:** Deliberate. **Surface-touching:** yes (user-facing
copy on the `/usages` person surface).

## Goal

`council/procedures/usages.md` instructs the agent to surface every non-empty
stderr line from usages.py verbatim, with no added prefix such as a warning
glyph and no invented cause, and to state only what the line itself reports.

## The change (one paragraph, additive)

Append **end-of-file**, after the FLLWUP-105 remediation paragraph (the
`**Report.**` stage; placement settled at deliberation step 3), exactly one
paragraph. The existing `!`-limitation sentence and the
`OPENROUTER_MANAGEMENT_KEY` hard-gate paragraph are untouched; the edit is
additive only. The paragraph text is fixed byte-exact by the product-owner
ruling (Q2), lead `**Stderr discipline.**` (Q1), final sentence
`(The remediation route for that specific line, above, is unchanged.)` (Q3),
likelihood class wording `an invented likelihood` (Q4). The glyph is the
U+26A0 U+FE0F sequence — copied from this card/record, never retyped to bare
U+26A0 (skeptic OBJ-8).

> **Stderr discipline.** Every non-empty stderr line the tool prints is
> quoted verbatim, exactly as printed: no added prefix of any kind — do not
> add a ⚠️ or ! to a line that does not itself carry one — and no invented
> cause, consequence, or non-fatal-issue count beyond what the line itself
> reports. System-status lines are uninterpreted tool output: surface them
> as printed, without explanation. Worked example from this procedure's own
> intake: a seat wrapped `usages: could not write cache:` in `⚠️ One
> non-fatal issue:` and appended an invented likelihood — that framing is
> exactly what this rule forbids. (The remediation route for that specific
> line, above, is unchanged.)

The scope carve-out preserving FLLWUP-105's authorized remediation for the
one named literal is the parenthetical final sentence — no other cause is
authorized for any other stderr line.

## The mechanical pin (acceptance bullet 3, O-conformant per ruling Q5)

A new `test()` in `test/usages-procedure.test.ts` carrying exactly three
predicates (scaffolding latitude is the owner's; the predicates and their
byte-exact literals are fixed; paragraph+pin ship as one self-consistent
pair):

```ts
const procedure = readProcedure("usages.md");
// O1 — glyph in a prohibition context (byte-exact; U+26A0 U+FE0F, copied
// from the card)
expect(procedure).toContain("do not add a ⚠️");
// O2 — worked-example literal
expect(procedure).toContain("One non-fatal issue");
// O3 — proximity anchored on the base-absent token (red at base by
// anchor-absence, not gap luck; base occurrences of "non-empty stderr" = 0)
expect(procedure.replace(/\s+/g, " ")).toMatch(/non-empty stderr[\s\S]{0,120}verbatim/i);
```

Ruling Q5 confirms acceptance bullet 3 means this O-conformant pin; no
acceptance deviation exists. The principal/designer pin designs were refuted
on the real file by the step-4 battery (OBJ-2: fully green on the gutted
mutation) — the merged PR carries the owner pin.

## Acceptance gates (real gates; card-text correction recorded, OBJ-6)

- The acceptance's `bun test test/procedures.test.ts` reference is a phantom
  — the file does not exist. The real gates:
  `test/usages-procedure.test.ts` (content, both existing and new pins),
  `test/env-split-contract.test.ts` M1 pole A (procedure registration,
  17 commands), the full `bun test`, and `bunx tsc --noEmit`; CI runs these
  via the `gates` workflow on the PR head SHA.
- Record correction adopted (skeptic OBJ-1): the round-3 gap arithmetic line
  reads **gap = 86, `{0,86}` first true** — not 92/`{0,91}`. Pin O3's
  base-redness comes from anchor absence (`non-empty stderr` occurrences at
  base = 0), not gap luck.

## Non-goals / explicitly out of scope

- **No `package.json` version bump in this PR.** FLLWUP-105 (`a0b27ca`, same
  payload class) shipped without one; staged-epic bump is the chain
  convention (skeptic OBJ-7 grounded: release commits are separate
  `chore(release)` commits; EPIC-14 ruled the bump not a closure condition,
  wiki `[[steward]]`).
- No remediation instruction for consumers: procedures resolve from
  `PKG_ROOT`, so this fix reaches consumers on package update (owner C5,
  principal-verified).
- No `$…`/`@…` tokens in the new prose (FLLWUP-107's renderer invariants
  unaffected — OBJ-5).
- Polarity-inversion (hostile-endorsement) detection is FLLWUP-108
  territory, not this pin's job (consolidator S5).

## Implementation notes for the owner

- Branch from latest `main` (rebased past FLLWUP-105 `a0b27ca`), work in an
  isolated git worktree, never on `main`; the main repository path's branch
  state is immutable to seats. Push a feature branch, open a PR.
- Two files change: `council/procedures/usages.md` (append the paragraph)
  and `test/usages-procedure.test.ts` (add the pin test). Nothing else.
- Verify the glyph bytes after editing: the paragraph's `⚠️` and the pin
  literal's `⚠️` must both be U+26A0 U+FE0F and the pin must match the
  paragraph's rendered line byte-exact (`do not add a ⚠️`).
- Red-at-base check: the three new predicates are all red before the
  paragraph is appended (O1/O2/O3 literals absent at base) and green after.
