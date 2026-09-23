---
id: FLLWUP-1
title: Council theme export: no-crash under an in-memory theme, editable export overrides, and variant discoverability
state: Backlog
owner: null
epic: null
goal: /export produces correct HTML output (no crash, palette matching the configured .council.json theme) under an in-memory council theme; the .council.json theme export section (pageBg/cardBg/infoBg) is overridable per-variant; and first-time consumers discover/use the dark/light variant split (a recorded finding with evidence, changing only docs/seed if action is warranted).
---


## Intent

Surfaced during EV-4: pi's HTML export resolves theme colors by *name*
(`getResolvedThemeColors(name)`), and the council theme is activated
in-memory via `ui.setTheme(instance)` — it registers no name. So under an
active council theme, `/export` either crashes (`loadThemeJson("<in-memory>")`
throws) with no `settings.theme`, or renders pi's un-merged built-in palette
when the settings leaf is `"light"`/`"dark"`. This was documented as a pi
limitation with no extension seam, and EV-4 pinned it with
`test/theme-export-pinning.test.ts` (asserts the no-arg export lookup throws
`Theme not found: <in-memory>`).

Two viable resolutions to deliberate in this card:
- a pi-side fix: make `getResolvedThemeColors` fall back sanely under
  `<in-memory>` or resolve the settings leaf through the user's theme path;
- or an extension-side clamp: have the council expose the resolved palette
  so export can carry it without a registered name.

The card's goal is simply the observable outcome: `/export` works (no crash,
correct palette) under an in-memory council theme. `pi-council` name
family: `pi-council`, variants `pi-council-dark` / `pi-council-light`.

---

### Absorbed: FLLWUP-2 — Make the .council.json theme export section editable

Surfaced during EV-2: the theme `export` section (pageBg / cardBg /
infoBg) is currently "preserved, not editable" — EV-2's design explicitly
deferred it. A consumer configuring the council theme cannot currently
tune the HTML export page background, card background, or info background;
they fall back to defaults derived from `userMessageBg`.

This is the missing leg of the per-repo `.council.json` customization
story: every part of the theme except the HTML export block is
repo-overridable. A consumer who wants their exported transcripts/
deliverables in the omp palette or their own palette needs these three
values overridable the same way (:top-level-vars, per-variant).

The theme family name is `pi-council` and nothing else; variants
`pi-council-dark` / `pi-council-light`. The `.council.json` theme section
shape is the Council's (top-level `theme` key, sibling of `council`).

---

### Absorbed: FLLWUP-3 — Revisit empty dark and light variant shells for consumer discoverability

Surfaced during EV-2's design deliberation (designer observational
follow-up). EV-2 settled the `.council.json` theme shape as per-variant
(`dark` and `light` blocks), with a minimal seed. The open question: do
first-time consumers actually discover that there are dark and light
variants to split their overrides across, or do they only ever touch one
block and assume it covers everything?

The card is deliberately observational: implement any change only if
evidence (real consumer usage, docs feedback, or a deliberate usability
probe) shows the split is undiscovered or confusing. It is a placeholder to
revisit the shape's discoverability, not a mandate to redesign it now.

Boundaries:
- The theme family name is `pi-council` and nothing else; variants
  `pi-council-dark` / `pi-council-light`.
- The `.council.json` theme section shape is settled (top-level `theme`
  sibling of `council`, per-variant `vars`/`colors`); this card may relabel
  the scaffolded documentation or add seed comments, not change the parse
  contract.
- Nothing here may reintroduce a rendering the human ruled against (status
  surface RULING 2 is untouched).

## Acceptance

- `/export` produces correct HTML output (no crash, palette matches the
  configured `.council.json` theme) when the council theme is activated
  in-memory.
- The EV-4 export-pinning test is updated from "throws" to the passing
  green state this card's fix produces, or replaced by a test asserting the
  correct rendered colors.
- All owner gates green (`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`).

---

### From FLLWUP-2 — Make the .council.json theme export section editable

- `.council.json` `theme.<variant>.export` values (pageBg, cardBg, infoBg)
  override the shipped defaults in `/export` output.
- Absent `export` block → current default behavior unchanged (back-compat).
- The EV-4 export-pinning test still passes (or is extended) and no crash
  appears under an active in-memory theme for the export overrides path.
- All owner gates green (`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`).

---

### From FLLWUP-3 — Revisit empty dark and light variant shells for consumer discoverability

- A concrete finding is recorded (either "discoverability is fine — no
  change" with the evidence, or a specific discoverability gap with a
  proposed remedy).
- If a change ships, it must be docs/seed-only per the boundaries above;
  `python3 council/validate.py` and all owner gates stay green.
