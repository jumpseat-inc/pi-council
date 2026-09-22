---
id: FLLWUP-106
title: The usages procedure forbids inventing framing around the tool's stderr
state: Backlog
owner: null
epic: EPIC-15
goal: council/procedures/usages.md instructs the agent to surface every non-empty stderr line from usages.py verbatim, with no added prefix such as a warning glyph and no invented cause, and to state only what the line itself reports.
---

## Intent

`council/procedures/usages.md` says to surface the tool's printed summary and
its `!` limitation lines verbatim, but it does not classify a non-`!` stderr
line. In the run behind this epic, the warning `usages: could not write cache: …`
was wrapped in an invented `⚠️ One non-fatal issue:` prefix with an appended
cause and likelihood the procedure never authorized. The gap outlives the
specific warning: once the cache-ordering bug is fixed, the next non-`!` stderr
line can be framed the same way. This card makes the verbatim rule explicit and
routes system-status signals into the limitations block instead of an invented
narration.

## Acceptance

- A paragraph appended after `council/procedures/usages.md`'s `**Report.**`
  section: any non-empty stderr line is quoted verbatim; no `⚠️`/`!` prefix is
  added to a line that does not itself carry one; no cause, consequence, or
  "non-fatal issue" count is asserted beyond what the tool printed;
  system-status signals are described as uninterpreted tool output.
- The paragraph names the intake's own failure mode as the worked example —
  the seat wrapped `usages: could not write cache:` in `⚠️ One non-fatal issue:`
  and appended an invented likelihood — so the rule is pinned to a real case,
  not an abstraction.
- A mechanical pin in `test/` asserts the procedure contains the literal `⚠️`
  in a prohibition context and the phrase `verbatim` for stderr, so the rule
  cannot be dropped silently.
- `council/procedures/usages.md`'s existing `!`-limitation sentence and the
  `OPENROUTER_MANAGEMENT_KEY` hard-gate paragraph are unchanged; the edit is
  additive, and `bun test test/procedures.test.ts` (or the procedure-count pin
  covering registration) stays green.