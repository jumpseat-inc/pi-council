# Wiki Log

## [2026-09-24] ingest | EPIC-23 autonomous run — the gate inert at read-back

Ingested the EPIC-23 `/features-deliver` run (authored
`vault/raw/2026-09-24-epic23-run-ledger.md`). EV-89 (Phase 1 class-enumerated
rulings record) and EV-90 (pre-injected procedure context) shipped (PRs
#112/#113, merged `593f6ed`/`14f244f`) and EPIC-23 closed `Done`. The central
finding: the decision gate was inert **at read-back**, not at the live call —
`resolveRoute` drops every recorded decision because the writer stamps
`policy.policyVersion` (`gate-policy-1`) and the reader compares
`decision.json`'s `version` (`gate-decision-1`), so both cards fell back to a full
Deliberate roster and the `Direct`/`Verify` fast paths never fired (FLLWUP-99).
Also: an undefined HALT repair (owner window overrun), the recurring
DONE-with-held step-13 drift, the D1 derived-key ruling, the closed-enumeration
admin authorization, and the run-time audit that motivated the epic.

- **Created:** sources/2026-09-24-epic23-run-ledger; [[run-time-profile]],
  [[phase1-rulings-record]], [[procedure-context-injection]], [[halt-repair-gap]],
  [[derived-key-refusal-posture]].
- **Updated:** [[inert-gate-fallback]] (added the read-back arm),
  [[metered-deliberation-routing]], [[record-push-discipline]],
  [[deterministic-merge-check]], [[execution-mode-recording]], [[council-runner]],
  [[procedure-commands]], [[confirmation-authority]], [[step-13-followup-surface]],
  [[follow-up-backlog-curation]], [[engineering-board]], [[index]].
- **Contradictions flagged:** [[inert-gate-fallback]] — not contradicted, but its
  stated cause was incomplete: it named only the live-call-failure arm; EPIC-23
  adds an independent read-back (`policyVersion`) arm, now recorded in the page.
  No other contradiction; the run **confirms** [[deterministic-merge-check]],
  [[record-push-discipline]], and [[confirmation-authority]].

## [2026-09-23] ingest | FLLWUP epic grouping — the curate → group pipeline and the close-out epic

Ingested the follow-up epic grouping (authored
`vault/raw/2026-09-23-fllwup-epic-grouping.md`). The 41 open follow-ups were
grouped into 7 thematic **close-out epics** (EPIC-16…22, commit `8c7913c`) and
re-homed via `epic:`, completing the backlog-management pipeline begun by the
curation pass.

- **Created:** sources/2026-09-23-fllwup-epic-grouping.
- **Updated:** [[follow-up-backlog-curation]] (added the Phase 2 grouping
  section), [[engineering-board]], [[chain-promotion]], [[card-id-allocation]],
  [[pi-council-overview]], [[index]].
- **Contradictions flagged:** none. Grouping **complements** curation — it
  re-homes the `epic: null` orphans curation created. Boundary recorded: a
  close-out epic's `goal` is an aggregate rollup, not a single falsifiable
  sentence.

## [2026-09-23] ingest | FLLWUP backlog cleanup — merge/retire discipline, the no-Retired-state constraint, and the silent-staleness hazard

Ingested the follow-up backlog curation (authored
`vault/raw/2026-09-23-fllwup-backlog-cleanup.md`). An attended maintenance pass
consolidated 65 open Backlog `FLLWUP` cards to 42 — 17 content-preserving merges
(absorbed Intent/Acceptance kept verbatim, lower id survives) and 2 retirements.
It named the standing hazard that follow-up cards go **stale silently** (FLLWUP-63
and FLLWUP-69 were already satisfied in the tree) and the structural fact that
`validate.py` has **no `Retired` state**, so a retirement is a delete plus an
out-of-band raw map.

- **Created:** sources/2026-09-23-fllwup-backlog-cleanup; [[follow-up-backlog-curation]].
- **Updated:** [[engineering-board]], [[pi-council-overview]],
  [[followup-decision-gate]], [[chain-promotion]], [[card-id-allocation]],
  [[index]].
- **Contradictions flagged:** none. The cleanup ratifies the existing board
  rules rather than superseding them; the one boundary is that a merge of
  `In Progress`/`Done` cards would need explicit authority (every merge was
  `Backlog`).

## [2026-09-23] ingest | EPIC-15 residual run — recorded mode ≠ executed mode, and the residual-scope delivery model

Ingested the EPIC-15 residual run (authored
`vault/raw/2026-09-23-epic15-residual-run-ledger.md`). Five `Backlog` residuals
under a `Done` epic (`FLLWUP-111/109/110/107/108`) shipped serially (PRs
#107–#111) under run-scoped **R-A** (record push) and **R-B** (`--admin` merge)
authorizations. `FLLWUP-111` exposed that the ROOT-manifest `mode` does not
control what the [[council-runner]] executes — recorded `Verify`, ran `Direct` —
so the [[deterministic-merge-check]] HALTed for a missing goal evaluation; the
repair was to produce the missing `Verify` evidence. Held follow-ups were routed
to [[product-owner]] (one unsupported `Merge` overturned to `File`) →
`FLLWUP-112`/`113`.

- **Created:** sources/2026-09-23-epic15-residual-run-ledger;
  [[execution-mode-recording]].
- **Updated:** [[council-runner]], [[deterministic-merge-check]],
  [[metered-deliberation-routing]], [[record-push-discipline]],
  [[followup-decision-gate]], [[confirmation-authority]], [[usages-report]],
  [[test-suite-budget]], [[engineering-board]], [[pi-council-overview]],
  [[index]].
- **Open gap:** the command has no sanctioned repair for the
  missing-goal-evaluation HALT (a card is owed), and the recorded `mode` not
  controlling execution is unresolved; the `validate.py` heading-uniqueness gap
  recurred.

## [2026-09-22] ingest | Gate noul fix — the parse-seam canonicalization and the global-clone load scope

Ingested the FLLWUP-104 fix (`e903b67`; authored `vault/raw/2026-09-22-gate-noul-fix.md`).
The live decisions wire keys a noul answer `noul` while the engine read
`probability`, so both gate domains were inert; the fix canonicalizes the answer
at the one parse seam both share, with the pole proven live (trivially-true →
0.99). The episode also exposed [[extension-load-scope]]: pi loads the
globally-installed clone, not the working tree, so the fix was not live until
pushed, the install updated, and pi reloaded.

- **Created:** sources/2026-09-22-gate-noul-fix; [[decisions-wire-canonicalization]];
  [[extension-load-scope]].
- **Updated:** [[inert-gate-fallback]] (noul trigger resolved), [[metered-deliberation-routing]]
  (drift fixed + live-arm direction residual), [[followup-decision-gate]] (gate functional;
  FLLWUP-109/110/111 filed), [[council-dependencies]] (the self-load scope),
  [[pi-council-overview]], `index.md`.
- **Contradictions flagged:** none. The fix **resolves** the open FLLWUP-104 residual recorded
  in [[metered-deliberation-routing]] / [[followup-decision-gate]] rather than contradicting it;
  the remaining live-arm *direction* failure is a new residual, recorded, not a contradiction.

## [2026-09-22] ingest | EPIC-15 run — usages cache-ordering fix, stale-copy route, and the inert-gate finding

Ingested the EPIC-15 autonomous run (authored `vault/raw/2026-09-22-epic15-run-ledger.md`)
together with the two already-filed raw notes (`2026-09-23-po-epic15-decomposition-ruling`,
`2026-09-24-fllwup-105-stale-usages-skill-recopy`). Three Deliberate merges
(PRs #104–#106: `59fad63`, `a0b27ca`, `98a62a9`) shipped the `usages.py`
cache-before-mkdir fix, the package-update→delete→re-init remediation route,
and the stderr-discipline paragraph. The run's central finding is
[[inert-gate-fallback]]: `gate.mode: active` did not mean the gate decided —
both the intake card gate and the follow-up gate failed on the `noul` drift
(FLLWUP-104), and all three cards ran on the `council_route` fallback
(Deliberate).

- **Created:** sources/2026-09-22-epic15-run-ledger; [[inert-gate-fallback]].
- **Updated:** [[usages-report]] (cache-ordering bug + stale-copy route),
  [[non-clobbering-scaffold]] (refresh-route correction), [[followup-decision-gate]]
  (the in-container tool gap + failure arm), [[council-runner]] (EPIC-15 lessons),
  [[deterministic-merge-check]] (orchestrator-merges restored), [[union-merge-reconcile]]
  (untracked-worktree-file ff abort), [[main-repo immutability]] (leaked-file hazard),
  [[metered-deliberation-routing]] (both domains inert), [[gate-parity]],
  [[confirmation-authority]], [[presented-never-written]], [[three-wave-decomposition]],
  [[skeptic]] (tested fact over predicted gain), [[engineering-board]] (epic closure with
  Backlog children), [[steward]] (escalation resolved by the human), [[pi-council-overview]]
  (seventh epic closure), `index.md`.
- **Contradictions flagged:** [[non-clobbering-scaffold]]'s "refreshing means
  delete-and-re-run-`/council-init`" was **incomplete** — re-run alone is a no-op
  (T-USK1) and the recopy comes from the installed package, so the package must be
  updated first; corrected in place with the update→delete→re-init order. No other
  claim was superseded; the `noul` drift extends, rather than contradicts, EPIC-10's
  "gate inert in production" finding.

## [2026-09-22] ingest | Shape-witness segment-liveness fix — the derived token set's first false positive

Ingested the fix commit `3e34f01` (a code-fix source, no raw file). The
FLLWUP-59 derived-token witness failed **noisy** on `main` (`0.34.1`): retiring
`.agents/skills/**` emitted dir token `skills/`, which prefix-only liveness
kept because no live path *starts with* `skills/` — though `skills/` is live as
an interior segment under `.pi/skills/**`. Test 6 red the legitimate `/usages`
scaffold destination `skills/usages/SKILL.md`. The repair makes dir-token
liveness segment-aware; the over-emission class is folded into
[[retired-path-tokens]], and the re-card trigger is recorded as not firing.

- **Created:** sources/2026-09-22-fix-shape-witness-segment-liveness.
- **Updated:** [[retired-path-tokens]] (over-emission class + Related/Sources),
  [[non-clobbering-scaffold]], [[usages-report]], [[test-suite-budget]]
  (re-measured at 1470 tests / 113 files, one new pure falsifier), `index.md`.
- **Contradictions flagged:** none. Process note only — the fix was pushed
  directly to `main` (protection bypass, "changes must be made through a pull
  request") with no card filed; recorded on the source page, not folded into
  [[record-push-discipline]] (outside its autonomous-run scope).

## [2026-09-22] ingest | EPIC-11 recut — Jev seat-composition gate domain, under designer attack

Ingested the wave-2 designer attack on the Jev-aware EPIC-11 recut (filed
`vault/raw/2026-09-22-design-epic11-recut-surface.md`). The recut adds a third
gate domain (setup seat composition, `Default` fail-safe / `Redefine`) sibling to
[[metered-deliberation-routing]] and [[followup-decision-gate]]; the attack's
ranked findings A–J name the literal-copy, `gate.mode` provenance, schema-seam,
and never-written-pin gaps. Kept minimal per steer — EPIC-11 is unbuilt and the
concepts may change, so no speculative concept pages were created.

- **Created:** sources/2026-09-22-design-epic11-recut-surface.
- **Updated:** [[council-setup]] (recut-aware rewrite: third domain,
  `<seat_emphasis>` persona, profile-citation rule, findings, contradiction
  flag), [[metered-deliberation-routing]], [[followup-decision-gate]],
  [[confirmation-authority]], [[gate-parity]] (backlinks), `index.md`.
- **Contradictions flagged:** [[2026-09-19-po-epic11-decomposition-ruling]] §10
  ("profile field in the header chip") is malformed for the seat-composition
  question, whose recommendation is a Jev disposition (Finding A) — flagged on
  [[council-setup]] and the source page, not overwritten. Also flagged: two raws
  the source cites (`2026-09-21-design-epic10-re-cut-surface`,
  `2026-09-22-po-ev84-step13-noul-shape-ruling`) still lack source pages.

## [2026-09-22] ingest | EPIC-10 run — typed follow-up review + confirmation authority + inert-gate finding

Ingested the EPIC-10 run (filed `vault/raw/2026-09-22-epic10-run-ledger.md`). The
re-cut epic shipped the typed follow-up review end to end (7 Deliberate merges,
PRs #97–#103, v0.28.0→v0.33.0); the run's load-bearing ruling is
[[confirmation-authority]] (a recorded `active` decision is the disposition
source, never the human confirmation), and its falsifier found the shipped card
gate inert in production (noul wire-shape drift, dead recorded-decision fast
path).
- **Created:** sources/2026-09-22-epic10-run-ledger, concept
  [[followup-decision-gate]], concept [[confirmation-authority]], concept
  [[step-13-followup-surface]].
- **Updated:** [[followup-merge-and-auto-ingest]] (rewritten as a superseded
  pointer), [[metered-deliberation-routing]] (Residuals + wire-vs-engine flag),
  [[deterministic-merge-check]] (EPIC-10 practice + runner-merges variance),
  [[council-runner]], [[record-push-discipline]] (clean authorization sequence),
  [[presented-never-written]], [[engineering-board]], [[card-id-allocation]],
  [[chain-promotion]], [[test-suite-budget]], [[red-base-evidence]],
  [[union-merge-reconcile]], [[gate-parity]], [[council-config]],
  [[product-owner]], [[steward]], [[pi-council-overview]], `index.md`.
- **Contradictions flagged:** `followup-merge-and-auto-ingest` (Backlog /
  merge-before-draft) superseded by the re-cut; [[metered-deliberation-routing]]'s
  "a `noul` answer carries a probability" is engine-true and wire-false;
  [[pi-council-overview]]/`index.md`/[[deterministic-merge-check]] said EPIC-10
  Backlog and the facilitator merges — both superseded (flagged in-page, not
  silently overwritten).

## [2026-09-21] ingest | `/usages` procedure — repo-scoped OpenRouter cost cross-match

Ingested the `/usages` design spec (filed `vault/raw/2026-09-21-usages-design.md`).
A packaged procedure + a `/council-init`-copied skill/tool report one repo's
per-seat and main-agent token/dollar usage over a time range, cross-matched to
OpenRouter through the batch `analytics/query` surface. The reusable findings:
`generation_id` is the only reliable join key (council child `session_id` is
`job-N` and collides across runs), activity is account-wide (30-day account
$211.85 vs $1.26 repo-attributed), and seat-level history needed a new durable
`seats[]` sibling because run dirs prune to 15.

- **Created:** sources/2026-09-21-usages-design, concept [[usages-report]],
  concept [[openrouter-analytics-surface]].
- **Updated:** [[usage-accounting]], [[usage-store]] (`seats[]` + `gate`),
  [[cost-provenance]] (analytics surface + `exact`/`reported` flag),
  [[procedure-commands]] (7→8 procedures), [[non-clobbering-scaffold]] (the
  engine-synthesized skill copy), [[run-transcripts]], [[preflight]]
  (management vs inference key), [[pi-council-overview]] (unreleased note),
  [[test-suite-budget]] (1463 tests; the test-isolation lesson), `index.md`.
- **Contradictions flagged:** [[procedure-commands]] said "seven packaged
  procedures" (now eight); [[usage-store]]'s interface block was stale (missing
  EV-71's `gate` sibling and the new `seats`); [[cost-provenance]]'s "no
  four-component dollar split anywhere" is generation-endpoint-true but
  `/analytics/query` exposes component-ish currency metrics; the new `exact`
  label vs the canonical `reported` (flagged, `reported` kept as canonical).

## [2026-09-21] ingest | EPIC-14 run + EPIC-13 ruling backfill

Ingested the EPIC-14 run (filed `vault/raw/2026-09-21-epic14-run-ledger.md` from
`docs/superpowers/run-ledger-EPIC-14.md`; created
[[2026-09-21-po-ev73-step6-ruling]] and, filing the card-only ruling to raw first,
[[2026-09-21-po-ev77-j1-j2-ruling]]). Backfilled the eight EPIC-13-era raw
sources left without pages by the EPIC-13 ingest: [[2026-09-20-po-epic13-promotion-ruling]],
[[2026-09-20-po-ev64-budget-default-and-estimator-ruling]],
[[2026-09-20-po-ev65-step6-ruling]], [[2026-09-20-po-ev66-step6-ruling]],
[[2026-09-20-po-ev67-step6-ruling]], [[2026-09-21-ev69-designer-loss-residual]],
[[2026-09-21-po-ev69-step6-ruling]], [[2026-09-21-po-ev71-step6-ruling]].
Folded the run's reusable lessons into existing pages rather than new concept
pages: the `gate` sibling on [[council-config]], the packaged run-start check on
[[preflight]] (with the scaffold-vs-packaged reach rule on
[[non-clobbering-scaffold]]), the fold-in test and the docs-card `test/` pin rule
on [[engineering-board]]/[[test-suite-budget]]/[[product-owner]], `writeGateMode`
on [[council-config-writer]], `/council-gate` on [[echo-then-run]], the sixth epic
closure on [[steward]], and the EPIC-14 row on [[pi-council-overview]].
Contradictions flagged: **EPIC-14 closed without a version bump** (no PR touched
`package.json`; the steward ruled the bump not a closure condition and carded
`FLLWUP-95`; `latest` is a full epic behind `main`) against
[[pi-council-overview]]'s "version bumped in the same commit as each behavior
change"; and the unlegislated **docs-card-edits-`vault/`** tension (EV-77 hand-edited
the wiki, which `council.md` step 14 says the facilitator must never do).

- **Created:** 11 source pages
- **Updated:** council-config, preflight, engineering-board, metered-deliberation-routing, deterministic-merge-check, record-push-discipline, chain-promotion, council-runner, product-owner, echo-then-run, council-config-writer, non-clobbering-scaffold, test-suite-budget, steward, pi-council-overview, index
- **Contradictions flagged:** 2 — version-bump-not-a-closure-condition vs the overview's same-commit claim; a docs card as a second wiki writer

## [2026-09-21] ingest | EPIC-13 run — metered deliberation routing shipped

Ingested `vault/raw/2026-09-21-epic13-run-ledger.md` (filed from
`docs/superpowers/run-ledger-EPIC-13.md`; the eight PO/steward ruling raws folded
in). Created [[2026-09-21-epic13-run-ledger]]; rewrote
[[metered-deliberation-routing]] (planned → shipped v0.28.0) and made
[[deterministic-merge-check]] mode-aware (Direct = criteria 1/2/5; no recorded
mode = HALT). Updated [[union-merge-reconcile]] (reset counterexample),
[[record-push-discipline]] (R6 ordering recurrence), [[hub-job-supervision]]
(stall window must clear the child window), [[engineering-board]] (heading-
uniqueness gap; step-13 recurrence), [[council-runner]], [[usage-block]],
[[chain-promotion]], [[test-suite-budget]], [[pi-council-overview]], index.
Contradictions flagged: **reset vs union-merge** (the run discarded a local-only
ruling doc), and the planned→shipped supersession.

- **Created:** 1 source page
- **Updated:** metered-deliberation-routing, deterministic-merge-check, union-merge-reconcile, record-push-discipline, hub-job-supervision, engineering-board, council-runner, usage-block, chain-promotion, test-suite-budget, pi-council-overview, index
- **Contradictions flagged:** 2 — reset/union-merge; planned→shipped

## [2026-09-20] ingest | Backfill — 16 un-ingested raw sources get source pages

Created the 16 source pages the lint flagged as missing (raw files present,
no `sources/` page): [[2026-design-ev10-round2]], [[2026-09-03-po-ev12-j1-ruling]],
[[2026-09-04-po-epic5-ruling]], [[2026-09-04-po-epic6-ruling]],
[[2026-09-05-design-ev27-round2]], [[2026-09-15-design-ev36-round1]],
[[2026-09-15-po-epic8-ruling]], [[2026-09-16-design-ev42-partial-legend]],
[[2026-09-16-po-epic9-retry-ruling]], [[2026-09-16-po-ev37-merge-gate-defect]],
[[2026-09-16-po-ev39-step6-ruling]], [[2026-09-17-po-ev40-ruling]],
[[2026-09-17-po-ev42-step6-ruling]], [[2026-09-17-po-fllwup43-step6-rulings]],
[[2026-09-19-po-epic11-decomposition-ruling]],
[[2026-09-20-po-epic12-decomposition-ruling]]. Each is a faithful summary of
its raw and cross-links the concept pages it affects; [[index]] Sources updated.
No raw files moved (vault/raw stays immutable).

Also this session, outside the wiki: deduplicated `council/board.md` to the
canonical seven columns (it carried three `## Done` and two `## In Review`
headers; `validate.py` clean, 151 cards) and added `mcp` to AGENTS.md
convention #2's seat-schema field list.

- **Created:** 16 source pages
- **Updated:** index, log
- **Contradictions flagged:** 0

## [2026-09-20] lint | Link repair + repo-state drift sweep + authorized re-ingest

Ran the Lint operation at HEAD `675c1bf`, then applied the human-authorized
corrections.

**Mechanical link repair:** added the missing spaced-form aliases that ~40
`[[natural title]]` links required (24 concept pages) — clearing the 5 strict
orphans ([[cell-aggregation]], [[env-split-contract]], [[grader-topology]],
[[lock-drift-tripwire]], [[verification-subject-pinning]]); de-ambiguated 3
colliding aliases (`council-tree`, `promotion cadence`,
`rpiv-ask-user-question`); repaired a line-wrapped `[[model eval harness]]`
link. Result: **0 orphans, 0 ambiguous aliases, 0 unresolved links** except the
one known un-ingested raw below.

**Factual corrections:** [[2026-09-17-po-fllwup47-step6-ruling]] merge SHA
`a1d805a` → `216ea34` (`a1d805a` was the branch head); [[pi-council-overview]]
install URL `tistaharahap` → `jumpseat-inc` and `COUNCIL_SOURCE` →
`COUNCIL_SEAT`; [[2026-08-23-mcp-support-design-spec]] provenance path/date;
[[main-repo-immutability]] FLLWUP-24 → FLLWUP-13 card citation;
[[council-config]]'s FLLWUP-10 seam marked closed; [[principal]]'s output-floor
sentence; [[test-suite-budget]] counts 935/81 → 947/82 (re-measured);
[[2026-09-20-po-fllwup58-gates-backstop]] superseded-in-part note;
[[smoke-test]] SMOKE_PHASE 5-or-6; [[skeptic]]'s unverifiable "4 objections"
count; overview commit count.

**Authorized re-ingest:** synced 7 stale seat model pins; recorded v0.20.0
(untagged) and EPIC-10..13 with 5 new pages ([[council-update]],
[[council-setup]], [[version-on-first-run]], [[metered-deliberation-routing]],
[[followup-merge-and-auto-ingest]]); refreshed [[2026-08-23-agents]]
(conventions #5/#6) and [[2026-08-23-readme]] (install URL, `/council-update`,
theme, git table), the 9 seat entity pages, and [[council-loop]] /
[[engineering-board]] against current files; re-pinned 16 `.repo-docs.tsv`
entries to `675c1bf`.

⚠️ **Open gaps (deferred):** 16 raw sources still lack source pages;
`[[2026-09-04-po-epic6-ruling]]` remains a dangling link to one of them;
`council/board.md` carries duplicate `## Done`/`## In Review` headers
(`validate.py` still clean).

- **Created:** council-update, council-setup, version-on-first-run, metered-deliberation-routing, followup-merge-and-auto-ingest
- **Updated:** 24 concept pages (aliases), 7 seat pages (models), AGENTS/README + 2 source pages (factual), council-config, principal, test-suite-budget, smoke-test, council-loop, engineering-board, pi-council-overview, index, .repo-docs.tsv
- **Contradictions flagged:** 6 → resolved

## [2026-09-18] ingest | EPIC-9 residual run 2 — ledger, rulings, and the stale-claim correction pass

Ingested the EPIC-9 residual run 2 (`FLLWUP-50`–`60`) and its ruling docs.
Laid down `vault/raw/2026-09-18-epic9-residual-run-2-ledger.md` (the run's
source of record, mirroring run 1) and its source page, plus source pages for
`2026-09-18-design-fllwup50-refresh-path`, `2026-09-18-po-fllwup56-step13-ruling`,
`2026-09-19-po-fllwup48-test-suite-budget`, `2026-09-19-po-fllwup50-step6-ruling`,
`2026-09-19-po-fllwup59-step13-ruling`, `2026-09-20-po-fllwup58-gates-backstop`,
and `2026-09-20-po-fllwup58-step13-confirmation` (8 source pages created; 1 raw
source added).

Updated: [[headless-pi]] (⚠️ project-extension discovery is **not `-a`-gated**),
[[council-theme]] (the jiti nested-`require()` mis-resolution; `await import()`
b bypasses it), [[test-suite-budget]] (missing frontmatter added; the FLLWUP-56
header rule; the FLLWUP-57 shell-independence note; ️ **census correction** —
compact-form ceilings make the true default floor **52**, not 43, so the shipped
`60` has ~1 minute of headroom, not 10), [[engineering-board]] (⚠️ `goal:` is now
**positional**; the pre-write step-13 gate inversion corrected and carded), 
[[record-push-discipline]] (⚠️ **gap closed** by FLLWUP-60),
[[deterministic-merge-check]] (run-2 observed practice; ⚠️ merged-SHA CI can flake
on an untouched file), [[union-merge-reconcile]] (concurrent board writers are a
second divergence trigger), [[smoke-test]] (the driver now shares the pty kit),
[[retired-path-tokens]] (missing frontmatter added; ⚠️ caveat (a) corrected —
the driver exists with pre-kit content), [[sources/2026-08-24-bugfix-seat-prose]]
(⚠️ the GATE-EVIDENCE guard was widened to all seats+procedures by FLLWUP-53),
[[index]].

Contradictions flagged explicitly (5): (1) `record-push-discipline`'s "FLLWUP-60
is owed" is false as of `aa1923fe`; (2) `test-suite-budget`'s advertised 1.42×
ratio over-claims — the true ratio is 1.15×; (3) `retired-path-tokens` caveat
(a)'s "does not exist" is false — and the imprecision originated in the card's
spec, so an ingest re-deriving from the spec would re-import it; (4)
`engineering-board`'s "wrapped goal is the silent-loss path" is superseded by the
loud positional gate; (5) `sources/2026-08-24-bugfix-seat-prose`'s
`GATE-EVIDENCE` fix was scoped to one file and a second naming survived until
FLLWUP-53. Deferred: FLLWUP-50's refresh-path page set is carded as `FLLWUP-67`.

## [2026-09-18] ingest | FLLWUP-47 product-owner step-6 ruling — the red-base evidence convention

Ingested `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md` (the R1–R6
ruling that settled FLLWUP-47's six open-judgment items and shaped the
shipped red-base convention) as the wiki's concept page for the convention.
Created [[red-base evidence]] (the seven fields, the comparison triple and
gating rule, the skeptic-derived two-class boundary, the EV-41
causal-story correction, the lineage note) + the source page. Updated
[[owner]] and [[skeptic]] (the shared-block placements and each seat's
duty), [[deterministic-merge-check]] (⚠️ R2: "no red test lands" lives in
the merge gate; the record carries the head half — no double-enforcement),
[[gate-parity]] (⚠️ R1's application: derivation at the reproduction
surface, not a writer-side field), [[main-repo immutability]] (field 5's
detached base worktree), [[product-owner]] (the R1–R6 precedent + the R6
fold-in call), [[index]]. ⚠️ Contradiction flagged explicitly (1): the
EV-41 causal story — the recorded "copy depth of `test/ev40-harness/`"
explanation is known-wrong; the six extra fails come from head
`test/stub-child.test.ts` vs base `test/stub-child.ts`, enabled by an
unrecorded `extensions/retry.ts` transplant (`test/ev40-harness/` and
`ev41-tui.py` are inert in that configuration — per the Skeptic's
transplant table in FLLWUP-47 step 4). No wiki page previously carried the
wrong cause, so the correction is a filled gap, flagged not overwritten.
The EPIC-9 ledger's "declined at step-13" sentence stands untouched; the
lineage clarification (decline ≠ standing decline) lives on
[[red-base evidence]] only.

## [2026-09-17] ingest | EPIC-9 residual run — the record-push gap and the lossless-goal fix

Filed `vault/raw/2026-09-17-epic9-residual-run-ledger.md` (the
`/features-deliver` run that delivered EPIC-9's nine promoted residuals
FLLWUP-40–45/47–49; PRs #58–#66, one union merge, two steward goal amendments,
13 ruling-seat round-trips) and ingested it. Created [[record-push-discipline]]
and [[run-config-stability]] + the source page. Updated [[engineering-board]]
(⚠️ the colon-space goal rule is **retracted** — FLLWUP-43; the wrap is the
real silent-loss path), [[deterministic-merge-check]] (⚠️ the stale "Carded as
FLLWUP-42" bullet is now delivered; + the `gh run list --commit` merged-SHA
read gotcha; + the record-push disclosure), [[union-merge-reconcile]] (⚠️ the
stale "carded as FLLWUP-41" bullet is delivered), [[retry-classification]] (the
dead-literal cause fixed), [[council-runner]] (ruling-seat pen discipline;
provider-error re-dispatch; the shared faux-provider kit), [[preflight]]
(FLLWUP-27 recurred + the detached-HEAD skip), and [[index]]. Contradictions
flagged explicitly (never silently overwritten): the engineering-board
colon-space rule (false), and the two stale "carded as FLLWUP-4x" bullets.

## [2026-09-16] lint | Tag record cleanup — v0.18.0 added, un-prefixed strays renamed

Completed the release tag record flagged by the v0.19.0 entry. Created
`v0.6.2` (`12a8804`), `v0.17.1` (`4074870`) and **`v0.18.0` (`0f28824`** — bumped
in source by the EPIC-6 close run but never tagged), then deleted the two
un-prefixed strays `0.6.2`/`0.17.1`; their commits stay reachable via the new
`v`-prefixed tags and `main`. Every release 0.1.0 → 0.19.0 now carries exactly
one `vX.Y.Z` tag (33 refs total: 32 releases + `latest` → `689f621`). The
annotated/lightweight mix (`v0.1.0`–`v0.2.0`, `v0.11.0`–`v0.11.4` annotated)
was deliberately left alone — normalizing force-rewrites tag objects for no
semantic gain. Updated [[pi-council-overview]] to record the resolved state
rather than the gap.

## [2026-09-16] ingest | v0.19.0 release — EPIC-9 minor bump

Bumped `package.json` 0.18.0 → 0.19.0 (commit `689f621`), tagged `v0.19.0`
(lightweight, matching the v0.14.0-onward convention) and force-moved `latest`
from `4074870` to `689f621`. Updated [[pi-council-overview]] (current version →
v0.19.0; a `v0.19.0` release row) and [[index]]. ⚠️ **Gap flagged:** v0.18.0 was
bumped in source but **never tagged**, and `latest` had been pointing at the
untagged 0.17.1 bump commit; the tag set also carries two un-prefixed strays
(`0.17.1`, `0.6.2`). No source page — the release's content is the EPIC-9
ledger already ingested.

## [2026-09-16] ingest | EPIC-9 run ledger — provider-error retry, the dead-literal catch

Filed `vault/raw/2026-09-16-epic9-run-ledger.md` (the `/features-new` +
`/features-deliver EPIC-9` run: seven gated merges PRs #51–#57, 713→847 tests,
four step-6 escalations, EPIC-9 closed `Done`; version stays v0.18.0) and
ingested it. Created [[retry-classification]], [[retry-policy]],
[[parent-turn-continuation]], [[per-attempt-provenance]],
[[figure-scoped-disclosure]] + the source page. Updated [[headless-pi]]
(print-mode `takeOverStdout` + post-settle exit code; the `agent_settled` ctx
lacks `waitForIdle`), [[hub-job-supervision]] (`state=done` +
`stopReason=error`; the `retrying` state), [[cost-provenance]], [[usage-block]],
[[usage-store]] (figure-scoped `partial`; per-attempt session walk),
[[council-config]] (the `retry` sibling), [[deterministic-merge-check]] (⚠️ the
five criteria are artifact-level, not intake-level; ⚠️ the human merge gate is
not fully replaced under a review-requiring ruleset), [[union-merge-reconcile]]
(EPIC-9 divergence pair; procedure-vs-practice gap), [[engineering-board]]
(goal-as-lossy-oracle; acceptance-names-the-observable; closure #4),
[[preflight]] (FLLWUP-27 recurrence), [[council-runner]], [[product-owner]],
[[steward]], [[pi-council-overview]], [[index]]. Key takeaways: all five merge
criteria can pass on a deliverable that cannot work — the cross-check against
the dependency's *installed bytes* is load-bearing; the `goal` field's
colon-space ban and the judge's isolation compose into a defect class; and a
Phase-1 ruling can itself be the dispute.

## [2026-09-15] ingest | EPIC-8 run ledger — transcript rendering, third epic closure

Filed `vault/raw/2026-09-15-epic8-run-ledger.md` (the `/features-new` +
`/features-deliver EPIC-8` run: four gated merges PRs #47–#50, 672→704 tests,
EPIC-8 closed `Done`) and ingested it. Created [[transcript-unit-rendering]],
[[honest-keymap]], [[one-row-floor]] + the source page. Updated
[[pi-council-overview]] (EPIC-8 row; version stays v0.18.0),
[[council-job-tree-inline]] (⚠️ the flat `→ toolcall`/`⎿` heads superseded by
the composed unit; keymap fix; one-row R3; FLLWUP-36..39), [[run-transcripts]]
(⚠️ parser now carries `toolCallId`/`isError` + one exported accessor; composed
unit rendering), [[council-runner]] (EPIC-8 lessons: discovered mechanisms,
cross-card ruling reach), [[deterministic-merge-check]] (four more merges;
first watched in-line; one union merge), [[engineering-board]] (third epic
closure; Acceptance is an amendable surface while the goal is not),
[[product-owner]] (Q5 cross-card reach; the EV-33 acceptance amendment),
[[steward]] (closure #3; follow-up confirmation; permanent residuals),
[[designer]] (the minimalist-ui transfer limit), [[council-theme]] (token-only
drawing drove that limit), [[index]]. Key takeaways: a taste request resolved
to a parser-fidelity fix first; an earlier ruling's anti-goal can bind a later
card; a card goal can describe a post-epic endpoint; and honest keymap
(`matchesKey` vs raw byte equality) is a bug class.

## [2026-09-11] ingest | EPIC-7 run ledger — honest usage accounting, second epic closure

Filed `vault/raw/2026-09-11-epic7-run-ledger.md` (the `/features-new` +
`/features-deliver EPIC-7` run: five gated merges PRs #42–#46, 587→668 tests,
EPIC-7 closed `Done`) and ingested it. Created [[usage-accounting]],
[[spend-record]], [[usage-store]], [[usage-block]], [[cost-provenance]] + the
source page. Updated [[pi-council-overview]] (EPIC-7 row; version stays
v0.18.0), [[hub-job-supervision]] (⚠️ the `usage (input/output/cost/turns)`
shape superseded by the full flat tuple; stall recurrence #3; the
package-root/child-load failure class), [[run-transcripts]] (manifests carry
usage; the durable store is the exception to pruning), [[council-runner]]
(goal-as-defect, every-child-escalated, stall recurrence, Phase-0 should assert
dispatch tools), [[deterministic-merge-check]] (five more merges; the
branch-freshness artifact), [[chain-promotion]] (first full five-link chain),
[[preflight]] (⚠️ branch-freshness artifact FLLWUP-27), [[eval-store-contract]]
(⚠️ `cellScope.usage` widening pending FLLWUP-28; EV-28 whitelist),
[[engineering-board]] (second epic closure; goal amendment while
`Deliberating`), [[council-loop]] (usage block at exits), [[product-owner]]
(the goal-as-defect escalation), [[steward]] (goal-wording authority,
eval-boundary mechanism, epic closure), [[index]]. Key takeaways: a card's
premise can be the defect (EV-29); Phase-1 literals settle copy, not
placement/trigger/multiplicity/durable carrier; and the stall invariant needs
a tool-level guard, not a third re-learning — plus the pricing finding that
pi's catalogue was current and the 2–5x inflation is upstream routing. Lint
fix: backfilled the [[pi-council-overview]] version table with the missing
v0.17.0/v0.17.1/v0.18.0 rows (their own ingests never added them).

## [2026-09-06] ingest | EPIC-6 close-run ledger — BUG-1..FLLWUP-25, first epic-card closure

Filed `vault/raw/2026-09-06-epic6-close-run-ledger.md` (the second
`/features-deliver EPIC-6` run: 14 gated merges PRs #28–#41, three
escalations — all narrow, all resolved in one ruling round — and the epic
card itself marked Done at v0.18.0) and ingested it. Created
[[env-split contract]] (the "0.85.0 regression" was `COUNCIL_SEAT` probe
contamination — no version delta exists; two-pole verified),
[[main-repo immutability]] (three enforcement layers after two
record-corruption incidents), [[verification-subject pinning]] (judge/
skeptic dispatch inputs name PR head SHA + head worktree path + loop
frame), [[lock-drift tripwire]] (installed-vs-locked pi check fires
before preflight's self-heal; `bun pm ls --all` trap). Updated
[[council models picker]] (⚠️ "Open follow-ups" superseded — FLLWUP-12/13/
14/15 all closed; surface complete), [[two-bit focus machine]] (⚠️
"Esc-clear is the sole deletion mechanism" superseded — backspace-as-
delete added by BUG-1), [[council runner]] (immutability + subject pins;
the re-statement lesson), [[hub job supervision]] (⚠️ stall recurrence —
seat-body lesson insufficient, dispatch input is where constraints are
consumed), [[smoke test]] (kitty search-smoke sibling; step-11 re-run is
load-bearing), [[preflight]] (drift tripwire + pre-heal ordering),
[[deterministic merge check]] (14 more merges), [[engineering board]]
(first `BUG-` card, first epic-card closure), [[union-merge reconcile]]
(the avoidance recipe proved out), [[mcp support]] (named load failure),
[[council theme]] (0.85.x token drift compatible-as-shipped),
[[pi-council overview]] (v0.18.0), [[card id allocation]] (BUG- prefix
first use), [[judge]]/[[owner]]/[[skeptic]] (v0.18.0 seat additions),
[[index]]. Key takeaway: seat-body guidance is necessary but not
sufficient — operative constraints must be re-stated in every dispatch
input; and front-loading kills copy disputes, not discovered-mechanism
consequences (route those early, facts only).

## [2026-09-06] ingest | AGENTS.md re-ingest — conventions summary 12→13

(a) Pin re-pinned df1949e → 2c5ec3b (last AGENTS.md touch, content == HEAD) and the count re-derived: the file now lists 13 hard conventions (13 top-level items + the 9.5/9.6 sub-entries of #9); the page mirrors it verbatim.
(b) Item-1 inversion corrected on the page: "Seats are opinionated on purpose" → "Seats are domain-neutral by design" (the v0.14.0 change, now reflected in the summary page).
(c) Clause #13 added: local gate evidence is trusted only after `council/preflight.sh` passes on the current tree (source: FLLWUP-24 / 2c5ec3b).
(d) Human-loop waiver: **card = steer** — card FLLWUP-25 substitutes the schema's discuss-with-me-first step (the human filed the card for exactly this refresh); flag-not-overwrite discipline observed, nothing silently overwritten.
(e) Provenance-frontmatter conformance: first page carrying the REQUIRED four keys (provenance/source_path/source_commit/captured); no vault tooling rejects them (validate.py has zero vault surface).
(f) Lint observation: AGENTS.md markers ` 9.6.`/` 10.` carry a leading-space marker (AGENTS.md:95/103); the wiki copy normalizes to `9.6.`/`10.`. Source-side whitespace fix deferred as a follow-up candidate — the consistency-check parser tolerates both.

- **Pages touched:** sources/2026-08-23-agents (refresh), [[index]] (12→13), .repo-docs.tsv (pin). Historical "12th convention" / "(twelve conventions)" entries (log.md:331/337) remain append-only history.

## [2026-09-05] ingest | EPIC-6 Run Ledger — model search filter, first fully-autonomous epic closure
Filed `vault/raw/2026-09-05-epic6-run-ledger.md` (the run: EV-26/EV-27 search input + FLLWUP-9/10/11 closed,
five deterministic-gate merges, 507→537 tests, ZERO escalations) and ingested it. Created
[[two-bit focus machine]], [[union-merge reconcile]] + the source page. Updated [[council models picker]]
(search input + EPIC-6 ruled copy), [[council config writer]] (⚠️ known seam FIXED by FLLWUP-10; clearSeatOverride
added by FLLWUP-9), [[smoke-test]] (⚠️ "planned fix" superseded — SMOKE_PHASE shipped), [[hub-job-supervision]]
(⚠️ stall invariant recurred — record ≠ institutionalization; sub-dispatch lifecycle), [[council-runner]]
(staged-set hygiene, mechanical-path default, zero-escalation run), [[deterministic-merge-check]] (five more
merges, first fully-autonomous closure), [[engineering-board]], [[index]]. Key takeaways: Phase-1 front-loading
is the escalation-killer; the stall-window fix must live in the dispatching procedure, not run memory; verify the
staged set before every commit.

## [2026-09-04] ingest | EPIC-5 Run Ledger — /council-models shipped
Filed `vault/raw/2026-09-04-epic5-run-ledger.md` (the autonomous run: EV-22..25,
four deterministic-gate merges, 460→507 tests) and ingested it. Created
[[council models picker]], [[council config writer]], [[gate parity]],
[[echo-then-run]] + the source page. Updated [[council-config]] (⚠️ write path
added — loaders-only description superseded in part), [[deterministic-merge-check]]
(EPIC-5 practice incl. conditional green-light), [[council-runner]] (mechanical
path, green-light conditionals, recovery proof), [[hub-job-supervision]] (stall
invariant generalized to the orchestrator layer), [[council-loop]] (Phase 1
rulings preflight), [[smoke-test]] (Phase 5 exists; FLLWUP-6 note superseded),
[[engineering-board]], [[index]]. Key takeaway: capability is enforced at
selection, never persistence; byte-splice beats re-serialize on committed
files; the stall-window invariant holds at every dispatch layer.

## [2026-09-04] ingest | EPIC-4 Run Ledger — Model Eval Harness (v0.15.0/v0.16.0)
Filed `vault/raw/2026-09-04-epic4-run-ledger.md`, then ingested it plus the five
EPIC-4 ruling/design sources. Created [[model-eval-harness]], [[eval-store-contract]],
[[cell-aggregation]], [[grader-topology]], [[deterministic-merge-check]], [[chain-promotion]],
[[procedures-vs-commands]] + 7 source pages. Updated [[smoke-test]] (Phases 0–4,
standing falsifier discipline), [[card-id-allocation]] (divergent-mainline union-merge
lesson: preserve SHAs cited in card records), [[council-loop]] (deterministic merge
overlay), [[procedure-commands]] (first TS product commands), [[engineering-board]],
[[pi-council-overview]] (arc → v0.16.0). Contradictions flagged: grader-topology
first-write-wins superseded by Q1 repeat; O1 key extended by version pair; EV-21
ruling's "procedure file" slip reconciled to TS command; acceptance "variance" bound
as σ.

## [2026-09-04] ingest | EPIC-3 Run Ledger — Council-Decomposed Features-New (v0.15.0)
Ingested the EPIC-3 autonomous run: /features-new rebuilt as a three-wave
seated deliberation with a bounded session (3 rounds, fixed-endpoint
convergence, mechanical-verbatim fallback), the two-part gate presentation
(attribution-free Part 1, presented-never-written Part 2 ledger), README
honesty fix, and the operational lessons (stale-clone id collision reconciled
by union merge; long blocking council_waits read as stalls — poll in ≤8-min
slices; confabulated judge REJECT re-dispatched with facts, not argued).
Captured the raw ledger at vault/raw/2026-09-04-epic3-run-ledger.md.
Flagged: /council's early-stop clause vs /features-new's no-early-stop is a
deliberate scoped divergence (recorded on council-loop, not a contradiction);
procedure-commands' old solo-decomposition framing superseded.
- **Created:** sources/2026-09-04-epic3-run-ledger, three-wave-decomposition,
  presented-never-written, card-id-allocation
- **Updated:** council-runner, hub-job-supervision, procedure-commands,
  engineering-board, override-resolution, smoke-test, council-loop,
  product-owner, principal, skeptic, facilitator, judge, pi-council-overview,
  index, log

## [2026-09-03] ingest | v0.14.0 — Domain-Neutral + Stack-Agnostic
Ingested the v0.14.0 release (commits d3a6f38 / 7d5bfa3 / 033f450 / dd49bf1):
seats, procedures, and wiki pages stripped of the EV-charging/PLN product
domain (AGENTS.md convention #1 inverted: "opinionated on purpose" → "domain-
neutral by design"; grounding flows only via <repository_grounding>), Bun/TS
stack assumptions replaced by the repo's own tooling (scaffold preflight now
invites the consumer's own gates), 28 superseded specs/plans archived to
wiki-pointing stubs, prose regression guards added. Created the source page;
updated pi-council-overview (version → v0.14.0, new table row, "domain prose
ships as-is" claim reconciled to procedural-only doctrine), updated index.
- **Created:** sources/2026-09-03-v0.14.0-domain-neutral-stack-agnostic
- **Updated:** pi-council-overview, index, log
- **Contradictions flagged:** 1 — overview claimed "the seats' domain prose
  (portfolio doctrine, gate discipline) ship as-is"; v0.14.0 removes exactly
  that. Reconciled: procedural doctrine ships, domain grounding is per-repo.

## [2026-09-03] lint | Mechanical lint pass — post-v0.14.0 drift sweep
Ran the Lint operation against repo state (HEAD = v0.14.0). Mechanical fixes:
council-loop "15 steps" was missing step 0 (preflight) — added, matching
`council/procedures/council.md` steps 0–14; run-transcripts "EPIC-2 v0.12.x" →
released as v0.13.0; dropped llm-wiki's dangling `vault/.llm-wiki-bootstrap.md`
citation (file no longer exists); council-theme's `council/agents/AGENTS.md`
source path → repo-root `AGENTS.md` 9.6; garbled text fixed (designer summary
"fears durably evidence" → "files durable evidence"; owner heading "the four
gates, is exposed"); product-owner/steward inline Related/Sources → proper
`##` sections; owner/skeptic frontmatter `sources` → quoted-array form;
preflight.md trailing fragment dropped; council-runner gained its first
[[smoke-test]] link. No broken wikilinks, no orphans, index complete,
frontmatter schema clean.
- **Changed:** council-loop, run-transcripts, llm-wiki, council-theme,
  designer, owner, skeptic, product-owner, steward, preflight, council-runner,
  log
- **Contradictions flagged:** 2 — (1) v0.14.0 shipped (domain-neutral +
  stack-agnostic refactors) with no wiki ingest yet; (2) judge page says
  "Deliberately NOT a Council seat" while seats/index count it among the nine.
  Both left for human steer.

## [2026-08-26] lint | Wiki lint pass — v0.13.0 + stale-claim reconciliation
Ran the Lint operation. Fixed mechanical issues (log.md EPIC-2 entry out of
chronological order → moved to top; mcp-support header note v0.2.0→v0.11.0 →
v0.11.2; 9 source pages missing `aliases`; broken `[[superpowers-dependency]]`
link → plain text). Recorded the v0.13.0 release (EPIC-2 now tagged, commit
fae42f3) in pi-council-overview; reconciled council-theme's stale "modal"
references to the inline panel; aligned mcp-support's "fixed loopback URI"
claim with the v0.11.1 registered-URI derivation. No orphan pages; index
complete.
- **Changed:** log, pi-council-overview, council-theme, mcp-support,
  9 source pages (aliases)
- **Contradictions flagged:** 3 (v0.13.0 release unrecorded; council-theme
  "modal" vs EPIC-2 inline; mcp-support "fixed URI" vs v0.11.1 derivation).
  Reconciled, not silently overwritten.

## [2026-08-26] ingest | EPIC-2 Inline Council Job Tree
Ingested the whole EPIC-2 run: /council-tree became an **inline below-editor
panel** (EV-7 per-row last activity via a transcript timestamp seam) with
editor-driven arrow-key focus (EV-8) and Enter opening inline progress
(EV-9). Created the council-job-tree-inline concept page and 5 source pages
(design-ev8, po-ev8-ruling editor-driven, design-ev9, design-ev9-round2,
po-ev9-tiny-regime-floor min-height-7). Reconcord run-transcripts
(modal → inline), added the EPIC-2 row to pi-council-overview (still v0.12.1,
tag pending), cross-linked council-theme, updated index.
- **Created:** council-job-tree-inline + sources/2026-08-26-design-ev8,
  sources/2026-08-26-po-ev8-ruling, sources/2026-08-26-design-ev9,
  sources/2026-08-26-design-ev9-round2, sources/2026-08-26-po-ev9-tiny-regime-floor
- **Updated:** run-transcripts, pi-council-overview, council-theme, index
- **Contradictions flagged:** 1 — run-transcripts claimed /council-tree is a
  v0.11.4 full-screen modal; EPIC-2 replaces that with the inline below-editor
  panel (per the card goal). Reconciled, not silently overwritten; the modal
  path survives only behind navigator.ts:57 (FLLWUP-4).

## [2026-08-26] ingest | Theme module resolution fix (v0.12.1)
Ingested the bug/root-cause/fix: in an installed package the council theme
silently never activated because `loadPiThemeModule` located pi's theme
module via a bare-specifier `import.meta.resolve("@earendil-works/pi-
coding-agent")`, a filesystem walk pi's extension remap does NOT cover —
the plugin clone's node_modules has no peer, so it threw "Cannot find
module". Fixed by walking pi's own install root with public getPackageDir().
Created sources/2026-08-26-theme-module-resolution-fix; folded the resolution
invariant into council-theme (new "Locating pi's theme module" subsection +
cross-ref from Contradictions #2); added the v0.12.1 row to
pi-council-overview; updated index. Fix itself committed as `392dce7`, version
bumped 0.12.0→0.12.1 (tag pending).
- **Created:** sources/2026-08-26-theme-module-resolution-fix
- **Updated:** council-theme, pi-council-overview, index
- **Contradictions flagged:** none

## [2026-08-26] lint | Wiki consistency pass
Ran the Lint operation. Fixed stale claim (pi-council-overview: theme epic now
v0.12.0-tagged, not "yet-to-be-tagged"), re-pointed the one broken wikilink
superpowers-dependency → [[council-dependencies]] in log (left the
plain-text historical mentions intact), added the [[2026-08-23-agents]] source
cross-ref to seats/override-resolution/repository-grounding Sources, and
grounded remote-oauth-login with the RFC 7636 (PKCE) citation + Sources
entries. No orphan concept pages; frontmatter schema clean; "three production
bugs" vs Bug 1-4 is accurate (Bug 4 is repo hygiene).
- **Changed:** pi-council-overview, log, seats, override-resolution,
  repository-grounding, remote-oauth-login
- **Contradictions flagged:** none

## [2026-08-26] ingest | Smoke Test v0.12.0 clean green
Recorded the unattended smoke-test run of v0.12.0 (bun run smoke, EXIT=0):
full /council EV-1 loop + /features-deliver EPIC-1 epic green from a fresh
container, tsc clean, 5→18 test suite, exact CLI probes. Created
sources/2026-08-26-smoke-v0.12.0; updated smoke-test (added the clean-green
datum to Track record), pi-council-overview (v0.12.0 version row + header),
council-theme (cross-link), index. No contradictions — this run confirms the
harness is now a stability gate, not a bug-hunter.
- **Created:** sources/2026-08-26-smoke-v0.12.0, vault/raw/2026-08-26-smoke-v0.12.0
- **Updated:** smoke-test, pi-council-overview, council-theme, index
- **Contradictions flagged:** none

## [2026-08-25] ingest | EPIC-1 Council Theme subsystem
Ingested the EPIC-1 theme deliverable — the oh-my-pi-palette theme subsystem
(EV-1 port, EV-2 config, EV-3 activation, EV-4 compliance/repaint) and the
design + governance reasoning trail behind it. Created the council-theme
concept page and 5 source pages (design-ev1-round2, po-ev1-escalation,
design-ev3, design-ev3-round2, design-ev4-round1); updated council-config
(theme section + reserved key), run-transcripts (token-drawn modal + live
repaint), pi-council-overview (EPIC-1 row), index. Flagged 4 contradictions
between raw designer positions and the settled spec/rule (see the page's
Contradictions section).
- **Created:** council-theme, sources/2026-08-25-design-ev1-round2,
  sources/2026-08-25-po-ev1-escalation, sources/2026-08-25-design-ev3,
  sources/2026-08-25-design-ev3-round2, sources/2026-08-25-design-ev4-round1.
- **Updated:** council-config, run-transcripts, pi-council-overview, index.
- **Contradictions flagged:** 4 (EV-3 ui.theme vs env variance; tempfile vs
  in-memory; sentinel//settings vs RULING 2 + FLLWUP-1 deferral; custom-pair
  activate-vs-block).

## [2026-08-25] ingest | /council-tree full-screen modal backdrop (v0.11.4)
Ingested the v0.11.4 fix: /council-tree and the transcript viewer rendered as
bare overlays — the TUI compositor has no backdrop (OverlayOptions lacks a
background/dim field; compositeTuiLine splices lines over the base), so the
session UI showed through. New withModalFrame draws a full-screen opaque
backdrop (theme.bg customMessageBg) + centered bordered panel; both open
paths use overlayOptions width/maxHeight 100% anchor top-left; CouncilTree
windows to maxRows around the selection.
- **Created:** sources/2026-08-25-council-tree-modal.
- **Updated:** run-transcripts (modal presentation + Related), pi-council-overview
  (v0.11.4 row, commit count 85→87), index.
- **Contradictions flagged:** none.

## [2026-08-25] ingest | /council-init --approve trust fix (v0.11.3)
Ingested the v0.11.3 fix: /council-init's pi install -l failed headless with
"Project is not trusted" because pi's trust prompt never appears in
non-interactive modes (defaultProjectTrust "ask" = untrusted). Running
/council-init IS the approval — it now passes --approve (scoped to the
single command) when ctx.isProjectTrusted() is false via a new installArgsFor
helper. superpowers passed earlier because it was already pinned.
- **Created:** sources/2026-08-25-council-init-approve.
- **Updated:** council-dependencies (enforcement + Related), pi-council-overview
  (v0.11.3 row, commit count 83→85), index.
- **Contradictions flagged:** none.

## [2026-08-25] ingest | Live runtime refresh after MCP login (v0.11.2)
Ingested the v0.11.2 fix: /mcp login and /mcp auth stored credentials but
never reconnected the live runtime, so /mcp list kept showing the stale
unauthenticated/tools=0 captured at session start. New refreshServerRuntime
reconnects after header/oauth login and auth (phase 2), fixing status +
dispatch accuracy; tool registration still needs /reload. Test tightened
(was vacuous toContain('connected') — 'not connected' contains it).
- **Created:** sources/2026-08-25-mcp-login-refresh.
- **Updated:** mcp-support (status-freshness section + v0.11.2 lineage),
  pi-council-overview (v0.11.2 row, commit count 81→83), index.
- **Contradictions flagged:** none — the design's "refresh after login" was
  aspirational and is now real (noted, not a conflict).

## [2026-08-25] ingest | Remote OAuth redirect-URI fix (v0.11.1) — catalog completion
Completed the v0.11.1 ingest: source page filed, catalog + overview updated.
- **Created:** sources/2026-08-25-remote-mcp-oauth-fix.
- **Updated:** pi-council-overview (v0.11.1 row + commit count 76→81),
  index (fix source entry), remote-oauth-login + mcp-support (source backlink).
- **Contradictions flagged:** (none new — the "fixed constant" correction was
  recorded in the earlier entry).

## [2026-08-25] ingest | Remote OAuth redirect-URI fix (v0.11.1)
Ingested the v0.11.1 bugfix for the reported invalid_request "redirect_uri
does not match any of the OAuth 2.0 Client's pre-registered redirect urls".
Root cause: a persisted DCR client (from an earlier loopback login) has a
fixed registered redirect-URI list; the login flows advertised a foreign URI
(the remote 127.0.0.1:8765 constant, or a fresh ephemeral listener port) and
Clerk rejected it. Fix: redirectUrl derives from the client's registered
redirect_uris[0]; loopback login pre-invalidates stale clients (re-DCRs them)
so the browser opens once with the correct URL. Fixture AS now echoes +
validates redirect_uris Clerk-style so the class is caught.
- **Updated:** remote-oauth-login (registered-URI derivation + stale-client
  re-registration), mcp-support (same, + v0.11.1 version lineage).
- **Contradictions flagged:** remote-oauth-login/mcp-support previously stated
  the redirect URI is "the fixed 127.0.0.1:8765 constant" — now derived from
  the registered client's list when one exists. Reconciled, not silently
  overwritten.

## [2026-08-25] ingest | Remote MCP OAuth login (v0.11.0)
Ingested the v0.11.0 remote-login feature: the two-phase copy-paste OAuth flow
for headless/remote agents (/mcp login --remote prints the authorization URL;
/mcp auth <name> <pasted-url> exchanges the code). The crux: the PKCE verifier
moved from an in-memory provider field to the persisted auth store
(oauth.verifier, single-use), making the flow divisible across two commands.
No tunnels — fixed 127.0.0.1:8765 loopback URI + PKCE (code useless without
the verifier, which never leaves the agent machine). Auto-detects headless via
SSH_TTY / no DISPLAY; --remote/--local override.
- **Created:** sources/2026-08-25-remote-mcp-oauth, concept remote-oauth-login
  (the pattern generalizes beyond MCP — the user's own cross-agent workflow).
- **Updated:** mcp-support (command surface + verifier schema + two-phase flow
  + security correction), pi-council-overview (v0.11.0 row + commit count
  75→76), headless-pi (auth-half cross-link), index.
- **Contradictions flagged:** mcp-support claimed the OAuth callback "validates
  state" — the code never did (loopback listener extracts only code; `state`
  in oauth.ts is discovery state). Corrected to match code; the paste path
  scopes state validation out. Also corrected mcp-support's stale version
  lineage (was v0.2.0→v0.4.0, now through v0.11.0). Reconciled, not silently
  overwritten.

## [2026-08-25] lint | Wiki lint pass + run-transcripts page
Ran the Lint operation: fixed 11 pages of mechanical issues (stale claims in
preflight/owner/overview, corrupted seat-derived wording in judge/skeptic/
consolidator, broken link + typos in sources/readme, mcp-support, llm-wiki,
repository-grounding, designer, engineering-board). No contradictions between
pages remained after the v0.10.0 ingest; zero orphans.
- **Created:** concept run-transcripts (v0.9.0 run substrate + /council-tree
  viewer) per human steer on the lint gap.
- **Updated:** hub-job-supervision (Related link), index.
- **Contradictions flagged:** preflight's import-dataset claim (stale vs
  scaffold), owner's ":high count" (stale), overview commit count (41→75).
  Reconciled against the code, not silently overwritten.

## [2026-08-25] ingest | Unattended smoke test + the bugs it caught (v0.10.0)
Ingested the smoke-test round: the definitive unattended end-to-end test
(container + fixture + 3 phases + kill-shot probes), the headless-pi operating
rules it depends on, and three production bugs it caught — headless procedure
dispatch (silent no-op), MCP startup crashes, and hub tools never reaching seat
children (`/features-deliver` broken end-to-end). Released as v0.10.0.
- **Created:** sources/2026-08-24-unattended-smoke-test-design,
  sources/2026-08-24-unattended-smoke-test-plan,
  sources/2026-08-25-smoke-test-bugfixes, concepts smoke-test, headless-pi.
- **Updated:** seats (hub-grant allowlist correction), council-runner (dispatch
  claim corrected), procedure-commands (headless dispatch), hub-job-supervision
  (child tool visibility), pi-council-overview (v0.8.0 → v0.10.0 + version rows),
  index.
- **Contradictions flagged:** seats.md's "hub grant exposes …" (registration-only
  until v0.10.0), council-runner.md's "dispatches the working seats" (aspirational
  until v0.10.0), pi-council-overview.md version v0.8.0 (stale). Reconciled, not
  silently overwritten.

## [2026-08-24] ingest | Ask-user-question dependency (second scaffold dependency)
Ingested the addition of the rpiv-ask-user-question extension as a second
project-local dependency: superpowers.ts generalized into a
COUNCIL_DEPENDENCIES list, /council-init installs both, preflight asserts both.
- **Created:** sources/2026-08-24-ask-user-question, concept council-dependencies
  (renamed from superpowers-dependency), concept ask-user-question.
- **Updated:** preflight (new gate), non-clobbering-scaffold (plural deps),
  council-loop + pi-council-overview + index (link re-points).
- **Contradictions flagged:** superpowers-dependency's resolveSuperpowers /
  superpowers.ts references superseded by resolveCouncilDependencies /
  dependencies.ts; preflight + non-clobbering-scaffold only described the
  single superpowers dependency. Reconciled, not silently overwritten.

## [2026-08-24] ingest | Seat/procedure mechanism-reference hygiene (bugfix)
Ingested the uncommitted bugfix pass: `deliver.md` → `features-deliver.md`,
removed the repo-specific `GATE-EVIDENCE.md` gate path, hardcoded `.pi` →
`CONFIG_DIR_NAME`, corrected the `council_dispatch` seat description, and
replaced the stale "agent registry / restart" framing with disk-at-dispatch-time
seat resolution. Also fixed seed typos found along the way.
- **Created:** sources/2026-08-24-bugfix-seat-prose.
- **Updated:** council-runner, council-loop, procedure-commands,
  hub-job-supervision, override-resolution, seats, llm-wiki (typo), index.
- **Contradictions flagged:** none — the wiki never repeated the stale
  references; these fixes refine, not reverse.

## [2026-08-23] ingest | Committed .council.json override layer (v0.7.0)
Ingested the v0.7.0 engine change: per-seat model/thinking field overrides in a
committed `.council.json`, applied inside `loadSeat`, scaffold-seeded
non-clobbering, plus the 12th AGENTS.md convention.
- **Created:** sources/2026-08-23-council-json-override,
  concept council-config.
- **Updated:** override-resolution (two-tier + field-merge flag),
  seats (schema override note), non-clobbering-scaffold (.council.json listing),
  pi-council-overview (v0.7.0 row), sources/2026-08-23-agents
  (twelve conventions), + 9 seat entity pages (cross-links).
- **Contradictions flagged:** AGENTS.md convention count 11 → 12; and
  override-resolution's "no merging at file level" claim is now only
  filename-tier truth — `.council.json` merges per-field (noted, not
  silently overwritten).

## [2026-08-23] ingest | Repo-doc seed (pi-council)
Seeded the wiki from this repo's own docs + git history + codebase via the
ingesting-repo-docs skill. Discussed plan with the human first; wrote 26 pages.
- **Created:** pi-council-overview, seats, council-loop,
  engineering-board, procedure-commands, repository-grounding, override-resolution,
  non-clobbering-scaffold, model-output-floors, superpowers-dependency,
  hub-job-supervision, mcp-support, preflight, llm-wiki + 9 seat entities
  (owner..council-runner) + 3 more concept pages.
- **Sources filed (7):** readme, agents, pi-council-design-spec,
  mcp-support-design-spec, pi-council-implementation-plan, mcp-implementation-plan,
  context7-preflight-plan.
- **Manifest:** vault/.repo-docs.tsv recorded -- 24 NEW doc files pinned to commit.
- **Key takeaway:** pi-council generalizes the originating council + wiki into an
  installable, override-able package; the wiki + board are the durable product.

## [2026-08-23] query | Drop the git-history page
Removed `git-history-and-releases` after human review; its version-arc and
commit-discipline content was redistributed into [[pi-council-overview]],
[[preflight]], [[mcp-support]], [[council-dependencies]], and
[[model-output-floors]].

## [2026-08-22] scaffold | LLM Wiki initialized
Vault scaffolded; index.md and log.md created. No sources ingested yet.

<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] <op> | <title> -->
