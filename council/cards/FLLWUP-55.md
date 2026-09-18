---
id: FLLWUP-55
title: Collapse the smoke driver's private pty screen model onto the shared kit
state: Ready
owner: null
epic: EPIC-9
goal: smoke/search-smoke/driver.py consumes the shared pty screen model instead of carrying its own class Screen/class Session, with the release gate's pinned-pi isolation and the README's stdlib-only claim preserved or explicitly amended.
---

## Intent

FLLWUP-49's goal scoped its universe to `test/` plus `ev43/`, so
`smoke/search-smoke/driver.py`'s own `class Screen`/`class Session` (the fourth
definition, O4) was left untouched and named as a bounded residual — the
`steward` FLLWUP-49 ruling called that "a scoping decision matching O4, not a
permanent portfolio acceptance". This card is that residual: decide whether the
smoke driver can import the shared kit without coupling the release gate (which
installs a pinned external pi 0.84.3) to a `test/` module that resolves the
dev-installed pi, and without falsifying `smoke/search-smoke/README.md`'s
"authored in the driver" claim. If it cannot, the card's deliverable is the
recorded rationale plus an amended README claim — not a forced share.

Approved by `product-owner` (job-29) as-is from FLLWUP-49's step-13 draft.
