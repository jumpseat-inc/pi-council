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
import { decisionLine } from "../extensions/gate-ledger.ts";

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
