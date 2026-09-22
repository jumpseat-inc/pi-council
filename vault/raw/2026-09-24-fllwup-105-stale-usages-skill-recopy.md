# Stale copied usages skill: delete-and-recopy is the only route (FLLWUP-105)

- **Date:** 2026-09-24
- **Card:** FLLWUP-105 ("Name the remediation route for a stale copied usages
  skill", EPIC-15; follows BUG-2, PR #104, merged `59fad63`)
- **Type:** raw observation / ingest input

## Observation

BUG-2 fixed the usages tool in the **package payload**
(`council/skills/usages/scripts/usages.py`). The warning an existing consumer
sees — `usages: could not write cache:` — is emitted by the **copied** tool at
`<repo>/.pi/skills/usages/scripts/usages.py`, which `/council-init` wrote once
and will never touch again:

- `copyUsagesSkill` is non-clobbering: an existing copy is skipped, so
  re-running `/council-init` alone is a **no-op** (pinned by T-USK1 in
  `test/scaffold.test.ts`).
- The usages skill sits **outside the scaffold tree** by design — no
  `scaffold.json` provenance, no `/council-update` refresh path
  (`TOOLING_FILES` covers only `council/validate.py` and
  `council/cards/_template.md`). R3 (FLLWUP-105) ruled `/council-update` does
  **not** take on refresh of `/council-init`-copied payloads outside
  `council/scaffold/`; widening it is separate scope, not taken.

So for an **already-initialized** consumer, the fixed tool is reachable only
via **delete-and-recopy**: `rm -rf .pi/skills/usages/` then `/council-init`.
This is the route the remediation sentence shipped in
`council/procedures/usages.md`'s `**Report.**` section (PO ruling Q1,
2026-09-24).

## Package-update-first precondition

Delete-and-recopy re-copies from the **installed package**. If the installed
pi-council predates BUG-2, the recopy loops the same buggy tool back. The
package must be updated **first** — hence the shipped sentence's three-step
order: update the pi-council package → `rm -rf .pi/skills/usages/` →
`/council-init`.

Evidence: this repo's own pre-BUG-2 copy at
`.pi/skills/usages/scripts/usages.py` differs from the fixed packaged tool
(skeptic arm O-A/B, FLLWUP-105 step 4: "this repo's own
`.pi/skills/usages/scripts/usages.py` is the pre-BUG-2 tool — diff verified, so
a stale-install delete-recopy without the package update loops the bug back").

## Ingest correction target

- `vault/wiki/non-clobbering-scaffold.md:72-76` (the "Engine-synthesized
  copies: the usages skill" section) says refreshing means
  "delete-and-re-run-`/council-init`" — **directionally correct but
  incomplete**: re-run alone is a no-op (T-USK1), and the re-copied tool comes
  from the installed package, so it must be updated first. Ingest should
  sharpen that sentence to name the package-update-first precondition and the
  execution order (update → delete → re-init).
- `vault/wiki/usages-report.md` **needs no correction** — it does not state a
  refresh route.

## Shipped with this card

- The remediation sentence in `council/procedures/usages.md`'s `**Report.**`
  section (ruling Q1 text, verbatim).
- The mechanical pin `test/usages-procedure.test.ts` (three-literal
  containment, scoped to the packaged procedure via `PKG_ROOT`; measured
  boundary: catches wholesale-removal and trigger-reword classes only —
  command-drop / update-step-drop routes to a follow-up per ruling Q2).
