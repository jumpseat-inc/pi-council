import * as fs from "node:fs";

/** pi package sources the council pins project-locally at scaffold time. */
export const SUPERPOWERS_SOURCE = "git:github.com/obra/superpowers";
export const ASK_USER_QUESTION_SOURCE = "npm:@juicesharp/rpiv-ask-user-question";

export interface CouncilDependency {
	/** pi package source string, passed verbatim to `pi install -l`. */
	source: string;
	/** Short label used in messages and preflight output. */
	label: string;
	/** Human-facing description of what the dependency is. */
	kind: string;
}

/** Every dependency /council-init installs project-locally and preflight asserts. */
export const COUNCIL_DEPENDENCIES: readonly CouncilDependency[] = [
	{ source: SUPERPOWERS_SOURCE, label: "superpowers", kind: "skills package" },
	{ source: ASK_USER_QUESTION_SOURCE, label: "ask-user-question", kind: "extension" },
];

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
 * Which entries in a package list hold a dependency identity. Matches pi's
 * dedupe semantics loosely: for git, identity is the repo URL without ref; for
 * npm, it is the `npm:<package-name>` key (an optional version suffix may
 * follow, e.g. `npm:@scope/name@1.2.3`).
 */
export function packagesHolding(packages: string[], source: string): string[] {
	return packages.filter((p) => p.includes(source));
}

export interface ScopeState {
	/** Non-empty when this scope names the dependency. */
	in: boolean;
	/** The exact entries found. */
	matches: string[];
}

export interface DependencyResolution {
	source: string;
	label: string;
	project: ScopeState;
	global: ScopeState;
	inProject: boolean;
	inGlobal: boolean;
	/** True when the project-local pin is present, so installs travel with the repo. */
	portable: boolean;
	/** Human summary of where the dependency sits right now. */
	message: string;
}

/** Resolve a single council dependency across project and global pi settings. */
export function resolveDependency(
	dep: CouncilDependency,
	options: { projectSettingsFile: string | null | undefined; globalSettingsFile: string | null | undefined },
): DependencyResolution {
	const project = scopeOf(readPackages(options.projectSettingsFile), dep.source);
	const global = scopeOf(readPackages(options.globalSettingsFile), dep.source);
	const message = project.in
		? `${dep.label} is already installed project-locally (portable)`
		: global.in
			? `${dep.label} is installed globally on this machine, not pinned to the project`
			: `${dep.label} is not installed in this project or globally`;
	return {
		source: dep.source,
		label: dep.label,
		project,
		global,
		inProject: project.in,
		inGlobal: global.in,
		portable: project.in,
		message,
	};
}

/** Resolve all scaffold-installed council dependencies at once. */
export function resolveCouncilDependencies(options: {
	projectSettingsFile: string | null | undefined;
	globalSettingsFile: string | null | undefined;
}): DependencyResolution[] {
	return COUNCIL_DEPENDENCIES.map((dep) => resolveDependency(dep, options));
}

function scopeOf(packages: string[], source: string): ScopeState {
	const matches = packagesHolding(packages, source);
	return { in: matches.length > 0, matches };
}
