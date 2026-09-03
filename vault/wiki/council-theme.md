---
title: Council Theme
type: concept
summary: The oh-my-pi-palette theme subsystem for pi-council — a pinned dark/light theme pair, a repo-level .council.json recolor surface, session-start activation with a strict name namespace, and a token-only drawing rule for all council-drawn UI.
aliases: [theme, pi-council theme, council theme system, theme-section]
tags: [pi-council/concept]
sources: ["[[2026-08-25-design-ev1-round2]]", "[[2026-08-25-po-ev1-escalation]]", "[[2026-08-25-design-ev3]]", "[[2026-08-25-design-ev3-round2]]", "[[2026-08-25-design-ev4-round1]]", "[[2026-08-26-smoke-v0.12.0]]", "[[2026-08-26-theme-module-resolution-fix]]"]
created: 2026-08-25
updated: 2026-09-03
---

# Council Theme

The theme subsystem shipped by **EPIC-1** (EV-1..EV-4). It gives pi-council a
signature oh-my-pi ("omp") look that a consumer can recolor per-repo from a
committed `.council.json`, activated at session start, and enforced token-only
across every surface the council draws — including the `/council-tree` inline panel.

The design risk that shaped it: **three would-be sources of truth for a single
color** — the shipped theme asset, the `.council.json` config, and the runtime
theme. The design collapses them into a **single merge chain** and fixes the
**name namespace** so they never collide.

## The merge chain (one color, one pipeline)

```
pi-council shipped themes (EV-1)
   ↓  loadShippedTheme(variant)  — base JSON off disk via path.join(PKG_ROOT,"themes",...)
.council.json theme section (EV-2)
   ↓  mergeThemeSection(base, section[variant])  — repo overrides win per key (JSON-shape, var-refs survive)
merged palette
   ↓  resolve var-refs → split 8 bg keys → new Theme(fg,bg,mode)  — in-memory, no disk copy (EV-3)
ui.setTheme(instance)  — zero settings-mutation
```

## The four cards

| Card | Deliverable |
|---|---|
| **EV-1** | Port omp `dark.json`/`light.json` (pinned SHA `eab72e88` — 51 live tokens each, exactly pi's required set) to `themes/pi-council-{dark,light}.json` + a `pi.themes` manifest entry (required — without it the pair is invisible to pi's loader). Verbatim omp var names. |
| **EV-2** | `.council.json` gains a top-level `theme` section (per-variant `vars`/`colors` blocks, `enabled`/`variant`), parsed by `loadThemeConfig`, `theme` reserved/skipped in `loadCouncilConfig`. Scaffold seeds non-clobberingly. |
| **EV-3** | Session-start activation: four-state whitelist, in-memory `new Theme` + `ui.setTheme(instance)`, raw-settings detection off disk, one-time notify. |
| **EV-4** | Token-only drawing rule enforced, `.council.json` mid-session watcher, `resolvedPalette(variant)` helper, live repaint of the tree/transcript surface. |

## The name namespace (inviolate)

- `pi-council` is a **prose-only family selector** — never a registered theme
  name (NAME-1 ruling); `getThemeByName("pi-council") === undefined`.
- Exactly two real theme names: **`pi-council-dark`** and **`pi-council-light`**.
- The active (merged) instance is **in-memory and nameless** — it registers no
  name, so `getAllThemes()` still lists only the two shipped files and there is
  no collision. This is what makes the notify (EV-3) the user's verification
  surface for activation.

## Activation — four-state whitelist (ruled, binding)

Read the **raw** `settings.json` `theme` value off disk (project wins). Never
read `ui.theme.name` (it is `"<in-memory>"` after activation). Pi's
`applyFromSettings` persists a detected literal `dark`/`light` — that is
*recorded auto-detect*, not a deliberate choice, so it does not block.

| State | raw `theme` value | Council action |
|---|---|---|
| (a) | unset | **activate** (auto-detect terminal) |
| (b) | `"light/dark"` (pair) | **activate** |
| (c) | literal `"dark"` / `"light"` | **activate** (carve-out extends to persisted auto-detect) |
| (d) | any other concrete name (incl. custom `A/B` pairs, e.g. `nord-light/nord-dark`) | **block** — consumer's explicit pick wins |

Off switch: absence of the `theme` section OR `theme.enabled: false` →
no-op, pi's theme untouched. Notify: info on activate, warning on block,
silent on no-op.

## Locating pi's theme module (v0.12.1 fix)

Activation and the live repaint both end in `new Theme(fg,bg,mode)`. That
constructor — plus the internal `detectTerminalBackgroundFromEnv`, the live
`theme` proxy, and the repaint's `setThemeInstance` — lives in pi's
**internal** module `dist/modes/interactive/theme/theme.js`, whose deep
import is blocked by pi's exports map. It must be reached by absolute path.

**v0.12.1 fixed a latent failure here.** The module was located via
`import.meta.resolve("@earendil-works/pi-coding-agent")` — a raw filesystem
walk that is **not** covered by pi's extension remap (jiti aliases the bare
specifier to the bundled copy, but `import.meta.resolve` bypasses that and
walks real `node_modules`). It works in this repo (a dev `node_modules` has
the peer), but in an **installed package** the plugin clone's `node_modules`
has no `@earendil-works/pi-coding-agent`, so activation threw `Cannot find
module` and the theme silently never applied — see
[[2026-08-26-theme-module-resolution-fix]]. The fix walks pi's **own install
root** with the public `getPackageDir()` API into
`dist/modes/interactive/theme/theme.js`, falling back to the public `Theme`
identity (internal helpers optional) on bun-binary installs.

**Reusable invariant:** from any extension, resolve pi's internals via
`getPackageDir()` + a walk into `dist/…`, never a bare-specifier
`import.meta.resolve` — pi's extension remap does not cover it at runtime.

## Token-only drawing rule (AGENTS.md 9.6)

- **(a)** Every color the council emits comes from a pi `Theme` token via
  `fg`/`bg`/`bold` — no literal hex, no ANSI escapes, no 256-index literals in
  council-drawn output.
- **(b)** Strings handed to `setWidget`/`notify`/`custom` are **plain text**;
  styling is pi's job, never inline ANSI.

Today-compliance: the inline tree / transcript viewer draw from tokens
(`border`, `accent`, `dim`, `bold`, `success`, `warning`, `muted`); the widget
and `/council-jobs` and `/council-init` stay plain text.

## Live repaint (EV-4)

A `.council.json` watcher re-runs merge → `new Theme` → `ui.setTheme(instance)`
mid-session. The critical fix: **`CouncilTree` memoizes its output on width**,
so a theme switch while the tree is open would leave content in the old
palette (border repaint via the live proxy, rows stale) — a half-painted
surface worse than none. `onThemeChange → tree.invalidate()` closes
it. `RULING 1`: on off-transition, keep the last materialized theme + notify
(no live off-revert). `RULING 2`: display no council-owned "which theme is
active" status surface — the repaint itself is the answer.

## Known limitations (→ follow-ups)

- **HTML export under an in-memory theme** breaks / renders the wrong palette
  (`getResolvedThemeColors` is name-based; `<in-memory>` falls through to pi's
  built-in). → FLLWUP-1.
- **`export` section of the theme** (`pageBg`/`cardBg`/`infoBg`) is
  "preserved, not editable" → FLLWUP-2.
- Light-mode selection-cursor contrast is borderline (~3:1, WCAG 1.4.11).

## Contradictions flagged (raw deliberation vs settled outcome)

These are cases where a **raw designer position** diverges from the **settled
spec / product-owner ruling** that actually shipped. The source pages are the
deliberation trail; the shipped behavior is the final authority in every case.

1. **Auto-variant source.** EV-3 designer round-2 lands on reading `ui.theme`
   variant continuity (predictions P24/P25/P32, no palette flip); the **settled
   EV-3 design + `extensions/theme-activation.ts`** use the env `COLORFGBG`
   heuristic (`detectTerminalBackgroundFromEnv`). Raw doc reflects an
   intermediate state, not the final call.
2. **Construction.** EV-3 designer recommends a **tempfile +
   `loadThemeFromPath`**; spec §4 mandates **in-memory, no third on-disk copy**
   (a try/finally tempfile is a disk write; `loadThemeFromPath` is not
   publicly reachable). Settled path reimplements the resolver + `new Theme`.
   The hard route to pi's `Theme` constructor (a deep import into
   `theme.js`) is what the v0.12.1 module-resolution fix hardens — see
   [[2026-08-26-theme-module-resolution-fix]].
3. **Status surface.** EV-4 designer prefers a **sentinel name + `/settings`
   row (d.i)**; the product-owner **RULING 2** is "display nothing," and the
   HTML-export/sentinel work was **deferred to FLLWUP-1**, not built in EV-4.
4. **Custom pair `A/B`.** EV-3 designer round-1 said well-formed pairs
   activate; round-2 (and the settled spec) say **all custom pairs block** —
   only the literal `light/dark` pair activates.

These are not bugs — they are the normal tightening of designer proposals into
binding decisions during deliberation. A reader following the raw docs alone
would misattribute the shipped behavior.

## Related

- [[council-config]] — the `.council.json` host of the `theme` section
- [[run-transcripts]] → [[council-job-tree-inline]] — the tree/transcript surfaces that draw the theme (modal → inline as of EPIC-2)
- [[pi-council-overview]] — the release arc this epic extends
- [[seats]], [[product-owner]] — designer (position) + PO (rulings) seats
- [[smoke-test]] — receives the `/settings` prefix prediction; shipped and **clean-green** in the v0.12.0 smoke run ([[2026-08-26-smoke-v0.12.0]])
- Source pages: [[2026-08-25-design-ev1-round2]], [[2026-08-25-po-ev1-escalation]], [[2026-08-25-design-ev3]], [[2026-08-25-design-ev3-round2]], [[2026-08-25-design-ev4-round1]], [[2026-08-26-theme-module-resolution-fix]]

## Sources

- `docs/superpowers/specs/2026-08-25-council-theme-design.md` (design authority)
- `themes/pi-council-{dark,light}.json`
- `extensions/theme-activation.ts`, `extensions/theme-watcher.ts`,
  `extensions/seats.ts` (`loadThemeConfig`), `extensions/navigator.ts`,
  `extensions/index.ts`
- `AGENTS.md` (repo root) convention 9.6
- the five `vault/raw/2026-08-25-*` design/source docs
- [oh-my-pi](https://github.com/can1357/oh-my-pi) — upstream palette source;
  pinned commit `eab72e88e447a4be45bea2bc302995844c0c51a2`, files
  `packages/coding-agent/src/modes/theme/{dark,light}.json`
