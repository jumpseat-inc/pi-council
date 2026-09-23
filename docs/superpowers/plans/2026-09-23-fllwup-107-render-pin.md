# FLLWUP-107 — Renderer substitution-set pin for procedure copy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A test asserts `renderProcedure` substitutes exactly `$COUNCIL_PROCEDURES` and `$ARGUMENTS`, and no packaged procedure ships containing an unrendered `$CONFIG_DIR_NAME` or `@CONFIG_DIR@` token.

**Architecture:** Test-only pin at the two ratified levels: (1) a byte-equality substitution-set pin in `test/render.test.ts` against `renderProcedure` (extensions/index.ts:148–153, which replaces only the two known tokens); (2) a packaged-procedure pack scan over `council/procedures/*.md` resolved via `PKG_ROOT` (same pattern as `test/usages-procedure.test.ts`). No engine change — current behavior is already correct for this card.

**Tech Stack:** bun:test, TypeScript (strict), PKG_ROOT from extensions/seats.ts.

**Spec:** `council/cards/FLLWUP-107.md` (handoff = card, recorded mode `Direct`; FLLWUP-105 ruling 2026-09-24 Q3a fixed the renderer-level home for the substitution pin).

## Global Constraints

- Main-repo immutability: all work in `.worktrees/fllwup-107-render-pin` (branch `feat/fllwup-107-render-pin`, base `9babc354`); never checkout/switch/reset the main path.
- `test/usages-procedure.test.ts` is NOT modified in any way (FLLWUP-105's pin stays exactly three-literal).
- Test-only change: no engine change, no seat frontmatter change.
- Conventional Commits; scope `procedures` or none.
- Gates in order: `bash council/preflight.sh FLLWUP-107`, `bunx tsc --noEmit`, `bun test`, `bun test test/render.test.ts`, `python3 council/validate.py`. Every bash call carries a timeout.

## Review Focus

- Substitution pin must be byte-equality on the whole rendered string — proves both substitution and pass-through simultaneously; no per-token whitelist asserts that could mask an extra substitution.
- Foreign tokens chosen must not prefix-match a known token (`$ARGUMENTS`/`$COUNCIL_PROCEDURES` are prefix-greedy regexes without word boundaries) — e.g. avoid `$ARGUMENTS2`.
- Pack scan must fail loudly (non-empty offender list) and prove non-vacuity by asserting at least one `.md` file exists.
- The pin is green-immediately (pins existing behavior); falsifiability is shown by a temporary mutation check, then reverted.
- `usages-procedure.test.ts` must be byte-identical at PR time.

---

### Task 1: Substitution-set pin (renderer level)

**Files:**
- Modify: `test/render.test.ts`

- [x] Append test: body with `$COUNCIL_PROCEDURES`, `$ARGUMENTS`, and foreign tokens (`$CONFIG_DIR_NAME`, `@CONFIG_DIR@`, `$SOMETHING_ELSE`, `@ANYTHING@`) renders with byte-equality — the two known tokens substituted, everything else byte-unchanged.
- [x] Run `bun test test/render.test.ts` — expect green (pins existing behavior).
- [x] Mutation check: temporarily alter `renderProcedure` (or a procedure file for the scan) to confirm the pin CAN fail; revert the mutation (worktree-local `git checkout` only).

### Task 2: Packaged-procedure token scan (procedure-pack level)

**Files:**
- Modify: `test/render.test.ts`

- [x] Append test: scan `PKG_ROOT/council/procedures/*.md`, assert non-empty file set, fail with an offender list if any file contains `$CONFIG_DIR_NAME` or `@CONFIG_DIR@`.
- [x] Run `bun test test/render.test.ts` — expect green.

### Task 3: Gates, commit, push, PR

**Files:**
- Modify: `docs/superpowers/plans/2026-09-23-fllwup-107-render-pin.md` (this file, checkboxes ticked)

- [x] `bash council/preflight.sh FLLWUP-107` → pass
- [x] `bunx tsc --noEmit` → pass
- [x] `bun test` → full suite pass (~101s)
- [x] `bun test test/render.test.ts` → record counts
- [x] `python3 council/validate.py` → pass
- [x] Verify `test/usages-procedure.test.ts` byte-identical to base (`git diff 9babc354 -- test/usages-procedure.test.ts` empty)
- [x] Commit (`test(procedures): pin renderProcedure substitution set and packaged-procedure token scan (FLLWUP-107)`), push branch, `gh pr create`. END TURN; no merge, no CI poll.
