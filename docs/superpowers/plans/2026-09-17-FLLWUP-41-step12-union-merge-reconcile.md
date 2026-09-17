# FLLWUP-41 — council.md step 12 names the union-merge reconcile

Mechanical card; design handoff is the card itself (`council/cards/FLLWUP-41.md`)
plus binding Phase-1 ruling **R1**: the documented union-merge reconcile is the
sanctioned non-destructive repair for a non-fast-forward on local `main`; the
never-force guard stands.

## Goal

`council/procedures/council.md` step 12 ("Sync and reconcile") currently HALTs
a diverged `main` on a literal reading ("stop and surface that to the human").
New text names the union-merge reconcile as the sanctioned repair, keeps the
never-force guard (no force-push, no rewind, no discarding a side), and carries
the reconcile's own discipline: union-keep both record sides, validator clean,
conflict-marker sweep (the wiki's documented failure mode).

## Steps

1. **TDD red.** Add a literal-substring pin in `test/prose.test.ts`:
   whitespace-normalized step-12 section (from `## 12. Sync and reconcile` to
   `## 13. Card the follow-ups`) must contain "union-merge reconcile", "the
   sanctioned non-destructive repair", "force-pushing, rewinding, or discarding
   a side", "forbidden", "`council/validate.py`", and "conflict markers".
   Record red output before editing the procedure.
2. **Edit** `council/procedures/council.md` step 12 paragraph 1 only. Keep the
   downstream paragraphs (Done marker, validate/push) untouched.
3. **TDD green.** Rerun `bun test test/prose.test.ts`; record output.
4. **Gates, in order** (authoritative: `.github/workflows/gates.yml`):
   `bash council/preflight.sh FLLWUP-41`, `bunx tsc --noEmit`, `bun test`,
   `python3 council/validate.py`. Record real output of each.
5. Commit (`feat(council): step 12 names the union-merge reconcile as the
   sanctioned non-fast-forward repair`), push, open PR.

## Constraints

- Domain-neutral prose: no `bun`/`bunx`/`tsc`/`typescript`, no `registry`,
  no `named agent`, no removed product domain, no old `deliver.md` filename.
  No repo-specific literal path construction for the wiki page; the pattern is
  described generically (as `vault/wiki/union-merge-reconcile.md` documents it).
- No existing assertion narrowed; no scope beyond step 12's first paragraph.
- Main-repo immutability: work in `.worktrees/fllwup-41` branched from
  `d5a24053d1c59fc1be69a43a45292f5b869054d1` (= `origin/main`); never move
  `main`.
