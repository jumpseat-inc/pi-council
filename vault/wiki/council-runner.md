---
title: Council Runner
type: entity
summary: The per-card autonomous execution container — dispatched by /features-deliver to run the full /council loop for one card in an isolated context; routes, counts, and writes the board but never decides.
aliases: [council-runner, runner]
tags: [pi-council/seat]
sources: ["[[2026-08-24-bugfix-seat-prose]]", "[[2026-09-05-epic6-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-06
---

> ⚠️ Derived from `council/agents/council-runner.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-flash-0731:medium`.
**Tools:** Read, Grep, Glob, Edit, Write, Bash, task, hub.
**Spawns:** `[owner, principal, designer, skeptic, consolidator, judge]` — it
dispatches the working seats, **never the ruling seats** (product-owner/steward).
**MCP:** `[context7, tavily]`.
**Superpowers pointers:** writing/executing-plans, subagent-driven-development,
verification-before-completion, finishing-a-development-branch.

## Role

A **facilitator for exactly one card** (dispatched by /features-deliver's
Phase 2; the facilitator role per [[facilitator]]), executing the full
`/council` loop in its own turn. It decides
nothing — routes work, counts rounds/dispatches, writes the board. The human's
reserved powers are re-homed per the authority map in `features-deliver.md`.

> ⚠️ **Corrected (v0.10.0):** this page previously asserted the runner
> "dispatches the working seats" as fact. Before v0.10.0 that was aspirational
> — hub tools were never on the child's `--tools` allowlist, so the runner
> HALTed before dispatching a single seat and `/features-deliver` was broken
> end-to-end. Found by the [[smoke-test]]'s first round; fixed by the
> smoke-test bugfix; see [[2026-08-25-smoke-test-bugfixes]] bug 3.

## Distinctive contracts

- **Escalation contract** — rulings aren't dispatched; it checks Phase 1
  standing rulings first, else ends with an `ESCALATION` report carrying **facts,
  not a recommendation**, and resumes with the ruling.
- **Board discipline** — while a card is in flight it is the **single writer** of
  the board + card file; every state transition is committed immediately
  (durable-state), `validate.py` after every board write.
- **Step-9 iteration cap** — ≤3 verify→fix→verify cycles per card.
- **Convergence is not evidence** — agreement between independently-dispatched
  seats is a shared hypothesis, not a test result.
- **Dispatch discipline** — every dispatch bounded and note/waited; a `stalled`
  re-dispatch is treated like a timeout; never dispatch a third time.
  **Poll-slice long waits** (EPIC-3 lesson): never issue a `council_wait`
  longer than ~8 minutes — three EPIC-3 containers were anti-stall-killed
  while blocked in single 30–45-minute waits (see [[hub-job-supervision]];
  [[2026-09-04-epic3-run-ledger]]). EPIC-5 corroboration at the layer
  above: the orchestrator dispatching *runners* must also set its stall
  window above the runner's longest legitimate silent wait (55 min
  covers the 45-min owner ceiling) — see [[2026-09-04-epic5-run-ledger]].
  **EPIC-6 recurrence:** two containers died anyway because the fix
  lived in run memory, not in the dispatching procedure — the stall
  window belongs on *every* runner dispatch (see [[hub-job-supervision]]
  and [[2026-09-05-epic6-run-ledger]]).
- **Seat resolution check** — verifies each needed seat resolves by name; seats
  resolve from disk at dispatch time, so a gap is a missing seat file → `HALT`,
  never a registry restart.
- **Return contract** — report tags `ESCALATION`, `DONE`, `RETIRED`, `HALT`;
  the orchestrator sees only the report.
- **Main-repo immutability** (`<main_repo_immutability>`, FLLWUP-16) —
  `git checkout`/`switch`/`reset` against the main repository path are
  forbidden (violation = HALT); branch state changes happen only in a
  dedicated worktree under the repo's `.worktrees/`; the constraint is
  re-stated in every dispatch input the runner composes. See
  [[main-repo immutability]].
- **Pinned verification subjects** (`<judge_dispatch_subject>`/
  `<skeptic_dispatch_subject>`, FLLWUP-18/19) — every judge and step-9
  skeptic dispatch input names the PR head SHA + head worktree path as the
  verification subject and the loop frame (steps 9/10 precede step 11's
  mechanical merge, facilitator-executed). See
  [[verification-subject pinning]].

## Lessons from the EPIC-5 run

- **The mechanical path is real** — when a card's design is fully settled
  by Phase 1 rulings and landed module contracts, steps 2–6 are skipped
  and the card itself is the owner handoff (EV-25 did exactly this).
  Deliberation is not ritual; skipping it when nothing is open is the
  facilitator's call, recorded on the card face.
- **Green-light conditional shipping** — an `ESCALATION` ruling may make
  continuation conditional on a filed follow-up card (EV-23 shipped
  against the tracked FLLWUP-10 seam); the runner then asserts the
  follow-up's record exists before any merge. A *temporary, tracked*
  residual is shippable; a permanent one never is.
- **Committed-board-state recovery works** — two EPIC-5 containers died
  on infrastructure and both successors resumed from the committed
  card/board state (one owner resumed from its own plan doc and partial
  artifacts) with zero work lost. The board discipline is what makes a
  crashed container cheap.

## Lessons from the EPIC-6 run

- **Verify the staged set before every commit; check the tree after
  every foreign dispatch.** A judge dispatch left implementation files
  staged in the shared checkout; a scoped record commit swept them onto
  `main`, forcing a forward revert (`d4f7e2f`) so the feature landed
  only via the gated PR. Record commits must be scope-pure, and the
  shared checkout is contaminated by every dispatch that touches it.
- **Mechanical path is the default, full council the exception** — 4 of
  5 EPIC-6 cards gated mechanical and skipped steps 2–6; only the
  surface-touching EV-27 ran the 3-round exchange with the designer
  seated. Phase-1 rulings + landed module contracts settle most cards.
- **A stalled container forfeits its in-flight sub-dispatches** — the
  skeptic verification lost with job-7 had to be re-run by the successor
  container; nothing about a sub-job outlives its parent.
- **Zero escalations is achievable** — all five cards closed without a
  single `ESCALATION` because the Phase-1 rulings preflight had
  front-loaded every foreseeable dispute; the two flagged EV-27
  disputes closed by citing rulings with Skeptic settling probes.

## Lessons from the EPIC-6 close run (v0.18.0)

- **Seat-body lessons are necessary but not sufficient** — the poll-slice
  lesson lived in this body since EPIC-3, and two containers still died in
  long silent waits; the constraint held only once the orchestrator's
  dispatch input also re-stated it. Hence the re-statement requirement now
  written into `<main_repo_immutability>` and the subject-pinning blocks:
  the dispatch input is where a constraint is actually consumed.
- **Escalations return when mechanisms are discovered** — three ESCALATION
  round-trips this run (vs zero in the first), all for trade-offs no
  Phase-1 preflight could have named (a safety property to trade away, a
  card premise that proved false, wiki field semantics). Facts-only
  packets resolved each in one ruling round; the zero-escalation goal is
  for foreseeable disputes, not a virtue in itself.
- **The step-11 merge-gate re-run is load-bearing** — it caught a real
  defect (prune exiting 123 on root-owned artifacts) the Skeptic had
  dismissed as irrelevant. The mechanical re-run is not ceremony.
- **An empty judge output is not a verdict** — one dispatch settled with no
  text; re-dispatched once per the dispatch discipline.
- **Base PRs at `origin/main`, push records as they happen** — the later
  cards of the run reconciled by clean rebase or fast-forward; the
  [[union-merge reconcile]] repair became avoidable, not just survivable.

## Related

- [[seats]], [[council-loop]]
- [[engineering-board]], [[hub-job-supervision]], [[preflight]]
- [[council-config]] — default model/thinking override
- [[council models picker]] — the EPIC-5 epic this seat delivered
- [[union-merge reconcile]] — the diverged-main repair pattern this seat hit twice in EPIC-6
- [[main-repo immutability]], [[verification-subject pinning]] — the hardening chain this seat now carries
- [[env-split contract]] — why dispatch inputs must control the seat environment
- [[2026-09-06-epic6-close-run-ledger]] — the close run's lessons

## Sources

- `council/agents/council-runner.md`
- `council/procedures/features-deliver.md`
- [[2026-08-24-bugfix-seat-prose]]
- [[2026-09-04-epic5-run-ledger]] — mechanical path, green-light
  conditionals, recovery-from-committed-state
- [[2026-09-05-epic6-run-ledger]] — staged-set hygiene, mechanical-path
  default, zero-escalation run
- [[2026-09-06-epic6-close-run-ledger]] — immutability + subject pinning,
  the re-statement lesson, the return of escalations