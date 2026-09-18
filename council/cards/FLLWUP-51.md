---
id: FLLWUP-51
title: Loud gate for a goal wrapped onto a second line
state: Deliberating
owner: null
epic: EPIC-9
goal: A goal wrapped onto a second line is detected loudly rather than silently truncated to its first line, so a wrapped goal is refused with a diagnostic naming the wrap instead of validating green, proven by a test that fails on today's silent-exit-0 behavior.
---

## Intent

Skeptic objection 3 (FLLWUP-43 step 4, `closed-green`) settled that a goal
wrapped onto a second line parses to its first line and `council/validate.py`
exits 0 — a silent loss path in the field FLLWUP-43's deliverable governs.
Product-owner R1 ruled the wrap out of scope for FLLWUP-43 and owed as a
step-13 follow-up: `gate-parity` forbids shipping a writer-side wrap-FAIL as a
sibling of the colon ban FLLWUP-43 deletes, so this card must ship a loud gate
that is gate-parity-consistent (matched by the loader/dispatch, or an
equivalent documented surface fix) rather than a writer-only check.
FLLWUP-43's shipped copy documents the hazard ("a line break ends the value");
this card makes it loud instead of silent.

## Run record (features-deliver / FLLWUP-51, run 2)

### Step 1 — classification (facilitator)

- **Promotion applied (cited ruling).** The card arrived `Backlog`. The run-2
  Phase-1 scope ruling on `EPIC-9` ("FLLWUP-50 through FLLWUP-60 (eleven
  `Backlog` residuals under the `Done` epic) are this run's delivery scope")
  promotes it; `steward` job-1's build order places it fourth of eleven
  ("the validator / goal-oracle net (`51`, FLLWUP-43's successor")). Promotion
  commit `68e2edf`, pushed under the run-2 R3 record-push authorization.
- **Path: full council.** Cross-seam (the validator `council/validate.py`, its
  scaffold copy, and the fixture seeds carry the same parse; digests re-pin
  under AGENTS.md #5) and spec-ambiguous: the card's own hard constraint —
  gate-parity-consistent ("matched by the loader/dispatch, or an equivalent
  documented surface fix") — admits more than one reasonable design. FLLWUP-43,
  the same file family, ran full council on the same tradeoff. Steps 2–6 run
  before any code is written.
- **Surface-touching: yes.** The wrap FAIL diagnostic is user-visible copy,
  and template/procedure copy may move. Per council.md step 1 a
  surface-touching full-council card seats `designer` as a third generator.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all present in
  `council/agents/`; no `.pi/agents/` repo-local override directory exists.
  Ruling seats (`product-owner`, `steward`) are never dispatched by this
  container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared). Main checkout clean at `f8eda12` ==
  `origin/main`; `python3 council/validate.py` → `All council artifacts valid`.
  Known fact from FLLWUP-43's record, re-verified by grep: no engine code
  parses card frontmatter (`validate.py::parse_frontmatter` is the sole
  card-frontmatter parser; `extensions/index.ts::frontmatterField` parses
  procedure frontmatter, not cards) — load-bearing for the gate-parity
  constraint.
- **Gate set for this repo:** `bash council/preflight.sh FLLWUP-51`,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (AGENTS.md
  §Commands + `.github/workflows/gates.yml`). No database/import/server gate
  exists in this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run.
- **Phase-1 rulings applicable here:** run-2 R2 (merge), run-2 R3 (record
  push), step-13 follow-up confirmation re-homed to `product-owner`, and the
  binding constraint inherited from FLLWUP-43 product-owner R1 (gate-parity:
  no writer-only wrap-FAIL). All applied as recorded; nothing re-asked.