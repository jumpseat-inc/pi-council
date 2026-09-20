// EV-76 — the run-start gate preflight. The decisions gate's credential
// check at run start: when the repo's resolved gate mode is advisory or
// active and no OpenRouter credential resolves, a single-line FAIL halts the
// run before any seat dispatch; when the gate is off or a credential
// resolves, this module adds nothing (silent pass).
//
// Spec: docs/superpowers/specs/2026-09-20-EV-76-design.md (settled). The
// check composes the ONE gate resolver (loadGateConfig, extensions/gate.ts)
// with the ONE credential resolver (resolveOpenRouterApiKey,
// extensions/provider-cost.ts) — runtime parity by construction, never a
// re-implementation of either. The tool registration
// (registerPreflightTool) lives here too: parent-mode-only, wired from
// extensions/index.ts's parent block exactly like registerGateTool and
// registerRouteTool — never folded into registerHubTools, so child mode
// structurally never sees it. The tool NEVER launches or executes the
// packaged preflight shell script — no shell-out, no process launch, no
// exec primitive of any kind; the script stays invoked by the procedure
// text exactly as before.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadGateConfig } from "./gate.ts";
import { resolveOpenRouterApiKey } from "./provider-cost.ts";

/** The R5-endorsed single-line FAIL literal. A constant plus the mode enum
 * value, so there is no injection surface; <mode> is "advisory" or "active".
 * Names the decisions gate as the consumer and both remediations. */
export function gatePreflightFailLine(mode: string): string {
	return (
		`FAIL: decisions gate is enabled (mode "${mode}") but no OpenRouter credential resolved — ` +
		`set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, ` +
		`then re-run preflight`
	);
}

/** Pure core. Returns null (silent pass) when the resolved gate mode is off
 * or a credential resolves; returns the single-line FAIL literal when the
 * gate is enabled and no credential resolves. A loadGateConfig throw
 * (malformed .council.json) propagates as its own single-line FAIL: gateFail
 * error — fail loud, never default to off. `opts.apiKey` overrides ambient
 * resolution when defined (explicit null counts as "no credential"). */
export function runStartGatePreflight(
	repoRoot: string,
	opts: { apiKey?: string | null } = {},
): string | null {
	const { mode } = loadGateConfig(repoRoot);
	if (mode === "off") return null;
	const credential = opts.apiKey !== undefined ? opts.apiKey : resolveOpenRouterApiKey();
	if (credential !== null) return null;
	return gatePreflightFailLine(mode);
}

/** Register the run-start preflight's parent-session tool. Its OWN
 * registration — called from index.ts's parent path only, never folded into
 * registerHubTools (which child.ts also calls for hub-granted seats). On a
 * FAIL the tool returns the single line as its result (the facilitator's
 * stop-on-`FAIL:` rule then halts the run); on a pass it returns a pass
 * result and adds nothing. A loadGateConfig throw propagates — fail loud.
 * Never launches the packaged preflight shell script; the script stays
 * invoked by the procedure text exactly as before. */
export function registerPreflightTool(pi: ExtensionAPI, repoRoot: string): void {
	pi.registerTool({
		name: "council_preflight",
		label: "Council Preflight",
		description:
			"Run-start preflight for the decisions gate. Invoke once at run start, before the preflight script. " +
			"Returns a single FAIL: line when the decisions gate is enabled and no OpenRouter credential resolves — " +
			"stop the run on it and surface it verbatim to the human. Returns a pass result otherwise.",
		parameters: Type.Object({}),
		async execute() {
			const line = runStartGatePreflight(repoRoot);
			if (line !== null) {
				return { content: [{ type: "text", text: line }], details: { ok: false } };
			}
			const pass = "council_preflight: ok — decisions gate off, or an OpenRouter credential resolved";
			return { content: [{ type: "text", text: pass }], details: { ok: true } };
		},
	});
}
