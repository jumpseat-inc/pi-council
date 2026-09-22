---
id: FLLWUP-105
title: Name the remediation route for a stale copied usages skill
state: Deliberating
owner: null
epic: EPIC-15
goal: council/procedures/usages.md instructs the agent that when the tool's stderr contains usages: could not write cache:, it must surface that line verbatim and give the consumer the two refresh commands — delete <repo>/$CONFIG_DIR_NAME/skills/usages/, then re-run /council-init.
---

## Intent

The reported warning was emitted by the *copied* tool at
`.pi/skills/usages/scripts/usages.py`, not by the package. The package fix
(BUG-2) reaches only future `/council-init` copies: `copyUsagesSkill` is
non-clobbering, and the skill is outside the scaffold tree with "no provenance,
no refresh path" (`TOOLING_FILES` covers only `council/validate.py` and
`council/cards/_template.md`). So an existing install keeps warning until its
copy is replaced. This card settles the delivery mechanism: it takes the
manual-route option and names the exact remediation, rather than building the
consent-gated refresh path — that widening touches a binding human decision
(the skill sits outside the scaffold tree by design) and a settled fence on
copied-payload refresh, and is escalated to the human instead. Re-running
`/council-init` is not a mechanism (T-USK1 pins that it skips).

## Acceptance

- A conditional sentence added to `council/procedures/usages.md`'s `**Report.**`
  section carries all four elements: the literal `usages: could not write
  cache:`, an instruction to surface it verbatim, the statement that the fix
  ships in a newer package version, and the two commands (delete
  `<repo>/$CONFIG_DIR_NAME/skills/usages/`; re-run `/council-init`).
- A mechanical pin in `test/` — never in `council/validate.py`, per the
  docs-card rule — asserts the procedure text contains the literal
  `usages: could not write cache:`, the path fragment `skills/usages/`, and the
  literal `/council-init`, so a later edit that drops the remediation goes red.
- `test/scaffold.test.ts`'s T-USK1 stays green and unedited: re-running
  `/council-init` alone remains a no-op, and this card does NOT add the copied
  skill to `/council-update`'s `TOOLING_FILES` or weaken non-clobbering — that
  widening is escalated to the human and is not this card's to take.
- A `vault/raw/` note records that an already-initialized consumer reaches the
  fixed tool only via delete-and-recopy, so ingest corrects the wiki's refresh
  sentence.
## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, this card.** The human authorized, for this run
  only, the admin-bypass merge `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA merge-check
  criterion 2 (`gates` workflow `SUCCESS`) was read against. Not extended to any
  later run; a SHA mismatch is a HALT, not a retry.
- **R2 — build order.** EPIC-15 runs serially: BUG-2, then FLLWUP-105, then
  FLLWUP-106. One runner at a time; never two against the board.
- **R3 — copied-skill refresh route (the escalation resolved).** The human ruled
  the manual route: `/council-update` does not take on refresh of
  `/council-init`-copied payloads outside `council/scaffold/`. This card ships
  the named delete-and-recopy remediation only; widening the refresh path is a
  separate scope change, not this card's.

## Run record (features-deliver / FLLWUP-105 — EPIC-15)

### Step 1 — gate, mode, surface bit (facilitator)

- **Card state promoted `Backlog` → `Ready` at container start.** Basis: the
  orchestrator's dispatch names this card explicitly with its Phase-1 rulings
  and binding acceptance (chain-promotion cadence, `vault/wiki/chain-promotion.md`
  — promotion trigger observed, not decided: predecessor BUG-2 merged `59fad63`
  (PR #104) is on local `main`, `python3 council/validate.py` clean after the
  edit). This container is the only runner in flight (R2); single-writer
  discipline holds. EPIC-15's own first bullet makes this promotion the
  load-bearing event ("the epic is not Done while `FLLWUP-105` is unpromoted").
- **Execution mode: `Deliberate`**, recorded on this dispatch's ROOT manifest
  (EV-68). Full path, steps 2–14. The full-vs-mechanical judgment is not made —
  a recorded mode is authoritative (council.md step 1). Roster: `owner`,
  `principal`, `designer`, `skeptic`, `consolidator`, `judge`; ruling seats are
  never dispatched by this container.
- **Surface-touching: yes.** The deliverable is user-facing copy on the `/usages`
  person surface: the remediation sentence in `council/procedures/usages.md`'s
  `**Report.**` section changes what a person is told when the tool's stderr
  carries `usages: could not write cache:` (same surface as the PO ruling's
  P2 finding — the `**Report.**` section currently routes only `!` limitation
  lines). On a full-council card this seats `designer` as a third generator in
  steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine packaged
  seat files are present in the installed package clone (`council/agents/`), and
  no repo-local `.pi/agents/` override directory exists, so nothing shadows them.
- **Environment:** step-0 preflight skipped per the autonomous-run substitution
  (Phase 0 cleared it). `python3 council/validate.py` → `All council artifacts
  valid`. Local `main` == `origin/main` at `6c83758` before this card's first
  record push.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (run on PR via
  the `gates` workflow). Card-specific acceptance adds the mechanical pin in
  `test/` asserting the procedure text carries the three literals, T-USK1
  green and unedited, and the `vault/raw/` note. Owner gates met in full
  regardless of change size.
- **Rulings applied here (cited, not re-asked):** R1 — merge authorization is
  run-scoped, but the merge is the orchestrator's act; this container opens the
  PR, gets `gates` green on the PR head, and reports `DONE` with the PR number
  and head SHA. R2 — serial build order (BUG-2 done). R3 — the copied-skill
  refresh route is the manual delete-and-recopy remediation only;
  `/council-update` does not take on refresh of `/council-init`-copied payloads
  outside `council/scaffold/`; no `TOOLING_FILES` widening on this card. The PO
  decomposition ruling (O3, `vault/raw/2026-09-23-po-epic15-decomposition-ruling.md`)
  already fixed the deliverable shape: one sentence in the packaged procedure
  plus the exact commands.
- **Decisions gate:** `active` per `.council.json` `gate.mode`, with the known
  `noul` answer-shape drift (FLLWUP-104) making gate calls fail mechanically.
  Expected; a failed gate call is not re-run, and step-13 candidates are held
  by draft title.

### Step 2 — round 1, independent first pass (jobs 2.2 principal, 2.3 designer, 2.5 owner)

*Dispatch note:* the owner's first two dispatch attempts (job-2.1, job-2.4) were
cancelled by this facilitator on a misread stall signal — usage counters freeze
during long tool reads, and the run substrate later showed job-2.4 was
mid-orientation with a tool result landing seconds before the cancel, not
stalled. No seat output was lost (neither attempt had produced a position); the
settled owner position is job-2.5, dispatched with neutral orientation facts
only. The three-dispatch ceiling was not tripped by a seat that failed to
produce output; the failure mode was facilitator-side and is recorded here.

**Principal (job-2.2), claims:**
- `renderProcedure` (extensions/index.ts:148-153) substitutes only
  `$COUNCIL_PROCEDURES` and `$ARGUMENTS` — **no `@CONFIG_DIR@` render for
  procedures**; the file already speaks literal `.pi/` in both places it names
  the copy. A `$CONFIG_DIR_NAME` token would reach consumers as dead prose.
- The remediation is a **three-step** operation, not two: update the package →
  delete the copy → re-run `/council-init`. Delete-then-reinit re-copies from
  the *installed* package; if it predates BUG-2 the loop copies the same buggy
  tool back. The sentence must connect the update to the commands explicitly.
- The falsifier is real **only if scoped**: a "repo contains" pin is satisfied
  by `usages.py` (contains the stderr literal) and `scaffold.ts`/`index.ts`
  (contain `skills/usages/`); the pin must read
  `path.join(PKG_ROOT, "council", "procedures", "usages.md")`. Run the removal
  arm (delete the sentence → red) to prove it.
- Over-pin guard: assert only the three literals, not full wording, section
  anchor, or command byte-strings.
- Suggests also asserting `usages.md` does **not** contain `$CONFIG_DIR_NAME`
  or `@CONFIG_DIR@`.
- The warning is **non-fatal** (report still ships) — must not read as a second
  STOP next to the preflight hard gate.
- FLLWUP-106 boundary: the sentence authorizes surfacing *one exact literal*
  verbatim; not "any other stderr", no causal narration.
- Wiki: `vault/wiki/non-clobbering-scaffold.md:72-76` already says
  "refreshing means delete-and-re-run-`/council-init`" — directionally correct;
  the ingest correction is a sharpening (re-run alone is a no-op per T-USK1;
  the re-copied tool comes from the installed package so it must be updated
  first). `vault/wiki/usages-report.md` needs no correction.

**Designer (job-2.3), claims + draft sentence:**
> "If the tool's stderr contains the literal `usages: could not write cache:`,
> surface that line to the user verbatim (no prefix, no rewording), tell them
> the fix ships in a newer package version but does not reach this repo's
> already-copied skill, and have them run `rm -rf .pi/skills/usages/` then
> `/council-init`."

- Trigger must be the exact literal, not a category ("cache errors") — the tool
  emits sibling stderr lines (`end date is before start date` :706,
  `OPENROUTER_MANAGEMENT_KEY is not set.` :711, fatal `could not write report:`
  :798) that must not trigger remediation copy.
- Verbatim relay framing ("no prefix, no rewording") closes the FLLWUP-106-
  adjacent confabulation gap in the wording itself.
- Commands copy-pasteable, in execution order (`rm -rf` then `/council-init`).
- Predictions P1–P6: loosened trigger over-fires; dropped verbatim framing gets
  paraphrased; prose commands get mis-copied; missing package-version framing
  reads as "my repo is broken" (bug filed); non-conditional placement pollutes
  successful runs; unordered commands get run in the wrong order.
- Prefers `.pi/skills/usages/` over `$CONFIG_DIR_NAME` (procedure file's
  existing voice; label as taste, swap is one word).

**Owner (job-2.5), claims + draft sentence:**
> "If the tool's stderr contains `usages: could not write cache:`, surface that
> line verbatim to the user and explain that the fix ships in a newer package
> version — first update the pi-council package, then delete the stale copied
> skill at `.pi/skills/usages/` and re-run `/council-init` to recopy the fixed
> tool."

- `.pi` literal, not `$CONFIG_DIR_NAME`: (a) no substitution for procedures —
  the token would ship unfilled; (b) the file's existing convention; (c) the
  pin asserts the loose fragment `skills/usages/` so either spelling passes.
  Reads `$CONFIG_DIR_NAME` in the goal as card-internal shorthand; flags for
  the judge that if bullet 1 is read as mandating the literal token, escalate
  rather than ship a broken placeholder.
- Pin: new file `test/usages-procedure.test.ts` (not an edit to
  `test/scaffold.test.ts`; not `council/validate.py`), reading
  `path.join(PKG_ROOT, "council", "procedures", "usages.md")` (`PKG_ROOT` from
  `extensions/seats.ts`, exported — hard convention 4), asserting containment
  of the three literals **plus a recommended 4th, `newer package version`**
  (bullet 1's third element is binding; red-on-rewording is the pin's job for
  a binding element). Containment only; no full-sentence match, no ordering
  assertions, no `.pi` prefix in asserted fragments.
- Pin doesn't verify section placement — prose-review item, not mechanical.
- `vault/raw/2026-09-24-fllwup-105-stale-usages-skill-recopy.md` naming the
  package-update-first precondition and the ingest correction target.
- Failure predictions: unscoped pin false-greens; `.pi`-prefixed pin
  false-fails a future substitution refactor; full-sentence pin false-fails
  rewording; sentence outside `**Report.**` or un-keyed to the stderr literal
  over-fires; omitting update-first ordering leaves the consumer looping on a
  no-op round trip; `$CONFIG_DIR_NAME` literal ships broken.

### Step 3 — rounds 2–3, bounded exchange (jobs 2.7/2.8/2.9/2.10/2.11)

*Dispatch note:* the owner's round-2 dispatch (job-2.6) stalled mid-orientation
(8+ min with no transcript activity — a genuine provider stall, distinct from
the round-1 misread); cancelled and re-dispatched once as job-2.9, which
settled. Designer/principal settled on first dispatch.

**Round 2 — convergence moves:**
- *Owner (2.9):* holds a 4th pinned literal (`newer package version`) as a
  separate additive assertion serving bullet 1's binding third element;
  concedes `rm -rf` spelled out; adopts designer's verbatim framing
  ("no prefix, no rewording"); concedes the principal's negative assertions
  but keeps them in the pin file; holds package-update-first and one rationale
  clause ("but does not reach the skill already copied into this repo") as
  remediation-necessary, not FLLWUP-106 causal narration; non-fatal close
  ("the report itself still ships"). Merged draft recorded on the card.
- *Principal (2.10):* holds against the 4th literal (T-overpin: a
  claim-preserving rewording "newer package version" → "fixed in the next
  release" keeps all four bullet-1 elements but trips the additive pin — red
  coupled to wording, violating bullet 2's stated purpose "a later edit that
  drops the remediation goes red"); withdraws file-level negative assertions
  to a renderer-level test (a file `not.toContain` cannot separate a bad
  literal from a legitimate future renderer refactor); proposes A/B variants
  to settle the 4th-literal dispute by test; converges on command form
  "name the path *and* give it runnable".
- *Designer (2.8):* concedes the three-step sequencing is load-bearing;
  concedes the "(no prefix, no rewording)" parenthetical is redundant if
  "verbatim" is paired with the pin's exact-literal check; holds `.pi`
  literal, literal `rm -rf` in the Run-block voice; new predictions P-new-1..5.

**Round 3 — full structural convergence:**
- *Owner (2.11) final position:* **pin ships with exactly the three enumerated
  assertions** in `test/usages-procedure.test.ts` scoped to
  `path.join(PKG_ROOT, "council", "procedures", "usages.md")` — containment of
  `usages: could not write cache:`, `skills/usages/`, `/council-init`; no 4th
  literal, no negative assertions, no section anchor, no ordering assertions.
  Bullet 1's third element stays binding as a **prose-review** item, not
  mechanical. Negative assertions dropped from this card entirely (not
  relocated — a renderer invariant test is engine-adjacent territory this
  card's acceptance does not authorize): follow-up candidate. Held: `.pi`
  literal; three-step ordering; FLLWUP-106 boundary; `rm -rf` command form;
  designer's verbatim framing; non-fatal framing.
- *Principal (2.10) final position:* holds against the lexical 4th literal but
  reframes it decidable-by-test — the correct additive assertion, if any, is
  the **operative step** (`updating the pi-council package`), which passes
  variant A (claim-preserving reword → green) and reds on variant B
  (remediation drop → red), unlike `newer package version` (reds on A).
  **Converges on pin-file negative assertions now + renderer substitution-set
  test as a follow-up candidate.** Declares the merged sentence **sound — no
  remaining defect**: element coverage complete, FLLWUP-106 boundary respected
  (the rationale clause makes the delete step non-skippable; it is not
  bug-cause narration), non-fatal close correct, absent "re-run" coherent.
- *Residual textual inconsistency (recorded, for the consolidator):* the
  owner's round-3 "final sentence" reverted to its round-1 text (prose
  "delete the stale copied skill", bare "verbatim", no rationale clause, no
  non-fatal close) while its own held list names the `rm -rf` command form and
  the designer's verbatim framing as converged, and the principal declared the
  round-2 merged draft sound. The two candidate ship-texts are:
  - **V1 (round-2 merged draft, principal-blessed):** "If the tool's stderr
    contains the literal `usages: could not write cache:`, surface that line
    to the user verbatim (no prefix, no rewording); explain the fix ships in a
    newer package version but does not reach the skill already copied into
    this repo, so — after updating the pi-council package — run
    `rm -rf .pi/skills/usages/` and then `/council-init` to recopy the fixed
    tool; the report itself still ships."
  - **V2 (owner round-3 final):** "If the tool's stderr contains
    `usages: could not write cache:`, surface that line verbatim to the user
    and explain that the fix ships in a newer package version — first update
    the pi-council package, then delete the stale copied skill at
    `.pi/skills/usages/` and re-run `/council-init` to recopy the fixed tool."
  Both carry all four acceptance elements and all three pin literals. The
  round cap (3) is reached; this textual choice goes to the consolidator.

### Step 4 — skeptic attack, all objections settled by run (job-2.12) — NO-BLOCK

Transplant battery in `/tmp/fllwup105` (6 sentence-states × 4 pin variants),
main tree untouched, scratch cleaned. Results:

- **O-scope — closed-green.** Sentence removed: scoped pin `3 fail` /
  repo-wide pin `1 pass`; implementation state: scoped `4 pass`. Repo-wide pin
  is satisfied by `usages.py`, `index.ts`, `scaffold.ts`, dozens of files —
  scoped pin vindicated.
- **O-overpin — closed-green.** Claim-preserving reword ("newer package
  version" → "fixed-in-the-next-release", all four bullet-1 elements kept):
  4-literal pin `1 fail`, converged 3-literal pin `pass`, op-step pin `pass`.
  T-overpin confirmed; the converged design's rejection of the 4th literal is
  empirically right.
- **O-A/B — closed-green, with measured residuals (carried, not blocking).**
  Op-step pin (`updating the pi-council package`) reds on variant B (update
  step dropped), passes variant A; converged pin green on S4/S5 — **variant B
  and S5 (both commands deleted, trigger+verbatim+version kept) are uncaught
  by the three-literal pin**, because `skills/usages/` and `/council-init`
  already live in the file's `**Run.**` section. The two non-trigger pin
  literals carry zero sensitivity to the sentence. Catching S4/S5 requires a
  sentence-exclusive literal (`recopy the fixed tool`) — the over-pin class
  the convergence rejected. The implementation satisfies the acceptance's own
  enumerated contract; the boundary is a property of that contract. Update-
  first is load-bearing: this repo's own `.pi/skills/usages/scripts/usages.py`
  is the pre-BUG-2 tool (diff verified), so a stale-install delete-recopy
  without the package update loops the bug back.
- **O-token — closed-green.** `renderProcedure` (extensions/index.ts:149-153)
  substitutes only `$COUNCIL_PROCEDURES`/`$ARGUMENTS`; no
  `@CONFIG_DIR@`/`CONFIG_DIR_NAME` rendering; `usages.md` speaks literal
  `.pi/` in all three path mentions. Dropping negative assertions is sound.
- **O-v1v2 — closed-green, stated plainly:** both V1 and V2 pass the
  converged 3-literal pin; mechanical discriminators exist only by
  wording-coupling (the rejected 4th literal happens to split them because
  V2's prose line-break splits "newer package\nversion"). **No element-level
  test separates V1 and V2 — it is a prose choice.**
- **O-nonfatal — closed-green.** Real-tool run with forced cache-write failure
  (nonexistent cache dir, api-base 127.0.0.1:9): warning on stderr, full
  report written, exit 0.
- **O-boundary — closed-green.** Scan of all 7 `log(` literals in `usages.py`:
  exactly one contains the trigger; siblings contain none of the three pinned
  literals; no stderr literal is a substring of any pinned literal.
- **O-tusk1 — closed-green.** `bun test test/scaffold.test.ts` → 6 pass /
  0 fail; `git status`/`git diff` empty.
- **O-ordering — closed-green.** `copyUsagesSkill` skips existing copies;
  T-USK1 pins second-run `created == []`; re-init alone never updates the
  tool.

**Gate integrity:** the pin gate demonstrably reds — five separate matrix
arms observed red (S2: 3 fail; S3/S4/S6: 1 fail each).

**Verdict: NO-BLOCK.** Two measured items carried to the consolidator/judge:
(1) the acceptance's own three-literal set cannot catch command-drop or
update-step-drop from the sentence — only wholesale-removal and
trigger-reword classes; (2) V1-vs-V2 is a pure prose choice.
