import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { TranscriptView, type NavTheme } from "../extensions/navigator.ts";

// EV-34: each tool call and its own result render as ONE composed unit in the
// inline progress transcript body (R-COPY): head `→ <Tool>  <primary-arg>`
// (warning), a failed result appends muted ✗ to that head, the result body
// sits indented 2 spaces beneath the head only when expanded, the collapsed
// state shows only the composed head. Legacy blocks without identity fields
// and unpaired results still render without throwing.

const theme: NavTheme = { fg: (_c, s) => s, bold: (s) => s, bg: (_c, s) => s };

function header(id: string): string {
	return `{"type":"session","version":3,"id":"${id}","timestamp":"t","cwd":"/x"}`;
}

function callLine(name: string, arg: string, id?: string): string {
	const idPart = id != null ? `"id":"${id}",` : "";
	return `{"type":"message","id":"m-${name}-${arg}","parentId":null,"timestamp":"t","message":{"role":"assistant","content":[{${idPart}"type":"toolCall","name":"${name}","arguments":{"command":"${arg}"}}]}}`;
}

function resultLine(callId: string | undefined, text: string, isError?: boolean): string {
	const idPart = callId != null ? `"toolCallId":"${callId}",` : "";
	const errPart = isError != null ? `,"isError":${isError}` : "";
	return `{"type":"message","id":"r-${text}","parentId":null,"timestamp":"t","message":{"role":"toolResult",${idPart}"toolName":"bash","content":[{"type":"text","text":"${text}"}]${errPart}}}`;
}

function fixtureView(name: string, lines: string[]): TranscriptView {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), `ev34-${name}-`)), "s.jsonl");
	fs.writeFileSync(file, [header(name), ...lines].join("\n") + "\n");
	return new TranscriptView(file, theme, `${name} owner`, 24, () => {});
}

test("EV-34: a tool call and its result render as one composed unit at width 80", () => {
	const view = fixtureView("pair", [
		callLine("bash", "echo one", "c1"),
		resultLine("c1", "one", false),
		callLine("bash", "echo two", "c2"),
		resultLine("c2", "boom", true),
	]);
	const collapsed = view.render(80);
	// composed head names the tool and its primary argument (two spaces)
	const okHead = collapsed.find((l) => l.includes("→ bash  echo one"));
	expect(okHead).toBeDefined();
	expect(okHead!.includes("✗")).toBe(false); // successful call: no failure mark
	const badHead = collapsed.find((l) => l.includes("→ bash  echo two"));
	expect(badHead).toBeDefined();
	expect(badHead!.includes("✗")).toBe(true); // failed result: muted ✗ on the head
	// folded: the paired results are NOT separate units, and the failed
	// result's body is hidden until expanded
	expect(collapsed.join("\n")).not.toMatch(/⎿ bash/);
	expect(collapsed.join("\n")).not.toContain("boom");
	expect(collapsed.some((l) => l.trim() === "one")).toBe(false); // no result body leaked as a line
	// expand the failed unit: its result body sits indented 2 spaces beneath
	view.handleInput("\x1b[B"); // down → focus the second (failed) unit
	view.handleInput("e");
	const expanded = view.render(80);
	const body = expanded.find((l) => l.trim() === "boom");
	expect(body).toBeDefined();
	expect(body!.startsWith("  ")).toBe(true);
	view.dispose();
});

test("EV-34: a legacy fixture with no identity fields renders without throwing", () => {
	const view = fixtureView("legacy", [callLine("bash", "ls"), resultLine(undefined, "done")]);
	const lines = view.render(80); // must not throw
	expect(lines.some((l) => l.includes("→ bash  ls"))).toBe(true);
	// an unpaired result stays its own unit
	expect(lines.join("\n")).toContain("⎿ bash");
	expect(lines.join("\n")).not.toContain("✗"); // no isError → no failure mark
	view.dispose();
});

test("EV-34: an unpaired failed result renders its own unit and keeps the ✗ mark", () => {
	const view = fixtureView("unpaired", [resultLine("c", "boom", true)]);
	const collapsed = view.render(80);
	const head = collapsed.find((l) => l.includes("⎿ bash"));
	expect(head).toBeDefined();
	expect(head!.includes("✗")).toBe(true);
	view.handleInput("\x1b[B");
	view.handleInput("e");
	expect(view.render(80).some((l) => l.trim() === "boom")).toBe(true);
	view.dispose();
});

test("EV-34: inline empty state is worded (waiting for output · idle); no-file stays (no transcript)", () => {
	const view = fixtureView("empty", []);
	expect(view.render(80).some((l) => l.includes("(waiting for output · idle)"))).toBe(true);
	view.dispose();
	const noFile = new TranscriptView(undefined, theme, "job-9 owner", 24, () => {});
	expect(noFile.render(80).some((l) => l.includes("(no transcript)"))).toBe(true);
	noFile.dispose();
});
