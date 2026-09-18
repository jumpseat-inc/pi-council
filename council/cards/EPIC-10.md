---
id: EPIC-10
title: Fewer follow-up cards by merging near-duplicates, and unattended wiki ingest at every run completion
state: Backlog
owner: null
epic: null
goal: Council runs emit fewer follow-up cards by merging similar or technically-close ones, and every /council completion and every /features-deliver run autonomously ingests its run and learnings into the vault wiki, escalating judgment calls to the ruling seat rather than offering or silently dropping the step.
---

## Intent

The two asks are one disposition problem, and the intake's framing — while sound in what it asks for — under-slices the mechanism. At run close a surfaced item has two possible dispositions: **work** (a deferred task with a goal and a merge → a follow-up card, deduped and merged) or **knowledge** (a fact, pattern, or decision → the run's ingest, autonomously). Today step 13 sends *everything* to the card path (council.md:314–316) and step 14 merely *offers* the knowledge path (council.md:331–333); the two rules never reference each other. Doing either ask alone is unsafe: shrink card emission without a durable home for learnings and run knowledge is lost; add autopilot ingest without the classification and the wiki becomes the new over-emitting sink.

Three concrete consequences of the reframe:

1. **Name the classification, not just a merge rule.** The step-13 change is "classify before drafting: knowledge to the run's ingest, near-duplicate work merged into one card" — a merge rule alone leaves the knowledge path unpopulated.
2. **The unattended ingest is a second ingest class, not the removal of the human steer.** `vault/CLAUDE.md:54` and the `ingest-discussion` fixture gate are correct for a human-curated source; the run's ledger is a different class whose takeaways are derivable from the record. Deleting the steer from the general operation would degrade the human-sourced path and break the fixture that models it.
3. **Card the capability separately from the trigger sites.** Because `council.md` is shared by both execution modes, a capability change and a wiring change fail independently and must be deliberated against different authority maps (container: no ruling-seat dispatch, four-tag report; orchestrator: owns the human relationship, serializes cards).
