import * as fs from "node:fs";

/** The pi package source that installs the superpowers skills + extension. */
export const SUPERPOWERS_SOURCE = "git:github.com/obra/superpowers";

/** Read the `packages` list out of a pi settings.json. Missing or malformed → []. */
export function readPackages(settingsFile: string | null | undefined): string[] {
	if (!settingsFile) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
	} catch {
		return []; // missing file or malformed JSON → no packages we can inspect
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
	const pkgs = (parsed as { packages?: unknown }).packages;
	if (!Array.isArray(pkgs)) return [];
	return pkgs.filter((p): p is string => typeof p === "string");
}

/**
 * Which entries in a package list hold the superpowers identity. Matches pi's
 * dedupe semantics: identity is the repo URL without ref, so both
 * `git:github.com/obra/superpowers` and `github.com/obra/superpowers` count.
 */
export function packagesHolding(packages: string[], source: string): string[] {
	return packages.filter((p) => p.includes(source));
}

export interface ScopeState {
	/** Non-empty when this scope names superpowers. */
	in: boolean;
	/** The exact entries found. */
	matches: string[];
}

export interface SuperpowersResolution {
	project: ScopeState;
	global: ScopeState;
	inProject: boolean;
	inGlobal: boolean;
	/** True when the project-local pin is present, so installs travel with the repo. */
	portable: boolean;
	/** Human summary of where superpowers sits right now. */
	message: string;
}

/**
 * Resolve whether superpowers is installed, given the two settings files that
 * could hold it (project .pi/settings.json and the user-global settings.json).
 * Never throws — a missing file simply counts as an empty scope.
 */
export function resolveSuperpowers(options: {
	projectSettingsFile: string | null | undefined;
	globalSettingsFile: string | null | undefined;
}): SuperpowersResolution {
	const project = scopeOf(readPackages(options.projectSettingsFile));
	const global = scopeOf(readPackages(options.globalSettingsFile));
	const message = project.in
		? "superpowers is already installed project-locally (portable)"
		: global.in
			? "superpowers is installed globally on this machine, not pinned to the project"
			: "superpowers is not installed in this project or globally";
	return {
		project,
		global,
		inProject: project.in,
		inGlobal: global.in,
		portable: project.in,
		message,
	};
}

function scopeOf(packages: string[]): ScopeState {
	const matches = packagesHolding(packages, SUPERPOWERS_SOURCE);
	return { in: matches.length > 0, matches };
}