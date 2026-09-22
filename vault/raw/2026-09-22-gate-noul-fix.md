# The decisions-gate noul wire-shape fix (`e903b67`) — and the loading-scope lesson

- **Date:** 2026-09-22
- **Commit:** `e903b673131c14ed86161faf09940cc7fce12a05` —
  `fix(gate): canonicalize the wire noul answer key to probability`
- **Card:** `FLLWUP-104` (EPIC-13) — "Fix the live noul answer-shape drift — the
  decisions API returns `{"type":"noul","noul":<p>}`, the engine reads
  `probability`, in both gate domains"
- **Related:** the EPIC-15 held follow-ups (`FLLWUP-109/110/111`, filed
  `7779b04`), release `v0.35.0` (`6cf2001`)
- **Type:** raw observation / ingest input

## The defect

The live OpenRouter decisions endpoint
(`https://openrouter.ai/api/alpha/decisions`, model `typesafe/jev-1.13`)
returns a noul answer keyed **`noul`**, not `probability`:

```json
{"model":"typesafe/jev-1.13-20260917",
 "answers":{"duplicate":{"type":"noul","noul":0.33}},
 "usage":{"input_tokens":323,"output_tokens":20,"cost":0.000013566},
 "id":"gen-dec-…","provider":"TypeSafe"}
```

`parseDecisionsResponse` (`extensions/gate-transport.ts`) stored answers
verbatim, and both readers — `sideProbability` (shared by `decide()` and
`overrideFires`) and `followupFloor` — read `answer.probability`. Every live
noul answer therefore died at `decide()`/`decideFollowup()` with
`… of type noul is missing a usable probability (expected a number in [0, 1])`,
and both gate domains resolved to their fail-safe (`Deliberate` / `File`).

## The fix

`extensions/gate-transport.ts` gained `canonicalizeAnswer`, applied inside
`parseDecisionsResponse` — the single parse site shared by the card gate
(`runGate`) and the follow-up arm (`runFollowupGate`):

- `{"type":"noul","noul":p}` → canonical `{"type":"noul","probability":p}`.
- both keys present and **disagreeing** → throws (never silently prefers one).
- neither key present → throws.
- non-noul answers pass through verbatim.

Five new tests in `test/gate-transport.test.ts` (written red-first).

## Pole semantics — proven, not assumed

The card's load-bearing requirement was that the returned value names the
P(true) ≡ P(yes) pole, not merely that parsing succeeds. Verified live:

- trivially-true statement → `{"noul":0.99}`
- trivially-false statement → `{"noul":0.01}`

`test/gate-run-live.test.ts`'s pole-semantics arm now asserts
`parsed.answers.twoPlusTwo.probability > 0.9` on the new key and passes.

## Verification

- `bunx tsc --noEmit` clean; `python3 council/validate.py` clean.
- Full offline suite: **1473 pass / 6 skip / 0 fail**.
- `COUNCIL_INTEGRATION=1 bun test test/gate-run-live.test.ts` → **3/3**.
- `COUNCIL_JEV_LIVE=1 bun test test/ev84-followup-falsifier.test.ts` → 7 pass,
  1 fail (arm 4): it now reaches real dispositions (`status: "ok"`, non-null
  callIds, zero `Drop`) but fails its **pinned merge direction** — expected
  `["Merge","File","File"]` (A→B), received `["File","Merge","File"]` (B→A).
  Candidates A "hub stall-kill telemetry" and B "…telemetry coverage" are
  near-identical, so the direction is model-dependent; the test's own R5 comment
  flags this. Not the noul drift.

## The loading-scope lesson

After the fix was committed to the working tree, the in-session
`council_followup_gate` **still** returned the drift error. Root cause: pi loads
pi-council from the **globally-installed clone**
`~/.pi/agent/git/github.com/jumpseat-inc/pi-council` (pinned in
`~/.pi/agent/settings.json`), not from the working tree — the project
`.pi/settings.json` does not list pi-council. `/reload` reloads that global
clone, which was still at `fb198a6` (v0.34.2).

So for this repo's engine development: a working-tree `extensions/` change is
**not live** until it is pushed and the installed clone updated, then
`/reload`. Repo-local `council/` payload (procedures, cards) *is* read from the
working tree, which is why the delivery flows worked while the engine was stale.
After `git push origin main` (`e903b67`), the install was updated manually and
the gate ran green.

## Aftermath

With the gate live, `council_followup_gate` recorded real dispositions for
BUG-2's four held step-13 candidates (all `File`). `product-owner` ratified
File for three (goals amended) → `FLLWUP-109` (create an absent `--cache-file`
parent), `FLLWUP-110` (cache hit/miss counts in the human summary),
`FLLWUP-111` (migrate `runTool` to the async spawn pattern); and amended the
fourth (record-only marker) to `Drop`, naming dissent — the gate's `File` there
was a below-floor artifact, not an actionability judgment. Filed in `7779b04`.

## Open residual

`FLLWUP-104`'s own acceptance requires both gated live arms green; the
follow-up arm's pinned merge direction still fails on model variance. The card
is not formally closed.
