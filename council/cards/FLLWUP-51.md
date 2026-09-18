---
id: FLLWUP-51
title: Loud gate for a goal wrapped onto a second line
state: Done
owner: null
epic: EPIC-9
goal: A wrapped goal, a non-`key: value` line inside the frontmatter block, an unclosed frontmatter block, and a key following `goal:` in the block are each refused by `parse_frontmatter` and reported as a non-zero `council/validate.py` FAIL naming the defect rather than validating green, where a not-`key: value` line's diagnostic names both a wrapped/continued value and a missing closing `---` because the parser cannot tell them apart; single-line goals containing `: ` and cards carrying extra intentional keys before `goal:` parse clean; and the documented residual — a mid-block colon-bearing continuation of a non-goal key — is recorded in copy and pinned by a test but not gated.
---

## Intent

Skeptic objection 3 (FLLWUP-43 step 4, `closed-green`) settled that a goal
wrapped onto a second line parses to its first line and `council/validate.py`
exits 0 — a silent loss path in the field FLLWUP-43's deliverable governs.
Product-owner R1 ruled the wrap out of scope for FLLWUP-43 and owed as a
step-13 follow-up: `gate-parity` forbids shipping a writer-side wrap-FAIL as a
sibling of the colon ban FLLWUP-43 deletes, so this card must ship a loud gate
that is gate-parity-consistent (matched by the loader/dispatch, or an
equivalent documented surface fix) rather than a writer-only check.
FLLWUP-43's shipped copy documents the hazard ("a line break ends the value");
this card makes it loud instead of silent.

## Run record (features-deliver / FLLWUP-51, run 2)

### Step 1 — classification (facilitator)

- **Promotion applied (cited ruling).** The card arrived `Backlog`. The run-2
  Phase-1 scope ruling on `EPIC-9` ("FLLWUP-50 through FLLWUP-60 (eleven
  `Backlog` residuals under the `Done` epic) are this run's delivery scope")
  promotes it; `steward` job-1's build order places it fourth of eleven
  ("the validator / goal-oracle net (`51`, FLLWUP-43's successor")). Promotion
  commit `68e2edf`, pushed under the run-2 R3 record-push authorization.
- **Path: full council.** Cross-seam (the validator `council/validate.py`, its
  scaffold copy, and the fixture seeds carry the same parse; digests re-pin
  under AGENTS.md #5) and spec-ambiguous: the card's own hard constraint —
  gate-parity-consistent ("matched by the loader/dispatch, or an equivalent
  documented surface fix") — admits more than one reasonable design. FLLWUP-43,
  the same file family, ran full council on the same tradeoff. Steps 2–6 run
  before any code is written.
- **Surface-touching: yes.** The wrap FAIL diagnostic is user-visible copy,
  and template/procedure copy may move. Per council.md step 1 a
  surface-touching full-council card seats `designer` as a third generator.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all present in
  `council/agents/`; no `.pi/agents/` repo-local override directory exists.
  Ruling seats (`product-owner`, `steward`) are never dispatched by this
  container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared). Main checkout clean at `f8eda12` ==
  `origin/main`; `python3 council/validate.py` → `All council artifacts valid`.
  Known fact from FLLWUP-43's record, re-verified by grep: no engine code
  parses card frontmatter (`validate.py::parse_frontmatter` is the sole
  card-frontmatter parser; `extensions/index.ts::frontmatterField` parses
  procedure frontmatter, not cards) — load-bearing for the gate-parity
  constraint.
- **Gate set for this repo:** `bash council/preflight.sh FLLWUP-51`,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (AGENTS.md
  §Commands + `.github/workflows/gates.yml`). No database/import/server gate
  exists in this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run.
- **Phase-1 rulings applicable here:** run-2 R2 (merge), run-2 R3 (record
  push), step-13 follow-up confirmation re-homed to `product-owner`, and the
  binding constraint inherited from FLLWUP-43 product-owner R1 (gate-parity:
  no writer-only wrap-FAIL). All applied as recorded; nothing re-asked.
### Step 2 — round 1 positions (verbatim, three independent dispatches)

Dispatches: `owner` job-6.1 (5.2m, 9 turns, total 263501 tok, cost≈$0.0119); `principal` job-6.2 (5.2m, 26 turns, total 1525414 tok, cost≈$0.0490); `designer` job-6.3 (5.2m, 6 turns, total 128349 tok, cost≈$0.0224). Each was given only the card; no peer position was shown.

---

#### owner (job-6.1)

**Approach.** The card's prose is accurate but understated: I reproduced the silent path and found **two** silent wrap branches, not one — and the silence is order-dependent, not intrinsic. My position: the loud gate belongs **inside the loader parse path itself** (`parse_frontmatter`'s scan loop surfaced as `FAIL:` lines), which satisfies the inherited gate-parity constraint by construction, and the red-first tests follow the FLLWUP-43 test harness pattern (`test/fllwup43-goal-oracle.test.ts`) almost line for line.

**Mechanism as it actually is today (verified, not trusted):**

- `council/validate.py::parse_frontmatter` (lines 46–68) is the sole card-frontmatter parser in the repo — confirmed: no engine code parses card frontmatter (`extensions/index.ts::frontmatterField` is procedures-only), and no procedure or seat code parses it mechanically; the goal's only mechanical consumers are `validate.py` itself and the judge/LLM reading the raw file.
- **Branch A (the card's named hazard, verified):** goal wrapped as a bare continuation line, goal being the last key → parses to first line, `All council artifacts valid`, exit **0**.
- **Branch B (not named in the card, verified):** a continuation line containing `: ` — e.g. `note: wrapped with colon-space` — does not break the loop; it becomes a **spurious key** and still exits **0**. `parse_frontmatter` returned `{"goal": "first part", "note": "wrapped with colon-space"}` in my repro. A wrapped goal whose second line happens to contain `: ` is silently truncated just the same.
- **Branch C (already loud, verified):** a wrap *earlier* in the block (e.g. a wrapped `title`) fails with a missing-key cascade. The silence exists only because `goal` is conventionally the last key — an accident of field order, not a design.
- **Branch D (silent, same class):** frontmatter with **no closing `---`** is accepted as long as the six required keys parsed; the scan loop just falls off the end.
- The FLLWUP-43 residual pin lives at `test/fllwup43-goal-oracle.test.ts` **T7** (`expect(status).toBe(0)`) — this card's red-first test is T7's inverse, and T7 must be amended in the same change or the suite is self-contradictory.

**Design position — where the gate lives.** Gate parity (`vault/wiki/gate-parity.md`) states the invariant as *writer ⊆ loader ∪ dispatch*: never a check stricter than every downstream consumer. For cards, the triple maps as: there is **no code writer** (cards are written by humans/procedures), the **loader is `parse_frontmatter`** — the only parser — and there is **no dispatch**. Therefore a wrap-FAIL is parity-consistent iff it is a **loader-level refusal to parse silently**, not a post-hoc policy on the parsed dict. Concretely: when the scan loop encounters, before the closing `---`, a non-empty line that is neither `key: value` nor `---`, that is a structural parse failure and must surface as `FAIL: <id>: frontmatter line N '<line>' is not 'key: value' — a wrapped/continued value? (a line break ends the value; keep the goal on one line)`. The loader's refusal *is* the matching surface: no downstream consumer accepts what the loader refuses, because the loader is the only mechanical consumer. The "equivalent documented surface fix" alternative is what FLLWUP-43 already shipped (the board-create-card copy, lines 44–52) and this card explicitly supersedes it. I recommend keeping `parse_frontmatter`'s return value unchanged (an optional failures out-param consumed by `main()`), so the T2/T6/T7 `parseGoal` harness keeps working and only status assertions move — minimal blast radius.

**Exact surfaces that must move:**

1. `council/validate.py` — the loader gate + docstring (currently says "goal present on a single line…" with no refusal).
2. `council/scaffold/council/validate.py` + 8 `council/fixtures/<task>/seed/council/validate.py` — byte-identical copies (T3 enforces).
3. 8 `council/fixtures/<task>/fixture.json` — `fixtureVersion` 1.1.0 → 1.2.0 + `seed.treeDigest` re-pin (T5 enforces; T5's `1.1.0` assertion updates).
4. `council/procedures/board-create-card.md` (lines 44–52) — hazard copy becomes "the validator refuses a wrapped value with a named FAIL" — **root copy only** (verified: neither `council/scaffold/council/` nor the seed trees carry `procedures/`).
5. `test/fllwup43-goal-oracle.test.ts` — T5 fixtureVersion, T7 inversion, header note.
6. New `test/fllwup51-*.test.ts` — the red-first tests below.

Designer seats for the FAIL diagnostic copy and the procedure copy (step-1 already ruled surface-touching).

**Falsifiable red-first tests (all red today, verified by my repro):**

- **R1 (branch A):** `councilTree("goal: first part", "second part of the goal")` → expect exit `1` and stdout containing a FAIL naming the wrap. Today: exit 0. (Direct inverse of T7.)
- **R2 (branch B):** continuation line `note: wrapped with colon-space` → expect exit `1` + FAIL. Today: exit 0 with a spurious key. Requires an **unknown-key FAIL** (keys outside the six) — verified no existing card carries extra keys, so nothing breaks.
- **R3 (branch D):** frontmatter missing its closing `---` → expect exit `1`. Same structural class.
- **Green-side pin:** a single-line goal containing `: ` (T1's shape) still validates clean — proving the gate didn't resurrect the colon ban.

**Scope questions the goal does not settle** (my recommendations, for the council):

1. **Branch B in or out?** The goal says "a wrapped goal is detected loudly"; a wrap whose continuation contains `: ` is still a wrapped goal. I recommend in (R2) — leaving it out ships a second silent path the Intent explicitly governs.
2. **Branch D (unclosed frontmatter)** — same structural detector, one extra branch. Recommend in.
3. **Lossless alternative rejected:** folding indented continuations into the value would make the loader lossless (the true FLLWUP-43 lesson), but the goal demands *refusal with a diagnostic*, and multi-line goals contradict the "one falsifiable sentence" discipline. Refusal it is; the council should record that this was considered and declined.
4. **rubricVersion:** T5b pins board-create-card's rubric at 1.1.0; c3 already grades "single-line" so no rubric rewrite is needed — bump only if the council touches rubric copy.

**What the wiki does not cover:** (a) `gate-parity.md` is written entirely for the `.council.json` config writer — it never defines the writer/loader/dispatch triple for card frontmatter or names the dispatch analog for a document validated at rest; this card extends the principle to a second domain and the page (or a sibling note) should record that extension at step 13. (b) `engineering-board.md` correctly names the wrap residual and this card, but nothing documents that the silence is *order-dependent* (goal-last) or that branches B and D exist — both silent paths are unrecorded anywhere. Both are wiki-ingest follow-ups, not PR blockers.

**Tradeoffs accepted:** the unknown-key FAIL (R2) is a slightly broader gate than the literal goal text requires — I accept it because the narrower gate leaves a verified silent wrap path, which is exactly the failure class this card exists to close. The out-param design on `parse_frontmatter` keeps a pure function slightly less clean than a raise; accepted to avoid breaking the established parse harness.

**Testable claims:** R1–R3 above are the runnable disagreement-settlers — each is red on today's tree, and each encodes one scope decision rather than a prose opinion. The claim "no existing card or template carries an extra frontmatter key" is testable in one awk pass (done; empty result).

---

#### principal (job-6.2)

**The hop chain for a wrapped goal value, as the code is today** (verified, not taken from the card's prose):

1. **Author hop — prose only, no code.** `council/procedures/board-create-card.md:42-50` (§3) already states the rule ("never wrap the goal onto a second line", "the value is everything after the first `: `"), and the card template fixes the frontmatter order as `(id, title, state, owner, epic, goal)`; `council/scaffold/council/cards/_template.md:7` puts `goal:` as the last key before `---`. `council/procedures/features-new.md:53-57,74-75` repeats the bar and has `skeptic` attack goals for single-line-ness in wave 2. Nothing writes cards programmatically.
2. **Loader hop — `council/validate.py:64-69`.** This is the break:
   ```python
   if ": " in line:  key, value = line.split(": ", 1); meta[key.strip()] = value.strip()
   elif line.strip():  break        # :68 "a bare non-`key: value` line ends frontmatter"
   ```
   A bare continuation line terminates the *block*. `main()` then checks only key **presence**, never the goal's line shape, and prints `All council artifacts valid`. With `goal` last (the template order), all six required keys are present → **exit 0, goal truncated**. The module docstring's bullet ("goal present on a single line") is *documentation, not validation* — no such check exists anywhere in the file.
3. **Dispatch hop — prose, no code.** `council/procedures/council.md` step 10 ("Dispatch `judge` with the card's `goal` … nothing else"); the judge body `<when_invoked>` consumes that text and is forbidden to widen its input. Grep across `extensions/*.ts`: **zero** hits for `council/cards`, `board.md`, or card frontmatter. The other card readers are raw-text, not parsers: `smoke/assert.sh:7` and `smoke/driver.sh:156,185` (`sed 's/^state: *//p'`), `extensions/eval-rubric.ts:149-160` (`artifact-present`/`artifact-contains` do `.includes()` on a path).
4. **Parity/mechanical seam.** `council/validate.py` exists in **10 byte-identical copies** (root, scaffold, 8 fixture seeds — pinned by `test/fllwup43-goal-oracle.test.ts:130`), each seed's `validate.py` inside `seed/` is covered by the 8 `fixture.json` `seed.treeDigest` sha256 (`council/fixtures/board-create-card/fixture.json:14`), and the smoke consumer repo gets its copy via the scaffold. `test/fllwup43-goal-oracle.test.ts:196` (T7) currently *pins* the silent behavior: parse → `"first part"`, `runValidate` → status 0.

**Which seam is broken.** `parse_frontmatter`'s own contract: it discards block content silently while its docstring claims a single-line goal is enforced. The broken seam is loader↔loader-doc, not goal↔judge. Secondary: `board-create-card.md:47-48` conflates two mechanisms ("what ends the *value* is a line break **or** a line without the `key: value` shape") — a line break ends the *value*; a non-conforming line ends the *block* and drops every key after it. That imprecision is what hides the case below.

**Which seams the goal sentence actually requires fixing.** One code seam (`parse_frontmatter`), plus the mechanical parity seams (10 copies, 8 digests, T3/T7). **Not** the engine — there is no card parser to match in `extensions/`, so "or an equivalent documented surface fix" is already discharged by the shipped `board-create-card.md` / `_template.md` copy. The card's "writer-side" framing is a category error for cards (no code writer exists); the correct mapping onto [[gate-parity]] is: gate = `validate.py`, loader = `parse_frontmatter`, dispatch = the judge (prose-only) → the check must be **the loader's own refusal**, never a `main()`-only raw-line regex, because `parse_frontmatter` is the sole programmatic goal reader and is exercised directly as a library by `test/fllwup43-goal-oracle.test.ts:88-103`.

**Blind spots (named per vantage):**

- **Validator vantage** (owns `validate.py` + 10 copies + digests): sees "add a FAIL, re-pin digests." Cannot see that a FAIL in `main()` alone leaves the library loader lossy (so the gate is still the forbidden writer-only shape), and cannot see that the wrap also *drops later keys* — today a mid-block wrap already FAILs, with the misleading `missing required key 'epic'`. It also cannot see that a *key-vocabulary* rule (reject unknown keys) is the colon-ban shape again: the loader reads extra keys losslessly and no consumer reads them, so it is strictness that prevents no loss.
- **Author vantage** (`board-create-card.md` §3, `features-new.md` bars, `_template.md`, rubric c3): sees "the copy already says never wrap." Cannot see that *the mechanism the copy states is wrong*, and that the copy's own new encouragement — "name any literal precisely … colons and all" — makes the most likely wrap a **colon-bearing** continuation line, which is `key: value`-shaped to the parser and therefore never visible to a bare-line check.
- **Judge vantage**: sees only the handed text. Cannot see that the text it received may be a *prefix* of the authored goal — the loss is invisible to the judge by construction, and council.md step 10 forbids it from widening its input. A judge handed `"first part"` will judge `"first part"` and can PASS.
- **Engine vantage**: sees "cards are out of engine scope, correctly." Cannot see that the *dispatch* hop is prose-mediated and unguarded, that the only code readers of cards are raw-text probes (smoke `sed`, `eval-rubric` `.includes()`), and that "the loader" is therefore singular — so a card fix placed in `extensions/` would be a fourth reader with nothing to read.

**Reframe.**

The card's *design* (refuse + diagnose; no join/fold) is sound and I agree with it — joining continuations would be a semantic change to an explicitly non-YAML grammar ("no YAML quoting") and would flip currently-FAILing mid-block wraps green. **But the card's framing is under-specified in two load-bearing ways**, and one of them is a hole rather than a phrase:

- **The subject of "refused" must be the loader.** "Refused with a diagnostic naming the wrap" without naming *where* admits the implementation the ruling forbids: a raw-line scan in `main()`. The chosen mechanism must be `parse_frontmatter` declining to return a dict for a block it would otherwise silently truncate (raise, or a documented sentinel), with `main()` rendering the FAIL.
- **A bare-line-only check ships green on the case this repo just created.** FLLWUP-43 made `: ` legal and *encouraged* in goals. A goal that quotes a colon-bearing literal and wraps as `goal: retry when the message is` / ` Rate limited: try again later` gives `goal = "retry when the message is"` **plus** a bogus key `Rate limited`, and `validate.py` still exits 0. The continuation is not bare; a bare-line check misses it entirely. There are exactly two ways to close it, and the design must pick one and pin it:
  1. **Bare-line-only** → sub-case (iii) remains a residual that must be *documented in copy and pinned by a test*, FLLWUP-43-style; or
  2. **Positional rule: `goal` is the last frontmatter key (no key may follow `goal`)** → closes (iii) deterministically. This is parity-defensible *only if shipped with the copy that states it* (it is already true of every shipped card and of `board-create-card.md:66`, and `_template.md:7` already orders it last) — that documentation is precisely the "equivalent documented surface fix" branch. Its cost: a hypothetical card with a legal-but-unusual key order becomes red; there are zero such cards today.

The three sub-cases to state explicitly: (i) bare continuation after `goal` (last key) = today **silent**; (ii) bare continuation mid-block = today **FAIL, misleading message**; (iii) colon-bearing continuation = today **silent**, closed only by option 2.

**Testable claims (red-first):**

- **R1 (the card's core; flips T7).** `councilTree("goal: first part", " second part")` — today `status === 0` and stdout contains `All council artifacts valid` (`test/fllwup43-goal-oracle.test.ts:196-201`). After: `status === 1`, output contains a `FAIL: ` line naming the wrap and the offending line text (and **not** only `missing required key`).
- **R2 (loader-vs-gate, the anti-bolt-on test).** Import `parse_frontmatter` directly (harness at `test/fllwup43-goal-oracle.test.ts:88-103`) on `"---\ngoal: first part\n second part\n---\n"`. Today it returns `"first part"`. Claim: after the change it must **not** return a truncated `goal` — it must refuse. If R2 stays red while R1 goes green, the change is a gate-only/writer-side check and violates the card's own constraint.
- **R3 (diagnostic quality).** Card with `goal: first part` + ` second part` + `epic: null` after the wrap: today FAILs with `missing required key 'epic'`. After: the diagnostic names the wrap (the wrap message must not be suppressed by, or reduced to, the missing-key report).
- **R4 (sub-case iii — the discriminator).** `goal: retry when the message is` + ` Rate limited: try again later`. Today: exit 0, `goal === "retry when the message is"`. Assert whichever the design claims: option 1 → exit 0 + a **pinned residual test** and copy that says so; option 2 → exit 1 naming the key-after-`goal`. A design that claims option 1 but lets R4 pass silently with no test and no copy is the silent path surviving under a green R1.
- **R5 (no false positive on shipped data).** The new `validate.py` must exit 0 on: all cards in `council/cards/`, the 8 seed council trees, and `smoke/fixture/council/`. Specifically guards body-embedded fenced frontmatter — `council/cards/FLLWUP-47.md` and `council/cards/FLLWUP-49.md` contain `---`-delimited card blocks *inside their bodies* — so the detection must be scoped to the leading block, not the whole file. (I verified every shipped card's `goal:` line is immediately followed by `---`; no existing violation.)
- **R6 (parity mechanics).** T3 stays green: 10 `validate.py` copies byte-identical; the 8 `fixture.json` `seed.treeDigest` re-pinned to `sha256Tree(seed/)`, with `fixtureVersion` bumped if seed semantics change (currently `1.1.0`). A fix applied only to `council/validate.py` leaves T3 red.

**Wiki grounding.** Used `vault/wiki/index.md` (page map), `vault/wiki/gate-parity.md` (writer ⊆ loader ∪ dispatch; the placement rule and its corollary), `vault/wiki/engineering-board.md` (card frontmatter, the FLLWUP-43 retraction, and the standing note that the wrap is "the real remaining silent-loss path"). Also grounded in code: `council/validate.py`, `council/procedures/{council,board-create-card,features-new}.md`, `council/agents/judge.md`, `council/scaffold/council/cards/_template.md`, `test/fllwup43-goal-oracle.test.ts`, `smoke/{assert.sh,driver.sh}`, `extensions/eval-rubric.ts`, `council/fixtures/*/fixture.json`.

**What the wiki does not cover** (say it plainly): (a) `gate-parity.md` is written entirely about the `.council.json` writer/loader/dispatch triple — it has **no worked example for cards**, where there is no code writer and no card dispatcher, so applying it here requires an interpretation the wiki does not supply (I supplied the mapping above: loader refusal + documented surface). (b) `engineering-board.md` names the wrap hazard and FLLWUP-51 but **does not describe `parse_frontmatter`'s `break` mechanism**, so it cannot tell a reader that a wrap also drops later keys or that a colon-bearing continuation reads as a stray key. (c) No wiki page documents `validate.py`'s internals at all — the `parse_frontmatter` contract, the 10-copy byte-parity, or the digest re-pin — so this card's design has no wiki-declared contract to conform to and must be pinned by tests.

---

#### designer (job-6.3)

**Design position.** The loud gate is a **post-hoc diagnostic at the validator** (a FAIL: line naming the wrap, exit code 1) that the author reads immediately after `python3 council/validate.py` — the same surface they already trust for board/state drift today. The fix is gate-parity-clean by construction only if the same predicate fires wherever the goal is parsed; the cleanest path is to have `parse_frontmatter` reject a continuation line that isn't a `key: value` shape and to have `validate.py` translate that raise into the FAIL, so writer ⊆ loader holds automatically. A pure **surface fix at the authoring step** (board-create-card.md refusing to write a wrapped goal) is *also* parity-clean under the wiki's "documented surface fix" carve-out, but it moves the catch before the file exists, which trades the author's "validate.py says green, I'm done" inference for a new "the procedure refused my draft" inference they have not yet learned.

**Gulf closed.** Gulf of Evaluation for the author at the moment of `python3 council/validate.py`. Today the validator's green output *implies* "goal parsed completely"; the wrap hazard makes that implication a lie. The author must correctly infer from a single FAIL: line that their goal was silently truncated, which frontmatter field is at fault, and that the fix is to keep it on one line. This is the same person, same moment, same screen that the existing board/state-drift FAILs already serve — the loud gate reuses that channel rather than inventing a new one.

**Principle and evidence.**
- **Signifier, not just exit code.** `council/validate.py` already prints `FAIL: <finding>` per line and exits non-zero; the FAIL line is the surface the author reads. A wrap gate that only changes exit code fails Norman's signifier test — the author sees a number flip with no name attached. The FAIL must read like the surrounding failures (`<fname>: <finding>` pattern).
- **Mapping.** The FAIL names the wrap on the *same physical line of the file the author just edited*, not on a parsed/restructured view — the file path is the same one the author opened; no remap in between.
- **Conceptual model.** The author already learned "a line break ends the value" from `council/procedures/board-create-card.md` (the FLLWUP-43-shipped copy). The FAIL message should *echo that same vocabulary* so the author reconnects the runtime signal to the prose they read at authoring. "Wrap" is the verb used in the procedure; the FAIL should use "wrap" (or "wraps onto a second line"), not jargon like "continuation" or "bare line."
- **Knowledge in the world over knowledge in the head.** FLLWUP-43's R1 ruling (`gate-parity` wiki, "writer ⊆ loader ∪ dispatch") means *documenting* the hazard without *gating* it is exactly the silent loss path this card is meant to end. `vault/wiki/engineering-board.md` still records the wrap as "the real remaining silent-loss path" — once this card lands, that sentence is what we want to retire (or convert to "now caught at the validator"), not perpetuate.

**Falsifiable predictions** (inputs for the Skeptic's `test/` and smoke — *not* gate assertions from this seat).
1. **FAIL message content.** A wrapped goal causes `python3 council/validate.py` to print a line beginning `FAIL: <file>:` and naming the wrap (e.g. contains the word "wrap" or "second line" or "line break"). The pure-seam falsifier is a new test in `test/` that asserts on stdout + exit code against a wrapped fixture card — same shape as the `T1`-`T8` set in `test/fllwup43-goal-oracle.test.ts`.
2. **Same vocabulary as the procedure.** The FAIL line shares at least one noun or verb with the procedure's `never wrap the goal onto a second line`. Falsified if the FAIL says "continuation" while the procedure says "wrap" — the author reconnects only on shared words.
3. **Gate parity holds.** The exact predicate that triggers the writer FAIL also rejects the same card at any other parse site. With only `validate.py::parse_frontmatter` parsing card frontmatter today, this is satisfied if `validate.py` calls the same parser and the parser raises on the continuation; it is *not* satisfied if `validate.py` adds an independent newlines-in-goal check that the engine path could quietly miss later.
4. **Surface change is additive.** After this lands, `python3 council/validate.py` against a clean card still prints `All council artifacts valid` and exits 0 (no regression on the existing green path). Same-shape pure-seam test as FLLWUP-43's T2.
5. **Author can recover without re-reading the procedure.** The FAIL line is sufficient by itself to point the author at the fix; the procedure copy stays informative but is no longer the only place "what just happened" is explained. (Taste; the smoke that would falsify it is a cold-read by a person who has never seen the procedure, given only the FAIL output.)

**Copy I would NOT change (and why).**
- `council/cards/_template.md:7` — `goal:` line with "Keep it on one line; the value is everything after `goal: `, edge-whitespace-trimmed (colons allowed)." This is the FLLWUP-43 retraction-of-the-colon-ban in one sentence; weakening "one line" or "colons allowed" would silently re-introduce the lesson FLLWUP-43 just paid for.
- `council/procedures/board-create-card.md:42-51` — the "judge's only input / one line / spell literals exactly" paragraph. The wrap clause here *is* the documented surface. Removing it would push knowledge out of head; this card's job is to make the runtime match the prose, not to delete the prose.
- `vault/wiki/engineering-board.md` — the retraction note that names the wrap as "the real remaining silent-loss path." This card is what retires it; rewriting it as "now caught" is a step-14 wiki-ingest task, not a step-2 design call.

**Open judgment calls I deliberately do not resolve here.**
1. **Where the predicate lives** — `parse_frontmatter` raises vs. `validate.py` does a `"\n" in goal` check. Gate-parity admits both only if the same code fires on every consumer. Hand to `principal`/`owner`.
2. **FAIL line payload** — bare terse message vs. including the wrapped line's content vs. a line-number pointer. Existing FAILs lean terse; precedent favors terseness, but the author's recovery may benefit from more. Taste, not ground.
3. **Authoring-time refusal** — whether `board-create-card.md` should additionally refuse to write a wrapped draft (prevention), or stay a passive-warning surface (post-hoc detection). The "documented surface fix" carve-out in the gate-parity wiki admits this; the design tradeoff is between shifting the author's inference (procedure refused my draft) vs. reinforcing it (validator named my error). Lean toward detection; raise as an open call for `product-owner`.
4. **What happens to the wiki's "silent-loss path" sentence.** Retire, rewrite, or keep as history. That is a step-14 wiki-ingest question.

**Wiki used:** `vault/wiki/index.md` (module map), `vault/wiki/engineering-board.md` (card frontmatter contract, residual-audit paragraph), `vault/wiki/gate-parity.md` (writer ⊆ loader ∪ dispatch invariant + documented-surface-fix carve-out).

**Wiki does not cover:** a FAIL-message style guide; the author-side vocabulary for "wrap" vs. "line break" vs. "continuation" (the procedure chose "wrap" and FLLWUP-43's copy chose "line break" — there is no wiki ruling); whether a procedural refusal at authoring time qualifies under the "documented surface fix" carve-out (the wiki's example is `.council.json`, not a procedure).


### Step 3 — round 2 positions (verbatim; exchange closed at 2 of ≤3 rounds)

Positions stabilised: all three generators converged on the positional rule (raw-line scan — only blank lines and the closing `---` may follow `goal`), raise-based loader refusal in `parse_frontmatter`, branch D (unclosed frontmatter) in scope with a distinct message, no unknown-key FAIL (owner withdrew it), and no continuation-folding. Remaining deltas are FAIL-copy details (designer's implementation-time call) and one agreed residual (mid-block colon-bearing continuation of a *non-goal* key) that all three classify the same way: document it, don't gate it. No third round was run — nothing left is a claim one more exchange would settle (council.md step 3, stop early on stabilisation).

Dispatches: `owner` job-6.4 (3.8m, 4 turns, total 94183 tok, cost≈$0.0083); `principal` job-6.5 (3.8m, 12 turns, total 618711 tok, cost≈$0.0325); `designer` job-6.6 (3.8m, 2 turns, total 43791 tok, cost≈$0.0230). Each was handed the others' round-1 positions via the card record.

---

#### owner (job-6.4)

**Approach.** I converge with principal on **option 2 (the positional rule)** and withdraw my round-1 unknown-key FAIL — his narrowing is correct and my R2 was over-broad. Verified against `council/validate.py:64-69`: the split-on-first-`: ` loop makes any colon-bearing continuation a *key*, and the loss only ever occurs when that key lands after `goal` (the card's subject); a bare-line refusal catches (i)/(ii), the no-key-after-goal rule catches (iii) deterministically, and together they cover every goal-wrap shape with zero vocabulary restriction. The colon-ban analogy is imperfect but the conclusion holds: an unknown-key ban additionally fires on intentional future keys where no loss exists (loader reads them losslessly, no consumer reads them — his exact point), whereas key-after-goal fires *only* on a wrap artifact or a misplaced goal, both real defects. Every shipped card's leading block is uniformly `id title state owner epic goal` (my awk pass; principal's "goal immediately followed by `---`" cross-confirms), so the positional rule codifies an already-documented convention (`_template.md:7`, `board-create-card.md`) rather than inventing one — that documented copy is precisely the "equivalent documented surface fix" branch, made concrete.

On the raise-vs-out-param question, **I flip to principal/designer's raise.** My round-1 rationale (harness stability) doesn't survive inspection: `parseGoal` at `test/fllwup43-goal-oracle.test.ts:88-103` shells to a subprocess, so a raise surfaces as a non-zero harness exit — and T7's parse assertions must be rewritten either way, so the out-param buys nothing. More decisively, principal's R2 (anti-bolt-on) is only satisfied *structurally* by a raise: an out-param still returns the truncated `goal` to any caller that ignores the failures list, which is the silent path surviving at the library level. `parse_frontmatter` raises on structural failure; `main()` catches per card and renders `FAIL:`. Branch D (unclosed block) rides the same raise — the loop then scans to EOF and the bare-line check fires on body prose.

**Responses to specific points:**

- **Principal's R5 (false positives / leading-block scoping): verified, and it strengthens loader placement.** `parse_frontmatter` breaks at the *first* closing `---`, so body-embedded fences (`FLLWUP-47.md`, `FLLWUP-49.md`) are never scanned — leading-block scoping is structural, not something the gate must add. Conversely, a `main()`-level raw-line scan over the whole file *would* be at risk of tripping on body fences. R5 is therefore an argument for exactly the in-loader placement all three seats converged on. No false positives: a shipped card with a bare line in its leading block would already FAIL today (missing keys), and validate passes — so bare-line, key-after-goal, and unclosed-block all have zero shipped instances.
- **Principal's R2 (loader-vs-gate test): adopted verbatim**, and with the raise design it can't be gamed — importing `parse_frontmatter` on the wrapped blob throws; no truncated dict exists to read.
- **Designer, call 1 (predicate location): resolved** — in `parse_frontmatter`, raising. **Call 2 (FAIL payload):** name line number + offending line text, plus designer's vocabulary constraint: reuse the procedure's own nouns — "wrap," "one line," "line break" — and the message for a key-after-goal should name both readings, e.g. `FAIL: <id>: frontmatter line N '<line>' comes after 'goal' — a wrapped goal continuation parses as a key; keep the goal on one line, and keep goal last in the block.` **Call 3 (authoring-time refusal):** agree with designer's lean — the procedure gains one clause stating the now-enforced rule (goal on one line, last key), but stays instructional; the validator is the enforcement surface. **Call 4 (wiki sentence):** step-14 ingest, not a design call — agreed.
- **Residual I want named that principal left loose:** option 2 does not catch a colon-bearing continuation of a *mid-block* key (e.g. `owner` wrapped with `: `, goal after it → spurious key before `goal`, silent). That's a non-goal field truncation, outside this card's goal sentence, and silent under bare-line-only too — but it must be recorded as the documented residual (copy + step-13 note) so it isn't rediscovered as a "new" hole. Catching it would require exactly the vocabulary/order strictness we just declined.

**Tradeoffs accepted.** A hypothetical card with a legal-but-unusual key order (goal not last) becomes red — zero exist today, the convention is already in shipped copy, and the alternative (my round-1 R2) imposed a vocabulary ban on consumers for loss the positional rule catches equally. Fail-fast per card (a wrap suppresses that card's board-drift findings for this run) — accepted; the wrap is the blocking diagnosis and other cards still report.

**Testable claims** (all red on today's tree except the two green-side pins):

1. **R1 (principal's form, adopted):** wrapped bare continuation after `goal` → exit 1, a `FAIL:` line naming the wrap and the offending line text — not merely `missing required key`.
2. **R4 (the discriminator, converges the dispute):** `goal: retry when the message is` + ` Rate limited: try again later` → exit 1 naming key-after-goal. Under my round-1 design this also passed, but via unknown-key; the converged design passes it via position — same red, narrower gate.
3. **R2 (anti-bolt-on, adopted):** direct `parse_frontmatter` on the wrapped blob must raise, not return a truncated dict.
4. **R3 (adopted):** wrap + `epic: null` after it → the diagnostic names the wrap, not the missing key.
5. **R5 (adopted):** exit 0 on all shipped cards (including the FLLWUP-47/49 body-fence files), 8 seed trees, and `smoke/fixture/council/`.
6. **Green-side pin that encodes my withdrawal:** an *intentional* extra key placed before `goal` (e.g. `labels: x` between `epic` and `goal`, single-line goal) → **exit 0**. This test fails under my round-1 unknown-key design and passes under the converged one — it is the executable record that no vocabulary ban shipped.
7. **T7 inversion:** the FLLWUP-43 residual pin (`test/fllwup43-goal-oracle.test.ts:196`) flips in the same change or the suite is self-contradictory (unchanged from round 1).

---

#### principal (job-6.5)

**Cross-seam reading** (verified on both sides, not remembered)

- The seam is singular, and I understated it in R1: `grep parse_frontmatter` returns exactly two callers — `council/validate.py` `main()` and the test harness at `test/fllwup43-goal-oracle.test.ts:88-103`. There is **no production consumer of the parsed dict**. So the "loader must refuse" argument cannot rest on a second consumer accepting what `main()` refuses; there is none. Corrected rationale below.
- The dispatch hop is prose, not code: `council/procedures/council.md` step 10 hands the judge *"the card's `goal` and the Skeptic's evidence — nothing else"* — the facilitator copies text, it does not call the parser. `council/preflight.sh` does **not** run validate.py; the code choke points are `.github/workflows/gates.yml` and the procedure checkpoints. So gate parity for cards is a *procedure-discipline* claim, not a code-matched one — worth stating plainly in the design record rather than leaving implied.
- Population seam the other seats verified on the wrong tree: the predicate runs from 10 byte-identical copies (`T3`), and consumer repos get it via `council/scaffold/council/validate.py`. `council/scaffold/` carries **no `procedures/`**, so consumer authors read the rule from the *packaged* `board-create-card.md` (always current, override-aware) — while their on-disk `_template.md` is frozen by non-clobbering. The rule must be documented in the procedure, not only the template.
- Positional invariant holds on every piece of shipped data I can read: all `council/cards/*.md` carry `goal:` followed by `---`; all 8 seed trees and all 10 `_template.md` copies likewise. Zero instances of key-after-goal.

**Blind spots, named separately**

- **owner (validator/import vantage):** sees the six keys, the 10 copies, the digests. Cannot see *whose* cards the predicate runs on — `FLLWUP-50.md` commits to bringing the tooling up to version "without overwriting consumer-edited board, cards, or wiki", and the scaffold never updates a consumer's `_template.md`. So "verified no existing card carries an extra key" was measured on the one tree where it is guaranteed true, and is silent about the tree that will execute it.
- **designer (surface vantage):** sees the FAIL line and the author's inference. Cannot see that the judge never receives parser output (council.md step 10), so the "same physical line the author edited" mapping is author-facing only, and `council/preflight.sh` not running validate.py means the runtime catch is the procedure checkpoint, not the start of a run.
- **principal (me), self-correcting:** R1 leaned on "exercised directly as a library by the harness" — a test is not a consumer. The load-bearing form of the anti-bolt-on test is: *`parse_frontmatter`'s docstring is the only statement of the grammar, and putting the check in `main()` creates a second, independently-maintained notion of validity — the exact FLLWUP-43 defect shape (docstring promised a check nobody wrote).* Same conclusion, honest ground.
- **any vantage reading only the card:** cannot see that the bare-line and missing-terminator failures are **indistinguishable from inside the scan** — both are "we are inside the block and this line is not `key: value`." That fact constrains the FAIL copy (owner's message names one hypothesis; there are two).

**Reframe**

The proposed design (refuse, diagnose, no fold) is sound; the mechanism for sub-case (iii) should change, and the standard of proof for false positives should move off this repo's cards.

1. **The fork: take option 2, sharpened to the raw line scan.** Not "`goal` is not the last key in the parsed dict" — that test is false-negative on the case that matters. `validate.py` overwrites on duplicate keys, so `goal: a card whose` / ` goal: field is wrapped …` compiles to `meta["goal"] = "field is wrapped …"` with **all six keys present and `goal` still last in insertion order**: exit 0 today, exit 0 under owner's unknown-key FAIL. The raw-line rule (`goal` may be followed only by blank lines and the closing `---`) catches both (iii-a) and (iii-b) with no key vocabulary at all. Residual documented, then none remains on (iii) — so the "documented residual" branch of the fork is unnecessary once the rule is stated positionally.
2. **Owner's unknown-key FAIL: decline, on dominance — on the population, not on this tree.** Coverage: it closes only the pseudo-key-∉-six half of (iii), which option 2 closes anyway; it does **not** close (iii-b). Cost: it invalidates any consumer card carrying an extra key, which the positional rule leaves green. What it uniquely buys is a key-shaped wrap of an *earlier* field (`title` wrapped, continuation `Priority: high`) — real, but outside this card's goal; if the council wants it, it is its own card, not a rider.
3. **Branch D: include it, but not because it is "the same structural class."** It isn't — a misparsed line loses the goal; a missing terminator loses nothing today. It is the same *seat in the grammar*, and its marginal coverage is exactly one corner: all-key-lines-to-EOF (no body, no closer). Its real justification is the grammar being stated once ("a block of key lines terminated by `---`"), which makes D a corollary rather than a branch.
4. **Out-param: falsified, and its stated benefit is not even a constraint.** To keep `T2`/`T2b`/`T6` green the param must be optional, and an optional param means the default path still returns the truncated dict — R2′ stays red. Those tests are in the change set anyway (`T7` is amended), so "keeps the harness working" is a preference, not a constraint. Raise a `FrontmatterError` carrying `(line_no, line_text, partial_meta)`; `main()` catches per card, emits the structural FAIL, and **still runs the `REQUIRED_KEYS` loop against `partial_meta`** so `T4`'s `missing required key 'goal'` stays green. `parse_frontmatter` never returns a dict for a block it would truncate.

**Designer's three open calls, resolved**

- **Predicate location:** in `parse_frontmatter`, as the raise above. Two `if`s inside the existing loop (`: ` in line after goal seen → positional; non-blank without `: ` → bare-line), plus a `closed` flag checked after the loop. No post-hoc regex in `main()`, no key-vocabulary table — so designer's prediction #3 is true by construction.
- **FAIL payload:** one line per card, existing `FAIL: <fname>: …` grammar, carrying line number + the offending text, echoing the procedure's vocabulary. Content requirement I'd fix now: the bare-line message must name **both** hypotheses, because they are indistinguishable from inside the scan — e.g. `FAIL: <f>: frontmatter line N '<text>' is not 'key: value' — a wrapped/continued value, or the closing '---' is missing (a line break ends the value; keep the goal on one line)`. Wording is the designer's; the two-hypothesis content is the design call. Suppress "not closed" when a bare-line violation already fired — one structural FAIL per card.
- **Authoring-time refusal:** detection only; do not invent a mechanical card writer. A procedure that machine-refuses to write is a new writer, which is precisely what [[gate-parity]] binds. §5's field order already implies goal-last; make it explicit in `board-create-card.md` (the copy that reaches every consumer), and correct the conflation my R1 named — "a line break ends the value **or** a line without the `key: value` shape" describes two different mechanisms.

**Testable claims**

- **R2′ (anti-bolt-on, decides the owner's out-param):** direct one-arg import call on the wrapped blob must not return a dict with `goal == "first part"`; it must refuse. Out-param design → red. Raise → green. `T2`/`T2b`/`T6` (legal blobs) unaffected either way.
- **R4b (the discriminator for the fork):** `goal: a card whose` / ` goal: field is wrapped is refused` — today `0`; option 2 → `1`; owner's unknown-key FAIL → still `0`. This single test adjudicates the fork.
- **R4a (control):** `goal: retry when the message is` + ` Rate limited: try again later` → `1`. Closes under both proposals; not a discriminator, include it so the record shows why.
- **R7 (consumer-shaped false positive, must stay green):** a card with a template-legal extra key (`priority: high`) **before** `goal` validates clean. Unknown-key FAIL turns this red; option 2 leaves it green. Encodes FLLWUP-50's consumer constraint.
- **R8 (terminator corner):** `---` + six key lines + EOF (no closer, no body) → `1` with the "not closed" message. A no-closer file **with** a body → `1` with the bare-line message, which is the same FAIL branch A produces — pin it so the recorded residual is "indistinguishable from a wrap," not "uncaught."
- **R9 (T4 preservation):** `goal:no-space-after-key` still prints `missing required key 'goal'`, optionally alongside the structural FAIL. Pins that the raise path feeds `partial_meta` back into the required-key loop.
- **R5′ (positional no-false-positive, shipped + template data):** every `^goal:` in `council/cards/**`, `council/scaffold/council/cards/**`, and `council/fixtures/*/seed/council/**` is followed by `^---$` — assert it in the suite rather than re-deriving it by grep (and it must survive `T3`/`T3b` byte-parity and the `T5` digest re-pin).

Unchanged from R1, one line each: no continuation-folding (the goal demands refusal); no `main()`-only check; `T3`/`T5`/`T5b`/`T6` mechanics as owner lists them, with the rubric left untouched (c3 already grades single-line) so `T8`'s pinned copy stays green.

---

#### designer (job-6.6)

**Design position.** Concur with owner and principal that the predicate lives in `parse_frontmatter` — open call 1 is settled by their convergence and my prediction 3 ("same predicate at every parse site") is satisfied because `parse_frontmatter` is the sole card-frontmatter parser in the repo. Where I depart from both: the *shape* of the predicate should be the **positional rule** ("after `goal:`, only `---` is acceptable"), not owner's bare-line-check-plus-unknown-key-FAIL and not principal's bare-line-with-documented-residual. The positional rule is the smallest predicate that closes both sub-case A and sub-case (iii) without teaching a false parser model.

**Gulf closed.** Gulf of Evaluation, for the card author, at the moment of `python3 council/validate.py`. The validator already trains the author to expect a `FAIL: <file>: <finding>` line — the wrap FAIL reuses that channel, so the author's existing mental model of "if the validator prints FAIL, that name is what is wrong" carries the new information without new learning. The author reads the FAIL, recognizes their own wrapped text quoted back at them, and reconnects to the procedure's prose — the FAIL is sufficient for recovery on its own.

**Principle and evidence.**

- **Why the positional rule, not the unknown-key FAIL.** Owner's unknown-key FAIL closes sub-case (iii) but it teaches the author to fix a *downstream symptom* ("there's a stray key called `Rate limited`") rather than the *cause* ("my goal was supposed to contain that text"). The positional rule's FAIL names the cause directly. Furthermore, the loader is syntactic today (splits on `: `); making it vocabulary-aware (key must be one of six) is a parser-character change beyond this card's scope. I read principal's "this is the colon-ban shape again" as wrong in literal claim (a key-vocabulary rule is not a content-colon ban) but right in *direction*: the minimal sufficient predicate is one that doesn't change what kind of parser this is.
- **Why the positional rule, not bare-line-with-documented-residual.** Principal's option 1 ships green on sub-case (iii). A pinned residual test does not change what the validator prints for a goal whose second line happens to contain `: `. "All council artifacts valid" on a goal that the author intended to include `Rate limited: try again later` is the silent-loss path this card exists to close. A residual pinned by a test is still a residual; the option that actually closes the named gulf is option 2.
- **Conceptual model the positional rule teaches.** "After goal, only `---`" mirrors the procedure's stated rule (`board-create-card.md`: "never wrap the goal onto a second line", "a line break ends the value") almost word-for-word, and `_template.md` already orders `goal:` last before `---`. The rule documents a structural truth that is already true of every shipped card (principal R5 verification). No template change; no consumer-repo break; the procedure copy and the template are unchanged.

- **FAIL line payload (open call 2).** Echo the procedure's vocabulary. Concrete format: `FAIL: <file>: line N '<line>' — goal is wrapped onto a second line; a line break ends the value (keep the goal on one line)`. Uses "wrap" and "second line" (the procedure's words) and "line break" / "value" (the FLLWUP-43 retraction's words). Includes the offending line quoted — the FAIL is sufficient for the author to recover without re-reading the procedure.

**Falsifiable predictions.**

- **R-positional-A (the card's core).** `parse_frontmatter` on the wrapped blob does not return `{"goal": "first part"}` — it raises. Pure-seam test importing `parse_frontmatter` directly; assert it refuses. Same shape as principal's R1/R2; if R1 goes green while R-positional-A stays red, the change is in `main()` only and is the gate-parity violation this card exists to prevent.
- **R-positional-B (sub-case iii).** `goal: retry when the message is` + ` Rate limited: try again later` raises the *same* predicate and emits a FAIL whose text contains "goal" and ("wrap" or "second line") — not "Rate limited" or "unknown key". Falsified if the FAIL names the spurious key instead of the wrap, which would mean the predicate is the unknown-key FAIL, not the positional rule.
- **R-positional-C (no colon-ban regression).** `goal: Rate limited: try again later` (single line, contains `: ` in value) still parses clean, exits 0. Mirrors T1 in `test/fllwup43-goal-oracle.test.ts`; protects the FLLWUP-43 retraction.
- **R-positional-D (body-embedded block guard).** `council/cards/FLLWUP-47.md` and `council/cards/FLLWUP-49.md` (which contain `---`-delimited card blocks in their bodies) still exit 0. The positional rule must be scoped to the leading frontmatter block — scanning the whole file would false-positive on body-embedded fences. This is the loader-bypass that would make the gate-parity constraint a lie.
- **R-positional-E (vocabulary echo).** FAIL line shares at least one of {wrap, second line, line break, value} with `board-create-card.md`. Falsified if the FAIL says "continuation" or "bare line" while the procedure says "wrap" — those are different parser models, and the FAIL would teach one while the prose teaches another.
- **R-positional-F (FAIL is distinct from branch D).** Wrap-after-goal and unclosed-frontmatter emit *different* FAIL messages. Falsified if both produce the same diagnostic, which would mean the predicate conflates two structural rules and the author can't tell what they were looking at.

**Branch D (unclosed frontmatter, owner's finding).** In scope. This is the same class of silent structural acceptance the card exists to close, and the predicate is a natural addition to `parse_frontmatter`'s contract: the leading frontmatter block must be terminated by `---`. Distinct FAIL message ("unclosed frontmatter" or "frontmatter not terminated by `---`") — R-positional-F enforces the distinction. Branch D does *not* get the procedure-copy treatment: there is no procedure copy about closing `---`, no vocabulary to echo, and `engineering-board.md` doesn't mention it — the wiki-ingest follow-up is mine to flag for step 14, not a design input.

**Open call 3 (authoring-time refusal).** Unchanged, in one line: out of scope. Owner and principal both place the gate at the loader; the procedure copy already says "never wrap"; adding a procedural refusal is a second surface for the same predicate, not a reinforcement — two surfaces to keep in sync, neither one strengthened. If the council wants defense-in-depth at authoring time, that is a separate card.

**Preferences, ranked last.**

- Including the wrapped line's text in the FAIL message is what I would want to read as the author — but the surrounding FAILs in `council/validate.py` are terser and don't quote offending content. Either reads; the testable claim is that the author can recover from the FAIL alone, not that the FAIL contains the snippet. Rank this below the vocabulary-echo claim.
- Tense of the FAIL verb ("is wrapped" vs. "wraps" vs. "wrapped"). I default to past participle to match `board-create-card.md`'s "never wrap the goal" register. Ungrounded.
- Whether the positional rule is expressed as a check on the *line after `goal:`* or on the *last parsed key in the block*. The latter is more robust if goal were ever to appear more than once; the former is more local and easier to read in the source. Lean line-after; ungrounded.


### Step 4 — Skeptic attacks and runs tests (job-6.7)

Dispatch: `skeptic` job-6.7 (25-min ceiling; settled 12.6m / 30 turns, total 1931922 tok, cost≈$0.0321). Subject: the deliberation record (rounds 1–2) at main `b09bc75` — no branch/PR exists; frame: step 4, before step 5 synthesis and steps 7–11. Read-only on the main repo; scratch trees under `/tmp` only. Verdict: **`no-block`** — every load-bearing factual claim survived its settling test.

## Objection table

| # | Claim attacked | Term | Result |
|---|---|---|---|
| O1 | Branch A: bare continuation after `goal` → silent truncation, exit 0 | `closed-green` | parse returns `{"goal": "first part"}`; full-tree validate exit 0 |
| O2 | Branch B: colon-bearing continuation → spurious key, exit 0 | `closed-green` | spurious key `note`, goal truncated, exit 0 |
| O3 | Branch C: mid-block wrap → loud missing-key FAIL | `closed-green` for the bare shape; **`closed-red` for the round-1 sentence as stated** | bare wrap → exit 1 missing-key cascade; **colon-bearing** mid-block shape exits 0 silently (spurious key, six keys survive). Record self-corrects in owner round-2's residual; verbatim round-1 copy is inaccurate |
| O4 | Branch D: unclosed frontmatter, six keys parse → exit 0 | `closed-green` | both sub-shapes exit 0 today |
| O5 | R4b leg 1: duplicate-goal overwrite → full dict, goal last, exit 0 today | `closed-green` | `goal = "field is wrapped is refused"`, exit 0 |
| O6 | R4b leg 2: positional raw-line rule catches it | `closed-green` | converged-design validator: exit 1 naming the wrap |
| O7 | R4b leg 3: withdrawn unknown-key FAIL would NOT catch it; `labels: x` before `goal` WOULD fire it | `closed-green` | dominance argument real: unknown-key misses R4b, false-positives on intentional keys |
| O8 | Converged design (raise + positional + distinct branch-D + no vocabulary) green on all shipped data | `closed-green` | 114 cards, 8 seed trees, smoke/fixture → all exit 0, including FLLWUP-47/49 body-embedded fences (never scanned; scan ends at first closing `---`) |
| O9 | Green-side pin: intentional extra key before `goal` → exit 0 | `closed-green` | `labels: x` between `epic` and `goal` → exit 0 |
| O10 | Single-line goal containing `: ` still validates clean (FLLWUP-43 retraction intact) | `closed-green` | T1-shape and all suite harness blobs parse clean |
| O11 | Parity mechanics: 10 copies byte-identical; 8 digests @ 1.1.0; T7 pins silent behavior and must flip in the same change | `closed-green` | T3/T3b/T5 pass today; T7's two assertions demonstrably flip under the converged design; T4's missing-key message survives via `partial_meta` |
| O12 | Nothing else in the suite asserts the silent wrap behavior | `closed-green` | wrap strings only in T7; whole-tree-green assertions elsewhere stay green under the converged design |
| O13 | Documented residual: mid-block colon-bearing continuation of a non-goal key is silent today AND silent under the converged design | `closed-green` | `owner:` wrapped with ` queue: …` before `goal` → exit 0 both parsers |
| O14 | "No cheap predicate catches it without the vocabulary/order strictness the council declined" | **`closed-red` as a blanket claim** | for the space-bearing sub-shape (` Rate limited: try again later` mid-block, before goal), a whitespace-in-key check or key-shape regex catches it with zero vocabulary and zero order rule. The council's decision (document, don't gate) remains defensible — those predicates catch only a sub-shape and change the parser's character — but the stated justification is imprecise and must be narrowed in the design record |
| O15 | Branch D gets a distinct FAIL message (R-positional-F) | `closed-green` | wrap-after-goal vs unclosed-without-body → distinct messages; unclosed-with-body emits the wrap/bare-line message (principal R8's pinned class, confirmed) |
| O16 | Ancillary facts (preflight doesn't run validate.py; engine never parses card frontmatter; scaffold has no procedures/; etc.) | all `closed-green` | verified by grep/read + preflight run |

Also executed as gate-integrity evidence: `bun test test/fllwup43-goal-oracle.test.ts` → 11 pass (T7 pins silent); full `bun test` → 894 pass / 2 skip / 0 fail; `bunx tsc --noEmit` → clean; `bash council/preflight.sh FLLWUP-51` → PASS; `python3 council/validate.py` → valid.

## Open (no test settles)

- Unclosed frontmatter whose body begins with a bare `---` line: exits 0 under both designs (the grammar cannot distinguish a body fence from the closer); uncaught-by-design, unpinned.
- Real consumer-repo population (FLLWUP-50's promise): data-greenness was measured on this repo's shipped trees only; a consumer tree with a legal-but-unusual key order (goal not last) goes red by design — documented tradeoff, no test can settle the future population.
- FAIL-copy vocabulary echo (designer R-positional-E) and one-FAIL-per-card suppression: implementation-time choices, no suite pin.
- Whether the whitespace-in-key predicate is "worth" gating the residual sub-shape: taste, declined; the decline is defensible, the reason given was only half right (O14).


### Step 5 — Consolidator synthesis (job-6.8, verbatim)

Dispatch: `consolidator` job-6.8 (15-min ceiling; settled 3.2m / 5 turns, total 142184 tok, cost≈$0.0127). Given the full record on this card (steps 1–4).

# Consolidator synthesis — FLLWUP-51, step 5

Grounding read: `council/cards/FLLWUP-51.md` (full record, steps 1–4), `vault/wiki/index.md`, `vault/wiki/gate-parity.md`, and `council/validate.py:46-68` (the `parse_frontmatter` loop as shipped).

## Agreed design

The loud gate is **the loader's own refusal**, not a post-hoc policy on a parsed dict.

- `council/validate.py::parse_frontmatter` **raises** a `FrontmatterError` carrying `(line_no, line_text, partial_meta)`; it never returns a dict for a block it would silently truncate. `main()` catches per card, emits the structural `FAIL:` line, and **still runs the `REQUIRED_KEYS` loop against `partial_meta`** so T4's `missing required key 'goal'` survives.
- The predicate is a **positional raw-line rule**: once `goal` has been seen, only blank lines and the closing `---` may follow. It is not "the last key in the parsed dict" and it carries **no key vocabulary** — no unknown-key FAIL.
- **Branch D (unclosed frontmatter) is in scope**, riding the same raise, with a **distinct FAIL message** from the wrap.
- **No continuation-folding** (lossless joining was considered and declined: the goal demands refusal, and folding would flip currently-FAILing mid-block wraps green).
- **Surfaces that move:** `council/validate.py` (+ its docstring, which currently documents a single-line goal that nothing enforces); `council/scaffold/council/validate.py` + the 8 `council/fixtures/<task>/seed/council/validate.py` copies, all byte-identical; 8 `fixture.json` `seed.treeDigest` re-pins with `fixtureVersion` 1.1.0 → 1.2.0; `council/procedures/board-create-card.md` (root copy only) with **goal-last made explicit** and the line-break/bare-line **conflation corrected**; `test/fllwup43-goal-oracle.test.ts` (**T7 flipped in the same change** + T5 fixtureVersion + header note); new `test/fllwup51-*.test.ts`.
- **Authoring-time refusal is out of scope** — detection at the validator only; inventing a machine-refusing procedure would create a *writer*, which is what gate parity binds.
- **Agreed documented residual:** a mid-block, colon-bearing continuation of a *non-goal* key stays silent today and stays silent under this design. All three seats classify it identically: record it (copy + step-13 note), do not gate it.
- One seat-supplied interpretation the wiki does not supply: for cards the gate-parity triple maps to **no code writer, loader = `parse_frontmatter`, dispatch = the prose-mediated judge** — so loader refusal *is* the matched surface, and card gate parity is a procedure-discipline claim, not a code-matched one. `vault/wiki/gate-parity.md` is written entirely about the `.council.json` triple and has no worked card example; every seat said so plainly.

## Settled disputes

**By the Skeptic's actual runs (job-6.7, main `b09bc75`):** O1–O16 as recorded at step 4 — branch A/B/D/R4b silence reproduced (O1/O2/O4/O5); positional rule catches R4b (O6); unknown-key FAIL dominance fact (O7); converged design green on 114 cards + 8 seeds + smoke fixture incl. FLLWUP-47/49 body fences (O8); green-side pins `labels: x` and single-line colon goal (O9/O10); parity mechanics and T7-flip necessity (O11); no other suite pin (O12); residual silent both sides (O13); distinct branch-D message (O15); ancillary facts (O16).

**By uncontested convergence across all three generators in round 2** (no test settles these, no seat dissents after seeing the others): raise over out-param (owner withdrew; principal's falsification accepted); predicate in `parse_frontmatter` not `main()` (designer open call 1, conceded); branch D in scope; no folding; authoring-time refusal out; residual document-not-gate; owner's `labels: x` green-side test as the record of the withdrawn unknown-key FAIL.

## Open judgment — for `product-owner`, escalating to `steward`

1. **Does the residual stay document-only now that the stated reason is half-refuted?** All three seats: document, don't gate. Skeptic O14 (`closed-red` as a blanket claim): for the **space-bearing** sub-shape a cheap whitespace-in-key check or key-shape regex catches it with zero vocabulary and zero order rule; the decline must rest on parser-character and sub-shape-coverage grounds, not impossibility. Whether a sub-shape with a cheap predicate deserves its own card is a values call.
2. **The consumer-population tradeoff.** A consumer card with a legal-but-unusual key order (goal not last) goes **red by design**. Owner: zero such cards exist here; goal-last already in shipped copy. Principal: measured on the one tree where it is guaranteed true; FLLWUP-50 commits to not overwriting consumer-edited data while non-clobbering scaffolding freezes a consumer's `_template.md`. No test can settle the future population.
3. **FAIL-copy deltas** — designer's implementation-time call, open judgment by construction: whether the message quotes the offending line's text; whether the bare-line message names *both* hypotheses (bare wrap vs missing terminator — indistinguishable from inside the scan); line-after-goal vs last-parsed-key expression; one-FAIL-per-card suppression; verb tense. No suite pin exists for the vocabulary echo (designer R-positional-E) or for suppression.
4. **Whether the card-domain gate-parity mapping is the house reading** (no writer, loader = `parse_frontmatter`, dispatch = prose judge; parity as procedure discipline). All three seats use it and the design does not depend on a ruling, but the wiki does not contain it — the step-13/14 record should be ruled on rather than assumed.

## Open objections — results that must be made green by the fix

- **O3, `closed-red` for the round-1 sentence as stated.** The colon-bearing mid-block sub-shape exits 0 silently with a spurious key while all six required keys survive. The spec must carry the corrected shape and the suite must pin it. Not run green by any test — the red result stands as the finding.
- **O14, `closed-red` as a blanket claim.** The design record must narrow the justification before it is written down. Fixable only by rewording the reason.
- **Unclosed frontmatter whose body begins with a bare `---`: exits 0 under both designs, currently unpinned.** The grammar cannot distinguish a body fence from the closer; the settling test cannot pass. The only paths are a documented-uncaught-by-design ruling **plus a pin** (R8-style) or not claiming it is handled. Needs a ruling, not a run.
- **The prototype/source gap.** Every green result attributed to the converged design (O6, O8, O9, O15) was produced by the Skeptic against a converged-shape validator built in `/tmp` scratch — not against this repo's source. The shipped change must reproduce those greens from the real file; that closes only at steps 8–9.
- **Tests named but not yet existing:** T7 inversion, the new `test/fllwup51-*.test.ts` set (R1, R2′ anti-bolt-on, R3, R4a, R4b, R5′, R7, R8, R9), T3 byte-parity, T5 re-pin + `fixtureVersion`. A change that lands T7 unflipped or `validate.py` patched in only one of 10 copies is a self-contradictory suite and a red gate.

## Is the card's own `goal` a faithful oracle for this card's judge?

**Partially — faithful for the hazard it names, strictly under-inclusive for the design agreed.** Stated as fact, since council.md step 10 dispatches `judge` on the goal sentence and the step-9 evidence and nothing else:

- Everything the goal asserts is test-true as written: silent truncation to the first line (O1), exit 0 today (O1, O2, O4, O5), a diagnostic naming the wrap (O6), red-first proof (O11: T7's assertions demonstrably flip). On that core the goal is a sound oracle.
- The goal does **not** reach: **branch D** (in scope, not "a goal wrapped onto a second line", and its FAIL deliberately does not name a wrap — O15); the green-side guarantees no seat is willing to break (**O9** no vocabulary ban, **O10** colon-in-single-line-goal intact); the parity mechanics (10 copies, 8 digest re-pins, `fixtureVersion`); the documented residual; the board-copy corrections. Roughly half the shipped scope is invisible to the judge.
- By council.md step 10's own rule ("if the goal is ambiguous without context, that ambiguity is a defect in the card's `goal` text — fix the card, don't widen the judge's input"), this is a `goal`-text defect, not a judge-input problem.

## Ready to hand off?

**Yes for implementation — with a recorded `product-owner` pass first.**

- **Not blocked:** mechanism, predicate, scope, surfaces and test set are all either test-settled or converged; a fresh `owner` reading only a spec carrying the Agreed design above could not reasonably reach two different implementations.
- **Needs a ruling at step 6:** judgment items 1–4 and the unclosed-frontmatter/body-fence case. None change the mechanism; all change what the record says; items 1 and 2 could come back later as a "newly discovered" hole.
- **Needs a goal-text decision, and it is the sharpest one:** either step 6 amends the `goal` to name branch D and the green-side guarantees, or step 10's verdict is rendered against an oracle silent on half the change. That is a `product-owner` call — and if the ruling turns on editing a promoted card's goal, `steward` is the escalation (the EPIC-9 residual run has a precedent for steward goal amendments: FLLWUP-43 ESC-1).

### Step 6 — routing (facilitator)

Phase-1 rulings checked first (`<escalation_contract>` step 1): run-2 R2 (merge), run-2 R3 (record push), follow-up confirmation re-homed to `product-owner`, FLLWUP-43 R1 (wrap out of FLLWUP-43's scope, loud gate owed as this card, gate-parity-consistent), FLLWUP-50 steward ESC-3 (supported refresh path, acceptance shape recorded). None of them answers the consolidator's items: FLLWUP-43 R1 ordered the loud gate built and constrained its parity, but did not rule the residual's sub-shape question (item 1), the consumer key-order consequence (item 2), FAIL-copy deltas (item 3), the card-domain gate-parity mapping as house reading (item 4), the unclosed-frontmatter/body-fence documented-uncaught ruling, or the goal-text amendment. ESC-3's acceptance shape (bring tooling current without overwriting consumer-edited board/cards/wiki) does not address a refreshed validator *refusing* a consumer card by design. Nothing is applied-and-cited beyond what it actually answers.

The consolidator left the card not ready to hand off. Per `<escalation_contract>` step 2 the facilitator does not dispatch `product-owner` or `steward`; it ends the turn with an `ESCALATION` report carrying facts and no recommendation. The card stays `Deliberating` (these are ruling-seat-addressable, not declined by both ruling seats); no `Needs Human` state is set. Nothing in steps 7–14 has run.


### Step 6 (continued) — rulings on the escalation, applied verbatim (`<escalation_contract>` step 3)

The orchestrator obtained rulings from `product-owner` (items 1–4) and
`steward` (item 5, goal amendment); resumed container appends them verbatim
and applies them as binding. The amended `goal:` line above replaces the
card's prior goal (goal-wording authority is `steward`'s, FLLWUP-43 ESC-1 /
EV-29 precedent; the card was `Deliberating`, so the amendment is legal).
Explicitly NOT in the oracle: the parity mechanics (10 byte-identical copies,
8 digest re-pins, `fixtureVersion` 1.1.0 → 1.2.0) and the board-copy
corrections — those stay governed by T3/T5, AGENTS.md #5, and this record.
The residual is a recorded stopgap, not permanent; a later card may gate it.

**PO item 1 — documented residual (Skeptic O14).** The residual stays document-only for this card and is filed as a step-13 follow-up card under EPIC-9; the design record's justification is narrowed from "would require vocabulary/order strictness we declined" to the precise parser-character + sub-shape-coverage defense (the cheap predicates catch only the space-bearing sub-shape and would reject whitespace-leading keys the loader currently accepts silently).

**PO item 2 — consumer-population consequence (positional rule, ESC-3).** Red-by-design is acceptable; FLLWUP-50's ESC-3 acceptance shape needs no rider. The new validator is correcting toward a contract the procedure copy has always stated (`board-create-card.md` §3, `_template.md` line 7) — a consumer card with goal-not-last was already outside the documented contract. ESC-3's "without overwriting" language governs content preservation, not validation strictness. Communication owed: step-14 wiki ingest must record the new positional rule and the FAIL message in `vault/wiki/engineering-board.md`; release notes must call out that `goal:` is now positional and that consumer cards must conform.

**PO item 3 — FAIL-copy deltas (all card-level, binding):**
1. Quote the offending line's text in the FAIL message.
2. The bare-line FAIL names both hypotheses — "wrapped value, or the closing `---` is missing" — because they are indistinguishable from inside the scan.
3. Express the rule as "line after `goal`" rather than "last parsed key".
4. One structural FAIL per card — suppress the "not closed" message when a bare-line FAIL already fired.
5. Vocabulary echo is required, with a suite pin — the FAIL MUST contain at least one of {wrap, second line, line break, value} shared with `board-create-card.md`.

**PO item 4 — unclosed frontmatter whose body begins with a bare `---`.** Pin it R8-style AND document it uncaught-by-design in the design record. The implementation adds an R8 test asserting: "leading frontmatter block missing closer + body line 1 is bare `---`" → exit 0 with all 6 keys (silent acceptance today; same under the converged design). The design record calls this out explicitly as a known residual.

**PO process requirement (binding, not a ruling).** Every green attributed to the converged design (O6/O8/O9/O15) came from a Skeptic scratch-tree prototype, not this repo's source. The owner must build against `council/validate.py`; the Skeptic must re-run all four gates plus its probes against the branch head — `bash council/preflight.sh` (prefer rerunning over trusting local-gate evidence, AGENTS.md #13), `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` — never against `/tmp` scratch trees.

**STEWARD item 5 — goal amended.** Final goal sentence, verbatim, to replace the current `goal:` line in `council/cards/FLLWUP-51.md` (legal because the card is `Deliberating`; goal-wording authority is `steward`'s, FLLWUP-43 ESC-1 / EV-29 precedent):

> A wrapped goal, a non-`key: value` line inside the frontmatter block, an unclosed frontmatter block, and a key following `goal:` in the block are each refused by `parse_frontmatter` and reported as a non-zero `council/validate.py` FAIL naming the defect rather than validating green, where a not-`key: value` line's diagnostic names both a wrapped/continued value and a missing closing `---` because the parser cannot tell them apart; single-line goals containing `: ` and cards carrying extra intentional keys before `goal:` parse clean; and the documented residual — a mid-block colon-bearing continuation of a non-goal key — is recorded in copy and pinned by a test but not gated.

Steward deltas from `product-owner`'s proposed text (only these four): (1) added "and reported as a non-zero `council/validate.py` FAIL … rather than validating green" — the current goal's crux is the silent exit 0, which the proposed sentence dropped entirely; (2) "with a distinct diagnostic" → "naming the defect" plus the both-readings explicitness, since "distinct diagnostic" per defect would be an over-claim; (3) "cards with extra intentional keys" → "before `goal:`", since the unqualified form is false for a key after `goal`; (4) backticks on `parse_frontmatter`. Explicitly NOT in the oracle: the parity mechanics (10 byte-identical copies, 8 digest re-pins, `fixtureVersion` 1.1.0→1.2.0) and the board-copy corrections — those stay governed by T3/T5, AGENTS.md #5, and the card record. The residual is a recorded stopgap, not permanent; the resumed record should say a later card may gate it.

All consolidator open-judgment items 1–4 are now closed by these rulings
(item 1 → PO item 1; item 2 → PO item 2; item 3 → PO item 3; item 4's
card-domain gate-parity mapping is recorded in the design spec as the working
interpretation all three seats used, per the consolidator's own note that the
design does not depend on a ruling). The unclosed-frontmatter/body-fence case
is closed by PO item 4. Continuing to step 7.

### Step 7 — settled design written and handed to one owner

Spec committed at
`docs/superpowers/specs/2026-09-18-FLLWUP-51-design.md` (commit `dadf448`).
Self-review: no placeholder text or TODOs; internally consistent with the
deliberation record and the PO/steward rulings (residual justification
carries PO item 1's narrowed wording verbatim; PO item 4's pinned residual
in §4.2 and R8; PO item 3's five copy deltas in §2 and R11/R12); scoped to
the amended `goal` (parity mechanics and copy corrections carried as
governed-by-T3/T5/record, not as oracle claims); unambiguous — an owner
reading only this file reaches one design (raise in `parse_frontmatter`,
positional raw-line rule, three structural predicates, exact surfaces and
test set). ### Step 8 — owner implementation (job-9.1)

Dispatch: `owner` job-9.1 (45-min ceiling; settled 12.7m / 35 turns, total
2529591 tok, cost≈$0.0779). Worktree
`/home/tista/codes/pi-council/.worktrees/fllwup-51` (`git worktree add`
only; main checkout untouched), branch `feat/fllwup-51-loud-wrap-gate`,
PR #70 open (observed directly via `gh pr view`), head SHA `09a8679`.
All four local gates observed by the owner from the worktree: preflight
PASS (run twice, AGENTS #13), `tsc --noEmit` clean, `bun test` 911 pass /
0 fail / 2 skip, `validate.py` valid. Red-first observed at base: 9 fail /
6 pass exactly as the plan predicted. Spec deviations: **none**; two
implementation notes recorded in the owner's report (R3 fires the bare-line
predicate first, per spec; R5′ scan scoped to leading frontmatter blocks
because body quotes of `goal:`-shaped lines are legitimate).
`In Review` set on the card and board from the observed PR artifact.

### Step 11 — deterministic merge check (run-2 R2/R3 substitution)

All five criteria checked directly, mechanically, no discretion: (1) owner
gates green in full — four gates from the worktree, re-run by the Skeptic
at head (the recorded environmental staleness red is FLLWUP-27-class,
content checks OK); (2) `gh pr checks 70` keyed on `workflow`:
`{"name":"gates","state":"SUCCESS","workflow":"gates"}` on head SHA
`09a8679`; (3) no blocking Skeptic objection (NO-BLOCK); (4) judge PASS;
(5) no `Needs Human` state, no outstanding ruling (PO items 1–4 + steward
item 5 applied and cited). Merged
`gh pr merge 70 --squash --admin --match-head-commit 09a8679…` under run-2
R2's run-scoped admin authorization, SHA-pinned; merged SHA `dee64c5`.

### Step 12 — synced, CI green on the merged SHA, card Done

`origin/main` fast-forwarded cleanly to `dee64c5` (no divergence, no
union-merge needed); local main updated `--ff-only`. Gates workflow on the
merged SHA `dee64c5`: **completed success** (observed via `gh run list`,
not a seat report). Card set `Done` on the card and `council/board.md`.
Step-13 follow-up owed (drafted there): the mid-block colon-bearing
residual gate card (PO item 1, EPIC-9) and the FLLWUP-27 staleness-clause
repair this card's verification re-exposed. Step-14 ingest owed: the
positional rule + FAIL message into `vault/wiki/engineering-board.md` (PO
item 2, via `/wiki-ingest`, never hand-edited).

### Step 9 — skeptic verification at the branch head (job-9.2)

Dispatch: `skeptic` job-9.2 (30-min ceiling; settled 12.5m / 27 turns,
total 1586046 tok, cost≈$0.0259). Subject pinned: PR #70 head
`09a8679d9a873cef3b025b5e358231e84064526f`, head worktree
`.worktrees/fllwup-51` (never the local `main` checkout); frame pinned:
step 9 precedes step 10 judging and step 11's mechanical merge. PO process
requirement applied: all four gates re-run from the head worktree, probes
against source, never `/tmp` scratch trees for gate results.

**Verdict: NO-BLOCK.** All spot-checks `closed-green`: spec §6 set exists
and passes (26/26 incl. flipped T7); R2′ raise proven; R4b, R8 three
shapes, R7, R10, R11, R12 verified by independent black-box probes; PO
items 1–4 landed verbatim (copy + spec documentation); parity mechanics
(10 identical copies `882582c9…`, 8 digests @1.2.0, rubric untouched,
root-only procedure copy); green side from source (root, 8 seeds, smoke
tree all exit 0; body fences included); version bump + PR-body release
call-out present. Gate-integrity injection: disabling the bare-line raise
turns exactly R1/R2′/R3/R8b/R11/R12 red — the tests bite where the
mechanism lives. `bun test` at head: 909 pass / 2 skip / 0 fail.

One **recorded environmental red, dispositioned not-blocked**: preflight's
branch-freshness check (`FAIL: local history does not descend from
origin/main`) is structurally unsatisfiable at the pinned head — the run's
own step-8 record push (`886fa54`) advanced `origin/main` past the step-7
base (`3646cd5`) after the PR head was pinned; all content checks in
preflight pass. This is the known finding class already carded as
FLLWUP-27 ("Preflight branch-freshness clause vs mid-card record pushes",
Backlog). No unverified delivery item remains; step 10 proceeds.

### Step 10 — judge verdict (job-9.3)

Dispatch: `judge` job-9.3 (15-min ceiling; settled 2.3m / 13 turns, total
209618 tok, cost≈$0.0173). Input: the amended `goal` sentence and the
Skeptic's step-9 evidence, nothing else. Subject pinned (PR #70 head
`09a8679`, head worktree); frame pinned (step 10 precedes step 11's
mechanical merge). **Verdict: PASS** — all six goal-enumerated behaviors
plus both green-side exceptions and the pinned residual verified against
the branch head: wrapped goal refused naming the wrap (R1/T7); bare
non-`key: value` line refused with both-hypotheses diagnostic; unclosed
block distinct FAIL (R8a); key after `goal:` refused (R2′/R3/R4b);
single-line `: ` goals and extra keys before `goal:` clean (T1/T2/R7);
mid-block colon-bearing residual recorded in copy, pinned by test, not
gated (R10). Supporting: 26/26 targeted tests, tsc clean, suite 909/2/0,
10 copies byte-identical, version 0.20.0, R11 vocabulary pin green.

### Step 13 — follow-up filed

**FLLWUP-62** ("Gate the mid-block colon-bearing frontmatter continuation
residual", Backlog, EPIC-9) — drafted and filed under PO item 1's ruling,
which both names the card and confirms the filing ("stays document-only
for this card and is filed as a step-13 follow-up card under EPIC-9");
that ruling was obtained from `product-owner` via the orchestrator per the
run's re-homed confirmation path. Not new: FLLWUP-27 (Backlog) already
cards the preflight staleness clause this card's verification re-exposed —
no duplicate filed. No designer finding went unfolded: all four designer
predictions were run as suite tests (R1–R12); the vocabulary echo and the
card-domain gate-parity mapping are recorded in the shipped spec and owed
to the wiki at step 14.

### Step 14 — ingest owed (recorded, not hand-edited)

Per PO item 2: the new positional rule and the FAIL message must be
recorded in `vault/wiki/engineering-board.md` — retiring the "real
remaining silent-loss path" sentence that names this card — via
`/wiki-ingest`, never hand-edited. In this run that ingest routes to the
orchestrator (EV-46/EV-47 are Backlog cards governing ingest at card
completion / run ledger; neither is this run's to hand-edit). The card
record carries the obligation; `vault/` was not touched.
