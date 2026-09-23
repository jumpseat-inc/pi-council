---
id: FLLWUP-67
title: Wiki pages for the refresh path — hop chain, scaffold-copied resources in override-resolution, non-clobbering companion
state: Backlog
owner: null
epic: EPIC-20
goal: The wiki documents the FLLWUP-50 refresh surface's grounding: a hop-chain page stating which bytes a consumer executes vs which the installed package supplies at runtime (procedures from PK_ROOT unless overridden; validate.py, _template.md, preflight.sh from the consumer copy frozen at init — with validate.py's ROOT-from-__file__ coupling named as the reason it is not overrideable); [[override-resolution]]'s table gains the scaffold-copied resources (validate.py, _template.md, preflight.sh — and the scaffold.json record type) with their override tiers; [[non-clobbering-scaffold]] gains the companion "what to do when non-clobbering is the wrong path" section naming /council-update, the tooling/data classification, and the consent posture; [[preflight]]'s overstatement (derivation claim and the absent check-pi-drift.sh reference) is corrected — authored via /wiki-ingest, never hand-edited under vault/.
---

## Intent

Filed by the FLLWUP-50 step-13 record (EPIC-9 residuals run 2). The
deliberation surfaced five wiki gaps, all recorded as follow-ups owed, none
PR-blocking (designer round-1 gaps (a)(b)(c); principal round-1 wiki-gap
list; skeptic O8 confirmed the preflight bytes):

1. **No page carries the hop chain** — which bytes a consumer executes vs
   which the package supplies at runtime. [[non-clobbering-scaffold]]
   covers only the copy rule. (Principal round-1: "the largest gap".)
2. [[override-resolution]]'s table omits `validate.py`, `_template.md`,
   `preflight.sh`, and does not say *why* `validate.py` is not
   overrideable (the `ROOT`-from-`__file__` coupling; skeptic O3
   empirically confirmed the false-green generator) — a reader concludes
   oversight rather than design consequence. The FLLWUP-50-merged
   `scaffold.json` record type needs its convention line's wiki mirror.
3. [[non-clobbering-scaffold]] has no companion for "what to do when the
   non-clobbering path is the wrong path" — i.e. the refresh surface,
   its tooling/data classification, and the consent posture that merged
   in FLLWUP-50.
4. [[preflight]] overstates what a consumer receives: it declares
   derivation from `council/scaffold/council/preflight.sh` and lists the
   lock-drift tripwire as a check, but the scaffold copy has no
   `check-pi-drift.sh` reference and the script is not in the scaffold
   tree (skeptic O8: 6 diff hunks between root and scaffold copies).
5. Nothing records the fixture seed trees as shipped `validate.py`/
   `_template.md` copies — the parity obligation (10-copy pins, 16
   `seed.treeDigest`s) lives only in tests and card records; it should be
   a standing hazard page or section (owner round-1 wiki-gap #2).

Per the run's standing rule the wiki is authored through `/wiki-ingest`,
never hand-edited under `vault/` (step-14 discipline).

## Origin

FLLWUP-50 steps 2–3 (designer round-1 "Open judgment calls #6" and "What
the wiki does and does not cover"; owner round-1 and round-2 wiki-gap
lists; principal round-1 "Wiki gaps"), consolidator §1 ("recording, not
authoring"), skeptic O8.
