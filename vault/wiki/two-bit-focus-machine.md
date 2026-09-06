---
title: Two-Bit Focus Machine
type: concept
summary: The modal key-handling pattern from EV-27 — a level carries two bits (searchActive × inputFocused), Esc routes on inputFocused (clear-and-stay in the input, level-ascend elsewhere), and an unstated third key (Down) transitions focus out to make the Esc-elsewhere branch reachable.
aliases: [focus machine, two-bit state machine, search focus]
tags: [pi-council/concept, pi-council/surface]
sources: ["[[2026-09-05-epic6-run-ledger]]", "[[2026-08-26-po-ev8-ruling]]", "[[2026-09-06-epic6-close-run-ledger]]"]
created: 2026-09-05
updated: 2026-09-06
---

# Two-Bit Focus Machine

The key-handling pattern EV-27 shipped for the [[council models picker]]'s
search input — and the general shape for any modal that grows a focused
sub-input inside an existing level. The insight: **focus is a sub-state
of the level, not a mode**, so it needs its own bit — a one-bit design
(`searchActive` alone) makes "Esc clears the query" and "Esc ascends the
cascade" indistinguishable, and one of the two behaviors breaks
non-vacuously.

## The two bits

- **`searchActive`** — the search row exists at this level.
- **`inputFocused`** — keystrokes are query input, not list navigation.

Routing table at the model level:

| Key | `inputFocused` true | `inputFocused` false |
|---|---|---|
| printable (incl. `/`) | append to query | — |
| Backspace | delete one trailing character (BUG-1; no-op on empty query) | no-op |
| Down/Up | move list cursor **and** clear `inputFocused` | move cursor |
| Esc | clear query, **stay focused** | ascend to provider level (pre-existing) |
| Enter | confirm selection; search state never zeroed | confirm selection |

⚠️ **Superseded 2026-09-06:** EV-27 pinned backspace as a guard-only
no-op with "Esc-clear is the sole deletion mechanism". BUG-1 (PR #28
`c1406138`) superseded that: backspace now has its ordinary meaning on
the focused, non-empty row of the table above — same two-bit machine,
same guard ordering (`matchesKey(data, Key.backspace)` before the
printable decode), one more consequence per press. The original EV-27
ruling text is preserved in the EPIC-6 card records; this table is the
current contract.

The **Down-clears-focus** transition is the pattern's crux: it is the
unstated key that makes the "Esc elsewhere" branch reachable while the
search row is visible. The intake only names `/` (open) and Esc (clear);
the machine needs a third edge nobody asked for — discovered in
deliberation, not in the intake.

## Design rules that came with it

- **Dual-meaning keys route on a bit, never on heuristics.** The Esc
  clause ("Esc clears the search input text") is a one-key-two-meanings
  contract; three readings existed (clear-text / dismiss-input /
  exit-search) and only the bit design makes the ruled reading
  (clear-and-stay, per the intake's literal text) coherent with the
  preserved level-ascend.
- **The trigger key is captured by construction.** `/` opens search mode
  *and* is a legal query character (`qualifiedId` values contain `/`);
  handler ordering — search-mode interception before the fall-through
  `/` trigger — means the same character is context-routed, never
  excluded.
- **Signify focus, don't imply it.** The `▌` (U+258C) cell at column 0
  reuses the EV-8 signifier precedent ([[2026-08-26-po-ev8-ruling]]
  ruling 3) so the person can see which bit is set; the empty-input
  affordance hint (`/ filter · esc clears`) names the trigger and the
  clear key in the ruled footer's middot idiom.
- **Never zero search state on a committing action.** Enter advances with
  the query preserved ("search state clears" = the search row is not
  part of the confirm screen, not a wipe) — backing out of confirm
  restores the exact filtered view.
- **The filtered row list has one source.** `currentRows()` returns the
  filtered set so windowing, cursor clamps, and `resolveSelection()` read
  the same list; the render-cache signature must include both bits and
  the query, or equal-shaped results (`claude` → `claud`) serve stale
  frames.
- **The not-yet-searched state is an affordance too.** The pre-press hint
  line (`press / to filter models`, BUG-1) renders below the model rows
  while search has never been opened in the current modal-open — the
  machine's third render state, invisible in the routing table because it
  is the state before any bit is set — and dismisses at the first `/`
  press, returning on the next fresh entry (no session persistence).
  It carries no `▌`: the signifier appears in no non-search state.

## Related

- [[council models picker]] — the surface that runs this machine
- [[echo-then-run]] — why selection stays byte-verbatim through the filter
- [[2026-08-26-po-ev8-ruling]] — the ▌ signifier precedent
- [[2026-09-05-epic6-run-ledger]] — the run that shipped it
- [[2026-09-06-epic6-close-run-ledger]] — the run that completed it

## Sources

- [[2026-09-05-epic6-run-ledger]]
- [[2026-09-06-epic6-close-run-ledger]]
- `extensions/model-picker.ts` (EV-27 + BUG-1 implementation)
