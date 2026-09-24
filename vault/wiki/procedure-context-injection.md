---
title: Procedure Context Injection
type: concept
summary: EV-90 (EPIC-23) — the council-runner dispatch input is composed from the renderProcedure-substituted bodies of council.md and features-deliver.md, removing the per-cold-start re-read; $ARGUMENTS is not one value across the two bodies (card id in council.md, epic key in features-deliver.md), so the composer binds two args.
aliases: [procedure injection, dispatch pre-injection, composeRunnerInput, pre-injected procedure]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/epic23]
sources: ["[[2026-09-24-epic23-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-24
---

# Procedure Context Injection

Every `council-runner` opens its turn by reading `council.md` and
`features-deliver.md` from disk before doing anything — 714 lines, a median
**~260 s** orientation per card ([[run-time-profile]]), paid again on every
escalation resumption. `buildSystemPrompt` appends only the *directory path*
(the `<council_runtime>` block) to a seat; the procedure bodies are never
injected, and `renderProcedure` was used solely by the parent slash-command
handler.

## What EV-90 ships (EPIC-23, merged `14f244f`)

The `council-runner` dispatch **input** is composed from the
`renderProcedure`-substituted bodies of `council.md` and `features-deliver.md`,
and the seat's `<procedure>` block says "your dispatch input already carries…"
rather than instructing a read. Constraints the deliberation settled:

- **Per-file, override-first body resolution** across the declared procedure set
  — not a `proceduresDir` join ([[override-resolution]]).
- Composition at the **guarded `hub-tools.ts` `council_dispatch` call site
  only** — not in `buildSystemPrompt`/`buildChildArgv`/`dispatch.ts`, or eval
  cells would inherit it.
- **Verbatim task append**; the composed input is byte-identical to
  `renderProcedure`'s output for the same args.
- **Two-args binding.** `$ARGUMENTS` is **not one value** across the two bodies:
  it is the **card id** in `council.md` but the **epic key** in
  `features-deliver.md`. The composer binds both (a `card_id` parameter plus the
  epic derived from the card face).
- `renderProcedure`'s substitution set (`$COUNCIL_PROCEDURES`, `$ARGUMENTS`) and
  `buildSystemPrompt`'s block order stay unchanged — consume the renderer, add no
  token ([[procedure-commands]], FLLWUP-112).

## The operator surface

This is a **transcript-surface** change, not a copy change: `/council-tree`
previously opened a runner with `Read council.md` / `Read features-deliver.md`,
and after EV-90 those reads are gone — the first visible actions are deliberation
dispatches ([[council-job-tree-inline]]).

## Derived-key posture (D1)

`cardEpicKey` derives the epic from the card face's `epic:` field. When it is
null or missing the dispatch **fails loud (throws), naming the card** — see
[[derived-key-refusal-posture]]. An un-substituted `$ARGUMENTS` in operative
context would fail the goal; an omitted `features-deliver.md` overlay would strip
the run's authority map.

## Related

- [[council-runner]] — the container whose cold start this removes
- [[procedure-commands]] — the scan/render path the composer consumes
- [[override-resolution]] — per-file override-first resolution
- [[run-time-profile]] — the ~260 s cold start measured
- [[derived-key-refusal-posture]] — the D1 null-epic ruling
- [[execution-mode-recording]] — the other ROOT-dispatch/wiring surface

## Sources

- [[2026-09-24-epic23-run-ledger]]
- `council/cards/EV-90.md`, `extensions/hub-tools.ts`, `extensions/seats.ts`