# EV-67 Gate Verdict Line — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** At `/features-new` step 4 (draft-then-confirm), every card of a gate-enabled run renders exactly one additional line naming the resolved mode and the recorded one-line basis; a test proves the approve/edit/drop options and the printed card body are byte-identical to the pre-gate rendering.

**Architecture:** The format string `decisionLine` lives at the record layer (`extensions/gate-ledger.ts` — the only module owning a `Mode: `-prefixed format expression). A new pure-leaf module `extensions/gate-render.ts` joins the step-3 per-card `{ id, callId, status }` array against one `readGateLedger` pass by `callId` and exposes the parent tool `council_gate_render` (registered in `index.ts`'s parent block, never `registerHubTools`). The tool takes no card text, does zero writes, loads no policy. `features-new.md` gets a step-3 mandate rewrite (the render happens at step 4) and an additive step-4 block; the EV-66 ledger-source canary is amended to the role-enumerated accessor allowlist.

**Tech Stack:** TypeScript (strict, `bunx tsc --noEmit`), bun:test, typebox tool schemas, pi `ExtensionAPI`.

**Spec:** docs/superpowers/specs/2026-09-19-EV-67-design.md (the plan argues from the spec; executors read both)

## Global Constraints

- Format string byte-exact: `"Mode: " + resolvedMode + " — " + basis`, separator is the em dash U+2014 (spaces on both sides).
- A′: absent basis (v1 line) → `"Mode: " + resolvedMode` alone — no separator, no `undefined`/`null`/`NaN` byte anywhere.
- Fallback basis constants (byte-exact, TS-authored): `"gate call failed before recording a verdict"` (cell B) and `"recorded gate call not found in ledger"` (cell C), both fed through `decisionLine` with `resolvedMode: "Deliberate"` — never a separate format branch.
- Fallback literals carry no imperative verb and never gesture at the scrubbed transport reason (O1: the imperative scan is scoped to these constants only, never `decisionLine` output).
- `extensions/gate-render.ts` is a pure leaf: imports `readGateLedger` + `decisionLine` from `gate-ledger.ts` and NOTHING else; no `loadGatePolicy`, no `appendGateCall`/`appendGateOutcome`, no widget calls, no card-text schema fields.
- Join key is `callId` only — never `stateHash`.
- The `council_gate` tool (EV-66 opacity) is untouched; its existing tests pass unmodified.
- Procedure pins: step 3 keeps `recorded, never acted on` byte-preserved and the `## 3.`/`## 4.` heading order; step 4's pre-existing presentation sentence is byte-unchanged; no `council_dispatch`/`council_wait` after `## 3.`.
- TDD per AGENTS.md: every mechanism task writes its failing test first, observes red, then implements.

## Review Focus

- A v1 ledger line (pre-EV-65, no `basis`) rendered at step 4 — a reader expects the mode token alone, never a dangling ` — ` or the bytes `undefined`/`null`. → pinned by the A′ + no-undefined falsifier tests (Task 1/2).
- A `callId: null` card and a join-miss card conflated into one message — a reader auditing the ledger expects two honestly different states. → pinned by the B-vs-C distinctness test (Task 2).
- The renderer quietly loading policy or writing a file at presentation time — a reader expects zero tree mutation. → pinned by the mkdtemp tree-hash test + source canary (Task 3).
- The imperative scan drifting to `decisionLine` output and failing every legitimate composite basis (they all contain "verify"-family words). → pinned by scanning ONLY the exported fallback constants (Task 2).
- The step-4 prose accidentally reordering the prompt above the mode line — a reader expects body → line → prompt, always. → pinned by the placement pins (Task 4).

---

### Task 1: `decisionLine` at the record layer

**Files:**
- Modify: `extensions/gate-ledger.ts` (add export after `readGateLedger` section)
- Test: `test/gate-render.test.ts` (new file, first section)

**Interfaces:**
- Produces: `decisionLine(record: { resolvedMode: string; basis?: string }): string` — consumed by Task 2's renderer and nothing else.

- [x] **Step 1: Write the failing tests** (composite byte-equality incl. the EV-65 pinned failure basis; A′ absent/`undefined`/`null` basis → mode token alone; em dash is U+2014).
- [x] **Step 2: Run `bun test test/gate-render.test.ts` — observe red** (no export named `decisionLine`).
- [x] **Step 3: Implement `decisionLine`** in `gate-ledger.ts` with nullish-coalescing so absent basis yields the mode token alone; make the doc comment's byte-equality claim executable. It is the only module owning a `Mode: `-prefixed format expression.
- [x] **Step 4: Run `bun test test/gate-render.test.ts` — green.**
- [x] **Step 5: Commit** `feat(gate): EV-67 decisionLine at the record layer`.

### Task 2: the pure renderer + fallback cells (A/A′/B/C)

**Files:**
- Create: `extensions/gate-render.ts` (pure section only — `renderGateLines`, fallback constants)
- Test: `test/gate-render.test.ts` (second section)

**Interfaces:**
- Consumes: `decisionLine`, `GateLedgerRecord` from `gate-ledger.ts`.
- Produces: `renderGateLines(cards: GateRenderCardInput[], records: readonly GateLedgerRecord[]): GateRenderCardOutput[]`; `GATE_RENDER_FALLBACK = { unrecordedFailure, joinMiss }` constants; types `GateRenderCardInput { id; callId: string | null; status: string }`, `GateRenderCardOutput { id; modeLine }`.

- [x] **Step 1: Write the failing tests**: cell A success record; A′ v1 line; B on `callId: null`; C on a recorded `callId` matching no line (`"zzz"`); B ≠ C, both exact; verbatim-reason rendering (no paraphrase); no-`undefined`/`null`/`NaN` falsifier over every cell; imperative-verb scan over the two fallback constants ONLY (plus no transport-reason gesture); the delta-only golden test (pre-gate card-body and approve/edit/drop prompt golden constants; the render's only contribution is the one mode line; `modeLine === decisionLine(record)` — no prose of its own); empty input → zero lines.
- [x] **Step 2: Run — observe red** (`./gate-render.ts` does not exist).
- [x] **Step 3: Implement the pure section of `gate-render.ts`**: `callId === null` → cell B literal; found → `decisionLine(record)`; miss → cell C literal; input order preserved.
- [x] **Step 4: Run — green.**
- [x] **Step 5: Commit** `feat(gate): EV-67 pure gate-render lines over the ledger join`.

### Task 3: the `council_gate_render` parent tool + registration

**Files:**
- Modify: `extensions/gate-render.ts` (tool section: `registerGateRenderTool`)
- Modify: `extensions/index.ts` (parent block, after `registerGateTool`)
- Test: `test/gate-render.test.ts` (third section)

**Interfaces:**
- Consumes: Task 2's `renderGateLines`, `readGateLedger` from `gate-ledger.ts`.
- Produces: parent tool `council_gate_render` — input `{ cards: [{ id, callId: string|null, status }] }`, output `{ cards: [{ id, modeLine }] }`.

- [x] **Step 1: Write the failing tests**: schema takes no card text (items' properties are exactly `{ id, callId, status }` — no `title`/`goal`/`acceptance`/`body`); behavioral: mkdtemp repo with a pre-written ledger, tree sha256 unchanged across a render call; source canary (`gate-render.ts` contains no `appendGateCall`/`appendGateOutcome`/`loadGatePolicy`/`setWidget`/`notify`); empty array → `{ cards: [] }`; registration is parent-mode-only (hub-tools.ts/child.ts never mention it, index.ts wires it after the seat early return).
- [x] **Step 2: Run — observe red.**
- [x] **Step 3: Implement** the tool (one `readGateLedger(repoRoot)` pass → `renderGateLines`, strings-only result in input order, zero writes/policy/widget) and wire `registerGateRenderTool(pi, repoRoot)` after `registerGateTool`.
- [x] **Step 4: Run — green.**
- [x] **Step 5: Commit** `feat(gate): EV-67 council_gate_render parent tool`.

### Task 4: canary amendment + procedure edits

**Files:**
- Modify: `test/ev66-advisory-intake.test.ts` (canary only — EV-66 opacity and two-arm tests untouched)
- Modify: `council/procedures/features-new.md` (step 3 clause; step 4 additive block)
- Test: `test/gate-render.test.ts` (prose pins + ordering fence section)

**Interfaces:**
- Consumes: `extensions/gate-render.ts` existing on disk (the allowlist names it).

- [x] **Step 1: Write the failing prose/fence tests** (step 3 keeps `recorded, never acted on` byte-preserved, old inverted clause gone, new mandate present; heading order `## 3.` < `## 4.`; step 4's pre-existing presentation sentence byte-unchanged; new block pins verbatim-once/placement/add-no-words/presented-never-written/off-skip; ordering fence: no `council_dispatch`/`council_wait` after `## 3.`).
- [x] **Step 2: Run — observe red** (the procedure doesn't carry the new text yet).
- [x] **Step 3: Amend the canary** to the role-enumerated allowlist `{ gate-run.ts: writer, gate-ledger.ts: owner, gate-render.ts: presentation }` plus the two preserved-in-strength assertions (read-only posture; import directionality — `index.ts`'s registration import is the one sanctioned edge).
- [x] **Step 4: Edit `features-new.md`**: step 3 — replace `and do not print the recorded verdict — the human sees the card text at the step-4 gate, not the gate's verdict.` with the render-at-step-4 mandate; byte-preserve the `recorded, never acted on` sentence and the mechanical-bookkeeping instruction; do not move the `## 3.` heading. Step 4 — add the additive gate-verdict-line block between the two existing paragraphs.
- [x] **Step 5: Run `bun test test/gate-render.test.ts test/ev66-advisory-intake.test.ts` — green.**
- [x] **Step 6: Commit** `feat(gate): EV-67 procedure renders the verdict line at step 4; canary amended`.

### Task 5: gates

- [x] `bash council/preflight.sh` — record output.
- [x] `bunx tsc --noEmit` — record output.
- [x] `bun test` — record output (≈107s; integration tests stay gated).
- [x] `python3 council/validate.py` — record output.
- [x] Push branch, open PR `feat(gate): EV-67 gate verdict line at the draft-then-confirm approval gate`.
