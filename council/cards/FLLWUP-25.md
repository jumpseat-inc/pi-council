---
id: FLLWUP-25
title: Wiki source page matches AGENTS.md hard-conventions count
state: Ready
owner: null
epic: EPIC-6
goal: The vault wiki source page summarizing AGENTS.md's hard conventions matches the current AGENTS.md — counting the conventions exactly as the file lists them, including clause #13 added by FLLWUP-24 — proven by a driven or scripted consistency check between the page and the file, with no behavior change anywhere in the gate set.
---

## Intent

Filed from FLLWUP-24's delivery (council-runner report): FLLWUP-24 added
hard-convention clause #13 to `AGENTS.md` (local gate evidence trusted only
after `council/preflight.sh` passes, re-run-over-skip formulation). The
wiki source page `[[2026-08-23-agents]]` summarizes the file as "12 hard
conventions" and its count is now stale — the repo lists 13 with the 9.5/9.6
sub-entries. This card is doc-sync maintenance created by this run's own
change: refresh the wiki source page via the wiki-ingest skill's procedure
(`vault/` is never hand-edited — the page update goes through the ingest
pass, not manual edits), so the wiki and `AGENTS.md` agree.

The consistency check is the testable artifact — a scripted comparison that
the page's convention count and list match `AGENTS.md`'s actual convention
headings, failing when they drift. This keeps the staleness class closed by
construction rather than by vigilance. Filed under EPIC-6 per the run's
standing orchestrator directive; surface is documentation only.

## Acceptance

- The wiki source page's hard-conventions summary matches `AGENTS.md`'s
  current convention list (count and content), refreshed via the
  wiki-ingest procedure rather than hand edits.
- A scripted consistency check between the page and `AGENTS.md` exists and
  is green; it fails if the two drift again (red-honesty proven by a
  deliberate temporary drift in the check's own test, then restored).
- No behavior change: the full gate set stays green (`bun test`,
  `bunx tsc --noEmit`, `python3 council/validate.py`), and
  `council/check-pi-drift.sh` is untouched.
