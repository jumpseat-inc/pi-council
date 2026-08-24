# Council Transcript Navigator — Design

**Date:** 2026-08-24
**Status:** Approved design, pending implementation plan
**Origin:** Brainstormed from Claude Code's backgrounded-agent UX (agent tree at the
bottom of the TUI, `Enter to view` live transcript of any agent, including nested
subagents) — screenshots 2026-08-24.

## Goal

Make the full conversation of every active council seat — at any nesting depth
(seats dispatching sub-seats) — navigable live from the parent pi TUI: a tree of
running jobs, Enter to open a live-tailing transcript viewer, Esc to back out.
Finished runs remain browsable after the fact.

## Background / gap

Today seats spawn as `pi --mode json -p --no-session`: deliberately ephemeral.
The parent hub keeps only a 50-event ring of tool names, the last assistant
text, and a stderr tail per job. Nested seats are even more opaque — a seat's
own hub consumes its children's streams inside the child process; the parent
never sees them. The only live surface is the one-line widget
(`⏳ skeptic 3m12s last: → bash`).

Pi already ships every ingredient needed:

- `--session-dir <dir>` + `--session-id <id>`: children can write their full
  session JSONL (thinking, toolCall args, toolResult outputs) into a
  council-owned directory under deterministic IDs, without polluting the
  user's session list.
- The extension TUI API (`ctx.ui.custom()` overlays, custom keyboard-driven
  components, `registerKeybinding`) can render a tree + transcript viewer.
- Session files carry their id in the JSONL header (`{"type":"session","id":…}`),
  so transcripts can be matched robustly regardless of file naming.

## Verified premises (spike evidence, 2026-08-24)

Three throwaway probes of `pi -p --session-dir <dir> --session-id <id>`:

1. **Incremental append confirmed.** With a tool-using run, the session file
   appeared ~2.5s after start (header entries), the `toolResult` entry landed
   while the pid was verifiably still alive (t=8.5s), and the final assistant
   entry at exit. Flush latency < 1s. A 1s-poll live tail is viable.
2. **File naming** is `<timestamp>_<sessionId>.jsonl` — hence the viewer
   matches transcripts by header `id`, not filename.
3. First create prints a harmless stderr warning
   (`No project session found with id '…'; creating…`). Ignored.

## Design

### 1. On-disk substrate

```
$CONFIG_DIR_NAME/council/runs/
├── .gitignore          # content: "*"  (hides the whole subtree, incl. itself)
└── <runId>/
    ├── run.json        # { runId, startedAt, repoRoot, hostPid }
    ├── job-1.json      # per-job manifest
    ├── <ts>_job-1.jsonl    # session transcript, written by the child pi itself
    ├── job-1.2.json    # manifest of a sub-seat spawned by job-1
    └── …
```

- **Git hygiene (user constraint):** transcripts live in-repo but the engine
  creates `runs/.gitignore` containing `*` on first use. Gitignore `*` matches
  everything in that directory *including the `.gitignore` itself*, so the
  subtree is invisible to git: no untracked noise, no editing of user files,
  self-healing for every install (no scaffold dependency). Transcripts stay
  repo-local: discoverable, die with the repo, correctly separate per worktree
  (children run with `cwd = repoRoot`).
- **IDs encode the tree.** Job IDs become path-based: `job-<n>` at the top
  level, `<parentJobPath>.<n>` for jobs a seat spawns (`job-1.2` = second
  sub-seat of `job-1`). The ID is the tree position — unique within a run.
  Top-level `job-N` format is unchanged (non-breaking for prompts/tests).
  `runId` = `<timestamp>-<parentPid>`, minted once per parent session.
- **Env propagation.** `council_dispatch` adds `COUNCIL_RUN_ID` and
  `COUNCIL_JOB_ID` (the job's own path) to the child env, next to the existing
  `COUNCIL_SEAT`. A child hub uses those as parent identity for its own
  spawns; absent env → mint a fresh runId (standalone child).
- **Manifest** `<jobId>.json`:
  `{ id, seat, model, parentJobId, pid, sessionId, state, startedAt, settledAt, exitCode }`.
  Written at spawn, rewritten on every state transition (settle / cancel /
  stall / timeout) via atomic tmp+rename.
- **Session file** = the child's own pi session: child argv drops
  `--no-session`, gains `--session-dir <runDir> --session-id <jobId>`.
  Viewer matches the file by header `id`.
- **Retention:** on parent `session_start`, prune to the last 15 runs by
  `startedAt`, skipping any run with a live pid (a concurrent terminal's
  active run is never deleted).
- Stall-kill, timeout, and pid-sweep semantics are untouched (repo
  convention: `hub.ts` behavior changes only with a failing test first).

### 2. Engine changes

- **`seats.ts` — `buildChildArgv`** gains a `session: { sessionDir, sessionId }`
  parameter; drops `--no-session`, appends the two session flags. Pure
  function; existing argv assertions flip to failing tests first.
- **`hub.ts`** becomes run-aware: constructor takes `{ runDir, parentJobPath }`.
  Job id generation is path-encoded. On spawn and on every state transition
  the hub writes the job manifest (atomic). `Job` gains `sessionId` (= its id).
- **`hub-tools.ts` — `council_dispatch`** ensures the run dir exists
  (`.gitignore`, `run.json` — `run.json` created only if missing), then passes
  `runDir` + the new env vars into `spawnJob`. Env construction lives in a
  pure `childEnv()` helper for testability.
- **Identity wiring:** parent mode (`index.ts`) mints the `runId` at
  `session_start` and hands it to `getHub`; child mode (`child.ts`) reads
  `COUNCIL_RUN_ID` / `COUNCIL_JOB_ID` and does the same so a seat's own hub
  nests correctly.
- **Free side effect:** because transcripts are real pi sessions, anyone can
  browse a seat's run from a second terminal with
  `pi --session-dir <runDir> --resume` — a companion-pane story without
  building one.
- **Untouched:** stall/timeout/kill semantics, `--tools` allowlist, MCP
  wiring, `formatReport`, the widget (except the hint in §3), seat schema,
  tool-grant vocabulary.

### 3. Navigator UI

- **Entry:** `/council-tree` command plus a registered keybinding (namespaced
  id `council.tree`; default key chosen at implementation time against
  `keybindings.md` to avoid built-in clashes). The existing widget line gains
  a `· <key> to browse` hint via `keyHint()`.
- **Disk is the source of truth.** The parent hub only knows its own level's
  jobs; nested seats live in other processes. The tree is built by scanning
  manifests in the run dir, not from `hub.list()`. Live state = manifest
  `state` + pid liveness (`running` + dead pid → `orphaned` glyph).
- **Tree overlay:** rows indented by job-path depth — state glyph, seat,
  elapsed, ↓tokens, last event. Keys: ↑/↓ move, Enter opens the transcript,
  Tab cycles run scope (current run ↔ recent runs), Esc closes. No
  collapse/expand — council trees are shallow; YAGNI.
- **Transcript overlay:** an incremental JSONL reader (byte offset + 1s poll)
  feeds a list of visual blocks produced by a **pure** `parseTranscript()`:
  user text; assistant text (Markdown component); thinking (dimmed, collapsed
  to one line by default); toolCall (name + args collapsed); toolResult
  (first line + byte count, collapsed). Keys: ↑/↓ between blocks, `e`
  expand/collapse focused block, `t` toggle thinking globally, `f` follow
  mode (on by default while the job runs; scrolling up detaches), `g`/`G`
  jump top/bottom, Esc back to tree. Expanded blocks cap rendering at ~200
  lines with a truncation marker (file untouched). Width discipline via
  `truncateToWidth` / `wrapTextWithAnsi`.
- **Headless parents:** no UI — the command prints the tree as plain text.
- **Testability split:** pure parsers (`parseTranscript`, tree-from-manifests,
  `childEnv`) unit-tested hard; TUI components stay thin wrappers.

### 4. Testing, edge cases, rollout

Tests (TDD, failing first, `repoRoot` = fresh `mkdtemp` per convention):

1. `seats.test.ts` — argv has `--session-dir`/`--session-id`, no `--no-session`.
2. New `runs.test.ts` — `ensureRunDir` (`.gitignore` = `*`, `run.json` shape,
   idempotent); path-encoded job ids; manifest written at spawn/settle;
   retention prune keeps 15 and skips live pids (fake with `process.pid` and
   a reaped child).
3. New `transcript.test.ts` — `parseTranscript()` over fixture JSONL: block
   kinds, collapsed defaults, tolerates a trailing partial line (live tail
   hits mid-write lines).
4. New `tree.test.ts` — manifests → forest, depth ordering, orphan detection.
5. `hub.test.ts` — nested ids given `parentJobPath`; `childEnv()` contents.
6. Integration (gated, `COUNCIL_INTEGRATION=1`) — real dispatch → session
   file + manifest appear, tree resolves, transcript parses.

Edge cases:

- Dead child → `orphaned` glyph; existing sweep unchanged.
- Manifest without session file (child died at startup) → `no transcript` row.
- Partial JSONL line during tail → parser skips until complete.
- Huge toolResults collapsed by default; expanded view capped (~200 lines).
- Concurrent terminals → retention skips live runs; dir creation idempotent.
- Worktrees → per-worktree runs dir, nothing special.

Rollout:

- Conventional commits (`feat(council): …`); `version` bump in
  `package.json` (non-breaking).
- AGENTS.md layout section gains the runs dir.

## Out of scope (YAGNI)

- Standalone companion viewer TUI (the substrate makes it nearly free later;
  `pi --session-dir … --resume` covers the need for now).
- Inline ctrl+o-style expansion inside tree rows.
- `pi --export` HTML integration.
- Configurable retention / size caps.

## Open items at implementation time

- Default key for `council.tree`, checked against `keybindings.md` built-ins.
