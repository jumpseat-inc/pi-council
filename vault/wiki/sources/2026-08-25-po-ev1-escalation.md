---
title: PO Escalation — EV-1 Spec Corrections
type: source
summary: The product-owner ruling on EV-1's escalation — the spec §3/§4 factual corrections ride EV-1's PR plus a §4 pointer into EV-2's Intent; the designer's two predictions route to the smoke test and EV-4 respectively; the runner's NAME-1 card-edit stands.
aliases: [po-ev1-escalation, ev1 product-owner ruling]
tags: [pi-council/theme, pi-council/governance, pi-council/source]
sources: ["[[2026-08-25-po-ev1-escalation]]"]
created: 2026-08-25
updated: 2026-08-25
---

# PO Escalation — EV-1 Spec Corrections

The product-owner's binding ruling resolving EV-1's two open-judgment
escalations plus a flag on the runner's own action. Captures the governance
pattern for the autonomous run.

## Q1 — Spec §3/§4 corrections (Skeptic-verified facts)

- **§3's `"amber"` var-ref is wrong.** Verified omp source (pinned SHA
  `eab72e88`): dark `colors.accent: "accent"`, light `colors.accent: "teal"`,
  `border: "blue"` in both. Spec line 127-128 carried the wrong name.
- **§4's `getPackageDir` guidance is wrong.** `getPackageDir()` =
  `findNodePackageDir(__dirname)` walks up from *pi's own dist* to pi's
  package — returns **pi's install dir, not pi-council's root**. Correct path:
  `path.join(PKG_ROOT, "themes", ...)` (`PKG_ROOT` = `import.meta.url`-based,
  AGENTS.md convention 4). Following the wrong line would silently load pi's
  built-in themes (accent `#8abeb7`) instead of the shipped omp palette.

**Ruling:** both fixes ride EV-1's PR (spec is the source of truth for every
future reader) **AND** a one-line §4 pointer is added to EV-2's Intent (the
moment EV-2's owner is most likely to get it wrong). Belt-and-suspenders.

## Q2 — Designer's two out-of-band predictions

- **(i)** `/settings` lists the pair under the `pi-council-` prefix → **routes
  to the smoke test as an addition** (a pi-UI surface, not the shipped asset's).
- **(ii)** hot-reload asymmetry (shipped edit = no-op, `.council.json` =
  repaint) → **routes to EV-4** (its goal covers mid-session repaint).

No new card warranted; the "smoke warranted at all" question settled by the
routing.

## Flag — runner's NAME-1 application stands

The runner amended EV-1's intent from "makes `pi-council` selectable in
/settings" to "makes the `pi-council-dark` / `pi-council-light` pair
selectable." This is **application of a recorded Phase-1 ruling (NAME-1)**, not
new product judgment — the original wording contradicted NAME-1 and the card's
own parenthetical. **No revert.** This maps to the escalation-contract rule:
the runner applies recorded rulings and cites them; it does not extend one to
a new question it didn't answer.

## Governance pattern (the durable takeaway)

The product-owner escalation resolves e.g. "where do docs-only spec corrections
land" and "which card owns a designer prediction" — routing/fold-in judgments
no test can settle. It issues a structured ruling (facts → ruling → options
rejected → grounding → reversibility, all cheap/text).

## Related

- [[council-theme]] — the subsystem EV-1/EV-2 sit in
- [[council-config]] — EV-2 hosts the §4 PKG_ROOT pointer
- [[smoke-test]] — receives prediction (i)
- [[product-owner]], [[council-runner]] — the ruling + escalation seats

## Sources

- `vault/raw/2026-08-25-po-ev1-escalation.md`
- `docs/superpowers/specs/2026-08-25-council-theme-design.md` (§3/§4)
