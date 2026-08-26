---
title: EV-1 Round 2 — Designer Position (Theme Port)
type: source
summary: The designer's round-2 convergence on EV-1 — shipping the omp palette pair requires the pi.themes manifest entry plus the themes/ dir, verbatim omp var names (no amber), and the shipped-vs-.council.json hot-reload asymmetry.
aliases: [design-ev1, ev1-round2, omp theme port design]
tags: [pi-council/theme, pi-council/source]
sources: ["[[2026-08-25-design-ev1-round2]]"]
created: 2026-08-25
updated: 2026-08-25
---

# EV-1 Round 2 — Designer Position

The design seat's second-pass position on card EV-1 (Port the oh-my-pi
palette to a shipped pi theme), after the owner's and principal's round-1
positions and the facilitator's verified-fact updates. A convergence document,
not a rewrite — it records where five open questions settled.

## Key decisions (converged)

1. **Shipping mechanism — `themes/` dir AND a `pi.themes` manifest entry.**
   `collectPackageResources` returns from the manifest branch *before* the
   convention-dir loop when `package.json` has a `pi` manifest. This package
   already has `"pi": {"extensions": [...]}`, so without the
   `"themes": ["./themes"]` entry the pair is **invisible to pi's loader** —
   `/settings` never lists it and EV-3 has nothing to activate. A manifest
   entry is required, not optional (silent epic-wide no-op otherwise).
2. **Verbatim omp var names, no `amber`.** The dark file uses
   `colors.accent: "accent"`, the light file uses `colors.accent: "teal"`,
   `colors.border: "blue"` in both. The "amber" framing was colloquial and
   wrong; with the real names the teachable layer is *stronger* — a developer
   opens the file and reads the var-ref structure directly.
3. **`name` field must be the variant name.** `"dark"` collides with pi's
   built-in dark in `dedupeThemes`; the JSON `name` must be `"pi-council-dark"`
   / `"pi-council-light"`. Bare `pi-council` is a prose-only family selector,
   never a theme name (NAME-1 ruling).
4. **Full-map equality test + brand-anchor spot-check compose** (owner's total
   51-token map equality as primary, designer's brand anchors `#febc38`,
   `#178fb9`, `#0088fa`, `#b281d6`, `#9CDCFE` dark; `#5a8080`, `#547da7` light
   as a named second assertion).
5. **Hot-reload asymmetry is the design.** Shipped `themes/*.json` have no
   watcher and are immutable install data (bun install silently overwrites
   edits); the recolor surface is `.council.json`, watched by the extension's
   own watcher (EV-4). Editing shipped = silent no-op; editing `.council.json`
   = live repaint. The asymmetry is a deliberate separation of "what the
   package is" from "what this consumer wants."

## Open flag

JSON has no comments — the "header comment warns the file is immutable" needs
a carrier (`//` rejected by JSON.parse; `_comment:"..."` key; or sibling
`themes/README.md`). Deferred to the owner's read of `loadThemeFromPath`.

## Gulf framing

- **Execution gulf** (getting the omp look) closed by the scaffold + README,
  not the shipped files.
- **Evaluation gulf** (did my recolor apply?) closed by the live repaint of
  `.council.json` edits.

## Related

- [[council-theme]] — the subsystem this card ports the palette for
- [[2026-08-25-po-ev1-escalation]] — the product-owner ruling on this card
- [[seats]] — designer is the seat that produced this

## Sources

- `vault/raw/2026-08-25-design-ev1-round2.md`
- `themes/pi-council-dark.json`, `themes/pi-council-light.json`
