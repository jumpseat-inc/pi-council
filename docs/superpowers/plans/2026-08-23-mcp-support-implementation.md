# MCP Server Support Implementation Plan (v0.2.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add MCP server support to pi-council — registry + management commands, stdio and Streamable HTTP transports, `none`/`header`/`oauth` auth (OAuth per the MCP authorization spec, incl. login/refresh/reauth), and tool bridging into the parent session and granted seats.

**Architecture:** Build on `@modelcontextprotocol/sdk` (client, transports, OAuth scaffolding). New modules under `extensions/mcp/`. Registrations repo-local (`$CONFIG_DIR_NAME/council/mcp.json`, committable, no secrets); secrets user-global (`getAgentDir()/council/mcp-auth.json`, mode 0600, atomic writes). Parent authenticates and discovers tool names at dispatch time; seats connect eagerly at startup and are gated by a new `mcp:` frontmatter field through the existing sandbox.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk` v1.30.x, `typebox` (existing peer dep), Bun tests, `node:http` for the callback listener and HTTP fixtures.

**Spec:** `docs/superpowers/specs/2026-08-23-mcp-support-design.md`

## Global Constraints

- SDK import subpaths — the barrels do NOT re-export these; bun requires the `.js` suffix on every subpath (typecheck resolves types via the exports map):
  - `@modelcontextprotocol/sdk/client` → `Client`
  - `@modelcontextprotocol/sdk/client/streamableHttp.js` → `StreamableHTTPClientTransport`
  - `@modelcontextprotocol/sdk/client/stdio.js` → `StdioClientTransport`
  - `@modelcontextprotocol/sdk/client/auth.js` → `auth`, `UnauthorizedError`, `OAuthClientProvider`
  - `@modelcontextprotocol/sdk/shared/auth.js` → types `OAuthTokens`, `OAuthClientMetadata`, `OAuthClientInformationMixed`, `OAuthDiscoveryState`
  - Fixtures: `@modelcontextprotocol/sdk/server/mcp.js` → `McpServer`; `@modelcontextprotocol/sdk/server/stdio.js` → `StdioServerTransport`; `@modelcontextprotocol/sdk/server/streamableHttp.js` → `StreamableHTTPServerTransport`
  - `zod` ships as an SDK dependency and is resolvable for fixture schemas (fixtures are test-only).
- The `typebox` peer dep is v1.x: schemas are plain JSON Schema objects (`Type.Any()` → `{}`), no Kind symbols. Assert on JSON structure in tests.
- `getAgentDir` and `CONFIG_DIR_NAME` come from `@earendil-works/pi-coding-agent`.
- Auth file is mode `0600`, written atomically (temp file + rename). Never write secrets into `mcp.json`. Never log token values.
- MCP tool names are `mcp__<server>__<toolName>` (exact). pi's `--tools` flag is an exact-name allowlist; the seat child's argv must enumerate every granted MCP tool name, discovered by the parent at dispatch time.
- Seats connect **eagerly** at startup. Lazy connect deadlocks (unregistered ⇒ unadvertised ⇒ never called). pi's `_refreshToolRegistry` re-activates any registered tool whose name is in the allowlist, so async registration after session start is safe as long as argv carried the names.
- `header`/`oauth` auth require `url` (remote HTTP); stdio servers use `none` (enforced in validation).
- Follow TDD per task: failing test → run (fails) → implement → run (passes) → commit.

## Target layout (new/changed)

```
extensions/mcp/
  config.ts        # types, parse/validate mcp.json, $ENV indirection
  auth-store.ts    # user-global secrets read/write (atomic, 0600)
  schema.ts        # jsonSchemaToTypebox converter
  client.ts        # McpManager: connect/listTools/call/close/status + tool-name cache
  oauth.ts         # CouncilOAuthProvider + localhost callback listener + loginOAuth
  index.ts         # wiring: manager singleton, registerServerTools, startSeatMcp, /mcp command handlers
extensions/seats.ts        # + mcp field on Seat; + buildChildArgv mcpTools param
extensions/child.ts        # + isCallAllowed mcp gating; + eager startup registration
extensions/hub-tools.ts    # + dispatch appends MCP tool names to argv
extensions/index.ts        # + /mcp command, session_start parent MCP wiring, shutdown close
package.json               # + @modelcontextprotocol/sdk dependency
test/mcp/                  # config, auth-store, schema, manager(+fixtures), child-grants, dispatch, oauth tests
```

---

### Task 1: Add the SDK dependency

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `@modelcontextprotocol/sdk` resolvable at runtime and in tests.

- [ ] **Step 1: Add dependency**

Edit `package.json` — insert after the `peerDependencies` block:

```json
	"dependencies": {
		"@modelcontextprotocol/sdk": "^1.30.0"
	},
```

- [ ] **Step 2: Install and verify**

Run: `cd /Users/tista/codes/pi-council && bun install && bun test && bunx tsc --noEmit`
Expected: full existing suite still green, typecheck clean.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: add @modelcontextprotocol/sdk dependency"
```

---

### Task 2: MCP config module

**Files:**
- Create: `extensions/mcp/config.ts`
- Test: `test/mcp/config.test.ts`

**Interfaces:**
- Produces:
  - `type McpAuthMode = "none" | "header" | "oauth"`
  - `interface McpServerConfig { url?: string; command?: string; args?: string[]; auth: McpAuthMode; headers?: Record<string, string>; enabled?: boolean }`
  - `interface McpConfig { servers: Record<string, McpServerConfig> }`
  - `mcpConfigPath(repoRoot): string`
  - `loadMcpConfig(repoRoot): McpConfig` — missing file → `{ servers: {} }`; malformed → throws naming the path.
  - `validateEntry(name, cfg): string[]` — empty array = valid.
  - `resolveHeaders(cfg, stored): Record<string, string>` — `$ENV_VAR` substitution (embedded allowed), stored-secret fallback, unresolved entries dropped.

- [ ] **Step 1: Write the failing test**

Create `test/mcp/config.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadMcpConfig, validateEntry, resolveHeaders } from "../../extensions/mcp/config.ts";

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-cfg-"));
}

test("missing mcp.json yields empty config", () => {
	expect(loadMcpConfig(tmpRepo())).toEqual({ servers: {} });
});

test("loads a valid config", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, ".pi", "council"), { recursive: true });
	fs.writeFileSync(
		path.join(root, ".pi", "council", "mcp.json"),
		JSON.stringify({
			servers: {
				ctx: { url: "https://mcp.example.com/mcp", auth: "oauth" },
				local: { command: "npx", args: ["-y", "srv"], auth: "none", enabled: false },
			},
		}),
	);
	const cfg = loadMcpConfig(root);
	expect(Object.keys(cfg.servers).sort()).toEqual(["ctx", "local"]);
	expect(validateEntry("ctx", cfg.servers.ctx!)).toEqual([]);
	expect(validateEntry("local", cfg.servers.local!)).toEqual([]);
});

test("malformed json throws with path", () => {
	const root = tmpRepo();
	fs.mkdirSync(path.join(root, ".pi", "council"), { recursive: true });
	fs.writeFileSync(path.join(root, ".pi", "council", "mcp.json"), "{ not json");
	expect(() => loadMcpConfig(root)).toThrow(/mcp\.json/);
});

test("validateEntry: transport and auth rules", () => {
	const errs = (cfg: Record<string, unknown>) => validateEntry("x", cfg as never);
	expect(errs({ auth: "none" }).length).toBeGreaterThan(0); // no url or command
	expect(errs({ url: "https://a", command: "npx", auth: "none" }).length).toBeGreaterThan(0); // both
	expect(errs({ url: "https://a", auth: "nope" }).length).toBeGreaterThan(0); // bad auth mode
	expect(errs({ command: "npx", auth: "oauth" }).length).toBeGreaterThan(0); // oauth needs url
	expect(errs({ command: "npx", auth: "header" }).length).toBeGreaterThan(0); // header needs url
	expect(errs({ command: "npx", auth: "none" })).toEqual([]);
	expect(errs({ url: "https://a", auth: "header" })).toEqual([]);
});

test("resolveHeaders: env substitution, stored fallback, drop unresolved", () => {
	process.env.TEST_MCP_KEY = "from-env";
	const out = resolveHeaders(
		{ headers: { Authorization: "Bearer $TEST_MCP_KEY", "X-Fixed": "fixed" } } as never,
		{ Authorization: "Bearer stored" },
	);
	expect(out.Authorization).toBe("Bearer from-env");
	expect(out["X-Fixed"]).toBe("fixed");
	delete process.env.TEST_MCP_KEY;
	expect(resolveHeaders({ headers: { Authorization: "Bearer $NOPE_VAR" } } as never, {}).Authorization).toBeUndefined();
	// stored-only headers (entered via /mcp login) are carried through
	expect(resolveHeaders({ headers: {} } as never, { Authorization: "Bearer stored-only" })).toEqual({
		Authorization: "Bearer stored-only",
	});
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/mcp/config.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `extensions/mcp/config.ts`**

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

export type McpAuthMode = "none" | "header" | "oauth";

export interface McpServerConfig {
	url?: string;
	command?: string;
	args?: string[];
	auth: McpAuthMode;
	headers?: Record<string, string>;
	enabled?: boolean;
}

export interface McpConfig {
	servers: Record<string, McpServerConfig>;
}

export function mcpConfigPath(repoRoot: string): string {
	return path.join(repoRoot, CONFIG_DIR_NAME, "council", "mcp.json");
}

export function loadMcpConfig(repoRoot: string): McpConfig {
	const file = mcpConfigPath(repoRoot);
	if (!fs.existsSync(file)) return { servers: {} };
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
	} catch (e) {
		throw new Error(`Malformed MCP config ${file}: ${(e as Error).message}`);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error(`Malformed MCP config ${file}: expected a JSON object`);
	}
	const servers = (parsed as { servers?: Record<string, McpServerConfig> }).servers;
	if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
		throw new Error(`Malformed MCP config ${file}: "servers" must be an object map`);
	}
	return { servers };
}

export function saveMcpConfig(repoRoot: string, config: McpConfig): void {
	const file = mcpConfigPath(repoRoot);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
}

export function validateEntry(name: string, cfg: McpServerConfig): string[] {
	const errs: string[] = [];
	const hasUrl = typeof cfg?.url === "string" && cfg.url.length > 0;
	const hasCmd = typeof cfg?.command === "string" && cfg.command.length > 0;
	if (hasUrl === hasCmd) {
		errs.push(`server "${name}": exactly one of "url" or "command" is required`);
	}
	if (cfg?.auth !== "none" && cfg?.auth !== "header" && cfg?.auth !== "oauth") {
		errs.push(`server "${name}": auth must be one of none|header|oauth`);
	} else if (cfg?.auth !== "none" && !hasUrl) {
		errs.push(`server "${name}": "${cfg.auth}" auth requires a remote http server ("url"); stdio servers use none`);
	}
	if (cfg?.enabled !== undefined && typeof cfg.enabled !== "boolean") {
		errs.push(`server "${name}": enabled must be a boolean`);
	}
	return errs;
}

function substituteEnv(value: string): { text: string; complete: boolean } {
	let complete = true;
	const text = value.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_m, name: string) => {
		const v = process.env[name];
		if (v === undefined) {
			complete = false;
			return "";
		}
		return v;
	});
	return { text, complete };
}

export function resolveHeaders(cfg: McpServerConfig, stored: Record<string, string> = {}): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(cfg.headers ?? {})) {
		if (v.includes("$")) {
			const { text, complete } = substituteEnv(v);
			if (complete) out[k] = text;
			else if (stored[k] !== undefined) out[k] = stored[k]; // unresolved $VAR → stored fallback
		} else if (stored[k] !== undefined) {
			out[k] = stored[k]; // login-provided secret wins over the literal
		} else {
			out[k] = v;
		}
	}
	for (const [k, v] of Object.entries(stored)) {
		if (!(k in out)) out[k] = v; // headers entered via /mcp login that cfg doesn't name
	}
	return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/mcp/config.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(mcp): config module — registry parse/validate, env indirection"
```
---

### Task 3: Auth store (user-global secrets)

**Files:**
- Create: `extensions/mcp/auth-store.ts`
- Test: `test/mcp/auth-store.test.ts`

**Interfaces:**
- Produces:
  - `interface McpAuthServerEntry { headers?: Record<string, string>; oauth?: { client?: unknown; tokens?: unknown; discovery?: unknown } }`
  - `interface McpAuthFile { servers: Record<string, McpAuthServerEntry> }`
  - `authFilePath(): string` → `getAgentDir()/council/mcp-auth.json`
  - `loadAuth(file?): McpAuthFile` — missing/malformed → `{ servers: {} }`
  - `saveAuth(auth, file?): void` — atomic (tmp + rename), mode 0600, creates parent dirs
  - `clearServerSecrets(serverName, file?): boolean` — removes entry; false if absent

- [ ] **Step 1: Write the failing test**

Create `test/mcp/auth-store.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadAuth, saveAuth, clearServerSecrets } from "../../extensions/mcp/auth-store.ts";

function tmpFile(): string {
	return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-auth-")), "mcp-auth.json");
}

test("missing file yields empty store", () => {
	expect(loadAuth(tmpFile())).toEqual({ servers: {} });
});

test("malformed file yields empty store, not a crash", () => {
	const f = tmpFile();
	fs.writeFileSync(f, "{ nope");
	expect(loadAuth(f)).toEqual({ servers: {} });
});

test("round-trip with 0600 mode", () => {
	const f = tmpFile();
	saveAuth({ servers: { ctx: { headers: { Authorization: "Bearer s3cret" } } } }, f);
	const mode = fs.statSync(f).mode & 0o777;
	expect(mode).toBe(0o600);
	const loaded = loadAuth(f);
	expect(loaded.servers.ctx?.headers?.Authorization).toBe("Bearer s3cret");
});

test("clearServerSecrets removes only the named entry", () => {
	const f = tmpFile();
	saveAuth({ servers: { a: { headers: { X: "1" } }, b: { headers: { Y: "2" } } } }, f);
	expect(clearServerSecrets("a", f)).toBe(true);
	expect(clearServerSecrets("a", f)).toBe(false);
	expect(loadAuth(f)).toEqual({ servers: { b: { headers: { Y: "2" } } } });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/mcp/auth-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `extensions/mcp/auth-store.ts`**

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export interface McpAuthServerEntry {
	headers?: Record<string, string>;
	oauth?: {
		/** OAuthClientInformationFull from dynamic client registration */
		client?: unknown;
		/** OAuthTokens */
		tokens?: unknown;
		/** OAuthDiscoveryState — persisted discovery results */
		discovery?: unknown;
	};
}

export interface McpAuthFile {
	servers: Record<string, McpAuthServerEntry>;
}

export function authFilePath(): string {
	return path.join(getAgentDir(), "council", "mcp-auth.json");
}

export function loadAuth(file: string = authFilePath()): McpAuthFile {
	if (!fs.existsSync(file)) return { servers: {} };
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { servers: {} };
		return { servers: (parsed as McpAuthFile).servers ?? {} };
	} catch {
		return { servers: {} };
	}
}

/** Atomic write (temp file + rename) at mode 0600. Parent + concurrent seats may refresh. */
export function saveAuth(auth: McpAuthFile, file: string = authFilePath()): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	fs.writeFileSync(tmp, JSON.stringify(auth, null, 2) + "\n", { mode: 0o600 });
	fs.renameSync(tmp, file);
}

export function clearServerSecrets(serverName: string, file: string = authFilePath()): boolean {
	const auth = loadAuth(file);
	if (!(serverName in auth.servers)) return false;
	delete auth.servers[serverName];
	saveAuth(auth, file);
	return true;
}
```

- [ ] **Step 4: Run tests**

Run: `bun test test/mcp/auth-store.test.ts`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(mcp): auth store — user-global secrets, atomic 0600 writes"
```

---

### Task 4: JSON Schema → TypeBox converter

**Files:**
- Create: `extensions/mcp/schema.ts`
- Test: `test/mcp/schema.test.ts`

**Interfaces:**
- Produces: `jsonSchemaToTypebox(schema: unknown): TSchema` — permissive by design; pi needs a TypeBox schema to advertise the tool, the MCP server remains the authoritative argument validator. Unrecognized shapes → `Type.Any()`; single-element unions collapse to their element (TypeBox requires ≥2 union members).

- [ ] **Step 1: Write the failing test**

Create `test/mcp/schema.test.ts`:

```ts
import { test, expect } from "bun:test";
import { jsonSchemaToTypebox } from "../../extensions/mcp/schema.ts";

test("object with typed properties", () => {
	const s = jsonSchemaToTypebox({
		type: "object",
		properties: { q: { type: "string" }, limit: { type: "integer" } },
		required: ["q"],
	}) as Record<string, unknown>;
	expect((s as any).type).toBe("object");
	expect(Object.keys((s as any).properties)).toEqual(["q", "limit"]);
});

test("object declared only via properties (common MCP quirk)", () => {
	const s = jsonSchemaToTypebox({ properties: { a: { type: "number" } } }) as Record<string, unknown>;
	expect((s as any).type).toBe("object");
});

test("array of strings", () => {
	const s = jsonSchemaToTypebox({ type: "array", items: { type: "string" } }) as Record<string, unknown>;
	expect((s as any).type).toBe("array");
});

test("enum becomes a union of literals", () => {
	const s = jsonSchemaToTypebox({ enum: ["a", "b"] }) as Record<string, unknown>;
	expect((s as any).anyOf?.length).toBe(2);
});

test("single-element union collapses", () => {
	const s = jsonSchemaToTypebox({ oneOf: [{ type: "string" }] }) as Record<string, unknown>;
	expect((s as any).type).toBe("string");
});

test("unrecognized schema degrades to Any, not a crash", () => {
	expect((jsonSchemaToTypebox(null) as any)[Symbol.for("TypeBox.Kind")]).toBe("Any");
	expect((jsonSchemaToTypebox({ type: "weird" }) as any)[Symbol.for("TypeBox.Kind")]).toBe("Any");
	expect((jsonSchemaToTypebox({}) as any)[Symbol.for("TypeBox.Kind")]).toBe("Any");
});

test("nullable via type array", () => {
	const s = jsonSchemaToTypebox({ type: ["string", "null"] }) as Record<string, unknown>;
	expect((s as any).anyOf?.length).toBe(2);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/mcp/schema.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `extensions/mcp/schema.ts`**

```ts
import { Type, type TSchema } from "typebox";

/**
 * Convert an MCP tool's JSON Schema into TypeBox for pi.registerTool.
 * Deliberately permissive: pi only needs a schema to advertise the tool to the
 * model; the MCP server remains the authoritative argument validator.
 * Anything unrecognized degrades to Type.Any() rather than failing the bridge.
 */
export function jsonSchemaToTypebox(schema: unknown): TSchema {
	if (!schema || typeof schema !== "object" || Array.isArray(schema)) return Type.Any();
	const s = schema as Record<string, unknown>;
	if (Array.isArray(s.type)) {
		const variants = (s.type as string[]).map((t) => jsonSchemaToTypebox({ ...s, type: t }));
		return unionOrAny(variants);
	}
	if (Array.isArray(s.enum) && s.enum.length > 0) {
		return unionOrAny(s.enum.map((v) => Type.Literal(v as string | number | boolean)));
	}
	if (Array.isArray(s.oneOf)) return unionOrAny(s.oneOf.map((sub) => jsonSchemaToTypebox(sub)));
	if (Array.isArray(s.anyOf)) return unionOrAny(s.anyOf.map((sub) => jsonSchemaToTypebox(sub)));
	switch (s.type) {
		case "object": {
			const props: Record<string, TSchema> = {};
			for (const [k, v] of Object.entries((s.properties ?? {}) as Record<string, unknown>)) {
				props[k] = jsonSchemaToTypebox(v);
			}
			return Type.Object(props);
		}
		case "array":
			return Type.Array(jsonSchemaToTypebox(s.items ?? {}));
		case "string":
			return Type.String();
		case "number":
			return Type.Number();
		case "integer":
			return Type.Integer();
		case "boolean":
			return Type.Boolean();
		case "null":
			return Type.Null();
		default:
			// Servers often omit type:"object" but still ship properties.
			if (s.properties) return jsonSchemaToTypebox({ ...s, type: "object" });
			return Type.Any();
	}
}

/** TypeBox unions require ≥2 members; collapse a single element. */
function unionOrAny(variants: TSchema[]): TSchema {
	if (variants.length === 0) return Type.Any();
	if (variants.length === 1) return variants[0]!;
	return Type.Union(variants);
}
```

- [ ] **Step 4: Run tests**

Run: `bun test test/mcp/schema.test.ts`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(mcp): JSON Schema to TypeBox converter"
```
---

### Task 5: McpManager + fixture servers

**Files:**
- Create: `extensions/mcp/client.ts`
- Create: `test/mcp/fixture-stdio-server.ts` (spawned stdio MCP server)
- Create: `test/mcp/fixture-http.ts` (in-process Streamable HTTP fixture with optional header guard)
- Test: `test/mcp/client.test.ts`

**Interfaces:**
- Produces (from `client.ts`):
  - `type ServerStatus = "disabled" | "unauthenticated" | "connected" | "error" | "reauth-required"`
  - `interface McpToolInfo { name: string; description?: string; inputSchema?: unknown }`
  - `interface McpServerRuntime { name; client; transport; tools: McpToolInfo[]; status: ServerStatus; error?: string }`
  - `class McpManager` with:
    - `constructor(opts?: { secrets?: (name) => Record<string,string>; authProvider?: (name, cfg) => OAuthClientProvider | undefined })`
    - `connect(name, cfg): Promise<McpServerRuntime>` — errors captured in `status`, never thrown (except invalid config)
    - `get(name)`, `has(name)`, `listToolNames(name): string[]` (prefixed `mcp__<name>__`), `statuses()`
    - `call(name, toolName, args): Promise<string>` — returns text; on `UnauthorizedError` sets `status="reauth-required"` and throws `MCP server "<name>" requires reauthentication — run /mcp login <name>.`
    - `close(name)`, `closeAll()`
- Consumes: `McpServerConfig`, `resolveHeaders` from config.ts.

- [ ] **Step 1: Write the fixture stdio server**

Create `test/mcp/fixture-stdio-server.ts`:

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";

const server = new McpServer({ name: "fixture-stdio", version: "1.0.0" });
server.registerTool(
	"echo",
	{ description: "Echo back the message", inputSchema: { message: z.string() } },
	async ({ message }) => ({ content: [{ type: "text", text: `echo: ${message}` }] }),
);
server.registerTool(
	"add",
	{ description: "Add two numbers", inputSchema: { a: z.number(), b: z.number() } },
	async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] }),
);
await server.connect(new StdioServerTransport());
```

- [ ] **Step 2: Write the fixture HTTP helper**

Create `test/mcp/fixture-http.ts`:

```ts
import * as http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { z } from "zod";

export interface HttpFixture {
	url: string;
	close(): Promise<void>;
}

/**
 * Streamable HTTP MCP server on an ephemeral 127.0.0.1 port.
 * `requiredHeader` guards requests with an X-Fix-Key check (401 otherwise).
 */
export async function startFixtureHttpServer(requiredHeader?: string): Promise<HttpFixture> {
	const mcp = new McpServer({ name: "fixture-http", version: "1.0.0" });
	mcp.registerTool(
		"echo",
		{ description: "Echo back the message", inputSchema: { message: z.string() } },
		async ({ message }) => ({ content: [{ type: "text", text: `echo: ${message}` }] }),
	);
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
	await mcp.connect(transport);
	const httpServer = http.createServer(async (req, res) => {
		if (requiredHeader && req.headers["x-fix-key"] !== requiredHeader) {
			res.writeHead(401, { "Content-Type": "text/plain" });
			res.end("missing X-Fix-Key");
			return;
		}
		await transport.handleRequest(req, res);
	});
	await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
	const port = (httpServer.address() as { port: number }).port;
	return {
		url: `http://127.0.0.1:${port}/mcp`,
		close: () => new Promise<void>((resolve) => httpServer.close(() => resolve())),
	};
}
```

- [ ] **Step 3: Write the failing test**

Create `test/mcp/client.test.ts`:

```ts
import { test, expect, afterAll } from "bun:test";
import * as path from "node:path";
import { McpManager } from "../../extensions/mcp/client.ts";
import { startFixtureHttpServer } from "./fixture-http.ts";

const STUB = path.join(import.meta.dir, "fixture-stdio-server.ts");
const cleanups: Array<() => Promise<void>> = [];
afterAll(async () => {
	for (const c of cleanups) await c();
});

test("stdio: connect, list tools, call, close", async () => {
	const mgr = new McpManager();
	const rt = await mgr.connect("fix", { command: "bun", args: ["run", STUB], auth: "none" });
	expect(rt.status).toBe("connected");
	expect(rt.tools.map((t) => t.name).sort()).toEqual(["add", "echo"]);
	expect(mgr.listToolNames("fix").sort()).toEqual(["mcp__fix__add", "mcp__fix__echo"]);
	expect(await mgr.call("fix", "echo", { message: "hi" })).toBe("echo: hi");
	expect(await mgr.call("fix", "add", { a: 2, b: 3 })).toBe("5");
	await mgr.close("fix");
});

test("http: connect and call without auth", async () => {
	const fx = await startFixtureHttpServer();
	cleanups.push(fx.close);
	const mgr = new McpManager();
	const rt = await mgr.connect("web", { url: fx.url, auth: "none" });
	expect(rt.status).toBe("connected");
	expect(await mgr.call("web", "echo", { message: "hello" })).toBe("echo: hello");
	await mgr.closeAll();
});

test("http header auth: env-resolved header authenticates", async () => {
	const fx = await startFixtureHttpServer("sekret");
	cleanups.push(fx.close);
	process.env.FIX_MCP_KEY = "sekret";
	const mgr = new McpManager();
	const rt = await mgr.connect("web2", {
		url: fx.url,
		auth: "header",
		headers: { "X-Fix-Key": "$FIX_MCP_KEY" },
	});
	expect(rt.status).toBe("connected");
	expect(await mgr.call("web2", "echo", { message: "authed" })).toBe("echo: authed");
	delete process.env.FIX_MCP_KEY;
	await mgr.closeAll();
});

test("http header auth: wrong key reports error status", async () => {
	const fx = await startFixtureHttpServer("sekret");
	cleanups.push(fx.close);
	const mgr = new McpManager();
	const rt = await mgr.connect("web3", {
		url: fx.url,
		auth: "header",
		headers: { "X-Fix-Key": "wrong" },
	});
	expect(rt.status).toBe("error");
	expect(rt.error).toBeTruthy();
});

test("statuses reports runtime state and tool counts", async () => {
	const mgr = new McpManager();
	await mgr.connect("s1", { command: "bun", args: ["run", STUB], auth: "none" });
	const st = mgr.statuses();
	expect(st.s1?.status).toBe("connected");
	expect(st.s1?.toolCount).toBe(2);
	await mgr.closeAll();
});
```

- [ ] **Step 4: Run to verify failure**

Run: `bun test test/mcp/client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `extensions/mcp/client.ts`**

```ts
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";
import { UnauthorizedError, type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth";
import { resolveHeaders, type McpServerConfig } from "./config.ts";

export type ServerStatus = "disabled" | "unauthenticated" | "connected" | "error" | "reauth-required";

export interface McpToolInfo {
	name: string;
	description?: string;
	inputSchema?: unknown;
}

export interface McpServerRuntime {
	name: string;
	client: Client;
	transport: StreamableHTTPClientTransport | StdioClientTransport;
	tools: McpToolInfo[];
	status: ServerStatus;
	error?: string;
}

export interface McpManagerOptions {
	/** Stored header secrets for a server (from the user-global auth store). */
	secrets?: (serverName: string) => Record<string, string>;
	/** Provider factory for oauth-mode servers. */
	authProvider?: (serverName: string, config: McpServerConfig) => OAuthClientProvider | undefined;
}

const CLIENT_INFO = { name: "pi-council", version: "0.2.0" };

function formatToolResult(result: {
	content?: Array<{ type: string; text?: string }>;
	isError?: boolean;
}): string {
	const parts: string[] = [];
	for (const part of result.content ?? []) {
		if (part.type === "text" && typeof part.text === "string") parts.push(part.text);
		else parts.push(JSON.stringify(part));
	}
	const body = parts.join("\n") || "(empty result)";
	return result.isError ? `MCP tool error: ${body}` : body;
}

export class McpManager {
	private runtimes = new Map<string, McpServerRuntime>();

	constructor(private opts: McpManagerOptions = {}) {}

	has(name: string): boolean {
		return this.runtimes.has(name);
	}

	get(name: string): McpServerRuntime | undefined {
		return this.runtimes.get(name);
	}

	/**
	 * Connect and enumerate tools. Connection failures are captured in
	 * `status` (unauthenticated | error), never thrown — a dead server must
	 * not block session startup. Invalid config (neither url nor command) throws.
	 */
	async connect(name: string, cfg: McpServerConfig): Promise<McpServerRuntime> {
		const authProvider = cfg.auth === "oauth" ? this.opts.authProvider?.(name, cfg) : undefined;
		let transport: StreamableHTTPClientTransport | StdioClientTransport;
		if (cfg.url) {
			const headers = cfg.auth === "header" ? resolveHeaders(cfg, this.opts.secrets?.(name) ?? {}) : undefined;
			transport = new StreamableHTTPClientTransport(new URL(cfg.url), {
				authProvider,
				requestInit: headers ? { headers } : undefined,
			});
		} else if (cfg.command) {
			transport = new StdioClientTransport({ command: cfg.command, args: cfg.args ?? [] });
		} else {
			throw new Error(`MCP server "${name}" has neither url nor command`);
		}
		const client = new Client(CLIENT_INFO, { capabilities: {} });
		const runtime: McpServerRuntime = { name, client, transport, tools: [], status: "connected" };
		this.runtimes.set(name, runtime);
		try {
			await client.connect(transport);
			const { tools } = await client.listTools();
			runtime.tools = tools.map((t) => ({
				name: t.name,
				description: t.description,
				inputSchema: t.inputSchema,
			}));
		} catch (e) {
			runtime.status = e instanceof UnauthorizedError ? "unauthenticated" : "error";
			runtime.error = e instanceof Error ? e.message : String(e);
		}
		return runtime;
	}

	listToolNames(name: string): string[] {
		return this.runtimes.get(name)?.tools.map((t) => `mcp__${name}__${t.name}`) ?? [];
	}

	/** Structured reauth sentinel on auth failure; MCP-side tool errors surface as text. */
	async call(name: string, toolName: string, args: Record<string, unknown>): Promise<string> {
		const runtime = this.runtimes.get(name);
		if (!runtime) throw new Error(`MCP server "${name}" is not connected`);
		try {
			const result = await runtime.client.callTool({ name: toolName, arguments: args });
			return formatToolResult(result);
		} catch (e) {
			if (e instanceof UnauthorizedError) {
				runtime.status = "reauth-required";
				runtime.error = e.message;
				throw new Error(`MCP server "${name}" requires reauthentication — run /mcp login ${name}.`);
			}
			throw e;
		}
	}

	statuses(): Record<string, { status: ServerStatus; toolCount: number; error?: string }> {
		const out: Record<string, { status: ServerStatus; toolCount: number; error?: string }> = {};
		for (const [name, rt] of this.runtimes) {
			out[name] = { status: rt.status, toolCount: rt.tools.length, error: rt.error };
		}
		return out;
	}

	async close(name: string): Promise<void> {
		const runtime = this.runtimes.get(name);
		if (!runtime) return;
		this.runtimes.delete(name);
		try {
			await runtime.client.close();
		} catch {
			/* best effort */
		}
	}

	async closeAll(): Promise<void> {
		await Promise.all([...this.runtimes.keys()].map((n) => this.close(n)));
	}
}
```

- [ ] **Step 6: Run tests**

Run: `bun test test/mcp/client.test.ts`
Expected: 5 PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(mcp): McpManager with stdio/http transports, header auth, reauth sentinel"
```
---

### Task 6: Seat grants (`mcp:` field) + child eager registration

**Files:**
- Create: `extensions/mcp/index.ts` (wiring module: manager singleton, tool registration, seat startup)
- Modify: `extensions/seats.ts` (Seat.mcp field, buildChildArgv param)
- Modify: `extensions/child.ts` (isCallAllowed gating, startup hook)
- Test: extend `test/seats.test.ts`, `test/child.test.ts`

**Interfaces:**
- Produces (from `mcp/index.ts`):
  - `getMcpManager(repoRoot): McpManager` — process singleton, secrets wired to the auth store
  - `registerServerTools(pi, manager, serverName, runtime): void`
  - `startSeatMcp(pi, repoRoot, seat): Promise<void>` — connects granted+enabled servers, registers their tools
- `Seat.mcp: string[]` joins `tools`/`spawns`; `buildChildArgv(seat, input, promptFile, mcpTools = [])`.

- [ ] **Step 1: Write failing tests**

Append to `test/seats.test.ts`:

```ts
test("mcp frontmatter field parses as list", () => {
	const seat = parseSeatFile(
		`---\nname: x\ndescription: d\nmodel: m\nmcp: [a, b]\n---\nbody`,
		"x.md",
	);
	expect(seat.mcp).toEqual(["a", "b"]);
});

test("seats without mcp field default to no MCP access", () => {
	expect(loadSeat(tmpRepo(), "owner").mcp).toEqual([]);
});

test("buildChildArgv appends granted mcp tool names to --tools", () => {
	const owner = loadSeat(tmpRepo(), "owner");
	const argv = buildChildArgv(owner, "go", "/tmp/p.md", ["mcp__context7__search", "mcp__context7__docs"]);
	expect(argv).toContain("read,bash,edit,write,grep,find,ls,mcp__context7__search,mcp__context7__docs");
});
```

Append to `test/child.test.ts` (needs `fs`/`os`/`path` imports already present or added):

```ts
test("mcp grants: granted server's tools allowed, others blocked", () => {
	const dir = path.join(root, ".pi", "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, "mcpseat.md"),
		"---\nname: mcpseat\ndescription: d\nmodel: openrouter/test/m\ntools: Read\nmcp: [context7]\n---\nbody",
	);
	const s = loadSeat(root, "mcpseat");
	expect(s.mcp).toEqual(["context7"]);
	expect(isCallAllowed(s, "mcp__context7__resolve-library-id")).toBe(true);
	expect(isCallAllowed(s, "mcp__other__tool")).toBe(false);
	expect(isCallAllowed(s, "read")).toBe(true);
});

test("seat without mcp field gets zero MCP access", () => {
	const j = loadSeat(root, "judge");
	expect(j.mcp).toEqual([]);
	expect(isCallAllowed(j, "mcp__context7__search")).toBe(false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/seats.test.ts test/child.test.ts`
Expected: new tests FAIL (`mcp` undefined, module/field missing).

- [ ] **Step 3: Implement `extensions/mcp/index.ts`**

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadMcpConfig, validateEntry } from "./config.ts";
import { loadAuth } from "./auth-store.ts";
import { McpManager, type McpServerRuntime } from "./client.ts";
import { jsonSchemaToTypebox } from "./schema.ts";
import type { Seat } from "../seats.ts";

let managerSingleton: McpManager | null = null;

/**
 * Process-wide manager. In child mode COUNCIL_SEAT selects the seat; in parent
 * mode the same instance serves session_start connections and dispatch lookups.
 */
export function getMcpManager(_repoRoot: string): McpManager {
	if (!managerSingleton) {
		managerSingleton = new McpManager({
			secrets: (name) => loadAuth().servers[name]?.headers ?? {},
		});
	}
	return managerSingleton;
}

/** Register one connected server's tools as pi tools under mcp__<server>__<tool>. */
export function registerServerTools(
	pi: ExtensionAPI,
	manager: McpManager,
	serverName: string,
	runtime: McpServerRuntime,
): void {
	for (const tool of runtime.tools) {
		const fullName = `mcp__${serverName}__${tool.name}`;
		pi.registerTool({
			name: fullName,
			label: `MCP ${serverName}/${tool.name}`,
			description: tool.description ?? `MCP tool "${tool.name}" from server "${serverName}".`,
			parameters: jsonSchemaToTypebox(tool.inputSchema),
			async execute(_id, params) {
				const args = (params ?? {}) as Record<string, unknown>;
				try {
					const text = await manager.call(serverName, tool.name, args);
					return { content: [{ type: "text", text }], details: {}, isError: false };
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					return { content: [{ type: "text", text: message }], details: {}, isError: true };
				}
			},
		});
	}
}

/**
 * Seat startup: connect eagerly to granted, enabled servers and register their
 * tools. pi's tool refresh re-activates registered tools whose exact names were
 * in the child's --tools allowlist, so registration after session start is safe.
 */
export async function startSeatMcp(pi: ExtensionAPI, repoRoot: string, seat: Seat): Promise<void> {
	if ((seat.mcp ?? []).length === 0) return;
	const cfg = loadMcpConfig(repoRoot);
	const manager = getMcpManager(repoRoot);
	for (const name of seat.mcp ?? []) {
		const serverCfg = cfg.servers[name];
		if (!serverCfg || serverCfg.enabled === false) continue;
		if (validateEntry(name, serverCfg).length > 0) continue;
		const runtime = await manager.connect(name, serverCfg);
		if (runtime.status === "connected") registerServerTools(pi, manager, name, runtime);
	}
}
```

- [ ] **Step 4: Modify `extensions/seats.ts`**

Edit 1 — Seat interface:
oldText:
```ts
	tools: string[];
	spawns: string[];
	body: string;
}
```
newText:
```ts
	tools: string[];
	spawns: string[];
	mcp: string[];
	body: string;
}
```

Edit 2 — parseSeatFile return:
oldText:
```ts
		spawns: fields.spawns ? parseList(fields.spawns) : [],
		body: body.trim(),
```
newText:
```ts
		spawns: fields.spawns ? parseList(fields.spawns) : [],
		mcp: fields.mcp ? parseList(fields.mcp) : [],
		body: body.trim(),
```

Edit 3 — buildChildArgv:
oldText:
```ts
export function buildChildArgv(seat: Seat, input: string, promptFile: string): string[] {
	// -a: trust project-local files — the child runs headless in the same repo
	// the (already-trusted) parent dispatched from, so project extensions load.
	const argv = ["--mode", "json", "-p", "-a", "--no-session", "--model", seat.model];
	if (seat.thinkingLevel) argv.push("--thinking", seat.thinkingLevel);
	argv.push("--tools", builtinToolsFor(seat).join(","));
```
newText:
```ts
export function buildChildArgv(seat: Seat, input: string, promptFile: string, mcpTools: string[] = []): string[] {
	// -a: trust project-local files — the child runs headless in the same repo
	// the (already-trusted) parent dispatched from, so project extensions load.
	// --tools is an exact-name allowlist: granted MCP tool names are enumerated
	// here so the model can see and call them after the child registers them.
	const argv = ["--mode", "json", "-p", "-a", "--no-session", "--model", seat.model];
	if (seat.thinkingLevel) argv.push("--thinking", seat.thinkingLevel);
	argv.push("--tools", [...builtinToolsFor(seat), ...mcpTools].join(","));
```

- [ ] **Step 5: Modify `extensions/child.ts`**

Edit 1 — import + startup hook in runChildMode:
oldText:
```ts
import { builtinToolsFor, grantsFor, loadSeat, type Seat } from "./seats.ts";
import { registerHubTools } from "./hub-tools.ts";
```
newText:
```ts
import { builtinToolsFor, grantsFor, loadSeat, type Seat } from "./seats.ts";
import { registerHubTools } from "./hub-tools.ts";
import { startSeatMcp } from "./mcp/index.ts";
```

Edit 2 — runChildMode body:
oldText:
```ts
	if (grantsFor(seat).hub) {
		registerHubTools(pi, repoRoot, { allowedSeats: seat.spawns });
	}
	pi.on("tool_call", (event) => {
```
newText:
```ts
	if (grantsFor(seat).hub) {
		registerHubTools(pi, repoRoot, { allowedSeats: seat.spawns });
	}
	// Eager: MCP tools must be registered (and thus advertised) for the seat to
	// ever call them. Registration happens async; names are already in --tools.
	void startSeatMcp(pi, repoRoot, seat);
	pi.on("tool_call", (event) => {
```

Edit 3 — isCallAllowed:
oldText:
```ts
	if (g.hub) {
		allowed.add("council_dispatch");
		allowed.add("council_wait");
		allowed.add("council_cancel");
	}
	return allowed.has(toolName);
```
newText:
```ts
	if (g.hub) {
		allowed.add("council_dispatch");
		allowed.add("council_wait");
		allowed.add("council_cancel");
	}
	if (allowed.has(toolName)) return true;
	if (toolName.startsWith("mcp__")) {
		const server = toolName.slice("mcp__".length).split("__")[0];
		return (seat.mcp ?? []).includes(server);
	}
	return false;
```

- [ ] **Step 6: Run tests**

Run: `bun test test/seats.test.ts test/child.test.ts && bunx tsc --noEmit`
Expected: all PASS, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(mcp): seat grants — mcp field, sandbox gating, eager child registration"
```

---

### Task 7: Dispatch integration — argv carries MCP tool names

**Files:**
- Modify: `extensions/hub-tools.ts`
- Test: `test/mcp/dispatch.test.ts`

**Interfaces:**
- Consumes: `getMcpManager` from `mcp/index.ts`; `buildChildArgv(seat, input, promptFile, mcpTools)`.
- Produces: `council_dispatch` enumerates every granted server's tools in the child argv and warns when a granted server is not connected.

- [ ] **Step 1: Write the failing test**

Create `test/mcp/dispatch.test.ts`:

```ts
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getMcpManager } from "../../extensions/mcp/index.ts";
import { buildChildArgv, parseSeatFile } from "../../extensions/seats.ts";
import { startFixtureHttpServer } from "./fixture-http.ts";

test("dispatch path: connected granted server contributes tool names to argv", async () => {
	const fx = await startFixtureHttpServer();
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-dispatch-"));
	const mgr = getMcpManager(root);
	await mgr.connect("fix", { url: fx.url, auth: "none" });
	expect(mgr.listToolNames("fix").sort()).toEqual(["mcp__fix__echo"]);
	const seat = parseSeatFile(
		"---\nname: x\ndescription: d\nmodel: m\ntools: Read\nmcp: [fix]\n---\nbody",
		"x.md",
	);
	const argv = buildChildArgv(seat, "go", "/tmp/p.md", mgr.listToolNames("fix"));
	expect(argv).toContain("read,mcp__fix__echo");
	await mgr.close("fix");
	await fx.close();
});

test("dispatch path: unknown granted server yields zero names (warn path)", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-dispatch2-"));
	expect(getMcpManager(root).listToolNames("never-connected")).toEqual([]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/mcp/dispatch.test.ts`
Expected: first test FAILS (hub-tools doesn't pass names yet is not what this unit test covers — it covers the pieces; if it passes because the pieces already exist, fold it into the commit of the hub-tools edit below after step 3).

- [ ] **Step 3: Modify `extensions/hub-tools.ts`**

Edit 1 — import:
oldText: `import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "./seats.ts";`
newText:
```ts
import { buildChildArgv, buildSystemPrompt, loadSeat, proceduresDir } from "./seats.ts";
import { getMcpManager } from "./mcp/index.ts";
```

Edit 2 — argv assembly + warnings, inserted before the tmpdir allocation:
oldText:
```ts
			const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-"));
```
newText:
```ts
			// --tools is an exact-name allowlist: enumerate granted MCP tools here.
			// Servers the parent could not connect contribute nothing → warn.
			const mcpToolNames: string[] = [];
			const mcpWarnings: string[] = [];
			for (const server of seat.mcp ?? []) {
				const names = getMcpManager(repoRoot).listToolNames(server);
				if (names.length === 0) {
					mcpWarnings.push(
						`seat grants MCP server "${server}" but it is not connected — its tools are unavailable for this dispatch`,
					);
				}
				mcpToolNames.push(...names);
			}
			const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "council-"));
```

Edit 3 — pass names to argv:
oldText: `args: buildChildArgv(seat, params.input, promptFile),`
newText: `args: buildChildArgv(seat, params.input, promptFile, mcpToolNames),`

Edit 4 — surface warnings in the dispatch reply:
oldText:
```ts
						text: `Dispatched ${seat.name} as ${job.id} (pid ${job.pid}). Use council_wait to collect.`,
```
newText:
```ts
						text:
							`Dispatched ${seat.name} as ${job.id} (pid ${job.pid}). Use council_wait to collect.` +
							(mcpWarnings.length > 0 ? `\n⚠ ${mcpWarnings.join("\n⚠ ")}` : ""),
```

- [ ] **Step 4: Run tests**

Run: `bun test test/mcp/dispatch.test.ts && bunx tsc --noEmit`
Expected: PASS, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(mcp): dispatch enumerates granted MCP tools in seat argv"
```
---

### Task 8: OAuth — provider, callback listener, login flow

**Files:**
- Create: `extensions/mcp/oauth.ts`
- Create: `test/mcp/fixture-oauth.ts` (stub authorization server + protected MCP server)
- Test: `test/mcp/oauth.test.ts`

**Interfaces:**
- Produces:
  - `openBrowser(url)` — best-effort system browser
  - `startCallbackListener(): Promise<CallbackListener>` — 127.0.0.1 loopback, OS-assigned port, captures `/callback?code=`
  - `class CouncilOAuthProvider implements OAuthClientProvider` — store-backed (auth-store), PKCE verifier in memory, discovery state persisted; constructor `(serverName, redirectUri, opts?: { openUrl?, onInvalidate? })`
  - `loginOAuth(repoRoot, name, opts?): Promise<string>` — two-phase `auth()` orchestration; resolves `Authenticated to "<name>".`
- Consumes: `auth`, `UnauthorizedError` from SDK `client/auth`; shared auth types from `shared/auth`; config + auth-store modules.
- Test isolation: tests set `process.env.PI_CODING_AGENT_DIR` to a tmp dir so the auth store never touches the real `~/.pi/agent` (`getAgentDir()` honors `PI_CODING_AGENT_DIR`).

- [ ] **Step 1: Write the OAuth fixture (stub AS + protected server)**

Create `test/mcp/fixture-oauth.ts`:

```ts
import * as http from "node:http";
import * as crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { z } from "zod";

function s256(verifier: string): string {
	return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export interface OAuthFixture {
	serverUrl: string; // protected MCP endpoint
	asUrl: string; // authorization server base
	close(): Promise<void>;
}

/**
 * Stub authorization server (RFC 8414 metadata, DCR, PKCE-validating token
 * endpoint) plus a protected Streamable HTTP MCP server requiring Bearer
 * tokens minted by the AS. The /authorize endpoint sets the PKCE challenge
 * and 302-redirects back to the client's redirect_uri with code=test-code —
 * tests fetch the authorization URL and let fetch follow the redirect.
 */
export async function startOAuthFixture(): Promise<OAuthFixture> {
	let codeChallenge = "";

	const as = http.createServer((req, res) => {
		const url = new URL(req.url ?? "/", "http://127.0.0.1");
		const send = (status: number, body: unknown) => {
			res.writeHead(status, { "Content-Type": "application/json" });
			res.end(JSON.stringify(body));
		};
		if (req.method === "GET" && url.pathname === "/authorize") {
			codeChallenge = url.searchParams.get("code_challenge") ?? "";
			const redirectUri = url.searchParams.get("redirect_uri") ?? "";
			const state = url.searchParams.get("state") ?? "";
			res.writeHead(302, { Location: `${redirectUri}?code=test-code&state=${encodeURIComponent(state)}` });
			res.end();
			return;
		}
		if (req.method === "GET" && url.pathname === "/.well-known/oauth-authorization-server") {
			send(200, {
				issuer: url.origin,
				authorization_endpoint: `${url.origin}/authorize`,
				token_endpoint: `${url.origin}/token`,
				registration_endpoint: `${url.origin}/register`,
				response_types_supported: ["code"],
				grant_types_supported: ["authorization_code", "refresh_token"],
				code_challenge_methods_supported: ["S256"],
				token_endpoint_auth_methods_supported: ["none"],
			});
			return;
		}
		if (req.method === "POST" && url.pathname === "/register") {
			send(201, { client_id: "test-client-id", redirect_uris: [] });
			return;
		}
		if (req.method === "POST" && url.pathname === "/token") {
			let body = "";
			req.on("data", (c) => (body += c));
			req.on("end", () => {
				const params = new URLSearchParams(body);
				const grant = params.get("grant_type");
				if (grant === "authorization_code") {
					const verifier = params.get("code_verifier") ?? "";
					if (params.get("code") !== "test-code" || s256(verifier) !== codeChallenge) {
						send(400, { error: "invalid_grant" });
						return;
					}
					send(200, { access_token: "acc-1", token_type: "Bearer", expires_in: 3600, refresh_token: "ref-1" });
				} else if (grant === "refresh_token") {
					if (params.get("refresh_token") !== "ref-1") {
						send(400, { error: "invalid_grant" });
						return;
					}
					send(200, { access_token: "acc-2", token_type: "Bearer", expires_in: 3600, refresh_token: "ref-2" });
				} else {
					send(400, { error: "unsupported_grant_type" });
				}
			});
			return;
		}
		send(404, { error: "not_found" });
	});
	await new Promise<void>((r) => as.listen(0, "127.0.0.1", r));
	const asPort = (as.address() as { port: number }).port;
	const asUrl = `http://127.0.0.1:${asPort}`;

	const mcp = new McpServer({ name: "fixture-oauth", version: "1.0.0" });
	mcp.registerTool(
		"echo",
		{ description: "Echo back the message", inputSchema: { message: z.string() } },
		async ({ message }) => ({ content: [{ type: "text", text: `echo: ${message}` }] }),
	);
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
	await mcp.connect(transport);

	const protectedServer = http.createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", "http://127.0.0.1");
		if (req.method === "GET" && url.pathname === "/.well-known/oauth-protected-resource") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ resource: url.origin, authorization_servers: [asUrl] }));
			return;
		}
		const bearer = req.headers.authorization ?? "";
		if (!bearer.startsWith("Bearer acc-")) {
			res.writeHead(401, {
				"WWW-Authenticate": `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource"`,
			});
			res.end("unauthorized");
			return;
		}
		await transport.handleRequest(req, res);
	});
	await new Promise<void>((r) => protectedServer.listen(0, "127.0.0.1", r));
	const serverPort = (protectedServer.address() as { port: number }).port;

	return {
		serverUrl: `http://127.0.0.1:${serverPort}/mcp`,
		asUrl,
		close: async () => {
			await new Promise<void>((r) => protectedServer.close(() => r()));
			await new Promise<void>((r) => as.close(() => r()));
		},
	};
}
```

- [ ] **Step 2: Write the failing test**

Create `test/mcp/oauth.test.ts`:

```ts
import { test, expect, beforeAll } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loginOAuth, CouncilOAuthProvider } from "../../extensions/mcp/oauth.ts";
import { loadAuth, saveAuth, authFilePath } from "../../extensions/mcp/auth-store.ts";
import { saveMcpConfig, loadMcpConfig } from "../../extensions/mcp/config.ts";
import { McpManager } from "../../extensions/mcp/client.ts";
import { startOAuthFixture } from "./fixture-oauth.ts";

beforeAll(() => {
	process.env.PI_CODING_AGENT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "council-oauth-home-"));
});

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-oauth-repo-"));
}

test("loginOAuth: full flow against stub AS persists tokens", async () => {
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctx: { url: fx.serverUrl, auth: "oauth" } } });
	const result = await loginOAuth(root, "ctx", {
		openUrl: (url) => {
			void fetch(url); // follow 302 → loopback callback with code=test-code
		},
		callbackTimeoutMs: 15_000,
	});
	expect(result).toContain("Authenticated");
	expect((loadAuth().servers.ctx?.oauth?.tokens as { access_token?: string })?.access_token).toBe("acc-1");
	expect((loadAuth().servers.ctx?.oauth?.client as { client_id?: string })?.client_id).toBe("test-client-id");
	await fx.close();
}, 30_000);

test("authenticated connect + call; unauthenticated reports status", async () => {
	const fx = await startOAuthFixture();
	// (a) without tokens: unauthenticated
	const rootA = tmpRepo();
	saveMcpConfig(rootA, { servers: { ctxa: { url: fx.serverUrl, auth: "oauth" } } });
	const mgrA = new McpManager({
		authProvider: (name) => new CouncilOAuthProvider(name, "http://127.0.0.1:9/callback"),
	});
	const rtA = await mgrA.connect("ctxa", loadMcpConfig(rootA).servers.ctxa!);
	expect(rtA.status).toBe("unauthenticated");
	await mgrA.closeAll();

	// (b) with tokens from a login: connected, call works
	const rootB = tmpRepo();
	saveMcpConfig(rootB, { servers: { ctxb: { url: fx.serverUrl, auth: "oauth" } } });
	await loginOAuth(rootB, "ctxb", { openUrl: (url) => void fetch(url), callbackTimeoutMs: 15_000 });
	const mgrB = new McpManager({
		authProvider: (name) => new CouncilOAuthProvider(name, "http://127.0.0.1:9/callback"),
	});
	const rtB = await mgrB.connect("ctxb", loadMcpConfig(rootB).servers.ctxb!);
	expect(rtB.status).toBe("connected");
	expect(await mgrB.call("ctxb", "echo", { message: "authed" })).toBe("echo: authed");
	await mgrB.closeAll();
	await fx.close();
}, 45_000);

test("expired access + corrupt refresh → reauth-required sentinel", async () => {
	const fx = await startOAuthFixture();
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { ctxc: { url: fx.serverUrl, auth: "oauth" } } });
	saveAuth({
		servers: {
			ctxc: {
				oauth: {
					client: { client_id: "test-client-id" },
					tokens: { access_token: "expired", token_type: "Bearer", expires_in: 0, refresh_token: "corrupt" },
				},
			},
		},
	});
	const mgr = new McpManager({
		authProvider: (name) => new CouncilOAuthProvider(name, "http://127.0.0.1:9/callback"),
	});
	const rt = await mgr.connect("ctxc", loadMcpConfig(root).servers.ctxc!);
	expect(["unauthenticated", "reauth-required", "error"]).toContain(rt.status);
	await mgr.closeAll();
	await fx.close();
}, 30_000);
```

Note: the third test's status assertion tolerates SDK variations in how it surfaces failed refresh (UnauthorizedError at connect vs. at first request). If the SDK neither refreshes on expiry nor surfaces UnauthorizedError here, extend McpManager.connect to probe one `listTools` after connect — the probe is already done, so ensure the probe failure path maps `UnauthorizedError` → `reauth-required` when stored tokens exist and → `unauthenticated` when they don't (implement via a `hadTokens` flag passed to the provider or checked in the manager). Adjust the assertion to the exact observed behavior, but the sentinel message from `call()` must remain `MCP server "<name>" requires reauthentication — run /mcp login <name>.`

- [ ] **Step 3: Run to verify failure**

Run: `bun test test/mcp/oauth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `extensions/mcp/oauth.ts`**

```ts
import * as http from "node:http";
import { execFile } from "node:child_process";
import { auth, type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth";
import type {
	OAuthClientInformationMixed,
	OAuthDiscoveryState,
	OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth";
import { loadMcpConfig } from "./config.ts";
import { loadAuth, saveAuth, type McpAuthServerEntry } from "./auth-store.ts";

/** Best-effort system browser open (macOS/Linux/Windows). */
export function openBrowser(url: string): void {
	const [cmd, ...args] =
		process.platform === "darwin"
			? ["open", url]
			: process.platform === "win32"
				? ["cmd", "/c", "start", "", url]
				: ["xdg-open", url];
	execFile(cmd, args, () => {});
}

export interface CallbackListener {
	port: number;
	waitForCode(timeoutMs: number): Promise<string>;
	close(): void;
}

/** Ephemeral 127.0.0.1 loopback listener capturing /callback?code=… . */
export function startCallbackListener(): Promise<CallbackListener> {
	return new Promise((resolve) => {
		let waiting: { resolve: (code: string) => void; reject: (e: Error) => void } | null = null;
		const server = http.createServer((req, res) => {
			const url = new URL(req.url ?? "/", "http://127.0.0.1");
			if (url.pathname !== "/callback") {
				res.writeHead(404);
				res.end();
				return;
			}
			const code = url.searchParams.get("code");
			if (!code) {
				res.writeHead(400, { "Content-Type": "text/html" });
				res.end("Missing code");
				return;
			}
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end("<html><body><h2>Authorization received. Close this tab and return to pi.</h2></body></html>");
			waiting?.resolve(code);
		});
		server.listen(0, "127.0.0.1", () => {
			const port = (server.address() as { port: number }).port;
			resolve({
				port,
				waitForCode(timeoutMs: number): Promise<string> {
					return new Promise((res, rej) => {
						waiting = { resolve: res, reject: rej };
						const timer = setTimeout(() => rej(new Error("Timed out waiting for OAuth callback")), timeoutMs);
						timer.unref?.();
					});
				},
				close(): void {
					server.close();
				},
			});
		});
	});
}

export interface CouncilOAuthProviderOptions {
	/** Browser hook; tests inject a simulator. Default: openBrowser. */
	openUrl?: (url: string) => void;
	/** Invoked when credentials are invalidated (refresh failed etc.). */
	onInvalidate?: (error?: string) => void;
}

/**
 * OAuthClientProvider backed by the user-global auth store. The SDK handles
 * discovery, DCR, PKCE, token exchange and refresh; this class supplies
 * persistence, the browser hook, and the loopback redirect URI.
 */
export class CouncilOAuthProvider implements OAuthClientProvider {
	private verifier = "";
	private open: (url: string) => void;

	constructor(
		private serverName: string,
		private redirectUri: string,
		private opts: CouncilOAuthProviderOptions = {},
	) {
		this.open = opts.openUrl ?? openBrowser;
	}

	private entry(): NonNullable<McpAuthServerEntry["oauth"]> {
		return loadAuth().servers[this.serverName]?.oauth ?? {};
	}

	private patch(part: Partial<NonNullable<McpAuthServerEntry["oauth"]>>): void {
		const file = loadAuth();
		const entry = file.servers[this.serverName] ?? {};
		entry.oauth = { ...(entry.oauth ?? {}), ...part };
		file.servers[this.serverName] = entry;
		saveAuth(file);
	}

	get redirectUrl(): string {
		return this.redirectUri;
	}

	get clientMetadata() {
		return {
			redirect_uris: [this.redirectUri],
			client_name: "pi-council",
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			token_endpoint_auth_method: "none",
		};
	}

	async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
		return this.entry().client as OAuthClientInformationMixed | undefined;
	}

	async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
		this.patch({ client: info });
	}

	async tokens(): Promise<OAuthTokens | undefined> {
		return this.entry().tokens as OAuthTokens | undefined;
	}

	async saveTokens(tokens: OAuthTokens): Promise<void> {
		this.patch({ tokens });
	}

	async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
		this.open(authorizationUrl.toString());
	}

	async saveCodeVerifier(verifier: string): Promise<void> {
		this.verifier = verifier;
	}

	async codeVerifier(): Promise<string> {
		return this.verifier;
	}

	async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
		this.patch({ discovery: state });
	}

	async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
		return this.entry().discovery as OAuthDiscoveryState | undefined;
	}

	async invalidateCredentials(scope: "all" | "client" | "tokens" | "verifier" | "discovery"): Promise<void> {
		if (scope === "all") this.patch({ client: undefined, tokens: undefined, discovery: undefined });
		else if (scope === "client") this.patch({ client: undefined });
		else if (scope === "tokens") this.patch({ tokens: undefined });
		else if (scope === "discovery") this.patch({ discovery: undefined });
		this.opts.onInvalidate?.(`credentials invalidated (${scope})`);
	}
}

export interface LoginOAuthOptions extends CouncilOAuthProviderOptions {
	callbackTimeoutMs?: number;
}

/**
 * Interactive OAuth login: phase 1 auth() → REDIRECT (discovery + DCR +
 * authorization start, browser opens); phase 2 waits for the loopback code
 * then auth(code) → AUTHORIZED with tokens persisted.
 */
export async function loginOAuth(repoRoot: string, serverName: string, opts: LoginOAuthOptions = {}): Promise<string> {
	const cfg = loadMcpConfig(repoRoot).servers[serverName];
	if (!cfg) throw new Error(`Unknown MCP server "${serverName}".`);
	if (!cfg.url) throw new Error(`MCP server "${serverName}" is not a remote http server; OAuth requires "url".`);
	const listener = await startCallbackListener();
	const redirectUri = `http://127.0.0.1:${listener.port}/callback`;
	const provider = new CouncilOAuthProvider(serverName, redirectUri, opts);
	try {
		const first = await auth(provider, { serverUrl: cfg.url });
		if (first === "AUTHORIZED") return `Already authenticated to "${serverName}".`;
		const code = await listener.waitForCode(opts.callbackTimeoutMs ?? 5 * 60_000);
		const second = await auth(provider, { serverUrl: cfg.url, authorizationCode: code });
		if (second !== "AUTHORIZED") throw new Error("OAuth flow did not reach AUTHORIZED state.");
		return `Authenticated to "${serverName}".`;
	} finally {
		listener.close();
	}
}
```

- [ ] **Step 5: Run tests**

Run: `bun test test/mcp/oauth.test.ts`
Expected: 3 PASS (third per the note above — align the sentinel path with observed SDK behavior).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(mcp): OAuth provider, loopback callback listener, interactive login"
```
---

### Task 9: /mcp management commands + parent wiring

**Files:**
- Modify: `extensions/mcp/index.ts` (add `connectParentServers`, `registerMcpCommand`, `runMcpSubcommand`, oauth factory in manager)
- Modify: `extensions/index.ts` (session_start connect, /mcp registration, shutdown close)
- Test: `test/mcp/commands.test.ts`

**Interfaces:**
- Produces:
  - `connectParentServers(pi, repoRoot): Promise<string[]>` — connects enabled servers, registers tools, returns human-readable notes for failures
  - `registerMcpCommand(pi, repoRoot)` — `/mcp list | add <name> <url> [none|header|oauth] | add <name> -- <cmd> [args…] | remove <name> | status <name> | login <name> | logout <name>`
  - `runMcpSubcommand(repoRoot, sub, args, ctx): Promise<string>` — pure handler, exported for tests
- Tool-set changes for a live session require `/reload` (pi has no tool deregistration); every mutating command says so in its reply.

- [ ] **Step 1: Write the failing test**

Create `test/mcp/commands.test.ts`:

```ts
import { test, expect, beforeAll, afterAll } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runMcpSubcommand, connectParentServers, getMcpManager } from "../../extensions/mcp/index.ts";
import { loadMcpConfig, saveMcpConfig } from "../../extensions/mcp/config.ts";
import { loadAuth } from "../../extensions/mcp/auth-store.ts";
import { startFixtureHttpServer } from "./fixture-http.ts";

beforeAll(() => {
	process.env.PI_CODING_AGENT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-cmds-"));
});

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "council-mcp-cmds-repo-"));
}

test("add validates, writes config, rejects duplicates", async () => {
	const root = tmpRepo();
	const out = await runMcpSubcommand(root, "add", ["srv", "https://x.example/mcp", "oauth"], {} as never);
	expect(out).toContain("Registered");
	expect(loadMcpConfig(root).servers.srv?.auth).toBe("oauth");
	expect(await runMcpSubcommand(root, "add", ["srv", "https://y"], {} as never)).toContain("already exists");
});

test("add stdio via -- separator", async () => {
	const root = tmpRepo();
	const out = await runMcpSubcommand(root, "add", ["local", "--", "npx", "-y", "some-server"], {} as never);
	expect(out).toContain("Registered");
	const entry = loadMcpConfig(root).servers.local!;
	expect(entry.command).toBe("npx");
	expect(entry.args).toEqual(["-y", "some-server"]);
	expect(entry.auth).toBe("none");
});

test("add rejects entries that fail validation", async () => {
	const root = tmpRepo();
	const out = await runMcpSubcommand(root, "add", ["bad", "--"], {} as never);
	expect(out).not.toContain("Registered");
	expect(loadMcpConfig(root).servers.bad).toBeUndefined();
});

test("remove deletes the registration", async () => {
	const root = tmpRepo();
	await runMcpSubcommand(root, "add", ["gone", "https://x", "none"], {} as never);
	expect(loadMcpConfig(root).servers.gone).toBeDefined();
	expect(await runMcpSubcommand(root, "remove", ["gone"], {} as never)).toContain("Removed");
	expect(loadMcpConfig(root).servers.gone).toBeUndefined();
});

test("list reports servers; unknown subcommand prints usage", async () => {
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { a: { url: "https://x", auth: "none" } } });
	const out = await runMcpSubcommand(root, "list", [], {} as never);
	expect(out).toContain("a");
	expect(out).toContain("http");
	const usage = await runMcpSubcommand(root, "bogus", [], {} as never);
	expect(usage).toContain("Usage:");
});

test("connectParentServers registers tools and notes failures", async () => {
	const fx = await startFixtureHttpServer();
	const root = tmpRepo();
	saveMcpConfig(root, {
		servers: {
			good: { url: fx.url, auth: "none" },
			dead: { url: "http://127.0.0.1:1/mcp", auth: "none" },
		},
	});
	const registered: string[] = [];
	const pi = { registerTool: (t: { name: string }) => registered.push(t.name) } as never;
	const notes = await connectParentServers(pi, root);
	expect(registered).toContain("mcp__good__echo");
	expect(notes.join("\n")).toContain("dead");
	await getMcpManager(root).closeAll();
	await fx.close();
});

test("logout clears stored secrets", async () => {
	const root = tmpRepo();
	saveMcpConfig(root, { servers: { sec: { url: "https://x", auth: "header" } } });
	const authFile = path.join(process.env.PI_CODING_AGENT_DIR!, "council", "mcp-auth.json");
	fs.mkdirSync(path.dirname(authFile), { recursive: true });
	fs.writeFileSync(authFile, JSON.stringify({ servers: { sec: { headers: { Authorization: "Bearer x" } } } }));
	expect(await runMcpSubcommand(root, "logout", ["sec"], {} as never)).toContain("cleared");
	expect(loadAuth(authFile).servers.sec).toBeUndefined();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test test/mcp/commands.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Extend `extensions/mcp/index.ts`**

Edit 1 — imports + oauth factory in the manager singleton:
oldText:
```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadMcpConfig, validateEntry } from "./config.ts";
import { loadAuth } from "./auth-store.ts";
import { McpManager, type McpServerRuntime } from "./client.ts";
import { jsonSchemaToTypebox } from "./schema.ts";
import type { Seat } from "../seats.ts";
```
newText:
```ts
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { loadMcpConfig, saveMcpConfig, validateEntry, type McpServerConfig } from "./config.ts";
import { clearServerSecrets, loadAuth, saveAuth } from "./auth-store.ts";
import { McpManager, type McpServerRuntime } from "./client.ts";
import { jsonSchemaToTypebox } from "./schema.ts";
import { CouncilOAuthProvider, loginOAuth } from "./oauth.ts";
import type { Seat } from "../seats.ts";
```

Edit 2 — manager gains the oauth provider factory:
oldText:
```ts
		managerSingleton = new McpManager({
			secrets: (name) => loadAuth().servers[name]?.headers ?? {},
		});
```
newText:
```ts
		managerSingleton = new McpManager({
			secrets: (name) => loadAuth().servers[name]?.headers ?? {},
			// redirectUri is unused outside interactive login (token refresh path).
			authProvider: (name, cfg) =>
				cfg.auth === "oauth" && cfg.url ? new CouncilOAuthProvider(name, "http://127.0.0.1/callback") : undefined,
		});
```

Edit 3 — append parent wiring and command handlers at end of file:

```ts
/** Parent session_start: connect enabled servers, register tools, report failures. */
export async function connectParentServers(pi: ExtensionAPI, repoRoot: string): Promise<string[]> {
	const cfg = loadMcpConfig(repoRoot);
	const manager = getMcpManager(repoRoot);
	const notes: string[] = [];
	for (const [name, serverCfg] of Object.entries(cfg.servers)) {
		if (serverCfg.enabled === false || validateEntry(name, serverCfg).length > 0 || manager.has(name)) continue;
		const runtime = await manager.connect(name, serverCfg);
		if (runtime.status === "connected") {
			registerServerTools(pi, manager, name, runtime);
		} else {
			notes.push(`mcp ${name}: ${runtime.status}${runtime.error ? ` — ${runtime.error}` : ""}`);
		}
	}
	return notes;
}

export async function runMcpSubcommand(
	repoRoot: string,
	sub: string,
	args: string[],
	ctx: ExtensionCommandContext,
): Promise<string> {
	switch (sub) {
		case "list":
			return listServers(repoRoot);
		case "add":
			return addServer(repoRoot, args);
		case "remove":
			return removeServer(repoRoot, args[0]);
		case "status":
			return probeServer(repoRoot, args[0]);
		case "login":
			return loginServer(repoRoot, args[0], ctx);
		case "logout":
			return logoutServer(repoRoot, args[0]);
		default:
			return "Usage: /mcp list | add <name> <url> [none|header|oauth] | add <name> -- <command> [args…] | remove <name> | status <name> | login <name> | logout <name>";
	}
}

function listServers(repoRoot: string): string {
	const cfg = loadMcpConfig(repoRoot);
	const manager = getMcpManager(repoRoot);
	const names = Object.keys(cfg.servers);
	if (names.length === 0) return "No MCP servers registered. Add one: /mcp add <name> <url>";
	const rows = names.map((name) => {
		const s = cfg.servers[name]!;
		const transport = s.url ? "http" : "stdio";
		const rt = manager.get(name);
		const status = s.enabled === false ? "disabled" : rt ? rt.status : "not connected";
		const tools = rt ? rt.tools.length : 0;
		return `${name}  ${transport.padEnd(5)}  auth=${s.auth.padEnd(6)}  ${status.padEnd(14)}  tools=${tools}`;
	});
	return ["MCP servers:", ...rows].join("\n");
}

function addServer(repoRoot: string, args: string[]): string {
	const name = args[0];
	if (!name) return "Usage: /mcp add <name> <url> [none|header|oauth]  or  /mcp add <name> -- <command> [args…]";
	const cfg = loadMcpConfig(repoRoot);
	if (cfg.servers[name]) return `Server "${name}" already exists. Remove it first: /mcp remove ${name}`;
	const dash = args.indexOf("--");
	let entry: McpServerConfig;
	if (dash > 0) {
		entry = { command: args[dash + 1], args: args.slice(dash + 2), auth: "none" };
	} else if (args[1]) {
		const mode = args[2];
		entry = {
			url: args[1],
			auth: mode === "header" || mode === "oauth" || mode === "none" ? mode : "none",
		};
	} else {
		return "Usage: /mcp add <name> <url> [none|header|oauth]  or  /mcp add <name> -- <command> [args…]";
	}
	const errs = validateEntry(name, entry);
	if (errs.length > 0) return errs.join("\n");
	cfg.servers[name] = entry;
	saveMcpConfig(repoRoot, cfg);
	const next = entry.auth !== "none" ? ` — run /mcp login ${name} to authenticate` : "";
	return `Registered MCP server "${name}"${next}. Tool changes take effect next session (or /reload).`;
}

async function removeServer(repoRoot: string, name?: string): Promise<string> {
	const cfg = loadMcpConfig(repoRoot);
	if (!name || !cfg.servers[name]) return `Unknown server "${name ?? ""}".`;
	delete cfg.servers[name];
	saveMcpConfig(repoRoot, cfg);
	clearServerSecrets(name);
	await getMcpManager(repoRoot).close(name);
	return `Removed MCP server "${name}" and its stored secrets. Tool changes take effect next session (or /reload).`;
}

async function probeServer(repoRoot: string, name?: string): Promise<string> {
	if (!name) return "Usage: /mcp status <name>";
	const cfg = loadMcpConfig(repoRoot);
	const serverCfg = cfg.servers[name];
	if (!serverCfg) return `Unknown server "${name}".`;
	const manager = getMcpManager(repoRoot);
	await manager.close(name);
	const rt = await manager.connect(name, serverCfg);
	if (rt.status === "connected") registerServerToolsProbeless(rt);
	const tools = rt.tools.map((t) => `  - ${t.name}`).join("\n") || "  (no tools)";
	return `${name}: ${rt.status}${rt.error ? ` — ${rt.error}` : ""}\n${tools}`;
}

/** status-only helper: refresh is a probe, tools register on next session. */
function registerServerToolsProbeless(_rt: McpServerRuntime): void {}

async function loginServer(repoRoot: string, name: string | undefined, ctx: ExtensionCommandContext): Promise<string> {
	if (!name) return "Usage: /mcp login <name>";
	const cfg = loadMcpConfig(repoRoot);
	const serverCfg = cfg.servers[name];
	if (!serverCfg) return `Unknown server "${name}".`;
	if (serverCfg.auth === "none") return `Server "${name}" uses no authentication.`;
	if (serverCfg.auth === "header") {
		const keys = Object.keys(serverCfg.headers ?? {}).filter((k) => !(serverCfg.headers![k] ?? "").includes("$"));
		if (keys.length === 0) {
			return `Server "${name}" headers are env-indirected ($VAR) or absent — nothing to store. Set the env vars and reconnect: /mcp status ${name}`;
		}
		if (!ctx.hasUI) return "Header login needs an interactive session.";
		const store = loadAuth();
		const entry = store.servers[name] ?? {};
		entry.headers = entry.headers ?? {};
		for (const k of keys) {
			entry.headers[k] = await ctx.ui.input(`Secret for header ${k}:`);
		}
		store.servers[name] = entry;
		saveAuth(store);
		return `Stored secrets for "${name}". Reconnect: /mcp status ${name}`;
	}
	// oauth
	return loginOAuth(repoRoot, name);
}

async function logoutServer(repoRoot: string, name?: string): Promise<string> {
	if (!name) return "Usage: /mcp logout <name>";
	const cleared = clearServerSecrets(name);
	await getMcpManager(repoRoot).close(name);
	return cleared
		? `Credentials for "${name}" cleared. Re-authenticate with /mcp login ${name}.`
		: `No stored credentials for "${name}".`;
}

export function registerMcpCommand(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerCommand("mcp", {
		description: "Manage Council MCP servers: list | add | remove | status | login | logout",
		handler: async (args, ctx) => {
			const parts = (args ?? "").trim().split(/\s+/).filter(Boolean);
			const out = await runMcpSubcommand(repoRoot, parts[0] ?? "", parts.slice(1), ctx);
			if (ctx.hasUI) ctx.ui.notify(out, "info");
			else console.log(out);
		},
	});
}
```

Note the simplification in `probeServer`: a status probe reconnects and reports; pi tool registration for a live session still requires `/reload` (pi has no tool deregistration), so `registerServerToolsProbeless` is an intentional no-op keeping the reconnect path single-purpose. If the implementer finds pi gains deregistration support, upgrade this to full re-registration.

- [ ] **Step 4: Wire `extensions/index.ts`**

Edit 1 — import:
oldText:
```ts
import { PKG_ROOT, proceduresDir } from "./seats.ts";
import { scaffoldInto } from "./scaffold.ts";
```
newText:
```ts
import { PKG_ROOT, proceduresDir } from "./seats.ts";
import { scaffoldInto } from "./scaffold.ts";
import { connectParentServers, getMcpManager, registerMcpCommand } from "./mcp/index.ts";
```

Edit 2 — session_start hook, after `getHub(repoRoot, renderWidget);`:
oldText:
```ts
		getHub(repoRoot, renderWidget); // create hub with onChange → widget refresh
		if (!widgetTimer) {
```
newText:
```ts
		getHub(repoRoot, renderWidget); // create hub with onChange → widget refresh
		void connectParentServers(pi, repoRoot).then((notes) => {
			if (notes.length > 0 && ctx.hasUI) ctx.ui.notify(`mcp:\n${notes.join("\n")}`, "warning");
		});
		if (!widgetTimer) {
```

Edit 3 — register /mcp in parent mode, next to the council-init registration:
oldText:
```ts
	pi.registerCommand("council-jobs", {
```
newText:
```ts
	registerMcpCommand(pi, repoRoot);

	pi.registerCommand("council-jobs", {
```

Edit 4 — shutdown closes MCP clients:
oldText:
```ts
	pi.on("session_shutdown", () => {
		if (widgetTimer) {
			clearInterval(widgetTimer);
			widgetTimer = null;
		}
		shutdownHub();
	});
```
newText:
```ts
	pi.on("session_shutdown", () => {
		if (widgetTimer) {
			clearInterval(widgetTimer);
			widgetTimer = null;
		}
		void getMcpManager(repoRoot).closeAll();
		shutdownHub();
	});
```

- [ ] **Step 5: Run tests**

Run: `bun test test/mcp/commands.test.ts && bun test && bunx tsc --noEmit`
Expected: all PASS (full suite), typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(mcp): /mcp management commands and parent session wiring"
```

---

### Task 10: Integration test, docs, verification, v0.2.0

**Files:**
- Create: `test/mcp/integration-context7.test.ts`
- Modify: `README.md`, `AGENTS.md`, `package.json` (version bump)

**Interfaces:**
- Produces: gated real-Context7 round trip; docs reflecting the new subsystem; tagged release.

- [ ] **Step 1: Write the gated integration test**

Create `test/mcp/integration-context7.test.ts`:

```ts
// Requires network + a CONTEXT7_API_KEY env var; skipped unless COUNCIL_MCP_INTEGRATION=1.
import { test, expect } from "bun:test";
import { McpManager } from "../../extensions/mcp/client.ts";

const enabled = process.env.COUNCIL_MCP_INTEGRATION === "1" && !!process.env.CONTEXT7_API_KEY;

test.skipIf(!enabled)(
	"context7 round trip via header auth",
	async () => {
		const mgr = new McpManager();
		const rt = await mgr.connect("context7", {
			url: "https://mcp.context7.com/mcp",
			auth: "header",
			headers: { "CONTEXT7_API_KEY": "$CONTEXT7_API_KEY" },
		});
		try {
			expect(rt.status).toBe("connected");
			expect(rt.tools.length).toBeGreaterThan(0);
			expect(mgr.listToolNames("context7")).toContain("mcp__context7__resolve-library-id");
		} finally {
			await mgr.closeAll();
		}
	},
	60_000,
);
```

- [ ] **Step 2: Update README.md**

Add to the Commands table (after `/council-jobs`):

```markdown
| `/mcp list` | Show registered MCP servers with transport, auth mode, status, tool count |
| `/mcp add <name> <url> [auth]` | Register a remote MCP server (`none`/`header`/`oauth`) |
| `/mcp add <name> -- <cmd> [args…]` | Register a local stdio MCP server |
| `/mcp remove <name>` | Unregister a server and clear its stored credentials |
| `/mcp status <name>` | Live-connect a server and report status + tools |
| `/mcp login <name>` | Authenticate (store header secrets, or full OAuth browser flow) |
| `/mcp logout <name>` | Clear stored credentials |
```

Add a new section after "How installation works":

```markdown
## MCP servers

Seats can use tools from registered MCP servers. Servers are registered
per-repo in `.pi/council/mcp.json` (committable); secrets and OAuth tokens
live user-global at `~/.pi/agent/council/mcp-auth.json` (mode 600). Grant a
seat access in its frontmatter: `mcp: [context7]`. The parent session exposes
connected servers' tools too (`mcp__<server>__<tool>`). OAuth servers refresh
tokens silently; when refresh fails, calls report `reauth-required` and
`/mcp login <server>` runs the browser flow again.
```

- [ ] **Step 3: Update AGENTS.md**

Append to Hard conventions (after item 9):

```markdown
10. **MCP secrets never go in `mcp.json`** — header values entered via
    `/mcp login` and all OAuth tokens live in `getAgentDir()/council/mcp-auth.json`
    (0600, atomic writes). `$ENV_VAR` indirection in `mcp.json` resolves at
    connect time and is never persisted resolved.
11. **`--tools` is an exact-name allowlist** — seat children receive granted
    MCP tool names (`mcp__<server>__<tool>`) enumerated by the parent at
    dispatch time; seats register them eagerly at startup. Never reintroduce
    lazy MCP connect in seats.
```

- [ ] **Step 4: Bump version**

Edit `package.json`: `"version": "0.1.0"` → `"version": "0.2.0"`.

- [ ] **Step 5: Full verification sweep**

```bash
bun test                      # all green; integration tests skip without env vars
bunx tsc --noEmit             # clean
grep -rn "\.pi/extensions/council\|PID_FILE_REL" extensions/ || echo clean
ls extensions/mcp/            # config auth-store schema client oauth index
bun test test/mcp/            # MCP suite alone
```

- [ ] **Step 6: Commit, push, tag**

```bash
git add -A && git commit -m "feat(mcp): v0.2.0 — MCP server support (registry, auth, oauth, seat grants)"
git push
git tag -a v0.2.0 -m "pi-council v0.2.0 — MCP server support"
git push origin v0.2.0
```

## Self-review notes (written with the plan)

- Spec coverage: storage ✓ (Tasks 2–3), transports ✓ (Task 5), auth modes ✓ (Tasks 5, 8), tool bridging parent ✓ (Tasks 5, 9), seats ✓ (Tasks 6–7), statuses ✓ (Task 5 `statuses()` + Task 9 list/status), security notes ✓ (Task 3 mode/atomicity, Task 8 loopback), testing ✓ (fixture servers + stub AS), phasing honored within one plan (Tasks 1–7 = Phase 1 exit "Context7 via API key"; Tasks 8–10 = Phase 2 exit "Context7 via OAuth").
- Known deferrals, recorded deliberately: pi has no tool deregistration, so mutating `/mcp` commands tell the user tools refresh on `/reload` or next session (Task 9, `probeServer` note); stdio servers are `none`-auth only in v0.2.0 (enforced in `validateEntry`).
