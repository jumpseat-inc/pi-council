---
id: FLLWUP-110
title: Cache hit/miss counts in the human-readable usages summary
state: Backlog
owner: null
epic: EPIC-15
goal: A non-offline run of council/skills/usages/scripts/usages.py prints, in its human-readable summary, a line matching cache: hits=<N> misses=<M> whose N and M equal the parsed JSON report's cache.hits and cache.misses for the same run.
---

## Intent

`human_summary()` prints the per-seat rows and the account line, but the cache
hit/miss counts live only in the JSON report. The person reading the printed
summary therefore gets no positive feedback that the cache machinery worked —
the "reruns are cheap" promise ([[usages-report]]) is invisible exactly where
the person looks. The designer raised the gap across two deliberation rounds;
the product-owner ratified it as a **separate** card (EPIC-15 R4 is binding: it
must not be folded into BUG-2). This is the run-time human summary, distinct
from the declined cache-health `.md` report row (a different surface).

## Acceptance

- A test runs the tool (offline or against the stub) and asserts the printed
  human-readable summary contains a line matching `cache: hits=<N> misses=<M>`
  whose `N` and `M` equal the parsed JSON report's `cache.hits` and
  `cache.misses` for the same run.
- `bun test test/usages.test.ts`, `bunx tsc --noEmit`, and
  `python3 council/validate.py` pass.