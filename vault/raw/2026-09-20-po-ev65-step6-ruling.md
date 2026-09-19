# PO ruling — EV-65: ledger home for call-time facts, and the `verify ≤ 0` guard

**Seat:** product-owner. **Date:** 2026-09-20. **Run:** `/features-deliver EPIC-13`, card EV-65.
**Referred from:** the consolidator's step-5 synthesis, "Open judgment" items 1 and 2, after the
3-round cap was hit with delta 1 still crossed (each seat reversed once) and with the skeptic's
record corrections O1 and O10 applied.

---

## Q1 — Ledger home — Ruling

**Adopt the v2 call-line bump. `GATE_LEDGER_SCHEMA_VERSION` goes 1 → 2; `appendGateCall`
carries the call-time union atomically in one append; EV-65 writes exactly one ledger line per
call and writes NO outcome line.** The outcome line stays what EV-61 built it to be: the
follow-on record for what happened after the card ran.

Binding v2 call-line key set — the v1 set **union** the call-time facts, all additive and all
optional-tolerant on read:

`schemaVersion: 2, kind: "call", callId, stateHash, questionSetVersion, answers, resolvedMode,
policyVersion, recordedAt` (v1, unchanged in name and meaning)
**⊎** `basis` · `model` (the versioned model the response reported) · `provider` ·
`usage {input_tokens, output_tokens, cost}` · `generationId` · `failure {class}` (present only
on a failed call) · `drops` · `advisory` · `unknownAnswerIds`.

Four clauses, binding on the spec:

1. **`basis` on the line is the converged composite**, `basis = "gate call failed: " +
   verbatimTransportReason` for failures and the `decide()`-derived composite for successes;
   the verbatim reason occurs **exactly once** in the record (no `failure.reason` field), and
   `"Mode: " + resolvedMode + " — " + basis` byte-equals EV-67's pinned render. That join is
   the point of putting basis on the record at all.
2. **`drops` rides the call line.** This discharges the EV-64 deferral rather than re-opening
   it: the producer is `buildGateState`, the consumer is the record, and the line is where both
   the estimator's `measuredTokens` and the provider's `usage.input_tokens` end up next to each
   other — which is what makes my EV-64 Q2 residual self-settling on the ledger rather than
   something anyone must schedule a probe for.
3. **The bump is additive and the reader stays tolerant.** No `schemaVersion` validation in
   `readGateLedger`; no rewrite or re-serialization of existing lines; mixed v1/v2 files must
   read with `rederiveResolvedMode` identical on both (the skeptic's O17/PROBE8 already proved
   the substrate does this — the spec must keep it as a test, not assume it).
4. **EV-65 writes no `kind: "outcome"` line**, and no card in this epic may put a *call-time*
   fact at `record.outcome.*`. Downstream cards (EV-66's `advisory`, EV-67's `basis`, EV-71's
   `usage` + `generationId`) read call-line fields. The single-writer property stops being a
   convention someone must remember and becomes a structural fact of who writes what.

### Grounding

- **`council/cards/EV-61.md` Intent** — "every call records the packed state's hash, the
  question-set version, every answer with its probabilities and confidence, the mode the pure
  decision function resolved, and the policy version it resolved under. **Once the card has
  run, the outcome is appended to the same record.**" The outcome line was designed for the
  post-run fact, not for call-time facts. Option (a) spends that surface on pre-run data and
  leaves EV-61's own stated purpose with no home; option (b) leaves it open. This is the
  decisive page: the two options are not "where do the fields go", they are "does the ledger
  keep the one slot its substrate card said it would keep".
- **`council/cards/EV-65.md` goal, read as written** — "…each resolve to Deliberate **with the
  failure reason recorded verbatim**." Under (a) the goal deliverable is the one thing the
  crash window can destroy: O1 (closed-red, correction applied) established that the v1 call
  line carries only `resolvedMode`, so under declared-outcome a crash between the appends loses
  basis, usage, generationId *and* the verbatim reason. The record that survives then reads as
  an ordinary `Deliberate` call with no reason and no marker that a reason was lost. A write
  path that can silently lose its own acceptance term is the defect; the schema bump is the
  price of not having it.
- **`council/cards/EV-71.md` Intent** — "**What is not acceptable is an unaccounted call whose
  cost is neither carried nor named.**" Option (a)'s crash window produces exactly that shape,
  for exactly the call the gate spent tokens on. EV-71 exists to close a silent-under-reporting
  path; choosing (a) in EV-65 would build a new one upstream of it.
- **Skeptic O16 (closed-green) against the "readers never append" premise.** The last-wins
  clobber is real on the tree today. Option (a)'s safety rests on a *convention* that the
  substrate does not enforce — and the epic already contains two cards whose acceptance wants a
  ledger line of their own: **EV-66** ("every drafted card has exactly one ledger line marked
  `advisory: true` carrying its resolved mode and basis") and **EV-69** ("any hard override
  that fires on the observed state runs the full path **with a ledger line recording the
  re-route**"). Under (a) both must either write a second outcome and destroy EV-65's usage and
  basis, or be re-shaped to fit; under (b) both are ordinary call-line facts written by the one
  function that already has them in hand.
- **Skeptic O3 does not carry (a)'s deferral argument.** "No `.outcome` readers exist today" is
  true at `4b4a028` and false by the end of this run: the readers that would learn
  `record.outcome.*` are not hypothetical future parties, they are EV-66/EV-67/EV-71/EV-72,
  already written, in R2's order, immediately after this card. So (a) does not defer the
  reconciliation cost, it *adds* the migration to it — which is the principal's R3 retraction,
  stated correctly this time and grounded in the board rather than in a probe.
- **My own EV-64 ruling, engaged rather than papered over.** `2026-09-20-po-ev64-…-ruling.md`
  Q2 named "the `kind: "outcome"` follow-on line [as] the sanctioned place" for the reported
  usage. That was a parenthetical about where a ratio's two inputs are recorded, on a card whose
  question was the token estimator; the ledger home was not before this seat and is not before
  it now as a *human* decision, so nothing is being overturned. What matters is that (b) serves
  EV-64's stated purpose better than (a) did: with `drops` and `usage` on the same record, the
  estimate-vs-real comparison is a single-line read instead of a join across two lines that a
  crash can separate.
- **No human decision is at stake.** `EPIC-13.md` R1–R6 settle merge authorization, run order,
  the `mode: "off"` packaged default, panel composition, promotion cadence, and record push.
  None of them freezes the ledger's record shape, and the "call line stays byte-frozen forever"
  line in `extensions/gate-ledger.ts` is a card-level design note — EV-61's own run record says
  its placement was "settled by the card, not a convention amendment". AGENTS.md's frozen
  surfaces (convention 7, `hub.ts`; convention 12, `runs/`) do not cover this file. The tolerant
  reader is the upgrade path the source comment itself anticipated ("future record shapes never
  strand the file").

### Options rejected

- **(a) declared-outcome, call line byte-frozen v1 (owner's final).** It loses on mechanism, not
  on tidiness: it puts a goal deliverable inside a crash window, makes the record
  non-self-describing (against `gate-ledger.ts:51`'s own "self-describing standalone"), spends
  the outcome surface EV-61 reserved for post-run facts, and buys its safety from a single-writer
  convention the substrate actively defeats (O16). Its best ground — that routing survives either
  way (O2) — is true and beside the point: EV-65's goal is about the *record*, not about which
  mode the card runs under, and on the record's correctness (a) is strictly weaker.
- **Splitting the fields** — call-time facts on the call line, `basis` in the outcome, say, or
  a partial v2. Rejected as the worst of both: two read paths, one crash window, and a schema
  bump that still needs a second pass later. The design I name is one home for call-time facts.
- **"Let EV-66 file the bump when it needs it."** There is no such card: no later card's goal
  owns the ledger's shape, and by then the readers exist and the bump costs more. EV-65 is the
  only card in the epic that ever has all of these values in one function call.

### Reversibility

Cheap, and measurably so. Reverting is a deletion: `GATE_LEDGER_SCHEMA_VERSION` back to 1 and
the optional fields dropped from `appendGateCall`; `readGateLedger` never validates the version
and ignores unrecognized fields and kinds, so any v2 line written before a revert stays readable
(O17 proves both directions on the tree today). And there is no installed base to strand:
R3 ships the packaged gate at `mode: "off"`, no consumer ledger holds real gate calls yet, and
`appendGateCall` has no production caller before this card. The irreversible-looking cost — a
schema bump — is the one thing this substrate was explicitly written to absorb.

---

## Q2 — the `verify ≤ 0` guard — Ruling

**It is a defect, and it is not EV-65's to fix. Neither (a) nor (c): the correct home is (b),
`loadGateDecision`, and it ships on a follow-up card, not in this diff.** EV-65 implements no
verify guard, adds no loader change, and records the gap in its spec as a stated precondition of
the recomputability claim.

What is true and what follows from it:

- The gap is real and data-reachable (O9/PROBE2 closed-green): a repo-local `decision.json` with
  `thresholds.verify = 0` / `direct = 0` passes `loadGateDecision`, `decide({})` returns
  `Direct | composite 0.00 ≥ direct threshold 0.00`, and a failure record — whose mode is
  hard-coded `Deliberate` — then re-derives as `Direct`. The ledger advertises offline
  re-derivability; under that policy it is false.
- But the defect is not "one bad record type". EV-63's delivered invariant says "**a reduced
  mode requires positive evidence, not the absence of a warning**", and the same loader that
  already requires every `weights` entry to be *positive* (`gate.ts`, `w <= 0` → `gateFail`)
  accepts a zero threshold that makes `decide()` return a reduced mode on zero evidence. The
  loader is the thing that is inconsistent, and it is inconsistent with itself.
- Fixing it at the loader is a one-predicate change with a cross-key consequence the loader
  already holds: require `thresholds.verify > 0`, and the existing `verify ≤ direct` rule makes
  `direct > 0` follow. It belongs beside the sibling predicate, in the file that owns policy
  validation, on the surface every consumer of the policy passes through — not copied into one
  call site.
- **Why not (a), the guard in `runGate`'s pre-POST set.** O10 (closed-red on the citation) does
  remove the *gate-parity* objection, and I say so plainly: this seat is not barring the option
  on that ground, and the page's own preference for enforcement "at selection time" was aimed at
  a `.council.json` writer, which `runGate` is not. What kills (a) instead is that it fixes one
  consumer of a shared predicate. `decide()` is reached from EV-69's dispatch-time re-check and
  from offline re-derivation over existing records; a `runGate` guard leaves the invariant false
  on every one of those paths while putting a second, drift-prone home next to the loader's
  existing positivity check. It also adds a new pre-POST throw class to the advisory path, where
  EV-66's acceptance is precisely that the gate interferes with nothing. One predicate, one
  owner, one home.
- **Why not (c), document-only.** The consolidation is right that a data-reachable false promise
  in the record is not a documentation problem. (c) is rejected as an *endpoint*; it is adopted
  only as EV-65's interim posture, described below.

### What this authorizes and blocks for EV-65

**Authorizes:** proceeding to step 7 with the synthesis design as written, plus Q1's v2 record
shape; and the filing of a follow-up card for the loader predicate (goal below), which the run
should carry into step 13 alongside the EV-63 hardening item already promised at run close — the
two are one card, since both are `loadGateDecision` accepting a policy that contradicts EV-63's
invariants (`thresholds.verify ≤ 0`; un-cross-checked `floors`/`thresholds` sub-keys and
`override.question` ids; the newline-bearing override id that yields a multi-line `basis`).

**Blocks:** adding a verify guard to `runGate` (it would be deleted by the follow-up, and in the
meantime it is an untested second predicate); editing `gate.ts` in this PR; and any spec or doc
claim that a *failure* record re-derives to `Deliberate` from the line alone **for every
loader-legal policy**.

**Interim wording, binding on the spec (this is the honest form of the deferral):** the failed
call's re-derivation property holds for the packaged policy and for any policy with
`thresholds.verify > 0` — the test asserts it against the packaged `decision.json` (O15:
`composite 0.00 < verify threshold 2.60`), and the module docs must state the precondition
rather than advertise unconditional recomputability. A `verify: 0` repo-local policy is the one
shape where the record's mode and its re-derivation can disagree, and EV-65's tests must not
construct one and then call the result a property.

### Reversibility

The follow-up is a one-predicate edit in `loadGateDecision` plus fixtures — if the positivity
requirement turns out to be wrong, relaxing it is a deletion, and (per R3's `mode: "off"` and the
absence of any repo-local `decision.json` in the scaffold) the population it breaks today is
empty. If instead EV-65 had shipped (a) and the loader fix never arrived, the epic would carry a
permanent two-home predicate. Deferring the *fix* to its proper owner is the reversible move;
taking the cheap local guard is the one that calcifies.

**This is not an escalation.** Nothing is declined, no residual is accepted permanently (the
Q2 gap is accepted *provisionally, with a named card to close it*), no recorded human decision is
touched, and no card's `goal` is defective. Q1 changes how a card stores its facts, not what the
portfolio is building.
