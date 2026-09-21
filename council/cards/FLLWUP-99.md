---
id: FLLWUP-99
title: Fix the shipped runGate policyVersion writer — lines carry the gate policy's version; the router reads the decision policy's
state: Backlog
owner: null
epic: EPIC-13
goal: `runGate` writes the decision policy's `version` (not the gate tuning policy's `policyVersion`) on both ledger arms so a recorded decision re-derives instead of classifying as policy drift, proven by a test routing a real `runGate`-produced line to `source: "recorded"` — never a fabricated fixture line, the blind spot that hid the defect.
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

## Acceptance

- The owner gates green in full: `bunx tsc --noEmit`, the full `bun test`,
  `python3 council/validate.py`, and `bash council/preflight.sh`.
- A test routes a real `runGate`-produced ledger line through the real `resolveRoute`
  and asserts `source: "recorded"` — never a hand-written fixture line.
- The `test/gate-run.test.ts` golden that pins the tuning literal is re-expressed
  against the decision policy's version via the loader, not deleted.
- The stale `gate-run.ts` EV-81 section-header claim moves in the same diff.
- The card record names the post-fix `policyVersion`/`registrations.jsonl` divergence.