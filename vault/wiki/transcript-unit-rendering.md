---
title: Transcript Unit Rendering
type: concept
summary: How the inline progress transcript renders each tool call and its own result as one composed unit — the R-COPY head `→ <Tool>  <primary-arg>`, the indented result body, the `muted "✗"` failure suffix — and why the parser had to carry call identity and the error bit first.
aliases: [tool call unit, composed unit, transcript rendering, R-COPY, unitLines]
tags: [pi-council/concept, pi-council/surface]
sources: ["[[2026-09-15-epic8-run-ledger]]"]
created: 2026-09-15
updated: 2026-09-15
---

# Transcript Unit Rendering

The contract EPIC-8 shipped for the `/council-tree` inline progress transcript:
**one tool call and its own result render as a single composed unit**, not as
two unrelated flat lines. Supersedes the pre-EPIC-8 presentation in
[[run-transcripts]] / [[council-job-tree-inline]], where `parseTranscript`'s
blocks were rendered as separate `→ <tool>` (warning) and `⎿ <tool> · <bytes>b`
(muted) heads.

## Why the data layer came first (EV-33)

EV-33 (`transcript-block-fidelity`, commit `186c04dc`) established the
prerequisite: `TranscriptBlock` (`extensions/transcript.ts`) carries
**`toolCallId`** and **`isError`** — both present in the session JSONL but
previously discarded — so a consumer can pair every `toolCall` with **its own**
`toolResult` by identity even when two same-named calls' results arrive out of
order. Positional `call[i]→result[i]` pairing passes a naive demo but fails the
identity fixture; that falsifier is the card's proof.

The same card collapses the duplicated primary-argument derivation to **one
exported accessor** in `transcript.ts`, consumed by the tree row's
`/ran <tool> <arg>` copy (`test/ev7-council-tree-widget.test.ts`) and, from
EV-34 on, the transcript head. product-owner ruled (job-6) that EV-33 satisfies
its goal by *exporting* the accessor; the header consumer is EV-34's scope. A
goal can describe a post-epic endpoint — breaking the identity, not the
accessor, is the failure mode.

## The rendered unit (EV-34, R-COPY)

Commit `72351780`. The unit is composed in `unitLines`/`bodyLines`
(`extensions/navigator.ts`); `blockLines` is left behind as dead code
(FLLWUP-36). The vocabulary, binding for the run:

```
collapsed:  → Bash  ls -la
expanded:   → Bash  ls -la
              ⎿  total 12
failed:     → Bash  rm -rf /tmp/x  ✗
empty:        (waiting for output · idle)
```

- **Head** — `→ <Tool>  <primary-arg>`, tool name plus the single accessor's
  summary. The head is the only thing shown when the block is collapsed.
- **Result body** — indented 2 spaces beneath the head, revealed on `e`
  (the collapsed/expanded distinction `test/navigator.test.ts` asserts).
- **Failure** — a trailing `muted "✗"` suffix, distinct from the `warning` token
  already carrying the call; `warning` cannot also mark failure without losing
  the distinction.
- **Empty state** — `(waiting for output · idle)` (and `(no transcript)` when
  there is no file), so a still-running seat reads differently from a broken
  one.
- **Legacy fallback** — blocks with no identity/error fields still render
  without throwing, proven by a second fixture.

## Constraints that shaped it

- **Token-only drawing** (AGENTS.md 9.6, [[council-theme]]): `warning`, `muted`,
  `accent`, `dim`, `bold` only; no literal hex/ANSI.
- **The web taste skill does not transfer literally** — `minimalist-ui`'s
  palette, spacing, and motion have no vehicle under token-only drawing, an
  integer row floor ([[one-row-floor]]), and a pure line slice. The transferable
  half is typographic/structural hierarchy and color scarcity; see [[designer]].
- **The modal path stays out of scope** (R-MODAL; legacy, guarded at
  `navigator.ts:57`, owned by FLLWUP-4).

## Related

- [[one-row-floor]] — the one-row line reuses this composed head + failure suffix
- [[honest-keymap]] — the header/keys that operate on the unit
- [[council-job-tree-inline]] — the surface this renders into
- [[run-transcripts]] — the substrate and parser this extends
- [[council-theme]] — the token-only rule
- [[designer]] — the minimalist-ui transfer-limit lesson
- [[steward]], [[product-owner]] — the seats that ruled the follow-ups/residuals

## Sources

- `vault/raw/2026-09-15-epic8-run-ledger.md`
- `council/cards/EV-33.md`, `council/cards/EV-34.md`
- `extensions/transcript.ts`, `extensions/navigator.ts`
- `test/ev34-tool-unit.test.ts`, `test/ev7-council-tree-widget.test.ts`