---
id: FLLWUP-99
title: Make the card gate actually meter: write the decision policy's version and diagnose the missing answer probabilities
state: Backlog
owner: null
epic: EPIC-13
goal: runGate writes the decision policy's version (not the gate tuning policy's policyVersion) on both ledger arms so a real runGate-produced line re-derives through resolveRoute to source: "recorded", and the decisions transport's answers reaching decide() without usable probabilities are diagnosed — proven by a gated live arm producing a line resolveRoute reads back as a reduced mode, with the fail-closed posture byte-identical.
---


## Intent

Confirmed by the EV-81 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev81-step13-confirmation.md`, Item 1). The implementing
owner authors the prose and settles the `how`; carry these obligations.

**The four verified legs.**
- Writer: `extensions/gate-run.ts` — both `runGate` ledger arms write
  `policyVersion: policy.policyVersion`.
- Data: `council/gate/policy.json` → `"gate-policy-1"`; `council/gate/decision.json`
  → `"gate-decision-1"` — different strings, both packaged.
- Reader: `extensions/gate-route.ts` — `record.policyVersion !== decisionPolicy.version`
  → `policyDrift` → the line is dropped from `valid` → the fallback routes full.
- Live: all 8 lines of `.pi/council/gate-ledger.jsonl` carry
  `"policyVersion":"gate-policy-1"`, `"resolvedMode":"Deliberate"`, every answer null.
- Blind spot: `test/gate-route.test.ts` — the fixture `appendRecorded` defaults
  `policyVersion` to `decisionPolicy.version`, hand-writing the line the writer would
  never write.

**Why a card and not a parked observation.** "Outcome-harmless today" is true of the
outcome and false of the mechanism: two shipped mechanisms are dead in production and
no existing card owns reviving either — `resolveRoute`'s recorded-decision match
(EV-69's fast path) and, one layer out, the dispatch-time re-check ratchet, which fires
only when `route.source === "recorded"` on a reduced mode. `.council.json` runs
`gate.mode: "active"`, so every card in every run of this repo pays for a gate call whose
verdict the router then discards as drift.

**Blast radius, both halves load-bearing.** (a) Routing: existing mismatched lines keep
routing full — the safe direction — and only newly written lines regain the fast path;
no migration, no ledger rewrite. (b) Tests: the fix reds `test/gate-run.test.ts` (the
golden pins the buggy tuning literal against a line the real `runGate` wrote); the card
re-expresses that assertion against the decision policy's version read through the
loader, never by deletion.

**The proof must generate its own data.** The falsifier calls `runGate` (injected
transport, response body shaped the way `parseDecisionsResponse` accepts), then runs the
real `resolveRoute` over the resulting ledger file and asserts `source: "recorded"`.
Injecting the transport is legitimate; hand-writing the record is the blind spot that
hid this defect for two epics.

**Stale prose moves in the same diff.** `gate-run.ts`'s EV-81 section header says the
shipped `runGate` writer "is the buggy side" and that the followup arms are a
"DELIBERATE DIVERGENCE" from it; once the writer converges that comment is false about
the code it sits beside.

**Name what the field means now, and confirm nothing read the old way.** After the fix
the line's `policyVersion` carries the *decision* policy's version, while
`council/gate/registrations.jsonl` is keyed on *policy.json's* `policyVersion`
(`council/validate.py`, EV-72's pre-registration). The join is file→file and never
touches the ledger, so EV-72 survives; but the ledger and the registrations stop
sharing a value, and a maintainer tracing "which policy version produced this line" now
reads a different version than the registration names. State that on this card's
record. Adding a second version field to the ledger is **not** a fold-in.

---

### Absorbed: FLLWUP-100 — Card-gate calls always route full Deliberate — every live ledger line died at decide() on a missing answer probability

Confirmed by the EV-81 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev81-step13-confirmation.md`, Item 2). Sequence after
FLLWUP-99.

**The observation.** 8 of 8 live card-gate ledger lines died at `decide()` with
`invalid-response` "missing a usable probability", all answers all-null, all
`resolvedMode: "Deliberate"` — the shipped card gate has never once returned an answer
the decision function could use. The fail-closed posture itself is correct and tested;
`FLLWUP-99` alone cannot make metering work, since post-fix every line still
re-derives to `Deliberate`.

**Amendment A — include the response-contract hypothesis.** The drafted cause list
("wire shaping, question instructions, model behavior") omits the one cause with a
shipped-code home: `parseDecisionsResponse` validates `model` and that `answers` is an
object, then passes per-question payloads **verbatim** (`extensions/gate-transport.ts`)
with no probability extraction anywhere. A location/key mismatch is indistinguishable
from "the model gave none," and it is the cheapest hypothesis to kill. The goal must not
be closeable without looking at it.

**Amendment B — the proof cannot be a fixture of answers.** The load-bearing claim is
proven by the gated live arm (`COUNCIL_INTEGRATION=1`, `test/gate-run-live.test.ts`)
issuing the real packaged four-question set and producing a line that `resolveRoute`
reads back as a reduced mode with `source: "recorded"`. Offline arms may inject a
response *body*; they may not stand alone as evidence that the model can answer. The
default suite stays offline and gains no new live arm.

**Amendment C — the card owns its evidence problem.** On `invalid-response` the failure
arm writes `answers: {}` (`extensions/gate-run.ts`), so the ledger's all-null answers
are the arm's own rendering, not observation. The card must capture a real response body
as part of the diagnosis. If the honest remedy requires persisting the offending payload
on the failure line, that is a ledger-schema change — a new card, not a fold-in.

**Starting point.** `test/gate-run-live.test.ts` already gets a usable probability from
the pinned model for a single-question noul set, so "the endpoint can't" is falsified;
the delta is the packaged question set and the multi-question response.

**Amendment D (EV-84 step-13 ruling) — Amendment A's hypothesis is CONFIRMED; this card's
remaining question is narrower than drafted.** The wire has been captured:
`typesafe/jev-1.13-20260917` returns noul answers as `{"type":"noul","noul":<p>}`, while
`sideProbability`/`followupFloor` read `answer.probability` and `parseDecisionsResponse`
passes per-question payloads verbatim — so `decide()` receives an answer with no usable
probability and throws. That key-name mismatch is the cause of every `invalid-response`
line in the ledger. Of the four drafted causes, **wire shaping is confirmed**; question
instructions and model behavior are demoted to residual, to be re-examined only if the
packaged four-question set still fails to produce a usable probability after the shape is
accepted. **The shape remedy is not this card's** — it is `FLLWUP-104`, which lands first;
this card's question (does the packaged four-question set ever produce a *reduced* mode
that `resolveRoute` reads back as `source: "recorded"`) cannot be honestly investigated
while every call throws. Amendment B's proof and the "outcome named in advance" clause are
**unchanged**; the goal is unchanged and still cannot be closed by the shape fix alone.
Amendment C's capture obligation is discharged in its *diagnostic* half by EV-84's raw POST
(`council/cards/EV-84.md`, step 8 live-arm evidence); this card re-verifies the shape at
implementation rather than trusting that record, because the wire has already drifted once.
Source: `vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md`.

**Outcome named in advance.** The fail-closed posture stays byte-identical and no remedy
may lower scrutiny. The goal is deliberately not softened to "diagnose and report". If
the diagnosis concludes the pin cannot answer this question set with usable
probabilities, then no remedy exists inside the card, the judge's honest verdict is that
the goal is unmet, and the card ends in a named human decision about the question set —
a correct outcome.

## Acceptance

- The owner gates green in full: `bunx tsc --noEmit`, the full `bun test`,
  `python3 council/validate.py`, and `bash council/preflight.sh`.
- A test routes a real `runGate`-produced ledger line through the real `resolveRoute`
  and asserts `source: "recorded"` — never a hand-written fixture line.
- The `test/gate-run.test.ts` golden that pins the tuning literal is re-expressed
  against the decision policy's version via the loader, not deleted.
- The stale `gate-run.ts` EV-81 section-header claim moves in the same diff.
- The card record names the post-fix `policyVersion`/`registrations.jsonl` divergence.

---

### From FLLWUP-100 — Card-gate calls always route full Deliberate — every live ledger line died at decide() on a missing answer probability

- The owner gates green in full: `bunx tsc --noEmit`, the full `bun test`,
  `python3 council/validate.py`, and `bash council/preflight.sh`.
- The `parseDecisionsResponse` verbatim-pass-through hypothesis is explicitly killed or
  confirmed before any model-side conclusion.
- The gated live arm (`COUNCIL_INTEGRATION=1`) produces a line `resolveRoute` reads back
  as a reduced mode with `source: "recorded"`; the default offline suite gains no new
  live arm.
- A real response body is captured as evidence; the fail-closed posture is byte-identical.
- Any ledger-schema change needed to persist an offending payload is filed as its own card.
