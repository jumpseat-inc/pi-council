# EV-11 — Bounded Decomposition Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development; implement task-by-task with the red→green cycle. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bound the `/features-new` decomposition session at three waves = three rounds with an explicit convergence criterion and a mechanical-verbatim-aggregation fallback, per the settled EV-11 design.

**Architecture:** Three prose insertions into `council/procedures/features-new.md` step 2 only: (1) one intro no-exchange sentence before Wave 1; (2) one `**Bounded session and fallback.**` block between the Wave 3 paragraph and `**Aggregation.**`; (3) the session status line as the closing text of the Part 2 ledger-description paragraph, directly after the existing "presented, never written" guard. Step 3 stays byte-identical. Prose pins in `test/prose.test.ts` enforce the design; all gates run inside the worktree.

**Tech Stack:** None new — markdown procedure text + existing `bun:test` prose pins (`flat = text.replace(/\s+/g, " ")`), `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`.

**Spec:** `docs/superpowers/specs/2026-09-03-EV-11-design.md` (authoritative; includes the binding STEP-6 product-owner ruling quoted verbatim). Card: `council/cards/EV-11.md` (rulings CAP-1, FALLBACK-1, STEP-6 on the face).

## Global Constraints

- Worktree only: branch `feat/ev11-bounded-session`, never `main`.
- Edit step 2 of `council/procedures/features-new.md` ONLY. Steps 0/1/4/5 untouched; `## N.` heading set unchanged (steps 0–5); step 3 byte-identical (existing `STEP3_FIXTURE` pin must stay green).
- No new gate, no third presentation part.
- No `bun`, `bunx`, `typescript`, `tsc` words anywhere in council prose (stack-pin); no `registry`, `named agent`, `deliver.md`, product-domain words (existing pins).
- Post-Wave-3 seam block carries ONLY the convergence criterion + fallback outcome — no status line, no "presented, never written" restatement.
- The criterion must NOT contain "or explicit escalation"; the status line must NOT contain "every disagreement".
- The status line is presentation-only: Part 2 ledger line, never Part 1 card text, never `Intent`, never persisted.
- Gates (in order, all inside the worktree): `bunx tsc --noEmit` clean → `bun test` green (no `COUNCIL_INTEGRATION=1`) → `python3 council/validate.py` → boot+health (N/A: no server in this repo; the validate gate is the third gate per repo records). Push branch + open PR, do not merge.

---

### Task 1: Add the EV-11 prose pins (RED)

**Files:**
- Modify: `test/prose.test.ts` — append four new tests after the existing attribution-free pin (do not modify or delete any existing pin).
- Test: `test/prose.test.ts`

- [ ] **Step 1: Write the failing pins.** Mirror the existing whitespace-flattened style (`flat = text.replace(/\s+/g, " ")`), single quotes, tabs; reuse the `fs`/`path`/`PKG_ROOT` imports already present. Four tests:

  1. **Cap + no-re-dispatch siting.** `flat` contains "three waves = three rounds" and "same numeric cap"; `flat.indexOf("no seat is re-dispatched to respond to another seat's position") < flat.indexOf("Wave 1")`; sentence-split co-occurrence: the sentence containing the no-re-dispatch clause also contains "a stall re-dispatch is a retry, not a round".
  2. **Convergence criterion.** `flat` contains "a named dissent is not non-convergence", "zero open in-scope judgments remain after wave 3", "unruled by product-owner", "not settled by a runnable check", "is the fallback's canonical content", "unresolved disagreement for the human"; does NOT contain "or explicit escalation".
  3. **No-early-stop.** `flat` contains "convergence is recorded at the fixed endpoint", "product-owner always runs last", "no early stop", and "stop early if stabilised"; the sentence containing "stop early if stabilised" also contains "not imported".
  4. **Fallback outcome.** The region between `flat.indexOf("**Bounded session and fallback.**")` and `flat.indexOf("**Aggregation.**")` contains "aggregate", "labeled unresolved", "existing approval gate", "no new gate", and "Needs Human"; the sentence containing "double-fail" also contains "not the fallback".
  5. **Status line.** `flat` contains "Session status: Non-converged after 3 rounds", "this is a fallback draft", "Ledger only — presented, never written"; does NOT contain "every disagreement"; siting: status index after `**Attribution and the disagreement ledger**` and before `**Part 1 card drafts must be attribution-free.**`; adjacency: `|statusIdx − flat.indexOf("presented, never written")| ≤ 200`; seam-block negative: the region between `**Wave 3 —` and `**Aggregation.**` contains neither "Session status" nor "presented, never written".

- [ ] **Step 2: Verify RED.** Run `bun test test/prose.test.ts`. Expected: existing 7 tests pass; the new pins FAIL (bound text does not exist today). Every new failure must be a `toContain`/siting assertion failure, not a test error.

### Task 2: Implement the three insertions (GREEN)

**Files:**
- Modify: `council/procedures/features-new.md` — step 2 only, three loci.

- [ ] **Step 1: Insertion 1 — intro no-exchange sentence**, immediately after "in three waves. You route, wait, aggregate verbatim, and author nothing." and before the `**Wave 1 —` heading (same paragraph):

  ```
  The session is bounded at three waves = three rounds, the same numeric cap `/council`'s step 3 exchange uses: no seat is re-dispatched to respond to another seat's position — no wave is re-run, no fourth dispatch, and a stall re-dispatch is a retry, not a round; disagreements are ruled in wave 3, never exchanged.
  ```

- [ ] **Step 2: Insertion 2 — post-Wave-3 bound block**, after the Wave 3 paragraph, before `**Aggregation.**`, as its own paragraph:

  ```
  **Bounded session and fallback.** Convergence is recorded at the fixed endpoint after wave 3 — product-owner always runs last, and there is no early stop: council.md's "stop early if stabilised" is not imported here. The session has converged when wave 3 has ruled every open-judgment dispute the attackers surfaced — zero open in-scope judgments remain after wave 3, where open means unruled by product-owner and not settled by a runnable check. A named dissent is not non-convergence: a named, ruled dissent is a converged run. An escalated, unruled item is non-converged by construction and is the fallback's canonical content — it rides to the step-3 gate as an unresolved disagreement for the human. If the cap is hit without convergence, the facilitator drafts the decomposition anyway: the fallback draft is the mechanical verbatim aggregate of all recorded contributions, including wave 3's amendments — never facilitator-authored synthesis, never a most-advanced-seat position as base. Every open disagreement is carried into the step-3 draft pass labeled unresolved, for the human to settle at the existing approval gate — no new gate, no `Needs Human` stop. The dispatch discipline's double-fail stop is an incomplete-run outcome, not the fallback.
  ```

- [ ] **Step 3: Insertion 3 — session status line**, inside the Part 2 ledger-description paragraph, directly after the guard sentence "The ledger is **presented, never written** — it does not survive onto the on-disk card." (same paragraph, as its closing text, verbatim per the STEP-6 ruling):

  ```
  Session status: Non-converged after 3 rounds — this is a fallback draft. The unresolved items below are for your decision at the existing approval gate. Ledger only — presented, never written.
  ```

- [ ] **Step 4: Verify GREEN.** Run `bun test test/prose.test.ts`. Expected: all tests pass (existing 7 + new 5).

### Task 3: Full gates

- [ ] **Step 1:** `bunx tsc --noEmit` — clean, exit 0.
- [ ] **Step 2:** `bun test` — full suite green; integration test stays gated off (274 pass, 2 skip, 0 fail expected; suite count may differ only if the suite changed upstream — nothing here changes engine code).
- [ ] **Step 3:** `python3 council/validate.py` — prints `All council artifacts valid`.
- [ ] **Step 4:** Re-read the spec's Test plan and confirm every pin's intent is met by the landed text (status line siting, seam-block negative, cap-parity, escalation dogwatch, no-early-stop, STEP3_FIXTURE untouched).

### Task 4: Commit, push, open PR

- [ ] **Step 1:** Commit `test/prose.test.ts`, `council/procedures/features-new.md`, and this plan, Conventional Commits message: `feat(features-new): bound the decomposition session at three waves with convergence/fallback (EV-11)`.
- [ ] **Step 2:** `git push -u origin feat/ev11-bounded-session`.
- [ ] **Step 3:** `gh pr create` with the same title; do NOT merge; do NOT touch `council/board.md` or `council/cards/`; do NOT commit to `main`.