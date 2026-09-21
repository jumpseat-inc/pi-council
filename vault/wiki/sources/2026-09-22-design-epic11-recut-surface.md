---
title: Designer attack — EPIC-11 recut surface (wave 2)
type: source
summary: A wave-2 designer attack on the Jev-aware EPIC-11 recut — the recut's surfaces (the setup seat-composition question, the persona question, the README/docs) name no screen/copy/state to the FLLWUP-75 / EV-82 byte-exact bar; ten ranked findings (A–J) plus four observational gaps, none carrying a runnable settling test.
aliases: [design-epic11-recut-surface, epic11 recut designer attack, wave-2 designer attack]
tags: [pi-council/design, pi-council/epic11]
sources: ["[[2026-09-22-design-epic11-recut-surface]]"]
created: 2026-09-22
updated: 2026-09-22
---

# Designer attack — EPIC-11 recut surface (wave 2)

Source: `vault/raw/2026-09-22-design-epic11-recut-surface.md`. A [[designer]]
wave-2 attack on the `/features-new EPIC-11` recut (the intake that told the epic
to use TypeSafe's Jev). Wave 2 of 3 — it attacks wave-1's decomposition artifact,
does not re-slice, does not rule. Its two halves: (1) a critique of the
surface-touching `Intent` blocks against the `/board-create-card` bar (which
screen, which copy, which state), and (2) **observational** missing-child
arguments in the designer's native format — none with a runnable settling test.

The bar it holds each surface against is the FLLWUP-75 shape (the byte-exact
literal line, replaced not appended) and the EV-82 precedent
([[step-13-followup-surface]]): `Mode: <disposition> — <basis>`, four named
constituents on one line, one render state per unavailable state. By that bar
EV-87, EV-52 (amended), and EV-54 (amended) are **surface-touching but do not
clear it**.

## The recut posture it accepts

The recut adds a **third gate domain** (see [[council-setup]]): a setup interview
obtains a seat-composition decision through a new gate domain before the first
human question; the **safe direction is `Default`**; the human is still asked
regardless; and the chosen persona lives as a `<seat_emphasis>` note rather than
a forked conviction body. The [[designer]] calls this the right shape and does
not attack it — the attack is on what the surface does not yet tell the person.

## Findings, ranked by consequence (A–J)

- **A — the seat-composition question has no profile-field citation (largest
  hazard).** EV-52's amended goal requires every recommendation to cite a field
  of a deterministic repo profile; but the seat-composition recommendation is a
  **Jev disposition, not a profile field**. The first question's header is left
  citing a field that did not produce the recommendation — provenance
  mis-attribution on the first screen. Fix: the header's suffix should name the
  *Jev provenance* (`council seats — Jev's recommendation: <disposition>`), not a
  profile field; the profile-citation rule applies from the second question on.
- **B — `gate.mode: off` is invisible to the human.** The `Default`
  recommendation is the *fail-safe* ("Jev was not consulted"), but reads as "the
  system weighed my repo." Every live run today resolves `Default` for a
  different reason (the FLLWUP-104 drift); the surface cannot tell the two apart.
  Fix: a `gate.mode` provenance suffix on the first header
  (`council seats — Jev unavailable (<gate.mode>): Default`) plus one README
  paragraph teaching enablement. Both the signifier and the "what the data can
  claim" concern.
- **C — the persona question's literal copy is not pinned.** EV-52 names the
  per-seat persona question but pins no option count/labels/trade-off text; EV-50
  binds no validator rule that the persona is *suited* to the seat. Fix: two named
  trade-off dimensions (`what the persona does differently`, `what it costs in
  tokens`) plus a tier pre-press hint.
- **D — the `Redefine` flow's question sequence is unspecified.** EV-52 enumerates
  only the per-seat persona question; a `Redefine` path that asks only that
  yields every packaged seat plus persona flair — i.e. not a Redefine. Same class
  as the FLLWUP-69 "unsignalled action looks benign" mistake. Fix: a deterministic
  named sequence per path (drop-seats multi-select, optional new-seat question,
  per-kept-seat persona, validator re-ask, roster-summary confirm).
- **E — EV-87's ledger line has no rendered-surface pin.** The setup ledger line
  carries a basis and disposition but lacks the EV-82 "presented, never written"
  pin (a test that the render appears in no card file). See
  [[presented-never-written]].
- **F — the setup domain's new disposition literals are not in the ledger
  schema.** `Default`/`Redefine` ∉ `GATE_DECISION_MODES`, and `gate-route.ts:231`
  rejects a non-`GATE_DECISION_MODES` `resolvedMode` **on read** — the writer
  cannot read back its own line. Fix: name the new literal(s) on a card and widen
  the validator. See [[metered-deliberation-routing]], [[gate-parity]]. The seam
  between "succeeds at first call" and "succeeds at first *successful* call."
- **G — the persona's seat-side use is unspecified.** EV-50 pins a *structural*
  note ("subject is the seat's real-human persona"), not a *behavioral* one; the
  seat may read `<seat_emphasis>` and ignore it. Fix: an evaluator-only
  cold-read smoke (the FLLWUP-101 shape), not a card claim of behavior change —
  failure grounds a follow-up card.
- **H — brand-new seats' emphasis notes/personas are unspecified.** EV-50's
  resource assumes the seat exists; a `Redefine`-added seat has no packaged seat
  to emphasize, and the write order (emphasis note before/after the conviction
  body) is unnamed. Fix: an EV-50 sub-acceptance binding emphasis notes to
  `listSeatNames` and ordering the write after the body is resolvable.
- **I — EV-88 is missing the active+credential success arm.** EV-88 asserts the
  `off` arm and an unreachable-endpoint arm; the `active` + resolvable-credential
  + fixture-forced `Redefine` arm is absent, so no end-to-end smoke exercises the
  success path. Fix: a third opt-in variant (`COUNCIL_INTEGRATION=1`).
- **J — the docs surface does not teach `gate.mode` enablement.** The README's
  `/council-setup` section names `gate.mode` but never teaches what `off` means
  for the interview or what `active` buys. Regresses the EV-78 "docs-as-loader"
  precedent.

## Observational gaps (no settling test)

1. **Seat-composition option text** — EV-52 names the `(Recommended)` grammar but
   not the option labels/trade-off text; the recut's `Default`/`Redefine` labels
   are not literal data the way the followup gate's `questions.json` is. Fix:
   pin them on the data surface for per-repo override.
2. **Per-card-class seating vs seat composition** — EV-55 (per-card-class
   seating) stays unamended and un-merged, but its per-seat question may collide
   on the interview flow with the persona question. Name the seam now.
3. **The setup ledger line is read by nobody** — the followup line is read by
   `composeFollowupReview` and the card line by `composeGateReview`; the setup
   line's reader is unspecified, leaving open whether it is per-invocation or
   per-repo (and thus whether a consent act clears stale lines).
4. **The persona's first-dispatch observable** is best settled by a follow-up
   evaluator card, not an EV-50 amendment — the slicing should not claim "the
   seat behaves differently."

## What it does not overturn

The reframe posture stands: the third gate domain, the `Default` fail-safe, the
`<seat_emphasis>` note, the `frozen-seat-missing` validator literal, the
`gate.mode: off` keeping default behavior unchanged, and "the human is still
asked." The attack is specifically on literal copy and `gate.mode` teaching.

## Contradiction flagged

Finding A contradicts [[2026-09-19-po-epic11-decomposition-ruling]] §10, which
ruled the recommendation marker's header chip carries a **profile field** — true
for profile-derived questions, malformed for the seat-composition question whose
recommendation is a Jev disposition. Recorded on [[council-setup]]; not silently
overwritten on the ruling page.

## Related

- [[council-setup]] — the epic and recut this attack governs
- [[followup-decision-gate]] — the twin-domain precedent the recut measures against
- [[confirmation-authority]] — the `active` "recorded decision is the source" posture the setup domain inherits but EV-52 does not name
- [[gate-parity]] — the writer-vs-reader strictness seam behind Finding F
- [[metered-deliberation-routing]] — the shipped gate whose FLLWUP-104 drift makes every live setup call resolve `Default`
- [[presented-never-written]] — the never-written pin Finding E says is missing
- [[step-13-followup-surface]] — the EV-82 byte-exact render bar
- [[ask-user-question]] — the interview grammar and the `(Recommended)` suffix
- [[seats]], [[repository-grounding]] — where `<seat_emphasis>` is read
- [[smoke-test]] — the end-to-end-falsifier rule behind Finding I

## Sources

- `vault/raw/2026-09-22-design-epic11-recut-surface.md`
- `council/cards/EPIC-11.md`, `EV-49.md`…`EV-56.md`
- `vault/raw/2026-09-19-po-epic11-decomposition-ruling.md`
- `vault/raw/2026-09-21-design-epic10-re-cut-surface.md` (the same seat's prior critique; not yet ingested)
- `vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md` (FLLWUP-104 evidence; not yet ingested)