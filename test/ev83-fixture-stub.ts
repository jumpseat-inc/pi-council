// EV-83 runner-fixture stub — the mechanism-obedient runner composite, as a
// bare bun process (no pi, no registered tools). It drives the exported
// composition (runFollowupReview, then renderFollowupLinesFromRepo against
// the ACTUAL result object — the join is by callId in-process, no model
// re-transmission of mechanical facts) with a failing transport, then routes
// per the <followup_decision> prose: a failed/unresolved decision is an
// ESCALATION before any write — first line ESCALATION, each affected
// candidate by draft title with the verbatim engine-derived basis, and the
// explicit no-card-was-written statement. The fixture's red-at-base half is
// the tool-surface assertion (allowlist/isCallAllowed) in the parent test —
// NOT this composition (skeptic 8a), which passes at base by design.
import { runFollowupReview } from "../extensions/followup-tool.ts";
import { renderFollowupLinesFromRepo } from "../extensions/followup-render.ts";

const repo = process.env.EV83_REPO;
if (!repo) throw new Error("EV83_REPO not set");

const candidates = [{ title: "FLLWUP-101 probe", goal: "Probe the runner escalation path" }];

const result = await runFollowupReview(candidates, repo, {
	apiKey: "k-test",
	transport: async () => ({ ok: false, kind: "network", message: "transport exploded" }),
});
const lines = renderFollowupLinesFromRepo(result, repo);

// The unresolved routing: keyed on the result-level mode flag and the
// per-candidate failure state, never on the ledger's resolvedMode.
const report: string[] = [];
if (result.mode === "off") {
	report.push("ESCALATION");
	for (const c of candidates) {
		report.push(`candidate: ${c.title}`, "basis: no resolved recorded disposition (gate off)", "no card was written");
	}
} else {
	const unresolved = result.candidates.filter((c) => c.status !== "ok");
	if (unresolved.length > 0) {
		report.push("ESCALATION");
		for (const c of unresolved) {
			const idx = result.candidates.indexOf(c);
			report.push(`candidate: ${c.title}`, `basis: ${lines[idx] ?? "followup decision not recorded"}`, "no card was written");
		}
	}
}

if (report.length === 0) throw new Error("fixture stub: expected an unresolved routing, got none");

console.log(
	JSON.stringify({
		type: "message_end",
		message: {
			role: "assistant",
			content: [{ type: "text", text: report.join("\n") }],
			stopReason: "stop",
			usage: { input: 10, output: 5, cost: { total: 0.001 }, totalTokens: 15 },
		},
	}),
);
process.exit(0);
