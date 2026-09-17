---
id: FLLWUP-45
title: Navigator attempt-awareness for retried dispatches
state: Backlog
owner: null
epic: EPIC-9
goal: A retried dispatch's attempt transcripts are reachable from the navigator, and the backoff row's label matches the attempt it denotes.
---

## Intent

Three items produced by EV-42's shipped per-attempt substrate: per-attempt
transcript browsing is currently unreachable, `navigator.ts:869`'s
`openTranscript` path resolves `manifest.id` rather than an attempt's session,
and the live backoff row's tail-versus-label mismatch sits at
`navigator.ts:335/405/430`. One subject, one file — steward dispositioned them
as a single `Backlog` residual.
