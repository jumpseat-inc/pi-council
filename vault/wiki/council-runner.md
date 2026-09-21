---
title: Council Runner
type: entity
summary: The per-card autonomous execution container — dispatched by /features-deliver to run the full /council loop for one card in an isolated context; routes, counts, and writes the board but never decides.
aliases: [council runner, council-runner, runner]
tags: [pi-council/seat]
sources: ["[[2026-08-24-bugfix-seat-prose]]", "[[2026-09-05-epic6-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-17-epic9-residual-run-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-22
---

> ⚠️ Derived from `council/agents/council-runner.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/z-ai/glm-5.3-flash:medium`.
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

## Lessons from the EPIC-10 run

- **Confirmation is not inferable** — under `gate.mode: active` a runner with a
  resolved follow-up disposition still escalates it for **ratification**; it never
  applies a recorded decision as if it were the human confirmation
  ([[confirmation-authority]]). This drove eight [[product-owner]] round-trips
  across seven cards; no [[steward]] escalation.
- **Tool surface, not capability.** The runner container is not granted
  `council_route` nor the parent `followup` tools, so it applies the mode passed in
  its dispatch input and holds step-13 candidates for the orchestrator
  ([[followup-decision-gate]]); a sub-seat dispatch of `council-runner` was refused
  by the harness.
- **Merge execution moved into the container** — see [[deterministic-merge-check]].
- Provider-error retries recovered on EV-78/83/84 (upstream idle timeouts) and a
  stalled principal on EV-82; [[union-merge reconcile]] recurred on 3 of 7 cards.
  Witness: [[2026-09-22-epic10-run-ledger]].

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

## Lessons from the EPIC-7 run

- **A card's goal can be the defect** — EV-29's goal named a provider data
  granularity that does not exist (there is no per-component dollar source;
  see [[cost-provenance]]). The runner escalated it rather than re-scoping,
  and [[steward]] amended the wording. Goal-wording authority is steward's.
- **Every child can escalate** — five cards, seven ruling dispatches (five
  [[product-owner]], two [[steward]]), each resolved in one facts-only round.
  Phase-1 literals settle *copy*, not *placement, trigger, multiplicity, or
  durable carrier* — the discovered-mechanism class.
- **The stall invariant recurred a third time** — EV-31's first container
  had a 30-min stall window under a 45-min owner ceiling and was
  anti-stall-killed; the durable fix belongs in the dispatch tool's default,
  not in orchestrator discipline. Recovered from committed board state.
- **A vanished package root degrades children to vanilla agents** — every
  child `pi` re-resolves packages at startup, so a deleted package root yields
  a hub-tool-less agent (the runner correctly `HALT`ed). Phase 0 should assert
  the dispatch *tools* exist, not just that seat names resolve.
- **One union merge recurred** (EV-30) despite the EPIC-6 avoidance recipe —
  "push records as they happen" reduces but does not eliminate it.

## Lessons from the EPIC-8 run

- **Discovered mechanisms, not literals, drove the escalations** — Phase-1
  copy rulings settled the R-COPY vocabulary, but the fold-in/new-card split,
  the header-pin scope, the clamp site, and the cross-card reach of an earlier
  ruling all surfaced per card. Five in-card escalations (three
  [[product-owner]], two [[steward]]) plus one closure, each in one facts-only
  round; different in kind from EPIC-7's every-card-escalates (the premise was
  sound here, the *wording/scope* was not).
- **An earlier ruling's anti-goal can bind a later card.** EV-35's Q5 ("no
  render-time recompute / no cursor-stability work") was ruled to reach EV-36,
  foreclosing R2's `focused` writeback — see [[one-row-floor]]. A runner must
  check cross-card ruling reach, not assume a card-local ruling is local.
- **A card can carry a post-epic endpoint.** EV-33's goal named an accessor
  the tree *and* the transcript header consume, while its Acceptance forbade
  render changes; the ruling was "export now, consume next card" — goal stood,
  Acceptance amended ([[engineering-board]]).
- **The first merge was announced in-line and watched; the gate held across
  four merges** ([[deterministic-merge-check]]). One union merge (EV-34
  `89047ca`); no `HALT`, no stall-kill; the branch-freshness artifact
  (FLLWUP-27) recurred on every card.
- **Seat resolution and dispatch tools were healthy throughout** — all
  required seats resolved; no Phase-0-shaped `HALT`.

## Lessons from the EPIC-9 run

- **All five criteria can pass on a dead deliverable.** EV-37's literal branch
  never matched pi's emitted message, yet owner gates, `gates` SUCCESS, a
  no-block Skeptic verdict, and judge `PASS` all cleared. The orchestrator
  caught it by checking the constant against pi's *installed bundle*; the
  runner has no such cross-check in its loop. See
  [[deterministic-merge-check]], [[retry-classification]].
- **A Phase-1 ruling can itself be the dispute.** [[designer]] argued R5's
  countdown belonged on the status row; [[product-owner]] ruled the input-bar
  surface **binding** (dissent named) because changing the recorded per-branch
  observable would reverse a human decision. The escalation was *whether a
  recorded surface binds*, not what the copy says.
- **A `Ready` sibling's premise can go false mid-run.** EV-39's settled
  cardinality made EV-42's `Intent` false; [[steward]] ruled EV-39 records the
  mechanism in its own card and does **not** touch EV-42, with the orchestrator
  executing the card edit between cards (same id, same slot). A runner must not
  edit, absorb, or silently re-scope a sibling card.
- **Four of seven cards escalated at step 6** (three [[product-owner]], one
  [[steward]] chain), every one a discovered mechanism — the EPIC-7/EPIC-8
  pattern continuing. The runner's own failure class recurred mid-run: the
  EV-40 container died on a provider error (a content-filter one, not the
  intake's), and several owner dispatches returned no artifact — each survived
  only by the one-re-dispatch discipline.
- **The dispatch-input re-statement held.** Every runner dispatch carried the
  immutability, subject-pinning, and push-records-as-you-go constraints; two
  divergences still occurred but were repaired from committed state, and no
  container was anti-stall-killed.

## Lessons from the EPIC-9 residual run

- **Ruling seats return text; the runner holds the pen.** [[product-owner]]
  appended directly to `FLLWUP-45`'s card (its Write is scoped to `vault/raw/`)
  and introduced two corruptions — a regression of one ruling phrase and a
  duplicated list number — which the runner then fixed. The single-writer
  discipline is the runner's; a ruling seat appends through it, not around it.
- **Two goal amendments, steward pen, orchestrator execution.** `FLLWUP-43`
  (a referentially opaque conjunct B) and `FLLWUP-49` (an undecidable
  seat-dispatch clause) were both amended in place while `Deliberating`, by a
  [[steward]] ruling with the orchestrator writing the single line
  ([[engineering-board]]). In both, the shipped design was unchanged — what
  changed was the judge's only input.
- **A provider-error owner dispatch recovers by the one re-dispatch rule**
  (`FLLWUP-45`); a judge's pre-existing full-suite flake
  (`EV-40 computeBackoffDelay` jitter) was verified as a flake by a fresh run,
  not re-dispatched as a defect.
- **`FLLWUP-49` collapsed the faux-provider harness** into `test/faux-provider/`
  and deleted `ev43/`, holding the run's zero-new-live-arms constraint — the
  shared kit the EPIC-9 retry falsifiers now import.
- **The step-12 record push is a privileged write** the runner executes under
  board discipline; where a ruleset blocks direct updates it needs a recorded
  authorization — see [[record-push-discipline]].

## Lessons from the EPIC-13 run

- **Board-edit heading corruption is real and unchecked.** Three times a runner
  edit duplicated or dropped a `## In Progress` / `## In Review` heading while
  `validate.py` stayed green (it checks card-line/column agreement, not heading
  uniqueness). The orchestrator repaired each and added an explicit board-heading
  guard to the dispatch inputs. See [[engineering-board]].
- **Keep records on the branch when told.** EV-60's runner committed board/card
  records on the *main* checkout after the PR was pushed, so the final `In Review`
  state never rode the merge; EV-71 landed as `In Progress` for the same reason.
  The orchestrator set the final `Done` state each time. [[main-repo immutability]]
  governs branch state, but the *record location* is a second discipline.
- **Provider-error and idle-timeout dispatches are survivable.** An owner died
  mid-implementation and a [[product-owner]] hit an HTTP 429 (settled 3/3); the
  verified deliverable was kept, not redone, by the one-bounded-re-dispatch rule.
  See [[retry-policy]], [[per-attempt-provenance]].
- **The step-13 follow-up gate recurred** — the runner pre-wrote follow-up cards
  before the human confirmation ([[engineering-board]]).
- **The parent stall window must clear the child window** — recurrence #4; see
  [[hub-job-supervision]].
- **Committed-board-state recovery again carried a killed container** (EV-61),
  with the in-flight child re-run by a fresh runner.

## Lessons from the EPIC-14 run

- **The board-heading guard held.** With the explicit heading-uniqueness guard in
  every dispatch input, EPIC-14's five runners produced clean boards every time
  (a contrast with EPIC-13's three corruptions). The guard is now the standing
  practice; `validate.py` still does not enforce it.
- **Record location: a new variant.** The EV-73 and EV-75 runners left their
  board/card record edits **uncommitted in the main checkout** (byte-identical to
  the branch) instead of only on the branch; the orchestrator cleared them before
  each fast-forward. EV-76 and EV-77 were clean. Keep records on the branch —
  and treat a dirty main checkout as a merge-blocking precondition.
- **Escalations return when the ruling seat is genuinely needed.** Two
  round-trips (EV-73's migration-copy/class-4 items; EV-77's J1/J2), both
  open-judgment calls no Phase-1 ruling covered, both resolved in one ruling
  round. The facts-only packet contract worked.
- **Follow-up state defaults to `Backlog`.** The EV-77 runner filed its two
  follow-ups `Ready` (licit under `board-create-card.md` step 4); the
  orchestrator normalized them to `Backlog`, consistent with every other
  follow-up card — a confirmer's call, not a runner error.
- **A docs card is a second writer of `vault/`.** EV-77's deliverable was wiki
  documentation, so it edited `vault/wiki/` directly, while `council.md` step 14
  says the facilitator must never hand-edit `vault/`. The exception is real but
  unlegislated — see [[llm-wiki]].

## Related

- [[seats]], [[council-loop]]
- [[engineering-board]], [[hub-job-supervision]], [[preflight]]
- [[council-config]] — default model/thinking override
- [[record-push-discipline]] — the step-12 privileged write this seat executes
- [[run-config-stability]] — mid-run `.council.json` drift
- [[council models picker]] — the EPIC-5 epic this seat delivered
- [[union-merge reconcile]] — the diverged-main repair pattern this seat hit twice in EPIC-6
- [[main-repo immutability]], [[verification-subject pinning]] — the hardening chain this seat now carries
- [[env-split contract]] — why dispatch inputs must control the seat environment
- [[2026-09-06-epic6-close-run-ledger]] — the close run's lessons
- [[2026-09-11-epic7-run-ledger]] — the EPIC-7 usage-accounting run's lessons
- [[2026-09-21-epic13-run-ledger]] — the EPIC-13 routing run's lessons
- [[2026-09-21-epic14-run-ledger]] — the EPIC-14 gate-enablement run's lessons

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