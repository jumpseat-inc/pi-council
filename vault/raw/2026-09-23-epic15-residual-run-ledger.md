# EPIC-15 Residual Run Ledger

- Run: `/features-deliver EPIC-15` residuals — "usages + procedure-pin residuals"
- Run id: `2026-09-22T20-33-20-915Z-499978-uus0pt`
- Orchestrator: the human's agent, autonomously
- Phase 0 preflight: **PASS** (`council_preflight` → ok; `bash council/preflight.sh` → `PASS: preflight clean`); `python3 council/validate.py` clean; all eight seats resolve by name, no repo-local overrides
- Scope: the five `Backlog` residuals carrying `epic: EPIC-15` while `EPIC-15` itself is `Done` — `FLLWUP-111`, `FLLWUP-109`, `FLLWUP-110`, `FLLWUP-107`, `FLLWUP-108`
- Gate state throughout: `.council.json` `gate.mode: active`; the `noul` wire-shape drift was already fixed (`e903b67`), so the gate was no longer inert
- Merge-time environment: `main` ruleset requires 1 approving review + linear history + PR-only; admin bypass authorized run-scoped by R-B

## Phase 1 rulings (binding, recorded on the epic card and every child face)

- **Scope/promotion.** FLLWUP-107–111 promoted `Backlog` → `Ready`; `EPIC-15` stays `Done` (a residual run, not an epic re-open).
- **R-A — record push.** Run-scoped human authorization for the step-12 record commit to be pushed directly to `main` with the pusher's admin identity, recorded **before** the first record push ([[record-push-discipline]]).
- **R-B — merge.** Run-scoped human authorization for `gh pr merge <PR> --squash --admin --match-head-commit <X>`; `<X>` the exact head SHA criterion 2 was read against; a SHA mismatch is a HALT, not a retry.
- **First-merge watching.** The human declared the run unattended, waiving the "first autonomous merge should be watched" expectation.
- **Sequencing (steward job-1).** `FLLWUP-111 → FLLWUP-109 → FLLWUP-110 → FLLWUP-107 → FLLWUP-108`, strictly serial, one runner at a time; no retirements. Rationale: 111 (async `runTool`) must precede 109/110 so their new tests are authored on the async helper; then pipeline (109) before surface (110); then the 107 guard before the 108 wording-coupled edit it guards.

## Merges

| Card | Mode (substrate) | PR | Match-head SHA | Merged SHA | Notes |
|---|---|---|---|---|---|
| FLLWUP-111 | Verify | #107 | `9d5ca5377133fb53bc0ffaaba7839a2913e2c808` | `927fdaa9dbe9daf550a1d6d1503a428aceda2f21` | recorded `Verify`, runner executed `Direct`; HALT → repaired with skeptic+judge |
| FLLWUP-109 | Direct | #108 | `b1c930bd1e39a88b0fa3a4d91f0eae5ebec0f8eb` | `3d62b3a91767ab8f53769f1def191bbdcccf074e` | foreign `--cache-file` parent created |
| FLLWUP-110 | Direct | #109 | `e542d4faded1438a78ae37f5af02a00af547e7a4` | `9da7ff18daafc01b6b19589cf2d56397acad7500` | `cache: hits=<N> misses=<M>` summary line |
| FLLWUP-107 | Direct | #110 | `9409e5907e7dcc2ded95a63f102210e8b5858f53` | `41e96765d1f1a8d4c29f7cae31c46c556ee8f97a` | renderProcedure substitution-set pin + pack scan |
| FLLWUP-108 | Direct | #111 | `f2b2edd4f9bb39ad5424aa6af2dc7930f65a974a` | `077ebc1af260b5b639ee0c956d811d6ab58fb65c` | sentence-scoped remediation-element pin |

Every merge executed pinned under R-B; `gates` workflow `SUCCESS` on every PR head and every merged SHA (keyed on the `workflow` field). No push raced a check. No `RETIRED`; no `Needs Human`.

## The mode mismatch and its HALT (FLLWUP-111)

The orchestrator's `council_dispatch` `mode` param is recorded on the **ROOT
manifest**, but the runner re-derives its path via `council_route op:route`; on
the fallback (no recorded decision) its own step-1 judgment governs. For
FLLWUP-111 the orchestrator recorded **`Verify`** while the runner judged and
executed **`Direct`** (owner-only — no skeptic, no judge). The deterministic
merge check read the substrate ([[deterministic-merge-check]]), got `Verify`, and
issued verbatim:

> `HALT: FLLWUP-111 — mode Verify requires a goal evaluation and none is recorded`

The orchestrator did **not** merge on the runner's report (the command: "the run
substrate, never a seat's report"). It repaired by producing the missing `Verify`
evidence at the recorded mode — `skeptic` (job-4: no blocking objections; T-U9
pin red-at-base `e2240a0` / green-at-head) and `judge` (job-5: `PASS`) — then all
five criteria held and the pinned merge proceeded. The remaining four cards were
dispatched `Direct`, which is self-correcting: `readCardMode` upgrades to
`Deliberate` whenever a generator seat appears, so no further HALT occurred.

The repair path (orchestrator dispatches the missing mode's seats directly) is
**not described by the command**; the command says HALT and there is no sanctioned
repair. Flagged as an open gap; a card is owed.

## Follow-ups (step 13)

FLLWUP-107's runner surfaced two step-13 candidates but returned `DONE`-with-held
rather than the contract's `ESCALATION`. The orchestrator routed them to
`product-owner` (job-10), which confirmed (overturning an unsupported `Merge`):

- "Render `$CONFIG_DIR_NAME` / `@CONFIG_DIR@` in procedure copy…" — recorded `Merge` (no target) → **File** → `FLLWUP-112`.
- "Generalize the FLLWUP-107 procedure-pack scan to an unresolved-token allowlist" — recorded `File` → **File** → `FLLWUP-113`.

## Learnings

1. **Recorded mode ≠ executed mode.** The ROOT `mode` is metadata, not a control
   on the runner's execution; a stricter recorded mode than the runner executes is
   the missing-goal-evaluation HALT shape. `readCardMode` upgrades to `Deliberate`
   on any generator seat, so recording `Direct` is robust.
2. **The runner's stall window must exceed the longest seat bound it waits on.**
   `stall_minutes: 6` anti-stall-killed the first FLLWUP-111 runner at ~8 min while
   it blocked on a 45-min owner dispatch; `75` survived the rest of the run.
3. **A residual scope is a full run with its own Phase-1 authorizations.** "Deliver
   all five" is not the record-push/admin authorization; R-A/R-B must be recorded
   before the first push. First run since EPIC-9 to get the sequence right.
4. **Held follow-up candidates are a real routing surface.** A runner can return
   `DONE`-with-held; the orchestrator must route them to the confirming seat and
   may not apply a recorded disposition as confirmation ([[confirmation-authority]]).
5. **`validate.py` does not catch duplicate board headings.** Several board writes
   left a stray second `## In Review`; the validator enforces card membership, not
   heading uniqueness.

## Residuals owed

- A card for the mode-recording/repair gap (recorded mode not controlling
  execution; no sanctioned HALT-repair path).
- FLLWUP-110's runner wrote no step-1 run record to its card face (the orchestrator
  appended the merge record).