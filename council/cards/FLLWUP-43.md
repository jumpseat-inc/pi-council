---
id: FLLWUP-43
title: Make the goal field a lossless oracle for the judge
state: Deliberating
owner: null
epic: EPIC-9
goal: A card goal can name an exact literal that contains a colon-space sequence without truncating, and the judge reads the same string the classification test asserts.
---

## Intent

`council/validate.py`'s colon-space rule and `_template.md`'s warning forbid
`: ` in a goal, so EV-37's goal spelled pi's emitted literal without its
colon and the judge — whose only input is the goal — passed a branch that
never matched pi's real message. The rule worked (it FAILs); the authoring
response made the goal a lossy oracle. Named by the steward closure ruling as
owed before the next autonomous run.

## Run record (features-deliver / FLLWUP-43)

### Step 1 — classification (facilitator)

- **Path: full council.** The card is cross-seam (the validator
  `council/validate.py`, its scaffold copy, the card template `_template.md`,
  and the authoring procedure `board-create-card.md` all carry the same
  colon-space rule, and the eval fixture seeds carry pinned copies), and its
  `goal` admits more than one reasonable design: a plain-line rule whose
  parser is provably lossless, a quoted/escaped value with a documented
  unquoting step, or a block-scalar form. That is spec ambiguity plus a real
  authoring-compat tradeoff, so steps 2–6 run before any code is written.
- **Surface-touching: yes.** The deliverable changes copy a person reads —
  the `_template.md` warning sentence, the `board-create-card.md`
  "Hard failure mode" paragraph, and the `validate.py` FAIL message. Per
  council.md step 1 a surface-touching full-council card seats `designer` as
  a third generator in steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all present in
  `council/agents/`; no `.pi/agents/` repo-local override directory exists, so
  nothing shadows them. Ruling seats (`product-owner`, `steward`) are never
  dispatched by this container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared the environment). Main checkout clean at
  `c02380c` == `origin/main`; `python3 council/validate.py` →
  `All council artifacts valid`. No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at the
  start of the card.
- **Gate set for this repo** (authoritative; `docs/gates/GATE-EVIDENCE.md`
  does not exist here): `bash council/preflight.sh FLLWUP-43`,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (AGENTS.md
  §Commands + `.github/workflows/gates.yml`). No database/import/server gate
  exists in this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run.
- **Phase-1 rulings applicable here:** none of the recorded EPIC-9 run
  rulings (scope, sequencing, merge, follow-up re-homing, R1
  union-merge-reconcile) decides any question this card raises; they govern
  process only. Nothing is re-asked.

### Step 2 — independent first pass

Card set `Deliberating` on the card frontmatter and on `council/board.md`;
`python3 council/validate.py` → `All council artifacts valid`. Dispatching
`owner`, `principal`, and `designer` in parallel, each given only this card
(no peer position).


### Step 2 — round 1 positions (verbatim, three independent dispatches)

Dispatches: `owner` job-3.1 (4.1m, 15 turns, total 448659 tok, cost≈$0.0156); `principal` job-3.2 (4.1m, 17 turns, total 943762 tok, cost≈$0.0378); `designer` job-3.3 (4.1m, 3 turns, total 57397 tok, cost≈$0.0140). Each was given only the card; no peer position was shown.

---

#### owner (job-3.1)

All evidence is in hand — card, validator, scaffold copies, all 8 fixture seeds, both procedures, the fixture digest machinery, EV-37's actual goal, and the three wiki pages. Here is my position. **No files were edited; this is deliberation only.**

---

## Approach

**1. The actual mechanism — there is no truncation, and the ban is over-broad relative to the parse.**

`parse_frontmatter` (`council/validate.py:49-67`) does `line.split(": ", 1)` — it splits at the **first** `: ` of the line, which is always the `goal: ` key separator. I ran it: a card with `goal: Retry when the message says Rate limited: try again later` parses to the **full, byte-exact value**. The docstring's claim — "frontmatter is parsed as plain `key: value` lines, so a `: ` truncates the value" — is factually false for this parser. So the FAIL at `validate.py:159` rejects goals the parser itself reads losslessly.

The real lossiness lives one layer up, in the **authoring rule**, and it is total: EV-37's goal (Done card) says `Provider finish_reason error`, while the shipped constant (`extensions/retry.ts:78`) is `PROVIDER_FINISH_REASON_ERROR = "Provider finish_reason: error"` — with the colon. The author, barred from writing `: `, spelled the literal colon-less; the judge, whose *only* input is the goal (`council/procedures/council.md:270`, `judge.md:31`), passed a branch keyed to a string that never exists at runtime. Lossy oracle = authoring-layer censorship, not parser truncation. No other consumer of the goal exists — I grepped `extensions/` and only a comment in `runs.ts` mentions the goal; no engine code parses card frontmatter.

[[gate-parity]] is directly on point and cuts against the current rule: *the validation layer may be stricter than the runtime only where a downstream gate is also that strict* — here validate.py is stricter than **its own loader**, with zero downstream truncating consumers. The invariant `writer ⊆ loader ∪ dispatch` fails: the ban is a writer-side gate with no loader counterpart. [[engineering-board]] repeats the false truncation claim ("a `: ` … silently truncates the frontmatter") and is stale on this point.

**2. The design: plain-line, lossless-by-construction — no quoting, no escaping, no block scalar.**

- **Rule for the goal field:** `goal` stays a single `goal: <text>` line. The value is everything after the **first** `: ` of the line, byte for byte. Colons, colon-spaces, quotes, backslashes — all literal. A line break ends the value; a line without the `key: value` shape ends the frontmatter. That is the entire contract. The judge reads raw markdown, so the bytes on the line *are* the judge's input *are* what a classification test asserts — no decode step anywhere, which is what "the judge reads the same string" requires.
- **I reject the quoted/escaped form** (option b) because the unquoting step recreates the lossy-oracle class in new clothes: the judge reads the escaped bytes, a test asserts the decoded form, and the LLM is an unreliable decoder. **I reject the block-scalar form** (option c) because `parse_frontmatter` treats a bare non-`key: value` line as frontmatter-terminating — block scalars would require a parser rewrite (scope creep) and add indentation-folding transforms between file bytes and judge input. Plain-line is strictly simpler and already lossless.
- **Exact changes:**
  - `council/validate.py`: delete the `": " in goal` FAIL block and the docstring bullet + parenthetical asserting truncation (replace with the lossless contract: value = everything after the first `: `, byte-exact, single line). `parse_frontmatter` itself needs **no logic change** — it is already correct; only its docstring comment ("stopping at a value truncation") is wrong.
  - Mirror byte-for-byte into `council/scaffold/council/validate.py` and all 8 `council/fixtures/*/seed/council/validate.py`.
  - `_template.md` (top, scaffold, 8 seeds): change the goal example line (copy below).
  - `board-create-card.md` §3: replace the "Hard failure mode" paragraph (copy below).
  - **`council/procedures/features-new.md`** — the card's surface list omits this, but lines 54/57 (principal's bars: "no colon-space sequence") and line 75 (skeptic attacks "colon-space") carry the ban and must be rewritten, or the decomposition wave keeps censoring goals after the validator stops caring.
  - **`council/fixtures/board-create-card/rubric.json` line 18** — the grader prompt says "a testable goal with no colon-space sequence"; left unchanged, that eval would REJECT a now-legal goal. Also omitted from the card's surface list; must change.

## Compat / scope surface (question 3)

| Surface | Change? | Why |
|---|---|---|
| `council/validate.py` (top) | **Yes** | the FAIL and the false docstring are the defect |
| `council/scaffold/council/validate.py` | **Yes, byte-identical** | scaffold is the shipped copy; divergence means consumer repos get the old rule |
| `council/cards/_template.md` + scaffold copy | **Yes** | the example sentence teaches the ban |
| `board-create-card.md`, `features-new.md` | **Yes** | authoring-side ban is the actual lossiness |
| 8 fixture seeds (`validate.py` + `_template.md`) | **Yes** | today they are byte-identical to top-level (verified by `diff`); leaving them stale means the board-create-card eval trains/grades against a rule the shipped repo no longer enforces |
| 8 × `fixture.json` `seed.treeDigest` | **Yes — re-pin in the same change** | see below |
| `board-create-card/rubric.json` | **Yes** | grader prompt names the ban |
| `vault/wiki/engineering-board.md` | **Yes** | repeats the false truncation claim and the ban |
| Historical cards (EV-10/29/34/37, FLLWUP-21, EPIC-9) | **No** | Done records; goal immutability applies ([[engineering-board]]: goal edits after In Progress are a new card) |
| `parse_frontmatter` logic | **No** | already lossless; "fixing" it would be the scope creep |
| `retry.ts`, ev40/ev41 test literals | **No** | the with-colon literal is correct; only the goal text lied |

**On AGENTS.md convention #5 and re-pinning:** the pinned `treeDigest` is tamper-evidence verified at load (`eval-fixtures.ts:684` — `treeDigest mismatch` throws), not a vow of immutability. Since this card's deliverable changes seed contents, **re-pinning is required, in scope**: edit the seeds, recompute the sha256 tree digest (the `sha256Tree` function), write the new digest into each of the 8 `fixture.json`s. Skipping the seeds entirely would also be defensible as narrow scope, but I argue against it: a fixture whose seed validates goals by a rule the shipped validator just deleted is a fixture that certifies the old lossy behavior — exactly the artifact-level-vs-intake-level trap [[deterministic-merge-check]] documents from EV-37. **The wiki does not cover** the seed-follows-shipped policy for edited artifacts (convention #5 covers the digest mechanics, not when seeds must track top-level changes); I state that gap explicitly and derive the policy from the [[gate-parity]] invariant plus the EV-37 lesson.

## Falsifiable tests (question 4) — red-first

1. **T1 (the core, red today):** in a `mkdtemp` tree with a minimal `council/board.md` + one card whose `goal` names `provider finish_reason: error` (with colon-space), run `python3 council/validate.py` → expect exit 0 / `All council artifacts valid`. Today: `FAIL: goal contains a colon-space sequence` → red; after the change → green.
2. **T2 (losslessness identity):** spawn python importing `parse_frontmatter` from the repo's `validate.py`; assert the parsed `goal` equals the input bytes exactly for a value containing `: ` and for a value containing a bare colon (`a:b`). T2 passes **before** the change — that pairing (T2 green / T1 red) is the proof that the ban, not the parser, is the lossiness, and it pins the parser against anyone who "fixes" this by adding a quoting layer.
3. **T3 (scaffold/seed parity):** byte-equality of `council/validate.py` ↔ scaffold ↔ all 8 seeds, and of `_template.md` likewise. Currently true, so it's a regression guard, not red-first — but it goes red the moment any copy is half-edited.
4. **T4 (negative that must still FAIL):** a card with `goal:no-space-after-key` — no `: ` means the parser sees a bare line, frontmatter ends, `goal` is missing → must still FAIL `missing required key 'goal'`. This proves the key/value separator still requires colon-space and we liberalized only the *value*, not the parse contract. (A wrapped two-line goal must equally FAIL.)
5. **T5 (digest discipline):** the existing eval-fixture load path (`test/fixtures.test.ts`, `eval-fixtures.ts:684`) must be green after seed edits + re-pins — red if anyone edits seeds without re-pinning, which is the convention-#5 tripwire doing its job.

No existing test asserts the colon FAIL (verified), so nothing needs inverting.

## Copy changes (question 5), sentence by sentence

**`_template.md` goal line** — current: `goal: One testable sentence stating what done means. No colon-space sequence anywhere in this value.`
→ **New:** `goal: One testable sentence stating what done means. Written on a single line; the text after "goal: " is the goal byte for byte, colons included.`

**`board-create-card.md` "Hard failure mode" paragraph** — three sentences:
1. `**Hard failure mode — do not write a colon-space sequence (': ') anywhere in the goal.**` → `**The goal must stay a single line, and its value is read literally.**`
2. `This frontmatter is parsed as plain 'key: value' lines with no YAML quoting. A ': ' inside the value truncates everything after it — the goal 'validate.py' and the judge actually read will silently be the fragment before the colon, not the sentence you wrote.` → `The frontmatter parser takes everything after the first ': ' of the line as the value, byte for byte — a colon-space inside the value does not truncate or re-encode anything. The goal the judge reads is exactly the text you wrote, so spell any literal precisely as the system emits it, colons and all; a colon-less paraphrase of a real message string is the one hard failure mode here (EV-37 shipped a dead branch that way).`
3. `If the goal needs to contrast two things, rephrase without a colon ("rather than" or "instead of").` → `What ends the value is a line break or a line without the 'key: value' shape — never wrap the goal onto a second line, and never drop the colon-space separator itself ('goal:foo' deletes the field).`

**`features-new.md`** (lines 54, 57, 75): replace each `no colon-space sequence` bar with `single-line literal-exact goal` / `single-line, byte-literal goal (colons allowed in the value)`.

## Tradeoffs accepted

- We drop the (imaginary) protection against hypothetical future YAML consumers of card frontmatter. If a YAML-parsing consumer is ever added, its quoting requirements ship with it, in the same change — that is the [[gate-parity]] corollary, and pre-empting it with a lossy authoring ban is the asymmetry that page forbids.
- Council copy will now contain `: ` sequences; the uniform "no colon anywhere" aesthetic is gone. Cosmetic.
- One-line goals remain mandatory, so a very long literal (like EV-37's) still makes an awkward frontmatter line. Acceptable: the judge's contract needs exactly this, and the procedural "one testable sentence" bar already bounds length.

## Testable claims

- **"The parse is already lossless"** — T2 (identity test on `parse_frontmatter`) passes *before* any change; **"the ban is the lossiness"** — T1 is red today and green after deleting only the FAIL. That green/red pair is the whole dispute settled by execution, not prose.
- **"The fix is complete only if all five surfaces move together"** — T3 (byte-parity across top/scaffold/8 seeds) and T5 (digest verification) fail on any partial edit; the rubric change is asserted by extending T1's temp-tree harness to run the fixture grader prompt string as a literal-match test, per the [[deterministic-merge-check]] precedent that copy rulings are enforced as literal-string tests (EPIC-5 did exactly this and one word of drift turned 3 tests red).
- **"The negative contract survives"** — T4 must stay red on `goal:foo` cards after the fix, proving the key separator rule was never touched.

Cited wiki pages: [[engineering-board]] (goal-is-the-judge's-only-input, the ban's record, goal-immutability — and its stale truncation claim), [[gate-parity]] (writer ⊆ loader ∪ dispatch invariant; no gate without a downstream match), [[deterministic-merge-check]] (criterion 1 includes validate.py regardless of change size; copy-as-literal-test precedent; criterion 5 noted as holding per the card's step 1). Wiki gaps stated above: no page covers `parse_frontmatter`'s actual split semantics (engineering-board *mis*-states them) nor the seed-follows-shipped re-pinning policy.

---

#### principal (job-3.2)

## Cross-seam reading

**The four consumer hops, as they actually are:**

1. **Parser** — `council/validate.py:47-65`. `parse_frontmatter` splits with `line.split(": ", 1)` (`:59`). `"goal: A literal like Provider finish_reason: error works".split(": ", 1)` → `["goal", "A literal like Provider finish_reason: error works"]`. **Embedded `: ` in a single-line goal value does not truncate.** The docstring (`:8-9`), the check at `:122-124` (`": " in goal`), `_template.md:7`, `board-create-card.md:42-47`, and `features-new.md:54,57,75` all assert a truncation that this parser does not perform. The check is a substring test on the *parsed value* — it never inspects the raw line, so it cannot distinguish a benign colon from a real parse break.
2. **Human/agent author** — reads `_template.md:7` + `board-create-card.md:42-47`, which state the false failure mode ("truncates everything after it"). This is the vantage that produced EV-37's colon-free goal (`council/cards/EV-37.md:7`), and it obeyed a description of code it never opened.
3. **Facilitator → judge** — `council/procedures/council.md` step 10 hands the judge "the card's `goal` and the Skeptic's evidence — nothing else," and explicitly forbids widening that input. `council/agents/judge.md` `<when_invoked>` confirms the contract; `council/fixtures/judge/input.md:1` shows the shape (`Goal: "…"`). This hop is *lossless by construction* — it copies what the goal says. It is a victim, not a defect.
4. **Classification test** — `test/retry.test.ts` derives `emitted` from pi's installed bundle and asserts `PROVIDER_FINISH_REASON_ERROR === emitted`; `extensions/retry.ts` declares the same literal. This is the independent authority on the string.

**Which seam is broken.** Not the parser (already lossless for single-line values), not the facilitator→judge hop (verbatim copy). The broken seam is the one no seat owns: **the validation rule's model of its own parser is false, and that false model is the copy authors obey.** Every downstream harm follows from the false sentence, not from the parser. The actual truncation path is unguarded: a goal value wrapped onto a second line hits `elif line.strip(): break` (`:61-63`) and silently becomes its first line — no colon required. The rule that protects the oracle is aimed at the wrong character.

**Which seam the card's `goal` sentence requires fixing.** The sentence has two conjuncts. (A) "can name an exact literal … without truncating" is a **write/authoring-seam** change (rule + copy). (B) "the judge reads the same string the classification test asserts" is **not a code change at all** — the judge already reads whatever the goal says; the goal was the thing that lied. (B) is a *proof obligation* across a seam with no code in it. No edit to `validate.py` can satisfy (B), and none of this repo's four gates (`preflight`, `tsc`, `bun test`, `validate.py`) can falsify it. If the design stops at (A), it will have reproduced the card's own failure mode: a green gate that proves nothing about the oracle.

**Cross-seam invariants any design must preserve**

- **I1 board/card contract** — id pattern + filename match, `state` ∈ 7 columns, the six required keys, one `- <ID> — <Title>` line under the matching column, no orphans. A parser change must not perturb the `marker = f"- {cid} — {title}"` board match (`validate.py:127-139`) or the em-dash orphan regex.
- **I2 scaffold non-clobbering + no override path** — `council/scaffold/council/{validate.py,cards/_template.md,board.md}` are copied by `/council-init` and never overwrite (AGENTS.md #6). There is *no* override-resolution for `validate.py` (unlike seats/procedures/fixtures), so **already-initialized consumer repos keep the false rule forever**; the fix reaches new repos only. Version skew between packaged and installed validator is unbounded.
- **I3 fixture pinning** — `seed.treeDigest` is verified only when `source === "packaged"` (`extensions/eval-fixtures.ts:680-688`). Editing any `council/fixtures/*/seed/council/*` file requires recomputing that fixture's `treeDigest` or load throws. Ten copies of `validate.py` exist (root + scaffold + 8 seeds); grep confirms all carry `split(": ", 1)` and the `": " in goal` check. `rubric.json` is **outside** the digest — it is not pinned.
- **I4 goal immutability** — [[engineering-board]]: goal text is immutable once `In Progress`; EV-37 is `Done`, so its lossy goal is frozen. Amending FLLWUP-43's own goal is legal while `Deliberating` (authority [[steward]]).
- **I5 judge input contract** — the fix must not pass the Intent, spec, or expected literal into the judge's dispatch. council.md step 10 forbids it, correctly.
- **I6 gate parity** — [[gate-parity]]'s invariant is *writer ⊆ loader ∪ dispatch*. Here the writer is stricter than **every** downstream consumer on a dimension no consumer enforces and no delayed failure exists. That is the asymmetry the principle names; any design retaining a write-time restriction must ship "the identical check in dispatch in the same change," which dispatch should not gain.

**Blind spots, named separately**

- **Validator/data-shape vantage**: reasons about frontmatter as text but never models its own `maxsplit=1`; cannot see the colon-vs-newline distinction because it never looks at the raw line.
- **Author vantage**: trusts the stated mechanism, never opens `parse_frontmatter`; cannot discover the constraint is unnecessary for a single-line goal, nor that the real hazard is a wrap.
- **Facilitator vantage**: copies the goal faithfully and has no lever to detect a lossy or false goal at the copy point; step 10's "don't widen the input" is correct but leaves no catch.
- **Judge vantage**: structurally cannot detect the goal lying — the goal is the only oracle and there is no second one in its context (`judge/input.md` grades the goal against evidence, never the goal's fidelity).
- **Eval-harness vantage**: `council/fixtures/board-create-card/rubric.json` criterion `c3` literally grades "a testable goal **with no colon-space sequence**." It is a *judge* criterion, not a gate, and it is not digest-pinned — so a stale rubric silently grades against a superseded rule with no red test.
- **Owner vantage (the implementing seat)**: biased to "minimum change" per its own `owner_mode`; `bun test` + `validate.py` go green on a one-line check deletion, which reads as done while conjunct (B) is untouched.

**Reframe**

The card frames a fix at the write-time gate and implies validate.py is the culprit. Reframe: the deliverable is three separable things, and the goal text only authorizes two of them.

- **(A) Retract the false claim** — the `: ` ban and the three/four copies of its false rationale.
- **(B) Guard the real hazard, or decline to** — the wrapped-line truncation (`:61-63`). "Without truncating" is already true today for single-line goals; the goal text does **not** settle whether the design must also make wrapped goals lossless.
- **(C) Prove (B) of the goal sentence** — a seam test spanning card-file → parser → judge input → the bundle-derived literal. This is the only evidence a judge could accept for "the judge reads the same string the classification test asserts," and it cannot come from any existing gate.

**Design questions the goal does NOT settle** (not picking winners):

1. Plain-line (just stop forbidding) vs. a quoted/escaped/block form. The goal's "without truncating" is consistent with all three; only the comprehension question — can an author type the literal as-is, or must they learn a convention — distinguishes them. That is open-judgment by construction → **product-owner**.
2. Retroactivity: does the fix re-state EV-37's frozen goal (a new card), or accept the historical lossy record? Portfolio judgment, no test → **product-owner/steward`.
3. Is the wrapped-line path in scope (B) or explicitly out? Testable that a wrap truncates; **not** testable whether wrapped goals should be legal → open-judgment if the design chooses to support them.
4. Fixture seeds and the `board-create-card` rubric `c3`: update the 8 seed copies + recompute `treeDigest`s, or let packaged fixtures grade against the old rule? The goal names neither.
5. The missing surface: `council/procedures/features-new.md:54,57,75` carries the rule but was absent from the card's surface enumeration.
6. Propagation: existing initialized consumer repos retain the false rule via non-clobbering scaffold. Acceptable? ← no test settles it.
7. **No test can settle** whether the rule existed for an *unrecorded* second rationale (defense against a future parser change). Retracting a gate documented with a false rationale is safe only if no undocumented rationale exists.
8. Referential opacity in the goal itself: "the classification test" names no file. The judge for *this* card receives that phrase as its only input — an instance of the exact defect class.

**Testable claims** (disagreements as runnable tests, not prose):

```python
# T1 — parser losslessness (already true today; pins it)
from council.validate import parse_frontmatter
t = '---\ngoal: classifyRetry returns retry for Provider finish_reason: error.\n---\n'
assert parse_frontmatter(t)["goal"] == "classifyRetry returns retry for Provider finish_reason: error."

# T2 — the real truncation path (red today; the hazard the rule misses)
t2 = '---\ngoal: first part\n second part\n---\n'
assert parse_frontmatter(t2)["goal"] == "first part\n second part"   # fails: "first part"

# T3 — write seam
# write a temp repo with the treatment card + board line; assert validate.py exit 0.
assert subprocess.run(["python3","council/validate.py"], cwd=tmp).returncode == 0
```

```ts
// T4 — the seam test the card's own judge needs (bun:test)
import { PROVIDER_FINISH_REASON_ERROR } from "../extensions/retry.ts";
const goal = parseFrontmatter(readFileSync(cardPath, "utf8")).goal!;
expect(goal.includes(PROVIDER_FINISH_REASON_ERROR)).toBe(true);          // treatment
expect(CONTROL_GOAL.includes(PROVIDER_FINISH_REASON_ERROR)).toBe(false); // sensitivity
// and, if the judge input is engine-constructible, assert the input contains
// PROVIDER_FINISH_REASON_ERROR byte-equal; else a `judge` eval fixture whose
// report must quote the with-colon literal for the treatment seed and must not
// be grounded on it for the colon-free control seed.
```

**Falsifier, end to end** (the one that proves conjunct B rather than validate.py stopping): with a card whose goal names `Provider finish_reason: error`, the treatment arm must satisfy T1 + T3 + T4, and the **colon-free control** must fail T4. If the control also passes T4, the goal is not sensitive to the literal and no oracle exists — the test is red for the right reason. Red-first evidence: on the pre-fix tree T3 fails `FAIL: … goal contains a colon-space sequence`, and T2 fails regardless — the two reds are different defects, and only T4's treatment/control pair is evidence for "the judge reads the same string the classification test asserts." `All council artifacts valid` is evidence for conjunct A only.

**No reframe needed?** No — the framing is wrong in a load-bearing way: it locates the repair at a gate that is already lossless and omits the only mechanism (`:61-63`) that actually truncates, while the goal's second conjunct is unprovable by any file the card names.

---

#### designer (job-3.3)

Pages used: `council/cards/FLLWUP-43.md` (goal + Intent), `council/cards/_template.md` (current warning), `council/procedures/board-create-card.md` (Hard failure mode paragraph + em-dash convention §6), `council/validate.py` (FAIL message, `parse_frontmatter`, docstring), and `vault/wiki/engineering-board.md` (Card frontmatter section that cites EV-37/FLLWUP-43 as the correctness-not-truncation case). Also `vault/wiki/index.md` for the page map.

---

**Design position**

The current copy is *parser-truthful and author-wrong*. It tells the author that `: ` truncates — that is true, but it is not the failure EV-37 actually had. EV-37's validator passed; the goal was never truncated. The goal was *misspelled*, the validator stayed silent, and the judge read a goal that named a literal the implementation was never going to match. The lesson the copy must teach is not "don't truncate" but "**the goal is the only thing the judge reads, so whatever literal it names is the literal your code will be tested against — name the exact string**." The fix is not to add more warnings but to flip the framing from a parsing hazard to an oracle hazard, and to point the author at a lossless form (whatever the engineer lands: quoted value, block scalar, or escape) instead of the current escape hatch, which is "rephrase without a colon" — for a goal whose job is to name a literal, that escape hatch is the bug.

**Gulf closed**

Gulf of Evaluation, for the author at the moment they write `goal`, before the card reaches the board. Today the author has no signal that their goal *and* their judged code disagree about the literal; the validator green-lights a misspelled literal, the judge reads the misspelling, and the failure only surfaces as a dead branch at runtime. The new copy must close the gap at authoring time so the author — not the runtime — owns the oracle.

**Principle and evidence**

- **Signifier, in the wrong place today.** The current template sentence — "No colon-space sequence anywhere in this value" — signifiers *a parser constraint* on a field whose purpose is *a judge-readable oracle*. The signifier names the wrong artifact. The principle violated is **knowledge in the world** vs **knowledge in the head**: the author must already know that the judge will read this sentence literally, and the validator gives no feedback about that. Evidence: `council/cards/_template.md` line 5 ("No colon-space sequence anywhere in this value") signifiers the parser, not the oracle; `council/procedures/board-create-card.md` "Hard failure mode" paragraph signifiers truncation as the danger; the `validate.py` FAIL message `f"{cid}: goal contains a colon-space sequence (value truncates)"` confirms that constraint framing is what propagates.
- **Conceptual model, missing.** The author needs the model "**goal = the literal the judge tests against**". The current copy never states it. The model is implied by "one testable sentence stating what done means" but does not extend to "the literal characters inside this sentence are the literal characters your code will be matched against" — and that is exactly the model EV-37 lacked. Evidence: `vault/wiki/engineering-board.md` "Card frontmatter" section names the correctness-not-truncation risk explicitly ("the goal is the judge's only input, so a goal forced to misspell a literal is a goal that lies") — the wiki already names the principle, the surface copy does not propagate it.
- **Forcing function at authoring, not at parsing.** The validator's job today is to refuse `: `; that is a parser-level forcing function. EV-37 shows the parser-level force is insufficient when the wrong-branch behavior is *misspelling*. The right forcing function is at *author comprehension*: the FAIL message must name the lossless form so the author can detect and correct their own misspell before reaching the board. Evidence: `validate.py` line `fail(f"{cid}: goal contains a colon-space sequence (value truncates)")` — diagnostic without remedy; the author who dodges via rephrase never sees this line at all (their misspelling has no `: `).

**Falsifiable predictions**

These are *hypotheses* the new copy must satisfy; the smoke that would falsify them is a cold-read authoring test, not a CDP assertion, because the artifact is author comprehension of static text.

- **P1 (success path).** An author given *only* the new template sentence and `board-create-card.md` Hard failure mode, asked to write a goal whose judged literal must contain `: ` (e.g. `Provider finish_reason: error`), either (a) writes the literal inside the supported lossless form on the first try, or (b) writes it raw with `: ` and the validator FAIL message tells them exactly how to convert it. Falsifier: a cold-read author rewrites the goal without the colon (the current failure) and believes the validator's silence means they are correct.
- **P2 (oracle alignment).** When the author's goal contains a literal in the lossless form and the implementation matches the same literal, the goal as *stored on disk* equals the string the judge reads byte-for-byte. Falsifier: a smoke that reads the parsed goal from `parse_frontmatter` and the goal string the implementation is tested against, and asserts byte-identity (a pure-seam test on `parse_frontmatter` plus a fixture whose acceptance names both forms).
- **P3 (FAIL message points at the remedy).** The FAIL message in `validate.py` for the colon-space case names the lossless form (e.g. "goal contains a colon-space sequence; name the literal inside the supported form — see `_template.md` — so the judge reads the same string your code matches") rather than only the truncation. Falsifier: a grep of `validate.py` FAIL messages against a checklist of "names what to do next" — colon-space FAIL fails the grep.
- **P4 (no oracle drift in the procedure).** `board-create-card.md` §3's two bullets ("Falsifiable", "Not satisfiable by a stub") stay intact; the bullet that changes is the Hard failure mode paragraph, which is the *only* paragraph that names the colon-space rule. Falsifier: any change to the falsifiable / not-satisfiable-by-a-stub bullets, or any change to the em-dash convention in §6, would mean scope creep.

**User-facing copy I would NOT change, and why**

- The em-dash convention in `board-create-card.md` §6 (and the corresponding `board_columns` matcher in `validate.py`). That is a *board-line parser* concern with a different failure mode ("invisible to the board even though the file exists"); it is unrelated to the *goal-frontmatter* parser this card targets. Tying the two together in one edit would mix two failures and confuse the author about which signifiers mean what.
- The state-column names and ordering. Out of scope; the FAIL messages in `validate.py` for state are correct.
- The "one testable sentence" framing in `_template.md` and `board-create-card.md` §3's "Falsifiable" / "Not satisfiable by a stub" bullets. These are about *the kind of sentence the goal must be*, not about *how its characters are parsed*. They are orthogonal to the colon-space correctness issue.
- `validate.py`'s module docstring (the long block-comment at the top). The docstring is parser-truthful and is the right description of the validator's job. The *FAIL message an author sees in their terminal* is a separate surface and is what changes.
- The "Draft, then stop" gate in `board-create-card.md` §5 and the "human approves the exact card" rule. These govern how cards enter the board; FLLWUP-43 is about *what the goal says*, not *who approves it*.

**Open-judgment calls (not resolved here)**

1. **Which lossless syntax the warning names.** Quoted value, block scalar, or escape sequence — the engineer seat (`owner`/`principal`) decides what the parser supports; designer argues for the copy direction. I will not pick one. Whichever lands, the FAIL message should name it concretely, not just point at the template.
2. **Whether to keep "rephrase without a colon" as a fallback.** It is currently the only advice offered. Keeping it preserves a workable escape hatch for goals that don't *need* to name a literal verbatim. Dropping it forces every author toward the lossless form, which is safer (closes the EV-37 class) but raises the floor for goals that are genuinely paraphrasable. The copy direction can go either way; I'd flag this as the one question whose answer changes how aggressive the new template sentence should be.
3. **FAIL message specificity.** Whether the new FAIL message names the exact syntax ("wrap in backticks") or points at `_template.md` for the form. The first is more useful when the project has one canonical lossless form; the second is safer if multiple forms are allowed. Settled by the engineer's choice in (1).