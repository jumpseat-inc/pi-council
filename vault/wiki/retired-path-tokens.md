---
title: Retired-Path Tokens
type: concept
summary: The shape witness's retired-path token list is derived from git HEAD ancestry, not hand-maintained — a retirement enters the set automatically and a stale reference reds with the token and file named.
aliases: [retired-path tokens, token allowlist, shape witness tokens, derived token set]
tags: [pi-council/concept, pi-council/smoke-test]
sources: ["[[2026-09-19-po-fllwup59-step13-ruling]]", "[[2026-09-18-epic9-residual-run-2-ledger]]"]
created: 2026-09-18
updated: 2026-09-22
---

# Retired-Path Tokens

FLLWUP-59. The shape witness's token list is **derived, not hand-maintained**.
Test 6 of `test/faux-provider-shape.test.ts` polices retired **path** tokens —
not provider ids (test 2's provider count and test 4's class count are
different policing). Before FLLWUP-59 the list was a hand-written regex
(`/ev40-harness\/|ev43\/falsifier|ev43\/ev43-falsifier/`) that had already
missed once (the `test/ev41-tui.py` source-comment token at
`test/ev41-retry-e2e.test.ts:325`, found by FLLWUP-48): a token retirement
with a stale comment mention was green-by-omission, byte-indistinguishable
from a clean tree. The derived mechanism removes the list: a retirement
enters the set automatically, and a stale reference reds with the token and
file named.

## Mechanism

Two pure functions plus a thin impure wrapper, inside the witness file:

- **Derivation** — retired paths = paths in HEAD ancestry, absent from the
  live tree, **excluding Python bytecode** (`__pycache__` segments,
  `.pyc/.pyo/.pyd` suffixes — the same exclusion the scan itself applies;
  15 non-bytecode tokens at implementation time).
- **Enumeration** (impure, read-only `git` `spawnSync` from `REPO_ROOT`, the
  same benign spawn class as test 8's `python3 -m py_compile`):
  - `git log --no-renames --pretty=format: --name-only HEAD`
  - `git ls-tree -r HEAD --name-only`
  - `--no-renames` is mandatory: default rename detection hides `git mv`
    retirements (measured — a pure rename shows only the new path).
  - **HEAD-ancestry only, never `--all`**: `--all` makes the verdict a
    function of the local ref set (a side-branch-only retired path enters the
    set when the branch exists locally, leaves when it is deleted —
    nondeterministic). No mainline retirement can be missing from HEAD
    ancestry because AGENTS.md forbids rewriting `main` history.
- **Emission (pinned rule)**:
  - *Path fragments*: each retired file path plus its segment-aligned suffix
    fragments (`test/ev40-harness/harness-headless.ts` → also
    `ev40-harness/harness-headless.ts` and `harness-headless.ts`), emitted
    iff **no live tracked path contains it as a substring** (so bare
    `ev41-tui.py` is suppressed — live `test/faux-provider/ev41-tui.py`
    collides — while `test/ev41-tui.py` is emitted and reds the historical
    miss).
  - *Dir tokens*: **retired ancestor directories** (ancestor dirs of retired
    paths that no live tracked path has as a prefix) plus their
    segment-aligned suffix dir fragments, with trailing slash
    (`test/ev40-harness/`, `ev40-harness/`, `ev43/`, `smoke/artifacts/`,
    `artifacts/`), emitted iff no live tracked path carries the dir as a
    **path segment** (a prefix *or* any interior segment — `/…/skills/…/`
    counts). Dir tokens never derive from *live* ancestor dirs
    (`council/cards/`, `vault/wiki/`): emitting `cards/`/`wiki/` reds
    legitimate `council/cards/…` prose — measured, not taste.
    Segment-liveness also suppresses a suffix that merely collides with a live
    segment: retiring `.agents/skills/**` emits the suffix `skills/`, but live
    `.pi/skills/**` fires the segment rule and suppresses it, so the
    legitimate live path `skills/usages/SKILL.md` (the `/usages` scaffold
    destination) does not red. Prefix-only liveness missed this — measured on
    the skills consolidation commit, not taste.
  - The collision universe is live tracked **paths** (`ls-tree`), never file
    **contents** — a content-aware universe re-creates the hand-maintained
    exclusion list this card exists to kill.
- **Matching (pinned rule)**: a path fragment (no trailing `/`) violates on a
  plain **substring** match; a dir token (trailing `/`) violates only when
  followed by a **path-continuation character** `[A-Za-z0-9_./-]`. Each
  clause is load-bearing: continuation-char keeps HEAD green
  (`test/ev43-reachability.test.ts:6` "the retired ev43/ scratch extension" —
  space after), substring fragments catch `via test/ev41-tui.py` and make the
  re-fixtured FLLWUP-48 probe red.
- **Scan domain**: `TEST_DIR` (all of `test/`, witness self-excluded,
  bytecode excluded) — byte-identical to the pre-FLLWUP-59 scan. Test 6 never
  reads `smoke/` (the FLLWUP-55 charter extension is tests 9–11 via
  `SMOKE_DRIVER`, untouched).

## Loud-fail guard (composed)

Before deriving, both halves must pass; each failure names its cause and
fails the witness — never a silent pass:

1. **Structural shallow check**: `git rev-parse --is-shallow-repository` —
   `true` → named FAIL. Measured: a depth-1 `--no-local` clone reports `true`
   AND yields an empty HEAD-ancestry retired set; an empty-output guard does
   NOT fire (the grafted tip's own diff is non-empty), only this does.
2. **Retirement canary**: the derived **retired-path set** (pre-suppression —
   never the emitted fragment set; `test/ev41-tui.py` is collision-suppressed
   from fragments and a fragment canary would be unsatisfiable) must contain
   both `test/ev41-tui.py` and `test/ev40-harness/`. Missing → named FAIL
   ("retirement canary absent — history truncated"). A retired path cannot
   un-retire: the canary is a tripwire, not an allowlist; it covers histories
   the shallow check cannot see (windowed fetches, archive exports, a future
   workflow edit).

**CI substrate**: `.github/workflows/gates.yml`'s checkout step carries
`fetch-depth: 0` — without it every CI run loud-fails (a permanently red gate
is not shippable). The line rides the same PR as the mechanism.

## Owned narrowings (pinned two-sided in the witness)

Three mention classes are out of scope by design, each pinned by a
scratch-source probe:

1. **Bare-dir prose**: a dir token followed by a non-continuation char ("the
   retired ev43/ scratch extension") → green. Mechanically indistinguishable
   from legitimate retirement documentation.
2. **Bare basename of a relocated path**: `ev41-tui.py` without directory →
   green (suppressed: the live `test/faux-provider/ev41-tui.py` collides).
3. **Intentional full-path prose** mentioning a retired path → red — the
   escape valve is rewording (prose discipline, same as `prose.test.ts`
   forcing `features-deliver.md`). If a future contributor declines, the
   in-mechanism escape becomes a hand-maintained exclusion list: that is the
   known, owned decay boundary, stated here rather than hidden.

Positive tripwires (all red): `see ev43/falsifier-headless.ts`,
`via test/ev41-tui.py`, a source carrying
`test/ev40-harness/harness-headless.ts`.

## Red-base falsifier (seven-field record)

1. **Base identity**: `323abdc8ffacae1d7c8cbb018889ba5d1afb8c67` —
   required base; selection rule: the first tree in HEAD ancestry where both
   the retirement and the stale reference exist (the FLLWUP-49 mechanism
   merge that created the stale reference). NOT its parent `fce0ecb`: at
   `fce0ecb` the retirement has not happened (`test/ev41-tui.py` live,
   `test/ev40-harness/` 3 live files) and the checker yields 0 violations.
2. **Transplant identity**: the head `test/faux-provider-shape.test.ts`
   (source head: the FLLWUP-59 implementation commit) materialized over the
   base worktree's witness copy — at `323abdc` the committed witness is the
   original FLLWUP-49 version with no derived mechanism.
3. **Exact command**: `bun test test/faux-provider-shape.test.ts` (both halves).
4. **Raw red output**: recorded on the FLLWUP-59 PR (per-failure lines; the
   red must name the `test/ev41-tui.py` full path in
   `test/ev41-retry-e2e.test.ts`).
5. **Worktree provenance**: detached checkout at the base sha in a separate
   worktree; main checkout untouched; removed after the run.
6. **Copy set**: the transplanted witness file only (bare copy otherwise).
   **Transplant caveats**: (a) at `323abdc` the `test/faux-provider/` station
   exists **and** `smoke/search-smoke/driver.py` exists with pre-kit content (it
   does not yet import `pty_kit`; FLLWUP-55 collapsed it later) — so the
   transplanted witness's tests 9–11 fail as content assertions on a file that
   is present, not as missing-file errors; either way copy-set-dependent, not
   mechanism-absent; (b) FLLWUP-48's merged commit `1cf907f` is NOT in the
   FLLWUP-49 branch-line ancestry, which is why the pre-fix `:325` comment
   survives at the base — do not "fix" the base SHA on that account.
7. **Head half**: same command at the FLLWUP-59 head, `0 fail`.

**Named limitation**: `git replace`/grafted/archive-export histories are
guarded by the canary (any truncated history loses both targets and trips
loudly); live reproduction of that failure class was not cheaply runnable at
implementation time and is deferred — the miss class is **loud, not silent**.
The limitation stays named deliberately (no quiet upgrade to "verified for all
classes"). **Re-card trigger** (FLLWUP-59 R2, 2026-09-19): a non-zero/non-full
fetch depth anywhere in a workflow (which would make the canary CI-load-bearing
yet unreliable), or any report of a silently-partial derived set — then a
falsifier card closes the class. See
[[2026-09-19-po-fllwup59-step13-ruling]].
