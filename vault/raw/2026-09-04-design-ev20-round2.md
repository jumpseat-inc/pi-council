# EV-20 — Designer round 2 (Don Norman seat)

Engaging **owner** (per-cell/per-repeat transcript lines + synchronous
pure aggregate) and **principal** (reuse hub inline tree + one shared
pure renderer EV-21 also consumes). Principal raised the important point:
the hub already owns job-level progress, so a second progress widget is
the temptation.

This file supersedes nothing; it refines my round-1 surface position in
`vault/raw/2026-09-03-design-ev20.md` against what the two co-generators
showed me. Rulings R-3/R-4/R-5 (binding card text) and EV-16 §8
(binding design authority) stand. The TypeScript-not-markdown scope
decision from §1 stands and is now endorsed by both seats.

---

## 1. The rendering question, restated

There are **three** possible progress surfaces in front of me. I am going
to argue for two of them and against the third:

| Surface                              | Owner | Principal | Round-1 designer | Round-2 |
|--------------------------------------|-------|-----------|------------------|---------|
| Widget / inline tree progress lines  | —     | **yes**   | pseudo-row above | yes     |
| Per-cell/per-repeat transcript lines | **yes** | (silent) | not addressed    | yes     |
| Matrix pseudo-row above cell rows    | —     | (against) | **yes**          | drop    |
| Pre-dispatch confirmation echo       | implicit | implicit | **yes (forcing fn)** | yes (forcing fn) |

The two-yes-one-drop pattern falls out of one principle: **show the
person only the surfaces that close a named gulf; never show the same
information twice; never add a surface that can lie about the data.**

---

## 2. Settled vs genuinely open

### 2.1 Settled this round

**S1. The matrix pseudo-row above cell rows is dropped.** Principal is
right that the hub already shows per-job inline progress (EV-9 + the
live `widgetLines` ticker at `extensions/index.ts:107`, ticking every
5s). My round-1 "matrix pseudo-row above cell rows" was a **second
progress widget** that duplicates the aggregate "where am I" signal the
widget already gives, and worse, it asks the inline tree to render a
synthetic manifest that isn't a real job — a misuse of the substrate
the runs/tree/transcript modules own (`AGENTS.md #12`). Two problems:

1. **It would lie about the data.** A pseudo-row with a `●●●○○○○○`
   progress bar claims "3 of 9 done" by counting dispatches. The widget
   already says the same thing (active jobs count + their age + last
   activity). Two counters that tick on the same events but compute the
   answer independently is exactly the standing "corrected data" hazard
   from re-grounding — two surfaces, two truths, one will be wrong.
2. **It competes with the inline tree for height budget.** EV-9's
   binding tiny-regime floor is **7 rows** (`vault/raw/...po-ev9-tiny-regime-floor`).
   A matrix pseudo-row spends one of those rows to say something the
   widget already says for free. In the regime where inline progress
   matters most — a long-running matrix on a small terminal — that row
   is the most expensive byte of chrome in the project.

**The honest answer is: the widget already is the matrix pseudo-row.**
The hub ticks every 5s with `widgetLines(active)`; during a matrix the
"active" set is exactly the cell drivers and graders in flight, and
the count of settled manifests (`readManifests`) plus the active count
is the aggregate progress. No new widget.

The one thing the widget does **not** say is "this is a council-eval
matrix, not a normal council loop" — and that is properly addressed by
the per-repeat transcript lines (S2) plus the summary header, not by
a synthetic tree row.

**S2. Per-cell/per-repeat transcript lines stay.** Owner's position
holds. Concretely, the transcript lines I'm now arguing for are:

```
[council-eval] cell council × openrouter/qwen/qwen3.6-35b-a3b:medium repeat 1/3 dispatched job-14.5
[council-eval] cell council × openrouter/qwen/qwen3.6-35b-a3b:medium repeat 1/3 ✓ done  score=0.92
[council-eval] cell council × openrouter/qwen/qwen3.6-35b-a3b:medium repeat 2/3 dispatched job-14.6
[council-eval] cell council × openrouter/qwen/qwen3.6-35b-a3b:medium repeat 2/3 ⚠ length — flagged, not scored
[council-eval] cell council × openrouter/qwen/qwen3.6-35b-a3b:medium repeat 3/3 dispatched job-14.7
[council-eval] cell council × openrouter/qwen/qwen3.6-35b-a3b:medium repeat 3/3 ✓ done  score=0.88
[council-eval] cell 1/3 · openrouter/qwen/qwen3.6-35b-a3b:medium — n=3 mean=0.90 σ=0.02
[council-eval] cell 2/3 · openrouter/anthropic/claude-sonnet-4.5 — n=2 mean=0.85 σ=0.04 (length×1, not graded)
[council-eval] cell 3/3 · openrouter/google/gemini-2.5-pro — n=1 mean=0.78 σ=—
[council-eval] matrix done · 3 cells · 9 runs · scored=6 indeterminate=1 length-flagged=1
```

This is the **additive, durable** record. Three reasons it stays even
though the widget already shows "active":

1. **The widget is volatile.** It is overwritten on every `setWidget`
   call (5s tick) and is gone on `session_shutdown`. The card's
   acceptance criterion ("progress and the final summary render in the
   session transcript") asks for transcript-rendered progress — the
   transcript is the only place that survives the session and that
   `validate.py` can grep for dispatch evidence (the same evidence
   pattern the smoke test uses for `council-runner`, per
   `vault/wiki/smoke-test.md`).
2. **The transcript is the only surface that can tell the person
   *which* repeat was which.** The widget says "active jobs: 3"; the
   transcript says "repeat 2/3 length-flagged" — that's the level of
   detail a person returns from lunch needing.
3. **The transcript lines compose with the summary header.** Both are
   written by the same `extensions/eval-runner.ts` loop; the summary
   reads the records those lines refer to, not the transcript. So the
   transcript is a stream of *events the runner chose to surface*, not
   a second source of truth.

**S3. The one-shared-pure-renderer principle is endorsed.**
Principal's "EV-20's summary and EV-21's leaderboard share the same
pure module" is the right architectural call. It is the only way to
keep the drift window EV-21 is supposed to detect actually
drift-detectable: if EV-20 and EV-21 compute `mean`, `σ`, `triage`, and
histogram with two different implementations, drift can hide in the
gap. I am dropping my round-1 §4.3 prose and replacing it with "the
summary is `aggregateCell(records)` from `extensions/eval-aggregate.ts`,
imported by both EV-20's runner and EV-21's leaderboard; the renderer
calls it with the cellId's records and prints what it returns." This
also kills my §8 "TRIAGE glyph taste" preference — the glyph becomes
output of the pure module, not a designer choice, which removes a class
of disagreement entirely.

**S4. The summary IS a record-derived projection table, and every
column must be record-recoverable.** Owner's `aggregateCell(records)`
is exactly this. Principal's "the records are the truth, the summary
is the projection" matches my round-1 §5 verbatim. Specifically: any
column that cannot be derived from `council/eval-results/<cellId>/`
plus the per-cell `cellScope` terminal block (the F1 amendment both
seats identified) **does not appear in the summary**. This is the
honesty contract; it is what makes EV-21's re-grade-reproducibility
clause satisfiable.

**S5. The pre-dispatch confirmation echo is a forcing function and
fires before any `hub.spawnJob`/`council_dispatch` call.** Owner
confirmed the handler is synchronous and not an LLM loop. That means
"before any cell spawns" is a single hook point: the first line of
the runner's loop body, immediately after `parseEvalArgs` returns.
There is exactly one way for this to be honest about the dispatch
total — compute `totalRuns = models.length × repeat` from the parsed
args, then echo the resolved triple (`taskId | fixtureVersion |
models | repeat | totalRuns`). The total is a function of *what the
parser accepted*, never of what the loop happened to dispatch, so it
cannot drift from the loop's behavior. The echo is the design debt's
payment: a misspelled model id caught here saves an hour; a wrong
repeat count caught here saves three.

### 2.2 Genuinely open (handed to owner/principal)

**O1. What is the no-arg form's third column?** I leaned
`fixtureVersion` in round-1; owner/principal haven't spoken. Both are
defensible. I keep my tie-breaker: **default to `fixtureVersion`**,
allow principal's "kind + target shape" override if it lands.
Falsifier: a fresh-checkout smoke that asserts the column header reads
`fixtureVersion`.

**O2. TRIAGE glyph set.** Round-1 I floated `▮▮▮▮▮`/…; §8 admitted
this was taste. With S3 the glyph is now output of the pure module, so
the seat that writes the module decides. I'll defer to whichever seat
actually owns `eval-aggregate.ts` (likely owner). My preference, last
ranked: keep it consistent with the Council's standing chrome (`A` /
`B` / `T` tied / `—` indeterminate) so a person who learned the
glyphs once does not relearn them.

**O3. The summary's compact terminal histogram form.** `done×2 ·
length×1` vs `done=2 length=1` vs a glyph bar. I lean toward the
existing Council voice (terse, factual), which is the middle form.
Tied with owner's `done × 2 · length × 1`. Defer to owner.

---

## 3. The two gulfs, restated with the new surfaces

- **Gulf of Execution, moment 1 (typing the command):** the person does
  not know what arguments the harness will accept, what models are
  legal, or what the matrix will cost. → Closed by the argument hint
  (palette) + the pre-dispatch confirmation echo (S5) quoting back the
  resolved taskId/fixtureVersion/model-ids/repeat/totalRuns.
- **Gulf of Evaluation, moment 1 (during the matrix):** the person
  cannot tell which cell is running, whether it is healthy, how far
  through the matrix they are. → Closed by **two coordinated surfaces
  that do not duplicate**:
    - the existing widget / inline tree (already there; shows the
      active job count and per-job last activity, no new code);
    - per-cell/per-repeat transcript lines (S2, the durable record
      the card's acceptance asks for).
- **Gulf of Evaluation, moment 2 (the summary):** the person cannot
  tell a real difference from noise, an indeterminate cell from a
  failure. → Closed by the `aggregateCell(records)` projection table
  (S3/S4), with TRIAGE glyphs and the terminal-state histogram next
  to mean/σ; `indeterminate (length majority)` is its own column.
- **Gulf of Execution, moment 2 (after the summary):** the person
  cannot tell what to do next. → The summary's `tied (±CI)` /
  `indeterminate (length majority)` glyphs *are* the action
  suggestion. No follow-up card needed.

---

## 4. Concrete final rendering recommendations

### 4.1 Command palette (already settled, unchanged)

```
/council-eval  [task] [model…] [--repeat N]
  No args: list available fixtures.
  Tasks resolve to fixture dirs under council/fixtures/.
  Models are provider/id[:thinking], e.g. openrouter/qwen/qwen3.6-35b-a3b.
```

Registered via `pi.registerCommand("council-eval", { description,
argumentHint, handler })` in `extensions/index.ts` next to the existing
`council-init` and `council-jobs` registrations. Handler is async
(TypeScript), not a markdown procedure — both co-generators concur.

### 4.2 Pre-dispatch confirmation echo (S5, **fires before any spawn**)

```
council-eval matrix
  task:        council
  fixture:     council/fixtures/council/ v1.0.0  (rubric 1.0.0, grader pinned)
  models:      openrouter/qwen/qwen3.6-35b-a3b:medium   (3 requested)
  repeat:      3   (default; --repeat overrides)
  total runs:  3 models × 3 repeats = 9 dispatches

Run this matrix? [Y/n]
```

Emit via `ctx.ui.notify` in `tui` mode and `console.log` in headless —
same pattern as `council-jobs`. **The line that emits this is the line
immediately before the `for (cell of cells)` loop body opens.** A
falsifier is the easiest of all the predictions: hook the runner's
pre-loop path and assert a notify with all five values is on the bus
before any `hub.spawnJob` call.

### 4.3 Progress during the matrix (S1 drop + S2 keep)

The runner writes transcript lines **as the loop runs**, not as a
widget update. Each line is a one-liner, prefixed `[council-eval]`, and
contains:

- on spawn: `cell <task> × <model> repeat <r>/<N> dispatched job-<id>`
- on cell-driver settle: `… ✓ done` / `… ⚠ stalled` / `… ✕ failed` /
  `… ⏸ timeout` plus `stopReason=<reason>` if non-`done`.
- on grader settle: `… graded <score>` or `… grader failed — not graded`.
- on cell complete: `cell <i>/<total> · <model> — n=<n> mean=<m> σ=<s>`
  (a *running* cell summary, not the matrix summary — recomputed each
  time the cell's last repeat settles, from records alone).

These are additive, durable, and never carry LLM prose (the runner is
not an LLM loop, EV-16 §3.1, so this is a structural guarantee, not a
prompt-level one).

**The widget / inline tree is unchanged.** It already shows the active
cell driver and grader jobs via `widgetLines` (5s tick,
`extensions/index.ts:107`). The matrix adds zero new chrome to either
of those surfaces. If a future card wants a "matrix view" that
aggregates per-cell rows under a parent, that is a separate EPIC-2-style
extension and not in scope here.

### 4.4 Final summary (S3 + S4)

The summary is `aggregateCell(records)` over the records the runner
just wrote, called once per cell, with the matrix header above:

```
council-eval · council · 3 models · 3 repeats · finished in 2h 14m
  cells: 3   runs: 9   scored: 8   indeterminate: 1   length-flagged: 1
  aggregate cost: $X.XX · tokens: Y · gradings: 9 under qwen3.6-35b-a3b:medium

  MODEL                                       MEAN     σ      n     TRIAGE  HISTOGRAM
  openrouter/qwen/qwen3.6-35b-a3b:medium    0.92    0.06    3/3   A       done×3
  openrouter/anthropic/claude-sonnet-4.5     0.88    0.08    2/3   T       done×2 · length×1
  openrouter/google/gemini-2.5-pro           —       —       1/3   —       indeterminate (length×1, stall×1)
```

The renderer is a function of the records only:

- `mean`, `σ`, `n/n_attempted`, `lengthFlagged`, histogram → all from
  the per-cell `cellScope` block (F1 amendment both seats identified).
- `TRIAGE` → from `aggregateCell`'s 95% CI on the mean difference
  between cells; **same module EV-21 imports**, so the leaderboard
  cannot drift from this table.
- `indeterminate (length majority)` and `indeterminate (no graded
  repeats)` → from the same module; their column entries are em-dash,
  not 0.

A column that cannot be derived from the records does not appear.
Specifically: there is no "model confidence" column, no "vibes"
column, no LLM-narrative column. The summary is a projection.

### 4.5 Empty state on a fresh checkout (unchanged from round-1)

```
council-eval · no results yet
  council/eval-results/ does not exist.
  16 fixtures available — run `/council-eval <task> <model…> [--repeat N]`.
```

Truthful (names the directory, doesn't pretend it just happens to be
empty), points at the same list the no-arg form produces. The "16
fixtures" line is computed from `listFixtureTasks(repoRoot).length` —
a function of disk state, not a hardcoded number.

### 4.6 The no-arg list form (S5 from round-1, refined)

```
council-eval · available fixtures
  7 procedures · 9 seats · 16 tasks total

  PROCEDURES (7)            kind   graderModel                    fixtureVersion
  council                   proc   openrouter/qwen/qwen3.6-35b-a3b:medium  1.0.0
  features-deliver          proc   …                                          1.0.0
  …
  SEATS (9)
  skeptic                   seat   …                                  1.0.0
  …

  Run: /council-eval <task> <model…> [--repeat N]
```

Three signifiers in priority order, unchanged: **taskId + kind**,
**graderModel**, **fixtureVersion**. The grader column is the
"corrected data" signifier from re-grounding — the score a person sees
is the merged output of two models, the surface must keep them
separable on first glance.

---

## 5. Falsifiable predictions (revised)

These replace the round-1 list in `vault/raw/2026-09-03-design-ev20.md §7`
where they overlap. Additions are marked **(+)**; supersessions marked **(S)**;
unchanged are unmarked.

1. **Argument hint renders the model-grammar example** in the command
   palette. *(unchanged)*
2. **Confirmation echo names the resolved taskId + fixtureVersion +
   model count + repeat + totalRuns (=models×repeat) before any
   `hub.spawnJob`/`council_dispatch` call.** *(S — refined: the four
   values become five, with `totalRuns = models×repeat` as the
   honesty-clause fifth)*
3. **An unknown task id refuses at parse time** with the no-arg
   pointer. *(unchanged)*
4. **An invalid `:thinking` suffix refuses at parse time** via the
   shared `parseQualifiedModel` from `extensions/seats.ts`.
   *(unchanged)*
5. **(S) No second progress widget is registered for council-eval.**
   The existing `widgetLines` ticker (5s, `extensions/index.ts:107`)
   and the inline tree (`extensions/navigator.ts`) carry the active-job
   signal; the matrix contributes only transcript lines + the summary.
   Falsifier: `grep -R "council-eval" extensions/*.ts` returns no new
   `setWidget` or `registerWidget` calls, and the inline tree's
   `buildTree` sees no synthetic "matrix" manifest row.
6. **Per-cell transcript lines never contain LLM prose** — only the
   harness-written verb set in §4.3. *(unchanged in intent; refined:
   the verb set is structural, not prompted)*
7. **The summary's per-cell `n`/`n_attempted` equals the record count
   under `council/eval-results/<cellId>/`.** *(unchanged)*
8. **Two cells with overlapping 95% CIs render `tied (±CI)` / `T`,
   never sorted by mean.** *(S — refined: the rank class is letter or
   the unicode bar, but the *function* is the same and lives in the
   shared `eval-aggregate` module)*
9. **A cell with majority `stopReason=length` renders as
   `indeterminate (length majority)`, not as a low mean.**
   *(unchanged)*
10. **The TRIAGE derivation is reproducible from records alone and is
    byte-identical between the EV-20 runner's summary call and the
    EV-21 leaderboard's call.** *(S — refined: the byte-identity is
    the new falsifier; it requires `eval-aggregate` to be the shared
    module, which is principal's position and now mine)*
11. **A grader dispatch error yields `n_graded=0` indeterminate, never
    `score=0`.** *(unchanged)*
12. **Empty `council/eval-results/` renders the truthful empty state
    pointing at the no-arg list.** *(unchanged)*
13. **Two runs over the same records render byte-identical summaries.**
    *(unchanged)*
14. **(+)** The summary's per-cell line is `aggregateCell(records)` —
    not assembled from in-memory loop counters. Falsifier: a pure unit
    that monkey-patches the runner to lose one in-memory counter and
    asserts the rendered summary is unchanged (because it came from
    records, not from the lost counter).
15. **(+)** The transcript lines' content is reproducible from
    `runs/` + the records alone: given the on-disk artifacts, a
    transcript replayer reconstructs the same lines (modulo timing).
    Falsifier: smoke that asserts the replayer's `[council-eval]`
    lines match the live transcript line-for-line on the verb and
    score fields (timestamps obviously differ).
16. **(+)** Per-cell transcript lines are emitted **after each cell
    settles, before the next cell dispatches** — never buffered. A
    person watching the transcript sees the matrix advancing in real
    time, not in one burst at the end. Falsifier: smoke that asserts
    a transcript line's timestamp is between the cell-driver settle
    and the next cell-driver spawn.
17. **(+)** The widget / inline tree is the ONLY place the *active
    job count* appears. The transcript does not duplicate it. This
    is the falsifier for "show only surfaces that close a named gulf":
    there is exactly one source of truth for each fact.

---

## 6. Engagement with each position, narrowly

### 6.1 To owner

- **O1 (record extensions) — endorsed.** F1 is binding for this card;
  I am happy to drop my round-1 "TRIAGE glyph preference" because the
  glyph now lives in the pure aggregate module, not in my surface.
- **O2 (store key monotonicity) — endorsed.** The surface change that
  falls out: a re-run of the same matrix now shows repeats 1..3 then
  4..6, and the summary's `n` reflects both runs. The summary header
  should call this out: `n=6 (across 2 runs of cell 1)`. *(This is a
  small refinement — flagging as a new falsifiable addition I have not
  yet listed. Will add in round 3 if the deliberation revisits.)*
- **O3 (sync dispatch) — endorsed and confirmed.** The echo is one
  hook point in the runner, immediately before the loop body. The
  five values are computed from the parsed args, so they cannot lie
  about the dispatch total.
- **O4 (per-cell/per-repeat transcript lines) — endorsed and folded
  into S2.** The transcript lines I propose are the same shape owner
  proposed, with two refinements: (a) the running cell summary line
  on each cell completion (so a person at lunch sees partial results,
  not just "we're on cell 1 of 3"); (b) the prefix `[council-eval]`
  so `validate.py`/the smoke can grep for it.

### 6.2 To principal

- **P1 (reuse hub inline tree) — endorsed and now mine.** I am
  dropping my round-1 matrix pseudo-row. The widget / inline tree
  already does the aggregate progress job. The transcript lines are
  additive, not duplicative — they are the durable record the
  card's acceptance criterion asks for, and they answer "which
  repeat was which," which the widget cannot.
- **P2 (one shared pure renderer) — endorsed and now mine.** The
  renderer is `extensions/eval-aggregate.ts` → `aggregateCell(records)`
  → printed cells. EV-21 imports the same module. Drift between
  EV-20's summary and EV-21's leaderboard becomes impossible at the
  architectural level, not just the principled level.
- **P3 (VerdictRecord amendment, F1, snapshot boundary) — endorsed.**
  These are out of surface scope but the surface I propose assumes
  they land: `cellScope` terminal block, `repeat` on verdict, and a
  named snapshot boundary are the substrate my summary reads. If
  any of them slips, the summary's honesty clause (S4) breaks.
- **P4 (extract dispatch primitive) — endorsed and noted.** I don't
  have standing on the engine shape, but the surface depends on the
  runner being able to spawn each cell with `cwd=scratch` (your
  reading of `hub-tools.ts:167`). Whatever shape that takes — direct
  `hub.spawnJob({cwd})` or external `pi` subprocess — must reach the
  runner. If both implementations exist, the surface cannot tell
  them apart and the SCRATCH_ISOLATION property is unverifiable
  end-to-end. I'd flag this as a hard prerequisite.

### 6.3 What neither seat addressed, that I will

**The smoke test.** `vault/wiki/smoke-test.md` describes a real
container-driven `/council` loop + `/features-deliver` epic whose
gating evidence includes grepping for `council-runner` dispatch lines.
The same grep pattern is the natural evidence shape for `/council-eval`:
a fresh container runs the command against a small fixture × 1 model ×
2 repeats, asserts (a) the records exist, (b) the summary renders,
(c) re-running `aggregateCell` over the records yields byte-identical
output, (d) the transcript carries the expected `[council-eval]`
lines. **Without this smoke the card ships as the first Council
command with no end-to-end falsifier**, which violates the project's
standing discipline. I am not the seat to write the smoke, but I am
the seat to insist it exists, and I want it on the record before
implementation starts.

---

## 7. What I am NOT handing the owner

(unchanged from round-1 §9 — the design decisions this card has
already paid for not having)

- An LLM-narrative progress narrative.
- An ETA / percentile-of-budget bar that races the work.
- A second progress widget that duplicates the inline tree.
- An asserted ordering between close cells.
- A 0 score on a `stopReason=length` cell.
- A column in the summary that cannot be derived from records.
- A "training the user" tooltip, an apologetic empty state, or a
  "you may want to run" follow-up suggestion.

---

## 8. The hand-off

- **Owner** owns the runner, the dispatch primitive, the record
  amendments, and the `eval-aggregate` pure module.
- **Principal** owns the cross-seam coherence (VerdictRecord, F1,
  snapshot boundary) and confirms the dispatch-primitive is shared
  with EV-17's path.
- **Designer (this seat)** owns the surface: the argument hint, the
  confirmation echo, the transcript-line shape, the summary table
  shape (which is the *output* of `aggregateCell`, not a separate
  design), the empty state, the no-arg list, and the
  smoke-test-shape assertion list.
- **Product-owner** is asked to confirm: is a smoke test for the
  first Council command in scope, or is this card the right place to
  seed the discipline?
- **Skeptic** is asked to falsify predictions 1–17 above, or close
  them green.
