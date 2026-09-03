# EV-10 Council Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite steps 1–2 of `council/procedures/features-new.md` so the epic/child decomposition is deliberated by the four SEATS-1 seats (`product-owner`, `designer`, `principal`, `skeptic`) in three waves with the facilitator routing, waiting, and aggregating verbatim — authoring nothing — and pin step 3's byte-identity with a regression test.

**Architecture:** The spec is the design; this plan is the execution order. Two files change: `council/procedures/features-new.md` (steps 1–2 only) and `test/prose.test.ts` (one new pin test). The pin test is written first against today's text (green), then steps 1–2 are rewritten (still green because step 3 is untouched), then a mutation red-proof demonstrates the pin can fail. No seat bodies, no engine code, no cards/board.

**Tech Stack:** bun, bun:test, TypeScript (strict via `bunx tsc --noEmit`), Python 3 (`council/validate.py`).

**Spec:** `docs/superpowers/specs/2026-09-03-EV-10-design.md` — the settled design; the plan argues from it and never re-derives it.

## Global Constraints

- **Step 3 byte-identical.** The block between `## 3. Draft-then-confirm` and `## 4. On approval` (589 bytes / 583 code points — the spec's "583 bytes" is a code-point count; 3 em dashes × 2 extra UTF-8 bytes) is pinned by test and must not move a single byte.
- **Steps 0, 4, 5 unchanged.** Only the step-1 and step-2 sections of `features-new.md` are rewritten.
- **No seat body changes. No engine changes. No card/board changes.**
- **EV-11 seam (scope guard).** Write NO round-cap/convergence/fallback language. The first pass is named **wave 1**; aggregation consumes "all recorded contributions"; the disagreement path is a **ruling dispatch, not an exchange round**. Leave room for EV-11's bounded-exchange text to insert between dispatch and aggregation.
- **Participating seats named explicitly (SEATS-1):** product-owner, designer, principal, skeptic.
- **Gates, in order, all four:** `bunx tsc --noEmit` clean; `bun test` full suite green (integration test stays gated off); `python3 council/validate.py` prints `All council artifacts valid`; the byte-identity pin test passes (part of `bun test`).
- **Commits:** Conventional Commits format. Branch `feat/ev10-council-decomposition` off `main` (9b256bc). Do NOT merge the PR, do NOT run the SMOKE-1 smoke run, do NOT poll CI.
- **Every `bash` call carries an explicit `timeout`.**

---

### Task 1: Step-3 byte-identity pin test (TDD)

**Files:**
- Modify: `test/prose.test.ts` (append one test + one fixture constant)
- Test: the new test itself

**Interfaces:**
- Consumes: `PKG_ROOT` from `../extensions/seats.ts` (already imported in `test/prose.test.ts`), `fs`/`path` (already imported).
- Produces: `STEP3_FIXTURE` constant and a test named `features-new step 3 is byte-identical to the settled draft-then-confirm block` that later tasks rely on to prove step 3 never moved.

- [ ] **Step 1: Extract the step-3 block from the current file**

Run from the worktree root:

```bash
python3 - <<'EOF'
text = open('council/procedures/features-new.md').read()
start = text.index('## 3. Draft-then-confirm')
end = text.index('## 4. On approval')
block = text[start:end]
print(len(block.encode()), "bytes")
print(repr(block))
EOF
```

Expected: `589 bytes` and the exact block text (starts `## 3. Draft-then-confirm — every card, no exceptions`, ends `silence means yes.\n\n`). This is the fixture.

- [ ] **Step 2: Write the pin test with the fixture embedded**

Append to `test/prose.test.ts` (template literal lines flush-left, no indentation; backticks inside the fixture escaped as `\``; the blank line before the closing backtick is the trailing `\n\n`):

```ts
const STEP3_FIXTURE = `## 3. Draft-then-confirm — every card, no exceptions

Reuse \`/board-create-card\`'s draft-then-confirm gate **for every card this
command produces, the epic included.** Present the full draft of the epic
and every child — complete frontmatter and \`Intent\` section, exactly as each
would be written to disk — to the human in one pass.

The human may edit any card, drop any child, or approve the set as-is.
**Write nothing to disk until the human approves.** There is no default
approval, no timeout that counts as consent, and no proceeding on the
assumption that silence means yes.

`;

test("features-new step 3 is byte-identical to the settled draft-then-confirm block", () => {
	const text = fs.readFileSync(
		path.join(PKG_ROOT, "council", "procedures", "features-new.md"),
		"utf-8",
	);
	const start = text.indexOf("## 3. Draft-then-confirm");
	const end = text.indexOf("## 4. On approval");
	expect(start, "step-3 heading must exist").toBeGreaterThan(-1);
	expect(end, "step-4 heading must exist").toBeGreaterThan(start);
	const shippedBlock = text.slice(start, end);
	expect(shippedBlock).toEqual(STEP3_FIXTURE);
});
```

To guarantee byte-exactness, generate the fixture from the file rather than retyping it: write the test body with a placeholder, then run a script that replaces the placeholder with the extracted block (escaping backticks), or paste the `repr` output from Step 1 directly. Verify with the test run in Step 3.

- [ ] **Step 3: Run the pin test — must be green against today's text**

Run: `bun test test/prose.test.ts`
Expected: the new test PASSES (the fixture equals today's step-3 block). This is the TDD "green on pre-change text" state the card requires.

- [ ] **Step 4: Red-proof — prove the pin can fail**

Temporarily mutate step 3 (e.g. change `no exceptions` to `no exceptions.` in the `## 3.` heading), run `bun test test/prose.test.ts`, confirm the pin test FAILS and names the block, then restore the file exactly and confirm the pin test is green again. This is the gate-integrity check: a pin that cannot go red is decoration.

- [ ] **Step 5: Commit**

```bash
git add test/prose.test.ts
git commit -m "test(procedure): pin features-new step 3 byte-identity"
```

---

### Task 2: Rewrite steps 1–2 of `council/procedures/features-new.md`

**Files:**
- Modify: `council/procedures/features-new.md` — replace the contiguous region from `## 1. Create the epic card` through the end of step 2 (just before `## 3. Draft-then-confirm`) with the text below. Steps 0, 3, 4, 5 untouched.

**Interfaces:**
- Consumes: the pin test from Task 1 (proves step 3 did not move).
- Produces: the rewritten steps 1–2 exactly as the spec's "The rewrite" section specifies.

- [ ] **Step 1: Replace the step-1 + step-2 region**

Old text (from `## 1. Create the epic card` to just before `## 3. Draft-then-confirm`) is replaced with:

````markdown
## 1. Create the epic card

Read `council/cards/_template.md` for the frontmatter shape and
`council/board.md` for current state, the same way `/board-create-card`
does. Assign the next `EPIC-<n>` id by scanning `council/cards/` for the
highest existing `EPIC-` number and incrementing (first one is `EPIC-1`).

The epic card's `goal` names what the whole feature delivers, not any one
child's slice of it — but you do not draft it. The epic goal is authored in
wave 1 of step 2 by `principal` as a one-line transcription of the human's
intake (`$ARGUMENTS`): the human is the author of what the product is for,
and principal transcribes it into the goal field. `epic: null` on the epic
card itself — only children point up at it.

## 2. Decompose into child cards

The decomposition is deliberated by the four seats SEATS-1 names —
`product-owner`, `designer`, `principal`, `skeptic` — in three waves. You
route, wait, aggregate verbatim, and author nothing.

**Wave 1 — `principal` authors the first decomposition artifact.**

Dispatch `principal` once with: the feature (`$ARGUMENTS`), the template,
the board, the assigned epic id, the procedural bars (goal falsifiability,
no colon-space sequence, state rules, Intent-surface rule, em-dash/board
rules), and the mandated output shape. The bars are the ones
`/board-create-card` steps 3–4 set: each child has a single testable `goal`
(falsifiable, not satisfiable by a stub, no colon-space sequence anywhere
in the value), `epic:` set to the epic's id, `state` `Ready` only if the
child is already detailed enough for the Council to deliberate on without
further clarification (otherwise `Backlog`), and the user-visible surface,
if any, named in the child's `Intent` — which screen, which copy, which
state. Principal's output, in its native `Reframe` format:

- the **child decomposition** — the slicing, with per-child `goal`, `state`
  (proposed `Backlog` or `Ready`), and surface flag;
- the **epic goal** — a one-line transcription of the human's intake.

**Wave 2 — `skeptic` + `designer` attack in parallel.**

Dispatch both with **identical input** (principal's artifact), each in its
native format, with the completeness charter. Independence preserved: no
input contains another seat's critique.

- `skeptic` attacks each `goal` for falsifiability / stub-satisfiability /
  colon-space and each `state` against the Ready-vs-Backlog bar, with
  runnable checks against the draft text itself.
- `designer` flags which children are surface-touching and argues the
  `Intent` must name the screen/copy/state, in its native `Design position`
  format.

**Completeness charter (scoped per-seat).** Attacking seats attack what's
missing as well as what's there; a wholesale rejection of the slicing is a
named disagreement, not a patch request. The charter is scoped so it never
collides with a seat's own body:

- `skeptic` attacks completeness **only in falsifiable form** — e.g. a goal
  satisfiable by a stub, a child whose `state` cannot be deliberated. It
  never files an observational "missing child" objection, because its
  `<how_an_objection_counts>` requires a runnable settling test and a
  missing child has none.
- `principal` and `designer` carry the **observational missing-child
  arguments** in their native formats (principal: seam-cut observations;
  designer: what the person needs).

**Wave 3 — `product-owner` rules, last, unconditionally.**

Dispatch `product-owner` with the amended draft + the disagreement ledger.
Ruling-only:

- ratify or amend the **epic goal** and each child's **`state`**;
- rule each open-judgment dispute the attackers surfaced, **dissent named**,
  in its `Ruling` / `Options rejected` / `Grounding` / `Reversibility`
  format;
- escalate what its `<escalation>` forbids (portfolio change, reversing a
  recorded human decision, the goal itself is the defect) to the human per
  SEATS-1.

It never re-slices children and never rewrites undisputed child goals — that
boundary is what keeps it ruling, not generating.

**Aggregation.** Aggregate **all recorded contributions** verbatim, labeled
by seat, by mechanical concordance — children aligned by stated scope,
agreeing elements drafted from the agreement and attributed to the seats
whose text produced them, single-source elements attributed to their
proposer, and every conflicting position recorded as a **named
disagreement** with both sides and their job ids. Never paraphrase a seat's
line and never resolve a disagreement. You author nothing at any step.

**Attribution and the disagreement ledger** live at the step-3 gate
presentation and the `runs/` transcript, **never in card files**. The gate
presentation has two clearly-separated parts: (1) the card text exactly as
it will be written, and (2) a clearly-separate, never-written ledger
surface — per-card `Contributors:` line naming every seat whose dispatch
produced a substantive contribution; a `Disagreements:` block listing any
seat that did not endorse the card as drafted, each disagreement a one- or
two-line note naming the seat and the dimension (scope, testability,
surface, state-assignment), verbatim or a faithful ≤2-line restatement;
and a `Decision: unresolved — your call` marker on every line of the
disagreement block. The ledger is **presented, never written** — it does
not survive onto the on-disk card.

**Dispatch discipline.** Every dispatch is bounded: `council_dispatch` →
note the returned job id → `council_wait` with a window → on stall, cancel
+ one re-dispatch with the same input → on double-fail, stop and surface to
the human. Job ids are on record.
````

- [ ] **Step 2: Verify step 3 is byte-identical — pin test still green**

Run: `bun test test/prose.test.ts`
Expected: the pin test PASSES (step 3 untouched by the rewrite). Also confirm the file still ends with the same step-4/step-5 text and that `## 3. Draft-then-confirm` and `## 4. On approval` headings are unchanged.

- [ ] **Step 3: Commit**

```bash
git add council/procedures/features-new.md
git commit -m "feat(procedure): council-decomposed features-new steps 1-2"
```

---

### Task 3: Full gates, push, PR

**Files:** none (verification + delivery).

- [ ] **Step 1: Gate 1 — typecheck**

Run: `bunx tsc --noEmit`
Expected: clean, no output, exit 0.

- [ ] **Step 2: Gate 2 — full test suite**

Run: `bun test`
Expected: all pass, integration test still skipped (2 skip), 0 fail. The pin test is part of this run.

- [ ] **Step 3: Gate 3 — validate.py**

Run: `python3 council/validate.py`
Expected: prints `All council artifacts valid`.

- [ ] **Step 4: Gate 4 — pin test (already covered by Step 2; re-run explicitly for the record)**

Run: `bun test test/prose.test.ts`
Expected: pin test green.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin feat/ev10-council-decomposition
gh pr create --title "feat(procedure): council-decomposed features-new steps 1-2" --body "..." --base main
```

PR body: summarize the change (steps 1–2 rewritten to the three-wave seated decomposition per SEATS-1; facilitator routes/aggregates verbatim and authors nothing; step 3 byte-identity pinned by test) and cite the spec (`docs/superpowers/specs/2026-09-03-EV-10-design.md`). Do NOT merge. Do NOT run the SMOKE-1 smoke run. Do NOT poll CI.

- [ ] **Step 6: Report**

Report per the owner output format: approach, tradeoffs, and the real gate outputs (paste actual output of each gate), branch name, PR URL, and diff summary.
