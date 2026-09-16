# EV-42 — Designer (independent first pass) — the partial-legend question

Subject: the user-visible copy that survives the close of EV-39 Q4's disclosure,
and the honest copy that must replace it when the figure is still partial.

This is the designer's first-pass independent position on the usage-block copy
question; the Consolidator will see other seats later. I am the **generator**,
not the reviewer — I argue design before anything is built.

---

## 1. The problem in one paragraph

EV-39's Q4 disclosure rendered the legend `usage  partial = reported figure is
final-attempt-only` for every retried dispatch (the unconditional mark lives at
`extensions/usage-store.ts:443-448` — *every* retried openrouter/ dispatch gets
the literal). EV-42 closes that disclosure by walking the per-attempt session
list at flush time, so the reported figure now sums every attempt's
generations. The literal must stop rendering for a whole report. A separate
question then opens: when the new mechanism finds that some attempt's session
is unaccounted for, what copy is honest? And how does that copy relate to the
existing `n/a = provider figure unavailable` legend?

## 2. The grammar-identity constraint

The usage block has a stable five-row grammar:

```
usage  ownSession  basis=...  ...  cost≈$... (catalogue)   [or cost=n/a]
usage  subtree     basis=...  ...  cost≈$... (catalogue)   [or cost=n/a]
usage  boundary=session=... entries=... jobs=...
usage  reported  cost=$Σ (reported) routed=<multiset>       [conditional]
usage  partial = <definition>                              [conditional, retried]
usage  n/a = provider figure unavailable                   [conditional]
```

The discipline (EV-32 PO C/D/E/F, usage-block.ts:118-120, the conditional-legend
pattern at lines 88-89, 116-119): one literal per legend, `usage  ` prefix,
`key = short definition` shape, conditional on a record-only input. Legends
stack in a fixed order at the bottom. This is not decoration; it is the
block's load-bearing compositional discipline. I do not propose to widen the
grammar — only to update one literal, keep the key, and constrain the new
partial state's input predicate.

## 3. The two distinct states that must not collapse

| State | Slot value | Legend | What it answers |
|---|---|---|---|
| `unavailable` (`provider.status === "unavailable"`) | subtree `cost=n/a`; reported row absent (when `totalCost === null`) | `n/a = provider figure unavailable` | "We don't have a number here at all." |
| `partial` (`provider.partial !== undefined`) | subtree `cost=n/a` (if unavailable) OR normal; reported row present (when `totalCost !== null`) | `partial = <definition>` | "The number we show you is not the whole dispatch's figure." |

The two states are **orthogonal**, not overlapping:

- An attempt's session was unaccounted for → the report's per-generation worst-of
  flips `status: "unavailable"` AND `totalCost` may still be non-null (other
  attempts reported). Both legends apply.
- An attempt's session was unaccounted for AND no attempt produced any reported
  generation → `status: "unavailable"` AND `totalCost === null`. Only the
  `n/a` legend applies — the reported row is suppressed.
- Every attempt's session was accounted for AND every attempt reported a
  generation → `status: "reported"` AND `partial === undefined`. No legend.

EV-39 collapsed both into `final-attempt-only`, which conflated "we couldn't
get the figure" with "the figure we have is the final attempt's only." They
are different questions. EV-42 must keep them separate.

## 4. My design position

### 4.1 Retire `final-attempt-only` from the block's display vocabulary

The literal `final-attempt-only` describes the pre-EV-42 failure mode (we only
fetched the final attempt's session). After EV-42, that mode is gone by
construction — the new mechanism always tries to fetch every attempt. If a
record still carries `partial: "final-attempt-only"` post-EV-42, it is either
a legacy record (written by a pre-EV-42 toolchain) or a defect
(the per-attempt list was empty). The literal's purpose is now
historical/audit only.

### 4.2 Introduce a single new literal: `attempt-unaccounted`

For the still-partial case, the failure mode is "one or more attempts'
sessions could not be resolved" — i.e. either `findSessionFile` returned
nothing (session-missing) or the harvested ids list was empty
(no-generation-id). Both look identical from the report's perspective: that
attempt contributed zero generations to the multiset. The catch-all literal
`attempt-unaccounted` is the right level of granularity for an audit reason.
More granular literals (`session-missing-on-attempt`, etc.) duplicate the
per-generation `ProviderUnavailableReason` set and would not be readable in
the legend.

`ProviderPartialReason` becomes:

```ts
export type ProviderPartialReason =
  | "attempt-unaccounted"
  | "final-attempt-only"; // legacy-only: retained for read-time migration,
                          // never written by post-EV-42 code
```

### 4.3 Keep the legend key `partial`; update the wording

The conditional-legend discipline (one key, short definition, fixed stack
position) constrains the wording tightly. The key `partial` is the right word
— the figure is partial, regardless of *why*. The definition changes:

```
usage  partial = reported figure excludes unaccounted attempts
```

Compared with the existing `reported figure is final-attempt-only`, this
wording is honest about the post-EV-42 mechanism (we tried to fetch every
attempt) and the actual gap (some attempts didn't yield a figure). It avoids
the lie-by-omission the old wording would create if reused.

Alternatives I considered and rejected:

- `reported figure is missing some attempts` — vague; doesn't name the
  partial state's character.
- `reported figure = accounted attempts only` — too algebraic for prose.
- `some attempts were unaccounted for` — describes the failure mode, not the
  consequence on the figure the person is reading.

### 4.4 Migrate legacy records on read

A record persisted by pre-EV-42 code carries `partial: "final-attempt-only"`
on disk. Two options:

(a) Render the literal verbatim — the block shows the old wording for old
    records, new wording for new. This is "permanent residual" — the very
    thing the EV-39 steward ruling forbade.
(b) Map the legacy literal to the new wording at render time. The on-disk
    literal stays as audit history; the *block* shows the new wording
    uniformly.

I take (b). The renderer maps `final-attempt-only` → `attempt-unaccounted` for
display. The on-disk literal is preserved by the read predicate, which is
already loose enough to tolerate extra fields. This honors "what was shown and
what is on disk are equal by construction" (EV-32's commit principle) at the
schema level (the on-disk bytes are unchanged), while closing the surface
divergence.

### 4.5 Conditional remains: `input.provider?.partial !== undefined`

The conditional predicate does not change. The block continues to render the
partial legend iff `provider.partial !== undefined`. The literal set behind
that key evolves (one literal retires, one is added), but the *predicate* is
the same. This is the smallest possible change to the renderer.

## 5. What survives in the block grammar

For a whole retried dispatch (every attempt accounted for):

```
usage  ownSession  basis=session-reconciled  turns=N tokens=... cost≈$... (catalogue)
usage  subtree     basis=stream-assistant   turns=N tokens=... cost≈$... (catalogue)
usage  boundary=session=... entries=... jobs=...
usage  reported  cost=$Σ (reported) routed=<multiset>
usage  n/a = provider figure unavailable      [only if any slot rendered n/a]
```

No partial legend. Same shape as a single-attempt dispatch's block (modulo
the multiset's content, which now aggregates across attempts). This is the
"non-retried dispatch stays byte-identical" invariant in reverse: a whole
retried dispatch's block reads the same shape as a single-attempt's.

For a still-partial retried dispatch (one or more attempts unaccounted for):

```
usage  ownSession  basis=session-reconciled  turns=N tokens=... cost≈$... (catalogue)
usage  subtree     basis=stream-assistant   turns=N tokens=... cost≈$... (catalogue)
usage  boundary=session=... entries=... jobs=...
usage  reported  cost=$Σ (reported) routed=<multiset>
usage  partial = reported figure excludes unaccounted attempts
usage  n/a = provider figure unavailable      [if status: unavailable]
```

Both legends render. They are stacked in the existing order: reported row,
then partial legend, then n/a legend. The order is significant — the
reported row reads first (the figure with its qualifier), then the legend
explains the qualifier, then the legend explains any n/a slots.

## 6. The routed multiset across attempts

The existing `routed=<multiset>` row aggregates `providerName` × count over
`status === "reported"` generations (`usage-block.ts:65-78`). Post-EV-42, the
multiset input is wider: every reported generation across every attempt's
session. The ordering rule (descending count, then ascending name, ASCII `x`,
no spaces) and the `routed=(mixed; +K more)` overflow path are unchanged.

The multiset is the only honest way to surface the upstream-routing variance
across attempts. If a retried dispatch went from Infermatic (attempt 1) to
BlackForest (attempt 2), the multiset would read `BlackForestx1,Infermaticx1` —
both providers visible, no claim about which attempt used which. The job
tree row already carries `attempt N/M`, so per-attempt attribution lives
there, not in the block.

## 7. What I am explicitly NOT arguing

- I am not arguing to remove the `n/a = provider figure unavailable` legend.
  It still has work to do — it qualifies an absent number, the partial
  legend qualifies a present-but-incomplete number.
- I am not arguing to widen the input shape. `provider.partial?` is the right
  channel; the literal set evolves, the predicate does not.
- I am not arguing for the partial legend to render for non-retried
  dispatches. The new literal only ever fires for retried-and-incomplete
  cases; single-attempt records stay byte-identical.
- I am not arguing for the on-disk literal `final-attempt-only` to be
  deleted. It stays as audit history. The *display* migrates.

## 8. Falsifiable predictions (string-equality assertions)

These are the string-equality predicates the Skeptic can run against
`extensions/usage-block.ts` after the implementation lands. Each pins a
specific byte sequence.

### 8.1 Whole retried dispatch (every attempt accounted for)

```ts
// fixture: a 2-attempt dispatch with both attempts' generations reported
// and provider.partial === undefined (the post-EV-42 normal case)
const report = providerReport({
  generations: [genAttempt1, genAttempt2],
  // partial omitted
});
const out = formatUsageBlock({ record: measuredRecord, provider: report });

// (1) no partial legend renders
expect(out).not.toContain("usage  partial");

// (2) the reported row's multiset aggregates across both attempts
const reportedLine = out.split("\n").find((l) => l.startsWith("usage  reported"))!;
expect(reportedLine).toMatch(/routed=\S+x\d+/);

// (3) shape is byte-equal in form to a single-attempt block (4 rows when no n/a)
expect(out.split("\n")).toHaveLength(4);

// (4) no final-attempt-only string anywhere
expect(out).not.toContain("final-attempt-only");
```

### 8.2 Still-partial retried dispatch (one attempt unaccounted for)

```ts
// fixture: a 2-attempt dispatch where attempt 1 produced no reported
// generation (no-generation-id); attempt 2 reported normally.
// The new mechanism sets partial: "attempt-unaccounted".
const report = providerReport({
  status: "unavailable",
  reason: "no-generation-id",
  totalCost: 0.0042,
  generations: [genAttempt2], // only the accounted attempt
  partial: "attempt-unaccounted",
});
const out = formatUsageBlock({ record: measuredRecord, provider: report });

// (1) the new legend renders, byte-exact
expect(out).toContain("usage  partial = reported figure excludes unaccounted attempts");

// (2) the legend is the LAST conditional line before any n/a legend
const lines = out.split("\n");
const partialIdx = lines.findIndex((l) => l.startsWith("usage  partial"));
expect(partialIdx).toBeGreaterThan(0);
expect(lines[partialIdx]).toBe("usage  partial = reported figure excludes unaccounted attempts");

// (3) the reported row still renders (Σ over accounted attempts)
const reported = lines.find((l) => l.startsWith("usage  reported"))!;
expect(reported).toContain("cost=$0.0042 (reported)");

// (4) if status is unavailable, the n/a legend still renders
expect(lines.at(-1)).toBe("usage  n/a = provider figure unavailable");
```

### 8.3 Legacy record migration (pre-EV-42 literal migrates on read)

```ts
// a record written by pre-EV-42 code carries partial: "final-attempt-only"
// the block must NOT render that wording post-EV-42
const legacy = providerReport({ partial: "final-attempt-only" });
const out = formatUsageBlock({ record: measuredRecord, provider: legacy });

// (1) no occurrence of "final-attempt-only" anywhere in the rendered block
expect(out).not.toContain("final-attempt-only");

// (2) the new wording renders instead
expect(out).toContain("usage  partial = reported figure excludes unaccounted attempts");

// (3) the on-disk literal is preserved (read predicate tolerates the legacy
//     literal; the migration happens at render time)
const record = { ...measuredRecord, provider: legacy };
expect(record.provider?.partial).toBe("final-attempt-only"); // disk truth unchanged
```

### 8.4 Non-retried dispatch byte-identity

```ts
// a single-attempt openrouter/ dispatch: byte-identical to pre-EV-42
const out = formatUsageBlock({ record: measuredRecord, provider: providerReport() });

// (1) no partial legend
expect(out).not.toContain("partial");

// (2) shape unchanged (4 rows)
expect(out.split("\n")).toHaveLength(4);

// (3) no new legend wording appears
expect(out).not.toContain("excludes unaccounted attempts");
expect(out).not.toContain("attempt-unaccounted");
```

### 8.5 Conditional predicate unchanged

```ts
// absent provider.partial: no partial legend, byte-equal to pre-EV-42
const a = formatUsageBlock({ record: measuredRecord, provider: providerReport() });
const b = formatUsageBlock({ record: measuredRecord, provider: { ...providerReport(), partial: undefined } });
expect(a).toBe(b);

// present provider.partial (any literal): partial legend renders
expect(formatUsageBlock({ record: measuredRecord, provider: { ...providerReport(), partial: "attempt-unaccounted" } }))
  .toContain("usage  partial = reported figure excludes unaccounted attempts");
```

## 9. Open judgment items (named, not ruled)

These are open per the card's instruction. I name them; I do not rule.

1. **Field shape for the per-attempt session list on `RunManifest`.** The
   card says "persisting the per-attempt session pointers on the manifest"
   but does not fix the shape. Options:
   - `attemptSessions: string[]` — flat array of session ids, ordered by
     attempt.
   - `attemptSessions: Array<{ attempt: number; sessionId: string; sessionPath?: string }>` —
     richer record per attempt.
   - The list sits on `RunManifest` vs a sidecar file.

   I have no design reason to weigh in on the shape; this is owner territory.

2. **The exact wording of the new legend.** I proposed
   `usage  partial = reported figure excludes unaccounted attempts`.
   Other defensible wordings exist. Owner and Consolidator should converge.

3. **Whether to retire `final-attempt-only` entirely on disk or keep it as a
   legacy literal.** I lean migrate-on-read (keep on disk, render the new
   wording). An equally defensible design is: retire `final-attempt-only` from
   the type entirely, and have the read predicate treat unknown literals as
   the new state. This is a smaller type but loses the audit history. I do
   not have a strong preference; the record-keeping side leans against
   erasure.

4. **Empty-multiset retried case.** If a retried dispatch's only successful
   attempt produced zero reported generations (unusual but possible), the
   reported row is suppressed (`totalCost === null`). The block falls back
   to `usage  n/a = provider figure unavailable`. This is already handled
   by the existing logic. Confirming that post-EV-42 behavior is correct is
   an owner test, not a design decision.

5. **Provider sibling's worst-of `status` when one attempt errored before
   producing a generation.** Today's behavior (`status: "unavailable"` with
   reason `no-generation-id`) applies. The reported row is suppressed when
   `totalCost === null` (no reported generations across all attempts); the
   partial legend renders when `totalCost !== null` (some accounted
   attempts reported) and `partial: "attempt-unaccounted"` is set. The
   interaction between worst-of and partial is the most subtle case. I
   argue the design is clean: partial qualifies the *reported row's
   integrity*; unavailable qualifies the *slot's presence*. Both can fire
   on the same record.

## 10. What this position is grounded in

- `extensions/usage-block.ts:29-32` (PARTIAL_LEGEND literal), `:118-120`
  (conditional predicate), `:65-78` (routed multiset).
- `extensions/provider-cost.ts:38-42` (ProviderPartialReason type),
  `:68-74` (ProviderCostReport.partial field).
- `extensions/usage-store.ts:421-427` (the line EV-42 replaces — the job
  list built from `m.sessionId` alone), `:443-448` (the unconditional mark
  EV-42 retires).
- `extensions/runs.ts:43-62` (RunManifest shape — the slot for the new
  per-attempt list).
- `vault/wiki/usage-block.md` (the conditional-legend discipline).
- `vault/wiki/cost-provenance.md` (the (reported) / (catalogue) honesty
  contract).
- The card's recorded rulings: EV-39 step-6 ruling 2 Q4 ("not a fix in EV-39,
  not a separate card, not a permanent residual"), EV-40 §2.8 (the `attempt`
  field name is fixed), the EV-39 cardinality ruling A (one job id / one
  manifest / one row).

## 11. Summary in one paragraph

Retire `final-attempt-only` from the block's display vocabulary; add a
single new literal `attempt-unaccounted` for the post-EV-42 still-partial
case; keep the legend key `partial` and update the wording to
`usage  partial = reported figure excludes unaccounted attempts`; migrate
legacy records on read so the surface divergence closes; keep the existing
`n/a = provider figure unavailable` legend and predicate unchanged; the
routed multiset aggregates across attempts under the existing ordering
rule. The block's grammar-identity constraint binds: no new rows, no new
keys, no new ordering — only an updated literal and a wider aggregate.