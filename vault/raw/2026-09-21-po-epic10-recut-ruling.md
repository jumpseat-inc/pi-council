---
title: PO ruling — EPIC-10 re-cut wave-3 (the Jev-gated follow-up review)
type: source
summary: product-owner's wave-3 ruling on the EPIC-10 re-cut — one shared `gate.mode` governs both decision domains; the `Knowledge` disposition stays out; EV-44 is retired with its content re-homed to EV-82/EV-84, EV-45/46/47 are carried to `epic: null` (not declined); EV-79's order is floors-before-overrides; EV-84 forces its dispositions with a fixture policy; `RETIRED` is not reused for a dropped candidate; the `## Merged from:` format and the unavailable-state render both ride EV-82; and step 13's board-and-sibling dedup pass stays unconditional so the epic's user value does not vanish under the packaged `off` default.
aliases: [po-epic10-recut-ruling, epic10 re-cut ruling, follow-up gate ruling]
tags: [pi-council/ruling, pi-council/epic10, pi-council/product-owner]
sources: []
created: 2026-09-21
updated: 2026-09-21
---

# PO ruling — EPIC-10 re-cut wave-3

**Run:** `/features-new EPIC-10` re-cut, wave 3 of 3. **Seat:** `product-owner`
(job-5 in this run's numbering), ruling-only. **Inputs ruled on:** the wave-1
principal artifact (epic goal/Intent, EV-78…EV-84), the wave-2 `skeptic` attack
(O1–O7), the wave-2 `designer` attack (`vault/raw/2026-09-21-design-epic10-re-cut-surface.md`,
Findings A–F / D1–D5, observations a–c).

**Binding and not reopened:** the human ordered EPIC-10 re-cut **in place** — same
id, filename, board position, `epic: null`, goal/Intent/Acceptance replaced, no new
epic, new children from EV-78 with `epic: EPIC-10`, and EV-44/45/46/47 needing a
disposition. Nothing below reverses that.

## Sources read

`vault/wiki/index.md`, `metered-deliberation-routing`, `followup-merge-and-auto-ingest`,
`engineering-board`, `run-config-stability`, `product-owner`, `steward`,
`2026-09-21-epic14-run-ledger`, `2026-09-21-po-ev73-step6-ruling`;
`council/board.md`, `council/cards/{_template,EPIC-10,EV-44,EV-45,EV-46,EV-47,FLLWUP-69,FLLWUP-74,FLLWUP-75}.md`,
`council/procedures/{council,features-deliver}.md`, `council/agents/council-runner.md`,
`council/gate/{policy,questions,decision}.json`, `council/validate.py`, `.council.json`,
`extensions/{gate,gate-state,gate-run,gate-ledger}.ts`, `test/gate-run.test.ts`.

Self-measured facts used in the rulings: `## 13. Card the follow-ups` sits at
`council/procedures/council.md:378` (step 14 at `:395`); `grep -rln "Merged from" council/`
hits `EV-44.md` only; `validate.py` registers **no** check that an `epic:` value resolves
to a live card and no check on `council/gate/followup/**`; `check_gate_registrations()`
covers `council/gate/policy.json`'s `policyVersion` only; `extensions/gate.ts`'s `decide()`
runs **overrides → floors → composite** (:616, :628, :660) and every arm of the shipped
function resolves toward `Deliberate`; `gate-state.ts:550-566` keeps **all** `test/` files
in the `tests` section when `touchedFiles: []` (score-ordered, 1000-token cap) and the
packer reads no `council/board.md` byte and no sibling candidate id; `test/gate-run.test.ts`
drives `runGate(state, questions, {policy, decisionPolicy, transport, apiKey})` entirely
offline through an injected transport double.

## R0 — two preliminary repairs the ledger left to me

**R0a (skeptic O1, citation).** Ruled: correct. Step 13 is `council.md:378–394`, not
`314–316` (that range is step 9's tail). The substance — step 13 carries no typed
decision — stands, and the re-cut text carries no line numbers. Standing rule from this
ruling: **cards name the step, never a line range**, because line ranges rot on the next
unrelated edit; EV-44's stale `council.md:316` citation dies with that card (R3).

**R0b (skeptic O2, the pre-write pin).** Ruled: the wave-2 repair is right that nothing is
green today (`grep -rl "confirmed at ledger level" test/` → no hits; `FLLWUP-69` is
`Backlog`), and right that **EV-82** authors the step-13 pin — the pin is needed to
honestly meet EV-82's own goal, so under the fold-in test it is EV-82's. It is **not**
right to leave the ownership boundary implicit: `FLLWUP-69` (`epic: EPIC-9`) is a live card
whose goal covers step 13 **and** `features-deliver.md` Phase 1's re-homed follow-up row.
EV-82 names `FLLWUP-69` in its prose and does not claim to deliver it; the Phase-1-row half
and the "unsanctioned posture" sentence stay `FLLWUP-69`'s. The epic acceptance states the
pin as authored-and-green *after* EV-82, never as already green. **Nothing here deletes or
demotes `FLLWUP-69`** — touching another epic's live card would be a portfolio act.

## R1 — enablement: one `gate.mode` governs both decision domains

Ruled: **reuse `.council.json`'s reserved top-level `gate` section and its single `mode`
key**; no second reserved section, no per-domain mode inside it. Rejected: (a) a sibling
`followupGate` section — a second operator surface, a second status literal, a second
`/council-gate`, and a second scaffold seed (`FLLWUP-85`) for two things the human asked to
be *the same*; it would also let the two domains disagree about whether a typed decision
exists at all, which is the state the EPIC-14 re-homing was done to eliminate; (b)
`gate.followupMode` inside the section — the same coupling cost, paid in loader branches.

Grounding: EPIC-14's EV-73 (`3386faff`) made `gate.mode` the single resolver all mode
readers use; the intake's own words are "I want the same decision making." Dissent named:
none of the attackers filed against it — the coupling cost is the principal's own
acknowledged trade-off, stated in the epic Intent. It is accepted, and its safety rests on
a real asymmetry: both domains' `off` arms move **toward a human** (`off` routes every card
to the full Deliberate panel; here it returns follow-up review to unqualified human prose),
so one switch never makes the product *less* scrutinised.

Consequence accepted, not fixed: `/council-gate`'s status line now describes two domains
while naming neither. That operator-copy widening is **not** folded into this epic —
`FLLWUP-94` (`Backlog`, EPIC-13) already owns the status line's wording, and `FLLWUP-86`
already owns `gate.mode` as a mid-run-flippable input for the Phase-0 stability check.
Both are named for the human's attention at the approval gate.

## R2 — the `Knowledge` disposition stays out

Ruled: the disposition vocabulary is exactly `File | Merge | Drop`. There is no fourth
`Knowledge` value, and no card-vs-knowledge classification inside this epic. Rejected: (a)
adding `Knowledge` — its honest implementation is a `vault/wiki/` write, whose owner is the
ingest operation and whose authority map `features-deliver.md` declares "complete and
exhaustive" (EV-47's own Intent); an authority-map change is not a card inside a
decision-routing epic; (b) folding EV-45 in as the `Knowledge` carrier — that is
re-slicing, which this seat does not do, and it would make the epic's falsifier depend on
the wiki's write path. Grounding: the intake names *follow-up cards*; `followup-merge-and-auto-ingest`
records ingest as the epic's **second** ask, which the re-cut's first ask does not absorb.

Accepted temporary residual, named rather than permanent: a candidate Jev decides `Drop`
takes its content nowhere — no card, no ingest; the durable trace is the ledger line plus
the rendered line's cost clause (R7/D2). This closes when the carried ingest work (R3's
EV-45/46/47) is picked up again. It is not a ruling that ingest is unwanted.

## R3 — EV-44/45/46/47 disposition

The load-bearing mechanism fact: `features-deliver.md:68-69` scopes a run to "the epic and
**every child whose `epic:` field names it**". A re-cut epic therefore drags its stale
children into its own autonomous run. Every disposition below is chosen against that.

- **EV-44 — retired.** Delete `council/cards/EV-44.md`; remove its line from `## Ready`
  (`board.md:85`). Not declined — superseded with every artifact re-homed: the
  `## Merged from:` card-face format and the merge chat line → **EV-82** (R7); the
  exactly-N-cards falsifier → **EV-84**; the dedup *decision* → **EV-78/79/80**. Its
  consolidator-rules-`merge-into-EV-X`-or-draft-new arm dies with the design: the decision
  is now typed and its failure route is `ESCALATION` (R6), not a seat ruling.
- **EV-45 — carried.** File stays; `epic: EPIC-10` → `epic: null`; `state: Ready` →
  `Backlog`, line moved from `## Ready` (`board.md:86`) to the `## Backlog` column, title
  unchanged. Its promotion was ratified against the *old* EPIC-10 goal, which no longer
  exists; the precedent is EPIC-14's handle-any-follow-up normalization to `Backlog` and
  steward's "promotion is a later, human-reachable call."
- **EV-46 — carried.** File and `Backlog` board line stay exactly as written; only
  `epic:` → `null`.
- **EV-47 — carried.** Same: file and `Backlog` line stay; `epic:` → `null`.

`validate.py` enforces no `epic:` referent and no column-matches-epic rule, so all four
actions land clean under the existing validator; no validator change is in scope.

**Escalation test applied and not triggered:** no card is declined and no recorded human
decision is reversed — the ingest ask survives the re-cut as three live, unparented cards.
Had the ruling been "delete EV-45/46/47", that is a portfolio act and this seat would have
escalated instead of ruling. Whether the carried ingest cards get a **new epic** is a later
decomposition, above this ruling.

## R4 — EV-79's precedence: floors before overrides, with the carve-out in the goal

Ruled: **`decideFollowup` evaluates confidence floors and the noul threshold first, hard
overrides second, the weighted composite third**, and any below-floor or unanswered
weighted question returns `File` — so `Merge` and `Drop` are unreachable on
low-confidence input. The goal is amended to say the order, not merely "declared order
pinned". Rejected: overrides-before-floors as shipped in `decide()` (:616 before :628) —
in the card gate that order is harmless **because every arm returns the same value**
(`Deliberate`), so order changes only the basis string; in the follow-up domain the arms
diverge (`File` is safe, `Merge`/`Drop` are not), so shipping overrides-first would let a
destructive disposition land on an answer the model itself flagged as unsure. That is
precisely the inversion the epic Intent's fail-safe clause exists to prevent.

The deadness objection (skeptic O4) is answered on the distinction the loader already
draws: `FLLWUP-74` class 3 refuses a rule that can **never** fire for any input —
`override.question` absent from `weights` (`gate.ts:520-529`). A rule that fires on a
confident answer and is *suppressed* by the floor on an unsure one is gated, not dead.
Carve-out pinned into EV-79's acceptance: a firing override whose answer is below its floor
returns `File`, and the fixture covers that input explicitly.

## R5 — EV-84's forcing: fixture policy, not a tolerant invariant

Ruled: **keep the fixture-forcing `overrides`** and the exact-two-card assertion. Rejected:
the tolerant structure-only invariant as the epic's primary falsifier — "two cards written"
is the whole point of the re-cut, and an assertion that cannot fail cannot settle the card.
Precedent distinguished: `test/integration.test.ts` asserts structure because its subject
is the transport, not a count; Jev's judgment quality is not what EV-84 is for and is
already covered offline by EV-79's fixtures.

Two conditions, both cheap and both load-bearing: the forcing lives in a **fixture-local
`council/gate/followup/decision.json`** resolved through EV-78's whole-file first-hit path —
never an edit to packaged thresholds (no pre-registration record is moved; `validate.py`
only registers `council/gate/policy.json`'s version, so a fixture-side follow-up policy trips
nothing); and EV-84's acceptance names the arm as a **wiring** falsifier (candidate →
decision → write → ledger), not evidence of the model's judgment quality. The off/failing
arms already provide the model-independent structural coverage.

## R6 — EV-83: `RETIRED` is not reused for a dropped candidate

Ruled: the disposition outcome rides **`DONE` and `ESCALATION` only**. `RETIRED` keeps its
documented meaning verbatim — "the card was withdrawn during this run" — and carries the
ruling that retired it, never a candidate `Drop`; `HALT` pins "no disposition reached" or
the partial state (designer Finding E's ask is met for `HALT` without touching `RETIRED`
semantics). Rejected: amending the return-contract text to admit candidate-level drops —
that record is the orchestrator's only durable account of a withdrawn card, and overloading
it with a disposition that was never a card pollutes an existing contract to save one line
of copy. `council-runner.md`'s `<return_contract>` is not edited by EV-83; EV-83's
acceptance is amended to say so.

## R7 — the `## Merged from:` format re-homes into EV-82

Ruled: **EV-82** owns the written-card surface of a `Merge`: the merged-into card gains a
`## Merged from:` section naming both source candidates, and the chat line naming the
target. It is the card whose work actually writes the card, so under the fold-in test the
format is needed to honestly meet its goal. Rejected: EV-79 (pure, no fs — a format clause
there is untestable by its own construction); EV-84 (a falsifier must assert a format, not
own it — that inverts the dependency and lets the test file define the convention); keeping
EV-44 alive as the format's carrier (its card is superseded in R3; resurrecting a card to
shelter four lines of convention is scope built to protect a filing decision).

## R8 — the unavailable-state render rides EV-82; no new surface child

Ruled: it rides **EV-82**, as the designer argued. The four unavailable states (`off`;
`gate call failed: <reason>`; credential unresolved; model-card coming-soon) are the same
line at the same moment as the disposition line — one formatter, one owner, `FLLWUP-75`'s
discipline (a literal line, replaced not appended, zero lines when the gate resolves).
Rejected: a separate surface child — two cards owning halves of one line is the ownership
split EPIC-13's EV-66/EV-67 render seam already showed badly. The designer's
preference for grammar (`<title>: <disposition> → <target or cost> — <basis>`, and a calm
sentence above the drafted cards rather than a parenthetical) is **endorsed, not pinned from
this seat**: what I rule is the mandatory constituent set — candidate identity, disposition,
target-or-cost, live mode qualifier, basis — one line, grammar continuous with the shipped
`decisionLine` (`Mode: <disposition> — <basis>`), pinned by test. EV-82 is
surface-touching, so `designer` is seated on it and the byte order settles there.

## R9 — the crux the ledger did not name: `off` must still deliver the epic's value

The one amendment I add that no attacker asked for, and the only place in this ruling where
mechanism and user value actually diverge. The packaged `gate.mode` default is `off`, and
every consumer repo therefore runs `off` until someone types `/council-gate active`. The
draft's `off` arm was "step 13's review unqualified", and the epic Intent said the
merge-before-draft requirement is "subsumed" by the typed `Merge`. Under that reading the
follow-up accumulation problem the human actually complained about is **unsolved by default
everywhere it exists** — the fix would ship and, in the default configuration, do nothing.

Ruled: **step 13's board-and-open-card-and-sibling dedup pass is unconditional prose,
present in every mode including `off` and every fallback arm** — the human is asked the
dedup question whether or not a model answered it first. The mode switches *whose decision
is applied*, never *whether the reader is told to look at the board*. EV-82's acceptance
gains that clause; the epic Intent's "subsumed" sentence is amended accordingly, and epic
acceptance bullet 4 reads "`off` leaves step 13 as an **unqualified human review that still
carries the dedup pass**". This is not a split-scope compromise: the typed decision is the
winner on every arm where it runs, and one sentence of procedure survives from EV-44
because a fail-safe direction is supposed to be worth something.

## Ratified and amended

- **Epic goal** — ratified as drafted.
- **Epic Intent** — ratified with the R9 amendment to the "merge-before-draft is subsumed"
  sentence, and with the R0a rule (no line-number citations anywhere in the card).
- **Epic Acceptance** — ratified with bullet 4 amended per R9 and the pre-write-pin clause
  amended per R0b (name `FLLWUP-69`; the pin is authored by EV-82, nothing is green today).
- **EV-78** Acceptance — ratified as drafted. **State: `Ready`** ratified.
- **EV-79** Acceptance — ratified with R4's carve-out fixture. **Goal amended** to name the
  order (floors → overrides → composite) per R4. **State: `Backlog` until EV-78** ratified.
- **EV-80** Acceptance — ratified as drafted; R0/R7's measurement (`tests` carries all test
  files, `touchedFiles` is the empty one, no board byte) is recorded as the corrected
  justification and the epic's seam prose follows it. **State: `Backlog` until EV-78** ratified.
- **EV-81** Acceptance — amended per R0's scoping: the unreachable-endpoint fixture asserts
  the posture handed to the caller (`gate call failed: <reason>`, zero `Drop`, no automatic
  `Merge`, human-confirm fallback) at the module boundary, which is what makes it provable
  offline today (`test/gate-run.test.ts` proves the injection shape); the end-to-end
  "reaches step 13" claim is EV-84's third arm. **State: `Ready`** ratified.
- **EV-82** Acceptance — ratified with D1/D2/D3/D4 (R7, R8), R0b's naming of `FLLWUP-69`,
  R7's `## Merged from:` + chat-line clauses, and R9's unconditional dedup clause.
  **State: `Backlog` until EV-78–81** (amended to include EV-81, whose failure basis it renders).
- **EV-83** Acceptance — ratified with D5 as narrowed by R6 (all four tags account for the
  outcome; `RETIRED` semantics unchanged and its `<return_contract>` text untouched).
  **State: `Backlog` until EV-82** ratified.
- **EV-84** Acceptance — ratified with R5's two conditions. **State: `Backlog` until
  EV-82/EV-83** ratified.

## Named, not carded (temporary, each with a closing home)

1. Follow-up thresholds carry no pre-registration record — `check_gate_registrations()`
   covers `council/gate/policy.json` only, so a `followup/decision.json` version can move by
   taste. Temporary: it bites on the first threshold move, not at ship. Home: that move's
   card, or a step-13 follow-up then.
2. `/council-gate`'s status line now describes two domains and names neither. Home:
   `FLLWUP-94` (EPIC-13, `Backlog`).
3. A `Drop`ped candidate's content is not ingested anywhere. Home: the carried
   EV-45/46/47 ingest work (R2).
4. The coming-soon state on the model-card page was **not re-verified from this seat** (no
   network tool here). It is not load-bearing: EV-81's posture treats availability as a real
   state and the fail-safe is the human, so the design is honest whichever way the page
   reads when the owner checks it.

## Related

- `vault/wiki/metered-deliberation-routing` — the shipped gate this epic mirrors
- `vault/wiki/followup-merge-and-auto-ingest` — the pre-re-cut EPIC-10 record
- `vault/wiki/engineering-board` — the fold-in test, pre-write confirmation, goal immutability
- `vault/raw/2026-09-21-design-epic10-re-cut-surface.md` — the wave-2 surface attack ruled at R7/R8/R9
- `vault/wiki/2026-09-21-po-ev73-step6-ruling` — the fold-in precedent used at R0b/R7
