---
title: Shape-Witness Segment-Liveness Fix
type: source
summary: The FLLWUP-59 derived-token witness's first failure on main was a false positive, not the silent miss it was built to prevent — retiring `.agents/skills/**` emitted dir token `skills/`, which no live path has as a prefix but which is live as an interior segment under `.pi/skills/**`; the repair makes dir-token liveness segment-aware.
aliases: [shape witness false positive, segment-liveness fix, skills/ token false positive, dir-token liveness]
tags: [pi-council/bugfix, pi-council/smoke-test]
sources: ["[[retired-path-tokens]]", "[[non-clobbering-scaffold]]", "[[usages-report]]"]
created: 2026-09-22
updated: 2026-09-22
---

# Shape-Witness Segment-Liveness Fix

> ⚠️ Derived from commit `3e34f01` "fix(test): make shape-witness dir-token
> liveness segment-aware" (captured 2026-09-22). No version bump — a
> test-mechanism repair, not product behaviour. Test-only diff:
> `test/faux-provider-shape.test.ts`, `vault/wiki/retired-path-tokens.md`,
> `docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md`.

A CI failure on `main` at `0.34.1` (`ef8bc9a`) red one test (`1462 pass / 6
skip / 1 fail`) — traced not to a stale path but to the shape witness
reddening a **legitimate live** path. This was the first time the FLLWUP-59
derived-token mechanism failed in production, and it failed **noisy** (false
positive) — the mirror of the silent miss it was built to prevent
([[retired-path-tokens]]).

## The failure

`test/faux-provider-shape.test.ts` test 6 (`no retired path token survives
under test/ (derived set — FLLWUP-59)`) red with a single violation:

```
test/scaffold.test.ts (dir) skills/
```

`test/scaffold.test.ts` asserts `copyUsagesSkill` creates
`<repo>/$CONFIG_DIR_NAME/skills/usages/SKILL.md` and
`.../scripts/usages.py` — a legitimate live destination, not a stale
reference ([[usages-report]], [[non-clobbering-scaffold]]).

## Root cause

The witness derives retired paths (`git log --name-only HEAD` minus
`git ls-tree -r HEAD`), then emits path fragments and **dir tokens** = retired
ancestor dirs plus their segment-aligned suffix fragments. Commit `1b982dd`
("consolidate skills under .pi") moved `.agents/skills/**` → `.pi/skills/**`
and repointed the scaffold payload to `council/skills/usages/`. That retired
`.agents/skills/**`, whose retired ancestor `.agents/skills/` emitted the
suffix dir token `skills/`.

Dir-token suppression was **prefix-only**: `live.some((l) => l.startsWith(f + "/"))`.
No live path *starts with* `skills/`, so the token survived — but `skills/` is
live as an **interior segment** under `.pi/skills/**` (and `council/skills/**`).
Prefix-only liveness therefore cannot see a directory whose name is live
somewhere other than the root; the token then substring-matched
`skills/usages/SKILL.md` and red a false positive.

## The fix

Emit a dir token iff **no live tracked path carries it as a path segment** —
prefix or any interior segment:

```ts
live.some((l) => `/${l}/`.includes(`/${f}/`))
```

This is the dir-token analogue of the path-fragment substring-liveness rule;
the collision universe stays live tracked **paths** (`ls-tree`), never file
contents. The intended tokens are untouched — `test/ev40-harness/`,
`ev40-harness/`, `ev43/`, `smoke/artifacts/` appear as no live path's segment —
so the FLLWUP-59 red-base record stays valid.

## Falsifier and gates

- A pure probe was witnessed **red first**: `dir tokens colliding with a live
  path SEGMENT are suppressed` — `deriveRetiredTokens([".agents/skills/x.md"],
  [".pi/skills/y.md"])` must not emit `skills/`.
- Full suite: **1464 pass / 6 skip / 0 fail** across 113 files (`bun test`,
  ≈112s); `bunx tsc --noEmit` and `python3 council/validate.py` green;
  [[preflight]] (`council/preflight.sh`) PASS.
- The concept page [[retired-path-tokens]] and a
  `docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md` addendum were
  updated in the same commit.

## Failure-class note (folded into [[retired-path-tokens]])

The FLLWUP-59 risk model owned *under-emission* (green-by-omission). This is
its **over-emission** sibling: a token that reds a legitimate live path. The
generalizable lesson: a derived directory-name token is live when it appears as
a path **component** anywhere, not merely at a prefix. A mass move that retires
a common-basename directory is the fragility surface; segment-aware liveness
narrows it.

## Process note (flag, not a concept change)

The repair was pushed **directly to `main`**; GitHub printed "Changes must be
made through a pull request" and the branch-protection bypass allowed it. No
card was filed on [[engineering-board]]. This is a human-invoked hotfix,
distinct from the autonomous-run scope of [[record-push-discipline]]; recorded
here rather than folded into that concept. FLLWUP-59's re-card trigger (R2:
"any report of a silently-partial derived set") does **not** fire — this
failure was neither silent nor partial.

## Related

- [[retired-path-tokens]] — the mechanism, and where the failure class is folded
- [[non-clobbering-scaffold]], [[usages-report]] — the live `skills/usages/`
  destination the false positive hit
- [[test-suite-budget]] — the suite envelope this repair nudged to 1470 tests
- [[smoke-test]] — the shape witness's sibling test discipline

## Sources

- Commit `3e34f01` on `main`
- `test/faux-provider-shape.test.ts` (`deriveRetiredTokens`, test 6, the new
  pure probe)
- `vault/wiki/retired-path-tokens.md`,
  `docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md`
