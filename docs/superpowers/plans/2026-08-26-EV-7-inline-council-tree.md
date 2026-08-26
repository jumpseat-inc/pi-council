# EV-7 Inline Job Tree (below-editor) with Per-Row Last Activity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace `/council-tree`'s modal presentation with an inline full-width
panel in pi's below-editor region via `ctx.ui.setWidget("council-tree", factory,
{ placement: "belowEditor" })`, showing state glyph / seat / last-activity / age
per row, display-only (keynav = EV-8).

**Architecture:** A new display-only `CouncilTreeWidget` component renders the
tree from disk manifests (current-run scoped), with per-seat last-activity
tail-read from session transcripts (`TranscriptBlock.at` from the JSONL ISO
timestamp). The `/council-tree` + `ctrl+shift+t` handlers become a stateful
toggle that opens the inline widget (guarded `ctx.mode === "tui"`) or falls back
to the console `textTree`. `session_shutdown` tears the widget down.

**Tech Stack:** Bun, TS (strict), pi extension API (`setWidget` factory form,
`WidgetPlacement`), pi-tui `Component`/`truncateToWidth`, existing
`readManifests`/`buildTree`/`flattenTree`/`TranscriptTail`.

**Spec:** `docs/superpowers/specs/2026-08-26-EV-7-design.md`

## Global Constraints

- OV-1: ambient above-editor `council` widget (index.ts `renderWidget`/
  `widgetLines` EV-4 zero-ANSI timer) is NOT modified.
- OV-2: new inline path guards on `ctx.mode === "tui"` (NOT `!ctx.hasUI`).
  Pre-existing `navigator.ts:57` modal `open()` path is out of scope — leave it.
- Vehicle: `- setWidget("council-tree", factory, { placement: "belowEditor" })`
  (factory form; TUI-only).
- Source: `TranscriptBlock.at = Date.parse(e.timestamp)` (fallback
  `message.timestamp`), threaded through `parseTranscript`; `lastActivity` =
  max-`at` block; age = `now - at`; NaN-safe → manifest `startedAt` fallback.
- Tail-read (cached `TranscriptTail`), NOT a full parse per node per 2s tick.
- Non-running rows collapse to manifest state + settledAt copy. No `hub.ts` write.
- Row copy (designer GLANCE): glyph col, seat (14), ` · ` sep, activity
  (verb-first from kind), right-aligned age (6). Age `<60s→Ns, <60m→Nm, >=60m→Nh Mm`.
- Non-running dim copy: `settled <age>`, `failed`, `stalled <age>`, `cancelled`,
  `timeout <secs>`, `orphaned`. Running-first ordering.
- Hint line (bottom, dim): `up/down move · enter view · /council-tree to close`.
- Empty state: `no council jobs this session`. `MAX_WIDGET_LINES = 10`
  (1 hint + 9 rows); overflow → dim `... N more`.
- Token-only rendering (theme.fg/bold), `truncateToWidth` ANSI-safe; render()
  reads theme at render time; 2s interval cleared in dispose(); no 2nd factory
  invocation on theme swap.
- `session_shutdown` must call `setWidget("council-tree", undefined)` (index.ts:121-128).

---

## Task 1: Thread `at` through `parseTranscript` (ISO timestamp) + `lastActivity`

**Files:**
- Modify: `extensions/transcript.ts`
- Test: `test/transcript.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `TranscriptBlock.at: number` (may be `NaN` for `"t"` placeholders);
  `lastActivity(blocks): TranscriptBlock | undefined` (max-`at`, ignoring NaN).

- [ ] **Step 1: failing test** — append to `test/transcript.test.ts`:

```ts
const ISO = { u: '{"type":"message","id":"u","parentId":null,"timestamp":"2026-01-01T00:00:00.000Z","message":{"role":"user","content":[{"type":"text","text":"hi"}]}}',
  a: '{"type":"message","id":"a","parentId":"u","timestamp":"2026-01-01T00:00:01.999Z","message":{"role":"assistant","content":[{"type":"text","text":"ok"}]}}' };

test("parseTranscript preserves ISO at and lastActivity returns max-at block (skip-able NaN)", () => {
  const blocks = parseTranscript([HEADER, USER, ASSISTANT, RESULT].join("\n"));
  // fixture timestamps are "t" placeholders → NaN; interface carries `at` (number)
  blocks.forEach((b) => expect(typeof b.at).toBe("number"));
  const iso = parseTranscript([HEADER, isoLines].join("\n"));
  const la = lastActivity(iso);
  expect(la?.kind).toBe("assistant");
  expect(la?.at).toBe(Date.parse("2026-01-01T00:00:01.999Z"));
});
test("lastActivity ignores NaN-at blocks (t placeholder)", () => {
  const blocks = parseTranscript([HEADER, USER].join("\n")); // both "t" → NaN
  expect(lastActivity(blocks)).toBeUndefined();
});
```

- [ ] **Step 2: run** — `bun test test/transcript.test.ts`. Expected:
  `Property 'at' does not exist` / fail.
- [ ] **Step 3: implement** — add `at: number` to `TranscriptBlock`; in
  `parseTranscript`, compute `const at = Date.parse(typeof e.timestamp === "string" ? e.timestamp : m?.timestamp ?? "")` (NaN-safe) and set `at` on every pushed block. Add:

```ts
export function lastActivity(blocks: TranscriptBlock[]): TranscriptBlock | undefined {
  let best: TranscriptBlock | undefined;
  for (const b of blocks) if (Number.isFinite(b.at) && (!best || b.at > best.at)) best = b;
  return best;
}
```

- [ ] **Step 4: run test** — PASS.
- [ ] **Step 5: commit** — `feat(transcript): thread at timestamp through TranscriptBlock and add lastActivity`

---

## Task 2: New `CouncilTreeWidget` display-only component (manifest rows + tail-read last activity)

**Files:**
- Modify: `extensions/navigator.ts`
- Create: `test/ev7-council-tree-widget.test.ts`

**Interfaces:**
- Consumes: `readManifests`, `buildTree`, `flattenTree` (runs.ts/tree.ts),
  `findSessionFile` (runs.ts), `TranscriptTail`/`lastActivity` (transcript.ts),
  `Component`, `truncateToWidth` (pi-tui), `NavTheme`.
- Produces: `export const TREE_WIDGET_KEY = "council-tree"`;
  `export class CouncilTreeWidget implements Component` with
  `render(width): string[]`, `invalidate(): void`, and a `refresh(now?): void`
  tail-read that updates last-activity; plus `export function formatAge(ms): string`.

- [ ] **Step 1: failing test** — create `test/ev7-council-tree-widget.test.ts` with
  fixture root (mkdir + `ensureRunDir`/`writeManifest`), write a `.jsonl` session
  for a running seat, instantiate with an identity theme `{fg:c=>c,bold:c=>c}`
  (plus keep `bg`), assert: (1) a running row contains seat name and `ran bash`
  + age; (2) a non-running `done` row contains `settled`; (3) empty root → line
  `no council jobs this session`; (4) `refresh` picks up a newly appended tail
  line without full re-parse (added block appears next render).
- [ ] **Step 2: run** — Expected FAIL (class not exported).
- [ ] **Step 3: implement.**

Anchor: keep all existing modal code (`withModalFrame`, `CouncilTree`,
`TranscriptView`, `openTranscript`, and the old modal `open`) intact at the
bottom `registerNavigator`. Add the new component + helpers above, and a
`councilTreeNow()` so tests can inject a fixed clock.

Key implementation sketch:

```ts
export const TREE_WIDGET_KEY = "council-tree";
export const MAX_WIDGET_LINES = 10;
export function formatAge(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(ms / 3600000);
  return `${h}h ${m % 60}m`;
}
```

Component: internal `rows: TreeNode[]`, `tails: Map<string, {tail,lastLabel,lastAt:number|undefined}>`.
`refresh()` reads current-run manifests, flattens tree, and for each running node
tends its cached `TranscriptTail` (via `findSessionFile`); `lastActivity` on new
blocks updates a per-session last block (verb copy + max `at`). `render(width)`
orders running-first, caps at 9 rows + optional `... N more`, adds the dim hint,
token-colors per state. `invalidate()` clears a width cache. `.now` default
`Date.now`.

- [ ] **Step 4: run — PASS**.
- [ ] **Step 5: commit** — `feat(council-tree): add below-editor we engine component with per-row last activity`

---

## Task 3: Wire the TUI-gated belowEditor widget + toggle into /council-tree

**Files:**
- Modify: `extensions/navigator.ts` (registerNavigator handlers)
- Test: extend `test/ev7-council-tree-widget.test.ts`

**Interfaces:**
- Consumes: `TREE_WIDGET_KEY`, `CouncilTreeWidget`.
- Produces: `toggleTree(ctx, repoRoot, getCurrentRunId)` — TUI → setWidget(
  factory, { placement: "belowEditor" }), else console `textTree` fallback;
  second call / or `setWidget(key, undefined)` toggles off. Session
  `setWidget` teardown export for index.ts.

- [ ] **Step 1: failing test** — assert an exported `surfaceForMode("rpc") ===
  "console"` and `surfaceForMode("tui") === "widget"`; assert `toggleTree` with
  a fake `ctx` (`mode:"tui"`, spy `ui.setWidget`) registers the widget and that
  a second invocation calls `setWidget(TREE_WIDGET_KEY, undefined)`; non-tui
  returns `"console"` and never calls setWidget.
- [ ] **Step 2: run** — FAIL (not exported).
- [ ] **Step 3: implement.** Change both `pi.registerCommand("council-tree")`
  and `TREE_SHORTCUT` handler to `await toggleTree(...)`. Keep old modal `open`
  (unused) and its code untouched. Export `surfaceForMode`, and teardown helper
  `clearTreeWidget(ctx)` (`if (ctx.mode==="tui") ctx.ui.setWidget(TREE_WIDGET_KEY, undefined)`).
- [ ] **Step 4: run — PASS**.
- [ ] **Step 5: commit** — `feat(council-tree): inline belowEditor widget toggle guarded on tui mode`

---

## Task 4: session_shutdown teardown + theme-repaint pin test

**Files:**
- Modify: `extensions/index.ts` (session_shutdown handler)
- Test: extend `test/theme-repaint.test.ts` (mirror 116-127)

**Interfaces:**
- Consumes: `clearTreeWidget` from navigator.ts; `CouncilTreeWidget`.

- [ ] **Step 1: failing test** — theme repaint: build a `CouncilTreeWidget`,
  render → contains ACCENT_A; swap theme instance, `widget.invalidate()` then
  render again → contains ACCENT_B, no second factory call (count). Add to
  `theme-repaint.test.ts`.
- [ ] **Step 2: run** — FAIL (widget not instantiated in that file / no repaint).
- [ ] **Step 3: implement** — in `index.ts` `session_shutdown`, capture `ctx`
  and call `clearTreeWidget(ctx)`. Confirm the factory's 2s interval is cleared
  in `dispose()` and `render()` reads `this.theme` at call time.
- [ ] **Step 4: run** — passage.
- [ ] **Step 5: commit** — `fix(council-tree): teardown inline tree widget on session_shutdown + theme repaint pin`

---

## Gates (run in order, worktree root)

1. `bunx tsc --noEmit` → expected no type errors.
2. `bun test` → baseline stays green + new tests. (Mongo not needed; unit/local FS.)
3. `python3 council/validate.py` → `All council artifacts valid`.