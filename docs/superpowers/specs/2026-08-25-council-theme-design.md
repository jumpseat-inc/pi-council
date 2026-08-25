# Council Theme System — Design (EPIC-1)

**Date:** 2026-08-25
**Status:** Approved design (EV-5), implementation cards follow
**Target:** EPIC-1 — EV-1 (port), EV-2 (config), EV-3 (activation), EV-4 (compliance)
**Card:** EV-5 (documentation). This spec is the epic's design authority; EV-1, EV-2, EV-3, EV-4 cite it. Wiki ingest derives pages from it after implementation lands.

## Problem

The epic ships an oh-my-pi-themed council: a dark/light theme pair for pi, a
repo-level configuration surface to recolor it, session-start activation, and
a compliance rule for council-drawn UI. The design risk that shaped this spec:
**three would-be sources of truth for a single color** — the shipped theme
asset (EV-1), the scaffold `.council.json` config (EV-2), and the runtime
theme (EV-3). This spec declares a single merge chain instead of a palette,
and fixes the name namespace so the three never collide.

## Goals

- A spec + plan under `docs/superpowers/` that the wiki ingest can derive
  pages from — self-contained: omp source URL/commit, exact token list,
  exact theme-section shape, activation precedence table, compliance rule.
- AGENTS.md documents the `.council.json` theme key and the token-only
  drawing rule.
- README documents the scaffold theme snippet and how to recolor the council.
- The activation decision is recorded (four-state table, ruled).

## Design

### 1. omp palette provenance (settled)

- **Source, pinned:** `github.com/can1357/oh-my-pi`, path
  `packages/coding-agent/src/modes/theme/`, files `dark.json` / `light.json`,
  commit `eab72e88e447a4be45bea2bc302995844c0c51a2`. The spec pins this SHA;
  upstream drift is a deliberate re-pin, not an implicit sync.
- **The two files are NOT twins:** dark has 67 color keys, light 66 — the sole
  difference is dark carries a stale `link` key (`#0088fa`, byte-identical to
  its `mdLink`) that light already dropped.
- **Decomposition is exact and identical in both files:** dropping the
  dead/legacy keys (`statusLine*` ×14, `link` in dark, `pythonMode` in both)
  leaves exactly **51 live tokens** per file — precisely pi's 51 required
  tokens, no more, no less.
- **Value classes:** both files have 15 `vars` entries (18 distinct names
  across the pair); colors reference vars, literals, or `""`; **zero
  256-index integers in the live 51** (integers appear only in the dead
  `statusLine*` set); empty-string defaults (`text`, `userMessageText`,
  `customMessageText`, `toolTitle`) in both files.
- **Brand anchors:** dark accent `#febc38` (omp orange), border `#178fb9`,
  borderAccent `#0088fa`, customMessageLabel `#b281d6`, mdCodeBlock
  `#9CDCFE`; syntax set is VS Code Dark+ literals; light accent is teal
  `#5a8080`, border `#547da7`; `export` (`pageBg`/`cardBg`/`infoBg`) maps 1:1
  to pi's optional export section.
- **Legacy trap:** `pythonMode` is *not* an alias of `bashMode` (pythonMode
  yellow `#e4c00f`, bashMode cyan `#0088fa` dark / green light). pi has no
  python mode; `pythonMode` maps to nothing and must be **dropped, never
  renamed**.
- **Pivotal nuance:** pi's own shipped theme files carry **55 keys** (51
  required + 4 optional) — omp is **upstream provenance**, pi ships trimmed
  files. The spec distinguishes "omp source provenance" (this section) from
  "pi's shipped theme files" (the merge base in §3/§4).

### 2. pi theme schema mapping — three-part appendix

1. **Identity (51):** every pi-required token present under the same name in
   both omp files — a statement, not a mapping effort.
2. **Legacy/dead (16 dark / 15 light):** `link` → dropped (dark-only stale
   alias == mdLink); `pythonMode` → dropped (no pi target); `statusLine*`
   ×14 → dropped (no longer in pi's schema; the only home of 256-index
   values).
3. **Optional-token fallbacks (4):** pi's optional `scrollbarThumb`→
   `selectedBg`, `searchMatchBg`→`selectedBg`, `searchMatchText`→`text`,
   `thinkingMax`→`thinkingXhigh`; none of the four exist in omp and every
   fallback source exists — the derived theme validates with zero additions.

**Naming (from themes.md):** theme `name` required, unique, no `/`; ship
exactly the two variant files `pi-council-dark` and `pi-council-light`;
treat bare `pi-council` as a **family selector** in config prose only —
never a theme name (no theme by that name exists, and the council never
writes it into settings).

### 3. `.council.json` theme section (shape proposed; EV-2 owns final call)

- **Top-level `theme`, a sibling of `council`** — not nested; it is not a
  per-seat override.
- **Reserved key + sibling loader (settled).** Today `loadCouncilConfig`
  (seats.ts:103-132) iterates every `council` entry through
  `parseAgentOverride` — so a `council.theme` key parses as a **phantom seat
  override** (verified: `{"council":{"theme":"dark"}}` → `{"theme":
  {"model":"dark"}}`; `{"council":{"theme":{"enabled":true}}}` → empty
  override for phantom seat `"theme"`). The fix is a **sibling loader
  `loadThemeConfig()`**, with `theme` a reserved key skipped in the
  `loadCouncilConfig` loop — **not** a return-shape change on
  `loadCouncilConfig` (blast radius verified: `loadSeat` seats.ts:179,
  `scaffold.test.ts:42`, `seats.test.ts:263,270` — a return-shape change
  breaks all three, a sibling loader breaks none; the theme section has a
  different validation vocabulary than seat overrides).
- **Working proposal** (EV-2's deliberation fixes the final shape; this is
  the baseline it starts from):
  ```json
  {
    "council": { "<seat>": { "model"?, "thinking"? }, ... },
    "theme": {
      "enabled": true,
      "variant": "auto",
      "overrides": { "accent": "#febc38" }
    }
  }
  ```
  - `variant` ∈ `auto | dark | light`; `auto` follows terminal background →
    `pi-council-dark` / `pi-council-light`.
  - `overrides` keyed by pi `ThemeColor` / `ThemeBg` names, values in pi's
    four accepted formats (hex / 256-index / var-ref / `""`).
  - **Open design detail left to EV-2** (recorded as proposal, not settled):
    owner proposed a vars/colors split (`overrides: { vars?:
    Record<string,string>, colors?: Partial<Record<ThemeColor|ThemeBg,
    string>> }`); principal proposed flat overrides keyed by token name with
    values possibly var-refs resolving against the shipped theme's `vars` —
    merge = "resolve shipped vars → apply per-token overrides, with shipped
    vars still in scope for override var-refs", not a flat `colors` merge.
- **Merge semantics (settled):** the merge happens at the **JSON-shape
  level**, never Theme-instance surgery — `Theme` instances are opaque
  (`fgColors`/`bgColors` private Maps converted to ANSI at construction;
  `getFgAnsi`/`getBgAnsi` return ANSI, not raw values). The extension holds
  the base JSON (the shipped asset file read from disk via
  `path.join(PKG_ROOT, "themes", ...)`) and constructs a fresh `Theme`;
  merge is data-in/data-out over JSON. A var-ref survives the merge
  unresolved (the omp look depends on `colors.accent` being the var-ref
  `"accent"` in dark / `"teal"` in light, and `colors.border` being
  `"blue"` in both); a repo edit to `theme.dark.vars.accent` must
  transitively recolor `accent`/`border`.
  EV-2's acceptance "the default scaffold section matches the shipped omp
  palette" means **resolves to the same colors after merge because the
  scaffold section is a delta (empty overrides), not a palette dump**.
- **Off switch (settled):** absence = off (matches today's absent-file
  behavior); `theme: false` and `theme: { enabled: false }` both accepted as
  explicit off via one falsy/enabled-check expression. Pinned rule:
  `council.theme` falsy OR `council.theme.enabled === false` ⇒ off;
  otherwise on. Presence implies enabled; deletion and `enabled:false` behave
  identically so EV-3 has one code path.
- **Validation (settled):** fail-fast, message naming the file. Valid token
  names = `ThemeColor ∪ ThemeBg` (51 required + 4 optional); valid values =
  hex / 256-index / var-ref-resolving-to-a-declared-var / `""`.
- **Scaffold (settled):** `scaffoldInto` copies non-clobberingly — the theme
  section ships in `council/scaffold/.council.json` and reaches **new
  installs only**; "auto via scaffold" = "auto for fresh installs".

### 4. Activation semantics — four-state table (ruled, binding)

pi's `applyFromSettings` (theme-controller.js:27-50) **persists a detected
`"dark"`/`"light"` into settings.json** on `detection.confidence === "high"`.
A persisted literal built-in is pi's recorded auto-detect, **not** a
deliberate consumer choice — so it does not block council activation (ruling
Q1, Side B). `resolveThemeSetting` (theme.js:541-551) collapses the pair
`"light/dark"` against the terminal but passes literal `"dark"`/`"light"`
through unchanged — detection must read the **raw** settings value.

| State | settings.json `theme` raw value | Council action |
|---|---|---|
| (a) | unset | **activate** (auto-detect terminal) |
| (b) | `"light/dark"` (the pair) | **activate** (raw auto-follow) |
| (c) | literal `"dark"` or `"light"` | **activate** (auto-detection carve-out extends to its persisted form) |
| (d) | any other concrete name | **block** (consumer's explicit pick wins) |

**Detection mechanism (settled):** `ExtensionContext` exposes **no settings
accessor** of any kind — `ui.theme` is the already-resolved `Theme`.
EV-3 must read and parse `getAgentDir()/settings.json` and
`CONFIG_DIR_NAME/settings.json` **off disk** (project wins), detecting the
raw `"light/dark"` pair. Never read `ui.theme.name` — after any
`setTheme(instance)` it is `"<in-memory>"`.

**Activation mechanics (settled):**

- **Public API surface:** the package index exports only `initTheme`,
  `Theme`, `type ThemeColor` from theme. `setTheme`, `setThemeInstance`,
  `getThemeByName`, `loadThemeFromPath`, `parseAutoThemeSetting`,
  `resolveThemeSetting` are NOT public. The extension uses
  `ExtensionUIContext`: `ui.theme`, `ui.getTheme(name)`,
  `ui.setTheme(theme: string | Theme)`, `ui.getAllThemes()`.
- **No-settings-mutation constraint:** activation must go through
  `new Theme(...)` + `ui.setTheme(instance)` — interactive-mode.js:1945-1955
  branches on `instanceof Theme` → `themeController.setThemeInstance` →
  `setGlobalTheme(instance)`, `currentThemeName = "<in-memory>"`,
  `stopThemeWatcher()`, zero `settingsManager` calls. Only the string branch
  calls `settingsManager.setTheme`. The extension never writes pi's
  settings.json.
- **Hot-reload (settled):** `setThemeInstance` stops pi's theme file-watcher
  and marks the theme `<in-memory>` — hot-reload cannot ride pi's watcher.
  Hot-reload is the **extension's own watcher on `.council.json`** that
  re-runs merge → `new Theme(...)` → `ui.setTheme(instance)`. Implementation
  deferred to EV-4.
- **Name namespace (settled):** the in-memory route writes nothing to disk
  and registers no name — the materialized theme can never collide with the
  shipped names in `getAllThemes`. **Spec decision: in-memory, no third
  on-disk copy.** Rejected alternative recorded: materialize-to-disk → the
  name must differ (e.g. `pi-council-config-dark`), or EV-1's assets stop
  shipping under those names.
- **Timing (settled):** activation runs at `session_start` alongside
  `initHubIdentity` / `pruneRuns` / `renderWidget` (index.ts:109-135).
- **Package theme reachability (settled):** package themes reach the
  extension via `resources_discover` → `themePaths` registration
  (`ResourcesDiscoverResult.themePaths?: string[]`,
  `updateThemesFromPaths` at session start) — there is no public
  `loadThemeFromPath`. EV-1 declares `themePaths` (or a `themes/` dir /
  `pi.themes` manifest entry); EV-3 uses `ui.getTheme(name)` +
  `ui.setTheme(instance)`.
- **Merge base:** the shipped asset JSON read from disk via
  `path.join(PKG_ROOT, "themes", ...)` — it cannot be introspected off
  `ui.getTheme(name)` because `Theme` instances are opaque.
  `getPackageDir()` walks up from pi's own dist and returns pi's install
  dir, so reading there would silently load pi's built-in themes (accent
  `#8abeb7`) instead of the shipped omp palette.

### 5. Surface compliance — token-only drawing rule (two clauses)

- **(a)** Every color the extension emits itself comes from a `Theme` token
  via `fg`/`bg`/`bold`; no literal hex, no ANSI escapes, no 256-index
  literals in council-drawn output.
- **(b)** Strings handed to `setWidget`/`notify`/`custom` are **plain
  text** — styling there is pi's job, never inline ANSI.

**Today-compliance (settled):** the only ANSI in `extensions/` is inside a
comment (navigator.ts:25-26); `NavTheme = Pick<Theme, "fg"|"bold"|"bg">`
(navigator.ts:9) is the enforcement seam; the widget (index.ts:88-107) and
`/council-jobs` build plain strings into `setWidget`/`ui.notify` — pi-drawn.
The rule is today-compliant, which the AGENTS.md entry asserts.

**Audit nuance:** a raw `\x1b[` grep false-positives on navigator.ts:25's
own comment — the audit must scan string literals in output-producing paths
and whitelist the theme wrapper module. The audit test is deferred to EV-4.

### 6. AGENTS.md — new hard convention 9.6 (implementation)

A numbered convention **9.6**, beside 9.5, documenting:

- The `.council.json` **theme key**: top-level `theme` sibling of `council`,
  a reserved key skipped in the `loadCouncilConfig` loop, parsed by
  `loadThemeConfig`; `enabled: false` is the off switch.
- The **token-only drawing rule** (§5, both clauses): council-drawn UI draws
  only from pi theme tokens; strings handed to pi stay plain text.

### 7. README changes (ruled, binding)

- **README.md:161-162** "Per-seat model/thinking overrides" bullet (under
  "How installation works"): **keep and update** — enumerate both the
  `council` seat-override block AND the new top-level `theme` key.
- **README.md:181** Git-table row (`.council.json` → "per-seat
  model/thinking overrides (seeded by /council-init)"): **update** (mandated
  regardless) to mention the theme section.
- **New "What you get" theme-customization subsection:** the scaffold theme
  snippet, variant pinning, a per-token override example, the off switch,
  and this precedence line (verbatim):

  > A non-built-in concrete theme in settings.json (e.g. `gruvbox`) wins; the
  > auto-follow pair and a persisted literal built-in `dark`/`light` — pi's
  > recorded auto-detect — do not block council activation. To turn the
  > council theme off, remove the `theme` section from `.council.json` or set
  > `theme.enabled: false`.

- Keep it to the **config surface** — mechanics live in this spec.

### 8. What stays open (owned by implementation cards)

- **EV-1:** var-refs preserved vs resolved-to-hex in the shipped JSON;
  shipping mechanism (`themes/` dir vs `pi.themes` in package.json vs
  `resources_discover → themePaths` — docs/themes.md already documents the
  first two; name all three, EV-1 picks); whether variant files are
  hand-written or generated; hot-reload behavior for package-shipped themes;
  per-token override merge at file vs instance level.
- **EV-2:** the final theme-section shape, including the overrides
  representation (vars/colors split vs flat — §3). EV-2's draft acceptance
  line "`loadCouncilConfig` returns the parsed theme section" gets a one-word
  fix at implementation time ("`loadThemeConfig` returns the parsed theme
  section") — **this spec outranks the child card's draft wording**.
- **EV-3:** activation implementation except the settled constraints above
  (raw-disk detection, no-settings-mutation via `ui.setTheme(instance)`,
  in-memory, session_start timing).
- **EV-4:** which surfaces get which tokens beyond the token-only rule; the
  audit test.

### Testable claims (for the implementation cards to turn into tests)

1. Mapping completeness script (51 live omp tokens ↔ pi required).
2. `resolveThemeSetting("light/dark", "dark")` returns a concrete name;
   literal `"dark"`/`"light"` pass through unchanged.
3. settings.json byte-identical after activation (no mutation).
4. Scaffold seeds the theme section on fresh dirs, skips existing
   byte-for-byte.
5. validate.py clean on the docs-only diff.
6. Var-ref survives the merge.
7. Fail-fast validation on out-of-union token / undeclared var-ref / bad
   value, message naming the file.
8. Activation precedence as a test: `theme: "gruvbox"` → no-op,
   `theme: "light/dark"` → activate, no section → no-op (stub the two
   settings.json files and test the extension's decision function).
9. No-ANSI grep-audit (string-literal scan, whitelisting the theme wrapper).
10. Name-namespace test (in-memory activation registers no name).
