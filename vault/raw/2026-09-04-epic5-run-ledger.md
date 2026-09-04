# EPIC-5 Run Ledger (2026-09-04)

Raw record of the `/features-deliver EPIC-5` autonomous run that shipped the
[[council models picker]] — the `/council-models` command, the token-only
modal, the catalogue resolver, and the first `.council.json` write path.
Four PRs, each merged on the [[deterministic merge check]] with
`--match-head-commit` and CI re-verified green on the merged SHA:

- EV-22 (PR #19, merge `07317e1`, head read `fc2134e`) —
  `extensions/catalogue.ts`, the pure resolver
  `resolveCatalogue(models, providerDisplayName, rawSeats, overrideMap)`.
- EV-24 (PR #20, squash `5fa22a1`, head `af5c7be`) —
  `extensions/council-config-writer.ts`, the first `.council.json` writer;
  `THINKING_LEVELS` exported from `seats.ts`.
- EV-23 (PR #21, squash `362fe96`, head `4d67953`) —
  `extensions/model-picker.ts`, the token-only modal with echo-then-run
  confirm and the `SeatModelSelection` selection-encoding contract.
- EV-25 (PR #22, squash `467b744`, head `4e3f981`) — `/council-models`
  registered in `index.ts`; headless grammar + notify copy; smoke Phase 5
  added to `smoke/driver.sh`.

Suite progression across the run: 460 → 473 → 491 → 507 pass, 0 fail.

## Phase 1 rulings preflight (recorded human decisions, binding for the run)

Recorded on card faces before any runner dispatched; runners applied and
cited them rather than re-asking:

- **EPIC-5 R-1 (build order)** — writer-first: EV-22 → EV-24 → EV-23 →
  EV-25. The riskiest, first-ever write path lands and is proven before
  the modal builds on it.
- **EV-23 R-1..R-4 (modal copy)** — header
  `council models — pick a model per seat` (bold); per-level footers
  (`↑/↓ move · enter open · esc back` / `… enter select · esc back` /
  `enter confirm · esc back`); seat-row markers
  `— using <provider>/<id>[:thinking] (override)` vs
  `— frontmatter default`; empty states
  `No providers configured — authenticate a provider in pi, then reopen
  /council-models.` and `No models available for <provider>.`; the
  seat-without-override state renders as the marker, not a panel.
- **EV-25 R-1..R-3 (command copy)** — headless grammar
  (`/council-models` → usage + per-seat listing; `<seat>` → that seat +
  usage; `<seat> <provider>/<model>[:thinking]` → validate + write +
  notify); usage block parallel to `[council-eval]`; notify copy
  `council-models: wrote <seat> → <provider>/<model>[:thinking] in
  .council.json — takes effect at the next dispatch.`

Skeptic verified the copy byte-exact at EV-25 (gate-integrity injection:
a one-word R-3 change turned 3 tests red).

## Rulings during the run (product-owner, orchestrator-secured)

- **EV-22 J-1 (ordering)** — id-asc for providers and models (Side A);
  native-surface consistency with pi's own `/models` picker beats
  display-label ordering; labels are rename-volatile. Reversibility high.
- **EV-22 J-2 (resolver signature)** — four flat-data args, no I/O of any
  kind; the acceptance test is a literal stub-the-registry unit test, not
  a temp-dir integration test; the EV-22↔EV-24 snapshot seam lives at the
  EV-25 call site, not inside the resolver.
- **EV-23 J-1 (proceed vs block)** — EV-23 ships against a *filed*
  follow-up fixing the writer seam (**FLLWUP-10**), never as a permanent
  residual; the card face must record the follow-up's ID before step 9
  and step 9 must assert it before any merge. Grounded in a Skeptic
  closed-red reproduction: `existingThinking`
  (`council-config-writer.ts:200-217`) misses a `:suffix` on an
  object-form `model`, silently dropping a thinking level on a level-less
  re-pick.
- **EV-23 J-2 (model-level rows)** — `N` rows for an `N`-level model, no
  bare level-less row (the silent-drop trap the forcing function exists
  to prevent); `[]` models keep the single level-less row (the only
  `— thinking unchanged` case); `["off"]` renders `:off`.
- **EV-25 promotion** — chain-promotion ratified once EV-22/23/24 were
  Done with merged SHAs on main; applied by the orchestrator without
  re-asking (EPIC-4 cadence precedent).

## Deliberation outcomes that shaped the code

- **Gate parity (EV-24, 3 rounds, designer conceded on Skeptic evidence)** —
  the writer validates model-presence (dispatch's gate) and thinking
  grammar (loader's gate) and deliberately has **no capability gate**:
  nothing downstream rejects capability (pi's `clampThinkingLevel`
  clamps at spawn; the only `supportedThinkingLevels` consumer is the
  picker). Principle: the writer may be stricter than the runtime only
  where dispatch is also stricter. See [[gate parity]].
- **Splice, not re-serialize (EV-24)** — the scaffold seed and the real
  `.council.json` are **tab-indented** (verified `cat -A`), so a
  `JSON.stringify(_, null, 2)` writer would reformat a consumer's
  committed file on the first model-only edit. The writer is a
  byte-region patcher with three regimes (replace / insert / greenfield),
  field-level merge (absent `thinking` = preserve), atomic tmp+rename
  with mode preservation, malformed-JSON → error-not-throw, mixed-indent
  → deterministic pick (majority unit → seat block's unit → tabs), never
  a throw.
- **Thinking-level semantics (EV-22, Skeptic-settled)** — import
  `getSupportedThinkingLevels` from `@earendil-works/pi-ai/compat`
  (top-level static imports remap cleanly via the loader's
  `VIRTUAL_MODULES`; the v0.12.1 trap was `import.meta.resolve`, a
  filesystem walk). Tristate contract: `null` excludes; `xhigh`/`max`
  require an explicit key; absent key on `off..high` = supported;
  `reasoning:false` → `["off"]`; all-nulled → `[]` (legal, distinct from
  an empty provider group).
- **Resolver contract (EV-22)** — `qualifiedId` (`${provider}/${id}`) is
  the selection/write key, byte-identical to dispatch's known-set;
  `hasOverride` = key-presence in `loadCouncilConfig` (an `{}` entry
  counts; effective-diff is structurally unobservable because
  `applySeatOverride` returns the identical object when values coincide);
  one snapshot — `refresh()` + `getAvailable()` once in the EV-25
  handler, the same flat array to resolver and writer.
- **Echo-then-run (EV-23)** — the confirm screen quotes
  `resolveSelection()`'s exact tuple; echo and write are the same object
  by construction. The echo is **non-assertive** about preserved state
  (`— thinking unchanged` only on the `[]` row) — it asserts only what
  the screen wrote. See [[echo-then-run]].

## Escalations and the mechanical path

- Three `ESCALATION` reports (EV-22 J-1/J-2; EV-23 J-1/J-2; EV-25
  promotion) — each carried facts, no recommendation; rulings appended
  verbatim to card faces and applied.
- **EV-25 ran the mechanical path**: its design was fully settled by
  Phase 1 rulings + landed module contracts, so steps 2–6 were skipped
  and the card itself was the owner handoff. Deliberation is not ritual.
- EV-24's deliberation converged at round 3 on splice and
  malformed-handling; the capability dispute went the distance and the
  designer withdrew the writer-side gate in round 3.

## Infrastructure incidents (recovered, zero work lost)

- Two runner containers died on infrastructure: job-8 (provider error
  mid-retry, stalled before its re-dispatch) and job-9 (stalled while
  legitimately blocked on its 45-min owner dispatch — the orchestrator's
  15-min stall window was shorter than the runner's longest legitimate
  silent wait). Fix: orchestrator-side stall window raised to 55 min.
  The EPIC-3 lesson (poll-slice long waits) is the runner-side fix; the
  invariant is the same at every dispatch layer — the no-activity window
  must exceed the longest legitimate silent wait.
- Both recoveries resumed from committed board/card state per the
  runners' board discipline — the durable-state claim was validated in
  practice. EV-24's owner resumed from its own plan doc and partial
  artifacts without restarting.
- A transient CI red early in EV-23 (board/card push mismatch left by
  the first stalled container) was corrected from `29b2a07` onward;
  board-discipline note: never push a board transition without the
  card's matching state commit.

## Follow-ups filed

- **FLLWUP-9** — explicit clear-thinking-override affordance (deferred
  from EV-24 round 3; absence means preserve, deletion is hand-edit-only).
- **FLLWUP-10** — writer `existingThinking` object-`:suffix` fix (the
  EV-23 J-1 green-light condition; goal text ruled verbatim by the
  product-owner).
- **FLLWUP-11** — smoke phase selector so the `/council-models` Phase 5
  end-to-end falsifier runs without phases 0–4's real-model dispatches
  (EV-25's smoke had to run via an ad-hoc scoped script because the full
  harness cannot fit a bounded runner window).

## Grounding

Card records: `council/cards/EPIC-5.md`, `EV-22.md`, `EV-23.md`,
`EV-24.md`, `EV-25.md`. Specs: `docs/superpowers/specs/2026-09-04-EV-22/23/24-design.md`.
Decomposition ruling packet: `vault/raw/2026-09-04-po-epic5-ruling.md`.
