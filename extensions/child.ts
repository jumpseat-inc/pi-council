import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { builtinToolsFor, grantsFor, loadSeat, type Seat } from "./seats.ts";
import { registerHubTools } from "./hub-tools.ts";

export function isCallAllowed(seat: Seat, toolName: string): boolean {
	const g = grantsFor(seat);
	const allowed = new Set<string>(builtinToolsFor(seat));
	if (g.hub) {
		allowed.add("council_dispatch");
		allowed.add("council_wait");
		allowed.add("council_cancel");
	}
	return allowed.has(toolName);
}

export function runChildMode(pi: ExtensionAPI, repoRoot: string, seatName: string): void {
	const seat = loadSeat(repoRoot, seatName); // throws → child exits nonzero → parent sees "failed"
	if (grantsFor(seat).hub) {
		registerHubTools(pi, repoRoot, { allowedSeats: seat.spawns });
	}
	pi.on("tool_call", (event) => {
		if (!isCallAllowed(seat, event.toolName)) {
			return {
				block: true,
				reason: `Seat "${seat.name}" is not granted tool "${event.toolName}". Granted: ${seat.tools.join(", ")}.`,
			};
		}
	});
}
