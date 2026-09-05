---
id: FLLWUP-14
title: Kitty-protocol terminal smoke for the model search input
state: Backlog
owner: null
epic: EPIC-6
goal: A documented smoke procedure drives `/council-models` in a live terminal by delivering `/` and printable keystrokes as CSI-u kitty-protocol sequences, and the observed frames show the search input opening, filtering, and Esc-clearing per the ruled copy set, with the procedure and expected frames recorded for re-execution.
---

## Intent

Filed from EV-27's delivery (owner-named follow-up, designer prediction 6):
the unit suite proves the modal's state machine *given bytes* — it pins
`decodeKittyPrintable("\x1b[47u")` → `/` and driven `handleInput` walks —
but no test exercises the real CSI-u delivery path from a kitty-protocol
terminal through pi's input pipeline into the modal. This card adds a
smoke procedure (manual or harness-driven, the deliberation decides) that
runs `/council-models` in a live kitty-protocol terminal, sends the
trigger and a query as CSI-u sequences, and compares observed frames
against the ruled copy set (`▌ / filter · esc clears`, the no-match
literal, the unchanged footer). State is Backlog because the delivery
shape — a documented manual procedure versus a pty-driven automated
harness — is an open design question for deliberation.

## Acceptance

- The procedure, when executed, produces recorded output showing: `/`
  (as `\x1b[47u`) opens the search input; typed CSI-u printables narrow
  the list; Esc clears the query per the ruled semantics.
- Expected frames are documented against the ruled copy set, byte-exact.
- The existing unit-level kitty decode tests remain the CI gate; the
  smoke is the live-path falsifier and does not gate ordinary CI.
