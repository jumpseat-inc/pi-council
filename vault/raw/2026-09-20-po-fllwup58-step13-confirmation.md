---
slug: po-fllwup58-step13
card: FLLWUP-58
epic: EPIC-9
seat: product-owner
step: 13
date: 2026-09-20
kind: ruling
---

# FLLWUP-58 — product-owner step-13 confirmation (two follow-up drafts → one card)

Subject: the two step-13 drafts carried on `council/cards/FLLWUP-58.md`
(1 — per-step `timeout-minutes` on the deterministic `install`/`tsc` gates
steps; 2 — compact-closing ceiling sites in the census scope). Neither was
written to `council/cards/`, per the pre-write gate (FLLWUP-69's pinning).

Card state at ruling: `Done`, merged as
`3ffb7d0167b70958fc2813c2cef7904f66680a79` (PR #77, head `6704ee77…`), `gates`
`SUCCESS` on head and on the merged SHA. This ruling settles only the fate of
the two drafts; it does not reopen a card whose five deterministic merge
criteria were observed and whose judge verdict was `PASS`.

Authority: the run-2 Phase-1 "Follow-ups (judgment row)" ruling
(`council/cards/EPIC-9.md`) re-homes `council.md` step 13's draft-then-confirm
gate to this seat. Direct precedent for the turn:
`vault/raw/2026-09-19-po-fllwup59-step13-ruling.md` (R1 confirmed-and-routed,
R2 dropped as over-engineering with a stated re-card trigger) and
`vault/raw/2026-09-18-po-fllwup56-step13-ruling.md`.

**Disposition in one line: both drafts' content is confirmed; it ships as ONE
card, `FLLWUP-70`, with draft 1's scope widened (every non-test step, not two)
and draft 2 merged into it rather than minted separately — per `EV-44`'s
merge-near-duplicates-before-drafting posture, because both edit the same
tripwire test and the same wiki section.**

---

## 1. Facts I verified myself, and where the drafts' arithmetic is wrong

I re-counted rather than trusting the packet, which is the habit this whole
line of work exists to install.

- **Compact-form test ceilings: 19 sites, not 18.** `^\}, <n>_000\);$` in
  `test/**/*.test.ts` → `test/hub.test.ts` ×10 (9×`15_000`, 1×`30_000`),
  `test/job-retry.test.ts` ×2 (`15_000`), `test/mcp/oauth.test.ts` ×6
  (5×`30_000`, 1×`45_000`), `test/mcp/commands.test.ts` ×1 (`30_000`).
  Σ = **420 000 ms** — which is exactly the sum the draft reported, so the
  draft's own count and sum are mutually inconsistent and the count is the
  error. **Record correction: 19 sites.**
- **All 19 are in non-gated files** (`test.skipIf` behind
  `COUNCIL_INTEGRATION`/`COUNCIL_MCP_INTEGRATION` exists only in
  `test/mcp/integration-context7.test.ts`), so all 19 sum into the
  *default-suite* floor.
- **The widened default-suite census:** 16 standalone + 19 compact = **35
  sites**, Σ = 2 585 000 + 420 000 = **3 005 000 ms ≈ 50.08 min** ⇒ floor
  `ceil(50.08) + 1` = **52**. Tree-wide true ceiling count = **37** (35 + the 2
  gated standalone sites), not the "36" in the draft and not the wiki's
  **18**.
- **Shipped 60 still binds** (52 ≤ 60), exactly as the draft said. Non-
  load-bearing today. What the draft did *not* say, and what my arithmetic
  turns up: **the gated-promotion headroom collapses from 10 minutes to 1**.
  Promote one gated site into the default CI run and the honest floor is
  `ceil((3 005 + 420)/60) + 1` = **59** against shipped **60**. The wiki today
  advertises "1.42× the operative floor"; the honest figure under the full
  census is **1.15×**, and after a promotion **1.02×**.
- `gates.yml` today carries exactly one `timeout-minutes` (on `- run: bun
  test`), no job-level line, `fetch-depth: 0` verbatim. The remaining
  un-bounded steps are `bun install --frozen-lockfile`, `bunx tsc --noEmit`,
  and `python3 council/validate.py` — **three**, not two.
- `test/fllwup58-gates-backstop.test.ts` asserts "exactly one `timeout-minutes`
  in the file", so draft 1's own edit **reds the shipped tripwire** unless the
  placement clause is re-expressed in the same commit. The draft did not name
  that; it is the card's real mechanism work, not the YAML.

## 2. R1 — draft 1: CONFIRMED, with the scope widened to every non-test step

**Ruling: the card bounds every step that is not the `bun test` step —
`bun install`, `bunx tsc`, and `python3 council/validate.py` — each with its
own tight per-step `timeout-minutes`, and never a job-level line.**

- My FLLWUP-58 ruling §2 named "those two deterministic steps". Ruling for two
  of three leaves a residual of the *same class* with no rationale for it: a
  wedged `python3` is bounded by the platform 360-min default exactly like a
  wedged `bun install`. The deciding principle is that this card exists to
  close a class, not to close a list; a partial application re-opens the
  follow-up it was meant to end. `validate.py` is sub-second locally, so its
  bound costs nothing and the rule becomes stateable in one sentence: *no step
  in the enforced record is bounded only by the platform default.*
- **Placement stays step-level for the same reason it was ruled step-level for
  the test step** (FLLWUP-58 §2, ground 3): a job-level number's meaning drifts
  with a preamble that contains `fetch-depth: 0` and only ever grows. Per-step
  bounds on the preamble steps are the *complement* of that argument, not an
  exception to it — they bound the preamble without coupling it to the test
  step's budget.
- **Design constraint on the constants.** Install/tsc/validate durations are
  not derivable from the tree, so unlike the test-step floor these are
  hand-set numbers. Hand-set numbers are the class that has gone stale four
  times in this record ("thirteen sites" → 16, "12 sites" → 16, "18 tree-wide"
  → 37, "18 sites" → 19). They must therefore carry the **same line↔doc parity
  marker treatment as the `60`** — the wiki states each bound in
  machine-extractable form and the tripwire asserts equality with the YAML —
  and each bound must be loose relative to its measured local time with
  hosted-runner headroom, never a drift alarm. Nothing in this makes the
  180 s drift threshold or the 60-minute test-step backstop enforce anything
  else.
- **The placement clause must be re-expressed, not relaxed.** The tripwire must
  still forbid any job-level `timeout-minutes` (that clause mechanically
  encodes PO FLLWUP-48 ruling 2's boundary) and still pin `bun test` ≥
  derived floor, while allowing exactly one bound per non-test step. Deleting
  or loosening the "exactly one" assertion is the wrong shape of fix.

## 3. R2 — draft 2: CONFIRMED as content, NOT minted as its own card

**Ruling: the census work folds into `FLLWUP-70`. The tripwire's derivation
becomes exhaustive over ceiling *writing form*, and the wiki's census figures
become derived rather than restated.**

I weighed dropping it as over-engineering, which is the disposition the draft
invited and the disposition I took one card earlier in this same run
(FLLWUP-59 R2). It does not carry over here, and the distinction is the one I
myself wrote in that ruling — **"there is no silent-green surface left to
find."** Here there is one:

- A ceiling written as `}, 300_000);` is invisible to the derivation, the
  derived floor silently under-counts, the tripwire stays green, and the
  guarantee the wiki states ("shipped ≥ the census floor, therefore it can
  never pre-empts an arm") is false with a green check on top. That is the
  exact decay class `[[retired-path-tokens]]` and this card's own OJ-1
  decisive ground were built to kill — a green check certifying an
  hand-maintained invariant. FLLWUP-59 R2's branch, by contrast, was already
  proven by the one probe that could fail it.
- It is not hypothetical-in-waiting only: **the claim is already wrong on the
  page.** The wiki's "18 tree-wide" is the *parser's* shape coverage, presented
  as the tree's ceiling census, and the "1.42× the operative floor" ratio is
  computed against the incomplete set (true 1.15×). The product's authoritative
  page over-claims its own safety margin today.
- The whole failure mode the strict reading was adopted to protect is
  attribution completeness. A compact-form arm is the one case where the
  mechanism this card shipped cannot see the thing it is bounding.

**Why one card, not two.** Both drafts touch `test/fllwup58-gates-backstop.test.ts`,
`.github/workflows/gates.yml`, and the same CI-timeout section of
`vault/wiki/test-suite-budget.md`; both answer one question — *does the gates
CI-timeout mechanism mean all of what it says?* Drafting them separately
buys two full-council rounds, two PRs and two merges to rewrite the same wiki
paragraph twice, and is the card-minting pattern `EPIC-10`/`EV-44` exist to
stop. This is a merge, not a split: neither draft gets a piece of the other's
work, and no content is lost.

**The mechanism the card must ship (not a one-time number refresh):** correct
the census to the full 35/37-and-Σ figures **and** pin the wiki's census
sentence to the derivation in machine-extractable form (count and Σ, like the
`Shipped backstop value (machine-parity marker):` line), with a compact-form
falsifier that reds when a `test(...)` ceiling written `}, <n>);` is invisible
to the sum. A card that only fixes "18"→"37" re-opens the same follow-up at
the next hand-counted edit.

**Hard boundary, stated now so the card cannot drift over it:** if the widened
derivation ever puts the default-suite floor above the shipped `60`, the card
must **not** raise the shipped value on its own. That is a sizing call on
FLLWUP-58's ruling and comes back here. Today it does not (52 ≤ 60), so the
shipped line stays at 60 and only the documentation and the derivation move.

## 4. What is not in either card (dropped, with the vehicle that carries it)

- **Any job-level `timeout-minutes`.** No vehicle; declined on the standing
  FLLWUP-58 §2 ground (a job number's meaning drifts with an un-tripwireable
  preamble). If whole-job coverage is ever wanted, it comes as a new card with
  a derived preamble bound, not as a line edit.
- **Re-sizing the shipped `60`.** Carried by the existing tripwire's floor
  assertion plus the §3 hard boundary above; no new card while 60 ≥ derived
  floor.
- **Gating live arms behind an opt-in, or touching the 180 s drift threshold.**
  Out of this family entirely; `[[test-suite-budget]]` PO ruling 3 governs.
- **Retro-editing `docs/superpowers/specs/2026-09-20-FLLWUP-58-design.md` or
  this card's run record** to carry the 19-site count. Specs and run records
  are point-in-time evidence (FLLWUP-59 R1's rule). The correction lands in
  `vault/wiki/test-suite-budget.md` through the card, and in this file.

## 5. Obligations to carry into the new card's step-1 context

1. `fetch-depth: 0` on the checkout step stays verbatim (FLLWUP-59 R2), and
   `test/fllwup58-gates-backstop.test.ts`'s `fetch-depth` parity test must keep
   passing.
2. Zero new live arms (FLLWUP-49 O10): all work is pure offline file reads.
3. No job-level `timeout-minutes`, asserted mechanically (FLLWUP-48 ruling 2's
   boundary stays encoded).
4. The shipped `60` stays `60`; a red from the widened floor is an escalation,
   not a fix.
5. No new AGENTS.md Hard convention (`test/fllwup25-agents-page.test.ts` parity
   coupling); the pointer already shipped on FLLWUP-58 is enough.
6. Goal written on a single line (FLLWUP-51).
7. Card state at write: `Backlog`. It is **not** this run's delivery scope — the
   run-2 Phase-1 scope ruling names `FLLWUP-50` through `FLLWUP-60`; promotion
   is the next decomposition's, ratified here per the promotion power, not by
   this confirmation.

## Grounding

- `vault/raw/2026-09-20-po-fllwup58-gates-backstop.md` §2 (the residual this
  card discharges; the anti-job-level ground), §3 (why 45 was rejected for
  thin floor margin — the same measure that makes the 1.15× figure material),
  §4 (derive-never-restate; placement assertion encoding FLLWUP-48 ruling 2).
- `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md` R2 — the
  over-engineering test I applied and the reason it fails differently here
  (silent-green surface exists); R1 — specs/records are not retro-edited.
- `council/cards/FLLWUP-58.md` steps 5–6 (consolidator's open items, ruling),
  step 9 (skeptic's non-blocking residual observation, "18 more sites,
  Σ 420 000 ms"), step 13 (both drafts verbatim), step 12 (merged SHA, CI green).
- `council/cards/FLLWUP-48.md` ruling 2 — separate CI-timeout rationales,
  separate decisions; this card is the *third* such decision, not an amendment
  of the first two.
- `test/fllwup58-gates-backstop.test.ts` — the shipped parser's exclusion list
  (compact closings documented as non-census terms: a scope decision conformant
  to the ruling, and the source of the residual), its "exactly one
  `timeout-minutes`" assertion, and its machine-parity marker pattern.
- `vault/wiki/test-suite-budget.md` — the "16 default-suite sites … 18
  tree-wide" sentence and the "1.42×" ratio this card corrects; the
  accepted-and-known gap paragraph §2 closes.
- `.github/workflows/gates.yml` (one step-level `timeout-minutes: 60`; three
  un-bounded steps), `package.json:28` (bare `bun test`, serial).
- `council/board.md` Ready/Backlog — `EV-44` (merge near-duplicate follow-up
  candidates before a card is drafted), `EPIC-10`, `FLLWUP-69` (pre-write
  confirmation gate). `[[card-id-allocation]]`, `[[retired-path-tokens]]`,
  `[[red-base-evidence]]`, `[[test-suite-budget]]`.

## Reversibility, end-to-end

Cheap, and asymmetric in the safe direction. The card is three YAML lines, one
wiki section, and one test-file parser: reverting is a one-line-per-site change,
and the tripwire re-derives its own floor from the tree on every run, so a
wrong bound or a stale census figure goes red rather than rotting quietly. The
one expensive-to-reverse object in the family remains the *reading* (strict /
any-arm) settled in FLLWUP-58 §1, and this ruling does not touch it — it only
makes the derivation honest about the census the reading is priced against.
Nothing here reverses a recorded human decision, declines a card outright, or
converts a temporary residual into a permanent one, so nothing reaches
`steward`.
