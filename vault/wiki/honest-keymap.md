---
title: Honest Keymap
type: concept
summary: A surface's advertised keys must actually be honored — the EPIC-8 bug where the progress transcript's header advertised e/t/f/g while the key gate used raw byte equality instead of matchesKey, so kitty/modifyOtherKeys CSI-u forms silently forwarded to the editor draft.
aliases: [keymap honesty, honest keymap, key matching, matchesKey, CSI-u keys]
tags: [pi-council/concept, pi-council/surface]
sources: ["[[2026-09-15-epic8-run-ledger]]"]
created: 2026-09-15
updated: 2026-09-15
---

# Honest Keymap

**A key the header advertises must have well-defined behavior, and the keys that
change a rendered line must be asserted to.** This is EV-35's goal, and the
principle that made its biggest defect visible: the inline progress transcript's
header named `e`, `t`, `f`, `g`/`G`, but the production key gate did not honor
four of them on every terminal.

## The bug class

`classifyProgressKey` (`extensions/focus-nav.ts:67-70`) routed `e`/`t`/`f`/`g`
with **raw byte equality** — `data === "e"`, `data === "t"`, etc. — while every
other key in the tree used `matchesKey`, pi's terminal-protocol-aware matcher.
Under the kitty keyboard protocol / modifyOtherKeys, those keys arrive as
**flag-1 CSI-u sequences** (`\x1b[101u` for `e`, `\x1b[116u` for `t`,
`\x1b[102u` for `f`, `\x1b[103u` for `g`). The raw comparison missed them, the
gate returned `"other"`, and `routeEditorFocus("other")` **forwarded the bytes
into the editor draft** — the advertised key did the wrong thing, silently. The
repo's own `smoke/search-smoke/driver.py` models exactly this CSI-u class, so
the failing terminals were already in the test surface.

The fix is four lines: replace the raw comparisons with `matchesKey` calls,
matching the rest of `classifyProgressKey`. The defect was a **fold-in** to
EV-35 (product-owner, job-12 Q1) — the goal's honesty claim was already false on
smoke-tested terminals, so no goal amendment was needed.

## Why it is a class, not one bug

- **The bug lives in the gap between the advertised contract and the matcher.**
  The header copy is interface; the key gate is behavior; a copy claim with a
  divergent matcher is a header that lies. This is the same family as
  [[echo-then-run]] — never assert on the screen what the code cannot compute /
  does not honor.
- **Raw byte equality is the anti-pattern.** `matchesKey(data, Key.x)` handles
  protocol variants (kitty, modifyOtherKeys, legacy sequences); `data === "x"`
  handles only the legacy case. Use the matcher everywhere a key is routed.
- **The regression guard is the advertised set itself.** EV-35's Acceptance
  requires a `handleInput`-driven test per advertised key (boundary clamps are
  asserted no-ops), so a future header addition without a matching behavior
  fails. The tester is protocol-shaped, not literal-byte-shaped.

## The ruled header (R-KEYMAP)

```
<title> — ↑↓ move · e expand · t thinking · f follow(on) · g/G jump · esc back
```

Follow-off is **presence/absence**: `f follow(on)` when `follow === true`,
`f follow` (no suffix) when false — no `(off)` token, no `dim`/`accent` styling,
because on the non-color pty surface the pty smoke uses, `dim "(off)"` and
`accent "(on)"` shade alike and the presence/absence form is the stronger
non-color signal (product-owner, job-12 Q3). `g`/`G` are advertised, not
removed; `g`/`G`, arrows, Enter, and Esc were already correct.

## Related

- [[council-job-tree-inline]] — the tree/progress surface whose keys this governs
- [[two-bit-focus-machine]] — the broader modal key-routing pattern
- [[echo-then-run]] — the same "surface must not lie" family
- [[transcript-unit-rendering]] — the surface the keys operate on
- [[skeptic]] — the seat that ran the CSI-u falsifiers
- [[one-row-floor]] — the follow/nav reconciliation that decides which line the keys act on

## Sources

- `vault/raw/2026-09-15-epic8-run-ledger.md`
- `council/cards/EV-35.md`
- `extensions/focus-nav.ts`, `extensions/navigator.ts`
- `test/ev35-transcript-interaction.test.ts`