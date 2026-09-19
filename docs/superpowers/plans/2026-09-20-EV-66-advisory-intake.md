# EV-66 — Advisory gate at features-new intake: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> (this plan is executed natively in the owner's own session per the card's
> owner role). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With the gate in advisory mode, a /features-new run records one
ledger line per drafted card (`advisory: true`) while dispatching the same
seat set as a pre-gate run — proven by a two-arm headless falsifier whose
headline observable is "the ledger is the only engine-written diff".

**Architecture:** New parent-session tool `council_gate`
(`extensions/gate-tool.ts`, own registration on index.ts's parent path only)
composing `loadGatePolicy` → (off: mechanical no-op) → `loadGateQuestions` +
`loadGateDecision` → sequential per-card `buildGateState` → `runGate`
(production transport). Result is verdict-opaque. The only added surface is
the transient in-flight widget line (`gate-call` key, cleared to `[]` on
settle). The procedure gains one gate step; the falsifier runs two headless
arms (loopback success / credential-less fail-closed) through the faux-provider
harness with a new `EV40_TOOLCALL_GATE` knob.

**Tech Stack:** bun:test, typebox, node:http loopback stubs, the EV-40
faux-provider harness (runHarnessArm).

**Spec:** docs/superpowers/specs/2026-09-19-EV-66-design.md (settled; the
plan argues from it — executors read both).

## Global Constraints

- R1: merge is the orchestrator's run-scoped admin bypass — never ours.
- R3: packaged policy ships `mode: "off"`; tests set modes explicitly; never
  rely on the packaged default being on.
- R4: panel vocabulary lives in MODE_PANELS/ledger only.
- R(a): the surface stays exactly the pending line; zero lines after settle
  for EVERY post-settle state including failures; never notify.
- R(c): call site passes `touchedFiles: []` when absent; `gate-state.ts` NOT
  touched; nowhere may `[]` be described as "touches nothing".
- R(d): features-new.md amended so every drafted card AND the epic card carry
  seat-authored `## Acceptance` before the gate call; `validate.py` NOT edited.
- Copy: exactly `gate: advisory call in progress · <id>`; widget key
  `gate-call`; no placement arg (aboveEditor default); no banned words
  (`thinking`, `deliberating`, `reasoning`, `judging`); no theme.fg/hex/ANSI.
- Result opacity: `{ policyMode, cards: [{ id, callId, status }] }` only; no
  verdict token in ANY returned string; never pass `opts.callId`; thrown
  guard/append failures re-surfaced GENERIC.
- Gates, in full, in order: `bash council/preflight.sh`; `bunx tsc --noEmit`;
  `bun test` (integration gated; ≈101s, do not skip); `python3
  council/validate.py`.
- Conventional Commits; bump `package.json` version in the same PR.
- Work ONLY in `/home/tista/codes/pi-council/.worktrees/ev-66` (branch
  `feat/ev-66-advisory-intake`); main repo path branch-state immutable.
- Do not edit `council/board.md` or `council/cards/`.

## Review Focus

1. A runner-exported `OPENROUTER_API_KEY` silently converting a falsifier arm
   into a live POST — pinned by arm B's zero-POST (server-side count) +
   byte-equal failure-basis assertions (Task 5).
2. A verdict token leaking through any returned string — pinned by the shape
   walk + regex scan over the tool result (Task 2) and the steering-branch
   clause over the session JSONL (Task 5).
3. An incidental engine write beyond the ledger breaking non-interference —
   pinned by the headline hash-diff (Task 5).
4. The in-flight line surviving a failed call as orphaned copy — pinned by the
   settled-`[]` source pin + hasUI-guard behavioral test (Tasks 1–2).
5. A seat gaining access to `council_gate` — pinned by the parent-mode-only
   registration source test (Task 2).

---

### Task 1: In-flight render function (TDD)

**Files:**
- Test: `test/gate-inflight.test.ts` (create)
- Modify: `extensions/gate-tool.ts` (create — the render half only)

- [ ] Step 1: Write the failing tests — pending → exactly one line
      `gate: advisory call in progress · EV-66`, banned-word scan negative,
      length < 80; settled (null) → `[]` (the card's pinned test); constants
      `GATE_WIDGET_KEY === "gate-call"`, distinct from `"council"` and
      navigator's `COUNCIL_TREE_WIDGET_KEY`; determinism (same input → same
      output); source pins: no placement arg on any `setWidget(GATE_WIDGET_KEY`
      call, exactly two setWidget sites, both guarded by `ctx.hasUI`, settle
      passes `[]`, no `notify`, no `Date.now`/`Math.random`, no hex/ANSI/
      `theme.fg`.
- [ ] Step 2: Run `bun test test/gate-inflight.test.ts` — FAIL (module
      missing).
- [ ] Step 3: Implement `renderGateInFlight(pending: { cardId: string } |
      null): string[]` and `GATE_WIDGET_KEY` in `extensions/gate-tool.ts`
      (module created with only the pure render half; the registration half
      arrives in Task 2).
- [ ] Step 4: Run again — PASS.
- [ ] Step 5: Commit `feat(gate): EV-66 in-flight render + gate-call widget key`.

### Task 2: `council_gate` tool + parent-only registration (TDD)

**Files:**
- Test: `test/gate-tool.test.ts` (create)
- Modify: `extensions/gate-tool.ts`, `extensions/index.ts`

- [ ] Step 1: Write failing tests (offline, mkdtemp repos, loopback HTTP
      stub per fixture-http precedent, `OPENROUTER_API_KEY` set/removed around
      each test):
      1. off → `{ mode: "off", recorded: 0 }`, no ledger file, zero stub
         connections, zero widget calls (off policy may omit
         `gateStateBudgetTokens`).
      2. advisory → one ledger line per card, `advisory: true`,
         `resolvedMode` ∈ GATE_DECISION_MODES, non-empty `basis`, no
         `failure`, v2 call-line shape with no `record.outcome.*` facts.
      3. active → `advisory: false`, result shape unchanged.
      4. result opacity by shape — recursive key walk over the non-off
         result: no key in {resolvedMode, mode, basis, include, answers,
         decision, failure, reportedModel, modelDrift}; no string value
         matching /\b(Deliberate|Verify|Direct|Mode:)\b/.
      5. malformed card field (empty `acceptance`) → throws naming the
         field; no ledger line, no POST.
      6. widget choreography with a spy ui (`hasUI: true`): one pending
         setWidget per card naming that card's id, then exactly one
         `setWidget(GATE_WIDGET_KEY, [])` at settle; `hasUI: false` → zero
         setWidget calls.
      7. parent-mode-only registration: source assertions — `child.ts`
         never references gate-tool/`council_gate`; `hub-tools.ts` never
         registers it; `index.ts` calls `registerGateTool` after the
         `COUNCIL_SEAT` early return.
- [ ] Step 2: Run — FAIL (tool unregistered/missing).
- [ ] Step 3: Implement `registerGateTool(pi, repoRoot)` in gate-tool.ts:
      typebox params `cards: Array<{id, title, goal, acceptance,
      touchedFiles?}>`; per-card tool-boundary validation (fail loud naming
      `cards[<i>].<field>`, `touchedFiles` absent → `[]`); sequential
      `buildGateState` → `runGate` with production transport (no
      `opts.callId`, no `apiKey`, no `transport` overrides); per-card
      catch → `{ id, callId: null, status: "failed", message: "gate: the
      gate call for card <id> failed" }`; `finally { if (ctx.hasUI)
      ctx.ui.setWidget(GATE_WIDGET_KEY, []) }`; off short-circuit FIRST.
      Wire into `index.ts` parent path after `registerHubTools`.
- [ ] Step 4: Run — PASS.
- [ ] Step 5: Commit `feat(gate): EV-66 council_gate parent tool + registration`.

### Task 3: Procedure amendment (R(d) Option 1 + O9 disambiguation)

**Files:**
- Modify: `council/procedures/features-new.md`
- Modify: `test/prose.test.ts` (the byte-identical step-3 fixture pin only —
  the settled design amends the block, so the pin moves with it)

- [ ] Step 1: Amend the procedure:
      - Wave 1 output + Wave 3 rulings cover a seat-authored `## Acceptance`
        per card (epic included; step 1's epic creation notes the section).
      - Aggregation/draft text: drafts carry frontmatter, `Intent`, and
        `## Acceptance`.
      - New step `## 3. Record the advisory gate call` between aggregation
        and presentation: invoke `council_gate` ONCE with the epic card and
        every drafted child (`{id, title, goal, acceptance, touchedFiles?}`,
        `acceptance` = the card's `## Acceptance` text; omit `touchedFiles`
        — intake makes no touched-file claim; EV-69's re-check is the
        enforcement); the verdict is recorded, never printed, never acted
        on; the tool writes `.pi/council/gate-ledger.jsonl` — never edit it;
        report a per-card failure at the step-4 gate, do not re-run the call.
      - Renumber: draft-then-confirm → `## 4.`, write-and-validate → `## 5.`,
        commit → `## 6.`; step-4 presentation includes the `## Acceptance`
        section.
      - Disambiguate the deliberation-"ledger" prose from the gate's committed
        `.pi/council/gate-ledger.jsonl`.
- [ ] Step 2: Update prose.test.ts's byte-identical fixture (heading
      `## 4. Draft-then-confirm`, end index `## 5. On approval`, amended
      draft-shape sentence). Run `bun test test/prose.test.ts` — PASS.
- [ ] Step 3: Add the placement assertion + ledger-source canary to
      `test/ev66-advisory-intake.test.ts`'s unit section (Task 5 file):
      features-new places the gate step between aggregation and the
      draft-then-confirm heading; epic + children all covered by the
      Acceptance bar; disambiguation present. Canary: outside gate-ledger.ts,
      no extensions/ module references `readGateLedger`/`gate-ledger.jsonl`,
      and gate-ledger.ts is imported only by gate-run.ts (the writer).
- [ ] Step 4: Commit `docs(council): EV-66 gate step + Acceptance bar in features-new`.

### Task 4: Harness knob `EV40_TOOLCALL_GATE`

**Files:**
- Modify: `test/faux-provider/harness.ts` (ArmOptions + env entry)
- Modify: `test/faux-provider/extension.ts` (gate scripted step + cards const)

- [ ] Step 1: Add `toolcallGate?: boolean` → `EV40_TOOLCALL_GATE: "1"`
      (knob-gated: absent otherwise — every existing arm's env stays
      byte-identical). In extension.ts: when set, insert
      `fauxToolCall("council_gate", { cards: GATE_CARDS })` as a scripted
      parent step after the dispatch/wait steps; `GATE_CARDS` is one epic +
      two children, static module constant (byte-identical across arms).
- [ ] Step 2: `bun test test/faux-provider-shape.test.ts test/ev40-headless.test.ts`
      (or a subset) still green — the knob is inert for existing arms.
- [ ] Step 3: Commit `test(harness): EV-66 scripted council_gate parent step (EV40_TOOLCALL_GATE)`.

### Task 5: The two-arm headless falsifier

**Files:**
- Test: `test/ev66-advisory-intake.test.ts` (create)

- [ ] Step 1: Write the falsifier:
      - Unit section: placement assertion + source canary (from Task 3);
        steering-branch opacity clause (branch predicate over the real
        toolResult text from the arm session JSONL — the branch that would
        dispatch a different seat set is never taken).
      - Arm A (loopback success, primary): advisory policy pinned to
        `http://127.0.0.1:<port>/decisions`, per-card-keyed canned answers
        (Direct / Deliberate-override / Verify), dummy
        `OPENROUTER_API_KEY`. Assert: 3 ledger lines, all `advisory: true`,
        no failure, resolved modes not all identical, deterministic bases.
      - Arm B (credential-less failure, secondary): same policy shape, no
        `OPENROUTER_API_KEY` in the arm env, scratch HOME bare → zero POSTs
        (server-side count), 3 lines with `advisory: true`, resolvedMode
        `Deliberate`, `failure.class no-api-key`, basis byte-equal to
        `gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)`.
      - Headline: recursive sha256 of both arm worktrees; differing paths
        minus `.pi/council/gate/policy.json` minus `.pi/council/runs/**`
        equal exactly `{ .pi/council/gate-ledger.jsonl }`.
      - Corollaries: dispatch-set equality (same manifest id + seat sets; no
        manifest carries a mode); tool-result opacity from the session JSONL.
      - Standalone-line ceilings `120_000,` per arm test (FLLWUP-58 census
        discipline; headroom verified against the 60-min backstop).
- [ ] Step 2: Run `bun test test/ev66-advisory-intake.test.ts` — iterate on
      incidental-write findings until green; keep both arms ≈10–15s.
- [ ] Step 3: Commit `test(gate): EV-66 two-arm advisory-intake falsifier`.

### Task 6: Red-base record (seven fields)

- [ ] Step 1: Detached worktree at the pre-mechanism base (current branch
      tip before the first mechanism commit — `9966ffe`), transplant the
      falsifier file + the harness knob diff from head, symlink node_modules,
      run `bun test test/ev66-advisory-intake.test.ts` verbatim — record raw
      red output with per-failure lines; remove the worktree.
- [ ] Step 2: Fill the seven-field record into the falsifier file header
      (ev68 precedent); head half 0 fail.
- [ ] Step 3: Commit `docs(test): EV-66 red-base record (seven fields)`.

### Task 7: Gates, version, push, PR

- [ ] Step 1: Bump `package.json` version (0.26.0 → 0.27.0 — payload +
      engine behavior).
- [ ] Step 2: Gates in order: `bash council/preflight.sh`; `bunx tsc
      --noEmit`; `bun test` (full, ≈101s); `python3 council/validate.py`.
- [ ] Step 3: Conventional commits; push
      `feat/ev-66-advisory-intake`; `gh pr create` against main. END TURN.
