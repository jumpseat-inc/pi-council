# FLLWUP-45 — Navigator attempt-awareness for retried dispatches

**Card:** `council/cards/FLLWUP-45.md` (EPIC-9, sixth card of the run).
**Status:** settled design — steps 1–6 of `/council` closed it; this file
writes it up, it does not derive it.
**Goal:** A retried dispatch's attempt transcripts are reachable from the
navigator, and the backoff row's label matches the attempt it denotes.

This spec is the owner's handoff. Everything below was settled by the
deliberation (steps 2–5), the Skeptic's runs (step 4), the `product-owner`
rulings at steps 6b/6d, and the run-wide Phase-1 rulings. Nothing here is a
facilitator choice. An owner reading only this file must be able to
implement without reopening a design question; where the record left a
deliberate boundary, the boundary is named.

## 1. What is settled (do not reopen)

- **Cardinality A is binding** ([[per-attempt-provenance]]): one job id, one
  manifest, one tree row per dispatch. Attempts are never rendered as new
  tree rows and never a picker modal. Per-attempt browsing lives inside the
  existing inline progress expansion.
- **Row label keeps `m.attempt` verbatim** — the *pending* ordinal, per
  EV-39 R4 ("labeled `attempt 2/3` while retrying — no extra rows and no
  separate status line"). The designer's round-1 idea of reading
  `attempts[last].attempt` during `retrying` is **withdrawn** and must not
  ship: on real backoff substrate it renders `attempt 1/3` in the canonical
  first-retry window, contradicting a binding ruling (Skeptic O2).
- **The label/tail mismatch is repaired in the progress title**, not the
  row (Skeptic O8: no zero-new-string design exists).
- **Content identity is the attempt's session id; row identity is the job
  id.** `tails`/`lastBlocks` stay keyed on `manifest.sessionId` (Skeptic O4:
  a row-key-keyed cache freezes the tail on attempt 1's file).
- **The respawn selection-loss is live today** (Skeptic O5:
  `selectedIndex()` 0 → −1, marker lost) and the re-key is the fix.
- Baseline gates are green on the clean tree (Skeptic O10): `bunx tsc
  --noEmit`, `bun test` (867 pass / 2 skip / 0 fail), `python3
  council/validate.py`.
- **New user-visible copy is ruled, not drafted at implementation time.**
  The two strings in §6 are binding and exact.

## 2. The browsable-attempt set (new pure helper)

Extract one accessor in `extensions/runs.ts`, co-located with
`attemptEntries` (`extensions/runs.ts:119`):

```ts
/** FLLWUP-45 — the attempts the navigator may browse: the settled prefix
 *  (attemptEntries) plus the live session when it has not settled yet. */
export function browsableAttempts(
  m: RunManifest,
): { attempt: number; sessionId: string }[] {
  const entries = attemptEntries(m);
  const live = { attempt: m.attempt ?? 1, sessionId: m.sessionId };
  return entries.some((e) => e.sessionId === live.sessionId) ? entries : [...entries, live];
}
```

This is the **step-6d ruling (ii)** predicate (`browsableAttempts(m).length
> 1`) and the shared resolver seam Q3 named: FLLWUP-4 inherits it for free.

Behaviour, pinned by test (all four shapes must be asserted, legacy included):

| manifest | `browsableAttempts` |
|---|---|
| `{state:"retrying", attempt:2, sessionId:"job-1", attempts:[{1,"job-1"}]}` | `[{1,"job-1"}]` (length 1 — first-retry window) |
| `{state:"running", attempt:2, sessionId:"job-1-attempt2", attempts:[{1,"job-1"}]}` | `[{1,"job-1"},{2,"job-1-attempt2"}]` |
| `{state:"done", attempt:3, sessionId:"job-1-attempt3", attempts:[1,2,3]}` | `[1,2,3]` |
| legacy `{attempt:2, sessionId:"job-1"}` (no `attempts`) | `[{2,"job-1"}]` via the fail-closed fallback |

The live-session append is what makes the running-attempt-2 pre-settle
window advertises the cycler (step-6d ruling (ii)); the raw accessor length
would leave the cycler silently reachable — an `honest-keymap`/R-KEYMAP
defect.

Also export a pure attempt selector next to the widget (used by both the
title and the view resolution; this is the `resolveAttemptFile` seam Q3
named, returning the entry rather than a path so FLLWUP-4 can reuse it):

```ts
export function resolveAttempt(
  entries: { attempt: number; sessionId: string }[],
  cursorSessionId?: string | null,
): { attempt: number; sessionId: string; index: number };
```

- cursor present in `entries` → that entry;
- cursor absent/`null` → the **last** entry (the latest browsable);
- empty `entries` (cannot occur via `browsableAttempts`, but guard anyway) →
  `{ attempt: 1, sessionId: "", index: 0 }`.

`findSessionFile(repoRoot, runId, entry.sessionId)` remains the file
resolution; no new file-resolution logic.

## 3. Row identity re-key (`manifest.sessionId` → `manifest.id`)

The row/selection key becomes the job id — the only identity stable across a
respawn. Change values at these sites (current tree):

- `extensions/navigator.ts:405` — `setRows(ordered.map(({node}) => node.manifest.id))`;
- `extensions/navigator.ts:430` — marker compare `controller.selectedRowKey === node.manifest.id`;
- `extensions/navigator.ts:460`-area `ensureView` — node lookup by `manifest.id`.

**Do not touch `keyFor` (`navigator.ts:334-336`).** It stays
`manifest.sessionId` and continues to drive `tails`/`lastBlocks` and
`tailRead`. A job-id-keyed tail freezes on attempt 1's file (Skeptic O4).

**Rename `selectedSessionId` → `selectedRowKey`** in the same change
(step-6b ruling (e) default): `extensions/focus-nav.ts` (field at `:126`,
plus every read/write in `setRows`/`selectedIndex`/`enter`/`move`/`exit`/
`enterProgress`/`backFromProgress`) and `extensions/navigator.ts` (`:398`
sig, `:405`, `:430`, `:449`, `:460`). `enterProgress`'s parameter is renamed
to match. The field docstring ("Selected row keyed by sessionId, NEVER by
index (O6)") becomes "keyed by row key (the job id), NEVER by index
(O6)".

This is a **two-source-file** change, not the "one file" the step-1 record
guessed; the deliberation corrected that (owner round 2, principal round 2).
No test *assertion* moves — `test/ev8-focus-navigation.test.ts:244-256`
feeds opaque strings and asserts identity-not-index. The **test file
renames are mechanical**: `test/ev8-focus-navigation.test.ts` (14
references) and `test/ev9-progress.test.ts` (12 references) gain the new
field name; the ev8 test *name* "keyed by sessionId" is updated to name the
row key.

## 4. Progress title denotes the shown attempt

`ensureView` (`navigator.ts:455-478`) currently titles the view
`` `${manifest.id} ${manifest.seat}` `` with no ordinal. The shown attempt
is resolved from `browsableAttempts(m)` through the attempt cursor (§5).
Title becomes, **when `m.attempt > 1`** (step-6d ruling (i); the named
first-retry-backoff window fires because `m.attempt = 2 > 1`):

```
${manifest.id} ${manifest.seat} · attempt ${shown.attempt}/${this.maxAttempts}
```

At the default cursor (`shown.sessionId === m.sessionId`) this equals the
step-6b companion fix `k = browsableAttempts(m).find((e) => e.sessionId ===
m.sessionId)?.attempt ?? 1`; with a moved cursor it names whatever attempt
the view actually shows. When `m.attempt <= 1` (or absent) the title is
byte-identical to today.

The row label is unchanged (`navigator.ts:372`). In the retrying window the
row reads `attempt 2/3` (pending ordinal, R4) and the title reads
`attempt 1/3` (the shown content's ordinal) — the deliberate split the
ruling settled.

## 5. The attempt cycler

### State
A **separate** cursor, owned by the widget — **never** a mutation of the
controller's row key. The designer's round-1 mechanism (move
`selectedSessionId` to an attempt's session id) is rejected: that session id
is not in the row list, so `selectedIndex()` → −1 and the marker vanishes —
the identical respawn bug one keystroke later (owner round-2 §2, principal
round-2 reframe).

```ts
private attemptCursor: { rowKey: string; sessionId: string } | null = null;
```

- When the selected row key differs from `attemptCursor.rowKey`, reset to
  the **last** `browsableAttempts` entry (latest browsable).
- On refresh, if `attemptCursor.sessionId` is still in `browsableAttempts`,
  keep it; otherwise clamp to the last entry.
- The render signature (`navigator.ts:398`) includes the resolved content
  session (`${surface}:${selectedRowKey}:${shownSessionId}`) so a cursor
  move repaints.

### Keys
`[` = previous attempt, `]` = next attempt. Add to
`extensions/focus-nav.ts`:

- `ProgressKey` (`:25`) gains `"prevAttempt" | "nextAttempt"`.
- `classifyProgressKey` (`:62`) gains `matchesKey(data, "[")` →
  `"prevAttempt"`, `matchesKey(data, "]")` → `"nextAttempt"` (before the
  `"other"` fall-through). Additive; the existing enumeration at
  `test/ev9-progress.test.ts:48-58` does not move.
- `routeEditorFocus`'s progress case consumes both keys (the key never
  reaches the transcript view or the editor draft).

### Delivery
Add a controller seam mirroring `viewHost`:

```ts
// focus-nav.ts, TreeFocusState
attemptHost: ((dir: -1 | 1) => void) | null = null;
```

`CustomTreeEditor.handleInput`'s progress branch, on a consumed key, calls
`this.controller.attemptHost?.(key === "prevAttempt" ? -1 : 1)`. The widget
installs/clears `attemptHost` wherever it installs/clears `viewHost`
(`ensureView`, `dispose`).

### Cyclic behaviour
The widget's `attemptHost` handler:

- **Clamp, not wrap** — index stays in `[0, browsable.length - 1]`.
- **No-op when `browsable.length <= 1`** (legacy and single-attempt jobs).
- **No-op when the header is not rendered** — i.e. when the effective
  `progressLines <= 1`. On this tree that is `termRowsCap ∈ [7, 11]`; the
  header is suppressed whenever `TranscriptView.render` returns a single
  line. This is the step-6b (e) "one-row floor consumed no-op", stated at
  the effective grant rather than the literal `termRowsCap === 7`, so it
  also covers 8–11 (Skeptic O7's R-KEYMAP premise: an unadvertised key must
  not act).
- On a real move: update `attemptCursor`, `invalidate()`, `onRender?.()`.

The cycler **must not** change `controller.selectedRowKey`; `setRows` keeps
receiving job ids and `selectedIndex()` stays `>= 0` (test 6).

## 6. Copy (ruled — binding, exact)

Two new user-visible strings. Both are ruled by `product-owner` (step 6b),
with step 6d fixing the gates.

1. **Progress-title attempt fragment** — `· attempt ${k}/${maxAttempts}`,
   appended to `${id} ${seat}`. Gate: `m.attempt > 1`. Example:
   `job-4.2 skeptic · attempt 1/3`.
   Divider is `/` (row-parity; `of` rejected). R3/R5's parent-turn strings
   are untouched.
2. **Cycler header advertisement** — `· [/] attempt`, inserted into the
   existing R-KEYMAP header line immediately after `↑↓ move`. Gate:
   `browsableAttempts(m).length > 1` **and** the header is actually rendered
   (`progressLines > 1`). Exact rendered forms:

   - with retry: `… — ↑↓ move · [/] attempt · e expand · t thinking · f follow · g/G jump · esc back`
   - unchanged otherwise: `… — ↑↓ move · e expand · t thinking · f follow · g/G jump · esc back`

   (`f follow` gains its existing `(on)` suffix when follow is on; that is
   untouched.)

These are the only new strings. The row label, the countdown
(`retrying in Ns`), `The provider returned an error.`, `Retrying in 2s
(attempt 2 of 3) — Esc to abort`, and the exhaustion string are byte-identical.

## 7. Out of scope (named boundaries — do not fold in)

- **`openTranscript` at `navigator.ts:869`** (resolves `manifest.id`, not
  the attempt session) is **deferred to FLLWUP-4** per Q3. It is test-pinned
  dead code (Skeptic O6: `test/navigator.test.ts:66-73` asserts the
  `CouncilTree` activator plumbing, not the resolution). Do **not** patch
  `:869`; do not add a test for it here. The `:869` finding is recorded via
  the step-13 follow-up draft (re-homed to `product-owner`).
- **The legacy modal title suffix** rides FLLWUP-4, not this card.
- **FLLWUP-39** (dispose the replaced `TranscriptView` when the progress
  surface switches sessions, EPIC-8 `Backlog`) is **not fixed here**. The
  cycler reaches `ensureView`'s existing session-switch path, which replaces
  `viewFor` without disposing the outgoing view; that lifecycle defect is
  FLLWUP-39's. The owner must not silently fold FLLWUP-39 in — but must not
  introduce a *second* view slot either: the cycler reuses the existing
  single `viewFor` slot.
- **The R4-evolution candidate** (whether the row label should eventually
  denote the tailed attempt) is recorded for `steward`, not acted on. The
  card ships on R4's letter.
- No new tree rows, no picker modal, no per-attempt usage/age column, no
  change to the tree-surface key set (EV-8's "consume only
  Up/Down/Enter/Escape" holds).

## 8. Tests the owner must satisfy

New file `test/fllwup45-attempt-awareness.test.ts` (plus the mechanical
`selectedRowKey` rename in the two existing suites). Every new assertion is
red on the pre-change tree except where noted.

**Unconditional**

1. **`browsableAttempts` shapes** — the four rows in §2, including the
   legacy carve-out pinned explicitly (Skeptic O1).
2. **`resolveAttempt`** — present cursor → that entry; absent/`null` →
   last; `index` consistent.
3. **Selection survives a respawn** — build widget+controller, select a row
   (`setRows(["job-1"])`, `enter()`); rewrite the manifest to
   `running`/`attempt 2`/`sessionId: "job-1-attempt2"` and re-render; assert
   `selectedIndex() === 0` and the `▌` marker is on that row. Red today
   (Skeptic O5).
4. **Title names the shown ordinal during backoff** — fixture
   `{state:"retrying", attempt:2, sessionId:"job-1",
   attempts:[{attempt:1,sessionId:"job-1"}], nextAttemptAt: now+7000}` +
   `job-1.jsonl`; assert the row contains `attempt 2/3` **and** the progress
   title contains `attempt 1/3`, and that the title ordinal is the entry
   whose file `ensureView` opened. Red today (no title ordinal).
5. **Tail-cache guard** — after a respawn whose attempt-2 JSONL carries the
   later `at`, the row's last-activity derives from attempt 2's file. Green
   today; ships as the re-key's guard-rail (a `keyFor → manifest.id` fix
   goes red).
6. **Cycler does not own the row key** — with a running-attempt-2 manifest,
   a `[` press re-targets the shown content/title to attempt 1, while
   `setRows` values remain job ids and `selectedIndex() !== -1`.
7. **Cycler no-ops** — single-attempt manifest: header contains no
   `[/] attempt` and `[` changes nothing. One-row grant (`termRowsCap: 7`,
   `surface === "progress"`): `[` does not mutate the cursor and does not
   reach the editor draft.
8. **`classifyProgressKey` additive** — `[` → `"prevAttempt"`, `]` →
   `"nextAttempt"`; the §5 header gate: advertisement present only when
   `browsableAttempts(m).length > 1`.

**Untouched and must stay green**

`test/ev7-council-tree-widget.test.ts:180-199` (row `attempt 2/3`),
`test/tree.test.ts:65-73`, `test/ev40-parent-retry.test.ts` R5 strings,
`test/ev8-focus-navigation.test.ts:244-256` (identity-not-index; only the
field name moves), `test/ev9-progress.test.ts:353-371` (onActivate is not
the Enter path).

## 9. Gates

Per the card's step-1 gate note (this repo defines no database/import/server
gate; `docs/gates/GATE-EVIDENCE.md` does not exist here), the owner re-runs
in full, in order, no threshold lowered:

- `bunx tsc --noEmit`
- `bun test`
- `python3 council/validate.py`

`council/preflight.sh FLLWUP-45`'s branch-freshness clause (FLLWUP-27) is a
known-by-construction artifact once a facilitator record commit advances
`origin/main` past the branch cut; the step-11 re-run set is `tsc` / `bun
test` / `validate.py`. `COUNCIL_INTEGRATION=1` stays gated and is not run.

## 10. Provenance

Deliberation record: `council/cards/FLLWUP-45.md` steps 2–6d — owner
`job-12.1/12.4`, principal `job-12.2/12.5`, designer `job-12.3/12.6`,
skeptic `job-12.7` (O1–O10), consolidator `job-12.8`; `product-owner`
rulings at steps 6b and 6d. Wiki grounding: [[per-attempt-provenance]],
[[council-job-tree-inline]], [[honest-keymap]], [[one-row-floor]],
[[gate-parity]]. Binding instruments: EV-39 R4 (`council/cards/EV-39.md`),
FLLWUP-4 acceptance, FLLWUP-39 scope.
