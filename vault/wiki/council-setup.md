---
title: Council Setup
type: concept
summary: EPIC-11 (Backlog, unbuilt) — a planned /council-setup procedure that grounds itself in the consuming repo, interviews the human with a recommendation on every question, and writes a fitted configuration; the 2026-09-22 Jev recut adds a third gate domain (seat composition) with a `Default` fail-safe and a `<seat_emphasis>` persona note, and is still under wave-2 designer attack.
aliases: [council setup, /council-setup, interview-driven setup]
tags: [pi-council/concept, pi-council/plan, pi-council/epic11]
sources: ["[[2026-09-19-po-epic11-decomposition-ruling]]", "[[2026-09-22-design-epic11-recut-surface]]"]
created: 2026-09-20
updated: 2026-09-22
---

> ⚠️ **Planned — EPIC-11 is `Backlog` and unbuilt as of 2026-09-22; no
> `/council-setup` procedure ships.** The Jev recut direction below is a target of
> an unresolved wave-2 [[designer]] attack ([[2026-09-22-design-epic11-recut-surface]]);
> concepts may still change. This page records intent so the board and the wiki do
> not drift apart.

`/council-init` scaffolds a consumer repository mechanically and blind: it
installs the council's dependencies and copies the scaffold tree, seeding
`.council.json` with the council's own packaged defaults — so a consumer
receives the council's opinions with no fit to their codebase, stack, or
surfaces.

EPIC-11 adds `/council-setup`, a model-run procedure that:

1. **grounds itself in the consuming repository before asking anything**
   ([[repository-grounding]]),
2. **interviews the human** through the `rpiv-ask-user-question` extension
   ([[ask-user-question]]), with a recommendation attached to every question,
3. **writes a fitted configuration** through a consent-gated, non-clobbering,
   code-validated path ([[non-clobbering-scaffold]], [[council-config]]).

The council's core opinions stay frozen: seat convictions modeled on a real
person, the `<repository_grounding>` block in every seat, a per-seat
intelligence tier, and model diversity across the roster ([[2026-09-19-po-epic11-decomposition-ruling]]).
`/council-init` keeps its engine duties (deps + non-clobbering scaffold) and
hands off to `/council-setup` in the same turn; `/council-setup` is independently
re-runnable and shows the current effective configuration as the default answer.

## The Jev recut (2026-09-22, under attack)

The recut turns the setup interview into a **third gate domain** — a sibling of
the card gate ([[metered-deliberation-routing]]) and the followup gate
([[followup-decision-gate]]) — sharing the one `.council.json` `gate.mode` switch
([[council-config]]):

- **Seat-composition question, first.** Before any model/tier question, the
  interview obtains a seat-composition decision from Jev: **`Default`** (keep the
  packaged roster) or **`Redefine`** (customize). `Default` is the *safe
  direction*, and the packaged default `gate.mode: off` keeps behavior unchanged.
- **The human is still asked regardless** of the recommendation.
- **Persona as a note, not a fork.** A chosen persona lives as a
  `<seat_emphasis>` note at `<repo>/$CONFIG_DIR_NAME/council/seat-emphasis/<seat>.md`,
  read at seat-prompt assembly ([[seats]]); it never forks a packaged conviction
  body ([[override-resolution]]).
- **Deterministic repo profile.** Recommendations cite fields of a profile built
  before the first question (language/package manager, test runner/CI, monorepo
  shape, surfaces, docs inventory, wiki presence, existing overrides, repo size).
- **Recommendation grammar.** The tool's own `(Recommended)` suffix, recommended
  option first, with a header chip naming provenance —
  see the contradiction below for the first question.
- **Headless seam.** EV-53 gates the handoff on `hasUI`; EV-52 degrades to
  print-and-resume, with Esc as a first-class refusal.

### Wave-2 designer attack (unresolved)

The [[designer]]'s wave-2 attack ([[2026-09-22-design-epic11-recut-surface]])
accepts the recut's posture but finds the surfaces do not name screen/copy/state
to the FLLWUP-75 / EV-82 byte-exact bar. Highest-consequence gaps:

- **Provenance mis-attribution (A).** The first (seat-composition) question's
  header cites a profile field, but the recommendation is a Jev disposition — the
  header's suffix should name the Jev provenance.
- **`gate.mode: off` is invisible (B).** A fail-safe `Default` is
  indistinguishable on the surface from a real Jev judgment; every live run today
  resolves `Default` for the unrelated FLLWUP-104 drift reason.
- **Schema seam (F).** `Default`/`Redefine` ∉ `GATE_DECISION_MODES`;
  `gate-route.ts:231` rejects them on read ([[gate-parity]]).
- **Missing never-written pin (E)** for the setup ledger line
  ([[presented-never-written]]), **unpinned persona/Redefine copy (C/D)**, a
  **behavioral gap for `<seat_emphasis>` (G/H)**, a **missing `active`+
  credential smoke arm (I)**, and **no `gate.mode` enablement teaching (J)**.

## Contradiction recorded (not overwritten)

[[2026-09-19-po-epic11-decomposition-ruling]] §10 ruled the recommendation
marker's header chip carries a **profile field**. The recut's Finding A shows
that rule is malformed for the seat-composition question, whose recommendation is
a Jev disposition rather than a profile field. The ruling page is left as its own
faithful record; this page and the source page carry the flag.

## Related

- [[non-clobbering-scaffold]] — `/council-init`, the engine half it hands off from
- [[council-config]], [[override-resolution]] — where the fitted configuration lands
- [[ask-user-question]] — the interview mechanism and its `(Recommended)` grammar
- [[repository-grounding]] — the grounding the procedure front-loads
- [[seats]] — where a `<seat_emphasis>` persona note is read
- [[metered-deliberation-routing]], [[followup-decision-gate]] — the two shipped gate domains the setup domain joins
- [[confirmation-authority]] — the `active` posture the setup domain inherits
- [[chain-promotion]] — the EPIC-11 child cadence
- [[smoke-test]] — the end-to-end-falsifier rule (EV-56)
- [[2026-09-19-po-epic11-decomposition-ruling]] — the wave-3 decomposition ruling

## Sources

- [[2026-09-19-po-epic11-decomposition-ruling]]
- [[2026-09-22-design-epic11-recut-surface]]
- `council/cards/EPIC-11.md` (Backlog)