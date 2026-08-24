---
title: Seats
type: concept
summary: The seat abstraction — a named Council role defined in markdown frontmatter (model, tools, spawns, mcp), sandboxed as an isolated headless pi child under the hub.
aliases: [seat, seat schema, council seat]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]", "[[2026-08-24-bugfix-seat-prose]]"]
created: 2026-08-23
updated: 2026-08-24
---

> ⚠️ Derived from `extensions/seats.ts`, `extensions/child.ts`, and the nine `council/agents/*.md` files (captured 2026-08-23). Verify against `seats.ts` for schema details.

A **seat** is pi-council's unit of agency: one named, opinionated LLM role that
participates in a Council run. It is defined entirely by a markdown file in
`council/agents/<name>.md` (or a repo override under `<repo>/$CONFIG_DIR_NAME/agents/`).
Seats resolve from disk at dispatch time; there is no startup agent registry —
`council_dispatch` fails loudly with `Unknown seat` for a name that doesn't
resolve.

## Schema (fixed)

| Field | Meaning |
|---|---|
| `name` | identifier (= filename, e.g. `owner`) |
| `description` | one line the facilitator reads to decide seating |
| `model` | OpenRouter model id; optional `:thinking` suffix (e.g. `:high`) |
| `tools` | omp-style names: `Read, Grep, Glob, Edit, Write, Bash, task, hub` |
| `spawns` | seat names this seat may itself dispatch (recursive grants) |
| `mcp` | server names whose tools the seat may use (`mcp: [context7]`) |

`model` and its `:thinking` suffix are the seat's **default**; a committed
`.council.json` at the repo root can field-override either per-seat (see
[[council-config]]). `loadSeat` applies the override before returning, so both
parent and child see the same resolved model/thinking.

`buildSystemPrompt` (in `seats.ts`) appends two engine-owned blocks to the seat
body: `<council_runtime>` (resolved procedures dir) and `<repository_grounding>`
(see [[repository-grounding]]).

## Tool-grant vocabulary → pi built-ins (`BUILTIN_MAP`)

`Read`→`read`; `Bash`→`bash`; `Edit`→`edit`; `Write`→`write`; `Grep`→`grep`;
`Glob`→`find, ls`. The `hub` grant (from `task`/`hub`) exposes council_wait,
council_dispatch, council_cancel — only if `spawns` is non-empty.

## Child sandboxing

A dispatched seat runs headless (`pi --mode json -p`) and is sandboxed by
`child.ts`:
- `--tools` is an **exact-name allowlist** of granted tools incl. enumerated
  MCP `mcp__<server>__<tool>` names.
- A `tool_call` whose name is not granted (or whose server is not in `mcp:`) is
  blocked with a refusal message.
- MCP tools must be registered **eagerly** at startup (lazy connect deadlocks).

## Seats in the package

Consolidator (read-only synthesis), council-runner (autonomous epic container;
dispatches others, not ruling seats), designer, judge, owner, principal,
product-owner, skeptic (the sole adversary), steward.

## Related

- [[council-loop]], [[engineering-board]], [[mcp-support]], [[repository-grounding]]
- [[council-config]] — per-seat model/thinking override (v0.7.0)
- Each seat has its own page: [[owner]], [[skeptic]], [[judge]], [[principal]],
  [[designer]], [[consolidator]], [[product-owner]], [[steward]], [[council-runner]]

## Sources

- `extensions/seats.ts`, `extensions/child.ts`
- `council/agents/*.md`
- [[2026-08-23-pi-council-design-spec]]
- [[2026-08-24-bugfix-seat-prose]]