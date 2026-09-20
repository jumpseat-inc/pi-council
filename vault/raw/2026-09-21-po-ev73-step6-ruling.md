# PO ruling — EV-73: where the migration copy lives, and what "any basis-affecting string" scopes

**Seat:** product-owner. **Date:** 2026-09-21. **Run:** `/features-deliver EPIC-14`, card EV-73 (1/5).
**Referred from:** the step-5 consolidation's open-judgment items **(a)** (specialized
mode-migration `FAIL:` copy placement) and **(b)** (class-4 scope reading, plus the
`weights`-keys sub-question), routed at step 6 after the skeptic's O1 closed **red** and O3
closed **green**. **Card state at ruling:** `Deliberating`, `owner: null`, no judge has read the
goal — so a `goal` amendment is legal here (`[[engineering-board]]`, FLLWUP-51: immutable only
once `In Progress`; `goal:` stays last in the frontmatter and stays one physical line).
**Branch record read:** `feat/ev-73-gate-config`, `council/cards/EV-73.md` (commit `4e9eb57`),
`council/cards/EV-75.md`, `council/cards/EPIC-14.md`, `council/cards/FLLWUP-71.md`.

The question I held over both items: **does this serve the person who has to fix a failing gate
read, or does it serve the tidiness of the card that noticed it?** For (a) the person is the
operator who reads a `FAIL:` on `policy.json` and decides what to delete; for (b) the person is
the one who reads a `FAIL:` whose stated reason is not the mechanism their data actually hit.
Both readings, not both seats' preferences, decide the items.

---

## Item (a) — the enriched migration `FAIL:` ships on **EV-75**, not EV-73 — Ruling

**EV-73 removes `mode` from `policy.json`'s accepted keys and lets the existing generic
unknown-key `FAIL:` fire, verbatim, with no specialization for `mode`.** The one-key
specialization is EV-75's deliverable, exactly as its goal already reads. The owner's proposed
bytes are adopted **as EV-75's candidate copy** and recorded on EV-75's face at step 13, under
R5's wording constraint (names the file, the key, and the `.council.json` `gate.mode`
replacement; says "gate", never "jev"):

```
FAIL: <file> has an invalid mode — unknown key; gate enablement moved to gate.mode in <repoRoot>/.council.json — remove this key and set gate.mode there
```

Three things bind this.

1. **The fold-in test fails.** A work item folds into a live card iff it is needed to honestly
   meet that card's goal *as written*. EV-73's goal asks that `mode` be "removed from
   policy.json's accepted keys so an existing policy.json carrying it fails loud." It names the
   mechanism and the loudness, never the copy. EV-75's goal names **the copy itself** — "FAILs
   loud naming that file, the key, and its .council.json gate.mode replacement." The enriched
   line is therefore not needed for EV-73 and is *exactly* what EV-75 exists to build.
2. **Shipping it in EV-73 makes EV-75 untestable as written.** EV-75's falsifier is "a
   `mode`-bearing `policy.json` produces the named `FAIL:`" versus "a tuning-only `policy.json`
   resolves unchanged." If EV-73 already emits the `.council.json gate.mode` pointer, EV-75's
   loud-migration assertion passes vacuously on code it did not write — the card would be
   ratified by an acceptance test that cannot fail. The chain exists so that each card's goal is
   the thing its judge reads; a judge cannot distinguish "built" from "already there," and neither
   can the record afterwards.
3. **The two binding rulings do not conflict once each is read at its own scope.** EPIC-14 **R5**
   constrains *the legacy-policy `FAIL:` artifact* — the file, key, and replacement must be named
   by the line that runs in the shipped product — and says so at the level of vocabulary,
   delegating the literal ("Exact literal wording is the seat's within these constraints"). The
   wave-3 ruling (job-33) constrains *this card's mechanism*: "the existing unknown-key `FAIL:` is
   the migration signal." Both are satisfied by EV-73 shipping the generic line and EV-75
   replacing it, in a run whose scope R3 already fixed at all five cards in the order
   EV-73 → EV-75. R5 is a run-exit condition; it is not a demand that the first card to touch the
   string carry the last card's prose. Nothing here overturns a recorded human decision.

### The gulf is real; the exposure is not what the designer's case assumed

The designer's P2 critique holds on its merits: obeying the generic tail loses enablement, and
"set a valid value" has no referent for a key the file no longer accepts. Two facts bound the
cost of leaving it for the next card in the same run.

- **Nothing about the failure is silent.** O3 closed green and the skeptic quoted the line
  verbatim (probe P10b): every gate read throws until the key is gone, on the off path included.
  The operator cannot be quietly de-enabled; they can only be loudly mis-advised. EV-73 closes
  the silent-opt-in gulf (the pre-EV-73 failure mode, where a stale `mode` still resolved
  enablement no one had chosen); EV-75 closes the remedy gap. That is the split the two goals
  describe, and it is the right one.
- **The affected population is currently zero, in this repo's own evidence.** The only
  `council/gate/*.json` files on disk are the three packaged ones
  (`council/gate/{policy,questions,decision}.json`); there is no repo-local
  `$CONFIG_DIR_NAME/council/gate/policy.json` here, and this repo's committed `.council.json`
  carries no `gate` section (it resolves byte-identically to `off` before and after this card —
  O4). The "upgrade-day operator with `mode: "advisory"`" is a *future* consumer of a surface
  that shipped at v0.28.0 (`[[metered-deliberation-routing]]`, `[[2026-09-21-epic13-run-ledger]]`).
  The window during which the misleading tail is the only line available is the gap between two
  adjacent cards in one authorized run.

### Where I agree with the owner against the boundary reading

The owner was right that this is a *copy* defect, not a mechanism defect, and that ruling 3
binds the mechanism rather than the tail bytes. That is precisely why it can move. What the owner
was not right about is which card pays for it: the card that names the copy in its goal does.

**Precedent, and it is this seat's own:** EV-71's step-6 ruling — "P4 and P7 are follow-up cards,
not fold-ins. The card's literal is fixed by the goal; the judge reads the goal." Same shape here:
the literal is fixed by *another* card's goal. EV-7's OV-2 split a one-line fix out of a live card
for the same reason.

---

## Item (b) — class 4 scopes to `decision.json`'s three override strings; `weights` keys are dropped — Ruling

**Position 1, with a goal amendment.** Refusal class 4 is a `loadGateDecision` refusal on the
strings in `decision.json` that `decide()` interpolates into a basis line —
`overrides[i].question`, `overrides[i].option`, `overrides[i].basis` — each a single-line
`FAIL:` naming file and key, refusing the input rather than sanitizing it (the designer's pinned
bytes stand). It is **not** a system-wide property of every string that can reach a basis, and it
does not reach `questions.json` or `loadGateQuestions`. The `questions.json` newline-id surface
becomes a follow-up card (see feed below). `weights` keys are **dropped from class 4 entirely** —
not kept defensively, not deferred inside this card.

### Why Position 2 is not the card's reading

- **The goal's own subject forbids it.** The clause is "loadGateDecision refuses … thresholds.verify 0,
  an unknown floors/thresholds sub-key, any override.question id absent from weights, and any
  basis-affecting string whose content can render a multi-line basis." Four conjuncts, one verb,
  one subject. `loadGateDecision` reads one file, `decision.json`; it cannot refuse a string that
  lives in `questions.json`, and making it do so would require reading a second file at a loader
  the four ruled classes never named.
- **The card's own Acceptance already resolves the ambiguity, against the literal reading.** The
  bullet reads: "The four refusal classes each throw one line naming file+key — **including the
  newline-bearing override id** (the restored FLLWUP-74 class)." The author's example of the
  newline case is an *override* field. The system-wide reading is built on one goal clause that
  the same card's Acceptance sentence reads narrowly; where a card's two halves disagree, the
  half that names a concrete artifact wins.
- **Position 2 needs a goal change, which is by definition not a fold-in** — it builds a fifth
  validation class in a second loader named by no card in the chain. Had I chosen it, this would
  have been a steward escalation on the portfolio (a fifth card's worth of work under four cards'
  goals). I did not choose it, so it is not.

### Why `weights` keys come out rather than staying as cheap insurance

O1 closed red on the inclusive rationale, and the code confirms the falsification directly:
`decide()`'s composite loop uses `policy.weights[id]` only as a numeric multiplier
(`extensions/gate.ts:563–566`); the ids that render into basis come from `rule.question`,
`rule.option`, `rule.basis` (`:525`) and from **answer keys** (`:544`, `:554`) — which originate
in `questions.json` and pass `runGate`'s `knownIds` filter (`extensions/gate-run.ts:249–255`).
`mechanical.<id>` values and `noulProbabilityOf` are compared (`:471`, `:481–489`), never
interpolated. So the full set of `decision.json` strings that can render a basis line is exactly
the three override fields.

Beyond the falsified mechanism, keeping the check would make the copy lie. The refusal reads
"*value contains a line break; basis lines must be single-line*". Fired on a `weights` key, that
sentence asserts a mechanism that does not exist — an operator who obeys it learns nothing true
about why their file was rejected, and the loader's field set stops matching the renderer's field
set, which is the anti-drift property the principal put the validator beside `decide()` for.

And the *actual* defect a newline-bearing `weights` key represents is already on the safe side by
the gate's own design: such a key matches no question id, so its weight is never earned and the
composite "drags toward Deliberate, the safe side, never toward a cheaper mode"
(`extensions/gate.ts:503–506`, and the page's stated asymmetry in
`[[metered-deliberation-routing]]`). A refusal that protects nothing, in copy that misstates the
reason, is not cheap — it costs the loader's credibility.

### The goal amendment (removes a demand, adds nothing to build)

The judge reads the goal, and the skeptic recorded that clause as reaching `questions.json`. So
the ambiguity is removed rather than left for implementation to settle incidentally — the same
disposition EV-71 J1 took. Substitute, inside the existing single-line `goal:`:

```
from: ... and any basis-affecting string whose content can render a multi-line basis, each with a single-line FAIL: naming the file and key.
to:   ... and any decision.json string that decide() interpolates into a basis line — overrides[i].question, overrides[i].option, overrides[i].basis — whose content can render a multi-line basis, each with a single-line FAIL: naming the file and key.
```

The amendment **narrows** what EV-73 must build (three fields, one loader) and adds no new
surface. It is recorded on EV-73's face in the same commit as this ruling's other card-face
edits, and `python3 council/validate.py` must run clean on it. The goal stays one physical line
with `goal:` last in the frontmatter.

### Not in dispute, restated so it is not re-litigated

The packaged `council/gate/policy.json` drops its `mode` key in this card (job-33, already
applied by the runner — not re-ruled). Classes 1–3 stand as designed. `loadGateConfig` remains
the one resolver of enablement, `GatePolicy.mode` the one resolved field, lazy-at-call, and the
single-resolution-site canary is this card's.

---

## The step-13 follow-up feed, as ratified by this ruling

1. **`gate-state.ts` lenient-reader hygiene** — ratified as filed. O5/S8 put it past every
   reachable path; it is hygiene, not a gate.
2. **Gate identifier strings: one card, not two.** Merge the synthesis's item (2) (cross-file
   invariant: `overrides[].question` and `weights`/`mechanical` ids must exist in
   `questions.json`; a `noul` override option must name a criterion key) with item (4)
   (`questions.json` newline-bearing ids). They are the same concept — *an identifier the
   pipeline cannot use, caught where identifiers are authored* — and they share a file pair, so a
   card that checks one without the other cannot say which ids it is protecting. Goal sketch for
   the runner to draft against: *"Every gate question id is single-line and cross-referenced:
   `loadGateQuestions` refuses a question id containing a line break, `loadGateDecision` refuses
   any `overrides[].question` or `weights`/`mechanical` id absent from `questions.json` and a
   `noul` override option that names no criterion key, each with a single-line `FAIL:` naming both
   file and id, and a rule that can never fire is refused."*
   **Sequencing condition:** this card is the natural prerequisite for **FLLWUP-71**, which adds
   the fifth question (`userVisibility`) to `questions.json` *and* its matching override to
   `decision.json` — precisely the change where a mistyped id yields an override that can never
   fire, silently. File it under `epic: EPIC-13` alongside FLLWUP-71 and name that pairing in its
   Intent.
3. **Wiki sweep split** (EV-73 minimal / EV-77 full) — ratified as converged; the
   `metered-deliberation-routing.md` "policy.json carries `mode`" bullet is EV-73's minimal
   correction, and EV-77 owns the rewrite.

**No new card is filed for the migration copy** — it is EV-75, already on the board, already
`Backlog`, already next in R3's order.

---

## Reversibility

- **(a)** Cheap. If EV-75's deliberation or a real consumer shows the generic window costing more
  than measured here, the specialization is one string in one unknown-key branch of
  `loadGatePolicy`; EV-75 ships it in its normal pass, and nothing in EV-73 has to be undone.
  Reversing the other direction — pulling the copy out of EV-75 and into EV-73 later — would
  require re-opening a merged card's scope and hollowing EV-75's record, which is why it is the
  direction I did not take.
- **(b)** Cheap. The goal amendment removes a demand rather than a capability, and the class-4
  check is additive: `loadGateDecision` keeps its single-line `gateFail` machinery and the
  dotted-path key form, so extending the refused set to `weights` keys later is one loop and one
  test — filed as a card against the follow-up above, not as a re-open of EV-73. If a future card
  makes `decision.json` strings render into basis anywhere the three-field set misses, that is
  the falsifier for re-opening this item, and it would be a `[[gate-parity]]`-style argument that
  validator and renderer refuse the same field set.
