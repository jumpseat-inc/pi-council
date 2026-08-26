---
title: EV-4 Round 1 — Designer Audit (Compliance and Repaint)
type: source
summary: The designer's first-pass audit of EV-4 — a token-only surface map, the CouncilTree.cached stale-lines repaint trap, the widget function-form theme coloring, the in-memory HTML-export gap, and falsifiable predictions P1–P11 on contrast and repaint.
aliases: [design-ev4, ev4-round1, theme compliance audit]
tags: [pi-council/theme, pi-council/source]
sources: ["[[2026-08-25-design-ev4-round1]]"]
created: 2026-08-25
updated: 2026-08-25
---

# EV-4 Round 1 — Designer Audit

The design seat's first-pass audit for EV-4 (Theme compliance and live repaint
of council surfaces). A code audit of what draws what, then five decisions and
falsifiable predictions. **Position only; the product-owner ruling (RULING 1/2)
and EV-4's settlement override several proposals.**

## The audit

- `/council-tree` modal is token-only already: backdrop `customMessageBg`,
  border `border`, cursor `accent`, hints/overflow `dim`, header `bold`.
  **But `CouncilTree.render` memoizes on width (`this.cached = {w, lines}`)** —
  the standing repaint bug: a theme switch while the modal is open does NOT
  re-render unless something invalidates the cache. Border/backdrop recompute
  per render (live proxy), so they repaint; **content lines stay in the old
  palette**. This is the cache-stale meta-trap.
- `TranscriptView.render` does NOT memoize → repaints automatically.
- `renderWidget` uses the **string form** of `setWidget` (plain text). The
  factory form `(tui, theme) => Component` is the path that gives widget lines
  theme-token access and repaints automatically.
- `/council-jobs` and `/council-init` use multi-line plain `ui.notify` —
  keep plain (pi styles the whole block; per-line token color not possible).
- HTML export gap: `getResolvedThemeColors()` is name-based; under in-memory
  activation `currentThemeName === "<in-memory>"` → falls through to pi's
  **built-in** dark palette, not the merged instance. (→ FLLWUP-1.)

## Claims and predictions

- **Contrast (P1/P2):** light accent `#5a8080` on `#ede7f6` ≈3:1 (borderline
  WCAG 1.4.11); dark accent `#febc38` on `#2a2530` ≈8.5 (high).
- **Cache-stale probe (P4, load-bearing):** border/backdrop repaint but
  unselected rows stay in the old palette unless `tree.invalidate()` is wired
  to `onThemeChange`. **Worse than no repaint** — a half-painted modal reads
  as a bug.
- **Token-only grep (P3/P9):** assert every emitted ANSI byte is a
  `getFgAnsi`/`getBgAnsi` output of the materialized instance; no foreign ANSI.
- **Widget (P7):** function form repaints on theme switch.
- **No-settings mutation on repaint (P8).**
- **Watcher fires once per write (P10).**
- **Preference (P11):** light-mode selection could use `selectedBg` bg
  highlight for the focus row.

## Rulings referenced (from the EV-4 escalation)

The product-owner ruling (recorded in the EV-4 settlement) decided:
- **RULING 1 (off-transition):** keep last materialized theme + warn notify;
  **no live off-revert** (would re-open the custom-pair predicate).
- **RULING 2 (status surface):** display nothing; the live repaint is the
  answer to "did it apply?" — no sentinel-name `/settings` row, no footer.

The designer's **d.i sentinel name + `/settings` row** proposal and the
HTML-export streaming were **deferred to follow-ups**, not built in EV-4.

## Related

- [[council-theme]] — the subsystem EV-4 enforces compliance for
- [[run-transcripts]] — the modal/transcript surfaces the audit covers
- [[2026-08-25-council-tree-modal]] — the v0.11.4 modal this builds on
- [[product-owner]] — the ruling seat that settled RULING 1/2

## Sources

- `vault/raw/2026-08-25-design-ev4-round1.md`
- `extensions/navigator.ts`, `extensions/index.ts`, `extensions/theme-activation.ts`
- `themes/pi-council-dark.json`, `themes/pi-council-light.json`
- `extensions/theme-watcher.ts`, `test/theme-{compliance,repaint,watcher,export-pinning}.test.ts`