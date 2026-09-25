---
title: Batch Runner Topology
type: concept
summary: The EPIC-25 human override of /features-deliver's one-runner-per-card mandate — a single council-runner handles N cards, the owner implements all N before any skeptic or judge runs, and the batch rides one branch/PR/squash-merge on the recorded Verify lane.
aliases: [batch runner, multi-card runner, one runner many cards, batch topology, owner-first batch]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/hub]
sources: ["[[2026-09-25-epic25-run-ledger]]"]
created: 2026-09-25
updated: 2026-09-25
---

# Batch Runner Topology

The stock `/features-deliver` mandate is **one `council-runner` per card**, and
the board is single-writer, so runners never overlap. EPIC-25 exercised an
explicit **human override** of that mandate: a **single runner for all N cards**,
with the owner doing all N first and the skeptic + judge running only afterward,
all on **one branch, one PR, one squash merge**.

## The shape (EPIC-25)

- **Entry:** a recorded Phase-1 topology override (P1-1: one runner, owner-first;
  P1-2: one branch/PR/merge). This is a human decision, not an inference from
  the autonomy mandate — the authority map has no "custom runner topology" row,
  so it was front-loaded in Phase 1.
- **Harness mechanics:** `council_dispatch` still *requires* a `card_id` and
  composes `council.md` for that one card. The override lives in the dispatch's
  `<task>` tail, which states that the rendered single-card framing is
  superseded and names the five in scope. The runner follows the task.
- **Lane:** no `principal`/`designer`/`consolidator` are seated, so the recorded
  ROOT mode is **Verify** and `readCardMode`'s generator-seat upgrade does not
  fire ([[execution-mode-recording]]).
- **Merge:** all N cards' bases key to the same head/merged SHA; criteria 3 and
  4 are the single skeptic and judge covering all N goals
  ([[deterministic-merge-check]]).

## Why it can be attractive

- **One cold start, one board writer, one PR/CI run** for a batch of small,
  well-specified, independent cards (the EPIC-25 five were docs, test pins,
  fixture repair, and an engine-test guard).
- **Owner-first** keeps all implementation in one context, and defers
  verification until the whole batch is committed — a cost-amortising order for
  a coherent residuals epic.

## What it costs / risks

- **The owner phase is the long pole and unsteady.** EPIC-25 used four owner
  dispatches (one stalled, two cancelled at their ceiling, one completed) and
  ~4h wall for five cards; the dispatcher's stall window still has to exceed the
  longest child wait ([[hub-job-supervision]], [[run-time-profile]]).
- **Single-writer pressure.** One container is the writer of N card faces and
  the board at once; EPIC-25's owner violated the branch single-writer rule and
  the facilitator had to revert it ([[main-repo-immutability]]).
- **A weaker per-card contract.** One judge verdict and one skeptic objection
  set cover N goals, so a REJECT is not naturally attributable to one card; the
  card-level granularity the per-card runner gives up is the price.
- **Board mechanics are still per-card.** The runner moved five card faces and
  five board lines, which is where the [[engineering-board]] heading-uniqueness
  gap surfaced.

## When to reach for it

A batch of small, independent, low-ambiguity residuals where the human wants to
trade per-card verification granularity and a longer owner phase for fewer
containers and one merge. It is **not** the default: it is an explicit Phase-1
override, recorded before dispatch, because nothing in the authority map
authorises it by inference.

## Related

- [[council-runner]] — the single container that runs the batch
- [[deterministic-merge-check]] — the Verify check over one SHA and N cards
- [[execution-mode-recording]] — the recorded Verify lane
- [[engineering-board]] — the per-card board mechanics under a batch
- [[hub-job-supervision]], [[run-time-profile]] — the owner-phase cost
- [[main-repo-immutability]] — the single-writer pressure

## Sources

- [[2026-09-25-epic25-run-ledger]]
- `council/cards/EPIC-25.md` §Phase 1 rulings, `council/agents/council-runner.md`