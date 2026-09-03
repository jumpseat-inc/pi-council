# EPIC-3 run ledger — council-decomposed features-new with a bounded session (2026-09-03/04)

Immutable raw record of the autonomous `/features-deliver EPIC-3` run that
shipped in v0.15.0. Compiled by the orchestrator from the committed card
records (`council/cards/EPIC-3.md`, `EV-10.md`, `EV-11.md`, `EV-12.md`), the
three design specs under `docs/superpowers/specs/2026-09-03-EV-1{0,1,2}-design.md`,
and the run's merge/escalation history. Prose below is summary; the verbatim
records live in the card files and specs, which this ledger points at.

## What shipped

Three PRs, each merged on the deterministic five-criterion gate
(owner gates green in full; `gates` workflow SUCCESS on the PR head SHA; no
blocking Skeptic objection; judge PASS; no Needs Human / outstanding ruling),
pinned with `--match-head-commit`, CI re-verified green on each merged SHA:

- **EV-10** (PR #10, merged `c801c74`) — `council/procedures/features-new.md`
  steps 1–2 rewritten: decomposition is deliberated by seats in **three
  waves** — principal wave 1 (authors the child decomposition in its native
  Reframe format + the epic goal as a one-line transcription of the human's
  intake), skeptic + designer wave 2 (parallel attack, identical input,
  native formats, completeness charter), product-owner wave 3 (ruling-only,
  unconditional, last). Facilitator "authors nothing at any step". Gate
  presentation is two-part: **Part 1** card drafts exactly as they would be
  written (attribution-free), **Part 2** a presented-never-written ledger
  (`Contributors:` / `Disagreements:` / `Decision: unresolved — your call`).
  Step 3's draft-then-confirm text byte-identical (pinned in
  `test/prose.test.ts`, non-vacuity proven by one-byte mutation).
- **EV-11** (PR #13, merged `64fcf95`) — the **bounded session**: 3 waves =
  3 rounds (same numeric cap as council.md step 3); no seat re-dispatched to
  respond to another seat's position (stall re-dispatch is a retry, not a
  round); convergence recorded only at the fixed endpoint after wave 3
  (zero open in-scope judgments; a named ruled dissent is not
  non-convergence; an escalated-unruled item is non-converged);
  non-convergence fallback = **mechanical verbatim aggregate** of all
  recorded contributions with open disagreements labeled unresolved at the
  existing step-3 gate (no new gate; double-fail dispatch stop is an
  incomplete run, not the fallback); session status line ("Session status:
  Non-converged after 3 rounds … Ledger only — presented, never written.")
  sits in the Part-2 ledger-description paragraph adjacent to the existing
  "presented, never written" guard. council.md's "stop early if positions
  have stabilised" is deliberately NOT imported.
- **EV-12** (PR #17, merged `be0c0d7`) — README-only documentation: expanded
  `/features-new` Commands row ("deliberated by product-owner, designer,
  principal, and skeptic in a bounded three-wave session; nothing reaches
  the board until you approve the draft set"), a new paragraph under the
  seat table teaching the two load-bearing properties (with the O1
  qualifier "After the full three-wave session, you always get a draft to
  approve"), and the J1 framing correction replacing the factually false
  "as the council deliberates it'll prompt you for more details"
  (skeptic-proven: `grep -c prompt features-new.md` = 0). No AGENTS.md
  change. No Why? rewrite.

## Rulings (all recorded verbatim on card faces, binding including steward)

Phase 1 (human, pre-run): **SEATS-1** (participants: product-owner,
designer, principal, skeptic; PO escalates to the human via the
orchestrator); **SMOKE-1** (smoke runs against a scratch copy of `council/`,
never the real board; job ids are the evidence); **CAP-1** (3-round cap);
**FALLBACK-1** (facilitator drafts on non-convergence, disagreements labeled
unresolved, no new gate).

Step 6 (product-owner, mid-run): **EV-10 wave-1 authorship** — principal
alone authors the first artifact (rejected: PO-in-wave-1 self-review loop the
human cannot see; facilitator first pass forbidden by "decides nothing");
**EV-11 status-line placement** — Part-2 ledger paragraph, adjacency ≤200
chars from "presented, never written" (rejected: post-Wave-3 seam block,
~1200 chars away, would require an unauthorized guard-phrase duplication);
**EV-12 J1 scope** — in scope (rejected: follow-up grouping with the wiki
terse row and council-loop stop-early framing, which are not alike).

## How the run ran (process record)

- First full `/features-deliver` on the council's own payload: an epic that
  rewrote the command that produced it, with the human draft-then-confirm
  gate fenced as byte-identical/untouchable throughout.
- Five council-runner containers on EV-10, three on EV-11, two on EV-12;
  every mid-run death recovered by a fresh container resuming from committed
  card/board state (no uncommitted state lost; no report forged).
- **SMOKE-1 smoke technique**: scratch copy of `council/` + `vault/` in a
  temp dir, rewrite placed at the repo-local override path
  `<scratch>/.pi/council/procedures/features-new.md`, no project-local pin
  of pi-council (the user-scope install supplies the package; scratch
  `council/` shadows it by filename), deps copied in, headless
  `pi -p "/features-new <toy>"` with seat env unset (parent mode so
  product-owner is dispatchable). All four seats dispatched, job ids on
  record, ~22 min runtime (a first attempt died to a 20-min cap
  mid-aggregation — the cap was the bug, not the run).
- The run's one real design bug: the skeptic caught the smoke draft's
  Part-1 card text carrying seat/wave attribution destined for disk
  (closed-red O1). Fix: explicit attribution-free Part-1 mandate in the
  procedure + non-vacuous prose pin.
- A judge dispatch REJECTed on two confabulated premises (a nonexistent
  deleted paragraph; a misread AGENTS.md acceptance clause). The runner
  verified both against `git show` and re-dispatched the judge once with the
  corrected factual record (no verdict coaching); the re-dispatched judge
  verified independently and returned PASS.

## The lesson (operational)

1. **Id collisions come from stale clones.** A parallel agent (model-eval
   harness) worked from a base predating EPIC-3 and allocated EPIC-3 +
   EV-10..15 to itself; it renumbered to EPIC-4 + EV-16..21 on a remote tip
   that did not contain our epic at all. Local and remote main diverged
   (16 vs 3 commits past a merge base older than either epic). Reconciled by
   merge `13af33e` (union of both card sets, board columns per frontmatter,
   validate.py clean), never history rewrite. Rule: **allocate ids at
   fetched HEAD, never from a stale clone's memory; reconcile diverged
   mains by union merge**; validate.py's duplicate-detection is the net
   that catches a botched union (it caught both of the orchestrator's own
   board-resolution mistakes during reconciliation).
2. **Long blocking `council_wait` calls look like stalls.** Three containers
   were anti-stall-killed while waiting on 30–45-minute seat dispatches: the
   hub sees no tool activity for its 10-minute window and cancels. Fix
   adopted mid-run: poll in ≤8-minute slices, re-waiting the same job while
   visibly progressing (the hub never kills on timeout; cancel is the
   caller's move, and cancelling mid-gate forfeits completed gate work).
3. **Provider flakiness is bounded-retry territory** — upstream stream
   errors (`stopReason=error`, no output) hit seats and whole containers;
   one re-dispatch per failure, then HALT/escalate.
4. **Verify worktree == committed before trusting debris.** A skeptic
   settling test died leaving scratch files (`features-new.md.attribtest`,
   `.restore1`) next to the shipped procedure; recovery diffed the working
   tree against the committed file before deleting anything.
5. **Multi-session coexistence**: the model-eval epic (EPIC-4) landed
   concurrently (EV-16/17/19/18) alongside this run; every push needed a
   fresh fetch/rebase, board conflicts resolved by union, never dropping the
   other session's lines.

## Release

v0.15.0 (`b6f6f37`), tagged 2026-09-04, `latest` moved to the same commit.
