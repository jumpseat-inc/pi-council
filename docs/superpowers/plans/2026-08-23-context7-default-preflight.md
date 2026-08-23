# Context7-by-Default + Structural Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Context7 as a default MCP server in the council scaffold, grant it to select seats, and make `council/preflight.sh` structurally assert the context7 registration + stored auth.

**Architecture:** No engine mechanics change. Three edits: (1) `scaffoldInto` gains a non-clobbering write of `.pi/council/mcp.json` registering context7 (OAuth endpoint), plus renders `@CONFIG_DIR@` → real `CONFIG_DIR_NAME` into the copied `preflight.sh`; (2) six seat frontmatters gain `mcp: [context7]`; (3) `preflight.sh` gains a structural check block. All existing MCP plumbing (parent auto-connect, seat grants, `--tools` allowlist, `/mcp login` OAuth) is reused untouched.

**Tech Stack:** TypeScript (bun:test), shell (preflight), pi `@earendil-works/pi-coding-agent`.

**Spec:** The design was agreed in chat (bounded task, no spec doc): option B for config-dir rendering; seats `council-runner, designer, owner, principal, skeptic, steward`; structural (B) preflight assertion.

## Global Constraints

- Config dir must come from `CONFIG_DIR_NAME` from `@earendil-works/pi-coding-agent` — never a hardcoded `.pi` in production TS. (Repro scaffold bash may render it in at copy time.)
- Scaffold writes are non-clobbering — `scaffoldInto` never overwrites an existing file.
- Same package + bump logic: consumer `mcp.json` overrides by filename.
- Tests import engine via relative paths (`../extensions/...`) and pass a `fs.mkdtempSync` repoRoot; packaged resources resolve via `PKG_ROOT`.
- Seats are opinionated — only add the `mcp` frontmatter field to the six listed; do not touch body prose.
- Preflight retains its fail-fast contract: `FAIL:` line halts the run.
- Commit messages: conventional commits; scope `feat(docs)`/`feat(scaffold)`/`feat(seats)`/`test` etc. Bump `version` in `package.json` to `0.3.0` in the same PR.

---

### Task 1: Scaffold renders `mcp.json` + renders `@CONFIG_DIR@` in preflight

**Files:**
- Modify: `extensions/scaffold.ts`
- Modify: `extensions/index.ts` (only if needed — check; `council-init` currently calls `scaffoldInto` which we'll extend)
- Test: `test/scaffold.test.ts`

**Interfaces:**
- Consumes: `scaffoldInto(repoRoot, scaffoldRoot)` (existing signature unchanged), `CONFIG_DIR_NAME`, `PKG_ROOT` (existing imports)
- Produces: `mcp.json` at `$CONFIG_DIR_NAME/council/mcp.json`; `preflight.sh` with `@CONFIG_DIR@` replaced by real config-dir name.

- [ ] **Step 1: Write the failing test** — assert first run creates `.pi/council/mcp.json` with context7 entry valid per `loadMcpConfig`, and that copied `preflight.sh` has the rendered config-dir, not `@CONFIG_DIR@`.

```ts
// test/scaffold.test.ts
import { loadMcpConfig } from "../extensions/mcp/config.ts";
// ...add to test/scaffold.test.ts
test("scaffold writes context7 mcp.json and renders @CONFIG_DIR@ in preflight", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "council-init-c7-"));
	const first = scaffoldInto(root, SCAFFOLD);
	expect(first.created).toContain(".pi/council/mcp.json");
	expect(first.skipped).toEqual([]);

	const cfg = loadMcpConfig(root);
	expect(cfg.servers["context7"]).toBeDefined();
	expect(cfg.servers["context7"]!.url).toBe("https://mcp.context7.com/mcp/oauth");
	expect(cfg.servers["context7"]!.auth).toBe("oauth");

	const preflight = fs.readFileSync(path.join(root, "council", "preflight.sh"), "utf-8");
	expect(preflight).toContain(".pi/council/mcp.json");
	expect(preflight).not.toContain("@CONFIG_DIR@");

	// rerun: user edits survive, nothing new created
	fs.appendFileSync(path.join(root, ".pi", "council", "mcp.json"), "\n");
	const second = scaffoldInto(root, SCAFFOLD);
	expect(second.created.filter((c) => c !== "vault/raw" && c !== "vault/wiki/sources")).toEqual([]);
	expect(second.skipped).toContain(".pi/council/mcp.json");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/scaffold.test.ts`
Expected: FAIL — `.pi/council/mcp.json` not created, `@CONFIG_DIR@` still present.

- [ ] **Step 3: Implement.**

In `extensions/scaffold.ts`, import `CONFIG_DIR_NAME` from pi. After the `EMPTY_DIRS` loop, write non-clobbering config + render placeholder. Define a `RENDER` map and a `renderText` helper:

```ts
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

/** Static placeholders replaced into copied text files. Maps token → value. */
const RENDER: Record<string, string> = { "@CONFIG_DIR@": CONFIG_DIR_NAME };

function renderScaffoldText(content: string): string {
	return content.replace(/\@CONFIG_DIR@/g, RENDER["@CONFIG_DIR@"]);
}

const DEFAULT_MCP_CONFIG = {
	servers: {
		context7: { url: "https://mcp.context7.com/mcp/oauth", auth: "oauth", enabled: true },
	},
};
```

Then in `scaffoldInto`, change the file-copy branch to render if the file is a known text target whose name carries a token — we only render `preflight.sh` for now (the only scaffold script that needs the config dir):

```ts
} else if (entry.isFile()) {
	if (fs.existsSync(dst)) {
		result.skipped.push(childRel);
	} else {
		fs.mkdirSync(path.dirname(dst), { recursive: true });
		const srcPath = path.join(src, entry.name);
		if (entry.name === "preflight.sh") {
			fs.writeFileSync(dst, renderScaffoldText(fs.readFileSync(srcPath, "utf-8")));
		} else {
			fs.copyFileSync(srcPath, dst);
		}
		result.created.push(childRel);
	}
}
```

After the existing walk + EMPTY_DIRS loop, add the non-clobbering default config:

```ts
// Non-clobbering default MCP registration: context7 by default, unless the
// consumer already has (or wrote) their own mcp.json.
const mcpRel = path.join(CONFIG_DIR_NAME, "council", "mcp.json");
const mcpDst = path.join(repoRoot, mcpRel);
if (fs.existsSync(mcpDst)) {
	result.skipped.push(mcpRel);
} else {
	fs.mkdirSync(path.dirname(mcpDst), { recursive: true });
	fs.writeFileSync(mcpDst, JSON.stringify(DEFAULT_MCP_CONFIG, null, 2) + "\n");
	result.created.push(mcpRel);
}
```

- [ ] **Step 4: Run tests to verify they pass** — `bun test test/scaffold.test.ts`, all green.
- [ ] **Step 5: Commit** — `git add extensions/scaffold.ts test/scaffold.test.ts && git commit -m "feat(scaffold): default context7 mcp.json and render config-dir in preflight"`

---

## Task 2: Preflight asserts context7 registration + stored auth

**Files:**
- Modify: `council/scaffold/council/preflight.sh` (add the assertion block)

**Interfaces:**
- Consumes: `CONFIG_DIR_NAME` renders as `@CONFIG_DIR@` (Task 1).
- Produces: context7 assertion that `FAIL:` halts setup if config/registration or auth-store/credential is missing.

- [ ] **Step 1: Add context7 assertion block** to `preflight.sh` before the final `PASS` line:

```bash
# ---- Context7 (MCP) gate ----
# The scaffold writes .pi/council/mcp.json registering context7. Structural
# check only: registration present + stored credentials present. A real OAuth
# re-auth/live-token probe is out of scope for preflight. Any FAIL: halts.

c7_mcp=".pi/council/mcp.json"
if [ ! -f "$c7_mcp" ] || ! grep -q '"context7"' "$c7_mcp" 2>/dev/null; then
  fail "context7 not registered (missing or no entry in $c7_mcp) — run /council-init"
fi
ok "context7 registered"

c7_auth="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/council/mcp-auth.json"
if [ ! -f "$c7_auth" ] || ! grep -q '"context7"' "$c7_auth" 2>/dev/null; then
  fail "context7 not authenticated — no stored credentials in $c7_auth — run /mcp login context7"
fi
ok "context7 authenticated (stored credentials present)"
```
Note: the `#` font on `$PI_CODING_AGENT_DIR` and `.pi` literal is fine here because preflight is a scaffold data file *rendered* by scaffoldInto (Task 1) — production TS stays hardcode-free. The `.pi` token here will be replaced by the real config-dir name at copy time.

- [ ] **Step 2: Inspect rendered copy** — after Task 1, `bun test`/manual `council-init` in a scratch repo, confirm the copied preflight has the real config-dir (not `@CONFIG_DIR@`) and the block reads correctly.
- [ ] **Step 3: Commit** — `git add council/scaffold/council/preflight.sh && git commit -m "feat(scaffold): assert context7 registration + auth in preflight"`

(No unit test for this step — preflight is bash scaffold data, validated by the existing render test in Task 1 plus manual run.)

---

## Task 3: Grant context7 to the six seats

**Files:**
- Modify: `council/agents/*.md` for `council-runner`, `designer`, `owner`, `principal`, `skeptic`, `steward`

**Interfaces:**
- Consumes: parsed `mcp` field from `seats.ts` (already exists — `parseSeatFile` reads `mcp:`).
- Produces: `mcp: [context7]` in frontmatter of those six seats; zero MCP grants on `product-owner`, `judge`, `consolidator`.

- [ ] **Step 1: Add the field.** In each of the six seat files, after `spawns:` (or after `tools:` where no spawns), add:

```
mcp: [context7]
```

Exactly, in `council-runner.md`, `designer.md`, `owner.md`, `principal.md`, `skeptic.md`, `steward.md`.

- [ ] **Step 2: Run the seat test** — `bun test test/seats.test.ts` — ensure still green (parses `mcp:` on all seats incl. the three without grants (product-owner, judge, consolidator)).
- [ ] **Step 3: Commit** — `git add council/agents/*.md && git commit -m "feat(seats): grant context7 mcp to runner, designer, owner, principal, skeptic, steward"`

---

## Task 4: Version bump + full suite

**Files:**
- Modify: `package.json` (bump `version` to `0.3.0`)
- Existing repo: `AGENTS.md` conventions already cover this subset — verify anything referencing mcp default.

- [ ] **Step 1: Bump version.** In `package.json`, `"version": "0.2.1"` → `"0.3.0"`.
- [ ] **Step 2: Run full suite.** `bun test` — confirm 34-green (integration still 1-skipped unless `COUNCIL_INTEGRATION=1`).
- [ ] **Step 3: Typecheck.** `bunx tsc --noEmit` — confirm clean.
- [ ] **Step 4: Commit** — `git add package.json && git commit -m "feat(qa): v0.3.0 context7 default + preflight assertion"`