---
id: FLLWUP-51
title: Loud gate for a goal wrapped onto a second line
state: Deliberating
owner: null
epic: EPIC-9
goal: A goal wrapped onto a second line is detected loudly rather than silently truncated to its first line, so a wrapped goal is refused with a diagnostic naming the wrap instead of validating green, proven by a test that fails on today's silent-exit-0 behavior.
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

