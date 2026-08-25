import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { watchCouncilConfig, type WatchCouncilConfigOptions } from "../extensions/theme-watcher.ts";
import { materializeTheme } from "../extensions/theme-activation.ts";
import type { ThemeSection } from "../extensions/seats.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

// ---- EV-4 §7: the mid-session .council.json watcher ----

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEBOUNCE = 60; // fast window for tests; production default is 250

async function waitFor(cond: () => boolean, ms = 2500): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < ms) {
		if (cond()) return true;
		await sleep(20);
	}
	return cond();
}

function tmpRoot(initial?: unknown): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-watch-"));
	if (initial !== undefined) fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(initial));
	return root;
}

function settingsFiles(): { globalFile: string; projectFile: string } {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ev4-watch-settings-"));
	const files = { globalFile: path.join(dir, "g.json"), projectFile: path.join(dir, "p.json") };
	// whitelisted "light/dark" raw leaf → the EV-3 decision activates the council theme
	fs.writeFileSync(files.globalFile, JSON.stringify({ theme: "light/dark" }));
	fs.writeFileSync(files.projectFile, JSON.stringify({ theme: "light/dark" }));
	return files;
}

function makeObserver() {
	let setThemeCalls: unknown[] = [];
	const notifs: Array<{ m: string; t?: string }> = [];
	const ctx = {
		hasUI: true,
		ui: {
			setTheme(t: unknown) {
				setThemeCalls.push(t);
				return { success: true };
			},
			notify(m: string, t?: string) {
				notifs.push({ m, t });
			},
		},
	} as unknown as ExtensionContext;
	return {
		ctx,
		setTheme: () => setThemeCalls,
		notifs: () => notifs,
	};
}

function arm(ctx: ExtensionContext, root: string, opts: WatchCouncilConfigOptions = {}) {
	return watchCouncilConfig(ctx, root, { debounceMs: DEBOUNCE, ...opts });
}

const CONFIG_A = { theme: { variant: "dark", dark: { colors: { accent: "#123456" } } } };
const CONFIG_B = { theme: { variant: "dark", dark: { colors: { accent: "#654321" } } } };

async function themeFor(section: ThemeSection, variant: "dark" | "light" = "dark") {
	return materializeTheme(section, variant);
}

// ---- arm is change-driven: no reload / notify on the initial write ----

test("arm does not reload; a valid save fires exactly one reload carrying the NEW palette", async () => {
	const root = tmpRoot(CONFIG_A);
	const { ctx, setTheme, notifs } = makeObserver();
	const w = arm(ctx, root, { settingsFiles: settingsFiles() });
	await sleep(150);
	expect(setTheme()).toHaveLength(0); // arm must not re-activate
	expect(notifs()).toHaveLength(0);

	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(CONFIG_B));
	expect(await waitFor(() => setTheme().length === 1)).toBe(true);
	await sleep(200);
	expect(setTheme()).toHaveLength(1); // exactly one reload
	expect(notifs()).toContainEqual({ m: "council theme: pi-council-dark", t: "info" });
	// the instance carries the NEW accent, not the armed one
	const expected = await themeFor(CONFIG_B.theme as ThemeSection);
	const captured = setTheme()[0] as { getFgAnsi(t: string): string };
	expect(captured.getFgAnsi("accent")).toBe(expected.getFgAnsi("accent"));
	w.close();
});

test("malformed content notifies a warning and stays armed: a later valid save still reloads", async () => {
	const root = tmpRoot(CONFIG_A);
	const { ctx, setTheme, notifs } = makeObserver();
	const w = arm(ctx, root, { settingsFiles: settingsFiles() });
	fs.writeFileSync(path.join(root, ".council.json"), "{ not json");
	expect(
		await waitFor(() => notifs().some((n) => n.m.includes("council theme") && n.m.includes("malformed"))),
	).toBe(true);
	await sleep(150);
	expect(setTheme()).toHaveLength(0); // malformed never reaches setTheme
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(CONFIG_B));
	expect(await waitFor(() => setTheme().length === 1)).toBe(true); // still armed
	w.close();
});

test("settings.json edits inside the watched dir are ignored", async () => {
	const root = tmpRoot(CONFIG_A);
	const { ctx, setTheme, notifs } = makeObserver();
	const w = arm(ctx, root, { settingsFiles: settingsFiles() });
	await sleep(120);
	fs.writeFileSync(path.join(root, "settings.json"), JSON.stringify({ theme: "gruvbox" }));
	fs.mkdirSync(path.join(root, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(root, ".pi", "settings.json"), JSON.stringify({ theme: "gruvbox" }));
	await sleep(250);
	expect(setTheme()).toHaveLength(0);
	expect(notifs()).toHaveLength(0);
	w.close();
});

test("theme section removed -> RULING 1: no setTheme, keep-last warning (no off-revert)", async () => {
	const root = tmpRoot(CONFIG_A);
	const { ctx, setTheme, notifs } = makeObserver();
	const w = arm(ctx, root, { settingsFiles: settingsFiles() });
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(CONFIG_B));
	expect(await waitFor(() => setTheme().length === 1)).toBe(true); // baseline reload
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify({ council: {} })); // theme section removed
	expect(
		await waitFor(() => notifs().some((n) => n.m.includes("theme removed") && n.m.includes("restart to revert"))),
	).toBe(true);
	await sleep(200);
	expect(setTheme()).toHaveLength(1); // NOT 2 — RULING 1 keep-last: no new setTheme
	w.close();
});

test("rename-burst / atomic replace collapses to exactly one reload with the last content", async () => {
	const root = tmpRoot(CONFIG_A);
	const { ctx, setTheme } = makeObserver();
	const w = arm(ctx, root, { settingsFiles: settingsFiles() });
	const target = path.join(root, ".council.json");
	const variants = ["#111111", "#222222", "#333333", "#444444", "#555555"];
	for (let i = 0; i < variants.length; i++) {
		const tmp = path.join(root, `.council.json.tmp${i}`);
		fs.writeFileSync(tmp, JSON.stringify({ theme: { variant: "dark", dark: { colors: { accent: variants[i] } } } }));
		fs.renameSync(tmp, target);
	}
	expect(await waitFor(() => setTheme().length === 1)).toBe(true);
	await sleep(200);
	expect(setTheme()).toHaveLength(1); // one debounced reload for the whole burst
	const expected = await themeFor({ variant: "dark", dark: { colors: { accent: "#555555" } } });
	const captured = setTheme()[0] as { getFgAnsi(t: string): string };
	expect(captured.getFgAnsi("accent")).toBe(expected.getFgAnsi("accent")); // last-write-wins
	w.close();
});

test("close() stops everything: no reload, no notify after; idempotent", async () => {
	const root = tmpRoot(CONFIG_A);
	const { ctx, setTheme, notifs } = makeObserver();
	const w = arm(ctx, root, { settingsFiles: settingsFiles() });
	w.close();
	await sleep(80);
	fs.writeFileSync(path.join(root, ".council.json"), JSON.stringify(CONFIG_B));
	await sleep(250);
	expect(setTheme()).toHaveLength(0);
	expect(notifs()).toHaveLength(0);
	w.close(); // idempotent
});
