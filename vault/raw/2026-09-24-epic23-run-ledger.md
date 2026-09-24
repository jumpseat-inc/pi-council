# EPIC-23 Run Ledger — autonomous-delivery cold-start efficiency

- Run: `/features-deliver EPIC-23` — "Act on the three suggestions for autonomous
  delivery: fix gate routing, systematize Phase 1 front-loading, and cache/pass
  procedure context"
- Run id: `2026-09-23T18-48-50-938Z-1556044-ywwq9c`
- Orchestrator: the human's agent, autonomously (attended only at the two
  `ask_user_question` steers — Phase 1 rulings and the HALT repair)
- Phase 0 preflight: **PASS** (`council_preflight` → ok; `bash council/preflight.sh`
  → `PASS: preflight clean`); `python3 council/validate.py` clean; all eight seats
  resolve by name, no repo-local overrides
- Merge-time environment: `main` ruleset (id 23557528) requires 1 approving review
  + linear history + PR-only; admin bypass authorized run-scoped by P1-1
- Intake: the same session ran `/features-new` first (three waves: principal,
  skeptic+designer, product-owner), producing EPIC-23 with children EV-89 (Phase 1
  class-enumerated rulings record) and EV-90 (pre-injected procedure context into
  the runner dispatch); suggestion 1 "fix gate routing" was dispositioned to
  FLLWUP-99 (+ FLLWUP-104 Done, FLLWUP-71) rather than filed as a duplicate

## The precursor audit (why this epic exists)

Before the epic, a telemetry audit of 14 sessions / 763 council job manifests +
per-seat transcripts (`.pi/council/runs/`) measured where `/council` and
`/features-deliver` time goes:

- aggregate seat working time splits **~52% model latency / ~44% tool**;
- **~80% of tool time is `council_wait`** — 468 calls, ~57.7 h, of which **354 are
  single-child waits** (avg 455 s) — the runner dispatches one seat, waits, then
  the next;
- per-session **parallelism is only ~1.4–1.7×**; a 21-card session took 24.9 h
  wall for 34.5 h of seat work;
- per-card fan-out: median **4 dispatches / 4 waits**; runner orientation
  (start → first dispatch) median **260 s**, mean 304 s, reflecting the full
  re-read of `council.md` + `features-deliver.md` (714 lines);
- seats by model latency: owner 27.2 h / 4727 calls, council-runner 22.0 h, skeptic
  15.3 h, principal 11.2 h; reasoning tokens 1.4–2.3 M per seat;
- routing: across manifests `Deliberate` 131 / `Direct` 10 / `Verify` 1 — the fast
  paths effectively never fire.

## Phase 1 rulings (binding, recorded on EPIC-23's card face)

- **P1-1 (run-scoped admin authorization).** The ruleset's required review is
  satisfied by the admin bypass, enumerated to exactly three write classes: card
  merges via `gh pr merge <PR> --squash --admin --match-head-commit <X>` pinned to
  the checked SHA; the step-12 direct record push to `main`; and the push of the
  EPIC-23 intake commit. Not extended to any later run.
- **P1-2 (promotion).** EV-89 and EV-90 ratified `Backlog → Ready`.
- **P1-3 (build order).** EV-89 first, then EV-90; one `council-runner` at a time.
- **P1-4 (EV-89 record location).** The durable Phase 1 record lives at
  `council/phase1-rulings.json`, covered by `council/validate.py`.
- **P1-5 (EV-89 refusal literal).** Distinct literal `Phase 1 unresolved: <class>`,
  not the generic `HALT:` line.
- **P1-6 (EV-89 not-applicable grammar).** Structured prefix `n/a: <reason>`.

## The inert gate at read-back (the central finding)

`council_route op:"route"` returned `source: "fallback"` for **both** cards:

- EV-89: `recorded decision for this state uses policyVersion "gate-policy-1",
  current decision policy is "gate-decision-1" — routes full`
- EV-90: `no recorded decision for the current packed state`

`.council.json` carried `gate.mode: active`, yet the gate resolved nothing. This
is a **second inert arm**, distinct from the EPIC-15 live-call-failure arm: the
recorded decision exists but `resolveRoute` **drops it at read-back** because the
writer stamps `policy.policyVersion` (`gate-policy-1`) and the reader compares
against `council/gate/decision.json`'s `version` (`gate-decision-1`). Two
namespaces, structurally never equal. The `noul` wire-shape drift (FLLWUP-104)
was already fixed, so the live call was *not* the cause. FLLWUP-99 owns the fix.

Consequence: both cards ran the full `Deliberate` roster; the EV-69/EV-70
`Direct`/`Verify` fast paths were unreachable. The `mode: Deliberate` recorded on
each runner's **ROOT dispatch manifest** is what the deterministic merge check
read; the runner's own step-1 judgment (fallback) governed execution.

## Merges

| Card | Mode (ROOT manifest) | PR | Match-head SHA | Merged SHA |
|---|---|---|---|---|
| EV-89 | Deliberate | #112 | `d501283d84a45d6515f338dd57cbeb1227d4b75a` | `593f6ed13e012872b692a7dac11dc2a8eb4d75c8` |
| EV-90 | Deliberate | #113 | `f379d15…` | `14f244f…` |

Every merge pinned under P1-1; `gates` workflow `SUCCESS` on every PR head and
every merged SHA (keyed on the `workflow` field). Both cards used 1 of ≤3 verify
cycles; judge `PASS` on both; no `RETIRED`; no `Needs Human`. EV-90's step-12
required a union-merge reconcile of a diverged `main` (`81caa20`).

## Escalations and the HALT

- **EV-89 escalation J1/J2** — "does this run itself populate
  `council/phase1-rulings.json`, or does EV-89 ship the mechanism only?"
  `product-owner` (job-6) ruled **mechanism only**: population fails the fold-in
  test against the card's goal as written. J2 moot — but a fourth privileged
  direct-to-`main` write (the class-enumeration record commit) is **not** in
  P1-1's closed enumeration, and extending a recorded human decision is not a
  seat's act.
- **EV-90 HALT (the undefined repair)** — the `owner` seat failed its step-2
  first-pass position twice inside the **15-minute default window** (`job-8.1`:
  cancelled at 18 turns, no text; `job-8.4` re-dispatch: cancelled at 36 turns,
  zero text blocks). Same model (`z-ai/glm-5.3-flash:high`) completed for
  `principal` in 17 turns. The runner HALTed per dispatch discipline. The command
  describes no sanctioned repair; the orchestrator surfaced it to the human, who
  chose a **30-minute owner window**; the resumed owner (job-9.1) completed in
  22.3 min. This is a *second* undefined-HALT class alongside EPIC-15's mode
  mismatch.
- **EV-90 escalation D1 (derived-key refusal posture)** — when `cardEpicKey`
  resolves the card face's `epic:` and finds it null, does the dispatch throw or
  proceed un-substituted? `product-owner` (job-10) ruled **fail-loud throw**;
  no-throw rejected (an un-substituted `$ARGUMENTS` in operative context fails the
  goal; an omitted overlay strips the run's authority map). **AC5 scope ruled:**
  "byte-identical" governs the enumerated fields, not the dispatch's occurrence.
- **EV-90 step-13 escalation** — three follow-up candidates held; `product-owner`
  (job-12) ratified all three `File`; applied on the confirming dispatch (job-13).

## The step-13 return drift (recurring)

EV-89's runner returned `DONE` **with two candidates held**, rather than the
contract's `ESCALATION`; EV-90's runner escalated correctly. This is the same
deviation EPIC-15 flagged for FLLWUP-107's runner: `council-runner.md` says every
surfaced candidate ends step 13 as an `ESCALATION` before any write, but runners
return `DONE`-with-held. The two EV-89 candidates (a `Drop — alreadyDone` wiki
decision, and a `Merge → FLLWUP-68` cold-read card) were never ratified, so
neither card was written; they exist only in the runner's report.

## Design delivered

- **EV-89** — `features-deliver.md` Phase 1 gets a closed, ordered, class-enumerated
  set (surface copy; state/field naming; uncertainty display; error/empty-state
  text; gate user-visibility) rendered as three stakes tiers, plus a durable
  `council/phase1-rulings.json` record (schema `ruling` | `n/a: <reason>`) covered
  by a grammar-only `validate.py` fence, a refusal clause (`Phase 1 unresolved:
  <class>`), and the FLLWUP-60-shaped authorization clause for the record push
  (unconditional about the requirement, silent on population timing). Mechanism
  only; no record written this run.
- **EV-90** — one composer builds the `council-runner` dispatch input from the
  `renderProcedure`-substituted bodies of `council.md` and `features-deliver.md`,
  with per-file override-first resolution (not a `proceduresDir` join), composition
  at the guarded `hub-tools.ts` `council_dispatch` call site only, verbatim task
  append, a two-args binding (card id param + epic derived from the card face), and
  the AC2 non-tautology fix. `$ARGUMENTS` is not one value across the two bodies:
  the card id in `council.md`, the epic key in `features-deliver.md`.

## Follow-ups (step 13)

Filed under EPIC-23, then re-homed into a new **EPIC-24** ("Close the EPIC-23
autonomous-delivery residuals") because EPIC-23 closed `Done` while carrying three
open children:

- **FLLWUP-114** — Live-smoke verification of the pre-injected runner transcript
  surface (closes EV-90's two `open-untested` smoke predictions).
- **FLLWUP-115** — Frontmatter-scoped epic parse in `cardEpicKey` with a
  corpus-divergence pin.
- **FLLWUP-116** — Quote-agnostic file-content import pins across the suite.

Held, not filed (EV-89's two DONE-with-held candidates): a `Drop — alreadyDone`
wiki-ingest candidate, and a `Merge → FLLWUP-68` cold-read candidate.

## Cost

Catalogue-estimate, from the runner usage blocks: 2 cards ≈ **$2.69**, of which
EV-89 ≈ $1.02 (owner $0.60, skeptic $0.07, judge $0.02), EV-90 ≈ $1.22 across
three runner turns (the HALT turn ≈$0.39, the D1 resume ≈$0.30), plus the ruling
seats and the four features-new waves (≈$0.15). Wall clock ≈ 4.5 h for the
delivery, both cards on the full Deliberate path.

## Key lessons

1. **The gate is inert at read-back, not only at the live call.** A recorded
   decision that the reader rejects (schema/version drift) is as inert as one that
   was never recorded. Both fail toward Deliberate, but neither routes the card.
2. **An inert gate nullifies the fast paths.** Two feature-shaped-but-mechanical
   cards ran the full roster because neither could be routed `Direct`/`Verify`.
   The whole metered-routing subsystem is dark until FLLWUP-99 lands.
3. **`/features-deliver` is serial by design** (board single-writer); a multi-card
   epic's wall clock is the sum of per-card runs.
4. **Runner cold-start is a real recurring tax** (median ~260 s/card); EV-90 ships
   the mechanism to remove it.
5. **Phase 1 front-loading reduces but does not eliminate open judgment** — six
   front-loaded rulings, three ruling-seat round-trips still.
6. **The command under-specifies repair:** the HALT repair path for both an
   overrun dispatch window and a mode mismatch is undescribed; orchestrator
   improvisation was required.
7. **Step-13 return drift persists:** runners return `DONE`-with-held instead of
   `ESCALATION`.
8. **Run-scoped authorizations are closed enumerations:** a write outside the
   enumerated set HALTs rather than pushing; extending the enumeration is a human
   Phase-1 act.
9. **A derived key's null posture is fail-loud** (D1), and "byte-identical" in an
   acceptance criterion means the enumerated fields, not the dispatch's occurrence.
10. **Close-out epics leak residuals:** a `Done` epic can carry open children;
    grouping them into a new epic is the fix (EPIC-24).