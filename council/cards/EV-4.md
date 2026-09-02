---
id: EV-4
title: Theme compliance and live repaint of council surfaces
state: Done
owner: null
epic: EPIC-1
goal: Every council-drawn element from the /council-tree modal and transcript viewer to the widget and command outputs draws from pi theme tokens and repaints when the active theme changes mid-session
---

## Intent

User-visible surface: the /council-tree modal (backdrop, panel borders,
selection cursor, job glyphs, transcript headers, block labels, footer
hints) and the transcript viewer — plus the non-modal council text the
extension draws: the status widget (renderWidget in index.ts), the
/council-jobs table, and the /council-init summary. The designer seat must
sit on this card: it changes what a person sees.

Today the modal already consumes pi Theme tokens (accent, border,
customMessageBg, dim, success, warning, muted, bold in navigator.ts), so
most of the work is audit + fill gaps, not greenfield:

- Every drawn element maps to a pi token; nothing hardcodes a hex or ANSI
  code that ignores the active theme.
- The widget and /council-jobs output are plain text — decide token use
  (e.g. seat name in accent, state in success/error) per what pi's widget
  renderer supports.
- Live repaint: pi's theme can change mid-session (/settings, hot reload).
  The modal is opened with the theme captured at open time — verify whether
  an open modal repaints on theme change and fix if not (re-read the active
  theme on render or re-open).
- Snapshot tests: render modal / viewer / widget with a known fake theme and
  assert the expected ANSI token codes per line; simulate a theme switch and
  assert repaint.

## Acceptance

- Grep-audit: no hardcoded color codes in council-drawn output (all through
  theme.fg/bg/bold or pi-rendered primitives).
- Snapshot test renders the modal with a fake theme and every line carries
  the expected token codes; same for the viewer, widget, and /council-jobs.
- A simulated mid-session theme switch repaints an open modal (test proves
  the new palette appears without closing/reopening, or the fix is
  documented if pi cannot support it).

## Deliberation Record

### Step 1 — classification (facilitator)

Full council (cross-seam: navigator.ts / index.ts / theme-activation.ts /
seats.ts / tests; spec-ambiguous: watcher scope, live-repaint mechanism,
name-based surfaces; design-judgment) AND surface-touching (modal,
transcript viewer, widget, /council-jobs, /council-init summary) →
designer seated in steps 2–3. Card promoted to Deliberating.

### Round 1 — independent first pass (owner, principal, designer)

Three seats dispatched independently with only the card + binding rulings.
Positions recorded verbatim (trimmed of preamble).

#### owner — engineering voice

Audit: the token-only rule survives today entirely — grep confirms zero
literal ANSI bytes (the only \x1b hits are inside the known comment,
navigator.ts:25-26), zero hex literals, zero chalk; NavTheme =
Pick<Theme,"fg"|"bold"|"bg"> is the enforcement seam. What breaks the
GOAL (not the rule): widget and /council-jobs are plain strings (clause
(b) compliant) so their "carry token codes" acceptance is only satisfiable
as a negative (zero-ANSI) assertion or via setWidget's **function form**
(content(tui, theme) => Component, interactive-mode.js:1737) — the only
token-carrier. Live repaint: the claim "the modal captures theme at open"
is FALSE at the value level — the factory's theme argument is the
module-level live Proxy (interactive-mode.js:2179; theme.js:641-648
resolves t[prop] against globalThis[THEME_KEY] at CALL time), so every
render runs against the current instance. The open modal WILL repaint if
(a) TUI.invalidate() reaches overlay.component.invalidate() — yes
(tui.js:430-434 + interactive-mode callback 761-765); (b) CouncilTree's
width cache clears — yes (invalidate(): cached = undefined, navigator.ts);
(c) pi re-renders open overlays — yes (compositeOverlays re-invokes
component.render each frame). **Genuine hazard found: pi's HTML export
throws under an active council theme** — exportSessionToHtml resolves
themeName from [options.themeName, settings].find(name →
getThemeByName(name) !== undefined) (agent-session.js:2680); with the
settings leaf unset/"light/dark" this yields undefined →
generateThemeVars(undefined) → getResolvedThemeColors(undefined) → name :=
currentThemeName = "<in-memory>" → loadThemeJson("<in-memory>") throws
"Theme not found" (theme.js:457-475), uncaught in the export path.

Watcher design: re-run activateTheme (EV-3's session glue, try/caught) on
a change; watch the parent dir of `.council.json` with basename filter +
re-arm on rename/delete (fs.watch on the file itself dies on
rename-reverses saves); 200-350ms debounce, last-write-wins; never watch
settings.json; `{noop}` at reload (section removed / enabled:false) → keep
the last materialized Theme + warn notify (de-activating would need
ui.setTheme(string) which WRITES settings — forbidden by EV-3's zero-
settings-write; documented: reverting needs a restart); `{block}` (settings
got a concrete name while re-reading) → pi has already displaced us;
invalid change → try/catch inside activateTheme notifies and the watch
STAYS ARMED; arm at session_start only when loadThemeConfig !== undefined;
a section appearing mid-session is not supported (documented).

Name surface: getResolvedThemeColors(name)/getThemeExportColors(name)
read JSON by name off asset/registry — the in-memory instance is reachable
NOWHERE. Implementable: (a) shipped-name continuity —
getResolvedThemeColors("pi-council-dark") returns the EV-1 shipped
un-merged palette (regression assert); (b) a council-owned pure
`resolvedPalette(variant)` mirror (merge → resolve → hex) reusing
getResolved/resolveVarRef/fallbacks/split — the deliverable for "carrying
the council palette"; it does NOT re-wire pi's export. NOT implementable
within NAME-1/zero-name: HTML export carrying the merged palette and
/settings showing the materialized theme — pi cannot (its name-lookup
depends on a registered name/file); isLightTheme("pi-council-light")
returns false (checks name === "light") — second pi-cannot for the export
CSS. The /export crash is an actual epic-side regression to document and
test.

Widget / /council-jobs: keep **plain strings** as default (clause-(b)
compliant; nothing to go stale on a theme switch); the token step-up is the
function form (seat in accent, state in success/error/warning, pid muted,
last-event dim) BUT pi does not re-invoke the widget factory on theme
switch — codes would freeze until the next setWidget tick — so the strings
build is the honest choice; snapshot asserts zero ANSI on widget lines (or
function-form codes if the form is taken). /council-jobs stays a plain
u.notify join — no per-token colors; its acceptance is a zero-ANSI
assertion.

Test design: REAL themes not fake — reuse loadPiThemeModule; snapshot with
materializeTheme({variant:"dark"},"dark","truecolor") asserting exact
ANSI bytes (accent \x1b[38;2;254;188;56m, selectedBg
\x1b[48;2;49;54;63m, ...) on modal/viewer lines; repaint sim: render
overlay via the module `theme` proxy with theme A, then
setThemeInstance(B) + overlay.invalidate() (the TUI does this) + render
again → B's ANSI assert with the SAME overlay object (no re-open —
acceptance proved); watcher tests via the manual watch→reload path;
name-surface regression; grep-audit as a unit test (not git-grep).

Numbered falsifiable claims (owner): (1) pi passes the module live theme
proxy (theme.js:641-648) as the factory theme arg (interactive-me.js:2179)
— rendering with mod.theme then setThemeInstance(B) then re-render yields
B's ANSI with no re-open; (2) TUI.invalidate() calls every open overlay's
.component.invalidate() (tui.js) — a width-keyed cache in a correct
component cannot go stale; (3) setThemeInstance fires onThemeChangeCallback
and interactive-mode invalidates + requests render — the re-render chain
is complete without extension code; (4) setWidget(string[]) never
colorizes — "the widget carries token codes" is only satisfiable via
zero-ANSI assertion or the function form; (5) export HTML while the
council theme is active resolves themeName to undefined →
getResolvedThemeColors(undefined) → loadThemeJson("<in-memory>") thrOWs
"Theme not found" — must be documented;/ fix is pi's; (6)
getResolvedThemeColors("pi-council-light") returns the SHIPPED UN-MERGED
palette — the NAME-1 boundary; (7) onThemeChange is a single-slot
(callback replaced) — the extension must never call it (would break pi's
repaint loop); (8) the parent-dir fs.watch + basename filter + debounce
fires exactly one setTheme per save even under an editor's rename-burst;
(9) reload {noop} (section removed) keeps the last theme with NO pi
settings write (ui.setTheme never called — EV-3 zero-mutation holds); (10)
getResolvedThemeColors("pi-council-dark") stays equal to EV-1's shipped
map after EV-4.

#### principal — cross-cutting reframe

The card's live-repaint frame is partially backwards: showExtensionCustom
invokes factory(this.ui, theme, this.keybindings, close)
(interactive-mode.js:2188) with the module-level Proxy (theme.js:644-653,
get reads globalThis[THEME_KEY] at property-access time);
setThemeInstance (theme.js:689-696) swaps the global, sets
currentThemeName="<in-memory>", fires onThemeChangeCallback; pi's own
re-theme of an open component is ui.invalidate() →
updateEditorBorderColor() → requestRender (interactive-mode.js:761-764).
So CouncilTree/Transcript theme fields are live proxies, not snapshots.
The only baked-ANSI state is CouncilTree.cached, cleared by invalidate()
(navigator.ts, wired into the overlay contract) and by the 2s refresh
timer. The modal does NOT capture at open.

Ruling 2b collides with NAME-1: getResolvedThemeColors(name) resolves
name ?? currentThemeName ?? default and calls loadThemeJson(name)
(theme.js:836-839), which throws for any registered theme without
sourcePath and throws "Theme not found: <in-memory>" for the in-memory
name. getThemeExportColors try/catches and returns {}. The merged palette
is only in globalThis — reachable via the Proxy and NO name-lookup-based
API. The extension already holds the resolved pallevo
itself (resolveThemeColors(withThemeColorFallbacks(merged.colors),
merged.vars)) — missing only the unexported ansi256ToHex (theme.js:826).
setWidget's plan clause governs the string-array overload; the factory G
overload ((tui, theme) => Component, types.d.ts:98-100) is rule-
compliant. RPC mode drops factory-form widgets (rpc-mode.js:123-131:
"factory functions are ignored") — a themed widget silently no-ops
headless. Off-transition gap: revert "off" mid-session has no way back to
the user's custom settings theme without the string branch of
ui.setTheme (writes settings) or a non-public loadThemeFromPath — nobody
owns that seam.

Reframe: (1) this card is mostly "make the already-present live repaint
provable and audit it" — the test is the deliverable that pins the
contract; (2) re-scopse ruling 2b: getResolvedThemeColors(name) is
implementable only as a council-owned resolvedPalette() helper, never via
pi's name-lookup; HTML export palette + /settings registration are pi-
limitations (document + follow-up), not getResolvedThemeColors". The
watcher's off and block→activate transitions need specifying before any
watcher code.

Testable claims (principal): (1) a fake theme whose tokens read a mutable
binding, rendered once through the modal override, shows the new token tag
after invalidate()+render with no re-construction; (2) CouncilTree.cached
is the sole stale-ANSI state and is already cleared by both invalidate()
and the 2s refresh timer; (3) getResolvedThemeColors() no-arg throws after
setThemeInstance and getResolvedThemeColors("pi-council-dark") returns
the unmerged EV-1 palette; (4) string-array/notify paths (widget
index.ts:88-107, /council-jobs 252-263) contain zero \x1b[ bytes;
(5) a factory-form widget is TUI-only (dropped in rpc-mode); (6) reverting
activation "off" mid-session has no code path today that restores a
user's custom settings theme without settings mutation — the watcher spec
must close this.

#### designer: human-centered

Three additive pieces: (1) wire the repaint loop to CouncilTree.invalidate()
so cached content lines repaint on theme switch (the cache trap
navigator.ts:120,148 — cached lines survive a theme change because width
does not change; without this the user sees a HALF-PAINTED modal: new
border+backdrop, stale rows); (2) convert renderWidget (index.ts:89-108)
to the function form so the seat name shows in accent, running state in
success, timeout flag in warning, last-event tail in dim — bounded color,
 evaluated by glance, <200ms scan vs ~600ms plain; (3) an fs.watch on
<cwd>/.council.json that re-derives the merged Theme and re-calls
setTheme(instance) (ruling: shipped file edits are silent no-ops;
.council edits must repaint live). /council-jobs and /council-init stay
plain notifies.

Gulf of Evaluation: at session start and every subsequent switch, the
user's question is "did the theme apply?" — answered by a visible repaint;
without (1) a half-painted overlay is the worst-case gulf (a wrong state
presented as correct); without (3) the documented "live" expectation is
silently violated.

Designer's falsifiable predictions: P1 light accent (#5a8080) over
customMessageBg (#ede7f6) WCAG luminance ≥3:1 (≈3.6 by hand); P2 dark
accent (#febc38) over customMessageBg (#2a2530) ≈8.5 (passes); P3 the
token-only grep audit finds matches only in the whitelisted comment
(extensions/navigator.ts:24-26) and test fixtures; P4 cache-stale probe —
the CouncilTree rendered with theme A then B returns A for the CONTENT
lines until invalidate() clears the cache (the load-bearing fix); P5
TranscriptView already recomputes every render(recaches); P6 HTML export:
getResolvedThemeColors with the in-memory active returns the shipped
palette (not the merged), or ## triangles; P7 a function-form widget
rebuilds on invalidate and repaints when the watcher fires; P8 watcher
calls instance setTheme, never string — settings.json byte-identical;
P9 no-foreign-ANSI: every ANSI byte sequence across modal/viewer/widget is
one of the theme's getFgAnsi/getBgAnsi outputs; P10 watcher fires exactly
once per debounce-stable write; P11 (taste, lowest rank) light-mode
selection could gets bg selectedBg highlight instead of fg-only accent.

Designer preferences: (d.i vs d.ii) /settings registration — prefers
showing the merged instance under a sentinel name so the user can see "what
is active" (d.ii — display nothing — is the safer fallback if the
settings list misbehaves); product-owner rules. Sentinel name
"pi-council-active" on the merged instance so getResolvedThemeColors
returns the right palette for export — unless product-owner reads EV-3
literally and forbids; fallback is an extension-side wrapper bypassing pi's
name API. Widget coloring intensity (accent/success/error/dim) is taste;
the binding constraint is no-foreign-ANSI (P9).

### Round 1 — facilitator verification note

The exported path is verified real on pi 0.84.2: agent-session.js
`exportToHtml` resolves themeName via [options.themeName,
settingsManager.getTheme()].find(getThemeByName !== undefined) — using
settings leaf unset/"light/dark" yields undefined → exportSessionToHtml →
generateHtml → generateThemeVars(undefined) → getResolvedThemeColors
(undefined) → currentThemeName "<in-memory>" → loadThemeJson throws
uncaught "Theme not found: <in-memory>" (export-html/index.js:71-102,
agent-session.js:2695). /export under an active council theme currently
fails; the shipped "pi-council-dark"/light" names stay resolvable. This
is a genuine epic-visible regression entangled with ruling 2(b).

### Round 2 — bounded exchange (owner, principal, designer)

(Owner's first round-2 job stalled at 4 turns with no output; re-dispatched
once with identical input per facilitator dispatch discipline — settled.)

#### owner (round 2, source-pinned)

D1 no repaint bug exists: setThemeInstance fires onThemeChangeCallback
(single-slot, theme.js:706-717); pi's only registration is ui.invalidate()
+ updateEditorBorderColor() + requestRender (interactive-mode.js:761-765);
TUI.invalidate() iterates the whole overlayStack calling
overlay.component.invalidate() (pi-tui/tui.js:429-434); the council overlay
wires invalidate: () => tree.invalidate() → cached = undefined, so the next
compositeOverlays frame re-renders against the live Proxy. The 2s timer is
belt-and-braces. The designer's half-pint is false of the WIRED overlay.
Deliverable = pinning test; if red, the seam (navigator.ts invalidate
wiring) is the bugfix — test before code. D2: function form invoked exactly
once per setWidget call and stored (interactive-mode.js:1733-1735);
invalidate() never re-invokes it; worse: rpc-mode drops factory widgets
entirely (rpc-model.js:123-131) — taking the function form downgrades every
headless session from plain-widget-lines to NO widget at all: a functional
regression, not a taste trade. Plain strings stay; /council-jobs plain.
D3: sentinel dead on three grounds — (1) NAME-1; (2) registry: a registered
theme without sourcePath THROWS at loadResultThemeJson
("does not have a source path", theme.js:467-469) and an in-memory instance
has no sourcePath (writing a temp JSON breaks EV-3 zero-on-disk); (3) worse
than dead: a sentinel would appear in /settings and selecting it routes pi
through the string branch → settings write with no file. Designer's d.ii
(display nothing) is the only safe posture. resolvedPalette (merge→resolve→
ansic256ToHex copy) is the deliverable for "carrying the council palette."
D4/export: verified path freezes — agent-sessions exportToHtml resolves
themeName from [options.themeName, settings.getTheme()].find(getThemeByName
!== undefined), undefined under active council theme → getResolvedThemeColors
(undefined) → currentThemeName "<in-memory>" → loadThemeJson throws (uncaught
in export-html:191). No extension interception scan exists. In-scope
deliverable: a pinning test asserting loadThemeJson("<in-memory>") throws +
 documentation + pi-side follow-up. Watcher: uniformly impl-settled — arm
only when config exists; parent-dir fs.watch + basename + re-arm on
rename; 250ms debounce last-write-wins; activate → setTheme(instance);
block → notify-only; noop/removed → keep last theme + warn (zero-write is
EV-3's binding rule, not a re-openable product question); malformed →
notify + stay armed; never watch settings.json; unref+close on shutdown.
Only open contact: severity-tracking the /export crash as a follow-up.

Owner's runnable tests: D1 wired-overlay setThemeInstance(B)+invalidate()+
same-CouncilTree-same-width re-render → B's accent ANSI; D1b without
invalidate → cached A-ANSI (isolates the seam); D2 renderWidget
string[] + /council-jobs join contain zero \\x1b[; D3
getResolvedThemeColors("pi-council-") equals the shipped file map
(regression); D4/export loadThemeJson("<in-memory>") throws (pins the
limitation); D4 watcher reload path rules (noop → no setTheme; malformed →
notify + still armed; one valid save → one reload).

#### principal (round 2)

The repaint case is free: ctx.ui.setTheme(instance) → instance branch →
setThemeInstance (fires callback) + notifyChanged (second invalidate),
zero settings write (interactive-mode.js:1946-1954; theme-controller.js:66-
71). onThemeChange is single-celled; owner #7 holds. Export is broken in
TWO modes, not one: crash when the leaf ∈ {undefined,"light/dark"}
(getResolvedThemeColors(undefined) → loadThemeJson("<in-memory>") throws)
AND silent un-merged palette when the leaf ∈ {"light","dark"} (resolves to
the builtin, exporting colors the council never merged).
materializeTheme passes no options, so the instance has both name and
sourcePath undefined — name-lookup can never reach it (theme.js:466-477
:e for brand). Shared blind spot: widget re-paint path — owner's #4 (freeze
until next setWidget) vs designer's P7 (rebuilds on invalidate) asserted
opposite facts about the same region; neither cited renderWidgetContainer;
insist on a test over prose. Resolutions: D1 drop "cache-bug" frame —
deliverable is the contract probe (render A → setThemeInstance(B) →
invalidate → re-render; assert B ANSI on the same overlay); no wiring ships
unless the probe fails; contingency keyed cache on (width, theme) stays
DOCUMENTED-only. D2: GGAp function form is compliant; plain strings ship
(zero-ANSI assert); color contingent on the repaint test. D3 dead-not-
fallback: NAME-1 AND theme.js:466-477; resolvedPalette + shipped-name
regression + two-mode export doc + follow-up. D4: own correction —
off-revert is NOT strictly blocked: loadThemeFromPath is exported and on our
PiThemeModule surface, so live off-revert is technically possible without a
settings write, but re-opens custom-pair resolution. Product-owner chooses:
keep-last + warn/restart (safer) vs live off-revert (more code/risk).
block→activate: implementation can settle via re-read-each-fire.

#### designer (round 2)

Converges on D1 (no live half-paint; the probe is the contract pin;
contingency if a future cached component lacks the hook), D2 (drop the
colored widget — owner round-1 asserted the freeze, principal confirmed the
headless no-op; a stale frozen-color widget after a switch is costlier than
the <group> gain; keep plain strings; the choice is functional, not taste),
D3 (the sentinel remains a collack; resolvedPalette(variant) is the
surface; NAME-1 honored). Holds on /settings registration (d.i vs d.ii)
product-owner; holds on D4 off/block - transitions (cover rulings); new
P7-critical falsifiable test: does a factory widget's render get re-invoked
on theme switch (empirical hinge — if yes, function form back in play;
if no, plain strings win); theme P6 two-part: (a) getResolvedThemeColors()
no-arg under in-memory returns the SHIPPED palette (NAME-1 boundary),
(b) council-owned resolvedPalette(variant) returns the merged hex map.
P1/P2 contrast (light #5a8080-on-#ede7f6 ≈ 3.6; dark #febc50-on-#2a2530 ≈
8.5); P3 zero-ANSI grep; P4 cache-stale probe load-bearing; P5 transcript
no-cache repaint; P8 watcher zero settings-mutation; P9 no-foreign-ANSI;
P10 watcher-once; P11 light-bg-selection taste, lowest.

Designer product-cover rulings: (1) /settings — d.i sentinel (dead with
NAME-1 per both seats) vs d.ii display-nothing (safe) vs a council-owned
"what is active" footstated; (2) off-transition — keep-last-warn-restart vs
live off-revert; (3) block → activate: one-shot arm with freeze-on-block vs
de-redecide. Preference: keep-last + warn; unaperture d-in; one-shot arm.
Taste ranked last: widget recolor (only if P7 flips), light-mode
selection bg, footer phrasing.

### (Round 3 does not run — positions converged after round 2; the two
standing open items are routed after the Skeptic + Consolidator passes.)

### Round 3 — Skeptic attack (step 4)

One Skeptic dispatch, full deliberation record. It attacked the live-repaint
chain, the export crash, the no-ANSI audit, the widget semantics, the name
surfaces, and the watcher assumptions — running probes against the REAL pi
theme module (deep-import) plus a read of the pi source. Verdict: ALL 17
objections closed-green; NO open objections.

A. Live repaint (proxy → setThemeInstance → invalidate → same-instance
re-render shows new ANSI) closed-green, positive + negative probe. B.1
HTML export crash: getResolvedThemeColors() no-arg after setThemeInstance
throws "Theme not found: <in-memory>" closed-green. B.2 export wrong
palette: settings "light"/"dark" resolve to the builtin (accent
#8abeb7) not the council palette (#febc38) closed-green; B.2c "light/dark"
leaf → getThemeByName undefined → themeName undefined → crash closed-green.
C no-ANSI audit closed-green (only the whitelisted comment). D.1
setWidget(string[]) never colorizes closed-green; D.2 factory invoked once
per setWidget, stored, NOT re-invoked on invalidate closed-green (code
analysis of setExtensionWidget/renderWidgetContainer). E.1 isLightTheme
("pi-council-light") === false; E.2 registered-without-sourcePath throws;
E.3 getThemeByName("pi-council") undefined — all closed-green. F.1-F.6
watcher-forward assumptions (loadThemeConfig absent → undefined; activate
idempotent; malformed → notify no-crash; enabled:false → noop; block →
notify-ish; zero settings writes) all closed-green. 7 onThemeChange
single-slot, extension never calls it closed-green. P5 TranscriptView no-
cache closed-green.

Skeptic ran: full suite 203 pass / 2 skip / 0 fail + tsc clean before and
after its probes (probe files deleted after use). Facilitator re-verified:
bun test 203 pass / 2 skip / 0 fail, bunx tsc --noEmit clean, no probe
strays in test/, validate.py clean.

New objections: none. No open objection survives to step 5.

### Round 4 — Consolidator synthesis (step 5)

Settled (table of 10 disputes with the Skeptic test that closed each): live
repaint = pinning test not code; sentinel/name surfaces dead (NAME-1 +
registry-throws-without-sourcePath + would drive the string branch);
widget + /council-jobs + /council-init plain text (acceptance = zero-ANSI
assertions); watcher spec as in round 2; export = pi-limitation,
documented + follow-ups; onThemeChange pi-owned. Open objections: NONE
(17/17 closed-green).

OPEN JUDGMENT — the consolidator buckets exactly two items, both routed to
product-owner (I cannot dispatch ruling seats; ESCALATION below):

1. OFF-TRANSITION (section removed / enabled:false mid-session). The EV-3
zero-settings-write binding does NOT settle it: owner argued keep-last is
forced because de-activation needs ui.setTheme(string) (a write), but
principal corrected — exported loadThemeFromPath is on the PiThemeModule
surface, so live off-revert is technically possible with ZERO writes (it
merely re-opens custom-pair resolution). Two options, both zero-write:
   A (owner): keep the last materialized theme + warn + document
   restart-to-revert. Simpler, safer; stale palette till restart.
   B (principal): live off-revert to the user's prior/settings theme via
   loadThemeFromPath; zero writes; re-opens custom-pair resolution and
   adds code/risk. Designer prefers A (taste-ranked, holds for ruling).
2. COUNCIL-OWNED STATUS SURFACE (the "what is active" affordance). The
   pi-owned /settings half is SETTLED (nothing to rule: sentinel is dead
   under NAME-1, would drive the string branch). Only the council-drawn
   half is open:
   A) display nothing (designer d.ii — safe).
   B) a council-owned one-line status (e.g., footer/notify "theme:
      pi-council-dark (in-memory)") reading the instance directly —
      answers "did the theme apply?"; a thin removable layer + a wording
      decision. Owner/principal attests neither for nor against; designer
      raised it.

### Step 6 — routing (facilitator): ESCALATION to product-owner

Both items are open-judgment with no settling test, per consolidator
buckets. Per <escalation_contract>: the facilitator never dispatches
product-owner / steward; a resumption with the ruling will continue from
here. Packet carries positions and test results as facts only (no
recommendation).

### Step 6 — RULING RECEIVED (product-owner, verbatim; immutable for the run)

BINDING RULING (product-owner, verbatim):

RULING 1 (off-transition): Position A — keep the last materialized theme,
warn via notify, and document that reversing to the user's prior theme
requires a restart. Do NOT implement live off-revert (Position B) — it
re-opens EV-3's strict-whitelist block predicate and the custom-pair resolution
question for a marginal UX win.

RULING 2 (council-owned status surface): Option A — display nothing. Do
NOT add a one-line council-drawn status surface reading the materialized
instance. The live repaint itself is the answer to "did the theme
apply?".

Both rulings applied under <escalation_contract> step 1 as binding;
recovery of the card resumes from the settled design in Rounds 1–4 with
these two rulings folded in. Proceed to step 7 (write the spec) with no
re-opened disputes.

## Step 7 — spec (989a2c4)

Settled design written to `docs/superpowers/specs/2026-08-25-EV-4-design.md` (commit `989a2c4`). The card was set In Progress in the prior run's step 7 and handed to one owner on branch `feat/ev4-theme-compliance` (worktree `/tmp/pi-council-ev4`).

## Step 8 — owner implementation (RECOVERY RESUME)

The owner's implementation was interrupted by a provider error after committing `95f6d24` (`resolvedPalette` + `ansi256ToHex`) with the watcher/tests/docs left uncommitted. Recovery resumed from durable state and completed the implementation per spec §7–§8 (docs §10), fixing strict-tsc type errors left by the interrupted owner passes:

- `extensions/theme-watcher.ts` (new): `.council.json` mid-session watcher — parent-dir `fs.watch` + basename filter, re-arm on rename, ~250ms last-write-wins debounce, `close()` lifecycle (unref+close on shutdown); decision table — malformed → notify + stay armed, section removed/`enabled:false` → keep-last + warn (RULING 1, no `setTheme`, zero settings writes), present → reuse `activateTheme` (activate/block); never watches `settings.json`.
- Wired into `extensions/index.ts` (`session_start` arm after `activateTheme` gated on `loadThemeConfig` existing; `session_shutdown` close); extracted pure `widgetLines`/`jobLines` builders (behavior-preserving, plain strings, zero-ANSI).
- Tests (new): `theme-repaint` (live-repaint pinning: positive same-instance no-reopen, negative no-invalidate, proxy-trace, transcript P5), `theme-compliance` (zero-ANSI widget/jobs, no-foreign-ANSI modal/viewer P9, grep-audit-as-unit-test P3), `theme-watcher` (arm-no-reload, one-load-per-rename-burst, malformed-stays-armed, settings.json-ignored, removed-keeps-last RULING 1, close idempotent), `theme-resolved-palette` (ansi256ToHex vectors, resolvedPalette equality + numeric-hex + config-override/repoRoot read).
- Extended `PiThemeModule` with pi's `theme` Proxy + `setThemeInstance` (the extension itself never calls them; tests drive the real TUI swap).
- Docs: README "Live theme editing" note + HTML-export regression note (pi-side).

Gates verified locally on PR head: `bun install --frozen-lockfile` clean; `bunx tsc --noEmit` clean; `bun test` 224 pass / 2 skip / 0 fail; `python3 council/validate.py` all artifacts valid.

Branch `feat/ev4-theme-compliance` pushed; **PR #6 opened** (head SHA `78a844b`), base `main`. State → `In Review` per step 8 (observed: PR open — not gated on an owner report). Next: Skeptic verify (step 9).

## Step 9 — Skeptic verify, cycle 1 of ≤3 (BLOCK)

Skeptic verified PR #6 (job settled in 3.8m, 25 turns). Ran the full gate set on the PR head, all green (`bun install` clean; `bunx tsc --noEmit` clean; `bun test` 224 pass / 2 skip / 0 fail; `python3 council/validate.py` all valid). Probed every implemented claim: watcher §7 (6 tests), RULING 1 keep-last (no setTheme on removal), RULING 2 no status surface, zero-ANSI-no-hex widget/jobs/modal/viewer, live-repaint pinning (4 tests), resolvedPalette/ansi256ToHex §4, zero-settings-write — **7 closed-green**.

**ONE block (objection #8, `open-untested`):** the spec §3.5/§10 require a **pinning test** asserting the HTML-export crash — `getResolvedThemeColors(undefined)` / `loadThemeJson("<in-memory>")` throws "Theme not found". The owner documented the limitation (README) but never wrote the test; no test asserted the throw. Per step 9, card returned to In Progress and the specific item handed back to the owner.

**Cycle-1 fix:** added `test/theme-export-pinning.test.ts` — after `setThemeInstance(materializeTheme(dark))`, the no-arg `getResolvedThemeColors()` throws `/Theme not found: <in-memory>/`, pinning the documented pi-side regression (fix is pi's, filed as follow-up; never implemented here). Re-ran gates: `bunx tsc --noEmit` clean, `bun test` 225 pass / 2 skip / 0 fail, `python3 council/validate.py` all artifacts valid. Pushed to the branch (new head `66aab25`). State → In Progress during the fix. Next: Skeptic re-verify at head `66aab25` (cycle 2).

## Step 9 — cycle 2 (re-verify): ALL GREEN

Skeptic re-dispatched at head `66aab25` (settled in 1.4m). Re-ran the full gate set: `bun install` clean; `bunx tsc --noEmit` clean; `bun test` 225 pass / 2 skip / 0 fail; `python3 council/validate.py` all artifacts valid. Objection #8 now closed-green — the export crash is PINNED by `test/theme-export-pinning.test.ts` (asserts `toThrow(/Theme not found: <in-memory>/)` after `setThemeInstance`), and the Skeptic verified the gate is real by inverting it to `not.toThrow` → RED naming the exact error. All 8 objections closed-green, **no open objections**. Verify loop used 2 of ≤3 cycles. State → In Review (PR open). Next: judge (step 10).

## Step 10 — judge PASS

Judge dispatched with ONLY the card goal + Skeptic evidence (1.7m). **PASS** — re-ran the decisive evidence on the branch: live-repaint pinning (4 tests), compliance (6), watcher (6), config/activation/resolvedPalette (54), export crash pinned, full suite 225 pass / 2 skip / 0 fail, tsc clean, validate clean. The goal — council-drawn elements draw from pi theme tokens and repaint on mid-session theme change — is met and verified.

## Step 11 — deterministic merge gate

Five criteria checked at head `66aab25`: (1) owner gates green; (2) `gh pr checks 6 --json name,state,workflow` → `gates` workflow `state: SUCCESS` (keyed on `workflow`, not name); (3) no blocking Skeptic objection (all 8 closed-green); (4) judge PASS; (5) no Needs Human / outstanding ruling (in Review; step-6 rulings applied). All five hold. Merging with `gh pr merge 6 --match-head-commit 66aab25…` (criterion-2 SHA) — a mismatch would HALT, not retry.

## Step 12 — merge landed + CI green on merged SHA; DONE

PR #6 MERGED (merge commit `7eae545cccba9d57945871cbee70a66c4d1fe2b5`) via `gh pr merge 6 --merge --match-head-commit 66aab25c5c335b4f8239240ceb78bef8b920831d`. Local main fast-forward sync to `7eae545`. Observed artifact: the `gates` check on merged commit `7eae545` reports `completed success` (CI green on the merged SHA). State → **Done** per step 12 (observed artifact, not a seat report). Follow-ups below.

## Step 13 — follow-ups (drafted for the orchestrator to confirm + file; neither is implemented here)
- **FLLWUP — HTML export under in-memory themes (pi-side fix).** In scope per spec §10: either make `getResolvedThemeColors` fall back sanely under `<in-memory>`, or make `exportSessionToHtml` resolve the settings leaf through the user's path. Criterion: `/export` no longer crashes (throwing `Theme not found: <in-memory>`) under an active council theme; currently documented + pinned by `test/theme-export-pinning.test.ts`.
- **FLLWUP — council-owned "what is active" surface (blocked by RULING 2).** Filed for a future epic that lifts RULING 2 (display nothing now); the live repaint is the “did it apply?” answer.
