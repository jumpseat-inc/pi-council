# EV-1 escalation ruling — product-owner (binding)

This ruling resolves the EV-1 council-runner's two open-judgment escalations
plus the flag on the runner's own action (NAME-1 application as a card-text
edit). Card EV-1 is the epic's first implementation card; design is converged,
Skeptic closed all 10 objections green, and the spec at
`docs/superpowers/specs/2026-08-25-council-theme-design.md` is the design
authority.

## Q1 — Where the spec §3 / §4 docs-only corrections land

### Facts (test-closed by Skeptic objection #10)

- §3's merge-semantics example cites a var-ref `"amber"` that does not exist
  in either omp file. Verified omp source (pinned SHA `eab72e88`): dark uses
  `colors.accent: "accent"`, light uses `colors.accent: "teal"`, `border: "blue"`
  in both. Spec line 127-128 still carries the wrong name.
- §4's "Merge base" line reads "the shipped asset JSON read from disk via
  public `getPackageDir`". Verified (`config.js:310-318`):
  `getPackageDir()` = `findNodePackageDir(__dirname)` walks up from pi's own
  dist to pi's package.json — returns **pi's install dir, not pi-council's
  root**. The correct path is `path.join(PKG_ROOT, "themes", ...)` where
  `PKG_ROOT` is `import.meta.url`-based (AGENTS.md convention 4).

### Ruling

The spec file is the source of truth for §3 / §4; it gets corrected in EV-1's
PR. **AND** the §4 correction is also promoted into EV-2's card text as a
one-line pointer.

Why both: the spec edit (in EV-1's PR) ensures the canonical document is
correct for every future reader. The EV-2 card-text pointer costs almost
nothing and acts as a redundant, immediate reminder at the moment EV-2's
owner is most likely to get it wrong — they are picking up EV-2, not
rereading the whole spec from scratch. Principal's reachability concern is
sound even though the underlying premise ("a note in EV-1's transcript")
wasn't quite right — the spec itself is what EV-2 reads, and the spec edit
is the load-bearing fix; the EV-2 pointer is belt-and-suspenders.

Both positions rejected:

- Owner's "spec fix only" loses because the redundancy is cheap and the
  failure mode (EV-2 owner skims the card, misses §4's correction) is the
  exact silent-wrong-palette bug §4 was meant to prevent.
- Principal's "no spec edit needed" loses because §4 is wrong in the spec
  itself — fixing it only in EV-2's card text leaves every other consumer of
  the spec (future contributors, wiki ingest) reading a wrong §4 forever.

### What the spec edit must say

- §3: replace the var-ref example `colors.accent` being `"amber"` and
  `theme.dark.vars.amber` with the real omp names — `colors.accent` is
  `"accent"` (dark) or `"teal"` (light); `border: "blue"` in both. Verbatim
  from omp pinned SHA.
- §4: replace `via public getPackageDir` with `via path.join(PKG_ROOT, "themes", ...)`
  and add one sentence explaining WHY — `getPackageDir()` walks up from
  pi's own dist, returns pi's install dir, would silently load pi's built-in
  themes (accent `#8abeb7`) instead of the shipped omp palette.

### What the EV-2 card-text pointer must say

One line, added to EV-2's `Intent` section (not the goal — goal is immutable
once In Progress, and EV-2 is in `Ready`, but the pointer belongs as
guidance to the implementing owner):

> EV-2 reads the shipped theme JSON off disk via
> `path.join(PKG_ROOT, "themes", ...)`. Do NOT use `getPackageDir()` — that
> is pi's install dir, not pi-council's root, and would silently load pi's
> built-in theme (accent `#8abeb7`) instead of the shipped omp palette. See
> spec §4 (corrected).

### Reversibility

Trivial — both edits are text. Reverting the spec edit requires another PR;
reverting the EV-2 card-text edit requires a one-line correction. The
substantive cost is zero; the only risk is forgetting to make either edit
during EV-1's PR, which is a normal review-checklist concern, not a
ruling-shaped risk.

## Q2 — Routing the designer's two out-of-band predictions

### Facts

The designer filed two falsifiable predictions as out-of-band from EV-1's
bun suite (the smoke test is the natural venue for end-to-end UI behaviors;
EV-1's T2/T5 cover discovery+registration, not `/settings` UI rendering).

### Ruling

Prediction (i) `/settings` lists `pi-council-dark` / `pi-council-light` under
the `pi-council-` prefix: **routes to the smoke test as an addition**, not to
any card. EV-1's acceptance is about theme discovery and palette match —
adding a `/settings` UI snapshot to EV-1 is scope creep (the surface is
pi's, not the shipped asset's). The smoke test is the place where end-to-end
UI behaviors live; a one-line assertion that drives `/settings` after
session_start and asserts the prefix grouping is a fitting extension.

Prediction (ii) hot-reload asymmetry (shipped-file edit = silent no-op;
`.council.json` override = live repaint): **routes to EV-4**. EV-4's goal
text already covers "repaints when the active theme changes mid-session"
and the asymmetry is precisely that mechanism. Owner's call is correct.

The consolidator's "smoke test warranted at all" sub-question is also
settled by the routing above: prediction (i) goes to smoke as an addition;
prediction (ii) goes to EV-4 as an acceptance criterion. Neither calls for a
new card.

### Reversibility

Trivial. Smoke additions are one-line assertions, easy to add or drop. EV-4
acceptance lines are draft-then-confirm gated by the human; adding the
asymmetry assertion costs nothing now and is removable later.

## Flag — runner's NAME-1 application to EV-1's intent wording

The runner amended EV-1's intent from `makes 'pi-council' selectable in
/settings` to `makes the pi-council-dark / pi-council-light pair selectable
in /settings`, citing NAME-1, committed `0e6a591`, validate.py clean.

**Ruling: the edit stands. No revert.**

The runner's escalation contract directs it to apply Phase 1 rulings and
cite them. NAME-1 is a Phase 1 ruling: "the theme family name is `pi-council`
and nothing else; variants are `pi-council-dark` / `pi-council-light`."
`pi-council` is a prose-only family selector — never a theme name. The
original wording was a misspelling that contradicted NAME-1 outright; the
card's own parenthetical one sentence later ("as the `pi-council-dark` /
`pi-council-light` pair") confirmed the bug. The runner did not exercise
product judgment — it corrected a spelling to match the recorded ruling.

The consolidator's "this is a product-owner action" classification was
incorrect for this specific edit. The text now matches NAME-1, the spec
§2 ("treat bare `pi-council` as a family selector in config prose only —
never a theme name"), and the designer's own convergence on NAME-1 in
round 2. All three independent sources converge; the wording is not a new
decision, it is application.

The runner's behavior here is exactly what its escalation contract
mandates — Phase 1 rulings first, applied and cited. The orchestrator's
guidance to watch for "extending an old ruling to a new question it did
not actually answer" did not apply: NAME-1 directly answered the
`/settings`-lists-what question by declaring what `/settings` lists
(precisely the two variants). The runner did not extend; it applied.

If a future escalation presents the runner with a card-text edit that
goes beyond applying a recorded ruling — for example, picking a new
default, resolving a dispute the card did not surface, or rephrasing
language the ruling is silent on — that is the moment to flag, and that
is when a revert should be directed. This edit is not that moment.

### Reversibility

N/A — the edit is correct under NAME-1 and stands.

## Summary

| Question | Ruling |
|---|---|
| Q1 spec §3 / §4 corrections | Fix spec in EV-1's PR + add one-line §4 pointer to EV-2's intent text |
| Q2 prediction (i) `/settings` prefix | Routes to smoke test as addition |
| Q2 prediction (ii) hot-reload asymmetry | Routes to EV-4 acceptance |
| Flag — runner's NAME-1 application | Edit stands; not application-beyond-ruling |

The owner's implementation of EV-1 now has a clear docs-only diff scope
(spec §3 + §4) and a clear one-line addition to EV-2's card text. The
smoke and EV-4 owners pick up their respective predictions when they
run. EV-1 unblocks at step 7.