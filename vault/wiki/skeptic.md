---
title: Skeptic
type: entity
summary: The Council's formal adversary and sole evaluator — assumes every claim is broken until a test demonstrates otherwise, and has standing to block a card.
aliases: [skeptic seat]
tags: [pi-council/seat]
sources: ["[[2026-08-23-pi-council-design-spec]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-17-po-fllwup47-step6-ruling]]"]
created: 2026-08-23
updated: 2026-09-20
---

> ⚠️ Derived from `council/agents/skeptic.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-flash-0731:high`.
**Tools:** Read, Grep, Glob, Bash (no Write — must not build, only attack).
**MCP tools:** `[context7, tavily]`.
**Superpowers pointers:** systematic-debugging, writing-plans,
verification-before-completion.

## Role

The **sole formal adversary** — one per card, never more. It attacks every other
seat's position during deliberation, then verifies the owner's implementation on
the branch. It exists to close the gap that no assigned seat is positioned to
protect: the shared blind spots of a single model run.

## Objections and fairness

- The Skeptic files only **falsifiable objections** — each must name the concrete,
  runnable settling test (a test file, a data import and an expected count, a request and
  an expected response).
- When it raises an objection, it **runs the settling test itself**. If a test
  passes and the objection was wrong, it says so plainly (`closed-green`).
- It has **standing to block** a card on red or unverified items.

## Verdict recording

Reports use status terms: `closed-green` (test ran, passed), `closed-red` (test
ran, failed), `open-untested` (falsifiable, not yet run). The consolidator and
judge consume these.

## Completeness charter, scoped (v0.15.0)

In `/features-new`'s [[three-wave-decomposition]], the wave-2 skeptic attacks
completeness **only in falsifiable form** (stub-satisfiability, unfalsifiable
output formats, Ready-vs-Backlog bar) — observational missing-child arguments
belong to [[principal]]/[[designer]] in their native formats. The EPIC-3
smoke run verified the scoping held under parallel dispatch — every objection
falsifiable, none observational (see [[2026-09-04-epic3-run-ledger]]).
The scoping keeps the skeptic's attack runnable without stretching its
charter into the other seats' observational territory.

Since v0.18.0 the seat body carries a `<main_repo_immutability>` block
([[main-repo immutability]]), and step-9 skeptic dispatch inputs are
pinned to the verification subject — PR head SHA + head worktree path —
plus the loop frame ([[verification-subject pinning]]); FLLWUP-19's own
skeptic dispatch was the pattern's first live demonstration.

Since FLLWUP-47 (2026-09-17) the seat body also carries the
`<red_base_convention>` block — bracketed by
`<!-- red-base-shared-start/end -->` markers, byte-identical to the
owner's copy — adjacent to `<verify_by_acting>` and the `<output_format>`
block, and the field vocabulary is required inside `<output_format>` by a
judge-reachability pin. On [[red-base evidence]] the skeptic derives the
two-class mechanism-absent boundary (never the owner) from the raw red
output's per-failure lines + transplant identity + base identity, carries
it in the evidence row, and treats a reproduction that compares counts
without first checking comparability as defective verification.

## Related

- [[seats]], [[council-loop]], [[consolidator]]
- [[owner]] — the opposite pole the Skeptic acts on
- [[engineering-board]] — the verification gate it powers
- [[council-config]] — default model/thinking override
- [[verification-subject pinning]] — the step-9 dispatch-input contract
- [[red-base evidence]] — the two-class boundary the skeptic derives and
  carries in its evidence row
- [[2026-09-17-po-fllwup47-step6-ruling]] — R1 (skeptic-derives-only) and
  R5 (the judge-reachability pin scope)
- [[2026-09-06-epic6-close-run-ledger]] — the immutability + subject pinning

## Sources

- `council/agents/skeptic.md`
- `council/procedures/council.md`
- [[2026-09-04-epic3-run-ledger]] — the completeness-charter scoping verified in the EPIC-3 smoke run