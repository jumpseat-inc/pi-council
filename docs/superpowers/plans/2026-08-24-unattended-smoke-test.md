# Unattended Smoke Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command (`bash smoke/run.sh`) that builds an isolated Docker container, installs pi-council into a fresh consumer repo exactly as a consumer would, and drives a full `/council` card loop plus a `/features-deliver` epic run unattended — green only if the product actually works.

**Architecture:** A bash driver inside a `node:24-bookworm` container drives the real product surface via headless `pi --approve -p "<slash command>"`. A committed fixture consumer repo (small markdown-links CLI) provides deterministic inputs: pre-authored cards/epic, an all-flash `.council.json` override, and a repo-local `preflight.sh` that drops the OAuth-only MCP gate. After every run — pass or fail — the worktree (board, cards, git log, `runs/` manifests + session JSONL) is copied out to `smoke/artifacts/<timestamp>/`. Hard fail, zero retries.

**Tech Stack:** Docker (OrbStack on arm64), bash, `pi` CLI 0.84.3 headless print mode, bun, python3 (assertions + `validate.py`).

**Spec:** `docs/superpowers/specs/2026-08-24-unattended-smoke-test-design.md`

## Global Constraints

- pi pinned at `@earendil-works/pi-coding-agent@0.84.3` in the Dockerfile; bump is a deliberate change.
- All 9 seats run `openrouter/deepseek/deepseek-v4-flash-0731` via the fixture's `.council.json` (bare-string shorthand — frontmatter thinking levels stay).
- Hard fail, zero retries, artifacts on every run; `smoke/artifacts/` pruned to last 5.
- Phase ceilings: 30 min Phase 1 (`/council EV-1`), 90 min Phase 2 (`/features-deliver EPIC-1`).
- No engine changes — if the smoke needs an engine hook, that's a product bug; stop and report.
- No MCP/OAuth coverage: fixture runs with no registered MCP servers; unregistered servers degrade to dispatch warnings (existing behavior in `hub-tools.ts`).
- Headless `pi` invocations always pass `--approve` (project trust; container also sets `defaultProjectTrust: "always"`).
- Commit messages follow Conventional Commits: `type(scope): short imperative summary`.
- Fixture product tests must stay green at baseline: cards describe NEW features; the owner seat writes those tests during the run (TDD). The harness verifies the new behavior itself via functional probes, never via the fixture's baseline suite.

## Verified Facts (from research — do not re-derive)

- `pi install -l /absolute/path` pins the local path into `.pi/settings.json` **without copying** (docs/packages.md §Local Paths).
- `/council-init` is a deterministic engine command (extensions/index.ts `registerCommand("council-init")`): installs superpowers + ask-user-question project-locally, runs `scaffoldInto`, chmods `preflight.sh`. No LLM turn required.
- Headless modes (`-p`) never show a trust prompt; without a saved decision they use `defaultProjectTrust` (`ask` ignores project resources). `--approve` overrides per run (docs/settings.md §Project Trust).
- `council/scaffold/council/validate.py` resolves its repo root as `parent.parent` of its own location; card ids must match `^(EV|FLLWUP|BUG|EPIC)-[1-9]\d*$` and the filename; board lines are `- <ID> — <Title>` (em dash) exactly once, under the `## <state>` column.
- Runs substrate: `.pi/council/runs/<runId>/` holds per-job manifests + session JSONL (AGENTS.md convention 12).
- `council-runner` "container" is a metaphor for an isolated pi session — no Docker-in-Docker.

---

### Task 1: Fixture consumer repo

The committed consumer repo the smoke installs the council into. Small real bun+TS project (`links` markdown-link extractor CLI), pre-authored cards + epic, `.council.json` flash override, repo-local `preflight.sh`.

**Files:**
- Create: `smoke/fixture/package.json`, `smoke/fixture/tsconfig.json`, `smoke/fixture/src/links.ts`, `smoke/fixture/src/cli.ts`, `smoke/fixture/test/links.test.ts`, `smoke/fixture/test/fixtures/sample.md`, `smoke/fixture/AGENTS.md`, `smoke/fixture/.gitignore`, `smoke/fixture/.council.json`, `smoke/fixture/council/board.md`, `smoke/fixture/council/preflight.sh`, `smoke/fixture/council/cards/EV-1.md`, `smoke/fixture/council/cards/EV-2.md`, `smoke/fixture/council/cards/EV-3.md`, `smoke/fixture/council/cards/EPIC-1.md`, `smoke/fixture/bun.lock` (generated)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `/pkg/smoke/fixture` seeded read-only into the container and copied to `/work` by the driver; `test/fixtures/sample.md` is the probe input with exactly 3 links and 2 images

- [ ] **Step 1: Write the fixture product files**

`smoke/fixture/package.json`:

```json
{
	"name": "links-cli",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"scripts": {
		"test": "bun test",
		"typecheck": "tsc --noEmit",
		"start": "bun src/cli.ts"
	},
	"devDependencies": {
		"@types/bun": "^1",
		"typescript": "^5"
	}
}
```

`smoke/fixture/tsconfig.json`:

```json
{
	"compilerOptions": {
		"target": "ESNext",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"strict": true,
		"noEmit": true,
		"allowImportingTsExtensions": true,
		"skipLibCheck": true,
		"types": ["bun"]
	},
	"include": ["src", "test"]
}
```

`smoke/fixture/src/links.ts`:

```ts
export interface MarkdownLink {
	text: string;
	url: string;
}

const LINK_RE = /(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function extractLinks(markdown: string): MarkdownLink[] {
	const links: MarkdownLink[] = [];
	for (const match of markdown.matchAll(LINK_RE)) {
		links.push({ text: match[1] ?? "", url: match[2] ?? "" });
	}
	return links;
}
```

`smoke/fixture/src/cli.ts`:

```ts
import { extractLinks } from "./links.ts";

function usage(): never {
	console.error("usage: links-cli <file>");
	process.exit(2);
}

const args = process.argv.slice(2);
if (args.length !== 1) usage();

const file = args[0];
let markdown: string;
try {
	markdown = await Bun.file(file).text();
} catch {
	console.error(`cannot read ${file}`);
	process.exit(1);
}

for (const link of extractLinks(markdown)) {
	console.log(`${link.text} <${link.url}>`);
}
```

`smoke/fixture/test/fixtures/sample.md` (exactly 3 links, 2 images — probe expectations depend on these counts):

```markdown
# Smoke Sample

Welcome to the [pi homepage](https://pi.dev) and the
[council README](https://example.com/readme).

See also [installation notes](https://example.com/install "Install").

![logo](https://example.com/logo.png)

![banner](https://example.com/banner.png)
```

- [ ] **Step 2: Write the baseline tests**

`smoke/fixture/test/links.test.ts` — covers existing behavior only; the card features (`--count`, `--json`, `--images`) get their tests from the owner seat during the smoke run, not here:

```ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractLinks } from "../src/links.ts";

const sample = readFileSync(join(__dirname, "fixtures", "sample.md"), "utf-8");

test("extracts a plain link", () => {
	expect(extractLinks("[docs](https://example.com)")).toEqual([
		{ text: "docs", url: "https://example.com" },
	]);
});

test("skips image syntax", () => {
	expect(extractLinks("![logo](https://example.com/logo.png)")).toEqual([]);
});

test("ignores link titles", () => {
	expect(extractLinks('[a](https://a.b "Title")')).toEqual([
		{ text: "a", url: "https://a.b" },
	]);
});

test("sample fixture has exactly three links", () => {
	expect(extractLinks(sample)).toHaveLength(3);
});
```

- [ ] **Step 3: Install deps and run the baseline suite**

Run:

```bash
cd smoke/fixture && bun install && bun test && bun run typecheck
```

Expected: `bun install` creates `bun.lock` (commit it later); `bun test` → 4 pass, 0 fail; `tsc --noEmit` exits 0.

- [ ] **Step 4: Write the pre-authored council data**

`smoke/fixture/.council.json` (all 9 seats, bare-string shorthand):

```json
{
	"council": {
		"consolidator": "openrouter/deepseek/deepseek-v4-flash-0731",
		"council-runner": "openrouter/deepseek/deepseek-v4-flash-0731",
		"designer": "openrouter/deepseek/deepseek-v4-flash-0731",
		"judge": "openrouter/deepseek/deepseek-v4-flash-0731",
		"owner": "openrouter/deepseek/deepseek-v4-flash-0731",
		"principal": "openrouter/deepseek/deepseek-v4-flash-0731",
		"product-owner": "openrouter/deepseek/deepseek-v4-flash-0731",
		"skeptic": "openrouter/deepseek/deepseek-v4-flash-0731",
		"steward": "openrouter/deepseek/deepseek-v4-flash-0731"
	}
}
```

`smoke/fixture/AGENTS.md` (tells the seats where the gates are):

```markdown
# links-cli

Small markdown link-extraction CLI used as the pi-council smoke-test consumer repo.

## Gates

- Typecheck: `bun run typecheck`
- Tests: `bun test`
- Boot: `bun src/cli.ts test/fixtures/sample.md`

There is no build step, no server, no database.
```

`smoke/fixture/.gitignore`:

```gitignore
node_modules/
.pi/git/
.pi/npm/
.pi/council/.pids.json
```

`smoke/fixture/council/cards/EV-1.md`:

```markdown
---
id: EV-1
title: Add --count flag to links CLI
state: Ready
owner: null
epic: null
goal: The links CLI accepts a --count flag and prints exactly the number of links found in the input file, nothing else.
---

## Intent

Users want to know how many links a markdown document contains without
reading the full extraction output. Small, fully testable CLI feature —
one flag, one number on stdout, exit code 0.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --count` prints exactly `3` and exits 0.
- Without the flag, the current line-per-link output is unchanged.
- A test in `test/` covers `--count` against `test/fixtures/sample.md`.
- Gates: `bun run typecheck` and `bun test` pass.
```

`smoke/fixture/council/cards/EV-2.md`:

```markdown
---
id: EV-2
title: Add --json output to links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI accepts a --json flag that prints the extracted links as a JSON array of objects with text and url fields.
---

## Intent

Machine-readable output so downstream tooling can consume extraction
results without parsing the human-oriented line format.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --json` prints a JSON array of three objects in document order; each object has exactly the fields "text" and "url".
- `--json --count` together exits 2 with a usage error on stderr.
- A test in `test/` covers the happy path and the flag conflict.
- Gates: `bun run typecheck` and `bun test` pass.
```

`smoke/fixture/council/cards/EV-3.md`:

```markdown
---
id: EV-3
title: Add --images extraction to links CLI
state: Ready
owner: null
epic: EPIC-1
goal: The links CLI accepts an --images flag that prints every markdown image reference as alt text followed by its URL, one per line.
---

## Intent

Inspect image usage in a document the same way links are inspected today.

## Acceptance

- `bun src/cli.ts test/fixtures/sample.md --images` prints exactly two lines — `logo <https://example.com/logo.png>` then `banner <https://example.com/banner.png>` — and exits 0.
- Without the flag, image syntax is not printed (current behavior unchanged).
- A test in `test/` covers image extraction against `test/fixtures/sample.md`.
- Gates: `bun run typecheck` and `bun test` pass.
```

`smoke/fixture/council/cards/EPIC-1.md`:

```markdown
---
id: EPIC-1
title: Links CLI output formats
state: Ready
owner: null
epic: null
goal: The links CLI supports machine-readable and image-focused output so documents can be inspected without reading the default line output.
---

## Intent

Bundles EV-2 (`--json`) and EV-3 (`--images`). The two flags are
independent of each other and of the default output, which stays unchanged.
```

`smoke/fixture/council/board.md` — scaffold shape plus the four entries under `## Ready` (em dash `—`, exactly matching each card's `title`):

```markdown
# Council Board

State columns. Each card appears exactly once, on one line under the column
matching its frontmatter `state`, as `- <ID> — <Title>` with an em dash
(U+2014). `python3 council/validate.py` enforces this.

## Backlog

## Ready

- EV-1 — Add --count flag to links CLI
- EV-2 — Add --json output to links CLI
- EV-3 — Add --images extraction to links CLI
- EPIC-1 — Links CLI output formats

## Deliberating

## In Progress

## In Review

## Needs Human

## Done
```

- [ ] **Step 5: Write the fixture preflight (repo-local adapter)**

`smoke/fixture/council/preflight.sh` — the scaffolded generic preflight with two deletions: the `origin/main` ancestry gate (the ephemeral container repo has no remote) and the context7/tavily MCP loop (no OAuth unattended). Everything else stays, and `.pi` is hardcoded because scaffold-time `@CONFIG_DIR@` substitution never runs on a pre-committed file:

```bash
#!/usr/bin/env bash
# Smoke-fixture preflight: adapted from the scaffolded generic version.
# Removed: origin/main ancestry gate (no remote in an ephemeral container)
# and the context7/tavily MCP gate (OAuth is impossible unattended).
set -u

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

# ---- Superpowers gate ----
SUPER_PKG=".pi/git/github.com/obra/superpowers"
SUPER_PIN=".pi/settings.json"
if [ -d "$SUPER_PKG" ] && [ -f "$SUPER_PKG/package.json" ]; then
  ok "superpowers present (skills package under $SUPER_PKG)"
elif [ -f "$SUPER_PIN" ] && grep -q 'superpowers' "$SUPER_PIN" 2>/dev/null; then
  ok "superpowers present (pin in $SUPER_PIN)"
else
  fail "superpowers is not installed project-locally — run /council-init, then /reload."
fi

# ---- Ask-user-question extension gate ----
ASK_PKG=".pi/npm/node_modules/@juicesharp/rpiv-ask-user-question"
ASK_PIN=".pi/settings.json"
if [ -d "$ASK_PKG" ] && [ -f "$ASK_PKG/package.json" ]; then
  ok "ask-user-question present (extension under $ASK_PKG)"
elif [ -f "$ASK_PIN" ] && grep -q 'rpiv-ask-user-question' "$ASK_PIN" 2>/dev/null; then
  ok "ask-user-question present (pin in $ASK_PIN)"
else
  fail "ask-user-question is not installed project-locally — run /council-init, then /reload."
fi

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

# ---- OpenRouter (model provider) gate ----
if [ -n "${OPENROUTER_API_KEY:-}" ]; then
  ok "openrouter authorized (OPENROUTER_API_KEY set)"
elif [ -f "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/auth.json" ] && grep -q '"openrouter"' "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/auth.json" && grep -q '"api_key"' "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/auth.json"; then
  ok "openrouter authorized (stored api_key in auth.json)"
else
  fail "openrouter not authorized — set OPENROUTER_API_KEY"
fi

echo "PASS: preflight clean"
```

- [ ] **Step 6: Verify the fixture passes validate.py**

`validate.py` resolves its root from its own location, so stage it inside a copy:

```bash
TMP=$(mktemp -d)
cp -R smoke/fixture "$TMP/"
mkdir -p "$TMP/fixture/council"
cp council/scaffold/council/validate.py "$TMP/fixture/council/validate.py"
cd "$TMP/fixture" && python3 council/validate.py
```

Expected: `All council artifacts valid`, exit 0. Also verify the pre-init preflight fails for the right reason:

```bash
bash council/preflight.sh; echo $?
```

Expected: exit 1 with `FAIL: superpowers is not installed project-locally`. Clean up `$TMP`.

- [ ] **Step 7: Commit**

```bash
git add smoke/fixture
git commit -m "test(smoke): add fixture consumer repo with pre-authored cards"
```

---

### Task 2: Dockerfile and image probe

**Files:**
- Create: `smoke/Dockerfile`

**Interfaces:**
- Consumes: nothing from Task 1 at build time
- Produces: Docker image `pi-council-smoke` with node 24, git, python3, bun, pinned pi, git identity, and `defaultProjectTrust: "always"` in `/root/.pi/agent/settings.json`

- [ ] **Step 1: Write the Dockerfile**

`smoke/Dockerfile`:

```dockerfile
FROM node:24-bookworm

# Pinned pi version — bump deliberately; the smoke must stay reproducible.
ARG PI_VERSION=0.84.3

RUN apt-get update && apt-get install -y --no-install-recommends \
      git python3 curl unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

RUN npm install -g "@earendil-works/pi-coding-agent@${PI_VERSION}"

# Ephemeral git identity for the smoke worktree.
RUN git config --global user.email "smoke@pi-council.local" \
 && git config --global user.name "pi-council smoke" \
 && git config --global init.defaultBranch main

# Headless pi must trust project-local settings (packages, extensions)
# without a prompt; each pi invocation also passes --approve.
RUN mkdir -p /root/.pi/agent \
 && echo '{"defaultProjectTrust": "always"}' > /root/.pi/agent/settings.json

WORKDIR /work
```

Note: driver/assert scripts are bind-visible at `/pkg/smoke/` at run time; no `COPY` of them into the image — the run always executes the working tree's versions.

- [ ] **Step 2: Build and probe the image**

```bash
docker build -t pi-council-smoke smoke
docker run --rm pi-council-smoke bash -lc \
  'node --version && bun --version && pi --version && git --version && python3 --version && cat /root/.pi/agent/settings.json'
```

Expected: node v24.x, bun 1.x, pi prints its version, git 2.x, Python 3.x, and `{"defaultProjectTrust": "always"}`.

- [ ] **Step 3: Commit**

```bash
git add smoke/Dockerfile
git commit -m "test(smoke): add pinned Docker image with pi and bun"
```

---

### Task 3: run.sh, assert.sh, and driver phase 0 (the slash-routing spike)

This task is also the spec's approach A/B decision spike: phase 0 exercises `pi --approve -p "/council-init"` headlessly. **If `-p` does not route slash commands, STOP and switch the dispatch surface to the pi SDK driver per the spec's fallback section before continuing** — everything else (assertions, fixture, phases) stays identical.

**Files:**
- Create: `smoke/run.sh`, `smoke/assert.sh`, `smoke/driver.sh`
- Create: `smoke/artifacts/.gitkeep`
- Modify: `.gitignore` (repo root — add `smoke/artifacts/` except keepfile)

**Interfaces:**
- Consumes: `smoke/fixture` (Task 1), image `pi-council-smoke` (Task 2)
- Produces: `smoke/assert.sh` functions used by later phases: `assert_card_state <root> <card-id> <state>`, `assert_board_column <root> <card-id> <column>`, `assert_json_links <json-string>`, `assert_images_output <string>`; `smoke/run.sh` contract: exits with the driver's exit code, artifacts at `smoke/artifacts/<timestamp>/work/`, pruning to 5

- [ ] **Step 1: Write assert.sh**

`smoke/assert.sh`:

```bash
#!/usr/bin/env bash
# Smoke assertion helpers. Every function returns 0 on pass, non-zero on fail.

# assert_card_state <root> <card-id> <want> — card frontmatter state equals <want>.
assert_card_state() {
	local root="$1" id="$2" want="$3" got
	got="$(sed -n 's/^state: *//p' "$root/council/cards/$id.md" | head -1)"
	if [ "$got" != "$want" ]; then
		echo "assert_card_state: $id state is '$got', want '$want'" >&2
		return 1
	fi
}

# assert_board_column <root> <card-id> <want> — the board line for <card-id>
# sits under the ## <want> column (validate.py's column rules).
assert_board_column() {
	local root="$1" id="$2" want="$3"
	python3 - "$root/council/board.md" "$id" "$want" <<'PY'
import re, sys
text, cid, want = open(sys.argv[1]).read(), sys.argv[2], sys.argv[3]
cur = None
for line in text.splitlines():
    if line.startswith("## "):
        cur = line[3:].strip()
    elif re.match(rf"^- {re.escape(cid)} — ", line.strip()):
        if cur != want:
            print(f"assert_board_column: {cid} under {cur!r}, want {want!r}", file=sys.stderr)
            sys.exit(1)
        sys.exit(0)
print(f"assert_board_column: no board line for {cid}", file=sys.stderr)
sys.exit(1)
PY
}

# assert_json_links <json> — parse <json> and compare against the exact
# expected extraction of test/fixtures/sample.md in document order.
assert_json_links() {
	python3 - "$1" <<'PY'
import json, sys
got = json.loads(sys.argv[1])
want = [
    {"text": "pi homepage", "url": "https://pi.dev"},
    {"text": "council README", "url": "https://example.com/readme"},
    {"text": "installation notes", "url": "https://example.com/install"},
]
if got != want:
    print(f"assert_json_links: got {got!r}", file=sys.stderr)
    sys.exit(1)
PY
}

# assert_images_output <string> — exact expected --images output for sample.md.
assert_images_output() {
	local want="logo <https://example.com/logo.png>
banner <https://example.com/banner.png>"
	if [ "$1" != "$want" ]; then
		echo "assert_images_output: got '$1'" >&2
		return 1
	fi
}
```

- [ ] **Step 2: Write driver.sh with phase 0**

`smoke/driver.sh`:

```bash
#!/usr/bin/env bash
# Container-side smoke orchestrator. Exits non-zero on the first failure.
set -uo pipefail

SMOKE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SMOKE_DIR/assert.sh"

PKG=/pkg
WORK=/work
FLASH="openrouter/deepseek/deepseek-v4-flash-0731"
PHASE1_TIMEOUT=$((30 * 60))
PHASE2_TIMEOUT=$((90 * 60))

phase() { echo; echo "=== $* ==="; }
fatal() { echo "SMOKE FAIL: $*" >&2; exit 1; }

phase "0a seed worktree"
rm -rf "$WORK"
cp -R "$PKG/smoke/fixture" "$WORK"
cd "$WORK" || fatal "no worktree"
git init -q -b main
git add -A
git commit -q -m "fixture seed"

phase "0b package deps resolvable"
(cd "$PKG" && bun install --frozen-lockfile >/dev/null) || fatal "bun install in package failed"

phase "0c install pi-council project-local"
pi install -l "$PKG" || fatal "pi install failed"
grep -q "$PKG" .pi/settings.json || fatal ".pi/settings.json does not pin $PKG"

phase "0d council-init (slash-routing spike)"
pi --approve --model "$FLASH" -p "/council-init" || fatal "headless /council-init failed"
[ -d council ] || fatal "council/ not scaffolded"
[ -d vault ] || fatal "vault/ not scaffolded"
[ -x council/preflight.sh ] || fatal "council/preflight.sh not executable"
cmp -s "$PKG/smoke/fixture/.council.json" .council.json || fatal ".council.json was clobbered"
cmp -s "$PKG/smoke/fixture/council/preflight.sh" council/preflight.sh || fatal "preflight.sh was clobbered"
grep -q "superpowers" .pi/settings.json || fatal "superpowers not pinned project-locally"
grep -q "rpiv-ask-user-question" .pi/settings.json || fatal "ask-user-question not pinned project-locally"
python3 council/validate.py || fatal "validate.py failed after init"
bash council/preflight.sh || fatal "preflight failed after init"

echo
echo "SMOKE PHASE 0 PASS"
```

- [ ] **Step 3: Write run.sh and the artifacts plumbing**

`smoke/run.sh`:

```bash
#!/usr/bin/env bash
# Host entrypoint. Hard fail, zero retries; artifacts every run.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="pi-council-smoke"
KEEP=5

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
	echo "SMOKE FAIL: OPENROUTER_API_KEY is not set" >&2
	exit 1
fi

docker build -q -t "$IMAGE" "$REPO_ROOT/smoke"

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$REPO_ROOT/smoke/artifacts/$TS"
CID="smoke-$TS"
mkdir -p "$OUT"

set +e
docker run --name "$CID" -e OPENROUTER_API_KEY -v "$REPO_ROOT:/pkg" "$IMAGE" \
	bash /pkg/smoke/driver.sh
STATUS=$?
set -e

# Artifacts: the whole worktree minus disposable dep dirs.
if docker cp "$CID":/work "$OUT/work" 2>/dev/null; then
	rm -rf "$OUT/work/node_modules" "$OUT/work/.pi/npm" "$OUT/work/.pi/git"
else
	echo "run.sh: could not copy /work out of the container" >&2
fi
docker rm -f "$CID" >/dev/null 2>&1 || true

# Prune to the last $KEEP runs.
ls -1dt "$REPO_ROOT"/smoke/artifacts/2* 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -rf

if [ "$STATUS" -eq 0 ]; then
	echo "SMOKE PASS (artifacts: smoke/artifacts/$TS)"
else
	echo "SMOKE FAIL phase exit=$STATUS (artifacts: smoke/artifacts/$TS)" >&2
	if [ -f "$OUT/work/.pi/council/runs" ] || [ -d "$OUT/work/.pi/council/runs" ]; then
		LAST="$(find "$OUT/work/.pi/council/runs" -name '*.jsonl' -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)"
		if [ -n "$LAST" ]; then
			echo "--- last seat transcript tail ($LAST) ---" >&2
			tail -c 4000 "$LAST" >&2
		fi
	fi
fi
exit "$STATUS"
```

`smoke/artifacts/.gitkeep`: empty file.

Append to the repo-root `.gitignore`:

```gitignore
smoke/artifacts/*
!smoke/artifacts/.gitkeep
```

- [ ] **Step 4: Run phase 0 end-to-end**

Run: `bash smoke/run.sh` (needs `OPENROUTER_API_KEY`; `/council-init` performs no model turn, so token cost is ~0; network is needed for the superpowers git clone and the ask-user-question npm install).

Expected: `SMOKE PASS`, with `SMOKE PHASE 0 PASS` in the log, and `smoke/artifacts/<ts>/work/` containing the scaffolded tree.

If the run fails at phase 0d with the slash command not routing: this is the approach B trigger — replace the `pi --approve --model "$FLASH" -p "/council-init"` invocations with a bun script using the pi SDK that creates a session and sends the same prompt, then re-run. Do not proceed to Task 4 until phase 0 is green.

- [ ] **Step 5: Commit**

```bash
git add smoke/run.sh smoke/assert.sh smoke/driver.sh smoke/artifacts/.gitkeep .gitignore
git commit -m "test(smoke): add host runner and driver phase 0"
```

---

### Task 4: Driver phase 1 — the `/council EV-1` loop

**Files:**
- Modify: `smoke/driver.sh` (append phase 1)

**Interfaces:**
- Consumes: phase 0 green (Task 3), all `assert.sh` functions (Task 3)
- Produces: phase 1 gate pattern reused by phase 2 (run assertions, then functional probes)

- [ ] **Step 1: Append phase 1 to driver.sh**

After the `SMOKE PHASE 0 PASS` line in `smoke/driver.sh`:

```bash
phase "1 council loop EV-1"
timeout "$PHASE1_TIMEOUT" pi --approve --model "$FLASH" -p "/council EV-1" \
	|| fatal "phase 1: /council EV-1 did not settle within ${PHASE1_TIMEOUT}s"

assert_card_state "$WORK" "EV-1" "Done" || fatal "phase 1: EV-1 card is not Done"
assert_board_column "$WORK" "EV-1" "Done" || fatal "phase 1: EV-1 board line not under Done"

RUN_DIR="$WORK/.pi/council/runs"
[ -d "$RUN_DIR" ] || fatal "phase 1: no runs dir at $RUN_DIR"
SEAT_SESSIONS="$(find "$RUN_DIR" -name '*.jsonl' | wc -l | tr -d ' ')"
if [ "$SEAT_SESSIONS" -lt 3 ]; then
	fatal "phase 1: expected >= 3 seat sessions in runs/, found $SEAT_SESSIONS"
fi

phase "1 kill-shot probes EV-1"
cd "$WORK" || fatal "no worktree"
bun run typecheck || fatal "phase 1: typecheck failed after the run"
bun test || fatal "phase 1: test suite failed after the run"
COUNT="$(bun src/cli.ts test/fixtures/sample.md --count)" \
	|| fatal "phase 1: --count invocation failed"
[ "$COUNT" = "3" ] || fatal "phase 1: --count probe expected 3, got '$COUNT'"

echo
echo "SMOKE PHASE 1 PASS"
```

- [ ] **Step 2: Run the full smoke through phase 1**

Run: `bash smoke/run.sh`

Expected: phases 0 and 1 pass — real dispatches happen (deliberation seats, owner, skeptic, judge), `EV-1` lands `Done`, the harness probes confirm `--count` prints `3`. Wall clock ~5–15 min on flash; cost a few dollars at most. On red: inspect `smoke/artifacts/<ts>/work/.pi/council/runs/` transcripts, fix forward (fixture card wording, probe strictness), re-run. There is no cheaper substitute for this verification — it IS the smoke.

- [ ] **Step 3: Commit**

```bash
git add smoke/driver.sh
git commit -m "test(smoke): add phase 1 council-loop assertions and probes"
```

---

### Task 5: Driver phase 2 — the `/features-deliver EPIC-1` epic, plus surface polish

**Files:**
- Modify: `smoke/driver.sh` (append phase 2)
- Modify: `package.json` (add `smoke` script)
- Modify: `README.md` (Development section smoke note)

**Interfaces:**
- Consumes: phase 1 green (Task 4)
- Produces: the complete smoke; `bun run smoke` alias

- [ ] **Step 1: Append phase 2 to driver.sh**

After the `SMOKE PHASE 1 PASS` line:

```bash
phase "2 epic delivery EPIC-1"
timeout "$PHASE2_TIMEOUT" pi --approve --model "$FLASH" -p "/features-deliver EPIC-1" \
	|| fatal "phase 2: /features-deliver EPIC-1 did not settle within ${PHASE2_TIMEOUT}s"

assert_card_state "$WORK" "EV-2" "Done" || fatal "phase 2: EV-2 card is not Done"
assert_card_state "$WORK" "EV-3" "Done" || fatal "phase 2: EV-3 card is not Done"
assert_board_column "$WORK" "EV-2" "Done" || fatal "phase 2: EV-2 board line not under Done"
assert_board_column "$WORK" "EV-3" "Done" || fatal "phase 2: EV-3 board line not under Done"
python3 council/validate.py || fatal "phase 2: validate.py failed after epic delivery"

phase "2 kill-shot probes EV-2/EV-3"
JSON_OUT="$(bun src/cli.ts test/fixtures/sample.md --json)" \
	|| fatal "phase 2: --json invocation failed"
assert_json_links "$JSON_OUT" || fatal "phase 2: --json output mismatch"
set +e
bun src/cli.ts test/fixtures/sample.md --json --count >/dev/null 2>&1
CONFLICT_EXIT=$?
set -e
[ "$CONFLICT_EXIT" -eq 2 ] || fatal "phase 2: --json --count conflict exited $CONFLICT_EXIT, want 2"
IMAGES_OUT="$(bun src/cli.ts test/fixtures/sample.md --images)" \
	|| fatal "phase 2: --images invocation failed"
assert_images_output "$IMAGES_OUT" || fatal "phase 2: --images output mismatch"

bun run typecheck || fatal "phase 2: typecheck failed on final tree"
bun test || fatal "phase 2: test suite failed on final tree"

phase "2 council-runner dispatch evidence"
RUNNER_SESSIONS="$(grep -rl '"seat":"council-runner"\|"seat": "council-runner"' "$RUN_DIR" 2>/dev/null | wc -l | tr -d ' ')"
if [ "$RUNNER_SESSIONS" -lt 1 ]; then
	fatal "phase 2: no council-runner session found under $RUN_DIR"
fi

echo
echo "SMOKE PASS — full council loop + epic delivery verified"
```

Note: the `grep -rl` pattern covers both compact and spaced JSON manifest forms; manifests are the per-job files written by `runs.ts`. If the actual manifest shape differs when inspecting real artifacts (Task 4 step 2 produces them), adjust the pattern to match the observed field — keep the requirement "at least one council-runner session exists."

- [ ] **Step 2: Add the smoke script and README note**

In `package.json` `"scripts"`:

```json
"smoke": "bash smoke/run.sh"
```

Append to `README.md`'s `## Development` section:

```markdown
`bun run smoke` runs the unattended end-to-end smoke test: an isolated
Docker container installs this package into the fixture consumer repo under
`smoke/fixture/`, then drives a full `/council` card loop and a
`/features-deliver` epic run with all seats overridden to one flash model.
Requires `OPENROUTER_API_KEY`. Hard fail, no retries; every run writes
forensics to `smoke/artifacts/<timestamp>/`. Design:
`docs/superpowers/specs/2026-08-24-unattended-smoke-test-design.md`.
```

- [ ] **Step 3: Run the complete smoke**

Run: `bash smoke/run.sh`

Expected: all three phases green, ending `SMOKE PASS — full council loop + epic delivery verified`. Phase 2 wall clock ~15–45 min. On red, postmortem from artifacts, fix forward, re-run — this full green run is the deliverable.

- [ ] **Step 4: Commit**

```bash
git add smoke/driver.sh package.json README.md
git commit -m "test(smoke): add epic-delivery phase and smoke entrypoint"
```

---

### Task 6: Final verification sweep

**Files:** none new

**Interfaces:**
- Consumes: green full smoke (Task 5 step 3)

- [ ] **Step 1: Re-run everything clean**

```bash
bun test                # repo suite still green
bunx tsc --noEmit       # typecheck still green
bash smoke/run.sh       # full smoke green again (confirm re-run idempotency)
```

Expected: all green; the second smoke run proves fresh-container re-run semantics and that artifact pruning keeps ≤5 runs (delete extra old `smoke/artifacts/2*` dirs first if you created several while developing).

- [ ] **Step 2: Check repo hygiene**

```bash
git status --porcelain   # clean; artifacts/ ignored
git log --oneline -8     # conventional-commit messages, no wip commits
```

Expected: clean tree; only intended commits.

- [ ] **Step 3: Final commit if any fixups landed**

```bash
git add -A && git commit -m "test(smoke): verification sweep fixups"
```

Skip if the tree is already clean.
