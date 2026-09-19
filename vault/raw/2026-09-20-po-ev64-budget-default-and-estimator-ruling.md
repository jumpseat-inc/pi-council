# PO ruling — EV-64: `gateStateBudgetTokens` default semantics (O8) and the estimator residual (O1)

**Seat:** product-owner. **Date:** 2026-09-20. **Run:** `/features-deliver EPIC-13`, card EV-64.
**Questions referred:** (O8) when a repo-local `policy.json` omits `gateStateBudgetTokens`,
must the gate fail loud, default only when `mode ≠ off`, or keep a silent code fallback?
(O1 residual) may EV-64 ship with `ceil(utf8 byteLength / 3.5)` documented as an estimate,
with the production gate model's tokenizer unprobed, or must the card block until it is measured?

---

## Q1 (O8) — Ruling

**`gateStateBudgetTokens` is a required key on every policy that can run the gate, and is
permittingly absent only where it cannot matter: a policy whose resolved `mode` is `off` may
omit it. The packaged `council/gate/policy.json` ships the field explicitly at `32000`
alongside `mode: "off"`.** Option (b), with the packaged field carried; (a) and (c) rejected.

Three clauses, all binding on the spec:

1. **Present ⇒ validated unconditionally**, in every mode. A `0`, `-1`, `1.5`, `"32k"` in a
   `mode: "off"` file still FAILs. An invalid value must not lie dormant waiting to become live
   when the consumer flips the mode on. This is EV-62's existing posture, unchanged.
2. **Absent ⇒ legal only on the off path.** A policy that resolves to `advisory` or `active`
   without the key FAILs, on the same single-line `FAIL: <file> has an invalid
   <key> — <what was found> — set a valid value or remove the key to use the packaged
   default` surface established by EV-62. Copy for the *absent* case is the spec's to write;
   the template's "remove the key" advice is wrong for an absent key and must not be emitted
   verbatim here (whole-file shadowing means removing it from a repo file leaves it absent,
   never packaged).
3. **No second reachable budget constant.** The value the loader resolves on the off path must
   either be derived from the packaged file or be pinned equal to it by a test, so the
   "two independent 32000s" class O8 named cannot exist anywhere on this branch. Whether the
   off-path field is a constant, `undefined`, or a read of the packaged file is the owner's
   and principal's call — it is the *how*. What is ruled is that no packing path can ever see
   an undeclared budget, and that no code-resolved budget can ever disagree with the packaged
   one.

**R3 is untouched.** The packaged policy still ships `mode: "off"`; consumers still opt in per
repo. **The goal text is satisfied as written** — "the policy's `gateStateBudgetTokens` default
of 32000" is honest under this ruling: the default a consumer with no repo file receives is the
packaged file's literal `32000`, i.e. a default that lives in data. No goal defect, therefore no
escalation.

### Grounding

- **`council/cards/EV-62.md` Intent** — "The question set, the policy weights, the confidence
  floors, the model id, and the endpoint must be per-repository data, not code, or tuning
  becomes a prompt-and-commit exercise", and "a silently defaulted policy is an untested
  policy." A state budget is a tuning coefficient of exactly that family. This is the decisive
  page for Q1: (c) is the option that puts a routing coefficient back in code.
- **`council/cards/EV-62.md` Acceptance** — repo override is **whole-file with no field-level
  merge** (verified in `extensions/gate.ts` `readGateFile`/`gateDirs`: first hit wins, the
  shadowed file is never read). Consequence neither seat's round-2 position priced: for a repo
  that supplies its own `policy.json`, the packaged `32000` **can never reach it** — the only
  value such a repo can receive is the code constant. So (c)'s packaged-explicit half does not
  serve the population (c) was defended on behalf of; under (c) the shipped-but-unreachable
  packaged field is decoration, and changing it silently changes nothing for opt-in repos.
- **`extensions/gate.ts` `loadGateDecision` (EV-63, already merged)** — the sibling loader on
  the same data surface requires **every** numeric coefficient (`weights`, `floors`,
  `noulThreshold`, `thresholds.verify/direct`, with a cross-key ordering predicate) and defaults
  none. Requiring a numeric coefficient is not a new imposition on this surface; it is the
  posture the file already takes, one commit upstream.
- **[[gate-parity]]** — "the writer may be stricter than the runtime only where dispatch is
  also stricter"; enforcement belongs "where the person is", and a gate that fires where no
  failure can occur is the asymmetry that page forbids. Under (a), a `mode: "off"` policy
  FAILs for omitting a field that cannot be read: EV-62/R3 make `off` issue **no gate call**, so
  `buildGateState` never runs and no bytes are ever packed. Under (b), the failure fires at the
  exact act that gives the field consequences — setting the mode on — which is also the act the
  consumer performs by hand, with no tooling in the way.
- **O8's own probe result, closed this way rather than around.** The skeptic falsified the
  absent-`mode`→`off` analogy on the grounds that an absent budget is *still an active
  parameter* (up to 32k of state emitted). That objection is directed at (c) and (a)-as-universal-
  defaulting, and it is answered rather than overridden: under (b) the defaulted value sits on a
  path that packs nothing, so it is inert, which is precisely the property that made `mode`'s own
  default safe. (b) restores the analogy instead of contesting it.
- **AGENTS.md convention 6 / [[council-update]]** — a repo-local `council/gate/policy.json` is
  consumer data; the consent-gated refresh path writes only tooling-class files
  (`validate.py`, `cards/_template.md`) and never data-class ones. (a) would break that file on
  upgrade with no supported repair path — hand-editing under a single-line error is the only
  route, which is a workable recovery story for a *value* the consumer chose (EV-62) and a poor
  one for a *key the consumer never knew about*.
- **No installed base to break — measured, not assumed.** `council/scaffold/` (what
  `/council-init` copies: `board.md`, `cards/_template.md`, `preflight.sh`, `validate.py`,
  `.council.json`, `vault/`) contains **no `gate/` directory**, and `loadGatePolicy` has no
  production caller in `extensions/` outside `gate.ts` itself — it is reachable only from
  `test/gate.test.ts` until EV-65 ships a transport. So the population (a) "protects" is empty,
  and the population (b) requires is: hand-written repo policies that set `mode` to
  `advisory`/`active`, of which there are none today and every future member is someone who just
  chose to spend gate tokens. The compat-break framing in the question is real but prospective,
  and (b) carries the smallest prospective version of it.

### Options rejected

- **(a) fail loud unconditionally.** Rejected on gate-parity, not on compatibility: it is
  strictness with no failure to prevent, because on the `off` path nothing reads the budget and
  nothing can misbehave. Its compat argument is also weaker than stated (no installed base, no
  caller), but it would harden into a real break the moment EV-65 gives the loader a session
  path — at which point an upgrade would fail a config that cannot misbehave, with no
  `/council-update` repair route.
- **(c) silent 32000 code fallback with drift documented.** Rejected on EV-62's own two
  sentences: a silently defaulted coefficient is an untested coefficient, and a coefficient that
  is only reachable from code is per-repository tuning that lives in neither policy file. The
  drift between the packaged and code constants is the symptom; the disease is that under
  whole-file shadowing the code constant is the *only* value any opt-in repo ever sees, so
  documenting the drift documents a hole rather than closing it.
- **Packaged-explicit alone (principal's amendment, taken without its original reasoning).**
  Shipping the field in the packaged file does not answer O8 by itself — it fixes only the
  supplies-nothing population, which already resolves correctly. Adopted under (b) for the
  reason that survives: it makes the goal's "default of 32000" a data fact and gives an opt-in
  repo a packaged value to copy when the FAIL tells it to declare one.
- **Splitting the scope to give each seat its preferred default rule.** Not done. One rule
  governs the key; both original positions lose on the fail/default question.

### Reversibility

One predicate in one function (`loadGatePolicy`) plus its fixtures. If (b) turns out to be too
strict for real consumers, relaxing it to (c) is a deletion, and no consumer's working
configuration is stranded by the change (an omitted key that once FAILED loads again). If it
turns out too lax, tightening to (a) remains available at any point before the gate has an
installed base with `mode: off` policies in the wild. The asymmetry that decided the direction
is that (b) is the only option which never blocks a configuration that cannot emit state and
never lets a live budget be undeclared — so whichever way the evidence moves, the move is a
one-line edit and a test, not a schema or a consumer migration.

---

## Q2 (O1 residual) — Ruling

**Ship. The card is not blocked on measuring `typesafe/jev-1.13`'s tokenizer.** The estimator
stays `ceil(utf8 byteLength / 3.5)` as a single pinned pure function, documented as an estimate
and never as a bound, and the residual is reclassified: not `open-untested` awaiting a bespoke
probe, but *self-settling on the ledger* — and it is that property, not the absence of an
objection, that authorizes shipping.

Conditions, all binding on the spec:

1. **Wording (settled on the record, restated as a constraint):** the estimator is documented
   as "an estimate, not uniformly conservative", **with direction and provenance** — the
   reference ratios (dense code −35.9%, rare CJK −13.3%, emoji −17.2%, ASCII prose over-counts
   +45.8%) labelled as `o200k_base` **reference** ratios, not measurements of the gate model.
   The word "conservative" must not survive as a claim about the estimator anywhere in the
   module docs, comments, or test names — that is grep-falsifiable and the spec should pin it
   that way.
2. **The claim that must not ship:** anything asserting the packed state *fits the model's
   context window* or *stays under the transport's cap*. Under this ruling the budget is a
   policy knob with a declared value; it is not a proven transport limit. Establishing that
   relation is whoever measures the real ratio, not EV-64.
3. **The residual must be recorded with its trigger, not closed.** On the card: *if any shipped
   ledger line shows provider-reported real `input_tokens` exceeding the estimator's count for
   the same state, the estimator coefficient is a defect and gets its own card.* That is the
   settling condition, and it is discharged by evidence the system already collects (§below),
   which is why it does not need a probe.
4. **The bespoke probe is ruled out of this card, not deferred into a later one.** Measuring the
   production tokenizer from EV-64 means a hand-rolled live call to the decisions endpoint with
   a transport EV-65 has not built, behind `COUNCIL_INTEGRATION` — and its answer is superseded
   by the provider's own `usage.input_tokens` on the first real call. It would cost a network
   surface the suite exists to keep out and produce a number the ledger will re-derive for free.

### Why the residual is bounded enough to ship on

- **The error is capped by the section caps, not by the budget.** O7 established the caps sum to
  19,000 against a 32,000 default. So at the shipped configuration no state carries more than
  ~19k estimated tokens, and the worst observed *under*-count ratio (−13.3%, i.e. real ≈ 1.15×
  estimate) bounds that at roughly ~22k real tokens. The estimator's failure mode at the default
  is therefore a known-magnitude offset on a path that never reaches the budget, not an
  unbounded overrun. (That O7 also means the drop path is unreachable at the default is O7's
  problem to pin in the fixture design, not a reason to block on tokens.)
- **The failure posture makes the residual non-catastrophic.** EV-65 is fail-closed: a `400`,
  a timeout, or any non-2xx resolves the card to `Deliberate` with the reason recorded verbatim.
  A wrong estimator cannot silently route a card to a thin panel — the visible cost of
  under-estimating is a refused call and a full deliberation, i.e. the gate spending nothing,
  which is the expensive-but-honest direction. [[metered-deliberation-routing]]'s purpose is
  that spending become a deliberate choice; a call that fails closed has not made a wrong one.
- **The measurement already exists on both sides of the seam.** EV-64's drop record carries
  `measuredTokens` (the estimate) and its `stateHash` pins the exact bytes; EV-65's response
  carries `usage.input_tokens` (the provider's real count for those bytes);
  `extensions/gate-ledger.ts` has the `kind: "outcome"` follow-on line as the sanctioned place
  for it, and `council/cards/EPIC-13.md` Acceptance already *requires* the gate's spend be
  "recorded with a reported basis rather than estimated". The estimate-vs-real ratio is therefore
  a join over records the epic is contractually obliged to write, not an experiment someone must
  schedule. Blocking a card to run a probe whose result will arrive automatically, per card, with
  better provenance, would be the wrong trade.
- **Nothing consumes it yet.** R3 ships the gate `off`; the packer has no caller. The first
  opportunity for a real ratio is EV-66's advisory rollout — after which the ledger, not a
  fixture, is the calibration surface. This is the same resolution the epic chose for its own
  thresholds: tune from recorded decisions, "from evidence instead of taste" (`EPIC-13.md`
  Intent/Acceptance).

### Reversibility and scope

The estimator is one named pure function pinned by a recompute fixture (principal's T3), so
correcting it later moves a coefficient and a fixture, not an architecture — and nothing on the
Q1 side changes as a result: the budget's *semantics* are ruled independently of the estimator's
accuracy, so a future tokenizer correction does not reopen O8.

**What this authorizes:** EV-64 to proceed to implementation at step 7 with the agreed
architecture (pure `extensions/gate-state.ts`, explicit touched-file manifest, producer-side
sha256, fixed section order, truncate-to-whole-entry-prefix, `[{section, truncated, kept,
measuredTokens}]` records, scorer-then-date ruling ordering) plus the Q1 policy clauses and the
Q2 wording/trigger conditions above.

**What this does not do:** no scope added, no card declined, no residual accepted permanently —
the tokenizer residual is accepted *provisionally, with a named settling condition on the
ledger*, which is the form that keeps this seat out of R2's "no card descoped without a
steward ruling" territory. O3's matcher-precision limitation likewise rides as a documented
known limitation per the consolidator's record, not a claim of relevance. Remaining
skeptic items O4/O5/O6/O7 are plan-level pins and stay with the spec, including the
sources/-page exclusion and the cap-trim-vs-budget-drop distinction in the drops record.
