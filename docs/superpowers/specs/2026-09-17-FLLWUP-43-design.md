# FLLWUP-43 — Make the goal field a lossless oracle for the judge

**Card:** `council/cards/FLLWUP-43.md` (EPIC-9) — settled design, steps 7–8 handoff.
**Status:** full-council path; steps 1–6 closed (deliberation rounds 1–2,
Skeptic job-3.7, consolidator job-3.8, product-owner job-4 R1–R5, steward
job-5 ESC-1/2/3). This document writes up what the Council settled. It does
not reopen anything closed in steps 2–6.

## 1. Problem

`council/validate.py` FAILs any `goal` containing `": "`, and the
`_template.md` warning plus `board-create-card.md` "Hard failure mode"
paragraph teach authors the same ban — on the claim that "frontmatter is
parsed as plain `key: value` lines, so a `: ` truncates the value." That
claim is **false against the actual parser**: `parse_frontmatter`
(`council/validate.py:55-56`) does `line.split(": ", 1)` — it splits at the
first `: `, which is always the key separator, and returns the rest of the
line. A single-line goal with an embedded colon-space parses losslessly
(Skeptic objection 1a, `closed-green`). The ban is therefore a writer-side
gate stricter than its own loader, with no downstream truncating consumer —
the asymmetry `vault/wiki/gate-parity.md` names (`writer ⊆ loader ∪
dispatch`).

The harm is at the **authoring layer**, not the parser. EV-37's goal spelled
pi's emitted literal colon-free (`Provider finish_reason error`) because the
author obeyed the ban; the shipped constant is
`PROVIDER_FINISH_REASON_ERROR = "Provider finish_reason: error"`
(`extensions/retry.ts:78`). The judge's only input is the goal
(`council/procedures/council.md` step 10), so it passed a branch keyed to a
string that never exists at runtime — a lossy oracle. The rule worked; the
authoring response made the goal lie.

## 2. Settled contract

The converged design (all three generators, round 2) plus the rulings:

- `goal` stays **one physical line**: `goal: <text>`.
- The value is **everything after the first `: ` of the line, with edge
  whitespace trimmed** (`validate.py:60` is `value.strip()`; the Skeptic
  measured `.strip()` — objection 1b). Copy **must not** say "byte for byte"
  or "byte-exact": that would swap one false parser model for a smaller one.
  The trim is stated wherever the contract is stated, and a test pins it.
- Colons, colon-spaces, quotes, and backslashes in the value are **literal
  characters**. There is no quoting/escaping/block-scalar form and no
  unquoting step (Skeptic objection D1, `closed-green`); the judge reads the
  raw line, so no decode step may sit between file bytes and judge input.
- The value ends at a **line break** or a line that is not `key: value`
  shaped. **A wrapped goal silently loses its continuation and
  `validate.py` exits 0** (Skeptic objection 3, `closed-green`). Per
  product-owner R1 this is **out of scope for this card** (a wrap is not a
  colon-space sequence), is **documented in the new copy as a known
  hazard**, and is carried by a **step-13 follow-up card for a loud gate**.
  No wrap-FAIL ships in this change — a writer-side gate with no loader or
  dispatch match is the same `gate-parity` violation the card deletes.
- The **oracle principle** is taught at the authoring surface: the goal the
  judge reads is the text you wrote, so spell any literal (a log message, an
  error string, a constant) precisely as the system emits it. "Rephrase
  without a colon" is **dropped permanently** (R2), because it is the exact
  EV-37 failure mode.
- **Retraction is safe** (R3): the only recorded rationale is the false
  truncation claim; the future-YAML-consumer hypothetical is handled by the
  `gate-parity` corollary (that consumer ships its own quoting requirement
  with an identical loader/dispatch check).

## 3. Change set (one commit on one branch)

1. **`council/validate.py`**
   - Delete the colon-space FAIL block (`:121-124`).
   - Rewrite the module docstring bullet (`:8-9`) to: goal present on a
     single line, value = everything after the first `: ` of the line,
     edge-whitespace-trimmed; a colon-space inside the value does not
     truncate; the judge reads the same text.
   - Rewrite `parse_frontmatter`'s docstring (`:48`, currently "stopping at a
     value truncation") to state the true contract: first `: ` splits,
     edge-whitespace trimmed, value ends at a line break or a bare
     non-`key: value` line. **No parser logic change.**
2. **`council/scaffold/council/validate.py`** — byte-identical to (1).
3. **The 8 seed copies** of `validate.py` under
   `council/fixtures/{board-create-card,council,council-runner,features-deliver,features-new,owner,wiki-ingest,wiki-lint}/seed/council/validate.py`
   — byte-identical to (1).
4. **`_template.md` goal line** — root (`council/cards/_template.md`),
   scaffold (`council/scaffold/council/cards/_template.md`), and the same 8
   seeds. Copy (see §4).
5. **`council/procedures/board-create-card.md`** §3 "Hard failure mode"
   paragraph — replaced (see §4).
6. **`council/procedures/features-new.md`** lines 54, 57, 75 — the
   `no colon-space sequence` bars/attack become `single-line, literal-exact
   goal (colons allowed in the value)`.
7. **`council/fixtures/board-create-card/rubric.json`** — `c3` prompt
   rewritten off the ban (see §4); `rubricVersion` bumped `1.0.0 → 1.1.0`.
   `rubric.json` is outside `seed.treeDigest` (Skeptic 5b), so no re-pin for
   it; the version bump prevents the divergent-store-key throw
   (`eval-runner.ts:139-152`).
8. **The 8 `council/fixtures/*/fixture.json`** — recompute
   `seed.treeDigest` from the updated seed (the `sha256Tree` routine
   `eval-fixtures.ts` verifies at load) **and** bump `fixtureVersion`
   `1.0.0 → 1.1.0`.
9. **`vault/wiki/engineering-board.md:30-33`** — the false truncation claim
   and the ban are corrected **through `/wiki-ingest` at step 14**;
   `council.md` step 14 forbids the facilitator hand-editing `vault/`. Also
   fold in the ESC-3 consumer-repo skew record.

Not in the change set: `parse_frontmatter` logic (already correct); the
now-amended card `goal`; historical/Done card goals (ESC-2: EV-37's lossy
goal is accepted as a frozen residual); `vault/raw/*`.

## 4. Copy

**`_template.md` goal line** (root + scaffold + 8 seeds):

```
goal: One testable sentence stating what done means — the judge reads exactly this text, so name any literal precisely as the system emits it. Keep it on one line; the value is everything after "goal: ", edge-whitespace-trimmed (colons allowed).
```

**`board-create-card.md` §3 Hard-failure paragraph** (replaces `:42-47`):

```
**The goal is the judge's only input — keep it on one line and spell literals exactly.** This frontmatter is parsed as plain `key: value` lines with no YAML quoting: the value is everything after the first `: ` of the line, with edge whitespace trimmed. A colon-space inside the value does not truncate or re-encode anything — the goal the judge reads is the text you wrote. What ends the value is a line break or a line without the `key: value` shape, so never wrap the goal onto a second line and never drop the `: ` separator itself (`goal:foo` deletes the field). Name any literal (a log message, an error string, a constant) precisely as the system emits it, colons and all; a colon-less paraphrase of a real message string is the hard failure mode here (EV-37 shipped a dead branch that way).
```

**`features-new.md`** — each occurrence at `:54`, `:57`, `:75` becomes:
`single-line, literal-exact goal (colons allowed in the value)` (with the
surrounding sentence grammar adjusted; no other bar changes).

**`rubric.json` `c3` prompt:**

```
Grade the new board card this run wrote for the pinned intent (Add a --limit flag to the links CLI): does it follow council/cards/_template.md — a single-line, literal-exact testable goal (colons allowed in the value), an Intent section, and an Acceptance section? Name the card id and quote the goal.
```

## 5. Tests (red-first where the ruling says so)

Add to `test/` (`bun:test`, relative imports; anything touching the repo
filesystem uses a fresh `fs.mkdtempSync` dir — never the real repo):

- **T1 (red-first — the card's core).** A temp council tree with a minimal
  `board.md` plus one card whose `goal` contains
  `Provider finish_reason: error`; run the repo's `validate.py` against it
  (or the temp copy) and assert exit 0 / `All council artifacts valid`.
  Today: `FAIL: … goal contains a colon-space sequence (value truncates)`.
- **T2 (parser identity, trim-aware — green today, pins it).** Import
  `parse_frontmatter`; assert a single-line value with `: ` and with a bare
  `:` round-trips, and that edge whitespace is trimmed (`goal:␣␣padded␣␣` →
  `padded`). This green/red pair (T2 green, T1 red) proves the ban, not the
  parser, was the lossiness.
- **T3 (parity guard).** Byte-equality of `validate.py` and `_template.md`
  across root ↔ scaffold ↔ the 8 seeds. Goes red on any half-edit.
- **T4 (negative survives).** A card with `goal:no-space-after-key` must
  still FAIL `missing required key 'goal'` — the key separator rule is
  untouched.
- **T5 (digest + version).** After the seed edits and re-pins, the
  eval-fixture load path (`test/fixtures.test.ts`, `eval-fixtures.ts`
  `treeDigest` verification) is green; the `fixtureVersion`/`rubricVersion`
  bumps are asserted present.
- **T6 (conjunct-B engine-testable prefix).** Parse a treatment card whose
  goal names `Provider finish_reason: error` and assert the goal includes
  `PROVIDER_FINISH_REASON_ERROR` imported from `extensions/retry.ts`; a
  colon-free control must not. The `judge reads` leg is procedural and is
  recorded as a residual (ESC-1), not asserted.
- **T7 (wrap residual pin, documentation test).** A two-line goal parses to
  its first line and `validate.py` exits 0 — pinned as the documented
  hazard, so a future silent "fix" or a silent regression is visible. This
  is a documentation pin, not a gate on the wrap.
- **T8 (rubric smoke per R4 — minimum sufficient evidence).** A single-cell
  smoke on `council/fixtures/board-create-card`: a treatment arm whose goal
  contains `: ` and a control arm whose goal does not; the treatment
  satisfies the rewritten `c3` and the control fails or is marginal on
  literal coverage. The full matrix is not required.

## 6. Residuals (recorded, not claimed green)

- **The judge-reads leg has no engine code seam.** The strongest
  engine-provable form is card file → `parse_frontmatter` →
  `PROVIDER_FINISH_REASON_ERROR`, which T6 covers; the literal
  transcription into the judge is procedural (steward ESC-1 disposition,
  verbatim on the card).
- **Wrap truncation** — documented in copy, carried by a step-13 follow-up
  (R1).
- **Consumer-repo skew (ESC-3)** — scaffold is non-clobbering and
  `validate.py` has no override path; repos initialized before this card
  keep the old rule. Steward ruled this must not stand unbounded: a
  `Backlog` step-13 follow-up under EPIC-9 is owed (acceptance shape on the
  card), and the skew is recorded in the step-14 wiki correction.
- **EV-37's frozen lossy goal (ESC-2)** — accepted permanently; not edited.
- **Designer's P1 cold-read comprehension prediction (R5)** — recorded in
  the step-3 record; out of repo scope; does not block.

## 7. Gate set for this repo

`bash council/preflight.sh FLLWUP-43`, `bunx tsc --noEmit`, `bun test`,
`python3 council/validate.py` (AGENTS.md §Commands +
`.github/workflows/gates.yml`). No database/import/server gate exists in
this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run. All gates
clear in full regardless of change size. Work happens in an isolated git
worktree; the main checkout's branch state is never mutated.

## 8. Citations

`vault/wiki/engineering-board.md` (goal as the judge's only input; goal
immutability and amendment authority — and its stale truncation claim this
card corrects), `vault/wiki/gate-parity.md` (writer ⊆ loader ∪ dispatch;
the corollary on future writer-side hardening), `vault/wiki/deterministic-merge-check.md`
(five merge criteria; copy rulings enforced as literal-string tests),
`vault/wiki/retry-classification.md` (the literal's authority),
`vault/wiki/eval-store-contract.md` (version-keyed records; divergent-payload
throw). Wiki gaps: no page documents `parse_frontmatter`'s actual split
semantics, and no page covers the seed-follows-shipped re-pinning /
`fixtureVersion` policy.
