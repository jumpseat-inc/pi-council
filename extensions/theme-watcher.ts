import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { COUNCIL_CONFIG_FILE, loadThemeConfig } from "./seats.ts";
import { activateTheme, defaultThemeSettingsFiles, type ThemeSettingsFiles } from "./theme-activation.ts";

export interface CouncilConfigWatcher {
	close(): void; // idempotent; closes fs watcher + debounce timer
}

export interface WatchCouncilConfigOptions {
	/** Injectable settings.json locations for the raw-settings read inside activateTheme. */
	settingsFiles?: ThemeSettingsFiles;
	/** Debounce window (ms), last-write-wins. Default 250. */
	debounceMs?: number;
}

/**
 * EV-4 §7: watch `<repoRoot>/.council.json` and live-repaint the active
 * in-memory council Theme on a debounced, filtered change.
 *
 * We watch the PARENT directory (`repoRoot`), not the file: an editor's
 * save-temp-then-rename replaces the inode, which kills a file-targeted
 * `fs.watch`. Events are filtered to `basename === ".council.json"`, and
 * `rename` for that basename re-arms the watcher (close + recreate) so
 * future edits to the new inode are still seen (node's fs.watch reports
 * `rename` both when a name appears and when it disappears — there is no
 * separate `delete` event type). ~250ms last-write-wins
 * debounce collapses a save burst into exactly one reload. The handle is
 * `unref`'d and closed in session_shutdown — it never lingers across sessions.
 *
 * `settings.json` is NEVER inside the watched names set: name-block
 * transitions are handled by the decision table (a concrete name like
 * "gruvbox" appearing while we watch re-runs the EV-3 block path inside
 * activateTheme). A NEW `.council.json` appearing mid-session in a repo that
 * had none at session start is NOT noticed — arm is session-start-gated.
 */
export function watchCouncilConfig(
	ctx: ExtensionContext,
	repoRoot: string,
	opts: WatchCouncilConfigOptions = {},
): CouncilConfigWatcher {
	const debounceMs = opts.debounceMs ?? 250;
	const settingsFiles = opts.settingsFiles ?? defaultThemeSettingsFiles(repoRoot);
	const target = path.basename(COUNCIL_CONFIG_FILE);

	const notify = (message: string, type?: "error" | "info" | "warning") => {
		if (!closed && ctx.hasUI) ctx.ui.notify(message, type);
	};


	let closed = false;

	/** Reload the config and apply the §7 decision table. */
	const reload = () => {
		if (closed) return;
		let config;
		try {
			config = loadThemeConfig(repoRoot);
		} catch (err) {
			// Malformed / invalid section: notify + STAY ARMED — a later valid
			// save reloads. Skeptic F.2 closed-green.
			notify(`council theme: ${err instanceof Error ? err.message : String(err)}`, "warning");
			return;
		}
		if (config === undefined) {
			// Section removed (or enabled:false) → RULING 1: keep the last
			// materialized theme. NO setTheme (that would be the forbidden
			// string/revert fiction); document restart-to-revert.
			notify("council: theme removed — keeping the last council theme active; restart to revert", "warning");
			return;
		}
		// Present → reuse EV-3's exact decision path: whitelist raw settings
		// leaf → activate (materialize + ui.setTheme(instance) + notify) or
		// block-notify. The extension only ever calls ui.setTheme(instance).
		void activateTheme(ctx, repoRoot, { settingsFiles });
	};

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	const scheduleReload = () => {
		if (debounceTimer !== null) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(reload, debounceMs);
	};

	let watcher: fs.FSWatcher | null = null;
	const arm = () => {
		if (closed) return;
		watcher?.close();
		watcher = fs.watch(repoRoot, (eventType, filename) => {
			if (closed) return;
			if (filename === undefined || path.basename(String(filename)) !== target) return;
			if (eventType === "rename") {
				// Re-arm: the rename replaces the inode; a fresh watcher ensures
				// the next save is still observed. Schedule next tick so it
				// doesn't thrash mid-burst.
				scheduleReload();
				setTimeout(arm, 10);
				return;
			}
			scheduleReload();
		});
		watcher.unref?.();
	};

	arm();
	return {
		close(): void {
			closed = true;
			if (debounceTimer !== null) {
				clearTimeout(debounceTimer);
				debounceTimer = null;
			}
			watcher?.close();
			watcher = null;
		},
	};
}