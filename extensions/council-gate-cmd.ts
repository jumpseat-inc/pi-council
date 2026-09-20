import { GATE_MODES, loadGateConfig } from "./gate.ts";
import type { GateMode } from "./gate.ts";
import { writeGateMode } from "./council-config-writer.ts";

// ---- R5-constrained operator copy — byte-exact, binding (EV-74 spec §3) ----
// "gate" everywhere; the echo names the resolved mode and states when it
// applies. All forms are single-line — no emitted string ever carries "\n".

export function gateSuccessLine(mode: GateMode): string {
	return `council-gate: gate mode is now ${mode} in .council.json — applies to dispatches after this echo.`;
}

export function gateRedundantLine(mode: GateMode): string {
	return `council-gate: gate mode is already ${mode} in .council.json — no change.`;
}

export function gateStatusLine(mode: GateMode): string {
	return `[council-gate] gate mode is ${mode}.`;
}

export function gateUsageErrorLine(arg: string): string {
	return `[council-gate] error: unknown mode "${arg}" — usage: /council-gate [off|advisory|active]`;
}

/**
 * The `/council-gate` command's pure grammar (the /council-models headless
 * pattern): `args` is the raw command string, `emit` is the single sink for
 * TUI (`ctx.ui.notify`) and headless (`console.log`) alike — no behavioral
 * fork, no modal (a three-value toggle needs none).
 *
 * Arg grammar: trim, split on whitespace. Zero tokens → status read (never a
 * write). One token → must be a member of GATE_MODES. More than one token →
 * the unknown-arg error. O3 pin: a single token with trailing whitespace
 * (`"off "`) is trimmed by the split and is VALID.
 *
 * On a successful write the echo resolves through `loadGateConfig` (the
 * loader's own resolution — echo-then-run), NOT from the request. Fail-soft
 * read-back (O4): if the post-write `loadGateConfig` throws after a
 * successful write, the command still reports the write with the requested
 * mode — never a FAIL for a write that landed (non-assertive echo rule).
 */
export function runGateCommand(
	args: string,
	repoRoot: string,
	emit: (line: string) => void,
	write: typeof writeGateMode = writeGateMode,
): void {
	const trimmed = args.trim();
	const tokens = trimmed ? trimmed.split(/\s+/) : [];

	if (tokens.length === 0) {
		// Status read — resolves through the loader, writes nothing.
		try {
			emit(gateStatusLine(loadGateConfig(repoRoot).mode));
		} catch (e) {
			emit(`[council-gate] error: ${e instanceof Error ? e.message : String(e)}`);
		}
		return;
	}

	if (tokens.length > 1 || !GATE_MODES.includes(tokens[0] as GateMode)) {
		emit(gateUsageErrorLine(trimmed));
		return;
	}

	const requested = tokens[0] as GateMode;
	const res = write({ repoRoot, mode: requested });
	if (!res.ok) {
		emit(`[council-gate] error: ${res.error}`);
		return;
	}

	// Fail-soft read-back: the write landed; never un-assert it because the
	// read-back could not compute state.
	let echoed: GateMode = requested;
	try {
		echoed = loadGateConfig(repoRoot).mode;
	} catch {
		/* fail-soft — report the write with the requested mode */
	}
	emit(res.unchanged ? gateRedundantLine(echoed) : gateSuccessLine(echoed));
}
