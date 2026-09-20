---
id: EPIC-14
title: Reuse `.council.json` to enable the decisions gate; add a `/council-gate` toggle; check the OpenRouter credential when the gate is on
state: Backlog
owner: null
epic: null
goal: Reuse the committed `.council.json` as the decisions gate's enable surface instead of a separate gate policy file, add a `/council-gate` command to enable/disable jev for decisions, make preflight fail loud when the gate is on and no OpenRouter credential resolves, and fold or retire the overlapping EPIC-13 follow-up cards.
---

## Intent

The decisions gate (EPIC-13) is enabled today by a separate
`council/gate/policy.json`, while the repo already has a committed per-seat
`.council.json`. This epic moves only *enablement* into `.council.json` as a
reserved top-level `gate` section (the `theme`/`retry` sibling pattern), keeps
the `typesafe/jev-1.13` model pin and the decisions endpoint as code constants
enforced in `gate-run.ts`, and keeps `questions.json`/`decision.json` as tuning
data under EV-72 pre-registration. It adds a `/council-gate` command to toggle
the mode and makes preflight name the credential remediation when the gate is
on.

## Acceptance

The gate can be enabled/disabled by a single committed `.council.json` edit and
by `/council-gate`, both round-trippable with no other top-level key mutated;
`loadGateConfig` is the one resolver all three runtime mode readers
(`gate-tool.ts`, `gate-route-tool.ts`, `gate-route.ts`) use; preflight fails loud
with both remediations when the gate is on and no credential resolves; every
EPIC-13 follow-up in `FLLWUP-71…80` is folded, retired, or recorded out of scope
— none silently dropped.