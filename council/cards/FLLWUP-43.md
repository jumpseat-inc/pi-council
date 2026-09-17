---
id: FLLWUP-43
title: Make the goal field a lossless oracle for the judge
state: Deliberating
owner: null
epic: EPIC-9
goal: A card goal can name an exact literal that contains a colon-space sequence without truncating, and council/validate.py's parse_frontmatter recovers that literal intact when the goal names the string that test/retry.test.ts asserts PROVIDER_FINISH_REASON_ERROR, declared in extensions/retry.ts, to be.
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

### Step 3 — round 2 positions (verbatim; exchange closed at 2 of ≤3 rounds)

Positions had stabilised on the design (plain-line lossless rule; delete the colon-space FAIL; update template/procedure/features-new/rubric/seeds; correct docstrings) and narrowed to two live disputes — the wrapped-line policy and the fixture/rubric version bumps. No third round was run: the remaining disagreement is open-judgment, not a claim one more exchange would settle (council.md step 3, stop early on stabilisation; `<yield_contract>`, do not re-argue).

Dispatches: `owner` job-3.4 (3.6m, 6 turns, total 152250 tok, cost≈$0.0088); `principal` job-3.5 (3.6m, 14 turns, total 1012139 tok, cost≈$0.0480); `designer` job-3.6 (3.6m, 8 turns, total 245442 tok, cost≈$0.0354). Each was handed the others' round-1 positions via the card record.

---

#### owner (job-3.4)

All load-bearing facts are now verified against the tree. Here is my round-2 position.

---

## Approach

**Load-bearing claim verdicts.**

*Principal:*

1. **"The parser is already lossless for single-line values; the docstring's truncation claim is false"** — **agree**, verified empirically: `parse_frontmatter('---\ngoal: ...Provider finish_reason: error.\n---\n')` returns the full byte-exact value (`council/validate.py:59` splits on the first `: `, which is the key separator). The docstring (`:8-9`) and `parse_frontmatter`'s own docstring (`:52` "stopping at a value truncation") are both false as written.
2. **"The real truncation path is the wrapped line (`:61-63` `elif line.strip(): break`)"** — **agree**, verified: a two-line goal parses to only its first line, silently, and `validate.py` exits 0. This is a live silent-loss path in exactly the field this card governs.
3. **"Conjunct (B) is a proof obligation no file edit and no gate can falsify"** — **agree with a correction.** The judge hop is procedural (council.md:270 hands the judge the goal text verbatim — verified), so the *end-to-end* span card→judge→runtime literal is not code-testable; but the code-testable prefix (card file → `parse_frontmatter` → assertion against `PROVIDER_FINISH_REASON_ERROR`, `extensions/retry.ts:78`) is real and principal's T4 captures it. Owner's T2 is the same test from the parser side. Together they are the maximum code-testable realization of (B); the residual is eval-level, and I say so rather than letting (B) be silently declared "done."
4. **"Wrapped-line scope is open-judgment"** — **disagree that it's fully open; the *loudness* half is decidable here** (see reconciliation (a) below). Whether to *support* multi-line goals is open-judgment; whether a documented-lossless field may keep a *silent* truncation path is not — that is the artifact-vs-intake trap [[deterministic-merge-check]] records from EV-37.

*Designer:*

1. **"The current copy is parser-truthful"** — **disagree, and this is designer's premise error.** The copy's claim ("a `: ` truncates everything after it") is factually false — I ran the parser. Designer believed the docstring without executing it; owner, principal, and my own run all confirm the claim is false. Designer's *conclusion* nonetheless survives: the copy's framing (parser hazard) is the wrong framing, and the oracle framing ("the goal is the only thing the judge reads; name the exact literal") is the right one. The verdict on the copy direction stands; the evidentiary basis is corrected.
2. **"The module docstring is parser-truthful and should not change"** — **disagree.** The docstring contains the false truncation claim verbatim (`validate.py:8-9`). Shipping a validator whose behavior changed while its own docstring still asserts the deleted rule recreates the false-model problem this card exists to fix. Owner's change list (docstring included) is correct; designer's do-not-touch list loses this one item.
3. **Designer's P3 (FAIL message names the remedy)** — **agree in transferred form**: the colon-space FAIL is deleted, so the remedy-naming obligation transfers to the new wrapped-line FAIL message.
4. **Designer's deferred lossless-form question** — **settled by convergence**: plain-line, no quoting/escaping/block scalar (owner's rejection of decode steps is correct; any decode between file bytes and judge input recreates the lossy class; block scalar needs a parser rewrite).

**Reconciliation (a) — the wrapped-line path.** **In scope, in the loud form; multi-line support is explicitly declared out.** Reasoning: after this card, the documented contract is "the goal value is read byte for byte." The only remaining way that promise breaks is a wrap, and today a wrap is *silent* — the exact EV-37 signature (validator green, goal lossy). We do not need to make wrapped goals lossless (that's a block-scalar/parser rewrite — out, and I join owner in rejecting it); we need them to **FAIL loudly**. This is one detectable condition — `parse_frontmatter` terminates frontmatter on a bare non-`key: value` line, and a well-formed card always terminates on `---` — so it is a small FAIL addition in a file already being edited, with a red-first test (principal's T2 inverted: today the wrapped goal *passes* with a truncated value; after the fix it must FAIL). This must be decided here and recorded, not discovered by the implementer — that answers principal's design question 3.

**Reconciliation (b) — seeds, digests, rubric, features-new.** **All in scope**, on three grounds I verified:
- **Mechanical necessity:** editing any `council/fixtures/*/seed/council/*` file without re-pinning throws at load (`extensions/eval-fixtures.ts:683-685`) — re-pinning is not optional once seeds change; it is convention #5's tripwire working as designed.
- **Necessity of the seed edits themselves:** all ten copies of `validate.py` (top, scaffold, 8 seeds) are byte-identical today (verified by diff), and each seed carries `_template.md` (verified: 8). A fixture whose seed enforces a rule the shipped validator just deleted certifies the lossy behavior — the artifact-level trap. Skip-the-seeds was defensible only if the rule stayed; it doesn't.
- **rubric.json c3 and features-new.md:** both carry the ban (rubric c3: "a testable goal with no colon-space sequence" — verified; features-new.md:54,57,75 — verified). The rubric is *outside* the digest (confirmed — the pin covers `seed/`), so it changes with no digest implication. Left stale, c3 would instruct a judge to reject now-legal goals, and the decomposition wave would keep censoring child goals after the gate is gone. The card's surface enumeration was incomplete, not exhaustive-constitutional. Also in scope per the same rule: `vault/wiki/engineering-board.md:30-33`, which repeats the false truncation claim (verified). *Not* in scope: `vault/raw/*` records (immutable history) and historical cards (EV-37 is Done; goal immutability).

**Converged design (one).**

*Rule:* `goal` stays a single `goal: <text>` line. Value = everything after the first `: ` of the line, byte-exact; colons and colon-spaces legal in the value. Frontmatter ends at a `---` line, at a line break ending the value, or at a bare non-`key: value` line. Multi-line goals are **not supported** (declared out) — a bare-line termination is a **FAIL**: "frontmatter entry not in `key: value` form ends frontmatter — is the goal wrapped onto a second line?"

*Files, one change set:* `council/validate.py` (delete the `": " in goal` FAIL; rewrite module + parser docstrings to the lossless contract; add the bare-line-termination FAIL) → byte-identical into scaffold + 8 seeds; `_template.md` goal example line (owner's copy, amended to name the single-line rule) → scaffold + 8 seeds; `board-create-card.md` Hard-failure paragraph (owner's 3 sentences, with sentence 3 amended: the validator now *FAILs* on a wrap, not merely "never wrap"); `features-new.md:54,57,75` (bars become "single-line, byte-literal goal — colons allowed in the value"); `board-create-card/rubric.json` c3 (same phrasing); `vault/wiki/engineering-board.md` truncation claim corrected; 8 × `fixture.json` `treeDigest` recomputed via `sha256Tree` in the same commit.

*Red-first tests:* **T1** (red today) temp-tree card whose goal contains `: ` → expect exit 0; today `FAIL: goal contains a colon-space sequence`. **T2** (green today, pins it) parser identity: parsed goal ≡ input bytes for `: ` and bare `:` values — the green-T2/red-T1 pair proves the ban, not the parser, was the lossiness. **T3** (red today, inverse) wrapped-goal card → must FAIL with the wrap message; today it silently passes truncated. **T4** (stays red) `goal:foo` → FAIL missing goal. **T5** byte-parity top↔scaffold↔8 seeds. **T6** fixture load path green after re-pins. **T7** literal-match on rubric c3 and features-new bars (the [[deterministic-merge-check]] copy-as-literal-test precedent). **T8** (principal's T4, the conjunct-B prefix) parse a treatment card whose goal names `Provider finish_reason: error` → assert `goal.includes(PROVIDER_FINISH_REASON_ERROR)`; colon-free control → assert not. No existing test asserts the colon FAIL; nothing to invert.

**Remaining questions, separated.**

- **Testable:** whether the parser is lossless (T2, settled — green today); whether the ban is the lossiness (T1, red today); whether a wrap silently truncates (T3, settled); whether all surfaces moved together (T5/T6/T7); whether the goal can carry the runtime literal (T8).
- **Open-judgment (product-owner/steward, not resolvable here):** (1) retroactivity of EV-37's frozen lossy goal — new card vs. accepted historical record; (2) propagation to already-initialized consumer repos, which keep the false rule forever via non-clobbering scaffold with no `validate.py` override path (I2 — unbounded skew; no test settles whether that's acceptable); (3) whether an unrecorded second rationale for the old ban existed (retraction is safe only if not); (4) whether the "rephrase without a colon" secondary advice survives as optional guidance for goals that need not name a literal (I lean keep-as-secondary; copy tone, no test). I do not resolve these by fiat.

**Is the card's own goal a faithful oracle?** **Partially defective, and the run must route it — but the route already exists in writing.** Conjunct A is clean. Conjunct B has two defects: "the classification test" is referentially opaque (names no file — principal's point 8 is correct), and the judge→runtime equality it asserts is procedural, not code. Council.md step 10 prescribes the remedy for exactly this: "If the goal is ambiguous without context, that ambiguity is a defect in the card's `goal` text — fix the card, don't widen the judge's input." The card is `Deliberating`, so a goal amendment is legal under the goal-immutability rule (only post-`In Progress` edits force a new card). The referent is unambiguous in fact — the only classification assertion is `test/retry.test.ts` against `PROVIDER_FINISH_REASON_ERROR` (`extensions/retry.ts:78`, verified). So: amend FLLWUP-43's goal while still `Deliberating` to name that file and constant, and record conjunct B's eval-level residual explicitly in the card's record. That is routing, not papering over — leaving the opaque phrase in place for this card's own judge would be the card committing the defect it fixes.

## Tradeoffs accepted

- Adding the bare-line FAIL is the one place I expand beyond the minimum a strict reading of the goal requires — justified because shipping a "byte for byte" contract next to a silent truncation path reproduces EV-37's class; cost is one extra branch and one extra test.
- We accept unbounded rule skew in already-initialized consumer repos (no `validate.py` override mechanism) rather than inventing one this card — flagged as open-judgment item (2), not silently absorbed.
- Cosmetic: council copy will contain `: ` sequences; the uniform no-colon aesthetic is gone.

## Testable claims

- **"The ban, not the parser, is the lossiness"** — T2 green today while T1 is red; settled by execution, and it pins the parser against anyone who "fixes" this by adding a quoting layer.
- **"A wrapped goal silently truncates today and must FAIL after"** — T3 red in the inverse sense today (silent green), green-as-FAIL after; this settles reconciliation (a) without prose.
- **"All five-plus surfaces moved together"** — T5/T6/T7 fail on any partial edit, including a stale rubric or a stale features-new bar.
- **"The goal can carry the runtime literal"** — T8 treatment/control pair; the residual judge-hop span is *not* code-testable and is recorded as eval-level rather than claimed green.

---

#### principal (job-3.5)

## Cross-seam reading — what the contract actually is, right now

**The parse.** `council/validate.py:59-60` is `key, value = line.split(": ", 1)` then `value.strip()`. So the value is *everything after the first `: ` of the line*, whitespace-trimmed at the edges. A colon-space *inside* the value is preserved. This is the same in all ten copies I verified by grep: root, `council/scaffold/council/validate.py`, and the eight seed copies (`board-create-card, council, council-runner, features-deliver, features-new, owner, wiki-ingest, wiki-lint`) — identical text at `:8-9` and `:124` in each. `_template.md` line 7 is also identical in all ten copies.

**The gate.** `validate.py:121-124` FAILs when `": " in goal`. It is a substring test on the *parsed value*, so it cannot distinguish a legal colon from a parse break. The docstring at `:8-9` and the `parse_frontmatter` docstring at `:49` ("stopping at a value truncation") assert a truncation the parser does not perform for a single-line value. Owner's core claim is correct, and I re-derived it from the split rather than from any seat's report.

**The real truncation.** `validate.py:61-63` — `elif line.strip(): break`. A goal wrapped onto a second line terminates frontmatter; the goal silently becomes its first line. Nothing FAILs. This is the only lossy path in the field, and the rule is aimed at the wrong character.

**The judge hop.** `council/procedures/council.md` step 10 hands the judge "the card's `goal` and the Skeptic's evidence — nothing else"; `council/agents/judge.md` `<when_invoked>` confirms. **There is no engine code in that hop.** `grep goal extensions/` returns exactly one hit, `runs.ts:10`, and it is a comment. In the eval harness the judge's input is a static file read verbatim (`eval-runner.ts:557-558`). So the goal→judge transfer is LLM transcription by instruction, not code — **and I am correcting my own round-1 claim that this hop is "lossless by construction." It is lossless by *instruction* only.** That correction is load-bearing for conjunct (B).

**The authority on the literal.** `test/retry.test.ts` (~`:142-187`) derives `emitted` from pi's installed bundle's `mapStopReason` template and asserts `PROVIDER_FINISH_REASON_ERROR === emitted` (`extensions/retry.ts:78`). `test/ev40-parent-retry.test.ts:6` calls these "every classification test." That is the referent of "the classification test."

**The eval surface.** `board-create-card/rubric.json:18` (`c3`) grades "a testable goal **with no colon-space sequence**." `sha256Tree`/digest verification covers `seedDir` only (`eval-fixtures.ts:494,681-685`) — **`rubric.json` is outside the digest.** And `eval-runner.ts:128,134` key Result/Verdict records on `fixtureVersion`+`rubricVersion`, with `atomicWriteTuple` (`:139-152`) *throwing* on a divergent payload under the same tuple.

## Blind spots, named separately

- **owner (data/validator slice):** sees the parser is lossless and sees the missing colon as the lossiness — correct — but models the goal→judge hop as "no consumer exists, therefore no risk." A hop with no *code* is not a hop with no risk; it is a hop with no *gate*. It cannot see that conjunct (B) is therefore unprovable by any file it plans to edit.
- **designer (render/comprehension slice):** reasons about the signifier and the author's mental model — genuinely the right frame — but takes the validator's own docstring and FAIL message as the parser's truth. Its premise "the copy is parser-truthful" is false against `:59`; it never opened the split. It also treats "which lossless syntax" as open taste when the parser admits exactly one form.
- **My own (seam) slice's blind spot, to name it:** I was looking for a seam *test* to span card→judge, and there is none to write — the hop is an LLM turn. I over-claimed in round 1 and correct it here.

## Reframe

The card's sentence has two conjuncts of different kinds, and one of them has no code seam at all:

- **(A)** "a goal can name a colon-space literal without truncating" — a write-seam change: delete the FAIL, retract the false copy. Owner is right.
- **(B)** "the judge reads the same string the classification test asserts" — a property over a hop that is *LLM transcription*. The strongest engine-provable form is **card-file → `parse_frontmatter` → the bundle-derived literal** (transitive, because `test/retry.test.ts` already binds the constant to pi's bundle). The literal "judge reads" step is not engine-testable; it is authoring/facilitation discipline plus one eval fixture.

Deleting the FAIL is **sufficient for (A)** and **necessary-but-not-sufficient for (B)**. And owner's design contains one claim of the exact class this card is about: "a wrapped two-line goal must equally FAIL" is false under the design owner proposes — the wrap silently yields its first line and `validate.py` exits 0.

## 1. Owner's claims, adjudicated

| Claim | Verdict |
|---|---|
| Parser is already lossless for embedded `: `; the ban is the lossiness | **Agree**, from `:59`. |
| "byte for byte" | **Agree with correction:** it is `line.split(": ", 1)` + `.strip()` (`:59-60`), so edge whitespace is trimmed. The replacement copy must not say "byte for byte" or we swap one false parser model for another, smaller one. |
| Delete the FAIL; no quoting, no escaping, no block scalar | **Agree.** Quoting is not a form — `goal: "a: b"` yields `"a: b"` *including quote characters*; there is no unquote step anywhere. Block scalar requires a parser rewrite. There is exactly one supported form. |
| No engine code consumes the goal | **Agree** (`runs.ts:10` only). |
| Five surfaces move together; seeds re-pin in the same change | **Agree**, and the card's own step 1 names the seeds, so this is not a widening. |
| **T4: "a wrapped two-line goal must equally FAIL"** | **Disagree — factually wrong.** `goal: first part\n second part` parses to `"first part"`; `goal` is present; validate exits 0. Owner's design neither fails it nor gates it. This must be stated as an explicit, documented residual, not asserted as a FAIL. |
| File list completeness | **Correct to add:** bump `fixtureVersion` on the 8 fixtures and `rubricVersion` on `board-create-card/rubric.json`. Because the store key (`eval-runner.ts:128,134`) does not include seed content, editing seeds under an unchanged `fixtureVersion` makes a re-run throw `divergent payload already stored for this key tuple` (`:152`). Re-pinning the digest is not enough. |
| `engineering-board.md` is a "Yes" change | **Correct with correction:** council.md step 14 forbids the facilitator hand-editing `vault/`; that correction routes through `/wiki-ingest`. |

**Where owner is sufficient:** conjunct (A) in full; the authoring-layer lossiness that produced EV-37's colon-free goal; and, once the version bumps are added, the seed/rubric surfaces.
**Where owner is not:** conjunct (B) as an unqualified sentence; and the newline residual, which owner's copy names but owner's T4 mis-states.

## 2a. Wrapped/continued-line truncation — in scope?

**Out of scope for this card's `goal`; explicitly declared; carded at step 13.** Grounds, not preference:

- The goal sentence's subject is "an exact literal that **contains a colon-space sequence**." The wrap is a different mechanism; the goal text does not name it.
- The natural alternative — a new writer FAIL aimed at the newline — is what [[gate-parity]] forbids: the parser silently truncates, there is no downstream gate that is that strict, and the doctrine's answer is "teach at the surface; don't gate at persistence." So retargeting the FAIL is not the gate-parity-consistent fix; **deleting it is.**
- council.md step 13 is this repo's native mechanism for "surfaced but not done." A real defect discovered here with no gate belongs there.
- Condition on "out": the new copy must be *true*. It must say the value ends at a line break, must not claim truncation-proofness, and the design record must name the residual. A documented silent truncation is acceptable; an undocumented one is the defect class recursing.

## 2b. Seeds+digests, rubric `c3`, `features-new.md` — judged against the goal and the scope rules

- **8 seeds + `treeDigest` re-pins: yes, same change.** The card's step 1 explicitly includes "the eval fixture seeds carry pinned copies." AGENTS.md #5 makes the digest the load mechanism, not a scope question. **Add:** `fixtureVersion` bump on the 8 (`1.0.0` → next) or the next `/council-eval` run throws on the divergent store key.
- **`features-new.md:54,57,75`: yes.** Not a widening: the card's Intent says the fix is "owed before the next autonomous run," and `/features-new` is that run's card-authoring entry point. Leaving the bars stale means the capability the goal asserts stays refused on the autonomous path. No digest impact — procedures resolve from `PKG_ROOT`, and no procedure file lives in any `seed/`.
- **`board-create-card/rubric.json c3`: yes.** It is the shipped *expression* of the retracted rule inside the eval that grades `board-create-card`; left alone, the eval penalizes conforming goals and the digest doesn't catch it. **Add:** bump `rubricVersion` for the same divergent-store-key reason. Note the positive: `c3` is the only in-repo surface that exercises the judge-input hop, which is why it matters beyond copy hygiene.

## 3. One converged design

**Rule.** `goal` is one physical line. Its value is everything after the first `: ` of that line, trimmed by `parse_frontmatter`. Colons, quotes, backslashes are literal characters. A line break ends the value (and the frontmatter). No quoting, no unquoting, no block scalar.

**Files (one change, all together).**
1. `council/validate.py` — delete `:121-124`; fix the docstring bullets `:8-9` and `parse_frontmatter`'s `:49`.
2. `council/scaffold/council/validate.py` — byte-identical.
3. 8× `council/fixtures/{board-create-card,council,council-runner,features-deliver,features-new,owner,wiki-ingest,wiki-lint}/seed/council/validate.py` — byte-identical.
4. `_template.md` goal line: root + scaffold + the same 8 seeds.
5. `council/procedures/board-create-card.md` §3 Hard-failure-mode paragraph.
6. `council/procedures/features-new.md:54,57,75`.
7. `council/fixtures/board-create-card/rubric.json` `c3` prompt + `rubricVersion` bump.
8. 8× `fixture.json` — new `treeDigest` + `fixtureVersion` bump.
9. Wiki correction via `/wiki-ingest` at step 14 (`engineering-board.md:30-32` false truncation claim; `retry-classification.md:53` describes the ban as current).

**Copy.**
- `_template.md`: `goal: One testable sentence stating what done means. Keep it on one line — everything after "goal: " is the goal as written; a literal may contain ": " because the judge reads this line, so spell real message strings with their exact characters.`
- `board-create-card.md` §3: state the true contract; name the oracle ("this sentence is the judge's only input"); state that a line break ends the value and is **not** currently gated; drop "rephrase without a colon" as *mechanism* (keep only as optional style).
- `features-new.md`: each bar → "single-line, literal-exact goal (colons allowed in the value)."

**Red-first tests.**
- **T1 (red today):** temp council tree, card whose goal contains `Provider finish_reason: error` → `python3 council/validate.py` exit 0. Today exit 1, `FAIL: … colon-space sequence (value truncates)`.
- **T2 (green today, pins the parser):** `parse_frontmatter` on single-line values with `: ` and with a bare colon returns the inner text (modulo `.strip()`).
- **T3 (the honest conjunct (B)):** a test that writes a card, parses it, and asserts the goal equals `PROVIDER_FINISH_REASON_ERROR` — which `test/retry.test.ts` already binds byte-for-byte to pi's bundle template. Red today only at the validate step.
- **T4 (parity guard):** byte-equality of `validate.py` and `_template.md` across root/scaffold/8 seeds; digest verification via `test/fixtures.test.ts`.
- **T5 (residual pin):** assert a two-line goal parses to its first line and validate exits 0 — converting an undocumented hazard into a documented one so it cannot be "fixed" silently.
- **T6 (negative survives):** `goal:no-space` → `missing required key 'goal'`.
- **T7 (version discipline):** after the seed edit, `loadFixture` digest passes; a re-write under an unchanged `fixtureVersion` throws the divergent-tuple error (`eval-runner.ts:152`).

## 4. Remaining questions

**Testable (a run settles):** T1–T7 above; the wrapped-goal behavior (T5); the literal text of `rubric.json c3` and the three `features-new.md` bars (literal-match tests, per the deterministic-merge-check precedent); the 10-copy parity; the fact that the goal text names no file.

**Open-judgment (no test settles — `product-owner`/`steward`):** whether the wrapped-line truncation's *follow-up card* is promoted (§13 filing is mechanical; its priority is not); whether keeping "rephrase" advice is acceptable; acceptance of the propagation gap (already-initialized consumer repos keep the old `validate.py` forever — non-clobbering scaffold, no override path); whether to amend the card's own goal (below).

## 5. My round-1 point 8 — stated as fact

1. **Fact:** the card's `goal` names no file; the phrase "the classification test" appears once, in `council/cards/FLLWUP-43.md:7`.
2. **Fact:** in-repo that phrase denotes the retry-classification tests — `test/retry.test.ts`'s `classifyRetry` suite and its bundle-derived literal regression, with `test/ev40-parent-retry.test.ts:6` using "classification test" for the same set. There is exactly one test that derives the literal from pi's bundle.
3. **Fact:** council.md step 10 states that a goal ambiguous without context "is a defect in the card's `goal` text" and forbids widening the judge's input; `judge.md`'s `<when_invoked>` gives the judge the goal and the Skeptic's evidence only.
4. **Fact:** goal-wording authority rests with `steward`, and an in-place amendment is legal while the card is `Deliberating` ([[engineering-board]]).
5. **Therefore:** it is resolvable from the Intent for a reader of the whole card, and **not** resolvable for the judge — and the procedure's own rule makes the judge's view the deciding one. It is a card-goal defect, and it is the card committing the exact defect class it exists to fix. Routing: `steward`, not any seat's edit. Severity is low because the referent is uniquely determined and step 9's evidence will name it; the cheap correct remedy is a `steward` amendment naming `test/retry.test.ts`, and if the steward declines, the residual should be recorded rather than papered over.

## Testable claims

- **"Owner's T4 is false":** `printf -- '---\nid: X-1\ngoal: first part\n second part\n---\n'` written to a temp card, then `python3 council/validate.py` — predict exit 0 with `goal` present. Settles the wrapped-line question as fact, and falsifies owner's parenthetical.
- **"The judge hop has no code seam":** `grep -rn goal extensions/` → one comment hit (`runs.ts:10`); `eval-runner.ts:557-558` reads the judge fixture's `input.md` verbatim. Settles whether a card→judge seam test is constructible (it is not).
- **"The store key ignores seed content":** edit a seed without bumping `fixtureVersion`, re-run the cell → predict the throw at `eval-runner.ts:152`. Settles the version-bump obligation as runnable.
- **"The rubric is outside the digest":** `sha256Tree(seedDir)` (`:494,681`) vs `rubric.json` living at the task dir — a rubric edit needs no re-pin; a seed edit does. Settles the two surfaces' different disciplines.

Cited wiki: [[engineering-board]] (goal-as-oracle, goal-immutability + steward wording authority — and its `:30-32` false truncation claim), [[gate-parity]] (writer ⊆ loader ∪ dispatch; teach at the surface), [[retry-classification]] (the literal's authority), [[deterministic-merge-check]] (copy rulings enforced as literal-string tests), [[eval-store-contract]] (version-keyed records). Wiki gaps: no page states `parse_frontmatter`'s split semantics — `engineering-board` mis-states them — and no page covers the seed-follows-shipped `fixtureVersion` policy.

---

#### designer (job-3.6)

I have read the card, the three round-1 positions, and the actual artifact (validate.py, _template.md, board-create-card.md, features-new.md, rubric.json, judge/input.md, engineering-board.md, gate-parity.md, EV-37.md, retry.ts). I am grounding my round-2 position in those reads, not in memory of the round-1 positions.

---

**Design position**

The validator's parser is already lossless for single-line values — `validate.py:55-56` does `line.split(": ", 1)` and reads the rest of the line byte-exact. The defect is the FAIL block at `:124` and the truncation claim repeated in the module docstring (`:8-9`), the `parse_frontmatter` docstring (`:46`), `board-create-card.md:43-44`, `features-new.md:49/57/75`, and `rubric.json:c3`. Delete the FAIL; correct the docstrings to name both the lossless contract *and* the oracle principle; drop "rephrase without a colon" permanently; update the template sentence so it carries the oracle principle, not just the lossless contract; update `features-new.md` and `rubric.json` in lockstep with the validator change. The wrapped-line truncation at `:60-65` (the silent path the current rule misses) is in scope per the goal's "without truncating"; the *policy* on wraps is product-owner territory.

**Gulf closed**

Gulf of Evaluation, for the author at the moment they fill in `goal:`. Today the author has no signal that their goal's misspelled literal is the literal their code will be matched against; the validator stays silent on a misspelling, the judge reads the misspelling, and the failure surfaces only as a dead runtime branch. The new template sentence + procedure paragraph close this gulf *only if* the template carries the oracle principle, not just the lossless contract — and only if the "rephrase without a colon" escape hatch is removed.

**Principle and evidence**

- **Signifier, in the wrong place today.** `council/cards/_template.md:5` says "No colon-space sequence anywhere in this value" — a *parser* signifier on a field whose purpose is a *judge-readable oracle*. Verified by reading the file. The author who obeys it learns only "don't truncate," not "the goal is the literal your code will be tested against." EV-37's author obeyed the parser signifier (`EV-37.md:7` spells `Provider finish_reason error` without the colon) and missed the oracle (`extensions/retry.ts:78` declares `"Provider finish_reason: error"`). The failure mode is documented in `vault/wiki/engineering-board.md` — "a goal forced to misspell a literal is a goal that lies" — but the wiki principle never reached the template.
- **Conceptual model, missing.** The author needs "goal = the literal the judge tests against." `board-create-card.md` paragraph 2 in owner's proposed rewrite states it explicitly ("The goal the judge reads is exactly the text you wrote, so spell any literal precisely as the system emits it, colons and all; a colon-less paraphrase of a real message string is the one hard failure mode here (EV-37 shipped a dead branch that way)"). I read this in owner's round-1 dispatch. **This paragraph closes the oracle gulf.** It should land as-is.
- **Forcing function, relocated.** Today's forcing function lives at the validator and refuses `: ` — wrong location, because the wrong-branch behavior is *misspelling*, not a forbidden character. The new FAIL message (or its absence, if we just delete the block) lets the author type the literal; the procedure paragraph teaches them they must. The "Falsifiable" / "Not satisfiable by a stub" bullets in `board-create-card.md:38-42` are unaffected — they govern *kind of sentence*, not *characters*.
- **Knowledge in the world, earned.** The EV-37 reference in the procedure paragraph is the kind of knowledge an author would otherwise have to have learned by shipping a dead branch. Cited concretely, it puts the lesson on the screen at the moment it applies.

**On each load-bearing claim from the other two seats**

*Owner (job-3.1):*

1. **"The actual mechanism — there is no truncation"** — **AGREE.** Verified: `validate.py:55` is `if ": " in line: key, value = line.split(": ", 1)` — splits at the first occurrence. The docstring at `:46` says "stopping at a value truncation"; the code says "split at first colon-space." The claim and the implementation disagree. EV-37's goal parses losslessly even today — I grep-confirmed that `EV-37.md:7` contains no `: ` and would still parse losslessly with one.
2. **Plain-line, no quoting/escaping/block scalar** — **AGREE.** Plain-line is what the parser already does, what the judge already reads raw, and what the template already requires. Adding a quoted/escaped/block form reintroduces a decode step between file bytes and judge input — exactly the class of lossy-oracle hazard principal named. Owner's reasoning on (b) and (c) is correct.
3. **Scope: `features-new.md` and `rubric.json` must change** — **AGREE.** Verified: `features-new.md:49` and `:57` carry "no colon-space sequence" as a wave-1 bar; `:75` carries it as a skeptic attack. `rubric.json:c3` prompt grades "a testable goal with no colon-space sequence." If the validator stops forbidding it, the rubric silently grades against a superseded rule. Not digest-pinned, not red-tested — silent staleness, the most expensive kind.
4. **Re-pinning the 8 fixture digests in the same change** — **AGREE-WITH-A-CORRECTION.** The mechanism is real (`eval-fixtures.ts:684` throws on `treeDigest` mismatch — owner's citation, I didn't open it in this turn). But this is *engineer* territory, not design. The design question owner raises — "re-pin vs. drop the seeds" — is settled by [[gate-parity]]'s corollary (if the surface changes, the seed must track it) plus the wiki's stated seed-follows-shipped intent. I have no design objection; the judgment is owner's.
5. **Scaffold/seed byte-parity for `validate.py` and `_template.md`** — **AGREE.** Grep confirmed: 8 fixture seeds carry the same colon FAIL and same docstring. Stale seeds = fixture trains/grades against a rule the shipped repo doesn't enforce. This is the EV-37 class of artifact-vs-intake drift.

*Principal (job-3.2):*

6. **Reframe: oracle hazard, not parser hazard** — **AGREE.** This is what I argued in round 1. The validator's `value truncates` claim points at the wrong artifact. The hazard class is "goal lies about the literal," and no parser change fixes that — only the copy teaches the author to spell the literal.
7. **Conjunct (B) of the goal sentence — proof obligation across a seam with no code in it** — **AGREE.** No edit to `validate.py` proves "the judge reads the same string the classification test asserts." The proof needs a fixture-grade test asserting byte-identity between the parsed goal and the bundle-derived literal — principal's T4 shape is correct. This is the test that *closes the card*, and it must be in the deliverable.
8. **Wrapped-line truncation at `validate.py:60-65`** — **AGREE.** Verified by reading `:55-65`. The `elif line.strip(): break` ends frontmatter on any bare non-`key: value` line — a wrapped goal silently loses its continuation. This is the actual silent-truncation path, unguarded by the current rule. The *policy* (forbid wraps vs. support continuation) is open-judgment; the *fact* that it exists is settled by execution.
9. **I1–I6 invariants** — **AGREE.** I2 (no override resolution for `validate.py`; non-clobbering scaffold means existing consumer repos keep the false rule forever) is the strongest *propagation* concern but is out of design scope — escalate to product-owner if anyone thinks the propagation gap is a defect.

**On owner's proposed copy vs. my round-1 principle**

My round-1 principle: *the goal is the only thing the judge reads; name the exact literal*.

Owner's proposed `_template.md` sentence:
> `goal: One testable sentence stating what done means. Written on a single line; the text after "goal: " is the goal byte for byte, colons included.`

**Partial close.** It names the lossless contract but not the oracle principle. The author who reads this learns they *can* include `: ` — they do not learn they *must spell* the literal their code will be matched against. The oracle gulf is still open.

Owner's proposed `board-create-card.md:42-47` replacement paragraph:
> `The frontmatter parser takes everything after the first ': ' of the line as the value, byte for byte — a colon-space inside the value does not truncate or re-encode anything. The goal the judge reads is exactly the text you wrote, so spell any literal precisely as the system emits it, colons and all; a colon-less paraphrase of a real message string is the one hard failure mode here (EV-37 shipped a dead branch that way).`

**Full close.** "The goal the judge reads is exactly the text you wrote" states the oracle principle. "Spell any literal precisely as the system emits it, colons and all" is the instruction. "A colon-less paraphrase of a real message string is the one hard failure mode here" names the failure class. This paragraph is the right shape.

**Exact replacement wording for the template sentence** (so the oracle principle lands at the authoring screen, not just in the procedure):

> `goal: One testable sentence stating what done means — the goal the judge reads is the exact text you write here, so spell any literal (a log message, an error string, a constant) precisely as the system emits it. Written on a single line; everything after "goal: " is the goal byte for byte, colons included.`

That single sentence closes both gulfs at the moment the author reads it.

**On the docstring (`validate.py:8-9` and `:46`)**

In round 1 I said "do not change the module docstring — it is parser-truthful." I was wrong: the module docstring at `:8-9` contains the same false truncation claim the FAIL message propagates, and the `parse_frontmatter` docstring at `:46` says "stopping at a value truncation." Owner is right to change both. Correction noted; my round-1 "do not change" list shrinks.

For the *content* of the docstring change: if owner simply replaces the truncation claim with the lossless contract, future engineers will read "parser is lossless" and stop there — repeating my round-1 error. The docstring should also state the oracle principle: "the goal value is the judge's only oracle for the literal the implementation is tested against; spell literals exactly as the system emits them." Not user-facing copy, but it is what the next engineer reads first.

**Open-judgment question I flagged in round 1: keep "rephrase without a colon" as a fallback?**

**Drop it permanently.** This is a design recommendation with a comprehension consequence.

The clause is the bug. The whole point of the fix is to make the author *not* rephrase. Keeping "rephrase without a colon" as a documented fallback tells the author that paraphrasing a colon-space literal is an acceptable workaround — which is the exact behavior EV-37 demonstrated, and the exact class of behavior we are closing. The author's comprehension becomes: "I can spell the literal verbatim, or I can paraphrase." The first is the oracle-safe path; the second is the oracle-unsafe path. Listing both as acceptable is the comprehension failure.

The case for keeping it (paraphrasing is appropriate when no literal exists, e.g., "the endpoint exists and returns 200 for the listed routes" — no colon-space anywhere, no oracle hazard) is already covered by silence: if the goal doesn't name a literal, there is no `: ` to escape, and the author simply writes the sentence. The clause is needed only when a literal *is* named, and in that case the literal must be spelled. So the clause is never useful; it is always the wrong suggestion.

Comprehension consequence: a goal that names a literal must spell the literal; a goal that doesn't name a literal can be written as plain English. The author's mental model becomes "if I'm naming something real, I name it exactly." There is no longer a "workaround" tier.

**Settlable?** The comprehension question — does listing "rephrase without a colon" cause authors to paraphrase literals they should spell? — is testable by a cold-read authoring test: present an author with the new template + procedure, given a goal whose judged literal must contain `: `, and measure whether they write verbatim or paraphrase. But the *judgment* of which path is right is product-owner territory; a test can settle comprehension, not policy. I'd flag this as **design recommendation with a test that could falsify the recommendation's premise**, not as something a test picks the winner on.

**Remaining questions, by who settles them**

- **Engineer-settled**: scaffold/seed byte-parity; re-pinning 8 fixture digests in the same change; deleting the FAIL block; correcting the docstrings; the wrapped-line truncation at `:60-65` exists (fact) and a *testable policy* governs it.
- **Product-owner-settled**: retroactivity for EV-37's frozen goal (new card vs. accept the lossy record); propagation to existing initialized consumer repos (non-clobbering scaffold leaves them on the old rule, unbounded skew); whether to forbid wraps outright or support continuation; whether the lossless form is plain-line-only (owner argues yes; principal argues open by construction — the goal's "without truncating" is consistent with all three forms but does not name which).
- **No test settles**: which is the right lossless form for an *unrecorded* second rationale behind the current rule (defense against a hypothetical future YAML consumer). Principal named this; I have nothing to add.

**Falsifiable predictions**

- **P1 (oracle principle at authoring).** A cold-read author given *only* the new template sentence (my replacement wording above) and the procedure paragraph writes the literal `Provider finish_reason: error` (with colon) on the first try when given a goal whose judged literal must contain `: `. Falsifier: the author rewrites without the colon. *The smoke is a cold-read authoring test, not a CDP assertion* — the artifact is author comprehension of static text, not rendered layout.
- **P2 (lossless seam).** A pure-seam test: `parse_frontmatter("---\ngoal: Provider finish_reason: error\n---")["goal"] === "Provider finish_reason: error"` — green before the change (this is the proof that the ban, not the parser, is the lossiness; owner and principal agree on this; I agree).
- **P3 (FAIL message and docstring corrected).** Grep of `validate.py` after the change: no occurrence of "truncates" or "truncation" in the goal parser or docstring; both module docstring and `parse_frontmatter` docstring contain the oracle principle.
- **P4 (rubric grades against the new rule).** `council/fixtures/board-create-card/rubric.json:c3` prompt is byte-identical to the new template sentence's oracle statement. Falsifier: a colon-spaced literal in a treatment arm's rubric would PASS c3 after the fix and FAIL c3 before the fix — this is the test that *closes the card's conjunct (B)* for the rubric surface.
- **P5 (procedure surfaces).** `board-create-card.md:42-47` and `features-new.md:49/54/57/75` no longer contain "colon-space sequence" or "no colon-space" — grep on `prepare_board-create-card.md` and `features-new.md` for the old phrasing, must return zero matches.
- **P6 (wrapped-line truncation, the real hazard).** A pure-seam test: `parse_frontmatter("---\ngoal: first part\n second part\n---")["goal"] === "first part"` (the second line is silently dropped today). Green today; the *policy* for what to do about it is product-owner, but the fact that it exists must be in the deliverable.

**Correction to my round-1 point 4 (copy I would NOT change)**

I said in round 1: "validate.py's module docstring — do not change." That was wrong. Verified by reading `validate.py:8-9`: the module docstring contains the false truncation claim. It is a comprehension surface for the next engineer, and the same false claim must be removed. My updated "do not change" list:

- The em-dash convention in `board-create-card.md` §6 (different parser, different failure mode — do not tie the two fixes).
- The state-column names and ordering (out of scope).
- The "one testable sentence" framing and the "Falsifiable" / "Not satisfiable by a stub" bullets in `board-create-card.md:36-42` (govern *kind of sentence*, not characters).
- The "Draft, then stop" gate and the human-approval rule in §5–7.

**On `features-new.md` and the fixture rubric as comprehension surfaces**

`features-new.md` is a comprehension surface for the LLM during wave-1 decomposition (the bars list at `:49` is what principal sees when slicing). Owner and I agree it must change in lockstep with the validator. The change there is mechanical (bars contain "no colon-space sequence" → "single-line literal-exact goal"), and the oracle principle should land there too: the bar should be "single-line goal that names any literal exactly as the system emits it."

The rubric `c3` is a comprehension surface for an LLM judge. **Critical change.** It is not digest-pinned (I verified: `seed.treeDigest` covers `council/*` under the seed, but `rubric.json` itself is sibling-of-fixture.json, not under the digest tree) and not red-tested. A stale rubric silently grades against a superseded rule — exactly the artifact-vs-intake drift the EV-37 closure ruling named. I would update it, and the update is in scope per the card's surface list expansion.

**Preferences, ranked last**

- I prefer the template sentence to carry the oracle principle inline rather than only pointing at the procedure paragraph. The template is the one-line gloss the author sees on their screen at the moment they fill in `goal:`; the procedure is what they read if they keep going. If only one surface carries the principle, the template is the better choice. Ranked last because this is taste about *placement*; the substance (the principle must land somewhere) is settled.
- I prefer naming EV-37 in the procedure paragraph over abstract phrasing ("a previous run shipped a dead branch this way"). The concrete reference earns the lesson the way the wiki's `engineering-board.md` names it. Ranked last because this is taste about *how* to teach; the teaching must happen is settled.

### Step 4 — Skeptic attacks and runs tests (job-3.7)

Dispatch: `skeptic` job-3.7 (25-min ceiling; settled 1.7m / 12 turns, total 552731 tok, cost≈$0.2210). Subject: the deliberation record on this card (rounds 1–2) at main `89da7dc`, read-only — no branch or PR exists. Frame: step 4 of the deliberation, before step 5 synthesis and steps 7–11. Every test below was actually executed; scratch trees under `/tmp/skep`. Verdict: **`blocks` — two specific reds.**

## Skeptic report — FLLWUP-43 deliberation record (step 4, no branch/PR)

All tests below were actually executed on the main checkout (`main`, clean — `git status --porcelain` empty apart from branch line). Scratch trees lived only under `/tmp/skep`.

### Objection table

| # | Claim attacked | Term | Real command run | Real output |
|---|---|---|---|---|
| 1a | `parse_frontmatter` is lossless for single-line `goal` with `: ` and bare `:` | `closed-green` | `python3 - <<EOF` importing `council/validate.py::parse_frontmatter`; asserted `goal: Retry when the message says Rate limited: try again later` round-trips; `goal: a:b` round-trips | `T1 parsed: 'Retry when the message says Rate limited: try again later'` / `T1 lossless: True`; `Tbare: 'a:b'` — claim holds |
| 1b | Value is "byte for byte" (owner r1/r2, designer template copy) | `closed-red` | Same harness: `goal:␣␣␣padded value with space␣␣␣` | `Tstrip: 'padded value with space' stripped: True` — edges are `.strip()`-ed (`validate.py:60`), so "byte for byte" is false as written. Principal r2's correction stands; owner/designer copy must say "trimmed" not "byte for byte" |
| 2 | Colon-space goal FAILs pre-fix; deleting only the `": " in goal` block flips green, parser untouched | `closed-green` | Built `/tmp/skep/t1` (board + `EV-99.md` with `Provider finish_reason: error` + copy of `validate.py`); `subprocess.run(["python3","/tmp/skep/t1/council/validate.py"])`; then patched copy removing only the 3-line check block, re-ran | Pre: `exit: 1` / `FAIL: EV-99: goal contains a colon-space sequence (value truncates)`. Post-delete-only: `All council artifacts valid`, `flip exit: 0` — the ban, not the parser, is the lossiness |
| 3 | Wrapped-line path + the owner/principal dispute | `closed-green` for principal, `closed-red` for owner's parenthetical | `/tmp/skep/twrap` card `goal: first part\n second part`; ran its `validate.py` copy; printed `parse_frontmatter` result | `wrap exit: 0` / `All council artifacts valid`; `wrap parsed goal: 'first part'` — principal r2 ("silently passes, neither fails nor gates") is fact; owner r1-T4/r2 ("a wrapped two-line goal must equally FAIL") is **refuted** under the proposed design: no FAIL exists. Owner r2's new wrap-FAIL is a *proposal*, not current behavior |
| 4 | All ten `validate.py` + all ten `_template.md` byte-identical | `closed-green` | `sha256sum council/validate.py council/scaffold/council/validate.py council/fixtures/*/seed/council/validate.py` (same for `_template.md`) | All 10 `validate.py` → `0fc61062…`; all 10 `_template.md` → `86df3934…` — holds |
| 5a | `rubric.json` c3 contains "no colon-space sequence" | `closed-green` | `python3 -c` dump of `council/fixtures/board-create-card/rubric.json` c3 | `"a testable goal with no colon-space sequence"` verbatim; `rubricVersion: 1.0.0` — holds |
| 5b | `rubric.json` outside pinned `seed.treeDigest` | `closed-green` | `sed -n '494,510p;680,688p' extensions/eval-fixtures.ts` + `ls council/fixtures/board-create-card[/seed]` + `fixture.json` seed block | `sha256Tree(seedDir)` + verify only `source==="packaged"` on `seedDir`; `rubric.json` is a sibling of `fixture.json`, not under `seed/` — a rubric edit needs no re-pin, a seed edit does. Holds |
| 6 | `features-new.md` carries the bar (~54/57/75) | `closed-green` | `grep -n "colon-space\|colon" council/procedures/features-new.md` | Lines `54`, `57`, `75` hit (designer's "49" is off by ~5 lines; substance holds) |
| 7 | Version-bump obligation: store keyed on versions; unchanged-version re-run throws divergent-payload | `closed-green` (mechanism executed; matrix-level composition code-read) | Code: `eval-runner.ts:128,134` key, `:139-152` throw, `:592-593,612-613,652` version plumbing. Executed: `bun /tmp/skep/divtest.ts` calling exported `writeResultRecord` twice same-key/different-payload, then same-payload | `first write ok` → `second write threw: …divergent payload already stored for this key tuple (defect, not a re-write)` → `same-payload rewrite ok (no-op)`. Filename key contains only versions, no content hash — so a seed edit under unchanged `fixtureVersion` reuses the tuple and the *next differing write* throws. Full `/council-eval` re-run not executed (needs harness); the throw primitive it rests on is green |
| 8 | No engine code consumes `goal`; judge hop procedural, no code in span | `closed-green` (one line-citation qualified) | `grep -rn "goal" extensions/*.ts`; `grep -n "goal.*judge\|judge.*goal\|nothing else\|widen" council/procedures/council.md`; `resolveDriver` read | Sole `goal` hit is the `runs.ts:10` comment. `council.md:270-276`: judge gets "the card's `goal` and the Skeptic's evidence… nothing else"; ambiguity is "a defect in the card's `goal` text". `resolveDriver` reads fixture `inputFile` verbatim. Qualifier: principal's pinpoint `eval-runner.ts:557-558` line numbers not re-confirmed (file layout differs at my offset); the no-code-in-span substance is confirmed |
| 9 | Card→`parse_frontmatter`→bundle-literal test constructible; "judge reads" step engine-testable | `closed-green` | `python3` treatment/control `includes("Provider finish_reason: error")` check; `bun test test/retry.test.ts -t "byte-for-byte"` | Treatment parses with literal `True`, colon-free control `True` (sensitive pair). Bundle test: `1 pass / 0 fail` (`PROVIDER_FINISH_REASON_ERROR matches pi's emitted message byte-for-byte`). The `parse→literal` prefix is constructible; the literal judge-reads step has no code seam (see #8) — principal's corrected "instruction-only, not construction" holds |
| 10 | Card goal names no file; only in-repo bundle-deriving test is in `retry.test.ts` | `closed-green` (under derive-vs-use) | `sed -n 1,10p FLLWUP-43.md`; `grep -rn "classification test" council/cards/ test/ extensions/`; `grep -rln "dist.*bundle\|findTemplateFiles" test/*.ts`; usage-vs-derivation grep | Goal (line 7) says "the classification test", names no file — holds. Many files *use* the literal, but only `test/retry.test.ts` (plus `env-split-contract`, which binds package identity, not the literal) reads pi's `dist/bundle` to *derive* it (`findTemplateFiles` + `errorMessage:\`Provider finish_reason: ${reason}\`` match). `ev41` asserts the constant against a string literal (`toBe("Provider finish_reason: error")`), i.e. uses, not derives. Holds under that distinction |
| D1 | Plain-line needs no quoting/escaping/block scalar; no unquote step exists | `closed-green` | `parse_frontmatter('goal: "a: b"')`; `grep -rni "unquote\|unescape\|stripquotes" extensions/ council/validate.py council/procedures/` | `Tquote: '"a: b"'` — quotes preserved literally, no decode. `NO unquote hits` — holds |
| D2 | Negative contract survives (`goal:foo` still FAILs) | `closed-green` | `/tmp/skep/tneg` card with `goal:no-space-after-key`; ran its `validate.py` | `FAIL: EV-97: missing required key 'goal'`, exit 1 — holds |

### Open-untested / no-test-settles

- **Nothing assigned `open-untested`**: every falsifiable objection above was run.
- **No test settles** (open-judgment, correctly routed to product-owner/steward, not decidable here): (i) wrap *policy* — forbid/FAIL vs. support continuation vs. document-and-card-follow-up (fact of silent truncation is settled; what to do is not); (ii) retroactivity of EV-37's frozen goal; (iii) propagation skew to already-initialized consumer repos (non-clobbering scaffold, no `validate.py` override path); (iv) keep-vs-drop "rephrase without a colon" as secondary advice; (v) designer's P1 cold-read authoring comprehension — needs human subjects, not a repo gate; (vi) full-matrix divergent re-run end-to-end (throw primitive green; composition code-read).

### Verdict: `blocks` — two specific reds

1. **"Byte for byte" copy is false** (owner r1 §2/r2 converged rule; designer template sentence): `value.strip()` trims edges. Required amendment before synthesis: contract must read "everything after the first `: `, edge-whitespace-trimmed" (or equivalent), in `validate.py` docstrings, `_template.md`, and both procedure paragraphs.
2. **Owner's "(A wrapped two-line goal must equally FAIL)" is false** under the proposed plain-line design (run: exit 0, silent truncation to first line). Synthesis must either adopt owner's r2 wrap-FAIL addition explicitly (new gate, new test) or principal's r2 out-of-scope-with-documented-residual + step-13 card — it may not carry the sentence as if the design already fails wraps.

I raise no other objection: parser-losslessness, pre-fix red/delete-only green, 10-copy parity, rubric/features-new surfaces, digest scope, version-keyed divergent throw, no-engine-consumer, constructible parse→literal prefix with non-testable judge-reads step, goal opacity, and no-unquote all verified green as stated (with the noted line-number and composition qualifiers).

### Step 5 — Consolidator synthesis (job-3.8, verbatim)

Dispatch: `consolidator` job-3.8 (15-min ceiling; settled 7.7m / 3 turns, total 65680 tok, cost≈$0.0705). Given the full record on this card.

# FLLWUP-43 — Consolidator synthesis (step 5)

Read in full: frontmatter (`goal`, `Intent`), Step 1 classification, Step 2 round-1 (owner/​principal/​designer), Step 3 round-2 (owner/​principal/​designer), Step 4 Skeptic (objection table, open-untested list, `blocks` verdict). No re-deliberation; no new evidence fetched. Cited wiki pages used by the seats: `engineering-board`, `gate-parity`, `deterministic-merge-check`, `retry-classification`, `eval-store-contract`. Wiki gaps stated by the seats (none of which the Skeptic contradicted): no page documents `parse_frontmatter`'s actual split semantics; no page covers the seed-follows-shipped re-pinning / `fixtureVersion` policy.

---

## 1. Settled

Settled by the Skeptic's actual runs (objection table), unless noted as settled-by-deliberation on an uncontested fact.

- **The parser is already lossless for single-line values containing `: ` or a bare `:`.** Settled by objection **1a (`closed-green`)**: `parse_frontmatter` round-trips `Rate limited: try again later` and `a:b` losslessly.
- **The `": " in goal` FAIL is the lossiness, not the parser.** Settled by objection **2 (`closed-green`)**: a colon-space goal FAILs pre-fix (exit 1, `FAIL: … goal contains a colon-space sequence (value truncates)`); deleting only the three-line check block flips to `All council artifacts valid`, parser untouched.
- **The real lossy path is the wrapped line.** A goal wrapped onto a second line parses to its first line and `validate.py` exits 0 — silent truncation, no FAIL. Settled by objection **3 (`closed-green` for principal's claim).**
- **All ten `validate.py` and all ten `_template.md` are byte-identical** across root, scaffold, and the eight seeds. Settled by objection **4 (`closed-green`)**: identical sha256s.
- **`rubric.json` `c3` grades "a testable goal with no colon-space sequence"** (`rubricVersion: 1.0.0`). Settled by objection **5a (`closed-green`).**
- **`rubric.json` is outside `seed.treeDigest`.** `sha256Tree`/verify covers `seedDir` only; `rubric.json` is a sibling of `fixture.json`, not under `seed/`. Settled by objection **5b (`closed-green`)**: a rubric edit needs no re-pin; a seed edit does.
- **`features-new.md` carries the colon-space bar** at lines ~54/57/75 (designer's "49" is off by ~5 lines; substance holds). Settled by objection **6 (`closed-green`)**.
- **Version-bump obligation is real.** The eval store is keyed on `fixtureVersion`+`rubricVersion` with no content hash; a seed edit under an unchanged `fixtureVersion` reuses the tuple and the next differing write throws `divergent payload already stored for this key tuple`. Settled by objection **7 (`closed-green`)**: the throw primitive executed; full-matrix `/council-eval` re-run not executed (composition code-read only).
- **No engine code consumes `goal`; the judge hop is procedural, with no code seam.** Sole `goal` hit in `extensions/` is the `runs.ts:10` comment; `council.md:270-276` hands the judge the goal + Skeptic evidence, nothing else; the fixture `inputFile` is read verbatim. Settled by objection **8 (`closed-green`, one line-citation qualifier: principal's pinpoint `eval-runner.ts:557-558` not re-confirmed; substance confirmed).
- **The card→`parse_frontmatter`→bundle-literal prefix is constructible; the literal "judge reads" step has no code seam.** Settled by objection **9 (`closed-green`)**: the treatment/control pair is sensitive; `test/retry.test.ts`'s byte-for-byte bundle match passes (1 pass / 0 fail). The non-testable residual is the judge-reads hop itself (see objection 8).
- **Plain-line needs no quoting/escaping/block scalar; no unquote step exists.** `parse_frontmatter('goal: "a: b"')` → `'"a: b"'` (quotes literal); no `unquote`/`unescape`/`stripquotes` hits. Settled by objection **D1 (`closed-green`).**
- **The negative contract survives.** `goal:no-space-after-key` still FAILs `missing required key 'goal'`. Settled by objection **D2 (`closed-green`).**
- **The card's own `goal` names no file.** "The classification test" appears once, at `FLLWUP-43.md:7`; in-repo it denotes the retry-classification tests (`test/retry.test.ts`'s bundle-deriving suite; `test/ev40-parent-retry.test.ts:6` uses the same phrase). Settled by objection **10 (`closed-green`, under the derive-vs-use distinction: many files *use* the literal; only `retry.test.ts` *derives* it from pi's bundle).
- **The module/`parse_frontmatter` docstrings contain the same false truncation claim** the FAIL propagates. Settled by deliberation (uncontested across owner r1/r2, principal r1/r2, designer r2; designer retracted its r1 "do-not-change" for the docstring).
- **Converged design (the one form).** Across all three generators in round 2: `goal` is a single `goal: <text>` line; value = everything after the first `: ` of that line; colons, colon-spaces, quotes, backslashes literal; no quoting, no unquoting, no block scalar; frontmatter ends at `---`, a line break ending the value, or a bare non-`key: value` line. Settled by deliberation (owner/​principal/​designer converged in round 2).
- **The change set moves together:** delete the FAIL; correct module + parser docstrings; byte-identical into scaffold + 8 seeds; `_template.md` (root + scaffold + 8 seeds); `board-create-card.md` §3; `features-new.md:54/57/75`; `rubric.json` `c3` + `rubricVersion` bump; 8× `fixture.json` `treeDigest` re-pin + `fixtureVersion` bump; wiki correction routed through `/wiki-ingest` at step 14 (council.md step 14 forbids facilitator hand-editing `vault/`). Settled by deliberation (owner r2, principal r2, designer r2 converged; the version-bump obligations settled by Skeptic #5b/#7).

---

## 2. Open judgment — for `product-owner`, escalating to `steward`

Each stated at equal weight. No test settles any of these.

- **Q1 — Wrapped-line policy.** Fact settled: a wrap silently truncates to the first line (objection 3). What to *do* is open. Positions as deliberation left them:
  - *owner r2:* in scope, loud form — add a bare-line-termination FAIL (new gate + new red-first test); multi-line support explicitly declared out. Argued as necessary because a "byte for byte" contract next to a silent truncation reproduces the EV-37 class.
  - *principal r2:* out of scope for this card's `goal` (the goal's subject is "an exact literal that contains a colon-space sequence" — the wrap is a different mechanism, not named); declare it out, document the residual as a known silent truncation in the copy, file a follow-up at council.md step 13. Argued from `gate-parity`: the parser silently truncates, there is no downstream gate that strict, so retargeting the FAIL is not the gate-parity-consistent fix — deleting is.
  - *designer r2:* fact in scope (must be in the deliverable as a known hazard); *policy* (forbid/FAIL vs. support continuation vs. document-and-follow-up) is product-owner territory.
  - Why no test settles it: the behavior is a fact (settled); the *policy* is a values/tradeoff call about whether a documented silent truncation is acceptable vs. whether a new writer-side gate is justified under `gate-parity`. Principal and owner both invoke `gate-parity` and reach opposite verdicts.

- **Q2 — Retroactivity of EV-37's frozen lossy goal.** Re-state EV-37's frozen `Done` goal (a new card) vs. accept the historical lossy record. Goal-immutability ([[engineering-board]]) freezes EV-37. No test settles whether to revisit history; portfolio judgment. → `product-owner`/`steward`.

- **Q3 — Propagation skew to already-initialized consumer repos.** Non-clobbering scaffold (`AGENTS.md #6`) plus no `validate.py` override-resolution path means existing consumer repos keep the false rule forever; version skew is unbounded. No test settles whether that is acceptable or whether a mitigation (an override path, a migration) is owed. → `product-owner`/`steward`.

- **Q4 — Keep vs. drop "rephrase without a colon" as secondary advice.**
  - *designer r2:* drop permanently — the clause is the bug; listing paraphrase as an acceptable workaround is the exact EV-37 behavior.
  - *owner r2:* lean keep-as-secondary for goals that need not name a literal (copy tone).
  - *principal r2:* drop as *mechanism*, keep only as optional style.
  - Why no test settles it: the comprehension question (does listing "rephrase" cause authors to paraphrase literals they should spell?) is testable by a cold-read authoring test in principle, but designer flags it as needing human subjects, not a repo gate; the *policy* of which paths are acceptable is taste. → `product-owner`.

- **Q5 — Lossless-form choice under an unrecorded second rationale.** Whether the colon-space ban existed as a defense against a hypothetical future YAML consumer of card frontmatter. No test settles whether an undocumented rationale exists; retracting a gate documented with a false rationale is safe only if no undocumented rationale exists. (This is principal's stated concern; the seats converged on plain-line regardless, so it does not block the form, but it remains an open judgment on whether the retraction is "safe" in the stronger sense.) → `product-owner`/`steward`.

- **Q6 — Full-matrix `/council-eval` divergent re-run end-to-end.** The throw primitive is green (objection 7); the full composition was code-read, not executed. Whether to require the end-to-end re-run before merge is a judgment about evidence sufficiency, not a fact a gate currently produces. → `product-owner`.

- **Q7 — Designer's P1 cold-read authoring comprehension.** Whether the new template + procedure actually cause a cold-read author to spell the literal verbatim. Needs human subjects; no repo gate settles it. → `product-owner`.

---

## 3. Open objections — Skeptic objections whose settling test has not passed

The Skeptic ran every falsifiable objection (`closed-green` or `closed-red`); it assigned **nothing `open-untested`**. The two `closed-red` results are reproduced here as open objections in the sense the task specifies — they are claims the deliberation left standing that the design, *as written*, does not satisfy. A fix must make them green.

- **O1 — "Byte for byte" copy is false.** Term: **`closed-red` (objection 1b).** Run: `parse_frontmatter` on `goal:␣␣␣padded value with space␣␣␣` → `'padded value with space'`, `stripped: True` — `validate.py:60` is `value.strip()`, so edge whitespace is trimmed. Claimed by owner r1 §2 / r2 converged rule and by designer's template sentence ("the text after 'goal: ' is the goal byte for byte, colons included"). Principal r2's correction ("trimmed, not byte for byte") stands. **What a fix must show:** the contract copy in `validate.py` docstrings (module + `parse_frontmatter`), `_template.md`, and both procedure paragraphs (`board-create-card.md` §3, `features-new.md` bars) reads "everything after the first `: `, edge-whitespace-trimmed" (or equivalent that does not assert byte-identity), and a test pins the `.strip()` behavior so a future "byte for byte" wording cannot recur.

- **O2 — "A wrapped two-line goal must equally FAIL" is false under the proposed design.** Term: **`closed-red` (objection 3, the owner half).** Run: `/tmp/skep/twrap` card `goal: first part\n second part` → `validate.py` exit 0, `All council artifacts valid`, parsed goal `'first part'`. The proposed plain-line design contains **no** FAIL for the wrap; the wrap silently passes, truncated. Owner r1-T4 / r2's parenthetical is refuted by execution. (Principal r2's opposing claim — "silently passes, neither fails nor gates" — is `closed-green` for the *current* behavior.) **What a fix must show:** the synthesis must not carry the parenthetical as if the design already fails wraps. Either (a) adopt owner r2's wrap-FAIL addition explicitly — a *new* gate and a new red-first test (today's wrap is silent-green; after, it must FAIL) — or (b) adopt principal r2's out-of-scope-with-documented-residual + step-13 follow-up card, in which case the copy must *state* that a line break ends the value and must *not* claim truncation-proofness. Carrying the sentence unamended is not an option the record leaves open.

---

## What the synthesis must and must not carry (the two `closed-red`s, as fact)

- **Must not carry:** any "byte for byte" / "byte-exact" wording for the goal value, in docstrings, template, or procedure copy. The parser's `value.strip()` trims edges; that is a smaller false parser model that would swap one false claim for another. The contract language must name the trim.
- **Must carry:** an explicit, true statement of edge-whitespace trimming wherever the lossless contract is stated.
- **Must not carry:** owner's parenthetical "(A wrapped two-line goal must equally FAIL)" as a property of the proposed design. Under the plain-line design as written, a wrap silently passes truncated. The record gives two ways to make this true-to-design and neither is the unamended sentence: adopt the new wrap-FAIL (owner r2's proposal, a new gate + test) *or* declare the wrap out of scope with a documented residual and a step-13 follow-up (principal r2). The synthesis must pick one of these framings explicitly, because the Skeptic's `closed-red` otherwise leaves the record asserting a FAIL that does not exist.

---

## Is the card's own `goal` a faithful oracle for this card's judge? (as fact)

**No — partially defective, and the defect is of the exact class this card exists to fix.** Stated as fact:

- **Conjunct A** ("A card goal can name an exact literal that contains a colon-space sequence without truncating") is **clean** — a write-seam claim, settled green by the Skeptic (objections 1a, 2).
- **Conjunct B** ("the judge reads the same string the classification test asserts") is **not a faithful oracle as written**, for two reasons the Skeptic confirmed:
  1. **Referential opacity.** "The classification test" names no file (objection 10, `closed-green`: the phrase appears once, at `FLLWUP-43.md:7`). Principal r1 point 8 and owner r2 both flag this; the Skeptic ran it and confirmed. The judge for *this* card receives that phrase as its only input — an instance of the very defect class (a goal that does not name the literal it asserts) the card repairs elsewhere.
  2. **No code seam.** The judge→runtime equality conjunct B asserts is over a hop with no engine code (objection 8, `closed-green`: sole `goal` hit in `extensions/` is a `runs.ts:10` comment; the judge's input is a static file read verbatim). The engine-testable *prefix* (card file → `parse_frontmatter` → `PROVIDER_FINISH_REASON_ERROR` from `extensions/retry.ts:78`, which `test/retry.test.ts` binds byte-for-byte to pi's bundle) is constructible (objection 9, `closed-green`); the residual "judge reads" step is procedural/LLM-transcription, not code-testable. Principal r2 corrected its own round-1 "lossless by construction" to "lossless by *instruction* only."

**Authority the record gives for amending it:**
- `council.md` step 10 (verified by Skeptic objection 8): a goal ambiguous without context "is a defect in the card's `goal` text — fix the card, don't widen the judge's input."
- Goal-immutability ([[engineering-board]]): an in-place amendment is legal while the card is `Deliberating`; only post-`In Progress` edits force a new card. FLLWUP-43 is `Deliberating`.
- Goal-wording authority rests with `steward` (principal r2 point 5; owner r2 agrees on the route).
- The referent is unambiguous *in fact* (objection 10): the only bundle-deriving classification test is `test/retry.test.ts` against `PROVIDER_FINISH_REASON_ERROR` (`extensions/retry.ts:78`). So the cheap correct remedy is a `steward` amendment naming that file and constant while the card is still `Deliberating`; if the steward declines, the residual is to be recorded in the card's record rather than papered over. (Routing target: `steward`, not any seat's edit; `vault/` corrections separately route through `/wiki-ingest` at step 14 per `council.md` step 14.)

This is stated as fact, without recommendation on whether the amendment should be made.

---

## Ready to hand off?

**No — not to implementation.** The record leaves two `closed-red` open objections (O1 "byte for byte" copy; O2 the wrap parenthetical) and seven open-judgment questions (Q1–Q7) unresolved.

- The two `closed-red`s **can** be resolved at synthesis/implementation by amending the contract copy (O1) and by explicitly choosing owner r2's wrap-FAIL *or* principal r2's documented-residual-plus-step-13 framing (O2). The synthesis above states what each fix must show; a subsequent step may apply them. But the choice in O2 between "new gate" and "documented residual" interacts with **Q1** (wrapped-line policy), which is open judgment for `product-owner` escalating to `steward` — so O2's framing cannot be finalized without Q1.
- **Q1** (wrap policy) is the load-bearing open judgment: owner and principal both invoke `gate-parity` and reach opposite verdicts, and it determines whether a new writer-side gate ships. Routes to `product-owner`, escalating to `steward`.
- **Q2–Q7** route to `product-owner`/`steward` as listed; none blocks the *write-seam* (conjunct A) deliverable, but Q3 (propagation skew) and Q5 (unrecorded rationale) bear on whether the retraction is "safe" in the stronger sense and should be decided before merge.

Hand-off: to `product-owner` (escalating to `steward`) for Q1 first — it unblocks O2's framing — then Q2–Q7; the `closed-red` copy amendment (O1) is mechanical and may proceed in parallel. The card's own `goal` amendment (conjunct B opacity) routes separately to `steward`.

### Step 6 — routing (facilitator)

Phase-1 rulings checked first (`<escalation_contract>` step 1): the EPIC-9 residual-run rulings (scope, serial order `40 → 43 → ...`, run-scoped `--admin` merge, follow-up draft-then-confirm re-homed to `product-owner`, R1 union-merge-reconcile) are all process rulings and answer none of the consolidator's open-judgment questions Q1–Q7 or the card-`goal` defect. They are therefore not applied-and-cited here; they are recorded as checked and inapplicable.

The consolidator left the card **not ready to hand off**: two `closed-red` open objections (O1, O2), seven open-judgment questions (Q1–Q7), and a card-`goal` referential-opacity defect whose wording authority is `steward`'s. Per `<escalation_contract>` step 2 the facilitator does not dispatch `product-owner` or `steward`; it ends the turn with an `ESCALATION` report carrying facts and no recommendation. The card stays `Deliberating`; no `Needs Human` state is set (these are ruling-seat-addressable, not declined by both ruling seats). Nothing in steps 7–14 has run.

No state transition accompanies this record; `python3 council/validate.py` re-run and the record commit are the only writes.

### Step 6 — rulings applied (resumed runner, job-3 resumed)

The prior runner (job-3) ended the turn with an `ESCALATION` report. The
ruling seats have now ruled; the rulings below are appended verbatim and are
binding. ESC-1 was applied by the orchestrator before this turn (the card's
`goal` frontmatter line is the steward-amended text; `python3
council/validate.py` is green). No resumption re-asks anything the rulings
answer.

#### product-owner (job-4) card-level rulings

Full reasoning at `vault/raw/2026-09-17-po-fllwup43-step6-rulings.md`.

- **R1 (Q1, wrapped-line policy):** Out of scope for this card's goal;
document the wrap residual in the new copy; file a step-13 follow-up card for
the loud gate. `gate-parity`'s writer ⊆ loader ∪ dispatch invariant sides with
*deleting* the colon gate (the live asymmetry), not adding a sibling
wrap-FAIL.
- **R2 (Q4):** Drop "rephrase without a colon" permanently.
- **R3 (Q5):** Retraction of the colon-space ban is safe; the recorded
rationale is false against the actual parser (`validate.py:55-56`).
- **R4 (Q6):** A single-cell smoke on `council/fixtures/board-create-card`
with a treatment/control goal pair is the minimum sufficient evidence; the
full matrix is not required before merge.
- **R5 (Q7):** Designer's cold-read authoring-comprehension prediction is out
of repo scope; record it in the card, do not block on a human-subject test.

#### steward (job-5) portfolio rulings

**ESC-1 (goal amendment) — resolved by the orchestrator before this dispatch.**
Conjunct B amended in place under `engineering-board` amendment authority
(EV-29 form):

`goal: A card goal can name an exact literal that contains a colon-space sequence without truncating, and council/validate.py's parse_frontmatter recovers that literal intact when the goal names the string that test/retry.test.ts asserts PROVIDER_FINISH_REASON_ERROR, declared in extensions/retry.ts, to be.`

Recorded verbatim:

> ESC-1 disposition (steward). Conjunct B amended in place under the
> engineering-board amendment authority (EV-29 form). The amended conjunct
> asserts the engine-testable prefix card file → validate.py
> parse_frontmatter → PROVIDER_FINISH_REASON_ERROR (extensions/retry.ts:78),
> which test/retry.test.ts binds byte-for-byte to pi's installed bundle. The
> residual leg — the facilitator's verbatim hand-off of the goal text to the
> judge (council.md §10) — is procedural, has no engine code, and is recorded
> as a residual rather than claimed as gate-verified. Conjunct A and the
> deliverable design (PO R1–R5) are unchanged.

**ESC-2 (EV-37 frozen lossy Done goal):** Accept the historical lossy record.
Do not re-state it, do not file a card to carry it, do not edit
`council/cards/EV-37.md`. Permanent residual. Recorded verbatim:

> ESC-2 disposition (steward). EV-37's historical goal keeps its lossy
> spelling. Done records are frozen (engineering-board; consistent with
> steward's EPIC-9 refusal of a retro-fitted epic Acceptance); EV-37 R1 is a
> recorded human decision and is not touched. Residual accepted permanently;
> the lesson lives in this card's record and the corrected engineering-board
> page, not in a re-stated EV-37. Non-blocking for this merge.

**ESC-3 (consumer-repo skew):** Unbounded, undocumented skew is not acceptable
as a permanent state, but the mitigation is a separate follow-up card, not
this card and not this merge. (a) File a `Backlog` step-13 residual under
EPIC-9 for a supported refresh path; (b) record the skew on FLLWUP-43's card
and in the step-14 wiki correction. This follow-up is approved by steward —
file it with the next free `FLLWUP-` number. Acceptance shape verbatim:

> A consumer repo initialized against an earlier pi-council install can bring
> its packaged council tooling (council/validate.py, _template.md, the
> procedures, the docstrings) up to the currently installed package's version
> through a documented, supported path, without overwriting consumer-edited
> board, cards, or wiki.

(An override path alone is insufficient; the card must deliver an adoptable
path.) Recorded verbatim:

> ESC-3 disposition (steward). Consumer repos initialized before this card
> keep the old colon-space FAIL, _template.md warning, docstring, procedure
> paragraph, and features-new.md bars indefinitely: scaffoldInto is
> non-clobbering and council/validate.py has no override-resolution path.
> Unbounded skew is not accepted as permanent. A Backlog step-13 follow-up
> card under EPIC-9 is owed, acceptance shape above; mechanism is that card's
> design. Not in this card's change set; non-blocking for this merge. The skew
> itself is recorded here and folded into the step-14 wiki correction so it is
> not silent.

#### Phase-1 run-wide rulings (unchanged, binding)

- **Merge (merge row):** the human authorized, for this run only,
`gh pr merge <PR> --squash --admin --match-head-commit <X>`; all five
deterministic criteria still hold. Run-scoped.
- **R1 (FLLWUP-41):** the documented union-merge reconcile is the sanctioned
non-fast-forward repair; never force.
- **Follow-ups:** step-13 confirmation is re-homed to `product-owner`; the
ESC-3 and R1 wrap follow-ups are already steward/product-owner-approved in
substance, so file them when step 13 is reached.
- **Known artifact:** the FLLWUP-27 branch-freshness preflight FAIL recurs
mid-card; the step-11 re-run set is `tsc`/`bun test`/`validate.py`; never
weaken a criterion.
- **Criterion 2:** `gh pr checks <PR> --json name,state,workflow`, keyed on
`workflow`; `gates` must appear `SUCCESS`.

#### Routing resolution after the rulings

- **Q1 → R1 applied.** O2's framing is principal r2's option: the wrap is out
of scope, the residual is documented in the new copy (a line break ends the
value), and a step-13 follow-up card carries the loud gate. No wrap-FAIL ships
in this change.
- **Q4 → R2 applied.** "Rephrase without a colon" is dropped permanently from
all copy.
- **Q5 → R3 applied.** The retraction is safe; the recorded rationale is
false against `validate.py:55-56`.
- **Q6 → R4 applied.** Minimum sufficient evidence is the single-cell
`board-create-card` treatment/control smoke, not the full matrix.
- **Q7 → R5 applied.** Designer's P1 comprehension prediction is recorded
(step 3, verbatim) and does not block.
- **O1 (closed-red: "byte for byte" copy is false) closed by copy.** The
contract language is "everything after the first `: `, edge-whitespace-trimmed";
a test pins `.strip()`.
- **O2 (closed-red: the wrap parenthetical) closed by R1** as above.
- **ESC-1 applied by the orchestrator** before this dispatch (goal frontmatter
is the amended text).
- **ESC-2 accepted as a permanent residual** — recorded above; no card filed.
- **ESC-3 routed to step 13** — the follow-up card is filed there; the skew is
recorded on this card and folded into the step-14 wiki correction.

The card is ready to hand off: no `Needs Human` state, no open ruling, and no
open objection without a ruling to close it. Proceeding to step 7.
