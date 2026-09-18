# FLLWUP-59 — Derived Retired-Path Token Set — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace test 6's hand-maintained token regex in
`test/faux-provider-shape.test.ts` with a retired-path token set derived from
git HEAD ancestry, so a future token retirement cannot silently create a miss.

**Architecture:** Two pure functions (`deriveRetiredTokens`,
`retiredPathViolations`) plus a thin impure wrapper (two read-only `git`
`spawnSync` calls + a composed loud-fail guard) inside the witness file, fed
into a rewritten test 6. One-line CI substrate fix (`fetch-depth: 0` in
`.github/workflows/gates.yml`), one wiki page.

**Tech Stack:** TypeScript (bun:test), git plumbing (read-only), YAML CI.

**Spec:** `docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md` (§§1–9). The
plan argues from the spec; every pinned choice (emission/matching rule, guard,
canary, red-base SHA) is copied from it.

## Global Constraints

- Zero-new-live-arms (FLLWUP-49 O10): arm counts 3/5/5/2 + `ev41-seat-child-live` 2
  unchanged; the only new spawn is the read-only `git` `spawnSync` (no pi, no pty).
- Enumeration is HEAD-ancestry only — never `--all` (determinism, spec §1).
- Scan domain stays `TEST_DIR` (all of `test/`, witness self-excluded, bytecode
  excluded) — test 6 never reads `smoke/` (FLLWUP-55 charter extension tests 9–11 untouched).
- On any `git` error: named loud FAIL, never a silent pass (spec §1/§5).
- Witness self-exclusion discipline kept: the witness's own prose/fixtures
  contain retired tokens; scratch probes go through `mkdtempSync`.
- Diff = `test/faux-provider-shape.test.ts` + `gates.yml` checkout step +
  wiki page + this plan. Nothing else.
- Gates, in order, full: `bunx tsc --noEmit`; `bun test`;
  `python3 council/validate.py`; `bash council/preflight.sh FLLWUP-59`.
- Main checkout branch state immutable; all work in the
  `.worktrees/fllwup59-derived-token-set` worktree.

**Measured pre-implementation facts (this worktree, `bun run` probe, main HEAD
`aeab1bf`):** 15 retired non-bytecode paths; dir tokens
`["ev43/","test/ev40-harness/","ev40-harness/","smoke/artifacts/","artifacts/"]`;
35 emitted fragments; **HEAD violations `[]`** with the pinned rule; tripwires
(`see ev43/falsifier-headless.ts`, `via test/ev41-tui.py`,
`test/ev40-harness/harness-headless.ts` source) all red; owned narrowings
(bare-dir prose, old `'ev40-harness/';` fixture, bare `ev41-tui.py` basename,
live `test/faux-provider/ev41-tui.py`) all green. Arm baseline 3/5/5/2 + 2.
Witness baseline: 12 pass / 0 fail.

**Reading note (spec §2, load-bearing):** "each retired ancestor directory and
its segment-aligned suffix dir fragments" — dir tokens derive from ancestor
dirs of retired paths **that are themselves retired** (no live tracked path
has them as a prefix), plus suffix fragments *of those retired dirs*. Suffix
fragments of *live* ancestor dirs (`council/cards` → `cards/`, `vault/wiki` →
`wiki/`) are NOT emitted — measured: emitting them reds
`test/council-update.test.ts` et al. at HEAD via legitimate
`council/cards/…`/`vault/wiki/…` prose, breaking spec §8.1. This reading
reproduces the spec's own example set exactly.

---

### Task 1: RED — derived-mechanism tests + rewritten test 6 (witness)

**Files:**
- Modify: `test/faux-provider-shape.test.ts`

**Interfaces:**
- Produces (used by tasks below): `deriveRetiredPaths(historyPaths, currentPaths): string[]`,
  `deriveRetiredTokens(historyPaths, currentPaths): { fragments: string[]; dirs: string[] }`,
  `retiredPathViolations(src, tokens): Array<{kind:"frag"|"dir"; token:string}>`,
  `assertFullRetirementHistory(retiredPaths, isShallowRepository): void`,
  `retiredTokensForRepo()` (memoized impure wrapper).

- [ ] **Step 1: Add the new `describe("derived retired-path token set (FLLWUP-59)")` block** (pure probes on synthetic lists; no file writes) and rewrite test 6 to call `retiredTokensForRepo()` + `retiredPathViolations` over `filesUnder(TEST_DIR)`, pushing `${file} (${kind}) ${token}` strings. Code in the executing session (functions not yet defined → RED).
- [ ] **Step 2: Run `bun test test/faux-provider-shape.test.ts`** — expect RED (test 6 + guard/derivation tests error on the missing functions).

### Task 2: GREEN — implement the mechanism

**Files:**
- Modify: `test/faux-provider-shape.test.ts` (same file, helpers above test 6)

- [ ] **Step 1: Implement** `isBytecodePath`, `segmentSuffixes`, `deriveRetiredPaths`, `deriveRetiredTokens` (retired-ancestor-dir reading per the note above), `retiredPathViolations` (frag = plain substring; dir token = trailing `/` + `[A-Za-z0-9_./-]` continuation char), `assertFullRetirementHistory` (shallow marker → named throw; canary on the pre-suppression retired-path set: `test/ev41-tui.py` exact + `test/ev40-harness/` prefix), `gitLinesOrThrow` (named loud FAIL), `retiredTokensForRepo` (memoized; `git rev-parse --is-shallow-repository`, `git log --no-renames --pretty=format: --name-only HEAD`, `git ls-tree -r HEAD --name-only`).
- [ ] **Step 2: Run `bun test test/faux-provider-shape.test.ts`** — expect all green (>12 tests).
- [ ] **Step 3: Commit `test(witness): derive retired-path token set from git HEAD ancestry (FLLWUP-59)`.**

### Task 3: §3 re-fixture of the FLLWUP-48 scan-domain describe

**Files:**
- Modify: `test/faux-provider-shape.test.ts` (`describe("scan domain — bytecode exclusion (FLLWUP-48)")`)

- [ ] **Step 1:** Change both scratch fixture strings to the retired full path `test/ev40-harness/harness-headless.ts` (`.ts` source + `__pycache__/x.pyc`) and the probe regex to `/test\/ev40-harness\/harness-headless\.ts/`. Test stays two-sided: bytecode dropped, source hit.
- [ ] **Step 2: Run `bun test test/faux-provider-shape.test.ts`** — green.
- [ ] **Step 3: Commit (amend into Task 2's commit or `test(witness): re-fixture FLLWUP-48 scan-domain probe to a retired full path`).**

### Task 4: CI substrate

**Files:**
- Modify: `.github/workflows/gates.yml` (checkout step, line 11)

- [ ] **Step 1:** Add `with: fetch-depth: 0` to the checkout step (the one-line setting; YAML needs the `with:` parent key — the semantic change is the single `fetch-depth: 0`).
- [ ] **Step 2: Commit `ci(gates): fetch full history for the derived retired-token witness (FLLWUP-59)`.**

### Task 5: Wiki page + index link

**Files:**
- Create: `vault/wiki/retired-path-tokens.md`
- Modify: `vault/wiki/index.md` (Concepts section)

- [ ] **Step 1:** Document: the contract (test 6 polices retired *path* tokens, not provider ids), the derived mechanism + exact git commands, the pinned emission/matching rule, the three owned narrowings, the composed guard + canary, the loud-fail rule, the red-base falsifier seven-field record (§7, base `323abdc`), and the named `git replace`/grafted/archive-export limitation.
- [ ] **Step 2:** Add `- [[retired-path-tokens]] — …` to the Concepts list in `vault/wiki/index.md`.
- [ ] **Step 3: Commit `docs(wiki): retired-path-tokens — the derived token mechanism (FLLWUP-59)`.**

### Task 6: Gates + falsifier evidence + PR

- [ ] **Step 1 (gates, in order, full):** `bunx tsc --noEmit`; `bun test`;
      `python3 council/validate.py`; `bash council/preflight.sh FLLWUP-59`.
- [ ] **Step 2 (arm counts):** re-run the 5-file `grep -c '^\s*test('` → 3/5/5/2 + 2.
- [ ] **Step 3 (§8.2 headline regression, scratch):** in a detached scratch
      worktree at the branch head, revert `test/ev41-retry-e2e.test.ts:325` to
      `// (c) Parent-turn falsifier — TUI branch (pty, via test/ev41-tui.py)`;
      `bun test test/faux-provider-shape.test.ts` → test 6 RED naming
      `test/ev41-tui.py`; restore.
- [ ] **Step 4 (§7 red-base at `323abdc8ffacae1d7c8cbb018889ba5d1afb8c67`):**
      `git worktree add --detach /tmp/fllwup59-base 323abdc`; transplant the
      head witness file over the base copy; `bun test
      test/faux-provider-shape.test.ts` → ≥1 violation naming
      `test/ev41-tui.py` in `test/ev41-retry-e2e.test.ts`; record raw output +
      transplant caveats (FLLWUP-55 `smoke/` tests error — driver absent at
      base; `1cf907f` not in FLLWUP-49 branch-line ancestry). Remove worktree.
- [ ] **Step 5 (§8.5/§8.6 loud-fail probes):** depth-1 `--no-local` clone →
      witness fails with the named shallow error; truncated synthetic history
      → named canary error (also pinned as automated pure tests).
- [ ] **Step 6:** push branch, `gh pr create` with per-§8-criterion evidence +
      seven-field record. End turn (no CI polling).
