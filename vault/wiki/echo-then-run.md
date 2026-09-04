---
title: Echo-Then-Run
type: concept
summary: The house forcing function for destructive or committing actions — quote the exact resolved selection back and require one confirming Enter before acting; the echo and the executed write are the same object by construction.
aliases: [echo then run, confirm echo, echo-then-run confirmation]
tags: [pi-council/concept]
sources: ["[[2026-09-04-design-ev20-round2]]", "[[2026-09-04-epic5-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Echo-Then-Run

The Council's settled confirmation pattern for committing actions,
established by EV-20's `/council-eval` ("echo the resolved matrix before
any cell spawns") and reused by EPIC-5's modal picker: at the confirm
step, the screen quotes the **exact tuple that will be written** —
resolved through the *same* function the write uses
(`resolveSelection()`), so the confirmed tuple and the executed tuple
are identical by construction, not by convention. One extra Enter
commits; Esc backs out. Ruled over a two-Enter confirm in EV-23's J-1
sub-ruling: one keystroke, matching the shipped `/council-eval`
precedent — the forcing function lives in the quoted echo, not in
repeated confirmation.

## The non-assertive echo rule

The echo must **never assert state the screen cannot compute**. The
modal's echo says `— thinking unchanged` only when it genuinely wrote no
thinking value — it asserts "this screen wrote no thinking value," never
"a level was preserved," because the writer seam (FLLWUP-10) means the
modal cannot always compute what the merge will preserve. An echo that
claims more than the write does is the same class of dishonesty as a
missing signifier. Corollary: when an echo quotes post-merge effective
state, it must quote the *effective* value, never a blank.

## Why it works

- **Slip protection** — a destructive or irreversible action (a write to
  a committed config file) gets a preview at the moment of commitment;
  the person confirms what they saw, not what they assumed.
- **Echo == write by construction** — testing the echo tests the write
  payload; the key-handling test asserts `onConfirm` fires exactly once
  with the echoed tuple.
- **Copy honesty** — the echo lines double as documentation of the
  write's timing ("takes effect at the next dispatch").

## Related

- [[council models picker]] — the modal confirm application
- [[council config writer]] — the write being confirmed
- [[designer]] — the forcing-function doctrine this implements
- [[2026-09-04-epic5-run-ledger]] — the J-1 sub-ruling (one Enter vs two)

## Sources

- [[2026-09-04-design-ev20-round2]] — the original echo-then-run precedent
- [[2026-09-04-epic5-run-ledger]]
