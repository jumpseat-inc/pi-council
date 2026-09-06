# EPIC-6 Close Run Ledger (2026-09-05 → 2026-09-06)

Raw record of the second `/features-deliver EPIC-6` autonomous run: the run
that delivered **BUG-1** and follow-ups **FLLWUP-13..25** and closed the epic
itself. Continues the record of `2026-09-05-epic6-run-ledger.md` (EV-26/27 +
FLLWUP-9/10/11). Fourteen PRs, each merged on the
[[deterministic merge check]] with `--match-head-commit` and CI re-verified
green on the merged SHA. Version 0.17.1 → 0.18.0 at close. Three
ESCALATION round-trips (all resolved by `product-owner`; one `steward`
ruling at close) — the zero-escalation streak of the first run ended, and
the escalation packets were all narrow, facts-only, and mechanism-driven.

## Cards and merges (in execution order)

- **BUG-1** (PR #28, squash `c1406138`, head `5cedc1e`) — the board's first
  `BUG-` card, filed through the human-approved draft gate from a two-defect
  bug report: (1) backspace in the model search input deletes one trailing
  character and recomputes through `filterModelRows` (empty-query and
  unfocused `\x7f` stay no-ops; other control bytes unchanged — the
  FLLWUP-12 contract, folded in when FLLWUP-12 was dropped as redundant);
  (2) a first-render hint line below the model rows — byte-exact
  `press / to filter models` — rendered only while search has never been
  opened in the current modal-open, no `▌`, not a footer, dismissed at the
  first `/` press (Phase-1 rulings R-1/R-2/R-3). First container died in a
  session disruption that zeroed `.git/config` and the owner's worktree;
  remote restored from the human-provided URL, corrupt state cleared, fresh
  runner resumed from committed board state.
- **FLLWUP-13** (PR #29, squash `b66bc8f`, head `acee4a6`) — the no-match
  region renders a dim second line, byte-exact `↓ then esc exits search`
  (Phase-1 ruling), under the immutable `No models matching "<query>".`
  literal. Mid-run a seat ran `git checkout <sha>` inside the main repo,
  moving main off the runner's record commits (recovered from reflog; no
  verdict invalidated) — the incident that seeded the FLLWUP-16..20
  hardening chain.
- **FLLWUP-16** (PR #30, squash `68e728d`) — the packaged `council-runner`
  seat gains `<main_repo_immutability>`: `git checkout`/`switch`/`reset`
  against the main repository path forbidden (violation = HALT); branch
  state changes only in a dedicated worktree; the constraint is repeated in
  every dispatch input the runner composes. Driven payload test on the seat
  body. Judge premise-error lesson: the first judge dispatch evaluated the
  local main checkout (deliverable absent pre-merge by construction) —
  re-dispatched on a corrected factual record, no coaching.
- **FLLWUP-17** (PR #31, squash `f35d082`) — the same immutability block on
  the `owner`, `skeptic`, and `judge` seat bodies (the layer that survives
  a lost runner forward), payload-tested per seat with defeat injection.
- **FLLWUP-18** (PR #32, squash `21a95a8`) — `<judge_dispatch_subject>` on
  the runner: every judge dispatch input names the exact verification
  subject (PR head SHA + head worktree path) and the loop frame (step 10
  judging precedes step 11's mechanical merge, facilitator-executed, no
  seat performs). The card's own judge dispatch was the first live
  demonstration: first-pass PASS.
- **FLLWUP-19** (PR #33, squash `e3d3c88`) — the same pinning for step-9
  skeptic dispatch inputs (`<skeptic_dispatch_subject>`); also demonstrated
  live on its own run.
- **FLLWUP-20** (PR #34, squash `48f60cc`) — the judge seat's
  `<when_invoked>` wording now names the runner-pinned verification subject
  and loop frame as received-input elements (description-only; the
  constraint lives in the runner).
- **FLLWUP-15** (PR #35, squash `0be0a26`) — search-mode model window
  shrinks to `maxRows - 1` so the framed modal fits the terminal at full
  window height; RED-first driven tests proven non-vacuous by defeat
  injection; the zero-match branch (5 fixed lines, both ruled hint lines)
  verified to fit already. `withModalFrame`'s designed tail-clip (ruled
  footer dropped at tight heights) recorded as a pre-existing, out-of-scope
  invariant.
- **FLLWUP-14** (PR #36, squash `ba84719`) — the **kitty search-smoke**
  harness (`smoke/search-smoke/`): a pty-driven CSI-u live-path falsifier
  for the model search input, 9 frames compared against the final ruled
  copy set, running in the gate set. Phase-1-escalated and PO-ruled: **R-1**
  the harness exports `OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"`
  (presence-only auth, zero network; the modal never dispatches; the
  headless preflight is the misroute tripwire; README states the contract
  change) and **R-2** a `node -e` decode-parity preflight against the pinned
  0.84.3 dist (reds "0.84.3 decode parity failed" before any TUI session).
  The step-11 merge-gate re-run caught a real defect the Skeptic had
  dismissed — the host prune exited 123 on root-owned container artifacts —
  fixed in verify cycle 2 (tolerant prune, verdict decoupled). Both rulings
  proven can-fail.
- **FLLWUP-21** (PR #37, squash `48f8ada`) — the card was filed as "restore
  extension load on stock pi 0.85.0" after the smoke surfaced a
  zero-command state on 0.85.0. The deliberation **proved the premise
  false**: `pi-manifest.js`/`package-manager.js` byte-identical across
  0.84.3/0.85.0, clean-env 0.85.0 registers all 14 commands — the symptom
  was **probe contamination** (the discovery probe ran inside a seat
  session whose env carried `COUNCIL_SEAT`, flipping the package's
  env-keyed parent/child mode split at `extensions/index.ts:117-121` to
  child mode = zero commands). Product-owner ruled the goal amended to the
  honest contract: the **env-split contract** verified two-pole (clean
  scratch HOME → all parent-mode commands register; `COUNCIL_SEAT` set →
  zero) via `test/env-split-contract.test.ts` + a real-binary driver;
  root-cause run record; devDependency pinned `">=0.84.3 <0.86.0"` framed
  as verified-interval housekeeping (R-2: the pin is not the fix). The
  hazard itself — an unregistered slash command falls through to a **real
  model dispatch** from inside a seat session — documented, deliberately
  not fixed in this card.
- **FLLWUP-22** (PR #38, squash `f5975c8`) — theme token drift vs pi
  0.85.x characterized with byte-level deltas (`scrollbarThumb`
  `bg??selectedBg` → `fg??text`; `scrollbarTrack` gains `fg??muted`;
  `bgColorKeys` 8→7; resolved tokens 55→56; 0.85.0 ≡ 0.85.1). Recorded
  decision: **0.85.x-compatible as shipped**; devDependency byte-exact
  unchanged, `bun.lock` re-locked to in-range top 0.85.1, gates green at
  both range extremes (0.84.3 and 0.85.1).
- **FLLWUP-23** (PR #39, squash `2dd698f`) — installing the package without
  `node_modules` now produces a **named diagnostic** (`extensions/mcp-load.ts`
  guarded-lazy `getMcp()`: names `@modelcontextprotocol/sdk`/`/client`, the
  remedy `bun install`/`npm install` at the package root, and an explicit
  counter to pi's wrong `-ne` hint) instead of a silent zero-command state;
  healthy-install behavior byte-identical (proven via the env-split suite).
  Jiti interop quirk recorded: a bare top-level throw surfaces as
  `Export named … not found`, so the fixture keeps dummy exports.
- **FLLWUP-24** (PR #40, squash `2c5ec3b`) — the **lock-drift tripwire**:
  `council/check-pi-drift.sh` compares the installed
  `@earendil-works/pi-coding-agent` version against `bun.lock`'s
  resolution, invoked by `council/preflight.sh` **before** the
  frozen-lockfile self-heal (the named FAIL must precede the quiet fix).
  Motivated by lock-drifted local gates observed in three consecutive runs
  (installed 0.84.2 vs locked 0.85.1 — caught live again during this very
  card). Skeptic `closed-red` settled with a probe-verified fix: default
  `bun pm ls` returns two identical leaves on a green tree (fail-open);
  `bun pm ls --all` yields exactly one. AGENTS.md gained hard-convention
  clause #13 (local gate evidence trusted only after preflight passes).
- **FLLWUP-25** (PR #41, squash `cb36a15`) — doc-sync: the wiki source page
  `[[2026-08-23-agents]]` refreshed to AGENTS.md's 13 conventions via the
  wiki-ingest procedure (never hand edits), plus a drift-proof consistency
  check (`test/fllwup25-agents-page.test.ts`, pure
  `diffConventions(agentsText, pageText)`, word→number-normalized count
  token across three ruled sites). Two PO rulings settled wiki conventions:
  the page heading mirrors the source verbatim (`## Hard conventions`), and
  the frontmatter `sources:` array carries wiki-internal `[[wikilink]]`
  cross-refs only — the external repo-doc citation lives in the four
  REQUIRED provenance keys (`provenance`/`source_path`/`source_commit`/
  `captured`).

Suite progression: 537 → 541 → 544 → 545 → 548 → 549 → 550 → 551 → 555 →
559 → 560 → 564 → 571 → 577 pass (2 env-gated skips), 0 fail.

## Incidents and recoveries (none verdict-invalidating)

1. **Session disruption at BUG-1** — the hosting session died mid-owner
   dispatch: `.git/config` zeroed (remotes gone), the owner's worktree
   admin files zeroed, work unrecoverable. Remote re-added from the
   human-provided URL; corrupt refs cleared; fresh runner resumed from
   committed board state. The card's only loss was the in-flight
   implementation.
2. **Seat tampering at FLLWUP-13** — a seat's `git checkout <sha>` in the
   main repo moved main's HEAD off the runner's record commits and reverted
   board/card faces; recovered from reflog (`85dd8c4`). Direct ancestor of
   the FLLWUP-16..20 chain.
3. **Two runner stalls** (FLLWUP-14's first two containers) — long silent
   `council_wait`s exceeded the hub's anti-stall window. The poll-slice
   lesson already lived in the runner's seat body (EPIC-3 lesson); it held
   only once it was also re-stated in the orchestrator's dispatch input
   ("every `council_wait` ≤ 8 minutes, looping"). Lesson sharpened: seat-body
   guidance is necessary but not sufficient — operative constraints must be
   re-stated in every dispatch input.
4. **Judge empty-output dispatch** (FLLWUP-23, job-19.12) — settled with no
   text output; re-dispatched once per the dispatch discipline. An empty
   judge output is not a verdict.
5. **The merge-gate re-run caught what the Skeptic dismissed** (FLLWUP-14,
   prune exit 123 on root-owned artifacts) — step 11's mechanical re-run is
   load-bearing, not ceremony.

## The rulings (all appended verbatim to card faces, binding)

- **Phase 1 preflight (run start)**: BUG-1 hint placement/copy/dismissal
  (`press / to filter models`; first-render line below the model rows; per
  modal-open dismissal); FLLWUP-13 no-match hint copy (`↓ then esc exits
  search`). Front-loaded the copy class — no card re-asked it.
- **product-owner, FLLWUP-14 step 6**: R-1 dummy-key contract ACCEPTED with
  documented mitigation; R-2 decode-preflight guard INCLUDED.
- **product-owner, FLLWUP-21 step 6**: R-1 goal/acceptance amended to the
  env-split contract (the card's "restore load on 0.85.0" premise was
  false); R-2 the pin is verified-interval housekeeping, not the fix.
- **product-owner, FLLWUP-25 step 6**: R-1 page heading mirrors the source
  verbatim; R-2 `sources:` = wiki-internal cross-refs, external citation in
  the provenance keys.
- **steward, run close**: EPIC-6 → Done (first epic-card closure); run
  terminates; residual accepted permanently (the missing
  `[[2026-09-05-epic6-run-ledger]]`-referenced wiki page — actually the
  never-created `[[2026-09-05-epic6-run-ledger]]` ledger *wiki page* gap is
  moot since the source page exists; the accepted residual is the stale
  cross-reference class); version 0.18.0 in one chore commit.

## Standing learnings (the durable takeaways)

- **Phase-1 front-loading scales to copy, not to discovered-mechanism
  consequences.** All three escalations were trade-offs no pre-flight could
  have named (a safety property to trade away; a card premise that proved
  false; wiki field semantics) — each resolved from a facts-only packet in
  one ruling round.
- **The mode split is env-keyed and version-independent** — see the
  [[env-split contract]]. Any probe of the package's extension behavior
  must control `COUNCIL_SEAT`, and any "version regression" claim about
  extension loading must first exclude it.
- **Single-writer board discipline is now enforced at three layers**: the
  runner body (FLLWUP-16), the working seats' bodies (FLLWUP-17), and the
  dispatch inputs (re-statement requirement). And an unregistered command
  from inside a seat costs a real model dispatch — the fallthrough hazard
  is documented, still unfixed by design in this run.
- **Verification inputs name their subject**: judge and skeptic dispatch
  inputs carry PR head SHA + head worktree path + loop frame
  ([[verification-subject pinning]]). The FLLWUP-16 premise-error class
  (judging the wrong tree) has not recurred since.
- **Local gate evidence is only as good as the tree it ran on** — the
  [[lock-drift tripwire]] fires before preflight's self-heal, so a drifted
  `node_modules` names itself instead of silently blessing wrong-version
  runs.
- **The union-merge avoidance recipe proved out**: base PRs at
  `origin/main`, push record commits as they happen — the later cards in
  this run reconciled by clean rebase or fast-forward with zero union
  merges (early cards still hit union merges before the recipe landed).
- **Re-state operative constraints in every dispatch input** — the
  generalization of both the stall-window recurrences and the
  subject-pinning chain ([[verification-subject pinning]]).

## Board deltas

- BUG-1 filed (first `BUG-` card, human-approved draft gate), FLLWUP-12
  dropped as redundant (folded into BUG-1), FLLWUP-16..25 filed mid-run
  under the human's standing no-consent follow-up directive (epic: EPIC-6,
  completed in-run), EPIC-6 → Done at close (first epic-card closure),
  v0.17.1 → 0.18.0.
