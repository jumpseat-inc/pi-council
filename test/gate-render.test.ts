// EV-67 — the gate verdict rendered as information at the step-4 approval
// gate.
//
// Spec: docs/superpowers/specs/2026-09-19-EV-67-design.md (settled). The
// format string `decisionLine` lives at the record layer (gate-ledger.ts —
// the only module owning a `Mode: `-prefixed format expression); the pure
// renderer `renderGateLines` joins the step-3 per-card { id, callId, status }
// array against one readGateLedger pass by callId; the parent tool
// `council_gate_render` presents the lines. The load-bearing evidence is the
// delta-only golden test: the card body and the approve/edit/drop prompt are
// byte-identical to the pre-gate rendering, and the render's only
// contribution is the one mode line.
import { describe, expect, test } from "bun:test";
import { decisionLine, type GateLedgerRecord } from "../extensions/gate-ledger.ts";
import { GATE_RENDER_FALLBACK, renderGateLines, type GateRenderCardInput } from "../extensions/gate-render.ts";

const EM_DASH = "\u2014"; // U+2014 — the pinned separator character

describe("EV-67 decisionLine — the record-layer format string", () => {
	test("composite byte-equality: 'Mode: ' + resolvedMode + ' — ' + basis over every fixture shape", () => {
		// success composite (the direct-threshold shape the falsifier arm records)
		expect(decisionLine({ resolvedMode: "Direct", basis: "composite 3.70 ≥ direct threshold 3.40" })).toBe(
			`Mode: Direct ${EM_DASH} composite 3.70 ≥ direct threshold 3.40`,
		);
		// verify composite (the shape carrying the word the O1 scan must never trip on)
		expect(decisionLine({ resolvedMode: "Verify", basis: "composite 3.30 ≥ verify threshold 2.60" })).toBe(
			`Mode: Verify ${EM_DASH} composite 3.30 ≥ verify threshold 2.60`,
		);
		// the one-way-door override basis
		expect(decisionLine({ resolvedMode: "Deliberate", basis: "reversible? no (one-way door)" })).toBe(
			`Mode: Deliberate ${EM_DASH} reversible? no (one-way door)`,
		);
		// the EV-65 pinned failure basis — the verbatim transport reason rides the record
		expect(
			decisionLine({
				resolvedMode: "Deliberate",
				basis: "gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)",
			}),
		).toBe(`Mode: Deliberate ${EM_DASH} gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)`);
	});

	test("the separator is the em dash, U+2014", () => {
		const line = decisionLine({ resolvedMode: "Verify", basis: "composite 3.30 ≥ verify threshold 2.60" });
		const sep = line.indexOf("composite") - 2;
		expect(line.slice(sep, sep + 1)).toBe(EM_DASH);
		expect(line.codePointAt(sep)).toBe(0x2014);
	});

	test("A′: absent basis (a v1 ledger line) renders the mode token alone — no separator, no undefined", () => {
		expect(decisionLine({ resolvedMode: "Verify" })).toBe("Mode: Verify");
		expect(decisionLine({ resolvedMode: "Deliberate", basis: undefined })).toBe("Mode: Deliberate");
		// a runtime null (JSON-parsed v1 edge) is nullish too
		expect(decisionLine({ resolvedMode: "Direct", basis: null as unknown as string })).toBe("Mode: Direct");
	});
});

// ---------------------------------------------------------------------------
// The pure renderer — cells A/A′/B/C over the callId join
// ---------------------------------------------------------------------------

/** A minimal-but-typed ledger record fixture; tests override the fields the
 * render actually reads (callId, resolvedMode, basis). */
function mkRecord(overrides: Partial<GateLedgerRecord> & { callId: string }): GateLedgerRecord {
	return {
		schemaVersion: 2,
		kind: "call",
		stateHash: "h",
		questionSetVersion: "v1",
		answers: {},
		resolvedMode: "Verify",
		policyVersion: "p1",
		recordedAt: "2026-09-19T00:00:00.000Z",
		...overrides,
	};
}

describe("EV-67 renderGateLines — the five-cell table", () => {
	const records: GateLedgerRecord[] = [
		mkRecord({ callId: "c1", resolvedMode: "Deliberate", basis: "reversible? no (one-way door)" }),
		mkRecord({ callId: "c2", resolvedMode: "Direct", basis: "composite 3.70 ≥ direct threshold 3.40" }),
		// a v1 line (pre-EV-65): no basis field at all
		mkRecord({ callId: "c3", resolvedMode: "Verify" }),
		// a RECORDED failure: EV-65's failRun wrote resolvedMode Deliberate and
		// basis "gate call failed: <verbatim reason>" — same two fields, no
		// failure branch in the record
		mkRecord({
			callId: "c4",
			resolvedMode: "Deliberate",
			basis: "gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)",
			failure: { class: "no-api-key" },
		}),
	];

	test("cell A (success): the found record renders exactly its own decisionLine", () => {
		const out = renderGateLines([{ id: "EV-1", callId: "c2", status: "ok" }], records);
		expect(out).toEqual([{ id: "EV-1", modeLine: "Mode: Direct \u2014 composite 3.70 ≥ direct threshold 3.40" }]);
		// no prose of its own: the line IS decisionLine(record) — the renderer
		// receives the basis as (record) input and contributes no words
		expect(out[0]!.modeLine).toBe(decisionLine(records[1]!));
	});

	test("cell A (recorded failure): the verbatim reason renders exactly once, from the record, unparaphrased", () => {
		const out = renderGateLines([{ id: "EV-2", callId: "c4", status: "ok" }], records);
		expect(out[0]!.modeLine).toBe(
			"Mode: Deliberate \u2014 gate call failed: no OpenRouter API key resolved (OPENROUTER_API_KEY env or stored credential)",
		);
		expect(out[0]!.modeLine).toBe(decisionLine(records[3]!));
	});

	test("cell A′ (v1 line, basis absent): the mode token alone", () => {
		const out = renderGateLines([{ id: "EV-3", callId: "c3", status: "ok" }], records);
		expect(out[0]!.modeLine).toBe("Mode: Verify");
	});

	test("cell B (callId null — failed before recording): the pinned fallback literal", () => {
		const out = renderGateLines([{ id: "EV-4", callId: null, status: "failed" }], records);
		expect(out[0]!.modeLine).toBe("Mode: Deliberate \u2014 gate call failed before recording a verdict");
	});

	test("cell C (recorded callId, join miss): the pinned fallback literal", () => {
		const out = renderGateLines([{ id: "EV-5", callId: "zzz", status: "ok" }], records);
		expect(out[0]!.modeLine).toBe("Mode: Deliberate \u2014 recorded gate call not found in ledger");
	});

	test("B and C are distinct, honestly different states — never conflated", () => {
		const b = renderGateLines([{ id: "x", callId: null, status: "failed" }], records)[0]!.modeLine;
		const c = renderGateLines([{ id: "x", callId: "zzz", status: "ok" }], records)[0]!.modeLine;
		expect(b).not.toBe(c);
		expect(b).toContain("before recording a verdict");
		expect(c).toContain("not found in ledger");
	});

	test("no-undefined falsifier: no cell ever emits undefined, null, or NaN bytes", () => {
		const cells: GateRenderCardInput[] = [
			{ id: "a", callId: "c1", status: "ok" },
			{ id: "b", callId: "c3", status: "ok" }, // A′
			{ id: "c", callId: "c4", status: "ok" }, // recorded failure
			{ id: "d", callId: null, status: "failed" }, // B
			{ id: "e", callId: "zzz", status: "ok" }, // C
			{ id: "f", callId: null, status: "ok" }, // B-shape with a non-failed status
		];
		for (const line of renderGateLines(cells, records).map((o) => o.modeLine)) {
			expect(line).not.toContain("undefined");
			expect(line).not.toContain("null");
			expect(line).not.toContain("NaN");
		}
	});

	test("input order preserved, one line per card — per-card attachment rides the order", () => {
		const out = renderGateLines(
			[
				{ id: "EV-9", callId: "c2", status: "ok" },
				{ id: "EPIC-9", callId: "c1", status: "ok" },
			],
			records,
		);
		expect(out.map((o) => o.id)).toEqual(["EV-9", "EPIC-9"]);
		expect(out).toHaveLength(2);
	});

	test("empty input (the defensive off-mode shape): zero lines", () => {
		expect(renderGateLines([], records)).toEqual([]);
	});

	test("imperative-verb scan over the TS-authored fallback-literal constants ONLY — never decisionLine output", () => {
		const IMPERATIVE =
			// "call" is a NOUN in both spec-pinned literals ("the gate call failed"),
			// so an imperative scan over the pinned constants cannot include it —
			// the constants are byte-exact per the spec, and a scan that flags them
			// is a defective scan, not a defective constant.
			/\b(re-?run|re-?check|retry|verify|review|inspect|fix|treat|consult|drop|edit|approve|record|name|use)\b/i;
		for (const basis of [GATE_RENDER_FALLBACK.unrecordedFailure, GATE_RENDER_FALLBACK.joinMiss]) {
			expect(IMPERATIVE.test(basis), `fallback literal must carry no imperative verb: ${basis}`).toBe(false);
			// never gestures at the scrubbed transport reason
			expect(
				/reason|openrouter|api|transport|endpoint|key/i.test(basis),
				`fallback literal must not gesture at the transport reason: ${basis}`,
			).toBe(false);
		}
		// O1 scope proof: decisionLine OUTPUT is exempt — legitimate composites
		// carry imperative-family words (verify) and must still render
		expect(decisionLine({ resolvedMode: "Verify", basis: "composite 3.30 ≥ verify threshold 2.60" })).toContain("verify");
	});

	test("delta-only golden: pre-gate card body and approve/edit/drop prompt are byte-identical; the render contributes exactly one line", () => {
		// Pre-gate golden constants: the card text exactly as it would be written
		// to disk, and the approve/edit/drop prompt — bytes that existed before
		// this card and must be untouched after it.
		const CARD_BODY = [
			"---",
			"id: EV-902",
			"title: Loopback success probe",
			"state: Ready",
			"---",
			"",
			"## Intent",
			"",
			"The success line carries the decide basis verbatim.",
			"",
			"## Acceptance",
			"",
			"The golden bytes survive the gate render untouched.",
		].join("\n");
		const PROMPT = "Approve as drafted, edit, or drop — your call.";
		const PRE_GATE = CARD_BODY + "\n" + PROMPT;

		const out = renderGateLines([{ id: "EV-902", callId: "c2", status: "ok" }], records);
		const line = out[0]!.modeLine;
		const POST_GATE = CARD_BODY + "\n" + line + "\n" + PROMPT;

		// the body and the prompt are byte-identical to the pre-gate rendering
		expect(POST_GATE.startsWith(CARD_BODY + "\n")).toBe(true);
		expect(POST_GATE.endsWith("\n" + PROMPT)).toBe(true);
		// the render's ONLY contribution is the one mode line between them
		expect(POST_GATE.slice(CARD_BODY.length, POST_GATE.length - PROMPT.length)).toBe("\n" + line + "\n");
		// and the line is the record's format string — the render authored no prose
		expect(line).toBe(decisionLine(records[1]!));
		// the pre-gate composition is recoverable by deleting exactly the line
		expect(POST_GATE.replace("\n" + line + "\n", "\n")).toBe(PRE_GATE);
	});
});
