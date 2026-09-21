import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { builtinToolsFor, grantsFor, loadSeat, type Seat } from "./seats.ts";
import { initHubIdentity, registerHubTools } from "./hub-tools.ts";
import { registerFollowupReviewTool } from "./followup-tool.ts";
import { getMcp } from "./mcp-load.ts";
import { mintRunId } from "./runs.ts";

export function isCallAllowed(seat: Seat, toolName: string): boolean {
	const g = grantsFor(seat);
	const allowed = new Set<string>(builtinToolsFor(seat));
	if (g.hub) {
		allowed.add("council_dispatch");
		allowed.add("council_wait");
		allowed.add("council_cancel");
	}
	// EV-83: the followup grant carries exactly the child-mode review tool —
	// never the hub trio (control: a followup-granted seat cannot dispatch).
	if (g.followup) allowed.add("council_followup_review");
	if (allowed.has(toolName)) return true;
	if (toolName.startsWith("mcp__")) {
		const server = toolName.slice("mcp__".length).split("__")[0];
		return (seat.mcp ?? []).includes(server);
	}
	return false;
}

export function runChildMode(pi: ExtensionAPI, repoRoot: string, seatName: string): void {
	initHubIdentity(process.env.COUNCIL_RUN_ID ?? mintRunId(), process.env.COUNCIL_JOB_ID);
	const seat = loadSeat(repoRoot, seatName); // throws → child exits nonzero → parent sees "failed"
	if (grantsFor(seat).hub) {
		registerHubTools(pi, repoRoot, { allowedSeats: seat.spawns });
	}
	// EV-83: the followup grant's child-mode tool — the runner's transport to
	// the one followup composition (runFollowupReview + renderFollowupLinesFromRepo).
	if (grantsFor(seat).followup) {
		registerFollowupReviewTool(pi, repoRoot);
	}
	// Eager: MCP tools must be registered (and thus advertised) for the seat to
	// ever call them. Registration happens async; names are already in --tools.
	void getMcp().then((m) => m.startSeatMcp(pi, repoRoot, seat));
	pi.on("tool_call", (event) => {
		if (!isCallAllowed(seat, event.toolName)) {
			return {
				block: true,
				reason: `Seat "${seat.name}" is not granted tool "${event.toolName}". Granted: ${seat.tools.join(", ")}.`,
			};
		}
	});
}
