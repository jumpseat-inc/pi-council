---
id: FLLWUP-53
title: De-repo-specific council.md step 8's gate-file reference and widen the prose guard
state: Ready
owner: null
epic: EPIC-9
goal: council.md no longer hard-references a gate document path that does not exist in this repo, and the packaged-prose guard covers every shipped file that could reintroduce one.
---

## Intent

FLLWUP-47 step 4 objection O7 (`closed-green`) confirmed a live, unguarded
instance of the failure FLLWUP-47 exists to prevent: `council.md` step 8
(lines 237-238 today) states "`docs/gates/GATE-EVIDENCE.md` is the
authoritative record of what those gates are and how to run them" — a hard,
source-repo-specific path presented as fact in a procedure that ships to every
consumer repo. That path does not exist in this repo (`docs/` holds only
`superpowers/`). The existing guard (`test/prose.test.ts`, the "features-deliver
does not hard-reference the repo-specific gate file" test at :28-34) reads
`features-deliver.md` alone, so it does not catch a second naming — FLLWUP-47
was explicitly constrained not to fix this (its spec §6 names it as a
step-13 residual). `owner.md` inside `<owner_mode>` carries the same path, but
as an `e.g.` example, which is weaker. The card is: replace the hard reference
with consumer-neutral phrasing (the repo's own authoritative gate record, if it
keeps one) and widen the guard to all packaged seat + procedure prose, rewording
`owner.md`'s example in the same pass if the widened guard requires it.

## Run record (features-deliver / FLLWUP-53, EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** The run-2 Phase-1
  scope ruling (284ced2, `EPIC-9.md` run-2 block) names the eleven `Backlog`
  residuals FLLWUP-50–60 as this run's delivery scope; the dispatch input
  orders this card **fifth of eleven** (steward build-order ruling, job-1).
  Run-2 precedent: each earlier card's runner applied the same autonomous
  promotion at its start (FLLWUP-60 commit `08fdb83`, FLLWUP-57 `bb5c5e8`,
  FLLWUP-51 `68e2edf`). Cited ruling: Phase-1 **scope** (this run's own
  recorded human decision). Promotion commit pushed under R3 (disclosed in
  the report).
- **Path: mechanical.** The deliverable is confined to one seam — packaged
  procedure + seat prose and its own regression guard: (1) the single
  hard-reference sentence in `council/procedures/council.md` step 8, (2) the
  widened guard in `test/prose.test.ts` (the existing `councilMarkdown()`
  helper already enumerates every packaged seat + procedure body, so the
  widening is the existing guard's scope, not a new mechanism), and (3) the
  `e.g.` example in `council/agents/owner.md` reworded in the same pass
  because the widened guard otherwise reds it. The `goal` fixes the outcome
  and the `Intent` fixes the method; the residual choices (exact replacement
  phrasing, guard's forbidden token) are implementation choices, not a real
  tradeoff. No cross-seam reach: no engine module, no `validate.py`, no
  scaffold or fixture tree carries `council/procedures/` or `council/agents/`
  (verified by find; also no `GATE-EVIDENCE` token in either), so no digest
  re-pin is owed. Steps 2–6 skipped per council.md step 1.
- **Surface-touching: yes (recorded).** The deliverable changes procedure
  prose a person (the operator/facilitator) reads. On a mechanical card this
  seats no `designer` (council.md step 1); any design concern is a step-13
  follow-up candidate, never a reason to reopen. (FLLWUP-60, the same prose
  class, recorded the same call.)
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in the installed package clone
  (`council/agents/`, byte-identical `owner.md` confirmed by diff), and no
  repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by
  this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information → `PASS: preflight
  clean`, exit 0. Main checkout clean, `HEAD` == `origin/main` at `45d3b8a`
  (the FLLWUP-51 close). `python3 council/validate.py` → `All council
  artifacts valid`. No `Needs Human` state and no outstanding ruling on this
  card — deterministic merge check criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here — the very fact this
  card fixes): `bash council/preflight.sh FLLWUP-53`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Grounded facts (verified at this tree):** the live instance is
  `council.md:237-238` ("`docs/gates/GATE-EVIDENCE.md` is the authoritative
  record of what those gates are and how to run them"); `owner.md:97-99`
  carries the same path as an `e.g.` example ("Where the repo keeps an
  authoritative gate document (e.g. `docs/gates/GATE-EVIDENCE.md`), it
  outranks the wiki"); the guard (`test/prose.test.ts:28-34`) reads
  `features-deliver.md` alone; the `councilMarkdown()` helper at :7-17
  already scans all `council/agents/*.md` + `council/procedures/*.md`; no
  other packaged prose names the path (grep over `council/`, `docs/`,
  `test/` — card records and plans naming it are historical records and are
  not packaged prose). Existing pins that must stay green: FLLWUP-60's step-12
  record-push pin and FLLWUP-51's wrapped-goal pin (both in
  `test/prose.test.ts`), FLLWUP-41/42's pins, FLLWUP-47's red-base pins, and
  the stack-neutrality guard (replacement prose must stay free of
  `bun`/`bunx`/`tsc`/`typescript`).
- **Rulings applied here (cited, not re-asked):** R2 governs the later
  merge; R3 governs this run's record pushes (run-scoped, disclosed);
  step-13 follow-up confirmation is re-homed to `product-owner`. No
  card-specific Phase-1 ruling beyond R2/R3 (per the dispatch input).
