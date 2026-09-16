---
slug: po-ev42-step6
card: EV-42
epic: EPIC-9
seat: product-owner
step: 6
date: 2026-09-17
---

# EV-42 — product-owner step-6 ruling

Card state at ruling: `Deliberating` (goal is **not yet immutable**;
this ruling is on a producer predicate and does not amend the card's
`goal` or `Acceptance`). Head SHA at subject: `5ac8b7760478eaeefd7d4ae86e266c85052d1717`
== `origin/main`. Step-6 escalation facts: P1/P2 converged (pointer-only
`attempts?: {attempt, sessionId}[]`; absent/present-empty grouped as
`unaccounted`); P3 open (the load-bearing split).

## J1 — Figure-scoped partial. **No `partial` on the all-unaccounted retried shape.**

For a retried dispatch where every attempt is unaccounted (new shape,
`attempts` list present, `status:"unavailable"`, `reason:<C3 worst>`,
`totalCost:null`), the persisted provider sibling carries
`status:"unavailable"`, `reason:<C3 worst>`, `totalCost:null`,
**`partial: undefined`**. The block renders the `n/a` legend only — that
*is* the disclosure. The figure's absence is already explicit; an extra
`partial` qualifier that names a property of an absent figure is a
symmetric violation of the wiki's standing-legend principle.

### Exact producer predicate for `partial` on the new shape

```
partial := totalCost !== null && unaccountedAttempts.length > 0
literal := "attempts-unaccounted"   // plural
```

i.e., `partial` is **figure-scoped**: set iff a figure exists AND the walk
left ≥1 attempt unaccounted. The literal is `"attempts-unaccounted"`
(plural, matching the legend's plural phrasing). `unaccountedAttempts:
number[]` is record-only — the audit trail, not the visible qualifier.

### Legacy window shape — carve-out preserved (both sides endorse)

```
attempt > 1 && attempts === undefined  ⇒  partial: "final-attempt-only"
```

`usage-store.ts:443-448`'s status-independent stamp survives **verbatim**
for pre-EV-42 manifests inside the 15-run window after a package upgrade
(owner's round-1 carve-out, principal's round-2 endorsement). The new
shape's predicate is what changes.

### Why figure-scoped

1. **The falsification class EV-39 Q4 named is "looks whole."** EV-39 §Step 6
   Ruling 2 (Escalation 2): *"a stored figure that *looks whole* a month later
   is the falsification"* and *"the final-attempt-only figure must never
   render as *the dispatch's* reported figure unqualified."* An
   `unavailable` record does not look whole — the `n/a` legend is the
   disclosure. The falsification class does not extend to records whose
   figure is explicitly absent. This is the load-bearing distinction:
   "looks whole" ≠ "absent."
2. **The legend's grammar requires a figure to qualify.**
   `extensions/usage-block.ts:32`'s `PARTIAL_LEGEND` is `"usage  partial =
   reported figure …"`. With `totalCost === null`, the legend's clause has
   no referent. The wiki at `vault/wiki/usage-block.md` lines 47–48 binds:
   *"a standing legend on a block with no `n/a` would be the plausible-but-
   false pattern in reverse."* The symmetric principle is the operative
   one: a `partial` legend on a figureless block is equally misleading.
3. **The cause-of-absence already has a channel.** `vault/wiki/cost-
   provenance.md` lines 35–39: *"Unavailability is explicit: record-only
   reasons `no-generation-id | session-missing | fetch-failed:<error> |
   timeout | no-api-key`; the rendered slot is `n/a` with the conditional
   legend `n/a = provider figure unavailable`."* An operator who needs to
   distinguish "retried-then-all-unaccounted" from "single-attempt
   `no-api-key`" reads `reason`, not `partial`. The C3 vocabulary is the
   cause channel; `partial` is the figure-quality channel. Each does one
   job.
4. **Today's stamp at `usage-store.ts:443-448` is itself a defect artifact.**
   Skeptic O1 `closed-green` (Step 4): a retried manifest under
   `apiKey: null` persists `{status:"unavailable", reason:"no-api-key",
   totalCost:null, ..., partial:"final-attempt-only"}`. The stamp fires
   status-independently (gated only on `retried`), where the retry is
   causally irrelevant. That is exactly the stamp the converged P1/P2
   design is cleaning up. The figure-scoped predicate removes one of its
   incorrect applications (the all-unaccounted new shape) while
   preserving the legacy window carve-out byte-for-byte.

### Options rejected

- **`partial: "attempts-unaccounted"` + `unaccountedAttempts:[1,2]` on the
  all-unaccounted new shape** (owner). Valid concern: choose-once records
  (`usage-store.ts:388-392`, never rewritten) cannot be re-stamped; the
  audit trail should keep naming that the accounting never closed with a
  named gap. I read the concern as real but misdirected. The failure
  cause lives in `reason` (C3 vocabulary, persistent). The attempt
  ordinals live in `unaccountedAttempts` when the partial case fires
  (the partial-with-figure branch). The absence-of-figure is already
  explicit in `totalCost: null` + the `n/a` legend. Adding a `partial`
  literal on a null figure would invert the wiki's standing-legend
  principle. The choose-once durability concern is real but is satisfied
  by `reason` carrying the cause, not by `partial` carrying a property of
  a null figure.

### Grounding

- `vault/wiki/usage-block.md` lines 47–48 — standing-legend principle
  (symmetric direction).
- `vault/wiki/cost-provenance.md` lines 35–39 — reason vocabulary as the
  explicit unavailability channel.
- `vault/wiki/usage-store.md` — `choose-once` (`usage-store.ts:388-392`),
  `pointerSurvivable`, `ResolveOutcome`.
- `council/cards/EV-39.md` §Step 6 Ruling 2 (Escalation 2) — disclosure
  regime; operative phrase "a stored figure that *looks whole*"; J1's
  record does not look whole.
- Card Step 4 O1, O2 — `closed-green`; both empirical premises verified on
  today's tree. The split is normative, not factual; "no runnable
  assertion decides which is honest" (Skeptic, verbatim).
- `extensions/usage-block.ts:32` — `PARTIAL_LEGEND` literal, grammar
  requires a figure. `:118-121` — predicate is presence-only today; the
  new shape's figure-scoped predicate lives in `provider-cost.ts` or
  `usage-store.ts`, not in the renderer.

### Reversibility

Moderate. The figure-scoped predicate is one boolean expression in the
producer (`provider-cost.ts` or `usage-store.ts:443-448`); flipping to
dispatch-scoped is one expression back. The legacy window carve-out is
unaffected. Choose-once records from post-EV-42 carry the figure-scoped
shape; a re-flush is a no-op (`usage-store.ts:388-392`). No record
migration, no schema change, no rendering change beyond the predicate.

---

## J3 — Copy ruling (conditional on J1's branch). **New wording for the new partial-with-figure case.**

J1's branch (figure-scoped) does not add copy for the all-unaccounted
shape — the `n/a` legend already covers it. J3 governs the **new
partial-with-figure case** that lands under principal's design regardless
of J1 (e.g., 2-attempt dispatch where attempt 1 is unaccounted, attempt
2 reports `c2`, `totalCost = c2`, `partial = "attempts-unaccounted"`,
`unaccountedAttempts = [1]`).

### Legend copy (binding)

- Legend key: `partial` (preserved; `extensions/usage-block.ts:32` slot).
- Wording: **`usage  partial = reported figure excludes unaccounted attempts`**
- Plural in the literal (`attempts-unaccounted`) matches the plural in
  the legend wording (designer round-2 §2b: the state is plural, the
  legend names the figure's property).
- Stack order: **reported row → partial legend → `n/a` legend** (matches
  designer's round-2 §2a four-corner table and the existing
  `extensions/usage-block.ts:118-121` order; partial qualifies the
  figure, `n/a` qualifies the absence).
- `unaccountedAttempts: number[]` stays record-only; the legend grammar
  cannot carry a count without widening the `usage  ` prefix convention
  or adding a row. The job-tree row `attempt N/M` already tells the
  reader how many attempts ran; combining that with the qualifier, they
  can infer the gap without a count on the surface.

### Forward-safety on the literal set (advisory)

A total legend map (`Record<ProviderPartialReason, string>`) with a
generic "figure is not whole" fallback for unknown literals is the
discipline for forward-safety — `choose-once` records at
`usage-store.ts:388-392` mean an unrecognized literal must **never**
fail-open into a silent drop of the qualifier. This is a renderer-side
implementation choice (not a predicate ruling); the spec should adopt
it.

### Legacy record rendering

Two paths, both honest:

- **Verbatim rendering of the legacy literal** (`usage  partial = reported
  figure is final-attempt-only`) — what the carve-out's window shape
  produces today, and what pre-EV-42 records carry on disk.
- **Migration-on-read** — surface uniformity: legacy records render the
  new wording, the on-disk literal stays `final-attempt-only`. Honest
  under principal's wording (mechanism-agnostic, names the figure's
  property), and the carve-out's window shape keeps producing the
  legacy literal verbatim (mechanism truth).

Either path is defensible; the spec picks one. The predicate ruling is
load-bearing; the renderer choice is not.

### Options rejected

- **`usage  partial = some attempts were unaccounted for`** — names the
  failure mode, not the figure's property. Mechanism-named; worse on the
  knowledge-in-the-world principle.
- **`usage  partial = reported figure is incomplete`** — true but vague;
  does not name what "incomplete" means. The phrase "excludes
  unaccounted attempts" is more specific and mechanism-agnostic.

### Grounding

- `extensions/usage-block.ts:32` — legend literal slot.
- `extensions/usage-block.ts:118-121` — predicate and push order
  (preserved in form).
- `vault/wiki/usage-block.md` — conditional-legend discipline; the
  grammar-identity constraint (C/D/E/F).
- Designer's round-2 §2 (three-state model, four-corner table).
- Principal's round-2 §3 (total legend map discipline).

### Reversibility

Trivial. The legend literal is one constant (`extensions/usage-block.ts:32`);
revising the wording is one line. No schema change, no record migration
(legacy literals stay on disk under either rendering choice). The
plurality (`attempts-unaccounted` vs `attempt-unaccounted`) is a type
additive; renaming requires a follow-up card.

---

## J2 / J4 / O10 — ride as step-7 gates (no ruling)

- **J2 (comprehension weighting, first-time vs returning reader)** —
  designer's recorded rating (C-5 in round-3). J1's branch choice
  subsumes it; no separate ruling sought. The rating stands as
  designer's record; the spec may consult it for legend wording.
- **J4 (stack order of partial legend)** — designer's reading-order
  preference with no contradicting position. Recorded as
  reported-row → partial-legend → `n/a`-legend. Revisitable as a
  follow-up copy change without schema impact.
- **O10 (file-state distribution of failed attempts: absent vs
  header-only)** — Skeptic's own characterization is "implementation-time
  evidence, not a deliberation blocker." Belongs to step 7/9: a real
  failed attempt's run-dir file state is observable in implementation,
  not in deliberation. O10 is named in the spec as an evidence item
  (its finding may move owner's grouped-vs-split P2 weighting in
  practice, but does not block the spec).

---

## Dissent

**`owner` alone.** Owner's non-concession: the all-unaccounted retried
record must carry `status:"unavailable"` AND a non-undefined `partial`
(+ `unaccountedAttempts`); the block must render both legends. Owner's
settling form (T-A/T-B) is an observation on today's tree, green now
modulo the literal.

I read owner's concern as **valid but addressed elsewhere**:

- The audit-trail durability concern is real (choose-once records at
  `usage-store.ts:388-392`, never rewritten). It is satisfied by
  `reason` carrying the failure cause (C3 vocabulary, persistent) and by
  `unaccountedAttempts` carrying the ordinals when the partial-with-
  figure case fires. The qualifier on a null figure does not add
  information that `reason` does not already carry.
- The "looks whole" disclosure concern is EV-39 Q4's territory and is
  satisfied by `status:"unavailable"` + the `n/a` legend — the figure is
  explicitly absent, not "looks whole."

I do not adopt owner's branch. Owner's T-B (post-card: same fixture →
`status:"unavailable"`, `partial:"attempts-unaccounted"`,
`unaccountedAttempts:[1,2]`, block renders n/a **and** partial legends)
fails under J1's branch; the spec writes the figure-scoped test instead.

---

## Escalation

**No `steward` escalation.**

- **Does not change the portfolio.** EV-42's `goal` (re-scoped in place
  by the EV-39 steward ruling) is unchanged: "Every attempt of a retried
  dispatch is recoverable from that dispatch's manifest alone — its
  session transcript and its spend — and the dispatch's provider-
  reported figure sums every attempt." The figure-scoped predicate
  advances the second clause: a whole figure for whole walks, an
  explicit `n/a` for walks that yield nothing.
- **Does not permanently accept a residual.** The "residual" the
  disclosure regime guards against is "a stored figure that looks
  whole." An `unavailable` record does not look whole — the `n/a` legend
  is the disclosure. The producer's predicate is settled; no permanent
  gap remains.
- **Does not reverse a recorded human decision.** EV-39 §Step 6 Ruling 2
  (Escalation 2) speaks to "a stored figure that *looks whole*" —
  distinct from J1's absent-figure case. The legacy window carve-out
  preserves today's bytes verbatim. No ruling is touched.
- **Card `goal` is not itself the defect.** The card's re-scoped goal
  is satisfiable under J1's branch with no amendment.

If `steward` reads EV-39 Q4's "must never render as *the dispatch's*
reported figure unqualified" as broader than I do — extending it to
records whose figure is explicitly absent — that is a steward call to
reverse J1, not a card-level ruling. Under my reading, J1 sits cleanly
within EV-39's regime.

---

## Disclosure contract the spec must test

The post-EV-42 spec writes the figure-scoped predicate as a runnable
contract. The binding tests:

1. **Whole retried dispatch** — two attempt JSONLs each with one
   generation, costs c1 + c2 → persisted `provider.status === "reported"`,
   `totalCost === c1+c2`, `partial === undefined`, no `partial`
   legend.
2. **Partial-with-figure retried dispatch** (new shape) — attempt-1
   unaccounted, attempt-2 reports c2 → `status: "reported"`,
   `partial: "attempts-unaccounted"`, `unaccountedAttempts: [1]`,
   `totalCost === c2`, reported row renders with the new wording
   `usage  partial = reported figure excludes unaccounted attempts`,
   no `n/a` legend.
3. **All-unaccounted retried dispatch (new shape)** — both attempts
   unaccounted → `status: "unavailable"`, `reason: <C3 worst>`,
   `totalCost: null`, `partial === undefined`, subtree row renders
   `cost=n/a`, last line is `usage  n/a = provider figure unavailable`,
   no `partial` legend.
4. **Legacy window carve-out** — manifest `{attempt: 2, attempts:
   undefined}` → `partial: "final-attempt-only"` persists byte-identical
   to today's bytes.
5. **Non-retried dispatch byte-identity** — single-attempt manifest has
   no `attempts` field; persisted record byte-identical to pre-EV-42
   (no `attempt` on generations, no `partial`).

Test 3 is the load-bearing change: a retried manifest whose walk leaves
every attempt unaccounted does not carry `partial` on the persisted
provider sibling under the new shape.

---

## Acceptance amendment implication

EV-42's `## Acceptance` is amendable (card state is `Deliberating`,
not past `In Progress`). The step-7 spec should add (at minimum):

- The producer predicate for `partial` is figure-scoped (J1 ruling).
- The legacy window shape keeps today's `partial: "final-attempt-only"`
  byte-identical.
- The new partial-with-figure literal is `attempts-unaccounted`;
  `unaccountedAttempts: number[]` is record-only.
- The legend copy is `usage  partial = reported figure excludes
  unaccounted attempts`; stack order is reported row → partial legend
  → `n/a` legend.

No `goal` change. No `Acceptance` change that would amend what the card
is for.
