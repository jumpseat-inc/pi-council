# Product-owner ruling — EV-37 merge-gate defect (literal-branch is dead)

Run: `/features-deliver` merge-gate pause for EV-37 (EPIC-9), PR #51 head
SHA `17b5a7fa491e3e509090bc5a8b78e44b83fa1578`. The orchestrator found a
defect outside the five mechanical criteria and asked the product-owner to
rule on its locus before a human-watched autonomous merge.

This is the **card-level** ruling (the merge-gate defect), not the
**epic-level** ruling (the EPIC-9 wave-3 decomposition, which lives at
`vault/raw/2026-09-16-po-epic9-retry-ruling.md`). The two share the same
literal byte sequence; the epic ruling named it with the colon (its body is
plain markdown and is not subject to the colon-space bar); the card goal
cannot.

## Defect, in one paragraph

The card goal cannot spell the byte string `Provider finish_reason: error`
(with colon-space) because the goal field is parsed as plain `key: value`
frontmatter and `council/validate.py:50-52` rejects any goal containing
`: `. The goal, the R1 Phase-1 ruling, and the shipped code constant all
spell it as `Provider finish_reason error` (no colon). Pi's installed bundle
emits `Provider finish_reason: ${reason}` as the default template in
`openai-completions-EKZT2IH2.js:7`, so for `finish_reason === "error"` the
real emitted message is `Provider finish_reason: error` (with colon). The
shipped `extensions/retry.ts` tests
`message === "Provider finish_reason error"` (no colon), which never
matches pi's real output. The literal-branch is therefore dead — the
predicate whose entire reason for existing is to catch this provider error
catches none.

## Intent binding vs. goal spelling

EV-37's Intent section is unambiguous about what the literal refers to:

> "The intake's error class is non-retryable under pi's shipped pattern
> list, so this predicate is the one place where council must deliberately
> widen the definition rather than inherit it."

The Intake screenshot (referenced in the epic ruling at
`vault/raw/2026-09-16-po-epic9-retry-ruling.md`) is the parent's own
provider call dead-ending with the bare string `Provider finish_reason:
error`. The Intake's class is precisely the colon-form message. The Intent
binds "the literal" to pi's real emitted message — the goal's colon-free
spelling is the structural artifact, not the substance.

R1 (Phase 1, included in the card) states its purpose: "Council's classifier
is a superset of pi's, so it never retries less than pi already would."
That purpose is served only if the literal matches pi's emitted message.
R1's spelled literal is a transcription of the goal's structural
misspelling; the markdown body of R1 is not subject to the colon-space bar
and could have carried the colon form. The orchestrator transcribed rather
than bound.

## Why this is not a goal-defect / steward escalation

`vault/wiki/product-owner.md`'s EV-29 precedent applies when "a goal must be
reinterpreted against its own words to be satisfiable." EV-29's goal named
a provider data granularity (per-component cost figures) that the provider
does not expose at all. There was no Intent or R1 binding the meaning to
something that exists; the goal's reference could not be resolved.

EV-37 is different. The Intent (part of the same card) binds the literal
unambiguously to the intake's error class — the very class the epic ruling
and the screenshot identify as pi's real `Provider finish_reason: error`.
The goal + Intent together are satisfiable; the goal's shorthand simply
cannot carry the byte string the Intent binds. Reading the card as a whole
(goal + Intent + R1), the reference is unambiguous.

By the wiki's EV-29 framing, EV-37 is not the goal-defect situation: the
goal does not need to be reinterpreted against its own words; it needs to
be read alongside the Intent that ships with it. The Intent is the load-
bearing surface.

Furthermore, `vault/wiki/engineering-board.md` is categorical: "Card
**goal text is immutable** once a card is `In Progress`." EV-37 is past
`In Progress` (it is `In Review`). Even if the goal were the defect,
amending it would no longer be a legal operation for the steward —
escalation would force card retirement, which is the wrong move when the
Intent already binds what the goal cannot spell.

## What must change (fold-in)

This is owner-routable. The code is wrong; the test gap allowed the bug
through. Three artifacts change:

1. **`extensions/retry.ts`** — change `PROVIDER_FINISH_REASON_ERROR` from
   `"Provider finish_reason error"` to `"Provider finish_reason: error"`
   (with colon). This is the byte string pi emits when
   `finish_reason === "error"`.
2. **`test/retry.test.ts`** — add a regression test that reads pi's
   installed bundle's `Provider finish_reason: ${reason}` template (the
   bundle file containing the template is the one the orchestrator
   identified) and asserts the constant byte-for-byte matches the template
   evaluated with `reason === "error"`. This is the test that should have
   existed; its absence is how the colon drop went unchallenged through
   owner, Skeptic, and judge.
3. **`docs/superpowers/plans/2026-09-16-EV-37-retry-classification.md`** —
   update the plan to record the corrected literal as pi's emitted message,
   citing the Intent's binding as the load-bearing source.

After the three changes, re-run the gates at the new head
(`bunx tsc --noEmit`, `bun test test/retry.test.ts`, full `bun test`,
`python3 council/validate.py`), re-trigger `gates` CI, and the orchestrator
may proceed with `gh pr merge 51 --match-head-commit <new SHA>` per the
wiki's SHA-pinning discipline.

## PR at `17b5a7f` may NOT merge in current state

The five deterministic-merge-check criteria nominally pass:

1. Owner gates green at head (re-run by Skeptic).
2. `gates` SUCCESS on head SHA `17b5a7f` (`gh pr checks 51`).
3. Skeptic `does-not-block`.
4. Judge PASS.
5. No `Needs Human` / outstanding ruling.

But criterion 5 is satisfied only because the orchestrator's question is
the first time the literal-vs-bundle gap has been raised. Once this ruling
is recorded as an outstanding ruling on the card, criterion 5 holds only
when the ruling is closed by the fold-in fix landing and gates passing at
the new head. The five criteria are a mechanical check; they do not
substitute for the user-value test this defect fails.

## User-value test

The card exists to widen council's retry to include provider errors pi's
own pattern misses. The widened literal-branch — the entire reason this
card ships — is dead in the current implementation: it tests for a byte
string pi never emits. A person whose `/features-new` session hits
`Provider finish_reason: error` (the Intake) would not be retried by
council's predicate, defeating the user value the Intake identifies.
Mechanism (goal-as-spelled matches code-as-spelled) is satisfied; user
value (catch pi's emitted provider error) is not. Per the role's
"mechanism × user value" framing, a ruling that satisfies the mechanism
but not the value has still failed.

## Reversibility

Code-level fix is one line in `extensions/retry.ts` plus a regression test
that asserts the constant byte-for-byte against pi's bundle. Reversible in a
single follow-up commit. Cheapest-to-reverse option of all available paths
(fold-in vs. card retirement + new card + new PR + new gate cycle).

## Grounding

- `node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/openai-completions-EKZT2IH2.js:7`
  — `grep 'Provider finish_reason:'` matches; the surrounding slice shows
  the template `Provider finish_reason: ${reason}` in the default branch.
  `grep 'Provider finish_reason error'` (no colon) returns no bundle hit,
  confirming pi never emits the colon-free form.
- `node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-JVUZSMYM.js:475`
  — `buildProviderErrorPattern` over the 41-token list; none of the tokens
  is `Provider finish_reason`, confirming the Intent's claim that the
  intake's error class is non-retryable under pi's shipped pattern.
- `council/validate.py:50-52` — "the goal may never contain a colon-space
  sequence." Structural constraint that forces the goal's colon-free
  spelling.
- `council/cards/EV-37.md` Intent section — binds the literal to the
  intake's error class (pi's emitted `Provider finish_reason: error`).
- `council/cards/EV-37.md` R1 ruling — "superset of pi's, never retries
  less than pi already would" is the purpose; the spelled literal is a
  transcription of the goal's structural misspelling.
- `vault/wiki/engineering-board.md` — goal text immutable once In Progress;
  Acceptance section is the amendable surface.
- `vault/wiki/product-owner.md` — EV-29 "goal-as-defect" precedent applies
  only when the goal's reference cannot be resolved against the card's own
  words; here the Intent carries the binding.
- `vault/raw/2026-09-16-po-epic9-retry-ruling.md` (Dispute 1) — wave-3
  decomposition recorded the literal with colon (the epic ruling was not
  subject to the frontmatter bar); the current card's colon-free spelling
  is the structural artifact, not the substance.
- `council/cards/EV-37.md` Skeptic step 9 objection 3 (closed-green) — the
  Skeptic verified the R1 snapshot's token-list fidelity to pi's bundle
  but asserted the literal against pi's regex (a property of the regex),
  not against the bundle's error template. The right invariant — does the
  literal match pi's emitted message — was untested, which is how the bug
  went unchallenged.
- `vault/wiki/deterministic-merge-check.md` — five criteria are mechanical;
  criterion 5 holds only when no outstanding ruling exists; the orchestrator's
  question creates the ruling this document records.

## Escalation status

NOT a steward escalation. The goal is not the defect; the Intent binds the
literal unambiguously; the code is what needs fixing. This is owner-routable
as a fold-in.
