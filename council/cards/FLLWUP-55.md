---
id: FLLWUP-55
title: Collapse the smoke driver's private pty screen model onto the shared kit
state: Deliberating
owner: null
epic: EPIC-9
goal: smoke/search-smoke/driver.py consumes the shared pty screen model instead of carrying its own class Screen/class Session, with the release gate's pinned-pi isolation and the README's stdlib-only claim preserved or explicitly amended.
---

## Intent

FLLWUP-49's goal scoped its universe to `test/` plus `ev43/`, so
`smoke/search-smoke/driver.py`'s own `class Screen`/`class Session` (the fourth
definition, O4) was left untouched and named as a bounded residual — the
`steward` FLLWUP-49 ruling called that "a scoping decision matching O4, not a
permanent portfolio acceptance". This card is that residual: decide whether the
smoke driver can import the shared kit without coupling the release gate (which
installs a pinned external pi 0.84.3) to a `test/` module that resolves the
dev-installed pi, and without falsifying `smoke/search-smoke/README.md`'s
"authored in the driver" claim. If it cannot, the card's deliverable is the
recorded rationale plus an amended README claim — not a forced share.

Approved by `product-owner` (job-29) as-is from FLLWUP-49's step-13 draft.

## Run record (features-deliver / FLLWUP-55 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block, 284ced2): `FLLWUP-50` through `FLLWUP-60`
  "are this run's delivery scope". `FLLWUP-55` is the **eighth** of eleven in
  the `steward` job-1 build-order ruling ("harness hygiene (`55`, then `56`,
  whose live arm must precede the budget cards)"). Run-1 precedent (5608ed1)
  and run-2 precedents (FLLWUP-60 `08fdb83`, FLLWUP-57 `bb5c5e8`, FLLWUP-53,
  FLLWUP-50, FLLWUP-54): the autonomous promotion moves the residual card to
  its working state at its runner's start. `python3 council/validate.py`
  clean after both state moves.
- **Path: full council.** The `goal` is a decision between two admissible
  designs — (a) the smoke driver imports the shared pty kit
  (`test/faux-provider/pty_kit.py`, the FLLWUP-49 shape-test-pinned single
  `class Screen`/`class Session`), or (b) it does not, and the deliverable is
  the recorded rationale plus an amended README claim. The card's `Intent`
  names the tradeoff explicitly (release-gate independence from a `test/`
  module vs. the fourth screen-model copy) and pre-authorizes "not a forced
  share". That is `spec-ambiguous` (the goal admits more than one reasonable
  design) and `design-judgment` (a real tradeoff exists) per council.md
  step 1 — either alone is sufficient for a full council.
- **Surface-touching: yes (recorded).** `smoke/search-smoke/README.md` is the
  harness manual and the manual procedure — a surface a person reads — and it
  pins the greppable claim "`driver.py` imports python3 stdlib only … The
  screen model and the byte table are authored in the driver"
  (`README.md:114-116`). Every branch of the card's decision touches that
  claim (a share falsifies "authored in the driver"; the no-share branch's
  named deliverable is "an amended README claim"), so this card's
  deliverable includes user-visible copy by construction. The orchestrator's
  card face confirms: an amended README claim is a copy change, and if its
  wording is open judgment this container escalates with the drafted string
  rather than self-rules. `designer` is therefore seated as a third generator
  in steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` — the seats this card may
  dispatch — all resolve; the nine packaged seat files are present in the
  installed package clone
  (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`) and
  no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by
  this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the run); run for information only →
  not run by this container at card start (FLLWUP-49/57 precedent). Local
  `main` == `origin/main` at `a0a11ab` (FLLWUP-54 merged at `52f2144`,
  merged-SHA CI green), working tree clean. `python3 council/validate.py` →
  `All council artifacts valid`. No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at card
  start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-55`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  any `smoke/` or `test/faux-provider` file — `council/fixtures/*/seed/`
  holds each fixture's own council/test/src trees only (verified by listing;
  no `driver.py` anywhere under `council/fixtures/`), so AGENTS.md #5's
  `seed.treeDigest` machinery is untouched. `test/prose.test.ts` pins
  `council.md` procedure prose — this card touches no procedure text. The
  FLLWUP-49 shape test (`test/faux-provider-shape.test.ts`) greps
  repo-wide for `class Screen`/`class Session` and today expects exactly two
  files (`test/faux-provider/pty_kit.py`, `smoke/search-smoke/driver.py`) —
  a share that removes the driver's own definitions moves that count, which
  the shape test's expectation will have to track; noted for the
  deliberation, not decided here.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position; R2 governs
  the later merge; R3 governs the promotion/record pushes (disclosed per
  [[record-push-discipline]]). No card-specific Phase-1 ruling exists beyond
  R2/R3; the orchestrator's card face itself is not a ruling seat's product,
  and its "decide whether" framing is the deliberation's to resolve.
