---
id: FLLWUP-43
title: Make the goal field a lossless oracle for the judge
state: Deliberating
owner: null
epic: EPIC-9
goal: A card goal can name an exact literal that contains a colon-space sequence without truncating, and the judge reads the same string the classification test asserts.
---

## Intent

`council/validate.py`'s colon-space rule and `_template.md`'s warning forbid
`: ` in a goal, so EV-37's goal spelled pi's emitted literal without its
colon and the judge — whose only input is the goal — passed a branch that
never matched pi's real message. The rule worked (it FAILs); the authoring
response made the goal a lossy oracle. Named by the steward closure ruling as
owed before the next autonomous run.

## Run record (features-deliver / FLLWUP-43)

### Step 1 — classification (facilitator)

- **Path: full council.** The card is cross-seam (the validator
  `council/validate.py`, its scaffold copy, the card template `_template.md`,
  and the authoring procedure `board-create-card.md` all carry the same
  colon-space rule, and the eval fixture seeds carry pinned copies), and its
  `goal` admits more than one reasonable design: a plain-line rule whose
  parser is provably lossless, a quoted/escaped value with a documented
  unquoting step, or a block-scalar form. That is spec ambiguity plus a real
  authoring-compat tradeoff, so steps 2–6 run before any code is written.
- **Surface-touching: yes.** The deliverable changes copy a person reads —
  the `_template.md` warning sentence, the `board-create-card.md`
  "Hard failure mode" paragraph, and the `validate.py` FAIL message. Per
  council.md step 1 a surface-touching full-council card seats `designer` as
  a third generator in steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all present in
  `council/agents/`; no `.pi/agents/` repo-local override directory exists, so
  nothing shadows them. Ruling seats (`product-owner`, `steward`) are never
  dispatched by this container per `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared the environment). Main checkout clean at
  `c02380c` == `origin/main`; `python3 council/validate.py` →
  `All council artifacts valid`. No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at the
  start of the card.
- **Gate set for this repo** (authoritative; `docs/gates/GATE-EVIDENCE.md`
  does not exist here): `bash council/preflight.sh FLLWUP-43`,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (AGENTS.md
  §Commands + `.github/workflows/gates.yml`). No database/import/server gate
  exists in this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run.
- **Phase-1 rulings applicable here:** none of the recorded EPIC-9 run
  rulings (scope, sequencing, merge, follow-up re-homing, R1
  union-merge-reconcile) decides any question this card raises; they govern
  process only. Nothing is re-asked.

### Step 2 — independent first pass

Card set `Deliberating` on the card frontmatter and on `council/board.md`;
`python3 council/validate.py` → `All council artifacts valid`. Dispatching
`owner`, `principal`, and `designer` in parallel, each given only this card
(no peer position).
