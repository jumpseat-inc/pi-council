import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME, getAgentDir, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { runChildMode } from "./child.ts";
import { Hub } from "./hub.ts";
import { getHub, initHubIdentity, pidFilePath, registerHubTools, shutdownHub } from "./hub-tools.ts";
import { PKG_ROOT, loadThemeConfig, proceduresDir } from "./seats.ts";
import { activateTheme } from "./theme-activation.ts";
import { watchCouncilConfig, type CouncilConfigWatcher } from "./theme-watcher.ts";
import { mintRunId, pruneRuns } from "./runs.ts";
import { scaffoldInto } from "./scaffold.ts";
import { installArgsFor, resolveCouncilDependencies } from "./dependencies.ts";
import { connectParentServers, getMcpManager, registerMcpCommand } from "./mcp/index.ts";
import { registerNavigator, TREE_SHORTCUT } from "./navigator.ts";

/**
 * Some catalogue entries carry wrong max-output metadata — e.g. OpenRouter's
 * deepseek-v4-pro-0813 is listed at ~4.1K output tokens, so with high thinking
 * deliberations burn the whole budget on reasoning and die stopReason=length
 * with no text. Floors are data, not code: council/model-floors.json (shipped,
 * currently exactly one entry) maps model id → minimum output tokens; a repo
 * may extend or override entries at $CONFIG_DIR_NAME/council/model-floors.json.
 * The patch re-inflates max_tokens on the outgoing payload after pi's clamp,
 * in the parent and every seat child.
 */
export function loadModelFloors(repoRoot: string): Record<string, number> {
	const load = (file: string): Record<string, number> => {
		try {
			const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
			return parsed && typeof parsed === "object" && !Array.isArray(parsed)
				? (parsed as Record<string, number>)
				: {};
		} catch {
			return {}; // missing or malformed → no floors from this layer
		}
	};
	return {
		...load(path.join(PKG_ROOT, "council", "model-floors.json")),
		...load(path.join(repoRoot, CONFIG_DIR_NAME, "council", "model-floors.json")),
	};
}

function registerMaxTokensFix(pi: ExtensionAPI, repoRoot: string): void {
	const floors = loadModelFloors(repoRoot);
	pi.on("before_provider_request", (event: any) => {
		const payload = event?.payload;
		if (!payload || typeof payload.model !== "string") return;
		const floor = floors[payload.model];
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

/**
 * Pure builder for the live widget strings (EV-4 §8): plain text, zero ANSI,
 * no `#hex` — nothing to go stale on a theme switch, satisfying AGENTS.md 9.6.
 */
export function widgetLines(
	active: Array<{ seat: string; startedAt: number; events: string[]; state: string }>,
): string[] {
	return active.map((j) => {
		const mins = Math.floor((Date.now() - j.startedAt) / 60_000);
		const secs = Math.floor(((Date.now() - j.startedAt) % 60_000) / 1000);
		const last = j.events[j.events.length - 1] ?? "…";
		const flag = j.state === "timeout" ? " ⚠ over ceiling" : "";
		return `⏳ ${j.seat} ${mins}m${String(secs).padStart(2, "0")}s  last: ${last}${flag}`;
	});
}

/** Pure builder for the /council-jobs table (plain text, zero ANSI / #hex). */
export function jobLines(
	jobs: Array<{ id: string; seat: string; state: string; startedAt: number; pid: number | null | undefined; events: string[] }>,
): string[] {
	return jobs.map((j) => {
		const mins = ((Date.now() - j.startedAt) / 60_000).toFixed(1);
		const recent = j.events.slice(-3).join("  ");
		return `${j.id}  ${j.seat.padEnd(14)} ${j.state.padEnd(9)} ${mins}m  pid=${j.pid}  ${recent}`;
	});
}

/** Substitute runtime placeholders into a stripped procedure body. */
export function renderProcedure(strippedBody: string, procDir: string, args?: string): string {
	return strippedBody
		.replace(/\$COUNCIL_PROCEDURES/g, procDir)
		.replace(/\$ARGUMENTS/g, (args ?? "").trim());
}

export default function (pi: ExtensionAPI) {
	const repoRoot = process.cwd();
	registerMaxTokensFix(pi, repoRoot);
	const seatName = process.env.COUNCIL_SEAT;
	if (seatName) {
		runChildMode(pi, repoRoot, seatName);
		return;
	}

	// ---- parent mode ----
	let uiCtx: ExtensionContext | null = null;
	let widgetTimer: ReturnType<typeof setInterval> | null = null;
	let themeWatcher: CouncilConfigWatcher | null = null;
	registerHubTools(pi, repoRoot);
	registerNavigator(pi, repoRoot, () => getHub(repoRoot).runId);

	const renderWidget = () => {
		if (!uiCtx?.hasUI) return;
		const active = getHub(repoRoot)
			.list()
			.filter((j) => j.exitCode === null);
		if (active.length === 0) {
			uiCtx.ui.setWidget("council", []);
			return;
		}
		uiCtx.ui.setWidget("council", widgetLines(active));
	};

	pi.on("session_start", (_event, ctx) => {
		uiCtx = ctx;
		const swept = Hub.sweepStalePids(pidFilePath(repoRoot));
		if (swept > 0 && ctx.hasUI) ctx.ui.notify(`council: swept ${swept} orphaned seat process(es)`, "warning");
		void activateTheme(ctx, repoRoot); // EV-3: in-memory council theme; try/caught inside, never crashes session_start
		// EV-4 §7: arm the live .council.json watcher ONLY when a theme section
		// exists at session_start (sync gate). No config at start → no watcher,
		// forever this session: a section appearing mid-session is unsupported.
		// Note: a section REMOVED mid-session is still watched (RULING 1 keep-last).
		try {
			if (loadThemeConfig(repoRoot) !== undefined) {
				themeWatcher?.close();
				themeWatcher = watchCouncilConfig(ctx, repoRoot);
			}
		} catch {
			// Malformed config at start — activateTheme already notified; arm nothing.
			themeWatcher = null;
		}
		initHubIdentity(mintRunId());
		pruneRuns(repoRoot);
		getHub(repoRoot, renderWidget); // create hub with onChange → widget refresh
		void connectParentServers(pi, repoRoot)
			.then((notes) => {
				if (notes.length === 0) return;
				try {
					if (ctx.hasUI) ctx.ui.notify(`mcp:\n${notes.join("\n")}`, "warning");
				} catch {
					// Session replaced/reloaded while MCP connects were in flight —
					// the notify has nowhere to go; drop it without crashing the session.
				}
			})
			.catch(() => {
				// Best-effort: a parent MCP connect failure (bad config, OAuth error,
				// network timeout) must never crash the session via an unhandled
				// rejection. Seats report their own MCP warnings at dispatch time.
			});
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
		themeWatcher?.close();
		themeWatcher = null;
		void getMcpManager(repoRoot).closeAll();
		shutdownHub();
	});

	// ---- procedure commands: scanned, override-aware ----
	// Walk [repoOverride, packaged]; dedupe by filename so an override file
	// shadows the packaged one of the same name.
	const procDir = proceduresDir(repoRoot);
	const seen = new Set<string>();
	for (const dir of [path.join(repoRoot, CONFIG_DIR_NAME, "council", "procedures"), path.join(PKG_ROOT, "council", "procedures")]) {
		if (!fs.existsSync(dir)) continue;
		for (const file of fs.readdirSync(dir)) {
			if (!file.endsWith(".md") || seen.has(file)) continue;
			seen.add(file);
			const raw = fs.readFileSync(path.join(dir, file), "utf-8");
			const name = file.replace(/\.md$/, "");
			const description = frontmatterField(raw, "description") ?? `Run the ${name} procedure`;
			const argumentHint = frontmatterField(raw, "argument-hint");
			const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
			pi.registerCommand(name, {
				description: argumentHint ? `${description} (${argumentHint})` : description,
					handler: async (args, ctx) => {
						const routed = renderProcedure(body, procDir, args);
						if (ctx.mode === "tui") {
							// Interactive: fire-and-forget — the turn streams to the UI and the
							// session stays alive, so never block the command handler.
							void pi.sendUserMessage(routed);
						} else {
							// print/json/rpc: block until the dispatched turn completes. The
							// extension sendUserMessage API is fire-and-forget, so awaiting it
							// resolves before the turn runs and print mode would tear the
							// runtime down mid-turn (silent no-op / aborted run).
							pi.sendUserMessage(routed);
							// waitForIdle returns immediately if called before the run starts;
							// yield until the run is active (or already done), then await idle.
							for (let i = 0; i < 100 && ctx.isIdle(); i++) {
								await new Promise((r) => setTimeout(r, 25));
							}
							await ctx.waitForIdle();
						}
					},
			});
		}
	}

	pi.registerCommand("council-init", {
		description: "Scaffold the council/ and vault/ data trees into this repository (never overwrites); ensures the superpowers + ask-user-question packages are installed project-locally",
		handler: async (_args, ctx) => {
			// Council dependencies: packages this workflow needs pinned
			// project-locally so they travel with the repo. Install each that
			// isn't already pinned there.
			const deps = resolveCouncilDependencies({
				projectSettingsFile: path.join(repoRoot, CONFIG_DIR_NAME, "settings.json"),
				globalSettingsFile: path.join(getAgentDir(), "settings.json"),
			});
			const messages: string[] = [];
			for (const dep of deps) {
				if (dep.portable) {
					messages.push(`✓ ${dep.label} already project-local — no action`);
				} else if (dep.global.in) {
					messages.push(`• ${dep.label} is global here; pinning project-local for portability.`);
				} else {
					messages.push(`• ${dep.label} not installed. Installing project-local so it travels with this repo:`);
				}

				if (!dep.portable) {
					// --approve when the project isn't trusted: headless/remote sessions
					// never prompt, and without it `pi install -l` refuses with "Project
					// is not trusted". Running /council-init IS the approval.
					const install = await pi.exec("pi", installArgsFor(dep.source, { projectTrusted: ctx.isProjectTrusted() }), {
						signal: ctx.signal,
						timeout: 60_000,
					});
					if (install.code !== 0) {
						messages.push(`  ✗ install failed (${install.code}): ${(install.stderr || install.stdout || "").trim()}`);
					} else {
						messages.push(`  ✓ installed. Run /reload to pick it up this session.`);
					}
				}
			}

			const r = scaffoldInto(repoRoot, path.join(PKG_ROOT, "council", "scaffold"));
			try {
				fs.chmodSync(path.join(repoRoot, "council", "preflight.sh"), 0o755);
			} catch {
				/* best effort */
			}
			messages.push(
				`\nScaffold created:\n${r.created.map((c) => `  + ${c}`).join("\n") || "  (nothing)"}`,
				`Scaffold skipped (already present):\n${r.skipped.map((s) => `  = ${s}`).join("\n") || "  (none)"}`,
			);

			const msg = messages.join("\n");
			if (ctx.hasUI) ctx.ui.notify(msg, "info");
			else console.log(msg);
		},
	});

	registerMcpCommand(pi, repoRoot);

	pi.registerCommand("council-jobs", {
		description: "Show the Council job table",
		handler: async (_args, ctx) => {
			const jobs = getHub(repoRoot).list();
			if (jobs.length === 0) {
				ctx.ui.notify("No council jobs this session.", "info");
				return;
			}
			const lines = jobLines(jobs);
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}
