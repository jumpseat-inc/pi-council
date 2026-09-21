---
title: PO ruling — EV-78 wave-3: the followup decision.json `thresholds` schema shape (and the O3 override-vocabulary question)
type: source
summary: product-owner's ruling on the one open-judgment item of EV-78 — `thresholds` is the named-key object `{merge, drop}` (finite merge > 0, strict merge < drop, array-valued `thresholds` fails loud), rejecting the ordered `{at, disposition}` band array; and the skeptic's O3 is decided with it — an override rule's `disposition` is restricted to `{Merge, Drop}`, so a `File` override fails loud naming `overrides.<i>.disposition` with an expected-list that omits the token `File`.
aliases: [po-ev78-thresholds-ruling, ev78 schema ruling, followup thresholds shape]
tags: [pi-council/ruling, pi-council/epic10, pi-council/product-owner]
sources: []
created: 2026-09-21
updated: 2026-09-21
---

# PO ruling — EV-78 wave-3: `thresholds` shape, and O3

**Run:** `/features-deliver` over EPIC-10, card EV-78 (`Deliberate`), step-6
escalation of the consolidator's single open-judgment item. **Seat:**
`product-owner`, ruling-only. **Inputs ruled on:** `council/cards/EV-78.md`
(deliberation rounds 1–3, skeptic step 4, consolidator step 5), `council/cards/EPIC-10.md`,
the intake ruling `vault/raw/2026-09-21-po-epic10-recut-ruling.md` (R1, R2, R4,
"Named, not carded" item 1), the shipped precedent
(`council/gate/decision.json`, `loadGateDecision` in `extensions/gate.ts`),
`vault/wiki/metered-deliberation-routing.md`, `vault/wiki/index.md`.
`vault/wiki/followup-merge-and-auto-ingest.md` is the pre-re-cut record and
does not speak to schema.

## Q1 — `thresholds`: ruled, the named-key object

```json
"thresholds": { "merge": 1.0, "drop": 2.0 }
```

Loader rules, mirroring the shipped gate's `thresholds` parse
(`extensions/gate.ts:478–503`) arm for arm:

1. `thresholds` must be a JSON object; **an array value fails loud** as the
   shape FAIL naming `thresholds` (the `Array.isArray` guard is kept — the JS
   `typeof` trap the shipped loader already handles).
2. Any sub-key other than `merge`/`drop` → FAIL naming `thresholds.<key>`,
   expected-list exactly `merge, drop`.
3. `merge` — finite number **> 0** → else FAIL naming `thresholds.merge`
   (the FLLWUP-74 class-1 mirror of `gate.ts:466–473`; `File` unproducible via
   `at: 0` is the array's dead corner, and this is the object's structurally
   enforced answer to it).
4. `drop` — finite number ≥ 0 (mirror of the shipped `direct`) → else FAIL
   naming `thresholds.drop`.
5. **Strict `merge < drop`** → else FAIL naming `thresholds` (one numeral
   tighter than the shipped `verify ≤ direct`, because here equality empties
   the `Merge` band — a load-legal two-way partition in a three-way goal).

Under these, the goal's clause — *"thresholds partition a candidate into
exactly one of `File`, `Merge`, or `Drop`"* — is a structural property of
load-legality: File = composite `< merge` (non-empty since `merge > 0`),
Merge = `[merge, drop)` (non-empty since strict `<`), Drop = `≥ drop`.
EV-78's loader proves the structure; EV-79 keeps the behavioral exactly-one
proof (settled point 4 — unchanged).

### Why (mechanism and user value)

The skeptic's closed-red enumeration is accepted as fact: the two shapes are
observationally distinct — 710/780 arrays legal under the owner's stated rules
induce partitions no `{merge, drop}` object realizes, including the
inverted-valence walk (`Drop` below, `Merge` above), a declared `File` band,
and a structurally-dead `Drop`. That settles the *factual* question; the
judgment question the consolidator routed is whether that expressiveness is a
feature. It is a hazard, for three grounded reasons:

- **The domain's safety story is the monotone walk up from `File`.** The epic
  Intent is explicit: the safe side is the human, and no failed or unresolved
  decision may ever `Drop` or auto-`Merge`. A schema whose legal data can make
  the destructive arms unproducible, or make a candidate walk *upward* from
  `Drop` to `Merge` as redundancy rises, converts the epic's central opinion
  into a validation-side-effect. Fail-safe means unrepresentable, not refused.
- **The array's openness serves the one future R2 already excluded.** The
  vocabulary is exactly `File | Merge | Drop` (intake ruling R2, binding).
  With three values and File reserved as the else-arm, the declarable band
  count is two — the key set isn't "frozen at two" by the object, it *is* two
  by the ruling that settled the vocabulary. A genuine future refinement
  (a third band, a hard-File arm) is a schema-version change under the policy's
  `version` key and arrives as its own card — the same home the intake assigned
  the first threshold move ("Named, not carded" item 1: *that move's card*).
  "Data, not schema" was never on offer inside a loader that fails loud on
  unknown sub-keys.
- **True parity with the shipped gate has user value; novel ceremony doesn't.**
  The skeptic closed-green: the shipped precedent for a two-bound monotone
  partition is a named-key object with named FAIL subjects and an explicit
  `verify: 0` refusal. R1 ruled one `gate.mode` governing both decision
  domains because the human asked for *the same* decision making; an override
  author reading the two `decision.json` files should meet one shape grammar.
  The owner's own point-B concession — "false symmetry is worse than none" —
  cuts the same way here in reverse: this symmetry is real, so the object is
  worth more than a second, differently-shaped grammar for the identical
  semantic. The owner's equal-thresholds argument against the object was
  already conceded by both sides to be cured by strict `<` (skeptic: closed-green,
  not a differentiator). The `thresholds[i].disposition` subject argument
  collapses with it: the acceptance's "unproducible disposition" arm is served
  by the named-subject lines 3–5 exactly as the shipped gate serves its own.

### What this pins for the loader test (skeptic O1/O2 → owner's obligations)

- The three array-valued exhibits from the enumeration —
  `[{"at":1.0,"disposition":"Drop"},{"at":2.0,"disposition":"Merge"}]`,
  `[{"at":1.0,"disposition":"Merge"},{"at":2.0,"disposition":"File"}]`,
  `[{"at":1.0,"disposition":"Merge"}]` — plus the owner's schema-sketch array
  itself are each pinned as **load-FAILing** with the array-shape-rejection
  line naming `thresholds`, bytes pinned. O1 is thus answered *through* the
  adjudication: the shapes are distinct, and the distinctness is the reason the
  object ships.
- `thresholds.merge: 0` FAILs naming `thresholds.merge` (O2's dead-corner class
  is structural; the mirror of `gate.ts:466–473` is pinned by test).
- The strict-ordering FAIL bytes name `thresholds` with both numerals in the
  message (mirror of `gate.ts:500`, `<` not `≤`).
- O4 (`countedOption` referential bytes) and O5 (`score` refusal lists exactly
  `"choice", "noul"`) are unchanged by this ruling.

**Named residual this ruling does not fix** (consistent with the shipped
precedent, recorded so it isn't mistaken for coverage): a `drop` above the
maximum attainable composite makes `Drop` unproducible and neither the object
nor the shipped gate bounds thresholds against `sum(weights)`. Home: the first
threshold-move card, alongside the pre-registration gap the intake already
named.

## Q2 (skeptic O3) — override `disposition`: ruled, restricted to `{Merge, Drop}`

An override rule's `disposition` must be `Merge` or `Drop`; `"File"` fails loud
naming `overrides.<i>.disposition` with the expected-list naming exactly
`"Merge", "Drop"` — the token `File` absent from the list, per the same
expected-list discipline O5 set for the `score` refusal.

- **File already has its mechanisms, both outside the override lane.** Per
  intake R4, floors run before overrides and below-floor/unanswered answers
  return `File`; the composite's below-`merge` arm returns `File` otherwise.
  R4 gave overrides precedence *over the composite* solely so a confident,
  structurally-certain answer can force a destructive disposition that floors
  gate; nothing in the follow-up design needs a hard route *into* the safe arm,
  and giving it one would make `File` a declared policy target rather than the
  residue when nothing has argued otherwise — inconsistent with the primary
  ruling's own principle.
- **Shipped override semantics point the same way.** In the card gate every
  override resolves to `Deliberate` — the safe arm is what overrides carry the
  policy *to* when the composite would otherwise reduce scrutiny. Here the
  safe arm is the default direction, so the override mechanism's content is
  exactly the other two dispositions.
- **The reversible direction is restrict-now.** Widening a refused vocabulary
  later is a predicate change plus a semantics note (what used to fail loud
  becomes legal; no legal file breaks). Allowing now and restricting later
  breaks any repo that wrote a `File` override. A semantics never designed in
  three rounds is not worth shipping open when closing it later is the only
  direction that can't strand a consumer.
- If EV-79 or later surfaces a genuinely needful hard-File question, it is a
  new rule with documented semantics arriving as its own card — same home logic
  as the band-count refinement above.

`FOLLOWUP_DISPOSITIONS = ["File","Merge","Drop"]` (settled point 1, R2) is
unchanged: it is the *output* vocabulary (EV-82 renders it); the override
field is validated against a declared subset, mirroring how the followup
question validator parameterizes `allowedTypes` inside `validateGateQuestion`
(settled point 5) rather than forking it.

## Binding

- EV-78's goal is **not** amended — the object satisfies "thresholds partition
  a candidate into exactly one of File, Merge, Drop" as written; this was
  a shape dispute inside the goal, not a goal defect, so no escalation applies
  and no recorded human decision is touched (R2 and R4 are load-bearing
  *for* the ruling, not against it).
- The owner retains the how: helper placement, exact FAIL byte wording outside
  the arms pinned above, and fixture layout remain the owner's.

## Related

- `council/cards/EV-78.md`, `council/cards/EPIC-10.md`
- `vault/raw/2026-09-21-po-epic10-recut-ruling.md` — R1, R2, R4, "Named, not carded" 1
- `council/gate/decision.json` + `extensions/gate.ts` — the shipped precedent mirrored
- `vault/wiki/metered-deliberation-routing.md` — thresholds live in the versioned decision record
