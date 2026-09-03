# Product-Owner Ruling — EPIC-4 Promotion Cadence

Date: 2026-09-03
Authority: judgment row of `/features-deliver` authority map (product-owner, escalating to steward); EPIC-4 Intent clause "stay `Backlog` until the spec lands and the human promotes them" — re-homed to me for this run.
Reversibility: edit one card's frontmatter `state:` and `Intent` line, plus this file. Cost: trivial, no merge involved.

## Ruling

**P1 — Promote EV-18 to `Ready` now.** The spec is landed (EV-16 Done, PR #11, merge `d7f97d8`) and the per-run model override seam is landed (EV-17 Done, PR #12, merge `ad53248`). EV-18's dependencies — fixture-schema definitions in spec §9 and the override-seam the fixtures pin models through (spec §4 → EV-17 implementation → merge `ad53248`) — both exist. Spec §3.4 already defines the task-id → fixture-dir → rubric-file wiring EV-18 reads from and EV-19 reads against. No other EV-18 dependency is unresolved. R-1 (storage location, `council/eval-results/`, local-only gitignored) and R-2 (repeat default 3) are already on EV-16's card face and binding for the run. EV-18's own goal and acceptance are falsifiable and do not need to change for promotion.

**P2 — Promote EV-19 only after EV-18 lands `Done`.** EV-19's acceptance says "every fixture in EV-18 has a rubric" — EV-19 reads fixtures that EV-18 produces; grading a fixture that does not exist is not a card, it is a rejection waiting to happen. Promoting EV-19 to `Ready` before EV-18 ships at least one fixture set means the EV-19 runner spends deliberation time deciding what the fixtures should have been, which is EV-18's job.

**P3 — Promote EV-20 only after EV-19 lands `Done`.** EV-20's spec hook (§3.4 wiring, §5 matrix semantics, §6 forest aggregation, §7 repetition, §8 judgment context) is independent of fixtures and rubrics, but EV-20's acceptance says "the slash command runs a declared task-and-model matrix" — executing a matrix over fixtures that don't grade yet produces scores that cannot satisfy EV-19's `Same run re-graded produces same score` clause. Runner needs the scorer to catch unmeasurable cells. R-3 (`/council-eval`), R-4 (repeat default 3), R-5 (storage location) are already on EV-20's face; those design decisions travel with the card, not with its predecessor.

**P4 — Promote EV-21 only after EV-20 lands `Done`.** EV-21's acceptance ("renders per-command and per-seat rankings with repeat count, mean, and variance per row") is meaningless without records that contain those numbers. EV-21 is the read-side of `council/eval-results/`; EV-20 is the write-side. Promotion without records renders the truthful-empty-state (EV-21 acceptance item 2) the *only* state, which is a defect class the cards deliberately tested for in EV-16 deliberation, not a useful posture.

**P5 — Cadence is automated, not packet-driven.** Apply P1 immediately; apply P2/P3/P4 as each predecessor's PR lands and `validate.py` is clean on the merged SHA. The runner applies the promotion without re-asking, per the user's instruction that "the orchestrator will apply your cadence ruling without re-asking." Per the council-runner `<board_discipline>`, the runner is the single board writer while a card is in flight; the orchestrator (the `features-deliver` orchestrator that delegated to me) is the writer between cards and may set the next card's `state: Ready` as soon as the predecessor's merge SHA is on local main and `python3 council/validate.py` is clean after the edit.

## Options rejected

- **Promote EV-18, EV-19, EV-20, EV-21 all at once.** Loses because the four cards have a chain dependency (fixtures → rubric→ matrix → leaderboard) that the spec encodes (EV-16 §11 child-card mapping). Promoting all four to `Ready` invites EV-19 to spec fixtures EV-18 should have shipped and EV-21 to read records EV-20 has not written. The run is serial — there is no parallelism to gain from the bulk promotion.
- **Promote EV-18 only, re-ask for each subsequent card individually.** Loses because the user explicitly asked me to bind the cadence now ("the orchestrator will apply your cadence ruling without re-asking") and the chain is mechanically deterministic — no judgment is needed at EV-19, EV-20, EV-21 promotion time beyond "is the predecessor's merge on local main and is `validate.py` clean."
- **Refuse to promote EV-18 and escalate to steward.** Steward escalation is correct when the ruling would change the portfolio. EPIC-4 Intent is the recorded human decision that later children stay Backlog until the spec lands and the human promotes them; that is not a portfolio decision I would reverse, it is the decision I am executing. Promotion ratification is the product-owner row of the authority map, by design.

## Grounding

- `council/cards/EPIC-4.md` Intent: "The later children depend on the spec's definitions and stay `Backlog` until the spec lands and the human promotes them" — the recorded human decision I am applying.
- `council/cards/EV-16.md` "Ruling (step 6 — product-owner/steward)" — the grader-topology ruling already on the card face, **not** touched by this ruling (would be a portfolio change → escalation). I cite only to note scope discipline.
- `council/cards/EV-17.md` Run record step 12 — merge `ad53248` on local main, gates green on the merged SHA. Observed by the EV-17 runner; I did not re-verify (runner-observed is load-bearing for the run).
- `council/cards/EV-18.md` Acceptance — "shipped fixtures directory", "one fixture per packaged seat and per shipped procedure", "runnable from a fresh checkout with no manual setup." Falsifiable as written; no goal edit required.
- `council/cards/EV-19.md` Acceptance — "every fixture in EV-18 has a rubric" — chain dependency on EV-18.
- `council/cards/EV-20.md` Acceptance + Phase 1 R-3/R-4/R-5 — `/council-eval` surface, repeat default 3, `council/eval-results/` storage. Rulings are on the card face and travel with it; no Phase 1 change needed.
- `council/cards/EV-21.md` Acceptance + Phase 1 R-6/R-7 — command name tied to EV-20 R-3; copy decisions deliberately deferred to EV-21's own deliberation (R-7 says so explicitly).
- `docs/superpowers/specs/2026-09-03-EV-16-design.md` — section 9 (fixture schema, EV-18's consumption target), §3.4 (wiring defined once), §4 (override seam, EV-17's implementation target, already merged).
- `council/procedures/features-deliver.md` "Phase 1 — the rulings preflight" + authority map judgment row — "Promotion ratification" is the product-owner row, not a packet-driven discipline. Phase 2 "single board writer" clause is what makes the runner's auto-apply legitimate when each merge lands.
- `vault/wiki/council-runner.md` `<board_discipline>` — the runner is the single writer while a card is in flight; the orchestrator writes between cards. This is the surface my cadence ruling rides on.
- `vault/wiki/product-owner.md` Cases #4 ("Promotion ratification for Backlog → Ready"), Grounding-and-escalation clause ("a ruling citing nothing is a coin flip").

## Reversibility

Cheap. To reverse P1: edit `council/cards/EV-18.md` `state:` from `Ready` back to `Backlog`, edit `council/board.md` to remove the EV-18 line from the Ready column, commit, push. To reverse any of P2/P3/P4: do the same for the relevant card. No code is touched; no merge is rolled back; no spec is changed. Cost: minutes, no PRs.
