---
id: FLLWUP-54
title: Wiki page for the red-base evidence convention
state: In Review
owner: null
epic: EPIC-9
goal: vault/wiki carries a red-base-evidence page, produced through /wiki-ingest from the FLLWUP-47 seat-prose convention, that a seat or engineer can cite.
---

## Intent

FLLWUP-47 R6 ruled the wiki-ingest out of that card's scope as a standing
step-14 offer, not a fold-in, while noting a wiki page "may be filed as a
separate follow-up if wanted". The convention now lives only as normative
packaged seat prose (`council/agents/owner.md`, `council/agents/skeptic.md`);
`vault/` is grounding prose and is written only through `/wiki-ingest`, never
hand-edited. This card is that optional follow-up: ingest a red-base-evidence
page (the seven fields, the comparison triple and gating rule, the
Skeptic-derived boundary, the true EV-41 causal story) so later cards can cite
it. Filing it is optional — if not wanted, the card is simply not promoted.

## Run record (features-deliver, run 2)

### Step 1 — classification (facilitator)

- **Promotion: `Backlog` → `Ready`, applied per the run-2 Phase-1 scope ruling.** The ruling
  (recorded human decision, immutable and binding) made this card in scope and wanted; the
  orchestrator's dispatch of this runner carries that ratification. Applied and cited, not
  re-asked and not re-decided.
- **Path: mechanical.** The `goal` fixes the deliverable precisely: one red-base-evidence page
  ingested through the fully-defined `/wiki-ingest` operation (`vault/CLAUDE.md` Ingest steps
  1–8), from a fixed source (`vault/raw/2026-09-17-po-fllwup47-step6-ruling.md`), documenting an
  already-landed, already-ruled convention (FLLWUP-47 R1–R6, merged via PR #64 at `a1d805a`).
  No cross-seam surface and no spec ambiguity — the card names the source, the operation, and
  the content boundary. Mechanical cards skip steps 2–6 and proceed to step 7.
- **Surface-touching: no (recorded).** The deliverable is grounding prose under `vault/wiki/`
  read by seats and engineers — the same deliverable class FLLWUP-47's step-1 record classified
  as not surface-touching. It changes no person's visible product surface and adds no
  user-visible copy, empty state, or error state. No `designer` is seated on this card.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches `owner` (steps 7–8),
  `skeptic` (step 9), and `judge` (step 10) — the mechanical-path set. All three resolve from
  the packaged seat set
  (`/home/tista/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/{owner,skeptic,judge}.md`,
  each file's `name:` matching its filename, verified first-hand this turn). This checkout has
  **no `.pi/agents/` directory** (verified: `ls -d .pi/agents` → `No such file or directory`),
  so nothing shadows the packaged seats. `product-owner` / `steward` are escalation-only and
  are never dispatched by this container.
- **Environment (facilitator-read, first-hand):** main checkout clean (`git status --short`
  empty); `HEAD == origin/main == d6264c6209f9e07f7539db6704ed2e9c26e6e02f`. The landed
  convention block is present in both seat files (`<!-- red-base-shared-start/end -->` at
  `owner.md:123–189` and `skeptic.md:87–153`); `vault/wiki` carries no red-base page today (the
  only `red-base` hits under `vault/wiki/` are mentions inside two run-ledger source pages).
  `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md` exists and is the ingest source.
- **Rulings applied (run-2 Phase 1, binding):** scope ruling (above); **R2** merge =
  `gh pr merge <PR> --squash --admin --match-head-commit <X>` (run-scoped authorization; all
  five deterministic criteria still hold in full); **R3** step-12 record push direct to `main`
  (use disclosed in the runner's report); step-13 follow-up confirmation re-homed to
  `product-owner`, **pre-write** — this container drafts, never writes an unapproved follow-up,
  and never dispatches `product-owner` or `steward`.
- **Known open point, routed not decided:** the Ingest operation's step 2 ("Discuss key
  takeaways with me BEFORE writing — wait for my steer") is a human steer gate. No run-2
  Phase-1 ruling names it. Per the authority map, judgment re-homes to `product-owner` via the
  orchestrator: this container escalates with the takeaways when the gate is reached, and never
  self-steers or hand-edits under `vault/` outside the `/wiki-ingest` operation.
- **Gate set for this repo:** `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`
  (the `gates` CI workflow runs exactly these). Criterion 2 is
  `gh pr checks <PR> --json name,state,workflow` keyed on `workflow`; the `gates` workflow must
  appear `SUCCESS` on the PR head SHA. The FLLWUP-27 branch-freshness `FAIL` is a known
  by-construction artifact once a facilitator record commit advances `origin/main` past a
  branch cut; recorded verbatim, never reclassified, never used to weaken a criterion; the
  step-11 re-run set is `tsc` / `bun test` / `validate.py`.

### Step 7–8, dispatch 1 — takeaways packet derived; **steer gate reached → `ESCALATION`**

`owner` (`job-17.1`, 5.1m, 20 turns, `stopReason=stop`, tokens in 277411 / out 8146 / cR
1033472 / cW 0 / reason 3176 / total 1319029, cost≈$0.0460 catalogue) was dispatched with the
card only, instructed to derive the Ingest step-2 takeaways packet from first-hand reads (the
raw source, both seat files' marked blocks, `council/cards/FLLWUP-47.md`, `vault/CLAUDE.md`,
index/log, and the cross-link pages) and to **stop before any write**. It did: zero files
written, created, or edited; main checkout untouched.

Its takeaways packet (carried to the orchestrator verbatim in the `ESCALATION`): proposes one
concept page (`Red-Base Evidence`, `vault/wiki/red-base-evidence.md`) plus one source summary
page (`vault/wiki/sources/2026-09-17-po-fllwup47-step6-ruling.md`), six targeted updates
(owner, skeptic, deterministic-merge-check, gate-parity, main-repo-immutability,
product-owner), bidirectional cross-links, and three flagged conflicts — chief of which: no
wiki page carries the known-wrong harness-copy cause, so the true EV-41 causal story lands as
the source page's correction story; and the EPIC-9 run-ledger page's "declined by the human at
the step-13 gate" sentence is an apparent-not-real conflict needing a lineage clarification on
the new page (not an edit to the ledger page). Four open questions it left to steer:

1. One concept page vs three (owner recommends one, facets as sections).
2. Canonical term (owner proposes "Red-Base Evidence", aliases "red-at-base evidence",
   "red-base convention").
3. Update-set breadth: six pages vs trimmed to owner/skeptic/index/log.
4. The "earlier decline ≠ standing decline" lineage sentence on the new page (owner
   recommends yes; no edit to the ledger page).

No Phase-1 ruling names the Ingest step-2 steer gate; per the authority map the judgment
re-homes to `product-owner` via the orchestrator. This container escalates rather than
self-steers. Card remains `In Progress` pending the ruling; the write phase (Ingest steps 3–8,
in a worktree branch, then the three-gate set) is scoped and awaits steer.

### Ruling on the step-2 steer gate — `product-owner` (job-18), appended verbatim

**product-owner (job-18) — approve the owner's takeaways packet in full.** The owner may proceed to Ingest steps 3–8 with title `Red-Base Evidence`, filename `vault/wiki/red-base-evidence.md`, the one source summary page `vault/wiki/sources/2026-09-17-po-fllwup47-step6-ruling.md`, and all six cross-link updates.

Per-element rulings:
- **Element 1 — one concept page (not three) + one source page: APPROVE.** The triple and the two-class boundary are inseparable facets of one convention; splitting them would force a reader to re-derive the comparison rule across pages.
- **Element 2 — title "Red-Base Evidence", aliases `["red-at-base evidence", "red-base convention"]`, filename `red-base-evidence.md`: APPROVE.** Title Case matches the wiki convention; the hyphenated form matches the `red-base-shared` markers already shipped in both seat files (`owner.md:123,189`; `skeptic.md:87,153`); "Convention" in the title is redundant.
- **Element 3 — all six updates (owner, skeptic, deterministic-merge-check, gate-parity, main-repo-immutability, product-owner): APPROVE all six.** Each is load-bearing for a different surface; trimming to four would strand one of three grounding chains (R1's gate-parity citation, the immutability worktree-only requirement, the PO step-6 ruling source).
- **Element 4a — no existing page carries the known-wrong harness-copy cause; source page carries the correction: APPROVE** (exactly Ingest step 5's "flag explicitly — never silently overwrite").
- **Element 4b — EPIC-9 ledger page's "declined at step-13" sentence; lineage clarification on the new page, no edit to the ledger: APPROVE.** The ledger page faithfully summarizes its raw source; editing it would falsify the record.
- **Element 4c — nothing superseded: APPROVE as stated.**
- **Element 5 — verification: ACKNOWLEDGE as factual.**

**Execution packet for the owner (steps 3–8):**
1. Create `vault/wiki/red-base-evidence.md` (type: `concept`, summary: one sharp sentence on what the convention fixes and how it is compared).
2. Create `vault/wiki/sources/2026-09-17-po-fllwup47-step6-ruling.md` (type: `source`).
3. Update `vault/wiki/owner.md`, `vault/wiki/skeptic.md`, `vault/wiki/deterministic-merge-check.md`, `vault/wiki/gate-parity.md`, `vault/wiki/main-repo-immutability.md`, `vault/wiki/product-owner.md` — each with the specific change named in the card packet (no trimming).
4. Cross-link bidirectionally between the new concept page and the six updated pages, plus `index.md` (add the concept to Concepts; add the source to Sources) and `log.md` (newest-first entry).
5. Flag explicitly on the source page: the EV-41 causal-story correction (the six extra fails come from head `test/stub-child.test.ts` vs base `test/stub-child.ts`, enabled by an unrecorded `extensions/retry.ts` transplant; `test/ev40-harness/` and `ev41-tui.py` are inert in that configuration — per the Skeptic's transplant table in FLLWUP-47 step 4).
6. Add a lineage note on the new concept page (not on the EPIC-9 ledger page): "Wiki-ingest was declined at EPIC-9's step-13 gate (2026-09-16), re-offered as a separate follow-up at FLLWUP-47 R6 (2026-09-17), confirmed by `product-owner` job-20, and executed by FLLWUP-54."
7. Step-8 report: pages created (2), pages updated (6 + index + log = 8), contradictions flagged (1, the EV-41 causal correction).

Card remains `In Progress` until the gate set (`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`) is green on the worktree branch and merged-SHA CI is re-verified.

**Applied:** the steer is binding and covers the step-2 gate in full — the write phase
proceeds with the owner executing Ingest steps 3–8 per the execution packet, no element
re-opened.

### Step 8, dispatch 2 — write phase executed; PR open → `In Review`

`owner` (`job-19.1`, 8.8m, 32 turns, `stopReason=stop`, tokens in 96930 / out 16896 / cR 1729536 / cW 0 / reason 4249 / total 1843362, cost≈$0.0449 catalogue) executed the Ingest write phase in worktree `.worktrees/fllwup-54-red-base-wiki`, branch `feat/fllwup-54-red-base-wiki` cut at `origin/main` @ `314b4e9`. PR #73 open (verified first-hand: `state: OPEN`, head `f8c3f5a30a04dc0219417cc566d6a7aec2d5ae7b`) → `In Review` written from the observed artifact. Step-8 ingest report per the packet: pages created 2 (`red-base-evidence.md` concept with lineage note; source page with the explicit EV-41 contradiction flag), pages updated 8 (owner, skeptic, deterministic-merge-check, gate-parity, main-repo-immutability, product-owner + index + log), contradictions flagged 1 (EV-41 causal correction). Element 4b honored (ledger sentence untouched), 4c honored, lineage note only on the concept page. Owner local gates (verbatim from its report): preflight `PASS: preflight clean`; `bunx tsc --noEmit` exit 0; `bun test` 928 pass / 2 skip / 0 fail across 80 files (96.87s); `council/validate.py` clean. Disclosed incident: two initial `write` calls used session-relative paths and landed in the main checkout; files moved with plain `mv` (no git state change), main checkout `git status --short` clean, gates run after the move against the actual PR tree. Owner did not merge, poll CI, or touch council artifacts.

### Step 9 — Skeptic verification: `CLEAR`, no open objections

`skeptic` (`job-19.2`, 10.7m, 25 turns, `stopReason=stop`, tokens in 110039 / out 22970 / cR 965632 / cW 0 / reason 15571 / total 1098641, cost≈$0.0209 catalogue) verified the pinned subject: PR #73 head `f8c3f5a30a04dc0219417cc566d6a7aec2d5ae7b` in worktree `.worktrees/fllwup-54-red-base-wiki`, under the frame that step-9 verification precedes judging and the facilitator-executed merge. Verdict **CLEAR**, branch head verified at the pinned SHA. Eleven objections, all **`closed-green`**, real runs recorded: (1) exactly 10 wiki files changed, zero overlap with post-cut main record commits; (2) raw source untouched; (3) EPIC-9 ledger page byte-identical to main, "declined at step-13" sentence intact; (4) lineage note only on the concept page, packet sentence verbatim; (5) EV-41 contradiction flag present and cross-checked against repo history (all cited SHAs and files exist); (6) all six pages updated per packet, no trimming, bidirectional cross-links both ways; (7) index Concepts/Sources correct, log.md newest-first; (8) gates green in the head worktree — tsc exit 0, bun test 928 pass / 2 skip / 0 fail (95.72s), validate.py clean; (9) `mv` incident left main checkout clean, stray files absent; (10) wikilink targets resolve (skeptic corrected its own scanner bug — Obsidian normalized/alias resolution); (11) index summaries are one-line condensations, consistent with wiki style. Non-blocking observation recorded: job-number drift in the source record itself (job-18/job-20/job-17 across the card header, packet lineage, and product-owner wiki page) — deliverable reproduces the binding packet verbatim; drift is upstream of this card, not a deliverable defect. No open objections → criterion 3 of the deterministic merge check holds.

### Step 10 — Judge verdict: `PASS`

`judge` (`job-19.3`, 0.6m, 6 turns, `stopReason=stop`, tokens in 42444 / out 2431 / cR 87648 / cW 0 / reason 1048 / total 132523, cost≈$0.0108 catalogue) was dispatched with the card `goal` + the Skeptic step-9 evidence only, subject pinned to PR #73 head `f8c3f5a30a04dc0219417cc566d6a7aec2d5ae7b` in the head worktree, frame: judging precedes the facilitator-executed merge, which no seat performs. Verdict **PASS**: the concept page exists at the head (139 lines, `type: concept`, seven fields + comparison triple + two-class boundary + EV-41 causal correction + lineage note + bidirectional cross-links), production via `/wiki-ingest` confirmed by the log entry and lineage record, and the page is citable (indexed under Concepts, companion source page, contradiction flag explicit, raw source untouched, zero non-wiki files changed). Criterion 4 of the deterministic merge check holds.
