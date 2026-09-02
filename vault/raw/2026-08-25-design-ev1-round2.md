# EV-1 Round 2 — Designer position (convergence)

This is the design seat's round-2 position on card EV-1, after the
owner's and principal's round-1 positions and the verified-fact
updates the facilitator surfaced at the top of the prompt. Supersedes
nothing in `vault/raw/` (no prior design note for EV-1 exists there).

## Where I land

I converge with the owner on every open question from spec §8 that
binds the design surface, with two acceptances of the principal's
reframes, and one implementation-detail flag I am ungrounded on.

### (1) `themes/` directory + `pi.themes` manifest entry — ACCEPT (with addendum)

My round-1 framing was "ship in `themes/` because pi's documented
auto-discovery finds it." That was correct for the convention-dir
branch of pi's loader and wrong for THIS package: verified fact at
the top of the round-2 prompt — `collectPackageResources` returns
from the manifest branch BEFORE the convention-dir loop when
`package.json` has a `pi` manifest. The package.json I just re-read
confirms this package already has `"pi": {"extensions": ["./extensions"]}`.

So the shipped design is: a `themes/` directory at the package root,
holding `pi-council-dark.json` and `pi-council-light.json`, AND a
matching `"themes": ["./themes"]` entry in `package.json`'s `pi`
manifest block. Without the manifest entry, the directory is
invisible — the loader finds nothing, `/settings` never lists the
pair, and EV-3 has nothing to activate. That is a silent epic-wide
no-op and the worst kind of design failure (the surface looks
shipped and isn't).

The design reasons I argued in round 1 for the directory (static
asset → static shipping; file name carries theme name; pi's
documented convention; no extension runtime dependency) all survive
the manifest-entry addendum. The addendum is a one-line cost, not a
redesign.

**Falsifiable:** T1 in the owner's three-test composition drives
`collectPackageResources` over a fixture package root and asserts
the pair is collected; the same test against a fixture with the
`themes` entry stripped proves the manifest entry is required. Both
assertions in one test.

### (2) Principal R3 — `name` field rename — ACCEPT

Principal is right and the cost to the design surface is zero. The
filename is `pi-council-dark.json`; the JSON `name` field must also
be `"pi-council-dark"` (not omp's literal `"dark"`) because:

- A verbatim `name: "dark"` collides with pi's built-in dark theme
  in `dedupeThemes`. The shipped asset would either silently lose to
  the built-in or surface as a duplicate under the same name.
- NAME-1 (binding, Phase-1 ruling) fixes the family to `pi-council`
  and the variants to `pi-council-dark` / `pi-council-light`.
- The bare string `pi-council` is a family selector in prose only,
  per spec §2 final paragraph. There is no theme by that name in
  `getAllThemes()`.

The /settings list will show `pi-council-dark` and `pi-council-light`
under the `pi-council-` prefix, which IS the family affordance. The
human who reads `/settings` sees the family grouping without us
having to do anything.

**Falsifiable:** `getThemeByName("pi-council-dark").name === "pi-council-dark"`
and `getThemeByName("pi-council") === undefined` after the test
fixture loads the pair.

### (3) Principal R1 — verbatim omp var names, no `amber` — ACCEPT, and the teachable-layer argument is STRONGER, not weaker

Principal is correct that no var named `amber` exists in either omp
file. The dark file uses `colors.accent: "accent"` and the light
file uses `colors.accent: "teal"`; `colors.border: "blue"` in both.
My round-1 framing of "the amber-dark/teal-light accent divergence
is omp's intent" was imprecise — I was using "amber" colloquially to
mean "the warm hue family" and conflating it with the var name.

With the real names, the teachable-layer argument survives AND gets
cleaner:

- A developer who opens `themes/pi-council-dark.json` sees `vars.accent`
  holding `#febc38` and `colors.accent: "accent"`. They intuit "this
  is the accent color, defined in vars, referenced by name" without
  any documentation.
- The same developer opens `themes/pi-council-light.json` and sees
  `vars.teal: "#5a8080"` and `colors.accent: "teal"`. The var name
  `teal` in light vs `accent` in dark is omp's intent (accent tracks
  background temperature; the dark file is allowed to call its warm
  hue `accent` while the light file calls its cool hue `teal`) and
  we ship it verbatim because changing it would be us imposing our
  own naming on top of omp's and breaking traceability to upstream.
- The "blue border family" anchor I called out in round 1 is exactly
  this: `colors.border: "blue"` in BOTH variants, and `vars.blue` is
  defined per-variant (`#178fb9` dark, `#547da7` light). This is the
  family anchor — the thing that is constant across variants — and
  is the right thing for the README to teach.

So: the layered structure survives, the verbatim names ship, and the
developer who opens the file can read it without consulting us.
That is the entire design goal.

**Falsifiable:** byte-equality of the `vars` and `colors` sections
of each shipped file against the corresponding section of the pinned
omp source (commit `eab72e88`). One snapshot test per variant.

### (4) Owner's full-map equality test vs my spot-check — COMPOSE (owner's total, my brand-anchor spotlight as a second pass)

Owner's full 51+4-token `getResolvedThemeColors` equality is the right
primary acceptance test: "matches omp" means the whole resolved map,
not a sample. A person under time pressure (the analogy from my
doctrine) cares that EVERY rendered surface matches the omp look
they came for, not that the spot-check passed.

My spot-check (brand anchors + empty-string defaults + export
section) belongs as a SECOND assertion in the same test — explicitly
named, so a regression that touches only a brand anchor fails
loudly rather than getting lost in a "diff against the giant map"
failure. Both pass; the design doesn't lose anything from running
the full map; the person doesn't lose anything from the spot-check
being explicit.

**Falsifiable:** the combined test fails if any of (a) full
51+4-token map equality drifts from the pinned SHA, (b) any of the
five brand anchors drifts (`#febc38`, `#178fb9`, `#0088fa`, `#b281d6`,
`#9CDCFE` dark; `#5a8080`, `#547da7` light), (c) any of the four
empty-string defaults (`text`, `userMessageText`, `customMessageText`,
`toolTitle`) becomes a non-empty string, (d) any of the three
export tokens drifts (`pageBg`, `cardBg`, `infoBg`). The
spot-check failure mode gives a developer a one-line diagnostic
("`brand_anchor_dark_border` mismatch: expected `#178fb9`, got
`#178fb8`"); the full-map failure mode gives them a diff they have
to read. Both belong.

### (5) Hot-reload / immutability — REFINE

My round-1 framing ("package-shipped files are immutable from the
user's perspective; the hot-reload surface is `.council.json` via
the extension's own watcher (EV-4)") is unchanged in substance but
I sharpen it now that all seats agree:

- The shipped files have NO watcher. There is no file-watching seam
  that would let a `themes/` edit repaint the session. This is
  correct: the shipped files are immutable install data; a user who
  edits them is editing their `node_modules/pi-council/themes/...`,
  which `bun install` (or the next reinstall) will silently
  overwrite. The header comment in each shipped file is the
  signifier that prevents this exact mistake.
- The recolor surface IS `.council.json`, watched by the extension's
  own watcher (EV-4 owns the implementation; the principle is
  settled here). A user who wants a different amber edits
  `.council.json`'s `theme.overrides.accent` and sees the next
  session repaint.
- The asymmetry — edit shipped = silent no-op, edit `.council.json`
  = live repaint — is the right design. It separates "what the
  package is" from "what this consumer wants," and the failure
  modes of editing the wrong one are explicit (silent overwrite on
  reinstall for the shipped files; documented recolor for
  `.council.json`).

**Falsifiable:** a smoke test that edits `themes/pi-council-dark.json`
in a temp clone, runs `session_start`, asserts the active theme is
unchanged; then edits `.council.json`'s `theme.overrides.accent`,
runs `session_start` again, asserts the active theme reflects the
override. The asymmetry is the assertion.

### (6) Anything else — one implementation detail I am ungrounded on

JSON has no comment syntax. My round-1 "header comment in each
shipped file" needs a concrete carrier. Three candidates:

- (a) A leading `// pi-council-dark — ...` line in the file body.
  pi's `loadThemeFromPath` almost certainly uses `JSON.parse`, which
  would reject a leading `//`. **I have not verified this.**
- (b) A `_comment: "..."` key as the first key of the JSON object.
  Valid JSON; tolerated by every parser; visible to a developer
  opening the file; harmless as a color entry (pi's theme loader
  ignores unknown keys). **I believe this works but have not
  verified pi's tolerance of underscore-prefixed unknown keys.**
- (c) A sibling `themes/README.md` with the same content. Cleaner
  JSON; requires the developer to know to open a second file; one
  extra click.

I flag this as the one implementation question I am not grounded
on. I defer to the owner's read of `loadThemeFromPath`'s parser
behavior; whatever path is chosen, the SIGNIFIER (the warning that
the file is immutable and the recolor surface is `.council.json`)
must reach the developer. If (a) and (b) both work, I have a taste
preference for (b) — single file, valid JSON, no parser corner case.

## What I now change from round 1

- Tightened the "amber" framing to "verbatim omp names (`accent` in
  dark, `teal` in light, `blue` for `border` in both)" — principal
  R1 is correct and the teachability claim is stronger with the real
  names.
- Accepted the `pi.themes` manifest-entry addendum to my round-1
  "ship in `themes/`" recommendation. Without it, the design is
  invisible to pi's loader for this package.
- Composed the full-map equality test (owner) with the brand-anchor
  spot-check (mine) rather than picking one — both belong.
- Sharpened the immutability framing into a falsifiable asymmetry:
  shipped-file edit = silent no-op, `.council.json` edit = live
  repaint. The header comment is the signifier that prevents the
  mistake.

## What I do NOT change from round 1

- Var-refs preserved. Still the right call.
- Hand-written committed files. Still the right call.
- Empty-string defaults (`text`, `userMessageText`,
  `customMessageText`, `toolTitle`) must remain empty. A hex
  substitution would silently break `text=""` — `text` is the
  default fg color when no other token matches; turning it into a
  hex would make every unstyled surface glow.
- The "blue border family is the family anchor" framing for the
  README — survives with the verbatim names; should appear as one
  line in the "What you get" subsection.
- The wording-bug call on the EV-1 card intent: "makes `pi-council`
  selectable in /settings" is incorrect per NAME-1. The card intent
  should read "makes the `pi-council-dark` / `pi-council-light` pair
  selectable in /settings." This is a one-line edit to the card text;
  it does not affect the design surface, but it would mislead the
  next reader of the card. I leave it to the owner to fix in the
  card body or note in the PR.