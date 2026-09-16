---
id: EPIC-9
title: Provider-error retry with exponential backoff under a .council.json policy
state: Backlog
owner: null
epic: null
goal: Council invocations survive transient provider errors by retrying with exponential backoff under a policy set in .council.json, instead of the session stopping.
---

## Intent

A provider error ends the run today. The cheapest fix — a hub-side backoff
loop for seat children — does not fix the reported failure, because that
failure is a parent-turn error that pi classifies as non-retryable and that
no hook can re-issue. The epic therefore front-loads the mechanism falsifier
(is an automatic resume even reachable from an extension?) and treats the hub
retry as the second, easier half.

The work crosses four seams. The retry decision — what counts as retryable,
given that pi's shipped pattern list does not match the error class in the
intake. The policy surface — a new top-level `retry` sibling in the committed
`.council.json`. The two execution paths — a seat child subprocess the hub
owns, and the parent turn's own provider call, which council does not. And the
run substrate — manifests, the inline job tree, and usage accounting, which
must distinguish attempts from dispatches and still sum honest spend.

`transient` is load-bearing. The classification predicate is where the
boundary against permanent errors is drawn, and it cannot be inherited from
pi's default list.
