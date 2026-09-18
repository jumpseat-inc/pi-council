---
id: FLLWUP-66
title: Per-file refresh (--refresh-file <path>) for data-class scaffold files, preflight.sh first
state: Backlog
owner: null
epic: EPIC-9
goal: A consumer with an adapted council/preflight.sh (data-class: reported-only today) has a documented, consent-gated command path to pull a single named scaffold file from the installed package — `--refresh-file <path>` on /council-update or equivalent — with the same backup + diff-shown + per-file accept consent posture FLLWUP-50 shipped for the tooling class, the data-class write prohibition lifted only for the explicitly named file, and the set-equality classification guard extended (or documented) so the named-file exception cannot widen implicitly.
---

## Intent

Ordered by FLLWUP-50's step-6 record: owner's open item 1 ("`preflight.sh`
v1 treatment: report-only + documented manual `cp` (my recommendation) vs.
ship `--refresh-file <path>` now") was ruled **later card** — PO R1: "The
`--refresh-file <path>` follow-up is owner territory at a later card; not
v1." V1 shipped the report-only posture plus the documented manual `cp`
support story (merged `6e35355`); this card is the adoptable upgrade for
exactly the file class where staleness is expected (the consumer is told
to adapt `preflight.sh` — its own header says so — so its copy drifts by
design and the manual `cp` from the installed package is the only v1
remedy).

Design constraints inherited from FLLWUP-50's settled surface: the write
is consent-gated with diff shown and a timestamped backup (same posture as
`~ diverged`); the data class stays never-written by default — the
exception is per named file, per invocation, never batch; the tooling/data
classification and its set-equality guard stay the shipped constant's
home; `scaffold.json` record semantics for a data-class file pulled this
way need a ruling (record the new digest as pristine, or leave data-class
files unrecorded — owner's call at plan time, product-owner confirm).

## Origin

FLLWUP-50 step-5 synthesis §2.8 (named in the record with no route
claimed); step-3 owner round-2 ("`--refresh-file <path>` … stays open,
unrouted urgency"); PO R1 ("not v1" — a later card).
