// EV-82 — offline tests for the pure render side (extensions/followup-render.ts):
// renderFollowupLines (the callId join over the mechanical result and the
// ledger records), resolveFollowupTarget, followupSuffix, and the thin
// parent-session `council_followup_render` tool.
//
// Spec: docs/superpowers/specs/2026-09-22-EV-82-design.md §3/§5 (settled);
// card: council/cards/EV-82.md. The render function is pure — the unit tests
// hand-build GateLedgerRecord fixtures; only the qualifier test (12) touches
// a tmpdir repo, through the real tool over a real ledger.
//
// Obligations pinned here (spec §5 items 8–17, incl. the skeptic's O3–O5
// remedies where they land on the render):
//  8. resolver precedence — board-id-exact before sibling-title-exact;
//     both-match resolves; unresolvable → loud named failure; a Done-id
//     reference fails loud by construction (it is absent from the open-only
//     lists).
//  9. unresolved Merge — no-arrow no-placeholder; a MISSING target and a
//     BAD reference do not collapse (fall-to-human vs loud failure).
// 10. callId cell table — ok → disposition line; no-api-key → `credential
//     unresolved`; other failure → `gate call failed: <reason>` verbatim
//     exactly once; http-404 → `model-card coming-soon`; join miss → fallback
//     literal; callId null → unrecorded fallback; NO double `gate:` colon.
// 11. D4 aggregation triple — all-share → one literal above the drafts;
//     mixed ok + transport failure → A's Mode: line + B's per-card literal;
//     two differing total-failure states → per-card literals only.
// 12. qualifier — record advisory true/false → byte-differing lines; a record
//     under advisory rendered against a repo whose config says `active` still
//     renders `(advisory)` (the record is the audit truth, never a re-read).
// 13. exactly one line per candidate; a 200-char title renders 200 chars.
// 14. off-literal input shape (O4) — {mode:"off", candidates:[]} → ["off"].
// 15. reason flattening (O5) — a newline-bearing failure body renders as ONE
//     line, newline → space.
// 16. D3 discriminator — renderLine.includes(decisionLine(record)) for every
//     disposition × mode × target-supplied cell.
// 17. render purity — source-string canary (O3): no node:fs import, no `fs.`
//     usage, no gate-run.ts / followup-tool.ts import.
import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { appendGateCall, decisionLine, type GateLedgerRecord } from "../extensions/gate-ledger.ts";
import {
	FOLLOWUP_RENDER_FALLBACK,
	followupSuffix,
	registerFollowupRenderTool,
	renderFollowupLines,
	resolveFollowupTarget,
	type FollowupRenderCandidate,
} from "../extensions/followup-render.ts";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const EM_DASH = "\u2014";

function rec(over: Partial<GateLedgerRecord> & { callId: string }): GateLedgerRecord {
	return {
		schemaVersion: 2,
		kind: "call",
		stateHash: "sha256:ev82-render-fake",
		questionSetVersion: "q-1",
		answers: {},
		resolvedMode: "File",
		policyVersion: "followup-decision-1",
		recordedAt: "2026-09-22T00:00:00.000Z",
		advisory: true,
		...over,
	} as GateLedgerRecord;
}

function mech(
	title: string,
	callId: string | null,
	over: Partial<FollowupRenderCandidate> = {},
): FollowupRenderCandidate {
	return { title, callId, status: callId === null ? "failed" : "ok", boardIds: [], siblingTitles: [], ...over };
}

const OK_BASIS = "composite 0.80 < merge threshold 1.00";
const NET_REASON = "getaddrinfo ENOTFOUND gate.test";
const NO_KEY_REASON = "no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)";

// ---------------------------------------------------------------------------
// 8 — resolver precedence
// ---------------------------------------------------------------------------

test("resolver: a reference matching both a board id and a sibling title resolves — board-id-exact is consulted first", () => {
	expect(resolveFollowupTarget("EV-90", { boardIds: ["EV-90"], siblingTitles: ["EV-90"] })).toBe("EV-90");
	// board-id-exact wins by consultation order; sibling-title-exact is the fallback arm.
	expect(resolveFollowupTarget("Sib", { boardIds: ["EV-90"], siblingTitles: ["Sib"] })).toBe("Sib");
});

test("resolver: an unresolvable reference fails loud with the named failure", () => {
	expect(() => resolveFollowupTarget("nope", { boardIds: ["EV-90"], siblingTitles: ["Sib"] })).toThrow(
		/matches no open board id or sibling title/,
	);
});

test("resolver: a Done-id reference fails loud by construction — Done ids are absent from the open-only lists", () => {
	expect(() => resolveFollowupTarget("EV-900", { boardIds: ["EV-901"], siblingTitles: [] })).toThrow(
		/matches no open board id or sibling title/,
	);
});

// ---------------------------------------------------------------------------
// 9 — unresolved Merge: the two states must not collapse
// ---------------------------------------------------------------------------

test("unresolved Merge with NO target supplied: the no-arrow no-placeholder line renders — the candidate falls to the human", () => {
	const record = rec({ callId: "c1", resolvedMode: "Merge", basis: "exact duplicate" });
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [record]);
	expect(lines.length).toBe(1);
	expect(lines[0]).toBe(`Mode: Merge — exact duplicate ${EM_DASH} T1 (advisory)`);
	expect(lines[0]).not.toContain("→");
	expect(lines[0]).not.toContain("?");
});

test("unresolved Merge with a BAD reference: a loud named failure — never silently re-pointed, never a silent fall-to-human", () => {
	const record = rec({ callId: "c1", resolvedMode: "Merge", basis: "exact duplicate" });
	expect(() =>
		renderFollowupLines(
			{ mode: "advisory", candidates: [mech("T1", "c1", { boardIds: ["EV-90"] })] },
			[record],
			{ T1: "typo-id" },
		),
	).toThrow(/matches no open board id or sibling title/);
});

test("resolved Merge: the arrow and the resolved target render (board id or sibling title)", () => {
	const record = rec({ callId: "c1", resolvedMode: "Merge", basis: "exact duplicate" });
	const lines = renderFollowupLines(
		{ mode: "advisory", candidates: [mech("T1", "c1", { boardIds: ["EV-90"], siblingTitles: ["Sib"] })] },
		[record],
		{ T1: "EV-90" },
	);
	expect(lines[0]).toBe(`Mode: Merge — exact duplicate ${EM_DASH} T1 → EV-90 (advisory)`);
	const lines2 = renderFollowupLines(
		{ mode: "active", candidates: [mech("T1", "c1", { boardIds: ["EV-90"], siblingTitles: ["Sib"] })] },
		[rec({ callId: "c1", resolvedMode: "Merge", basis: "exact duplicate", advisory: false })],
		{ T1: "Sib" },
	);
	expect(lines2[0]).toBe(`Mode: Merge — exact duplicate ${EM_DASH} T1 → Sib (active)`);
});

// ---------------------------------------------------------------------------
// 10 — the callId cell table
// ---------------------------------------------------------------------------

test("cell ok: the disposition line is decisionLine(record) + the suffix", () => {
	const record = rec({ callId: "c1", resolvedMode: "File", basis: OK_BASIS });
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [record]);
	expect(lines).toEqual([`Mode: File — ${OK_BASIS} — T1 (advisory)`]);
});

test("cell no-api-key: the bare `credential unresolved` literal", () => {
	const record = rec({ callId: "c1", resolvedMode: "File", basis: `gate call failed: ${NO_KEY_REASON}`, failure: { class: "no-api-key" } });
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [record]);
	expect(lines).toEqual(["credential unresolved"]);
});

test("cell other failure: `gate call failed: <reason>` verbatim, exactly once", () => {
	const record = rec({ callId: "c1", resolvedMode: "File", basis: `gate call failed: ${NET_REASON}`, failure: { class: "network" } });
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [record]);
	expect(lines).toEqual([`gate call failed: ${NET_REASON}`]);
	expect(lines[0]!.split("gate call failed: ").length - 1).toBe(1);
});

test("cell http-404: the bare `model-card coming-soon` literal (the render-side heuristic)", () => {
	const record = rec({ callId: "c1", resolvedMode: "File", basis: "gate call failed: HTTP 404: page gone", failure: { class: "http-404" } });
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [record]);
	expect(lines).toEqual(["model-card coming-soon"]);
});

test("cell join miss: a recorded callId with no ledger line renders the fallback literal — never a fabricated Mode: line", () => {
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "ghost")] }, []);
	expect(lines).toEqual([FOLLOWUP_RENDER_FALLBACK.joinMiss]);
	expect(lines[0]).not.toMatch(/^Mode: /);
});

test("cell unrecorded: a null callId renders the unrecorded fallback literal", () => {
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", null)] }, []);
	expect(lines).toEqual([FOLLOWUP_RENDER_FALLBACK.unrecorded]);
	expect(lines[0]).not.toMatch(/^Mode: /);
});

test("no double gate: colon — no cell ever renders `gate: gate call failed:`", () => {
	const records = [
		rec({ callId: "c1", resolvedMode: "File", basis: OK_BASIS }),
		rec({ callId: "c2", resolvedMode: "File", basis: `gate call failed: ${NET_REASON}`, failure: { class: "network" } }),
		rec({ callId: "c3", resolvedMode: "File", basis: `gate call failed: ${NO_KEY_REASON}`, failure: { class: "no-api-key" } }),
		rec({ callId: "c4", resolvedMode: "File", basis: "gate call failed: HTTP 404: x", failure: { class: "http-404" } }),
	];
	const lines = renderFollowupLines(
		{ mode: "advisory", candidates: [mech("A", "c1"), mech("B", "c2"), mech("C", "c3"), mech("D", "c4")] },
		records,
	);
	for (const line of lines) expect(line).not.toContain("gate: gate call failed:");
});

// ---------------------------------------------------------------------------
// 11 — D4 aggregation triple
// ---------------------------------------------------------------------------

test("D4 all-share: every candidate's record shares `no-api-key` → exactly one literal above the drafts, no per-candidate lines", () => {
	const records = [
		rec({ callId: "c1", basis: `gate call failed: ${NO_KEY_REASON}`, failure: { class: "no-api-key" } }),
		rec({ callId: "c2", basis: `gate call failed: ${NO_KEY_REASON}`, failure: { class: "no-api-key" } }),
	];
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("A", "c1"), mech("B", "c2")] }, records);
	expect(lines).toEqual(["credential unresolved"]);
});

test("D4 mixed: ok + transport failure → A's Mode: line AND B's per-card literal, no above-drafts literal", () => {
	const records = [
		rec({ callId: "c1", resolvedMode: "File", basis: OK_BASIS }),
		rec({ callId: "c2", basis: `gate call failed: ${NET_REASON}`, failure: { class: "network" } }),
	];
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("A", "c1"), mech("B", "c2")] }, records);
	expect(lines).toEqual([`Mode: File — ${OK_BASIS} — A (advisory)`, `gate call failed: ${NET_REASON}`]);
});

test("D4 two differing total-failure states → per-card literals only, no above-drafts line", () => {
	const records = [
		rec({ callId: "c1", basis: `gate call failed: ${NO_KEY_REASON}`, failure: { class: "no-api-key" } }),
		rec({ callId: "c2", basis: "gate call failed: HTTP 404: x", failure: { class: "http-404" } }),
	];
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("A", "c1"), mech("B", "c2")] }, records);
	expect(lines).toEqual(["credential unresolved", "model-card coming-soon"]);
});

// ---------------------------------------------------------------------------
// 12 — qualifier sourced from the record's advisory flag
// ---------------------------------------------------------------------------

test("qualifier: advisory true vs false → byte-differing lines, identical otherwise", () => {
	const advisory = rec({ callId: "c1", resolvedMode: "File", basis: OK_BASIS, advisory: true });
	const active = rec({ callId: "c1", resolvedMode: "File", basis: OK_BASIS, advisory: false });
	const a = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [advisory])[0];
	const b = renderFollowupLines({ mode: "active", candidates: [mech("T1", "c1")] }, [active])[0];
	expect(a).toBe(`Mode: File — ${OK_BASIS} — T1 (advisory)`);
	expect(b).toBe(`Mode: File — ${OK_BASIS} — T1 (active)`);
	expect(a).not.toBe(b);
});

test("qualifier coupling: a record under advisory rendered by the TOOL against a repo whose .council.json says active still renders (advisory)", async () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ev82-render-repo-"));
	fs.writeFileSync(path.join(repo, ".council.json"), JSON.stringify({ gate: { mode: "active" } }));
	// The ledger carries the ADVISORY-recorded decision; the config has since
	// flipped to active. The record is the audit truth.
	appendGateCall(
		{
			stateHash: "sha256:x",
			questionSetVersion: "q-1",
			questionIds: ["q1"],
			answers: {},
			resolvedMode: "File",
			policyVersion: "followup-decision-1",
			basis: OK_BASIS,
			advisory: true,
			callId: "c-adv-1",
		},
		repo,
	);
	// Capture the tool at registration — the gate-tool test's spy idiom.
	let tool: {
		execute: (id: string, params: unknown, signal: undefined, onUpdate: undefined, ctx: unknown) => Promise<unknown>;
	} | undefined;
	registerFollowupRenderTool({ registerTool: (t: never) => (tool = t) } as never, repo);
	const out = (await tool!.execute(
		"t1",
		{ result: { mode: "advisory", candidates: [mech("T1", "c-adv-1")] } },
		undefined,
		undefined,
		{ hasUI: false },
	)) as { details: { lines: string[] } };
	expect(out.details.lines).toEqual([`Mode: File — ${OK_BASIS} — T1 (advisory)`]);
});

// ---------------------------------------------------------------------------
// 13 — one line per candidate; verbatim 200-char title
// ---------------------------------------------------------------------------

test("exactly one line per candidate; a 200-char title renders all 200 chars, no ellipsis", () => {
	const long = "T".repeat(200);
	const records = [
		rec({ callId: "c1", resolvedMode: "File", basis: OK_BASIS }),
		rec({ callId: "c2", resolvedMode: "Drop", basis: "out of scope" }),
	];
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech(long, "c1"), mech("T2", "c2")] }, records);
	expect(lines.length).toBe(2);
	expect(lines[0]).toContain(long);
	expect(lines[0]).not.toContain("…");
	expect(lines[1]).toBe(`Mode: Drop — out of scope — T2 (advisory)`);
});

// ---------------------------------------------------------------------------
// 14 — off-literal input shape (skeptic O4)
// ---------------------------------------------------------------------------

test("off input shape: {mode:'off', candidates:[]} renders exactly ['off']", () => {
	expect(renderFollowupLines({ mode: "off", candidates: [] }, [])).toEqual(["off"]);
});

// ---------------------------------------------------------------------------
// 15 — reason flattening (skeptic O5)
// ---------------------------------------------------------------------------

test("reason flattening: a newline-bearing failure body renders as ONE line, newline → space, prefix intact", () => {
	const record = rec({
		callId: "c1",
		basis: "gate call failed: HTTP 500: boom\nsecond line\r\nthird",
		failure: { class: "http-500" },
	});
	const lines = renderFollowupLines({ mode: "advisory", candidates: [mech("T1", "c1")] }, [record]);
	expect(lines.length).toBe(1);
	expect(lines[0]).toBe("gate call failed: HTTP 500: boom second line third");
	expect(lines[0]).not.toContain("\n");
});

// ---------------------------------------------------------------------------
// 16 — D3 discriminator: every disposition × mode × target-supplied cell
// ---------------------------------------------------------------------------

test("D3: renderLine.includes(decisionLine(record)) holds for every disposition × mode × target-supplied cell", () => {
	for (const disposition of ["File", "Merge", "Drop"] as const) {
		for (const advisory of [true, false]) {
			for (const withTarget of [false, true]) {
				const record = rec({
					callId: "c1",
					resolvedMode: disposition,
					basis: "some basis",
					advisory,
				});
				const targets = withTarget && disposition === "Merge" ? { T1: "EV-90" } : undefined;
				const lines = renderFollowupLines(
					{ mode: advisory ? "advisory" : "active", candidates: [mech("T1", "c1", { boardIds: ["EV-90"] })] },
					[record],
					targets,
				);
				expect(lines.length).toBe(1);
				expect(lines[0]!.includes(decisionLine(record))).toBe(true);
			}
		}
	}
});

// ---------------------------------------------------------------------------
// 17 — render purity canary (skeptic O3): the module's own SOURCE carries no
// fs usage, no node:fs import, no gate-run/followup-tool import
// ---------------------------------------------------------------------------

test("render purity: followup-render.ts source has no fs usage and no gate-run/followup-tool import", () => {
	const source = fs.readFileSync(path.join(import.meta.dir, "..", "extensions", "followup-render.ts"), "utf-8");
	expect(source).not.toMatch(/node:fs/);
	expect(source).not.toMatch(/\bfs\./);
	expect(source).not.toContain("gate-run.ts");
	expect(source).not.toContain("followup-tool.ts");
});

// ---------------------------------------------------------------------------
// followupSuffix — exported for the byte tests
// ---------------------------------------------------------------------------

test("followupSuffix bytes: title, optional target arrow, qualifier", () => {
	expect(followupSuffix({ title: "T1", qualifier: "advisory" })).toBe(" — T1 (advisory)");
	expect(followupSuffix({ title: "T1", targetId: "EV-90", qualifier: "active" })).toBe(" — T1 → EV-90 (active)");
});
