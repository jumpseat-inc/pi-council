# EV-34: Tool-Call Unit Rendering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the inline progress transcript (`TranscriptView`, the body `renderProgress`/`ensureView` hosts), each tool call and its own result render as one composed unit — head `→ <Tool>  <primary-arg>` (`warning`), `muted " ✗"` appended when the paired result has `isError === true`, the result body indented 2 spaces only when expanded, the inline empty state worded `(waiting for output · idle)` — with legacy/unpaired blocks still rendering without throwing.

**Architecture:** `TranscriptView` (extensions/navigator.ts) gains a unit model: `buildUnits()` folds `toolCall` blocks with the `toolResult` block paired by `toolCallId` (first match wins; `toolCallId` must be non-null on both sides so legacy/no-identity blocks never cross-pair) into `{ kind: "toolCall", call, result? }` units; every other block is a `{ kind: "single" }` unit rendered exactly as today. `visible()` becomes unit-based; `focused`/`expanded` re-key from block index to unit index (same drift semantics as today — the deeper focus rework is EV-35, out of scope). `blockLines` becomes `unitLines`: the toolCall branch composes the R-COPY head and appends `muted " ✗"` when `result?.isError === true` (also for an unpaired errored result — the card's "a failed result is marked" language covers every result); the single branch keeps today's heads, collapsed dim preview, and expand behavior verbatim. The argument in the composed head comes only from the exported `firstArgOf(block)` — no second derivation (EV-33 PO ruling D1; this card is that accessor's second production consumer).

**Tech Stack:** TypeScript (strict), bun:test, pi-tui (`truncateToWidth`, `wrapTextWithAnsi`), theme tokens via `NavTheme.fg/bold` only.

**Spec:** The card text (EV-34, EPIC-8) + binding Phase 1 rulings R-COPY / R-MODAL / R-GATES / R-ORDER as quoted in the delivery brief. No separate design spec file exists or is expected (mechanical card).

## Global Constraints

- Inline progress surface only; the legacy modal path stays guarded at navigator.ts:57 (R-MODAL, FLLWUP-4). No renderer fork, no modal-specific variant.
- Composed head copy (R-COPY, verbatim): `→ <Tool>  <primary-arg>` — two spaces between tool name and primary arg; failed result appends `muted "✗"`; expanded result body indented 2 spaces beneath the head; empty inline state `(waiting for output · idle)`.
- No new theme tokens, no literal hex/ANSI, no blank-line gutters (AGENTS.md 9.6; `test/theme-compliance.test.ts` stays green).
- `firstArgOf` is the only primary-argument derivation; it must be consumed, not re-derived.
- TDD: failing rendered-line test first (AGENTS.md Testing conventions).
- Gates (R-GATES, in order): `bash council/preflight.sh`, `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`. Integration test stays behind `COUNCIL_INTEGRATION=1`.
- Conventional Commits; branch `feat/ev-34-tool-call-unit` based on `a75b3c3`; PR against `main`.

---

### Task 1: Failing rendered-line tests (RED)

**Files:**
- Test: `test/ev34-tool-unit.test.ts` (create)

**Interfaces:**
- Consumes: `TranscriptView` from `../extensions/navigator.ts`, `NavTheme`, `firstArgOf` from `../extensions/transcript.ts`.
- Produces: none (assertion-only); the fixtures pin R-COPY copy for Task 2.

- [ ] **Step 1: Write the failing tests**

Four tests over fresh `fs.mkdtempSync` fixtures (never the real repo):

1. **Paired units at width 80** — fixture: header + toolCall `c1` name `bash` args `{command:"echo one"}` + toolResult `c1` isError false `one` + toolCall `c2` args `{command:"echo two"}` + toolResult `c2` isError true `boom`. Collapsed `render(80)`: a line contains `→ bash  echo one` with no `✗`; a line contains `→ bash  echo two` AND `✗`; no line matches `⎿ bash` (results folded, not separate lines); `boom` not visible collapsed. Then down+`e` on the failed unit: a line trims to `boom` with a 2-space indent; collapsed-hidden text stays hidden for the success unit (`one` never shown collapsed).
2. **Legacy fixture (no identity fields) renders without throwing** — toolCall part with no `id`, toolResult message with no `toolCallId`/`isError`: `render(80)` succeeds, head `→ bash  ls` present, unpaired result still renders as its own `⎿ bash ·` unit, no `✗`.
3. **Unpaired failed result keeps ✗** — toolResult with `toolCallId:"c"`, `isError:true`, no matching call: line contains `⎿ bash` and `✗`, renders without throwing, expandable (body `boom` after down+`e`).
4. **Empty-state copy** — view over a header-only file shows `(waiting for output · idle)`; the no-file view still shows `(no transcript)`.

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/ev34-tool-unit.test.ts`
Expected: FAIL on the composed-head assertions (current code renders `→ bash` with no argument, separate `⎿ bash · 3b` result lines, `…` empty-state copy). Record exact failing output for the report.

### Task 2: Composed tool-call unit in TranscriptView (GREEN)

**Files:**
- Modify: `extensions/navigator.ts` (`TranscriptView` class: unit model, `unitLines`, `render`, empty-state copy)
- Test: `test/ev34-tool-unit.test.ts` (from Task 1)

**Interfaces:**
- Consumes: `firstArgOf(block: TranscriptBlock): string` (extensions/transcript.ts, EV-33 export); `toolCallId`/`isError` fields on `TranscriptBlock`.
- Produces: no new public API — `TranscriptView` keeps its constructor, `handleInput`, `render`, `setOnChange`, `dispose` signatures byte-for-byte (T11 parity + theme-repaint tests depend on them).

- [ ] **Step 1: Implement the unit model**

Module-local `type ToolUnit = { kind: "single"; b: TranscriptBlock } | { kind: "toolCall"; call: TranscriptBlock; result?: TranscriptBlock }`. `buildUnits()`: collect `toolResult` blocks with non-null `toolCallId` into a first-match map; walk blocks — `toolCall` with non-null id emits a folded unit (consuming its result, if any); a consumed result is skipped; everything else is a single unit.

- [ ] **Step 2: Re-key visible/focus/expand on units**

`visible()` returns units filtered by the same thinking rule (a `single` thinking unit is hidden unless `showThinking`); `focused` indexes visible units; `expanded` holds unit indices; `e` toggles the focused unit index. `render()` builds per-unit `starts` exactly as today.

- [ ] **Step 3: Implement `unitLines`**

toolCall branch: `let head = t.fg("warning", arg ? `→ ${call.label}  ${arg}` : `→ ${call.label}`)` with `arg = firstArgOf(call)`; if `result?.isError === true` append `t.fg("muted", " ✗")`; `truncateToWidth(head, width)`; when expanded and a result exists, body = `result.detail ?? ""` split/capped/wrapped exactly like today's body path (`  ` prefix, 200-line cap, dim truncation notice). Single branch: today's `blockLines` logic verbatim (same tokens, same collapsed dim preview, same expand body), plus `✗` appended for an unpaired `toolResult` with `isError === true`.

- [ ] **Step 4: Empty-state copy**

`"  (waiting for output · idle)"` when a tail exists, `"  (no transcript)"` unchanged otherwise.

- [ ] **Step 5: Run all transcript/navigator suites green**

Run: `bun test test/ev34-tool-unit.test.ts test/navigator.test.ts test/ev9-progress.test.ts test/theme-compliance.test.ts test/theme-repaint.test.ts test/ev7-council-tree-widget.test.ts test/transcript.test.ts`
Expected: PASS (navigator.test's unpaired fixture stays renderable + expandable; T11 parity holds because both sides are the same class; theme audit sees only `warning`/`muted`/`dim` tokens).

- [ ] **Step 6: Commit**

```bash
git add extensions/navigator.ts test/ev34-tool-unit.test.ts docs/superpowers/plans/2026-09-15-ev34-tool-call-unit-rendering.md
git commit -m "feat(navigator): fold each tool call and its result into one rendered unit (EV-34)"
```

### Task 3: Gates, push, PR

**Files:** none new.

- [ ] **Step 1: Run R-GATES in order at branch head**

`bash council/preflight.sh` → `bunx tsc --noEmit` → `bun test` → `python3 council/validate.py`. A `FAIL: local history does not descend from origin/main` line is the by-construction FLLWUP-27 artifact (record commits advanced local main past the base); any other `FAIL:` line is real and stops the card.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin feat/ev-34-tool-call-unit
gh pr create --base main --title "feat(navigator): fold each tool call and its result into one rendered unit (EV-34)" --body <card summary + gate evidence>
```

## Self-Review

- Spec coverage: composed head + arg (Task 2 Step 3), ✗ token (Step 3), fold/indent (Steps 1/3), unpaired + legacy non-throwing (Steps 1/3 + Task 1 tests 2–3), empty state (Step 4), collapsed-first/`e` survival (Task 1 test 1 + Step 5 run of navigator.test), no new tokens (Step 5 theme suites), gates + PR (Task 3). ✔
- Placeholder scan: no TBD/TODO; all code shapes given. ✔
- Type consistency: `ToolUnit` used by `buildUnits`/`unitLines`/`visible` consistently; `firstArgOf` signature matches transcript.ts export. ✔
