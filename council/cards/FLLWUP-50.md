---
id: FLLWUP-50
title: Supported refresh path for packaged council tooling in initialized consumer repos
state: Deliberating
owner: null
epic: EPIC-9
goal: A consumer repo initialized against an earlier pi-council install can bring its packaged council tooling (council/validate.py, _template.md, the procedures, the docstrings) up to the currently installed package's version through a documented, supported path, without overwriting consumer-edited board, cards, or wiki.
---

## Intent

`scaffoldInto` is non-clobbering (AGENTS.md #6) and `council/validate.py` has no
override-resolution path (unlike seats, procedures, and fixtures). A consumer
repo initialized before FLLWUP-43 therefore keeps the old colon-space FAIL, the
`_template.md` warning sentence, the docstring, the `board-create-card.md`
paragraph, and the `features-new.md` bars indefinitely — unbounded, silent
skew. The steward ESC-3 disposition (recorded on `council/cards/FLLWUP-43.md`)
rules unbounded skew is not acceptable as a permanent state and cards this as
the mitigation; an override path alone is insufficient — this card must deliver
an adoptable path. Acceptance shape is steward-authored (the `goal` above); the
mechanism is this card's design.

## Run record (features-deliver / FLLWUP-50, EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion applied (`Backlog` → `Ready`), not asked.** The run-2 Phase-1
  **scope** ruling (`EPIC-9.md`, "Residual run 2 — Phase 1 rulings":
  "`FLLWUP-50` through `FLLWUP-60` (eleven `Backlog` residuals under the
  `Done` epic) are this run's delivery scope") promotes this card, and
  `steward`'s job-1 build order places it **sixth of eleven** ("then the
  refresh path over the settled payload (`50`)" — landing after the payload
  is settled by `FLLWUP-51` and `FLLWUP-53`). Run-2 precedent: each earlier
  card's runner applied the same autonomous promotion at its start
  (FLLWUP-60 `08fdb83`, FLLWUP-57 `bb5c5e8`, FLLWUP-51 `68e2edf`,
  FLLWUP-53's step-1 record). Promotion commit pushed under R3
  (disclosed in the report).
- **Path: full council.** Cross-seam — the deliverable spans the engine
  command surface (`extensions/index.ts` `council-init`,
  `extensions/scaffold.ts`), the scaffold tree (`council/scaffold/**`), and
  the packaged tooling files the `goal` names (`council/validate.py`,
  `council/cards/_template.md`, the procedures, the docstrings) — and
  spec-ambiguous by construction: steward's ESC-3 disposition explicitly
  left the mechanism open ("mechanism is that card's design"; "an override
  path alone is insufficient; the card must deliver an adoptable path"), and
  the `goal` admits more than one reasonable design (a refresh mode on
  `/council-init`, a separate command, a documented manual path,
  confirm-per-file vs all-or-nothing, what counts as "consumer-edited").
  Steps 2–6 run before any code is written.
- **Surface-touching: yes.** The deliverable changes what a person reads and
  does: `/council-init` output copy, any new refresh-path prose/diagnostics,
  and the documented path itself. Per council.md step 1 a surface-touching
  full-council card seats `designer` as a third generator in steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine
  packaged seat files are present in the installed package clone
  (`council/agents/`), and no repo-local `.pi/agents/` override directory
  exists, so nothing shadows them. Ruling seats (`product-owner`,
  `steward`) are never dispatched by this container per
  `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it). Main checkout clean at `15852ae` ==
  `origin/main` (FLLWUP-53's close); `python3 council/validate.py` →
  `All council artifacts valid`. No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at card
  start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bash council/preflight.sh FLLWUP-50`, `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py`. No database/import/server gate exists in
  this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run. Owner gates
  met in full regardless of change size.
- **Phase-1 rulings applicable here (applied, cited, not re-asked):** R2
  (merge, run-scoped `--admin`), R3 (record push, run-scoped, disclosed),
  step-13 follow-up confirmation re-homed to `product-owner`, and the
  steward **ESC-3 disposition** itself — the acceptance shape recorded
  verbatim on `FLLWUP-43.md`, which is this card's `goal`. Noted, not
  re-ruled: FLLWUP-51's product-owner item 2 ruled the positional-`goal`
  red-by-design consequence acceptable for consumer cards and owed release
  notes calling out that `goal:` is now positional — a refresh path that
  installs the new `validate.py` into consumer repos is the mechanism by
  which that consequence arrives, so the deliberation must treat
  consumer-card validation behavior as in-surface. FLLWUP-51 (`dee64c5`)
  and FLLWUP-53 (`e3b070c`) are recent merges whose pins must stay green
  (10-copy byte parity of `validate.py`, the widened packaged-prose guard in
  `test/prose.test.ts`, the positional-rule no-false-positive pin).
- **Grounded facts (verified at this tree):** the scaffold tree ships 8
  files (`council/board.md`, `council/cards/_template.md`, `.council.json`,
  `council/preflight.sh`, `council/validate.py`, `vault/CLAUDE.md`,
  `vault/wiki/index.md`, `vault/wiki/log.md`); `scaffoldInto`
  (`extensions/scaffold.ts`) is non-clobbering — existing files are reported
  `skipped` and left byte-for-byte untouched; the `council-init` handler
  (`extensions/index.ts:836-868`) calls
  `scaffoldInto(repoRoot, path.join(PKG_ROOT, "council", "scaffold"))` plus
  dep pinning, chmod on preflight.sh, and created/skipped reporting;
  procedures resolve override-aware from
  `<repo>/$CONFIG_DIR_NAME/council/procedures/` first-hit over `PKG_ROOT`
  (so a consumer repo reads the *installed package's* procedures unless it
  has its own copies — a stale local copy would shadow a newer one);
  `council/validate.py` has no override-resolution path (it is a
  scaffold-copied file executed by path, unlike seats/procedures/fixtures).