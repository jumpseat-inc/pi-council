# pi-council Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the ev-guide Council engine + seats + procedures + wiki workflow as an installable pi package (`pi install git:github.com/tistaharahap/pi-council`) with repo-local data created by `/council-init`.

**Architecture:** Engine TS lives in `extensions/` (auto-discovered via the package's `pi` manifest); opinionated payload (9 seats, 7 procedures) lives in `council/`; repo-local scaffolding templates live in `council/scaffold/`. All payload lookups are override-aware (repo-local `$CONFIG_DIR_NAME` path first, packaged default second) and resolve the package root from `import.meta.url`.

**Tech Stack:** TypeScript run by pi's loader, Bun (`bun:test`) for tests, `typebox` for tool parameters, peer-depends on `@earendil-works/pi-coding-agent`.

**Spec:** `docs/superpowers/specs/2026-08-23-pi-council-design.md`

## Global Constraints

- Source repo (read-only vendor source): `/Users/tista/codes/ev-guide/.pi/extensions/council/` (engine + procedures) and `/Users/tista/codes/ev-guide/.pi/agents/` (seats). Referenced below as `$SRC`.
- Never modify anything under `$SRC`. This repo is the only write target.
- Seats ship verbatim EXCEPT: delete `autoloadSkills:` frontmatter lines, and replace the five skill-loading mechanism sentences listed in Task 2 (deviation from spec's "seat bodies unchanged" line, required because the skill mechanism no longer exists; flagged for reviewer attention).
- Use `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent`, never a literal `.pi`, for repo-local paths.
- Package root resolves from `import.meta.url` via `fileURLToPath` — never hardcoded clone paths.
- `hub.ts`, `stub-child.ts` ship verbatim. `child.ts` ships verbatim.
- Tests run with `bun test` from the repo root; imports use relative paths (`../extensions/foo.ts`).
- Every task ends with a green `bun test` (where applicable) and a commit.
- Tool grant vocabulary (`Read/Grep/Glob/Edit/Write/Bash/task/hub`) and `BUILTIN_MAP` stay exactly as in the source.

## Target Layout

```
pi-council/
├── package.json
├── tsconfig.json
├── .gitignore
├── extensions/
│   ├── index.ts        # entry: parent/child mode, commands, widget, max-tokens patch
│   ├── hub.ts          # job supervisor (verbatim)
│   ├── hub-tools.ts    # dispatch/wait/cancel tools
│   ├── seats.ts        # seat schema + resolution + prompt builder
│   ├── child.ts        # seat sandboxing (verbatim)
│   └── scaffold.ts     # non-clobbering scaffold copy routine
├── council/
│   ├── agents/*.md     # 9 seats
│   ├── procedures/*.md # 7 procedures
│   └── scaffold/
│       ├── council/{board.md,preflight.sh,validate.py,cards/_template.md}
│       └── vault/{CLAUDE.md,wiki/index.md,wiki/log.md}
└── test/
    ├── hub.test.ts      # verbatim
    ├── stub-child.ts    # verbatim
    ├── seats.test.ts
    ├── child.test.ts
    ├── paths.test.ts
    ├── scaffold.test.ts
    └── integration.test.ts
```

---

### Task 1: Package skeleton + verbatim hub core + hub tests

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`
- Create (copy): `extensions/hub.ts`, `test/stub-child.ts`, `test/hub.test.ts`

**Interfaces:**
- Produces: `Hub` class exported from `extensions/hub.ts` with `spawnJob`, `wait`, `cancel`, `list`, `shutdown`, static `sweepStalePids(pidFile)` — signatures identical to source. Later tasks rely on these unchanged.

- [ ] **Step 1: Create package.json**

```json
{
	"name": "pi-council",
	"version": "0.1.0",
	"description": "Multi-agent Council deliberation/delivery system with an integrated LLM wiki, for pi",
	"keywords": ["pi-package"],
	"license": "MIT",
	"type": "module",
	"pi": { "extensions": ["./extensions"] },
	"peerDependencies": {
		"@earendil-works/pi-coding-agent": "*",
		"typebox": "*"
	},
	"devDependencies": {
		"@earendil-works/pi-coding-agent": "*",
		"@types/bun": "^1",
		"@types/node": "^22",
		"typebox": "*",
		"typescript": "^5"
	},
	"scripts": {
		"test": "bun test",
		"typecheck": "tsc --noEmit"
	}
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
	"compilerOptions": {
		"module": "esnext",
		"moduleResolution": "bundler",
		"target": "es2022",
		"strict": true,
		"skipLibCheck": true,
		"allowImportingTsExtensions": true,
		"noEmit": true,
		"types": ["node", "bun"]
	},
	"include": ["extensions/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
```

- [ ] **Step 4: Copy verbatim engine core and hub test assets**

```bash
cp "$SRC/hub.ts" extensions/hub.ts
cp "$SRC/test/stub-child.ts" test/stub-child.ts
cp "$SRC/test/hub.test.ts" test/hub.test.ts
```

(`hub.test.ts` writes its pid file under `os.tmpdir()` keyed by pid — no repo paths involved, so verbatim is correct.)

- [ ] **Step 5: Install deps and run tests**

Run: `cd /Users/tista/codes/pi-council && bun install && bun test test/hub.test.ts`
Expected: all 11 hub tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: package skeleton with verbatim hub core and tests"
```

---

### Task 2: Vendor the 9 seats + strip the skill mechanism

**Files:**
- Create: `council/agents/*.md` (9 files)

**Interfaces:**
- Produces: packaged seat files resolvable later via `loadSeat` (Task 4). Frontmatter fields: name/description/model/thinking-suffix/tools/spawns. NO `autoloadSkills` anywhere.

- [ ] **Step 1: Copy seats and delete autoloadSkills lines**

```bash
mkdir -p council/agents
cp "$SRC"/../../../../.pi/agents/*.md council/agents/   # if $SRC is the council dir, seats live at /Users/tista/codes/ev-guide/.pi/agents/
sed -i '' '/^autoloadSkills:/d' council/agents/*.md
grep -rn "autoloadSkills" council/ && echo "FAIL: leftover" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 2: Replace skill-loading sentences (exact old→new edits)**

These are the only permitted body edits. Apply with the edit tool.

`council/agents/owner.md` — grounding paragraph head:
oldText:
```
Ground every position in what the code actually does, never in what it
probably does. Load the `ev-guide` skill first for the module map, the gate
commands, and the standing hazards — the importer's normalization rules
```
newText:
```
Ground every position in what the code actually does, never in what it
probably does. Read the repository wiki (`vault/wiki/index.md`, see your
`<repository_grounding>` block) first for the module map, the gate
commands, and the standing hazards — the importer's normalization rules
```

`council/agents/owner.md` — gate-commands paragraph:
oldText:
```
Load the `ev-guide` skill for the exact command and rationale for each gate —
do not retype them from memory or improvise a shorter version.
`docs/gates/GATE-EVIDENCE.md` is the authoritative record behind every one
of those commands; the skill's copy is sourced from it verbatim. If the
skill and that file ever disagree, the file wins and the skill is stale.
```
newText:
```
Take the exact command and rationale for each gate from this repository's
own records — do not retype them from memory or improvise a shorter version.
Where the repo keeps an authoritative gate document (e.g.
`docs/gates/GATE-EVIDENCE.md`), it outranks the wiki: if a wiki page and
that file ever disagree, the file wins and the wiki is stale.
```

`council/agents/designer.md`:
oldText:
```
1. **Load `ev-guide` first** for the module map and standing hazards, then
   read the actual frontend under `src/web/` — the components, the pure
   seams (`tripDefaults`, `tripItinerary`, `tripFormat`, `tripHandlers`,
   `geocodeSearch`, `collapseState`), and the copy strings. A critique of
   a screen you have not opened is a critique of your memory of screens.
```
newText:
```
1. **Read the repository wiki first** (`vault/wiki/index.md`) for the module
   map and standing hazards, then read the actual frontend source — the
   components, the pure seams, and the copy strings. A critique of
   a screen you have not opened is a critique of your memory of screens.
```

`council/agents/principal.md`:
oldText:
```
Load the `ev-guide` skill before reasoning about any card — you need the
module map, not a corner of it. Then read toward the seam specifically: the
```
newText:
```
Read the repository wiki (`vault/wiki/index.md`) before reasoning about any
card — you need the module map, not a corner of it. Then read toward the
seam specifically: the
```

`council/agents/council-runner.md`:
oldText:
```
Before doing anything else, read `.pi/extensions/council/procedures/council.md` and
`.pi/extensions/council/procedures/features-deliver.md` in full. `deliver.md` defines the
```
newText:
```
Before doing anything else, read `council.md` and `features-deliver.md` from
the procedures directory named in your `<council_runtime>` system-prompt
block, in full. `deliver.md` defines the
```

- [ ] **Step 3: Verify no mechanism references remain**

Run: `grep -rn "autoloadSkills\|\.pi/extensions\|\.pi/agents\|\.pi/skills\|Load \`ev-guide\`\|Load the \`ev-guide\`" council/`
Expected: no matches. (Domain prose mentioning PETA SPKLU intentionally stays.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: vendor 9 council seats, strip repo-local skill mechanism"
```

---

### Task 3: Vendor the 7 procedures + path-reference edit

**Files:**
- Create: `council/procedures/*.md` (7 files)

**Interfaces:**
- Produces: procedure files whose filename (sans `.md`) becomes a slash command (Task 8); frontmatter `description` drives the command description; bodies support `$ARGUMENTS` and `$COUNCIL_PROCEDURES` substitution.

- [ ] **Step 1: Copy procedures**

```bash
mkdir -p council/procedures
cp "$SRC"/procedures/*.md council/procedures/
ls council/procedures/
```
Expected: board-create-card.md, council.md, features-deliver.md, features-new.md, wiki-ingest.md, wiki-lint.md, wiki-query.md.

- [ ] **Step 2: Fix the one hardcoded path reference**

`council/procedures/features-deliver.md`:
oldText:
```
`council-runner` (see `.pi/agents/council-runner.md`) executes each card's
```
newText:
```
`council-runner` (a packaged Council seat) executes each card's
```

- [ ] **Step 3: Verify**

Run: `grep -rn "\.pi/" council/procedures/ || echo clean`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: vendor 7 council procedures"
```

---

### Task 4: seats.ts generalization + seats tests

**Files:**
- Create: `extensions/seats.ts`
- Test: `test/seats.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks except vendored seats (Task 2).
- Produces:
  - `interface Seat { name: string; description: string; model: string; thinkingLevel?: string; tools: string[]; spawns: string[]; body: string }` — note: NO `autoloadSkills`.
  - `PKG_ROOT: string` (absolute package root)
  - `parseSeatFile(content, fileName): Seat`
  - `listSeatNames(repoRoot): string[]` (sorted, union of override + packaged)
  - `loadSeat(repoRoot, name): Seat` (override wins; throws `Unknown seat "<name>". Available: …`)
  - `proceduresDir(repoRoot): string` (override if exists else packaged)
  - `builtinToolsFor(seat): string[]`, `grantsFor(seat): { hub: boolean }`
  - `buildSystemPrompt(repoRoot, seat, procDir): string` — three args now
  - `buildChildArgv(seat, input, promptFile): string[]` (unchanged shape)

- [ ] **Step 1: Write the failing test**

Create `test/seats.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	parseSeatFile,
	loadSeat,
	listSeatNames,
	builtinToolsFor,
	grantsFor,
	buildSystemPrompt,
	buildChildArgv,
	proceduresDir,
	PKG_ROOT,
} from "../extensions/seats.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-seats-"));
}

test("lists all 9 packaged seats", () => {
	const names = listSeatNames(tmpRepo());
	expect(names).toEqual([
		"consolidator",
		"council-runner",
		"designer",
		"judge",
		"owner",
		"principal",
		"product-owner",
		"skeptic",
		"steward",
	]);
});

test("repo-local seat shadows packaged seat of the same name", () => {
	const root = tmpRepo();
	const dir = path.join(root, ".pi", "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "owner.md"),
		"---\nname: owner\ndescription: override\nmodel: test/model\n---\nOVERRIDE BODY",
	);
	const owner = loadSeat(root, "owner");
	expect(owner.body).toBe("OVERRIDE BODY");
	expect(owner.model).toBe("test/model");
	// non-shadowed seats still come from the package
	expect(loadSeat(root, "judge").name).toBe("judge");
});

test("designer: read/search/write, no bash, no hub", () => {
	const d = loadSeat(tmpRepo(), "designer");
	expect(d.model).toBe("openrouter/deepseek/deepseek-v4-pro-0813");
	expect(d.thinkingLevel).toBe("high");
	expect(builtinToolsFor(d)).toEqual(["read", "write", "grep", "find", "ls"]);
	expect(grantsFor(d)).toEqual({ hub: false });
});

test("parses owner seat: model split, tools, no autoloadSkills", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	expect(owner.model).toBe("openrouter/deepseek/deepseek-v4-flash-0731");
	expect(owner.thinkingLevel).toBe("high");
	expect(owner.tools).toEqual(["Read", "Grep", "Glob", "Edit", "Write", "Bash"]);
	expect((owner as Record<string, unknown>).autoloadSkills).toBeUndefined();
	expect(owner.body).toContain("<role>");
	expect(owner.body).not.toContain("ev-guide` skill");
});

test("parses council-runner spawns list", () => {
	const runner = loadSeat(tmpRepo(), "council-runner");
	expect(runner.spawns).toEqual(["owner", "principal", "designer", "skeptic", "consolidator", "judge"]);
	expect(grantsFor(runner).hub).toBe(true);
});

test("consolidator is read-only", () => {
	const c = loadSeat(tmpRepo(), "consolidator");
	expect(builtinToolsFor(c)).toEqual(["read"]);
	expect(grantsFor(c)).toEqual({ hub: false });
});

test("model without thinking suffix parses cleanly", () => {
	const seat = parseSeatFile(
		`---\nname: x\ndescription: d\nmodel: openrouter/foo/bar\ntools: Read\n---\nbody`,
		"x.md",
	);
	expect(seat.model).toBe("openrouter/foo/bar");
	expect(seat.thinkingLevel).toBeUndefined();
});

test("missing name throws", () => {
	expect(() => parseSeatFile(`---\ndescription: d\n---\nbody`, "bad.md")).toThrow(/name/);
});

test("loadSeat unknown seat throws with available names", () => {
	expect(() => loadSeat(tmpRepo(), "nonexistent")).toThrow(/nonexistent.*steward/s);
});

test("buildSystemPrompt without vault: runtime block + degraded grounding", () => {
	const root = tmpRepo();
	const seat = loadSeat(root, "judge");
	const p = buildSystemPrompt(root, seat, proceduresDir(root));
	expect(p).toContain(seat.body.slice(0, 100));
	expect(p).toContain("<council_runtime>");
	expect(p).toContain(path.join(PKG_ROOT, "council", "procedures"));
	expect(p).toContain("No repository wiki found; ground claims in the actual code before asserting them.");
});

test("buildSystemPrompt with vault: wiki grounding", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, "vault", "wiki"), { recursive: true });
	fs.writeFileSync(path.join(root, "vault", "wiki", "index.md"), "# Wiki Index\n");
	const seat = loadSeat(root, "judge");
	const p = buildSystemPrompt(root, seat, proceduresDir(root));
	expect(p).toContain("This repository maintains an LLM wiki under `vault/`.");
	expect(p).toContain("vault/wiki/index.md");
	expect(p).not.toContain("No repository wiki found");
});

test("proceduresDir: packaged default, then repo override", () => {
	const root = tmpRepo();
	expect(proceduresDir(root)).toBe(path.join(PKG_ROOT, "council", "procedures"));
	const ov = path.join(root, ".pi", "council", "procedures");
	fs.mkdirSync(ov, { recursive: true });
	expect(proceduresDir(root)).toBe(ov);
});

test("buildChildArgv produces json print-mode invocation", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(owner, "do the thing", "/tmp/p.md");
	expect(argv).toEqual([
		"--mode",
		"json",
		"-p",
		"-a",
		"--no-session",
		"--model",
		"openrouter/deepseek/deepseek-v4-flash-0731",
		"--thinking",
		"high",
		"--tools",
		"read,bash,edit,write,grep,find,ls",
		"--append-system-prompt",
		"/tmp/p.md",
		"do the thing",
	]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/seats.test.ts`
Expected: FAIL — cannot resolve `../extensions/seats.ts`.

- [ ] **Step 3: Implement extensions/seats.ts**

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export interface Seat {
	name: string;
	description: string;
	model: string;
	thinkingLevel?: string;
	tools: string[];
	spawns: string[];
	body: string;
}

const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh", "max"]);

/** Absolute package root — one level above extensions/. */
export const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseList(raw: string): string[] {
	const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
	return inner
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

export function parseSeatFile(content: string, fileName: string): Seat {
	const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!m) throw new Error(`${fileName}: missing frontmatter`);
	const [, front, body] = m;
	const fields: Record<string, string> = {};
	for (const line of front.split("\n")) {
		const kv = line.match(/^([\w-]+):\s*(.*)$/);
		if (kv) fields[kv[1]] = kv[2];
	}
	for (const req of ["name", "description", "model"]) {
		if (!fields[req]) throw new Error(`${fileName}: frontmatter missing "${req}"`);
	}
	let model = fields.model.trim();
	let thinkingLevel: string | undefined;
	const colon = model.lastIndexOf(":");
	if (colon > 0) {
		const suffix = model.slice(colon + 1);
		if (THINKING_LEVELS.has(suffix)) {
			thinkingLevel = suffix;
			model = model.slice(0, colon);
		}
	}
	return {
		name: fields.name.trim(),
		description: fields.description.trim(),
		model,
		thinkingLevel,
		tools: fields.tools ? parseList(fields.tools) : [],
		spawns: fields.spawns ? parseList(fields.spawns) : [],
		body: body.trim(),
	};
}

/** Repo-local override first, packaged default second. */
function seatDirs(repoRoot: string): string[] {
	return [path.join(repoRoot, CONFIG_DIR_NAME, "agents"), path.join(PKG_ROOT, "council", "agents")];
}

export function listSeatNames(repoRoot: string): string[] {
	const names = new Set<string>();
	for (const dir of seatDirs(repoRoot)) {
		if (!fs.existsSync(dir)) continue;
		for (const f of fs.readdirSync(dir)) {
			if (f.endsWith(".md")) names.add(f.replace(/\.md$/, ""));
		}
	}
	return [...names].sort();
}

export function loadSeat(repoRoot: string, name: string): Seat {
	for (const dir of seatDirs(repoRoot)) {
		const file = path.join(dir, `${name}.md`);
		if (fs.existsSync(file)) return parseSeatFile(fs.readFileSync(file, "utf-8"), file);
	}
	throw new Error(`Unknown seat "${name}". Available: ${listSeatNames(repoRoot).join(", ")}`);
}

/** Procedures directory: repo override if present, else packaged default. */
export function proceduresDir(repoRoot: string): string {
	const override = path.join(repoRoot, CONFIG_DIR_NAME, "council", "procedures");
	return fs.existsSync(override) ? override : path.join(PKG_ROOT, "council", "procedures");
}

/** omp tool names → pi built-in tool ids, in stable order. */
const BUILTIN_MAP: Array<[string, string[]]> = [
	["Read", ["read"]],
	["Bash", ["bash"]],
	["Edit", ["edit"]],
	["Write", ["write"]],
	["Grep", ["grep"]],
	["Glob", ["find", "ls"]],
];

export function builtinToolsFor(seat: Seat): string[] {
	const granted = new Set(seat.tools);
	const out: string[] = [];
	for (const [omp, ids] of BUILTIN_MAP) if (granted.has(omp)) out.push(...ids);
	return out;
}

export function grantsFor(seat: Seat): { hub: boolean } {
	const t = new Set(seat.tools);
	return { hub: (t.has("task") || t.has("hub")) && seat.spawns.length > 0 };
}

function groundingBlock(repoRoot: string): string {
	const hasWiki = fs.existsSync(path.join(repoRoot, "vault", "wiki", "index.md"));
	const body = hasWiki
		? "This repository maintains an LLM wiki under `vault/`. Before taking positions on how this codebase works, read `vault/wiki/index.md` and drill into the relevant pages. Cite the pages you used. If the wiki does not cover something you would otherwise assume, say so."
		: "No repository wiki found; ground claims in the actual code before asserting them.";
	return `<repository_grounding>\n${body}\n</repository_grounding>`;
}

export function buildSystemPrompt(repoRoot: string, seat: Seat, procDir: string): string {
	return [
		seat.body,
		`<council_runtime>\nprocedures directory: ${procDir}\n</council_runtime>`,
		groundingBlock(repoRoot),
	].join("\n\n");
}

export function buildChildArgv(seat: Seat, input: string, promptFile: string): string[] {
	// -a: trust project-local files — the child runs headless in the same repo
	// the (already-trusted) parent dispatched from, so project extensions load.
	const argv = ["--mode", "json", "-p", "-a", "--no-session", "--model", seat.model];
	if (seat.thinkingLevel) argv.push("--thinking", seat.thinkingLevel);
	argv.push("--tools", builtinToolsFor(seat).join(","));
	argv.push("--append-system-prompt", promptFile);
	argv.push(input);
	return argv;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test test/seats.test.ts`
Expected: all 14 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: generalized seats module with override resolution and wiki grounding"
```

---

### Task 5: child.ts (verbatim) + child tests

**Files:**
- Create: `extensions/child.ts` (copy verbatim), `test/child.test.ts`

**Interfaces:**
- Consumes: `loadSeat`, `grantsFor`, `builtinToolsFor` from seats.ts (signatures unchanged from what Task 4 produced).
- Produces: `runChildMode(pi, repoRoot, seatName): void`, `isCallAllowed(seat, toolName): boolean`.

- [ ] **Step 1: Copy child.ts verbatim**

```bash
cp "$SRC/child.ts" extensions/child.ts
```

- [ ] **Step 2: Write the test**

Create `test/child.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadSeat } from "../extensions/seats.ts";
import { isCallAllowed } from "../extensions/child.ts";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-child-"));

test("principal: read/grep/find/ls allowed, bash/write/edit blocked", () => {
	const p = loadSeat(root, "principal");
	expect(isCallAllowed(p, "read")).toBe(true);
	expect(isCallAllowed(p, "grep")).toBe(true);
	expect(isCallAllowed(p, "find")).toBe(true);
	expect(isCallAllowed(p, "ls")).toBe(true);
	expect(isCallAllowed(p, "bash")).toBe(false);
	expect(isCallAllowed(p, "write")).toBe(false);
	expect(isCallAllowed(p, "edit")).toBe(false);
	expect(isCallAllowed(p, "council_dispatch")).toBe(false);
});

test("judge: read+bash allowed, write blocked", () => {
	const j = loadSeat(root, "judge");
	expect(isCallAllowed(j, "read")).toBe(true);
	expect(isCallAllowed(j, "bash")).toBe(true);
	expect(isCallAllowed(j, "write")).toBe(false);
});

test("council-runner: hub tools allowed", () => {
	const r = loadSeat(root, "council-runner");
	expect(isCallAllowed(r, "council_dispatch")).toBe(true);
	expect(isCallAllowed(r, "council_wait")).toBe(true);
	expect(isCallAllowed(r, "council_cancel")).toBe(true);
});

test("consolidator: only read", () => {
	const c = loadSeat(root, "consolidator");
	expect(isCallAllowed(c, "read")).toBe(true);
	for (const t of ["bash", "write", "edit", "grep", "find", "ls", "council_dispatch"]) {
		expect(isCallAllowed(c, t)).toBe(false);
	}
});
```

- [ ] **Step 3: Run tests**

Run: `bun test test/child.test.ts`
Expected: 4 PASS. (If the import of `ExtensionAPI` types fails type-wise at runtime it still runs — bun strips types.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: port child seat sandboxing verbatim with tests"
```

---

### Task 6: hub-tools.ts generalization + path tests

**Files:**
- Create: `extensions/hub-tools.ts` (copy + targeted edits), `test/paths.test.ts`

**Interfaces:**
- Consumes: `Hub`, `buildSystemPrompt(repoRoot, seat, procDir)` (3-arg), `proceduresDir(repoRoot)`.
- Produces:
  - `pidFilePath(repoRoot): string` → `<repoRoot>/$CONFIG_DIR_NAME/council/.pids.json`
  - `getHub(repoRoot, onChange?)`, `shutdownHub()`, `registerHubTools(pi, repoRoot, opts?)` — same behavior as source otherwise.

- [ ] **Step 1: Copy and apply the five edits**

```bash
cp "$SRC/hub-tools.ts" extensions/hub-tools.ts
```

Edit 1 — import line:
oldText: `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";`
newText: `import { CONFIG_DIR_NAME, type ExtensionAPI } from "@earendil-works/pi-coding-agent";`

Edit 2 — seats import adds proceduresDir:
oldText: `import { buildChildArgv, buildSystemPrompt, loadSeat } from "./seats.ts";`
newText: `import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "./seats.ts";`

Edit 3 — PID constant becomes function:
oldText: `export const PID_FILE_REL = ".pi/extensions/council/.pids.json";`
newText:
```ts
export function pidFilePath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", ".pids.json");
}
```

Edit 4 — getHub call site:
oldText: `pidFile: path.join(repoRoot, PID_FILE_REL),`
newText: `pidFile: pidFilePath(repoRoot),`

Edit 5 — neutral dispatch description + 3-arg prompt builder:
oldText:
```
			"Dispatch a Council seat as an isolated background job. Returns a job ID immediately. " +
			"Follow with council_wait to collect the result. Timeout default 15 min (use 45 for the owner's implementation dispatch).",
```
newText:
```
			"Dispatch a Council seat as an isolated background job. Returns a job ID immediately. " +
			"Follow with council_wait to collect the result. Timeout default 15 min; raise it for long implementation or verification tasks.",
```

Edit 6 — prompt write call:
oldText: `fs.writeFileSync(promptFile, buildSystemPrompt(repoRoot, seat), { mode: 0o600 });`
newText: `fs.writeFileSync(promptFile, buildSystemPrompt(repoRoot, seat, proceduresDir(repoRoot)), { mode: 0o600 });`

- [ ] **Step 2: Write the failing test**

Create `test/paths.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { pidFilePath } from "../extensions/hub-tools.ts";
import { proceduresDir, PKG_ROOT } from "../extensions/seats.ts";

test("pidFilePath lives under $CONFIG_DIR_NAME/council", () => {
	expect(pidFilePath("/repo")).toBe(path.join("/repo", CONFIG_DIR_NAME, "council", ".pids.json"));
});

test("proceduresDir falls back to packaged default", () => {
	expect(proceduresDir("/nonexistent-repo-root-xyz")).toBe(path.join(PKG_ROOT, "council", "procedures"));
});
```

- [ ] **Step 3: Run tests**

Run: `bun test test/paths.test.ts`
Expected: 2 PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: generalize hub tools — config-dir pid file, 3-arg prompt builder, neutral descriptions"
```

---

### Task 7: Scaffold assets + scaffold routine

**Files:**
- Create: `council/scaffold/council/board.md`, `council/scaffold/council/cards/_template.md`, `council/scaffold/council/preflight.sh`, `council/scaffold/council/validate.py`, `council/scaffold/vault/CLAUDE.md`, `council/scaffold/vault/wiki/index.md`, `council/scaffold/vault/wiki/log.md`
- Create: `extensions/scaffold.ts`
- Test: `test/scaffold.test.ts`

**Interfaces:**
- Produces: `scaffoldInto(repoRoot: string, scaffoldRoot: string): { created: string[]; skipped: string[] }` — recursive, non-clobbering (existing files never touched), creates missing parent dirs, returns repo-relative paths.

- [ ] **Step 1: Write scaffold/council/board.md (empty columns)**

```markdown
# Council Board

State columns. Each card appears exactly once, on one line under the column
matching its frontmatter `state`, as `- <ID> — <Title>` with an em dash
(U+2014). `python3 council/validate.py` enforces this.

## Backlog

## Ready

## Deliberating

## In Progress

## In Review

## Needs Human

## Done
```

- [ ] **Step 2: Copy _template.md and validate.py verbatim**

```bash
mkdir -p council/scaffold/council/cards council/scaffold/vault/wiki
cp /Users/tista/codes/ev-guide/council/cards/_template.md council/scaffold/council/cards/_template.md
cp /Users/tista/codes/ev-guide/council/validate.py council/scaffold/council/validate.py
```

- [ ] **Step 3: Write scaffold/council/preflight.sh (generic template)**

```bash
#!/usr/bin/env bash
# Council preflight (generic starting point — adapt to your project).
# Card-aware: with a card id it checks the card file exists. Extend with your
# project's own gates (database up, services running, datasets present) before
# your first run. Prints no install steps — that's the facilitator's job.
# Any FAIL: line must halt the run.
set -u

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

command -v bun >/dev/null 2>&1 || fail "bun is not on PATH (install via https://bun.sh)"
ok "bun found: $(bun --version)"

[ -f bun.lock ] || [ -f package.json ] || fail "not a project root (no package.json/bun.lock)"
ok "project files present"

if [ -f package.json ]; then
  bun install --frozen-lockfile >/dev/null 2>&1 || fail "bun install failed (deps not installed)"
  ok "dependencies installed"
fi

if [ "${1:-}" != "" ]; then
  [ -f "council/cards/$1.md" ] || fail "card file council/cards/$1.md not found"
  ok "card $1 present"
fi

# main must be able to fast-forward from origin.
branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo main)
if [ "$branch" != "main" ]; then
  git fetch origin >/dev/null 2>&1
  git merge-base --is-ancestor origin/main HEAD 2>/dev/null \
    || fail "local history does not descend from origin/main (stale before running a card)"
  ok "history is up to date with origin/main"
fi

echo "PASS: preflight clean"
```

Then: `chmod +x council/scaffold/council/preflight.sh`

(Note: ev-guide keeps its richer repo-specific preflight locally — `/council-init` never overwrites it.)

- [ ] **Step 4: Copy vault/CLAUDE.md and reword the one runner mention**

```bash
cp /Users/tista/codes/ev-guide/vault/CLAUDE.md council/scaffold/vault/CLAUDE.md
```

Edit in `council/scaffold/vault/CLAUDE.md`:
oldText:
```
PATHS: Claude Code runs from the monorepo root, so every path below is written
relative to that root (e.g. `vault/raw/`, `vault/wiki/index.md`).
```
newText:
```
PATHS: pi runs from the repository root, so every path below is written
relative to that root (e.g. `vault/raw/`, `vault/wiki/index.md`).
```

- [ ] **Step 5: Write empty vault skeletons**

`council/scaffold/vault/wiki/index.md`:
```markdown
# Wiki Index

Catalog of every wiki page. On a query, read this first, then drill into the
relevant pages. Each entry: link + one-line summary (+ optional metadata).

## Overviews

## Entities

## Concepts

## Comparisons

## Sources
```

`council/scaffold/vault/wiki/log.md`:
```markdown
<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] <op> | <title> -->
```

- [ ] **Step 6: Write the failing test**

Create `test/scaffold.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { scaffoldInto } from "../extensions/scaffold.ts";
import { PKG_ROOT } from "../extensions/seats.ts";

const SCAFFOLD = path.join(PKG_ROOT, "council", "scaffold");

test("first run creates everything, second run skips everything", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-"));
	const first = scaffoldInto(root, SCAFFOLD);
	expect(first.created).toContain("council/board.md");
	expect(first.created).toContain("council/cards/_template.md");
	expect(first.created).toContain("council/preflight.sh");
	expect(first.created).toContain("council/validate.py");
	expect(first.created).toContain("vault/CLAUDE.md");
	expect(first.created).toContain("vault/wiki/index.md");
	expect(first.created).toContain("vault/wiki/log.md");
	expect(first.created).toContain("vault/raw");
	expect(first.created).toContain("vault/wiki/sources");
	expect(first.skipped).toEqual([]);

	// user modifies a file, rerun: modification survives
	fs.appendFileSync(path.join(root, "council", "board.md"), "\n<!-- mine -->");
	const second = scaffoldInto(root, SCAFFOLD);
	expect(second.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources")).toEqual([]);
	expect(second.skipped).toContain("council/board.md");
	expect(fs.readFileSync(path.join(root, "council", "board.md"), "utf-8")).toContain("<!-- mine -->");
});
```

- [ ] **Step 7: Verify test fails**

Run: `bun test test/scaffold.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement extensions/scaffold.ts**

```ts
import * as fs from "node:fs";
import * as path from "node:path";

export interface ScaffoldResult {
	created: string[];
	skipped: string[];
}

/** Directories that carry no tracked files but the workflow expects to exist. */
const EMPTY_DIRS = ["vault/raw", "vault/wiki/sources"];

/**
 * Copy scaffoldRoot/<rel> into repoRoot/<rel>, recursively, never overwriting.
 * Existing files are reported in `skipped` and left byte-for-byte untouched.
 */
export function scaffoldInto(repoRoot: string, scaffoldRoot: string): ScaffoldResult {
	const result: ScaffoldResult = { created: [], skipped: [] };

	const walk = (rel: string) => {
		const src = path.join(scaffoldRoot, rel);
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(src, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const childRel = path.join(rel, entry.name);
			const dst = path.join(repoRoot, childRel);
			if (entry.isDirectory()) {
				walk(childRel);
			} else if (entry.isFile()) {
				if (fs.existsSync(dst)) {
					result.skipped.push(childRel);
				} else {
					fs.mkdirSync(path.dirname(dst), { recursive: true });
					fs.copyFileSync(path.join(src, entry.name), dst);
					result.created.push(childRel);
				}
			}
		}
	};

	walk("");
	for (const dir of EMPTY_DIRS) {
		const dst = path.join(repoRoot, dir);
		if (!fs.existsSync(dst)) {
			fs.mkdirSync(dst, { recursive: true });
			result.created.push(dir);
		}
	}
	return result;
}
```

Note: `path.join(rel, name)` with rel `""` yields just the name; `path.join(scaffoldRoot, "")` is scaffoldRoot itself — both fine.

- [ ] **Step 9: Run tests**

Run: `bun test test/scaffold.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: scaffold assets (board, template, preflight, validator, vault skeleton) + non-clobbering scaffold routine"
```

---

### Task 8: index.ts entry — scanned commands, widget, /council-init

**Files:**
- Create: `extensions/index.ts`
- Test: `test/render.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - default extension export; registers one slash command per procedure file (union of packaged + repo override dirs, override wins per file), `/council-jobs`, `/council-init`; hub tools; widget; max-tokens patch; child mode via `COUNCIL_SEAT`.
  - `renderProcedure(strippedBody: string, procDir: string, args?: string): string` — exported pure function substituting `$COUNCIL_PROCEDURES` then `$ARGUMENTS`; this is the seam the command handlers call and the tests target.

- [ ] **Step 1: Write extensions/index.ts**

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { runChildMode } from "./child.ts";
import { Hub } from "./hub.ts";
import { getHub, pidFilePath, registerHubTools, shutdownHub } from "./hub-tools.ts";
import { PKG_ROOT, proceduresDir } from "./seats.ts";
import { scaffoldInto } from "./scaffold.ts";

/**
 * OpenRouter's catalogue metadata caps deepseek-v4-pro-0813 at ~4.1K output
 * tokens. With high thinking, deliberations burn the whole budget on
 * reasoning and die stopReason=length with no text. Patch max_tokens on the
 * outgoing payload so the fix travels with the package (pi's models.json is
 * user-global only). Applied in parent and every seat child.
 */
const MAX_TOKENS_FLOOR: Record<string, number> = {
	"deepseek/deepseek-v4-pro-0813": 131072,
};

function registerMaxTokensFix(pi: ExtensionAPI): void {
	pi.on("before_provider_request", (event: any) => {
		const payload = event?.payload;
		if (!payload || typeof payload.model !== "string") return;
		const floor = MAX_TOKENS_FLOOR[payload.model];
		if (!floor) return;
		const patched = { ...payload };
		let changed = false;
		// OpenAI-completions payloads use max_completion_tokens; older shapes use max_tokens.
		for (const key of ["max_completion_tokens", "max_tokens"]) {
			if (typeof patched[key] === "number" && patched[key] < floor) {
				patched[key] = floor;
				changed = true;
			}
		}
		return changed ? patched : undefined;
	});
}

function frontmatterField(raw: string, key: string): string | undefined {
	const m = raw.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
	return m?.[1]?.trim();
}

/** Substitute runtime placeholders into a stripped procedure body. */
export function renderProcedure(strippedBody: string, procDir: string, args?: string): string {
	return strippedBody
		.replace(/\$COUNCIL_PROCEDURES/g, procDir)
		.replace(/\$ARGUMENTS/g, (args ?? "").trim());
}

export default function (pi: ExtensionAPI) {
	const repoRoot = process.cwd();
	registerMaxTokensFix(pi);
	const seatName = process.env.COUNCIL_SEAT;
	if (seatName) {
		runChildMode(pi, repoRoot, seatName);
		return;
	}

	// ---- parent mode ----
	let uiCtx: ExtensionContext | null = null;
	let widgetTimer: ReturnType<typeof setInterval> | null = null;
	registerHubTools(pi, repoRoot);

	const renderWidget = () => {
		if (!uiCtx?.hasUI) return;
		const active = getHub(repoRoot)
			.list()
			.filter((j) => j.exitCode === null);
		if (active.length === 0) {
			uiCtx.ui.setWidget("council", []);
			return;
		}
		uiCtx.ui.setWidget(
			"council",
			active.map((j) => {
				const mins = Math.floor((Date.now() - j.startedAt) / 60_000);
				const secs = Math.floor(((Date.now() - j.startedAt) % 60_000) / 1000);
				const last = j.events[j.events.length - 1] ?? "…";
				const flag = j.state === "timeout" ? " ⚠ over ceiling" : "";
				return `⏳ ${j.seat} ${mins}m${String(secs).padStart(2, "0")}s  last: ${last}${flag}`;
			}),
		);
	};

	pi.on("session_start", (_event, ctx) => {
		uiCtx = ctx;
		const swept = Hub.sweepStalePids(pidFilePath(repoRoot));
		if (swept > 0 && ctx.hasUI) ctx.ui.notify(`council: swept ${swept} orphaned seat process(es)`, "warning");
		getHub(repoRoot, renderWidget); // create hub with onChange → widget refresh
		if (!widgetTimer) {
			widgetTimer = setInterval(renderWidget, 5_000);
			widgetTimer.unref?.();
		}
	});
	pi.on("turn_end", () => renderWidget());
	pi.on("session_shutdown", () => {
		if (widgetTimer) {
			clearInterval(widgetTimer);
			widgetTimer = null;
		}
		shutdownHub();
	});

	// ---- procedure commands: scanned, override-aware ----
	const procDir = proceduresDir(repoRoot);
	const seen = new Set<string>();
	for (const dir of [
		path.join(repoRoot, ".pi", "council", "procedures"),
		path.join(PKG_ROOT, "council", "procedures"),
	]) {
		if (!fs.existsSync(dir) || dir === procDir) {
			if (dir !== procDir) continue;
		}
		for (const file of fs.readdirSync(dir)) {
			if (!file.endsWith(".md") || seen.has(file)) continue;
			seen.add(file);
			const raw = fs.readFileSync(path.join(dir, file), "utf-8");
			const name = file.replace(/\.md$/, "");
			const description =
				frontmatterField(raw, "description") ?? `Run the ${name} procedure`;
			const argumentHint = frontmatterField(raw, "argument-hint");
			const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
			pi.registerCommand(name, {
				description: argumentHint ? `${description} (${argumentHint})` : description,
				handler: async (args, _ctx) => {
					pi.sendUserMessage(renderProcedure(body, procDir, args));
				},
			});
		}
	}

	pi.registerCommand("council-init", {
		description: "Scaffold the council/ and vault/ data trees into this repository (never overwrites)",
		handler: async (_args, ctx) => {
			const r = scaffoldInto(repoRoot, path.join(PKG_ROOT, "council", "scaffold"));
			try {
				fs.chmodSync(path.join(repoRoot, "council", "preflight.sh"), 0o755);
			} catch {
				/* best effort */
			}
			const msg =
				`council-init complete.\n` +
				`Created:\n${r.created.map((c) => `  + ${c}`).join("\n") || "  (nothing)"}\n` +
				`Skipped (already present):\n${r.skipped.map((s) => `  = ${s}`).join("\n") || "  (none)"}`;
			if (ctx.hasUI) ctx.ui.notify(msg, "info");
			else console.log(msg);
		},
	});

	pi.registerCommand("council-jobs", {
		description: "Show the Council job table",
		handler: async (_args, ctx) => {
			const jobs = getHub(repoRoot).list();
			if (jobs.length === 0) {
				ctx.ui.notify("No council jobs this session.", "info");
				return;
			}
			const lines = jobs.map((j) => {
				const mins = ((Date.now() - j.startedAt) / 60_000).toFixed(1);
				const recent = j.events.slice(-3).join("  ");
				return `${j.id}  ${j.seat.padEnd(14)} ${j.state.padEnd(9)} ${mins}m  pid=${j.pid}  ${recent}`;
			});
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}
```

Design notes baked into this file (for the reviewer):
- Command scanning walks `[overrideDir, pkgDir]` and dedupes by filename so an override file shadows the packaged one; the effective `procDir` (used for `$COUNCIL_PROCEDURES` and `<council_runtime>`) is `proceduresDir(repoRoot)`.
- The loop condition `if (!fs.existsSync(dir) || dir === procDir) { if (dir !== procDir) continue; }` reads awkwardly — simplify while implementing to:

```ts
	for (const dir of [overrideDir, pkgDir]) {
		if (dir === procDir) {
			// effective dir: always fully scanned (covers override==pkg edge)
		} else if (!fs.existsSync(dir)) {
			continue;
		}
		…scan…
	}
```

Equivalent semantics; pick whichever reads cleaner at implementation time, but keep: override files win, union of names, no duplicates.

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors. (If `ctx.ui.notify` typing complains in the non-UI branch, guard with `else if (typeof console !== "undefined")` — but it should pass; source used unguarded ctx.ui.)

- [ ] **Step 3: Write the substitution test**

Create `test/render.test.ts`:

```ts
import { test, expect } from "bun:test";
import { renderProcedure } from "../extensions/index.ts";

test("substitutes $COUNCIL_PROCEDURES and $ARGUMENTS", () => {
	const body = "Read $COUNCIL_PROCEDURES/council.md on: $ARGUMENTS";
	expect(renderProcedure(body, "/pkg/council/procedures", "EV-7"))
		.toBe("Read /pkg/council/procedures/council.md on: EV-7");
});

test("missing arguments renders empty substitution", () => {
	expect(renderProcedure("task: $ARGUMENTS", "/p", undefined)).toBe("task: ");
	expect(renderProcedure("no placeholders", "/p", "x")).toBe("no placeholders");
});
```

Run: `bun test test/render.test.ts`
Expected: 2 PASS. (Importing `extensions/index.ts` at test time is safe — the default-export function only runs when pi invokes it.)

- [ ] **Step 4: Full suite**

Run: `bun test`
Expected: hub (11) + seats (14) + child (4) + paths (2) + scaffold (1) + render (2) all PASS, integration skipped.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: extension entry — scanned procedure commands, council-init, widget, jobs table"
```

---

### Task 9: Integration test + final verification

**Files:**
- Create: `test/integration.test.ts`
- Modify: none

**Interfaces:**
- Consumes: full stack. Network + OpenRouter key required; gated behind `COUNCIL_INTEGRATION=1`.

- [ ] **Step 1: Port the integration test**

Create `test/integration.test.ts`:

```ts
// Requires network + OpenRouter key; skipped unless COUNCIL_INTEGRATION=1.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Hub } from "../extensions/hub.ts";
import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "../extensions/seats.ts";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-int-src-"));
const enabled = process.env.COUNCIL_INTEGRATION === "1";

test.skipIf(!enabled)(
	"consolidator seat round-trips a real dispatch",
	async () => {
		const seat = loadSeat(root, "consolidator");
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-int-"));
		const promptFile = path.join(tmpDir, "system.md");
		fs.writeFileSync(promptFile, buildSystemPrompt(root, seat, proceduresDir(root)));
		const hub = new Hub({ monitorIntervalMs: 1000, pidFile: path.join(tmpDir, "pids.json") });
		try {
			const job = hub.spawnJob({
				seat: seat.name,
				command: "pi",
				args: buildChildArgv(
					seat,
					"Reply with exactly one sentence describing what a council board is. Do not use any tool.",
					promptFile,
				),
				cwd: root,
				env: { ...process.env, COUNCIL_SEAT: seat.name } as Record<string, string>,
				timeoutMs: 5 * 60_000,
				stallMs: 3 * 60_000,
			});
			const [r] = await hub.wait([job.id], 5 * 60_000);
			if (r.state !== "done") console.error("stderr tail:", r.stderrTail);
			expect(r.state).toBe("done");
			expect(r.output.length).toBeGreaterThan(10);
			expect(r.usage.turns).toBeGreaterThanOrEqual(1);
		} finally {
			hub.shutdown();
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	},
	6 * 60_000,
);
```

(The original dispatched against `council/board.md`; the genericized version asks a repo-independent question so it passes on any cwd.)

- [ ] **Step 2: Full verification sweep**

Run each and confirm:
```bash
bun test                      # all green; integration skipped without the env var
bunx tsc --noEmit             # clean
grep -rn "autoloadSkills\|PID_FILE_REL\|\.pi/extensions/council" extensions/ council/ test/ || echo clean
ls extensions/                # index, hub, hub-tools, seats, child, scaffold
ls council/agents | wc -l     # 9
ls council/procedures | wc -l # 7
```
Expected: `clean`, counts match.

- [ ] **Step 3: Manual smoke (optional, needs models configured)**

In a scratch dir: `pi -e /Users/tista/codes/pi-council`, then run `/council-init`, confirm the created-files report, re-run to confirm all-skipped. Not automated; report result either way.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test: integration round-trip and verification sweep"
```
