---
id: FLLWUP-34
title: Bounded retry policy for a failed usage-store write
state: Backlog
owner: null
epic: EPIC-17
goal: A failed usage-store write with a retryable error such as EACCES is retried according to a documented bounded policy before the pending entry is dropped, and an automated test asserts the retry count and the final notify on exhaustion for a fixture failure.
---

## Intent

EV-31's spec permits a caught write failure to drop the pending entry after a
single notify (≥1 notify carrying the absolute target path, no retry). That is
acceptable at the current spec, but a transient `EACCES` or a momentarily
unwritable directory silently loses a spend record. This card decides whether
a bounded retry is wanted and implements it if so.

## Acceptance

- A fixture failure that clears within the retry policy persists the record and
  does not notify failure.
- A fixture failure that persists exhausts the bounded policy, emits the
  failure notify with the absolute target path, and drops the pending entry.
- `bun test`, `bunx tsc --noEmit`, `python3 council/validate.py` stay green.
