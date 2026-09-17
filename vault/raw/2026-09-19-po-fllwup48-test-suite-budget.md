# PO ruling — FLLWUP-48 test-suite-cost budget

Escalation from `council-runner` for the three open-judgment items at the end
of step 6. Steps 1–6 complete; the runner must continue at step 7 once these
are ruled. Facts only were in the packet; the three items plus the scope
confirmation are below.

## Items ruled

### 1. Budget figure N

**The figure written into `README.md`, `vault/wiki/test-suite-budget.md`, and
`AGENTS.md` is the measurement taken on the implementing pass — a fresh head
worktree, full `bun install`, recorded with machine + date + SHA + command.**
The figure is descriptive of the measurement, not a normative cross-machine
ceiling. The ≤180s proposed by the owner is **not the budget figure**; it is a
**drift threshold**: any re-measurement that exceeds 180s means the budget has
rotted and the card reopens (or a new card opens).

This honors each seat:

- The Skeptic's O11 split verdict ("the figure is not settable by any test
  across machines; CI-class hardware unmeasured") is taken at face value: the
  figure is this machine's measurement, with provenance, and the drift
  threshold is the maintained invariant — the rule that turns a descriptive
  number into something the suite can be tested against over time.
- The principal's position (no figure from deliberation; provenance from the
  implementation-pass run) is the literal ruling. The implementing pass
  *is* the source of the documented figure.
- The owner's position (a number around 2× headroom) becomes the drift
  threshold, which is the maintained invariant. 180s is one line in the wiki
  page; a re-measurement cycle that finds the suite at 187s flags rot.

What this writes:

- `README.md` (Development section, adjacent to the existing `README.md:315`
  block): one line stating the measured envelope, the command (`time bun
  test`), the date, and the SHA at which the measurement was taken.
- `vault/wiki/test-suite-budget.md` (new, linked from
  `vault/wiki/index.md` catalog): the measured per-file table, the re-measure
  command, the ceiling-vs-budget distinction (per-arm ceilings 180s/300s vs
  descriptive envelope ~95s), the standing re-measure rule ("any new live arm
  must state expected wall-clock and ceiling in its test header; README budget
  line re-measured when an arm changes"), and a short note that 180s is the
  drift threshold.
- `AGENTS.md:17`: replace the brittle "34 tests, 1 skipped …" with the
  envelope + the two flags (`COUNCIL_INTEGRATION=1`,
  `COUNCIL_MCP_INTEGRATION=1`). The count is removed, not refreshed — the
  non-decaying fix the principal named.

### 2. `gates.yml` `timeout-minutes` backstop

**Do not ship a `timeout-minutes` line on this card.** The card owns the
budget question; a CI-policy decision about whether the `gates` workflow
should have a default timeout (loose or otherwise) is a separate question
with its own rationale (which workflows get one; at what threshold; how the
threshold is set and revised; whether a runaway backstop wants the same
treatment as the budget, or vice versa).

Principal's "separate item" framing is the correct scope. The principal's
arithmetic (the TUI arm's own enforced ceiling is `300_000` at
`ev41-retry-e2e.test.ts:362`, which exceeds any ~180s suite budget) settles
that a step timeout tight enough to express the budget would mask attribution
by pre-empting the arm's own timeout; a step timeout loose enough not to fire
(~15 min) cannot express the budget. So no figure can be both budget-keyed
and consistent with the existing per-arm ceilings.

A loose `timeout-minutes` for genuine runaway (a hung test the per-arm
`spawnSync` ceilings miss) is a defensible CI policy, but it is not this
card's deliverable. If a future card opens it, the rule applies: separate
card, separate rationale, separate decision.

### 3. Gate-vs-document confirmation

**Ratify document-only.** Both seats converged on document-only with no seat
holding the gating side. The Skeptic's O6 demonstrated on real engine code
that a default-skip gate would empty criterion-2 evidence (suite stays green
while the live mechanism is broken, because `gates.yml` sets no env var). The
card's own disjunctive premise — "binding only if suite time becomes binding"
— is measured false at 94.4s (owner's run) / 95.83s (skeptic's run) on a
clean, fully-installed head worktree. The arms are offline (`--offline
--provider ev40`, zero credential reads; only `integration.test.ts` is a
network test, and it is already gated behind `COUNCIL_INTEGRATION=1`).

The disjunctive goal's "run within it" branch is discharged by fact: the
measured envelope is inside the documented envelope, so no run-binding is
required. Gating stays available as the branch that reopens if the
re-measured envelope is ever false — that is what the standing re-measure rule
plus the 180s drift threshold protect. The option is preserved by the
re-measure trigger; the card does not permanently accept any residual.

## Scope confirmation (ruled here for completeness)

The three hygiene fixes are in-scope as one delivery:

- **(a) Bytecode exclusion in the shape scan.** `countMatches`/`filesUnder`
  in `test/faux-provider-shape.test.ts` skip `__pycache__/` and `.pyc/.pyo/
  .pyd`. Acceptance: `test 6` passes with the orphan
  `test/__pycache__/ev41-tui.cpython-312.pyc` left on disk. The witness is
  not weakened: a token in a `.ts` source under `test/` still trips test 6.
  The new scan-domain assertions are two-sided (a `mkdtempSync` temp tree with
  a `__pycache__/x.pyc` + `x.ts` carrying the same token, asserting bytecode
  excluded / source included). Confirmed `closed-green` by the Skeptic's
  in-`/tmp` reproduction (O9).
- **(b) `test/ev41-retry-e2e.test.ts:325` stale comment fix** — one line.
  Does not extend the witness's token regex (per principal's refinement:
  amend FLLWUP-49's committed witness via a different card, record the
  allowlist-decay as a finding).
- **(c) `AGENTS.md:17` decay fix** — non-decaying wording, not a refreshed
  count.

Zero new live arms, baseline `ev40-headless` 3 / `ev40-live-gates` 5 /
`ev41-retry-e2e` 5 / `ev43-reachability` 2 unchanged (Skeptic O8 / T8
`closed-green`). All deliverable strings are internal developer documentation
inside the Phase-1 carve-out: no new flag name, no string added to
`council/preflight.sh`, no user-visible copy. No copy escalation.

**Fallback if strict scope discipline is preferred:** the bytecode fix
splits into a follow-up, drafted by `product-owner` per the step-13
re-homing. The other two hygiene fixes and the three docs ride this card.

## Why nothing here reaches `steward`

The escalation contract's portfolio criteria:

- **Declining the card outright:** no — the card ships document-only, which
  is a valid disjunct per the Phase-1 ruling.
- **Permanently accepting a residual rather than a temporary one:** no —
  document-only is a valid delivery on a disjunctive goal; the re-measure
  rule plus the 180s drift threshold keep it maintained.
- **Touching a recorded human decision:** no — the Phase-1 card-specific
  ruling reserved the choice to `product-owner`; I am using the delegated
  authority, not overturning a human.
- **Card's stated `goal` is itself the defect:** no.

## Grounding

- `vault/wiki/index.md` — catalog only; no suite-cost page exists, so this
  card creates one.
- `vault/wiki/smoke-test.md` — the "unit decode tests remain the CI gate; the
  smoke is the live-path falsifier" separation, which grounds what CI green
  does and does not witness.
- `vault/wiki/main-repo-immutability.md` — worktree-only, which is why the
  residue does not block this card's gates.
- `council/cards/FLLWUP-48.md` — the full deliberation, all four steps;
  positions on both sides verbatim; the Skeptic's job-26.5 (12 objections,
  all `closed-green` except O11 split and O12/O13 record corrections).
- `council/cards/FLLWUP-49.md` — zero-new-live-arms constraint (O10).
- `council/cards/EV-41.md` — the live pty and `-p` falsifier arms this card
  budgets.

## Reversibility summary

- **Item 1:** the figure replaces by re-measurement (the implementing pass
  rewrites it). The drift threshold revises by a future card. Both are
  line-edits.
- **Item 2:** trivially reversible — a one-line PR adds a `timeout-minutes`
  later if a separate CI-policy card opens.
- **Item 3:** reopens automatically on any re-measurement that exceeds 180s
  (the drift threshold). Cheap.
