# EV-74 — `/council-gate` Implementation Plan

**Spec:** `docs/superpowers/specs/2026-09-20-EV-74-design.md` (authoritative); card `council/cards/EV-74.md`.

**Goal:** an operator-facing `/council-gate [off|advisory|active]` command backed by a byte-splice writer, so the decisions gate's enablement (EV-73's `loadGateConfig`) is toggleable without hand-editing `.council.json`.

**Tasks (TDD; all tests in `test/ev74-council-gate-command.test.ts`, spec §5 items 1–18):**

- [x] `writeGateMode` in `extensions/council-config-writer.ts` — option C: beside `writeSeatOverride`/`clearSeatOverride`, reusing the private scanner (`parseValue`, `skipSpace`, `lineIndentAt`, `detectIndentUnit`, `writeAtomic`, `existingMode`); `GATE_MODES`/`GateMode` imported from `./gate.ts` (single-source vocabulary, no local re-declaration); last-wins duplicate-key splice; append-after-last greenfield-in-file insert; explicit greenfield branch; refusals before any splice mirroring `loadGateConfig`'s grammar; header doc-note names the gate sibling.
- [x] `extensions/council-gate-cmd.ts` — pure `runGateCommand(args, repoRoot, emit, write = writeGateMode)`; trim/split arg grammar (0 tokens = status; 1 = validate ∈ GATE_MODES; >1 = error); O3 trailing-whitespace pin; echo via post-write `loadGateConfig` read-back; O4 fail-soft read-back; R5 copy literals (spec §3, byte-exact); no "jev" in any operator string.
- [x] `pi.registerCommand("council-gate", ...)` in `extensions/index.ts` next to `council-models` (source-contains pin, the `test/council-models.test.ts:240` precedent); description names the mode values; emit sink notify vs console.log per the house pattern.
- [x] Gates: `council/preflight.sh` → `bunx tsc --noEmit` → `bun test` → `council/validate.py` → `preflight.sh` again on the final tree.

**Out of scope (spec §6):** scaffold seed + canonical top-level order; run-config-stability Phase-0 assertion; concurrent-session write discipline; theme-watcher gate-only reload; EV-77 off-as-Deliberate docs note.
