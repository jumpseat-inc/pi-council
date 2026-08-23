# pi-council

A multi-agent **Council** for [pi](https://pi.dev) — a facilitator-driven
deliberation → implementation → verification → judgment loop, backed by an
LLM-maintained **wiki** that makes every run's knowledge compound.

Install it once and any repository gets the full workflow:

```bash
pi install git:github.com/tistaharahap/pi-council
```

By default this installs to your **user settings** (`~/.pi/agent/settings.json`,
cloned under `~/.pi/agent/git/...`) — once globally, available in every repo.
To install **project-local** instead (entry in `.pi/settings.json`, clone under
`.pi/git/...`), add `-l`. Commit the `.pi/settings.json` entry if you want the
package pin to travel with the repo (see [Git: what to commit](#git-what-to-commit));
never commit `.pi/git/` — pi manages that clone itself.

```bash
pi install -l git:github.com/tistaharahap/pi-council
```

(If the same package exists in both scopes, the project entry wins. To move an
existing global install into a repo, `pi remove` the global one first.)

Then, inside a repository, scaffold its data layer:

```
/council-init
```

## What you get

**The Council** — a card-based engineering workflow. Work enters a board
(`council/board.md`) as cards with a single testable goal. For each card, a
facilitator routes work between seats and never decides itself:

| Seat | Role |
|---|---|
| `owner` | Engineering voice + the single implementing owner |
| `principal` | Cross-cutting framing when the owner is stuck or converging too fast |
| `designer` | Human-centered design seat (Don Norman tradition) |
| `skeptic` | Formal adversary; assumes every claim is broken until a test proves it |
| `judge` | Fresh-context PASS/REJECT evaluator against the card's goal |
| `consolidator` | Synthesis voice; names disagreement, never resolves it |
| `product-owner` | Card-level judgment when no test can decide |
| `steward` | Portfolio-level authority; product-owner's escalation target |
| `council-runner` | Autonomous per-card execution container for epic delivery |

**The wiki** — a three-layer knowledge base under `vault/`:
`vault/raw/` (immutable sources) → `vault/wiki/` (generated pages) →
`vault/CLAUDE.md` (the schema). Council seats ground themselves through the
wiki; rulings land in `vault/raw/` and get ingested, so decisions compound
across cards instead of evaporating between sessions.

## Commands

| Command | What it does |
|---|---|
| `/council-init` | Scaffold `council/` and `vault/` into the current repo (never overwrites) |
| `/council [card-id]` | Run the full deliberation → owner → verify → judge loop on a card |
| `/board-create-card <desc>` | Draft a new board card, confirm with you, file it |
| `/features-new <feature>` | Decompose a feature into an epic + child cards |
| `/features-deliver <EPIC-KEY>` | Deliver an epic autonomously via `council-runner` |
| `/wiki-ingest <source>` | Ingest a source into the wiki |
| `/wiki-lint` | Health-check the wiki (contradictions, orphans, gaps) |
| `/wiki-query <question>` | Answer from the wiki with citations |
| `/council-jobs` | Show the background seat job table |
| `/mcp list` | Show registered MCP servers with transport, auth mode, status, tool count |
| `/mcp add <name> <url> [auth]` | Register a remote MCP server (`none`/`header`/`oauth`) |
| `/mcp add <name> -- <cmd> [args…]` | Register a local stdio MCP server |
| `/mcp remove <name>` | Unregister a server and clear its stored credentials |
| `/mcp status <name>` | Live-connect a server and report status + tools |
| `/mcp login <name>` | Authenticate (store header secrets, or full OAuth browser flow) |
| `/mcp logout <name>` | Clear stored credentials |

Seats run as isolated headless `pi` processes supervised by a hub
(`council_dispatch` / `council_wait` / `council_cancel` tools), with stall
detection, timeout ceilings, and orphan-process sweeping.

## Requirements

- [pi](https://pi.dev) with at least one configured provider (seats pin
  OpenRouter models by default — edit `council/agents/*.md` frontmatter to
  change them)
- `bun` on PATH (the generic preflight and scaffolded projects assume it)
- Models must exist in pi's catalogue; a seat pinning an unknown model fails
  loudly at dispatch rather than falling back

## How installation works

- **Engine + workflow travel together.** Seats and procedures live inside the
  package; the engine resolves them from its own install directory.
- **Repo-local data stays in the repo.** `/council-init` copies templates into
  `council/` and `vault/` — and *never overwrites*: re-running is a no-op, and
  your edited files always win.
- **Repo-local overrides.** A seat at `<repo>/.pi/agents/<name>.md` shadows the
  packaged seat of the same name; a procedure at
  `<repo>/.pi/council/procedures/<name>.md` shadows the packaged one. Use this
  to tune a seat for one repository without forking the package.
- **Grounding degrades gracefully.** Seats receive a
  `<repository_grounding>` block: with a wiki, they consult
  `vault/wiki/index.md` before taking positions; without one, they're told to
  ground claims in the actual code.

## Git: what to commit

`.pi/` mixes install mechanics with user content — **don't ignore the whole
directory**, or you lose your overrides and MCP registrations. Only the bits pi
manages are throwaway:

| Path | What it is | Track? |
|---|---|---|
| `.pi/settings.json` | project-local install pin | commit |
| `.pi/agents/` | repo-local seat overrides (shadow packaged seats) | commit |
| `.pi/council/procedures/` | repo-local procedure overrides | commit |
| `.pi/council/model-floors.json` | output-floor overrides | commit |
| `.pi/council/mcp.json` | MCP server registrations | commit |
| `.pi/git/` | pi's clone of this package — the extension itself, with its own `node_modules` | **ignore** |
| `.pi/council/.pids.json` | transient hub runtime state | **ignore** |

Ignore exactly the harness and transient state:

```gitignore
# pi harness (package clone pi manages) + transient hub state
.pi/git/
.pi/council/.pids.json
```

Committing `.pi/settings.json` is what makes the council auto-install for
teammates once the project is trusted. Repo-local overrides under `.pi/` are
plain text your repo owns — the packaged seat/procedure of the same name yields
to them. Secrets never land in `.pi/`: MCP credentials live user-global at
`~/.pi/agent/council/mcp-auth.json` (mode 600).

## MCP servers

Seats can use tools from registered MCP servers. Servers are registered
per-repo in `.pi/council/mcp.json` (committable); secrets and OAuth tokens
live user-global at `~/.pi/agent/council/mcp-auth.json` (mode 600). Grant a
seat access in its frontmatter: `mcp: [context7]`. The parent session exposes
connected servers' tools too (`mcp__<server>__<tool>`). OAuth servers refresh
tokens silently; when refresh fails, calls report `reauth-required` and
`/mcp login <server>` runs the browser flow again.

**Context7 and Tavily ship by default.** `/council-init` scaffolds
`.pi/council/mcp.json` registering context7 (OAuth endpoint) and tavily (web
search, OAuth) — each available after one `/mcp login <name>`. Packaged seats
`council-runner`, `designer`, `owner`, `principal`, `skeptic`, and `steward`
grant context7; `council-runner`, `owner`, `principal`, and `skeptic` also grant
tavily. Override or remove entries in `.pi/council/mcp.json` or edit seat
frontmatter to tune. `preflight.sh` fails setup until each registered server
is authenticated (structural: config + stored credentials present).

## Development

```bash
bun install
bun test              # full suite (integration test gated behind COUNCIL_INTEGRATION=1)
bunx tsc --noEmit     # typecheck
```

See `AGENTS.md` for repository conventions, and
`docs/superpowers/specs/` + `docs/superpowers/plans/` for the design
documents this implementation follows.

## License

MIT
