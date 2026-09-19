# EV-69 — Deterministic Routing to Verify Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A card whose recorded ledger decision resolves to Verify runs council steps 7–12 with zero deliberation dispatch; a falsifier over the manifests of a scripted harness run whose dispatches are produced by the real `council_route` tool proves that run's dispatch multiset, while claiming nothing about a live facilitator.

**Architecture:** A new pure module `extensions/gate-route.ts` (routing read: packed-state hash match against the gate ledger; fail-safe full-path fallbacks; the mode authority's card-scoped subtree read) exposed through one parent-only `council_route` tool (`extensions/gate-route-tool.ts`) that is also the sanctioned re-gate caller at the step-8→9 boundary. `runGate` gains one optional `basisSuffix` opt carrying the escalation-only ratchet note. The council procedure's step 1 defers to a recorded mode; the merge check becomes mode-aware.

**Tech Stack:** TypeScript (bun), typebox tool params, bun:test, loopback HTTP stub for the one re-gate call, `Hub` + `test/stub-child.ts` for scripted dispatch manifests.

**Spec:** `docs/superpowers/specs/2026-09-21-EV-69-design.md` (settled; the plan argues from it — the spec travels with this plan and wins any wording dispute except where the card's step-6 PO ruling speaks).

## Global Constraints

- Import fence: `gate-route.ts` imports only `gate-state.ts`, `gate-ledger.ts`, `gate.ts`, and the `DispatchMode` type from `runs.ts`; NEVER `gate-run.ts` / `gate-transport.ts` / `gate-render.ts` / `gate-tool.ts` (spec §3).
- `gate-route.ts` contains **no mode literal of its own**: modes come from `GATE_DECISION_MODES` / `MODE_PANELS` (`gate.ts`) and `DispatchMode` (`runs.ts`). Strongest-mode rank = index in `GATE_DECISION_MODES` (Deliberate > Verify > Direct).
- No model call in any `resolveRoute` branch, ever (property of the import graph, pinned by a canary).
- `gate-ledger.ts` is the ONLY module owning a `Mode: `-prefixed format expression (pinned by `test/ev66-advisory-intake.test.ts`) — route bases must never start with `Mode: `.
- `council.md` amended surface is EXACTLY: step 1, the step-8→9 boundary sentence, ONE new named re-route block after it. Step 2 stays BYTE-IDENTICAL (PO ruling Item A).
- Verify panel = owner + skeptic + judge (R4); generator set for the mode authority = {principal, designer, consolidator}, never a MODE_PANELS set-difference.
- The ledger schema stays v2; the re-route line is a normal v2 call line; `rederiveResolvedMode(line) === line.resolvedMode` by construction (verdict recorded verbatim; the ratchet lives in `basis` via `basisSuffix`).
- Conventional Commits; bump `version` in package.json in the same PR.

## Review Focus

- A card file whose `## Acceptance` is missing/empty must route full with a named basis, never throw, never route reduced — pinned by T5.
- Tree drift (a new test file or wiki page) with identical card text must route full — "unchanged packed state" is the contract — pinned by T3.
- A disagreeing pair of recorded lines for one hash must resolve to the strongest valid mode, never the newest — pinned by T4.
- A re-gate landing BELOW the recorded mode must not de-escalate execution (ratchet) while the line records the verdict verbatim — pinned by the C1 ratchet arm.
- An escalated Verify card with a product-owner dispatch in its subtree must still read Verify (dual-role) — pinned by subtree arm iv.

---

### Task 1: Plan + red-base preparation

**Files:**
- Create: `docs/superpowers/plans/2026-09-21-ev-69-verify-routing.md` (this file)

- [ ] Commit the plan.

### Task 2: Failing falsifier + unit tests (red at base)

**Files:**
- Create: `test/gate-route.test.ts` (T1–T9, policy drift, basisSuffix unit, C3 round-trip, procedure pins)
- Create: `test/ev69-verify-manifests.test.ts` (clean Verify arm, re-route arm, ratchet arm C1/C1b, subtree arms i–vii, multiple-ROOT union)

**Interfaces:**
- Produces: fixtures the implementation must satisfy — see spec §9 for the exact claim list. The tests invoke the REAL `council_route` tool function captured through a fake `ExtensionAPI` (`registerTool` capture, the `test/gate-tool.test.ts` precedent) and the REAL `effectiveModeForCard` over forests written with the real `writeManifest`.

- [ ] Write both test files.
- [ ] Record the red-base record: detached worktree at base sha `1a023f6` (the commit immediately preceding EV-69's first mechanism merge), transplant = the two test files (+ node_modules symlink), run `bun test test/gate-route.test.ts test/ev69-verify-manifests.test.ts`, capture verbatim raw red output, remove the worktree.
- [ ] Do NOT commit yet — the tests land green with their implementation (TDD red observed, committed green).

### Task 3: `extensions/gate-route.ts` — the pure module

**Files:**
- Create: `extensions/gate-route.ts`

**Interfaces:**
- Produces (consumed by Tasks 4–6 and both test files):
  - `parseCardFile(md: string): ParsedCard` — frontmatter `id`/`title`/`goal` + `## Acceptance` body; missing/empty ⇒ `""`; never throws.
  - `normalizeCardInput(card: { id?, title?, goal?, acceptance?, touchedFiles? }, slot: string): ParsedCard` — the shared extractor's tool-param normalization; byte-identical fail-loud messages to today's `validateCardParam`; preserves `touchedFiles ?? []`.
  - `resolveRoute(card: ParsedCard | string, repoRoot: string): { mode: DispatchMode; source: "recorded" | "fallback" | "full-unpackable"; stateHash?; matchedCallId?; basis }` — rules in spec §3.2 order (off → unpackable → hash → valid match → agree/latest-file-order → disagree/strongest; failed-call records valid verbatim).
  - `observedTouchedFiles(repoRoot: string, headSha: string): string[]` — `git diff --name-only <merge-base(origin/main, head)>..<head>`, read-only, two-dot commit-range, base pinned.
  - `recheckOwed(matchedStateHash: string, rebuiltStateHash: string): boolean`.
  - `strongest(a: GateDecisionMode, b: GateDecisionMode): GateDecisionMode` — rank by `GATE_DECISION_MODES` index.
  - `effectiveModeForCard(repoRoot: string, runId: string, runnerJobIds: string | readonly string[]): DispatchMode` — ROOT subtree union; generator set {principal, designer, consolidator}; absent ROOT ⇒ throw named; no ROOT mode ⇒ throw named.

- [ ] Implement; run `bun test test/gate-route.test.ts` → unit claims green (T1–T9, drift).
- [ ] Commit `feat(gate): EV-69 routing read — pure gate-route module`.

### Task 4: `basisSuffix` opt in `extensions/gate-run.ts`

**Files:**
- Modify: `extensions/gate-run.ts` (RunGateOpts + both append paths)

**Interfaces:**
- Produces: `RunGateOpts.basisSuffix?: string | ((decision: GateDecision) => string | undefined)` — static string or post-decide hook (the ratchet note cannot be known before the call; the hook keeps ONE write, ONE line, schemaVersion 2; verdict stays verbatim in `resolvedMode`).
- Default behavior byte-identical (opt absent ⇒ basis untouched) — existing gate-run tests stay green.

- [ ] Unit test first (in `test/gate-route.test.ts`): hook appends the ratchet note into `basis` on a Direct landing; absent opt appends nothing.
- [ ] Implement; run gate-run tests → green.
- [ ] Commit `feat(gate): EV-69 basisSuffix opt on runGate (ratchet note, one line)`.

### Task 5: `extensions/gate-route-tool.ts` + registration

**Files:**
- Create: `extensions/gate-route-tool.ts`
- Modify: `extensions/index.ts` (parent-path registration next to `registerGateTool`)

**Interfaces:**
- Produces: `registerRouteTool(pi, repoRoot)` — ONE parent-only tool `council_route`, params `{ op: "route" | "recheck" | "authority"; cardPath; headSha?; runId?; runnerJobId? }` per spec §4.
  - `route`: read+parse+resolveRoute; returns `{ mode, source, basis, include, stateHash?, matchedCallId? }`.
  - `recheck`: recorded reduced route only; observed set → rebuilt packed state; hash equal ⇒ zero calls; differs ⇒ exactly one `runGate` call (loopback via policy endpoint; env key), effective = strongest(recorded, verdict), `basisSuffix` hook appends the ratchet note iff effective ≠ verdict; returns effective mode + new callId.
  - `authority`: `effectiveModeForCard` (absent ROOT throws named).
- The tool may import `runGate`/transport — it IS the sanctioned gate caller; the fence protects the pure module only.

- [ ] Tests first: op route (recorded + fallback + off), recheck zero-call half, recheck re-gate half (loopback stub), ratchet through the tool, authority surface, parent-only registration (never in `registerHubTools`).
- [ ] Implement + register in `index.ts`.
- [ ] Commit `feat(gate): EV-69 parent-only council_route tool (route/recheck/authority)`.

### Task 6: Behavior-preserving shared-extractor edit in `extensions/gate-tool.ts`

**Files:**
- Modify: `extensions/gate-tool.ts` (`validateCardParam` collapses onto `normalizeCardInput`)

- [ ] Preserve `touchedFiles ?? []` and the fail-loud field naming byte-for-byte; existing `test/gate-tool.test.ts` + `test/ev66-advisory-intake.test.ts` must stay green untouched.
- [ ] C3 round-trip test (in `test/gate-route.test.ts`): scripted real `council_gate` invocation with values transcribed verbatim from a card file → appended `stateHash` equals a disk rebuild; one changed Acceptance char → unequal.
- [ ] Commit `refactor(gate): EV-69 shared card-field extractor collapsed into gate-route`.

### Task 7: Procedure amendments (exact three surfaces)

**Files:**
- Modify: `council/procedures/council.md` — step 1 (recorded mode authoritative; surface bit regardless; follow-up-card rule), the step-8→9 boundary (recheck call before the skeptic dispatch), ONE named re-route block after it (roster principal+designer per rule; owner's step-8 branch as first-pass record; steps 3–7; owner re-dispatched at step 8 only on overturn; steps 9–12 resume). Step 2 byte-identical.
- Modify: `council/procedures/features-deliver.md` — mode-aware criteria table keyed via `council_route` op `authority` (Deliberate = five verbatim; Verify = all five, criterion 3 scoped to the single Verify skeptic; Direct = 1, 2, 5).

- [ ] Amendment pins (in `test/gate-route.test.ts`): step 2 byte-identical constant; block present with roster + resume-at-3; boundary names `recheck`; features-deliver table present; pre-existing prose.test.ts pins stay green.
- [ ] Grep `council/agents/council-runner.md` for step-1 routing prose — only the surface-touching reference exists (no contradiction with §6); no amendment needed.
- [ ] Commit `docs(council): EV-69 procedure amendments — recorded mode authoritative, re-route block, mode-aware merge check`.

### Task 8: EV-66 canary reader-allowlist amendment

**Files:**
- Modify: `test/ev66-advisory-intake.test.ts` — admit `gate-route.ts` + `gate-route-tool.ts` to the reader-accessor allowlist DELIBERATELY (they reference `readGateLedger`); the no-execution-path-imports-gate-render pin stays.

- [ ] Commit `test(gate): EV-69 canary allowlist admits the routing modules deliberately`.

### Task 9: Version bump + gates

**Files:**
- Modify: `package.json` (version bump)

- [ ] Bump version.
- [ ] Gate 1: `bash council/preflight.sh` — observe.
- [ ] Gate 2: `bunx tsc --noEmit` — observe.
- [ ] Gate 3: `bun test` (full suite) — observe.
- [ ] Gate 4: `python3 council/validate.py` — observe.
- [ ] Commit `chore(release): bump version for EV-69 verify routing`.

### Task 10: Finish

- [ ] Push `feat/ev-69-verify-routing`; open PR against `main` (no merge).
- [ ] Report: PR number, head SHA, per-gate observed results, red-base record, deviations (none expected).
