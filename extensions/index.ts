import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_DIR_NAME, getAgentDir, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { runChildMode } from "./child.ts";
import { Hub } from "./hub.ts";
import { getHub, pidFilePath, registerHubTools, shutdownHub } from "./hub-tools.ts";
import { PKG_ROOT, proceduresDir } from "./seats.ts";
import { scaffoldInto } from "./scaffold.ts";
import { resolveSuperpowers, SUPERPOWERS_SOURCE } from "./superpowers.ts";
import { connectParentServers, getMcpManager, registerMcpCommand } from "./mcp/index.ts";

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
		void connectParentServers(pi, repoRoot).then((notes) => {
			if (notes.length > 0 && ctx.hasUI) ctx.ui.notify(`mcp:\n${notes.join("\n")}`, "warning");
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
				handler: async (args, _ctx) => {
					pi.sendUserMessage(renderProcedure(body, procDir, args));
				},
			});
		}
	}

	pi.registerCommand("council-init", {
		description: "Scaffold the council/ and vault/ data trees into this repository (never overwrites); ensures the superpowers package is installed project-locally",
		handler: async (_args, ctx) => {
			// Superpowers: pi package with the skills (TDD, plans, debugging, ...) this
			// workflow leans on. We want it pinned project-locally so the dependency
			// travels with the repo. If it's not already pinned there, install it.
			const superpowers = resolveSuperpowers({
				projectSettingsFile: path.join(repoRoot, CONFIG_DIR_NAME, "settings.json"),
				globalSettingsFile: path.join(getAgentDir(), "settings.json"),
			});
			const messages: string[] = [];
			const installedHere = superpowers.portable;
			if (installedHere) {
				messages.push(`✓ superpowers already project-local — no action`);
			} else if (superpowers.global.in) {
				messages.push(`• superpowers is global here; pinning project-local for portability.`);
			} else {
				messages.push(`• superpowers not installed. Installing project-local so it travels with this repo:`);
			}

			if (!installedHere) {
				const install = await pi.exec("pi", ["install", "-l", SUPERPOWERS_SOURCE], {
					signal: ctx.signal,
					timeout: 60_000,
				});
				if (install.code !== 0) {
					messages.push(`  ✗ install failed (${install.code}): ${(install.stderr || install.stdout || "").trim()}`);
				} else {
					messages.push(`  ✓ installed. Run /reload to load the superpowers skills this session.`);
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
			const lines = jobs.map((j) => {
				const mins = ((Date.now() - j.startedAt) / 60_000).toFixed(1);
				const recent = j.events.slice(-3).join("  ");
				return `${j.id}  ${j.seat.padEnd(14)} ${j.state.padEnd(9)} ${mins}m  pid=${j.pid}  ${recent}`;
			});
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}
