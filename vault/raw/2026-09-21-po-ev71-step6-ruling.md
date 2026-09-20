# PO ruling — EV-71: the `costBasis` clause, and what "grammar unchanged" scopes

**Seat:** product-owner. **Date:** 2026-09-21. **Run:** `/features-deliver EPIC-13`, card EV-71.
**Referred from:** the consolidator's synthesis, "Open judgment" items **J1** and **J2**, after 3
rounds + a second skeptic pass + consolidation, with J3 and O-C carried as resolved-but-open notes
and O-A closed-green. **Card state at ruling:** `Deliberating` on `feat/ev-71-gate-spend`,
`owner: null`, no judge has read the goal — so a `goal` amendment is legal here
(`[[engineering-board]]`, FLLWUP-51: immutable only once `In Progress`; `goal:` stays last in the
frontmatter and must stay one physical line or `validate.py` FAILs).

The question I held over both items: **does this serve the person who reads the ledger line and the
person who reads the usage block, or does it serve the card's tidiness?** For J1 the reader is an
auditor deciding whether a dollar figure is the provider's or pi's arithmetic. For J2 the reader is
a person looking at a block that says "nothing was recorded" at a moment when the gate did spend
tokens. Both readings, not both seats' preferences, decide the items.

---

## J1 — `costBasis` on the v2 call line — Ruling

**No field. The reported basis is structural, and the goal sentence is amended so the judge is not
left holding the ambiguity.** Three binding parts.

1. **`gate-ledger.ts` is not touched.** `appendGateCall` stays the sole writer of the v2 call line
   (skeptic: exactly 2 callers, both in `gate-run.ts`) and computes nothing: the response's
   `usage.cost` is stored as it arrived. No `costBasis` key, no schema bump, no v2→v3, no
   reader-tolerance clause for a key that never exists. The EV-65 Q1 binding key set
   (`basis · model · provider · usage{input_tokens,output_tokens,cost} · generationId ·
   failure{class} · drops · advisory · unknownAnswerIds`) stands unchanged, and **EV-71 adds no key
   to it**: that set was authored with a named consumer per field (EV-66 → `advisory`, EV-67 →
   `basis`, EV-64's deferral → `drops`, EV-71 → `usage` + `generationId`), and this seat adopts the
   same discipline as a standing rule — **a field on the durable line needs a named consumer, not a
   named sentence.**
2. **The basis claim is enforced by three assertions on ONE artifact** — the raw line the writer
   emits — which is the checkable object the principal was right to demand:
   - **T-B (round-trip).** `appendGateCall` with `usage.cost = 0.0042` → `readGateLedger` yields
     `0.0042` exactly; no Σ, no scaling, no rounding, no reformatting at write.
   - **T-C (single cost field).** the emitted line contains **no cost-bearing key other than
     `usage.cost`** — asserted against one serialized line, not as a grep across `extensions/`. This
     is what "journalled with costBasis reported" turns out to mean operationally, and it is
     *positive* evidence about bytes rather than a negative across a codebase.
   - **T-D (source reachability).** no catalogue-cost path is reachable from the gate reconciliation
     (owner C5), which is the clause the goal already carries as its own last conjunct.
   All three names, or their assertion titles, must appear in the skeptic's step-9 evidence packet,
   so the judge meets them as evidence rather than inferring them.
3. **The goal line is amended** (exact text below), in the same commit as this ruling's other
   card-face edits, and `python3 council/validate.py` runs clean on it.

```
goal: Gate spend is journalled by the ledger's single writer storing the decisions response's usage.cost figure verbatim, with no synthesised and no second cost field on the emitted call line, and journalled with the decision generation id that response reported, and the provider reconciliation accounts for gate spend by accepting decision generation ids sourced from the gate ledger, proven by an injected-fetch-double test in which a ledger-sourced generation id beginning gen-dec- is looked up and its reported total_cost resolves into the gate total while a seat transcript that carries no decision generation id triggers no decision lookup and no gate call's cost is ever derived from a catalogue estimate.
```

One physical line, `goal:` last in the frontmatter. The edit **removes a demand and adds nothing to
build**: purpose, mechanism and evidence plan are the card's own, unchanged.

### Grounding

- **`vault/raw/2026-09-20-po-ev65-step6-ruling.md` Q1** — this seat already fixed the v2 call-line
  key set field by field, on the reasoning that each named field is consumed by a named card, and
  it wrote EV-71 into that ruling as a **reader** of `usage` + `generationId`. The field list is the
  most recent settled thing about this record's shape, and `costBasis` is not in it.
- **`vault/wiki/cost-provenance.md`** — `costBasis: "catalogue-estimate"` labels *pi's own
  computation* (`calculateCost` over the static catalogue); `(reported)` labels the provider's
  figure. The label is an honesty mechanism because it is **set where the value is produced**, and
  its truth-condition is the derivation site. A constant literal emitted by a writer that has only
  one derivation site is decoupled from any derivation — it cannot be wrong, so it cannot be
  evidence. And it can *become* wrong in the only way that matters: if a non-reported figure ever
  reached `usage.cost`, the line would still read `costBasis: "reported"` and the ledger would then
  contain a false provenance label where today it contains a number whose source is the only one
  that exists. Absence is silent; presence is authoritative. **EV-71's own Intent names that shape**:
  "plausible-but-false assertion", "the same class of… " — and the class is exactly why
  `[[2026-09-11-epic7-run-ledger]]`'s standing learning ("provenance labels are the honesty
  mechanism") cannot be transplanted here: that learning is about labels that *vary with their
  source* (`hub.ts` sets `catalogue-estimate` where pi-ai computed it; a reported half sets
  `reported` where the provider figure landed).
- **`vault/wiki/usage-block.md` + `spend-record`** — in the usage tuple the label earns its place
  because one shape carries both bases. The converged gate design already carries a discriminator
  that *does* discriminate (`source: "gate"`, skeptic O13), and the ledger-vs-lookup Σ are kept as
  **distinct observable fields** (settled item 4) — verification that can disagree. Neither is a
  constant.
- **Skeptic O7 (closed-green)** — the current writer emits no `costBasis` key and verbatim storage
  holds by construction. Read correctly: that is evidence that the *property* exists, not evidence
  about which reading the goal intended. The principal's T7 is red at base for the same reason a
  test for a field nobody needs is red at base.
- **`vault/raw/2026-09-21-po-ev69-step6-ruling.md` Item C** — the house answer to "the goal phrase
  can be read two ways and the judge reads it alone": **fix the card, don't widen the judge's
  input** (`council.md` step 10), and never satisfy an ambiguous phrase by shipping an artifact whose
  only consumer is the sentence. I adopt the principal's premise in full — the goal *is* the judge's
  contract — and that is precisely why the sentence, not the record shape, is what I change.
- **`vault/wiki/judge.md`** — "no partial credit"; a required observable that is missing or
  unverifiable is a REJECT. Under the owner's no-field stance *with the sentence left as written*,
  the card ships into exactly the EV-29-in-miniature shape Item C named: satisfiable only by a
  reinterpretation the judge is not given. That is the defect in this dispute, and it is a wording
  defect, not a schema one.

### Options rejected

- **ADD `costBasis: "reported"`, additive-in-v2 (principal r3).** It loses on mechanism: an
  unconditionally-emitted constant proves nothing, is read by nothing, and is the one artifact here
  that can become a false statement without any change to the number beside it. Its cost is not the
  field but what it makes normal — a second, non-discriminating provenance key whose absence on
  pre-existing lines then has to be tolerated forever by readers of a value that never needed
  interpreting. It also amends a shape this seat settled three cards ago, for a reason that card
  explicitly declined to name a consumer for. **What I take from it instead: judge-checkability is
  non-negotiable** — that is the whole of part 3 and the T-B/T-C/T-D pin.
- **Satisfy the phrase with a test *name* or a spec paragraph while leaving the goal alone.** The
  forbidden move: spec-only context is context the judge is not given. Rejected as gaming the judge.
- **Split it** — field on new writes only, or `costBasis` on the gate *sibling* rather than the
  ledger line. Rejected because both put a constant somewhere a reader must then interpret, which is
  the defect relocated rather than resolved; and my seat may not half-settle an open-judgment item.
- **Escalate the phrase to `steward`.** Rejected: the card's purpose, mechanism and value are all
  deliverable as built; only the sentence's reach needs pinning, which is this seat's standing
  disposition (EV-69 Item C's authority analysis; EPIC-5/EPIC-9 wave-3 amendments). Had the reported
  figure itself been unavailable — no provider cost on the response — that would be an
  existence-defect escalation and I would have routed it, as EV-29's was.

### When a basis field *does* become required (stated so the next card doesn't re-litigate)

The trigger is **a second cost source reaching `usage.cost`** — a catalogue-derived or in-house
estimated figure journalled on a gate line. At that point a basis key is required and its value must
be written *from the derivation site* (the writer states which function produced the number), never
as a literal. Until that exists, the honest carrier of "reported" is the single-writer property plus
T-B/T-C/T-D.

---

## J2 — Whole-block states carrying the gate legend — Ruling

**Pinned (framing B), as a reading of R-6 rather than an amendment to it.** The relaxation is
granted for `no usage recorded` and `accounting boundary unresolved`; denied for `accounting failed`.
The behavior is what all three seats converged on, and I am *not* changing it — what I am settling is
which word the acceptance's "grammar" claim scopes to, because that claim is read by a judge who gets
nothing else, and because the block is a shared surface at five exits.

### Binding per-state table

| Whole-block state | 0 gate calls in window | ≥1 gate call in window |
|---|---|---|
| `usage  no usage recorded` | one line (existing golden) | **state line + `usage  gate = excluded from this total`** |
| `usage  accounting boundary unresolved` | one line | **state line + gate legend** |
| `usage  accounting failed — <reason>` | one line | **one line — chosen, not forced** |

### Exact grammar-scoping wording (for the Acceptance and the goldens' header)

> **"The block's grammar is unchanged" means row grammar and state exclusivity, not line count.** A
> render is grammar-preserving iff, for every input: **(1)** every emitted line is either one of the
> three bound whole-block state lines (or the `usage  accounting failed — <reason>` prefix line) or a
> row carrying the literal `usage  ` prefix; **(2)** every row keeps its ruled key and
> `key = short definition` shape, with the label column unpadded and unfixed as ruled; **(3)** row
> order is the ruled order and each conditional legend keeps its slot, the stack reading
> `reported → partial → n/a → gate` with `gate` last; **(4)** at most one whole-block state line
> appears, never two, precedence `failed > unresolved > empty` unchanged, and the state line is
> always the block's **first** line; **(5)** with zero gate calls in window the block is
> byte-identical to the pre-EV-71 render.
>
> **The relaxation, stated as a rule:** a whole-block state may be followed by conditional **legend**
> rows, and only by legend rows, when a card's own acceptance makes that legend's presence an *iff*
> over the invocation and suppressing it in that state would assert that nothing was recorded when
> something was. Measurement rows, the boundary row and the reported row **never** appear in a
> whole-block state: the state line still replaces the block's content, and a legend only qualifies
> its silence. This is R-6 as ruled in EPIC-7 — "grammar identity, not line-count" — applied, not
> amended; no state's wording, identity or precedence changes.
>
> **This is not a general license to make a state multi-line.** A future card must show the same
> shape (a card-level iff the single-line state would violate), and every relaxed or denied state must
> be named in its own golden with a `// Decision:` comment.

### Binding Acceptance clarification (amendable surface)

The clause "present iff at least one gate call falls in the window" scopes to blocks rendered
**from a persisted record**. The `{ failed: string }` input is a named, chosen exception: no record
exists in that state, so a legend emitted there would be a row the disk cannot show and would break
the block's shown-equals-disk invariant (owner INV-3). The golden's `// Decision:` comment must read
**"chosen: no persisted record to render from"**, never "impossible" — skeptic O10 closed-red on the
impossibility wording, because the caller composes the text and holds the ledger in scope, so the
second line *is* printable (its probe printed one). Design outcome unchanged; the record of why is
corrected, and the difference matters to exactly the future card whose failure variant gains a
record.

### Why ruled and not left to convergence

- The ambiguity sits on the **judge's only input surface**. "Grammar unchanged" read as line-count is
  a REJECT on the behavior the card's Intent requires — the state where the block's whole content is
  "nothing was recorded" beside a gate call that spent tokens is, in the card's words, "an
  unaccounted call whose cost is neither carried nor named". Convergence does not protect against
  that reading; a scoped sentence does.
- The surface is **shared and future cards land on it**: P4 (count-bearing legend), P7 (key
  vocabulary) and the ledger-affordance follow-up all ask "may a legend live in a whole-block state?"
  Pinning it now is a paragraph of documentation; pinning it later is a re-litigation with shipped
  bytes in the middle.
- Two seats explicitly asked that this not be decided by "whichever implementation detail lands
  first" (principal), and the designer's own words: "load-bearing, not preference."

### Not an escalation

Nothing is declined; no residual is accepted permanently (J3's failed-state posture is a *named,
reversible* choice carried in a golden, and O-A/O9b closed-green on the second skeptic pass, so the
attribution story needs no re-wording); no recorded human decision is touched — **R-6 is the intake's
own "grammar identity, not line-count" ruling, and this applies it**; steward's EPIC-7 rulings (the
third state's *existence*, `boundaryMode: "marker"`) are untouched and no state's literal changes;
and no card's goal is found defective — EV-71's purpose is exactly deliverable.

---

## Fold-ins and out-of-scope (confirmed, not re-opened)

- **Adopted, non-blocking:** O-C — goldens asserting `sumGateSpend` must compare through one float
  path (skeptic O8: `0.0042 − 0.001 = 0.0031999999999999997`), never a hand-written decimal literal.
  This is the card's own how, so it belongs to the owner, but it is a trap the spec must name.
- **Confirmed out of this card as follow-ups:** P4 count-bearing legend, P7 `deliberation =` key
  vocabulary, O3(b) ledger affordance, and the designer's docstring note "**block = exclusion
  surface, ledger = trace surface**" (which lands in this implementation).
- **Confirmed settled, inherited without re-opening:** the top-level `StoredUsageRecord.gate`
  sibling; ledger-Σ authoritative with lookup-Σ a distinct observable; `recordedAt >= markerAt`;
  legend last in the stack; `api_type` inert with the Intent sentence corrected at merge-check;
  runner form untouched; byte-identity of the seat path.

## Execution

The facilitator applies: the amended `goal` line, this ruling appended verbatim to the card's
deliberation record, the Acceptance clarification above, and runs `python3 council/validate.py`
clean — cards and board never land separately. Then step 7, spec handed to the owner. The owner
keeps the how: the legend's implementation branch shape, the gate sibling's field names, and the
test file layout are not settled here.

## Reversibility

- **J1 is the strictly reversible direction, and that is a large part of why I chose it.** If this
  seat is wrong, adding `costBasis: "reported"` later is one line in `appendGateCall` plus a fixture
  — no line written today needs rewriting and no reader learns to interpret an absence. The reverse
  is not true: once real consumer ledgers carry a constant that nothing reads, deleting it is a
  data-shape change with an installed base, and the field's mere presence will keep being cited as
  the reason it must stay. The irreversible-looking half — the goal amendment — is why the ruling
  happens now: it is free while `Deliberating` and becomes a new card at `In Progress`.
- **J2 is documentation plus one golden's expected string.** If the multi-line state turns out wrong,
  the fix is deleting the legend branch in two states and the block is single-line again — and the
  deletion **fails the card's own red-at-base falsifier** (G6/T3/C4) loudly, which is the signal that
  the intent is then violated. If instead the *scoping* of "grammar" turns out wrong, nothing in the
  code moves: the sentence is re-scoped by a later ruling, and the five preserved conditions (1)–(5)
  are each independently checkable, so a wrong reading shows up as a failing golden rather than as
  shipped drift.

## Sources used

- `council/cards/EV-71.md` (worktree record: rounds 1–3, skeptic O1–O14 + the O9b follow-up,
  consolidation J1–J3/O-A/O-C), `council/cards/EV-65.md` (Intent + Q1 history), `council/cards/EPIC-13.md`
- `extensions/gate-ledger.ts` (v2 call-line header, `GateUsage`, `appendGateCall`), `extensions/usage-block.ts`
  (`:101-130` three states returned before any conditional row, legend stack), `extensions/spend.ts`,
  `extensions/runs.ts` (`costBasis` as a set-at-derivation-site label)
- `vault/wiki/cost-provenance.md`, `vault/wiki/usage-block.md`, `vault/wiki/spend-record.md`,
  `vault/wiki/metered-deliberation-routing.md`, `vault/wiki/engineering-board.md`, `vault/wiki/judge.md`,
  `vault/wiki/product-owner.md`
- `vault/raw/2026-09-20-po-ev65-step6-ruling.md` (the v2 key set, reader-vs-writer),
  `vault/raw/2026-09-21-po-ev69-step6-ruling.md` (Item C: fix-the-card, don't widen the judge's input;
  the PO-vs-steward goal-line authority test), `vault/raw/2026-09-11-epic7-run-ledger.md` (R-6
  grammar-not-line-count; the provenance-label learning)
