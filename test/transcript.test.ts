import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { firstArgOf, lastActivity, parseTranscript, TranscriptTail } from "../extensions/transcript.ts";

const HEADER = `{"type":"session","version":3,"id":"job-1","timestamp":"t","cwd":"/x"}`;
const USER = `{"type":"message","id":"1","parentId":null,"timestamp":"t","message":{"role":"user","content":[{"type":"text","text":"do it"}]}}`;
const ASSISTANT = `{"type":"message","id":"2","parentId":"1","timestamp":"t","message":{"role":"assistant","content":[{"type":"thinking","thinking":"hmm\\nmore"},{"type":"toolCall","id":"c1","name":"bash","arguments":{"command":"ls"}},{"type":"text","text":"listing now"}]}}`;
const RESULT = `{"type":"message","id":"3","parentId":"2","timestamp":"t","message":{"role":"toolResult","toolCallId":"c1","toolName":"bash","content":[{"type":"text","text":"a.txt\\nb.txt"}],"isError":false}}`;

test("parseTranscript yields typed blocks in order", () => {
	const blocks = parseTranscript([HEADER, USER, ASSISTANT, RESULT].join("\n"));
	expect(blocks.map((b) => b.kind)).toEqual(["user", "thinking", "toolCall", "assistant", "toolResult"]);
	expect(blocks[0].text).toBe("do it");
	expect(blocks[1].text).toBe("hmm"); // collapsed first line
	expect(blocks[1].detail).toBe("hmm\nmore");
	expect(blocks[2].label).toBe("bash");
	expect(blocks[2].detail).toContain('"ls"');
	expect(blocks[3].text).toBe("listing now");
	expect(blocks[4].label).toBe("bash");
	expect(blocks[4].text).toBe("a.txt");
	expect(blocks[4].detail).toBe("a.txt\nb.txt");
	expect(blocks[4].bytes).toBe(11);
});

test("parseTranscript tolerates a trailing partial line", () => {
	const blocks = parseTranscript(USER + '\n' + '{"type":"message","id":"9","par');
	expect(blocks.map((b) => b.kind)).toEqual(["user"]);
});

const ISO_USER = `{"type":"message","id":"1","parentId":null,"timestamp":"2026-01-01T00:00:00.000Z","message":{"role":"user","content":[{"type":"text","text":"do it"}]}}`;
const ISO_RESULT = `{"type":"message","id":"3","parentId":"2","timestamp":"2026-01-01T00:00:00.050Z","message":{"role":"toolResult","toolCallId":"c1","toolName":"bash","content":[{"type":"text","text":"a.txt\\nb.txt"}],"isError":false}}`;

// EV-7: `at` is the ISO timestamp threaded through parseTranscript (falls back to message.timestamp).
test("parseTranscript preserves ISO at on each block", () => {
	const parsed = parseTranscript(ISO_USER + "\n" + ISO_RESULT);
	const user = parsed[0];
	const result = parsed[1];
	expect(user.at).toBe(Date.parse("2026-01-01T00:00:00.000Z"));
	expect(result.at).toBe(Date.parse("2026-01-01T00:00:00.050Z"));
});

test("lastActivity returns the max-at block; NaN-stamped fixtures have no last block", () => {
	const iso = parseTranscript(ISO_USER + "\n" + ISO_RESULT);
	expect(lastActivity(iso)?.kind).toBe("toolResult");
	const nanStamped = parseTranscript([HEADER, USER, ASSISTANT, RESULT].join("\n"));
	expect(lastActivity(nanStamped)).toBeUndefined();
});

// keeps the `at` surface out of the live-tail path that only reads new bytes
test("TranscriptTail blocks carry at", () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-tail-at-")), "s.jsonl");
	fs.writeFileSync(file, HEADER + "\n" + ISO_USER.replace("2026-01-01T00:00:00.000Z", "2026-01-01T00:00:30.000Z") + "\n");
	const tail = new TranscriptTail(file);
	expect(tail.poll()[0].at).toBe(Date.parse("2026-01-01T00:00:30.000Z"));
});

// EV-33: identity — two same-named calls whose results arrive OUT of order.
// Pairing by toolCallId is order-independent; a positional call[i]→result[i]
// pairing pairs c2's result body with c1's call and fails this assertion.
const OOO_CALL_1 = `{"type":"message","id":"10","parentId":null,"timestamp":"2026-01-01T00:00:00.000Z","message":{"role":"assistant","content":[{"type":"toolCall","id":"c1","name":"bash","arguments":{"command":"echo one"}}]}}`;
const OOO_CALL_2 = `{"type":"message","id":"11","parentId":null,"timestamp":"2026-01-01T00:00:01.000Z","message":{"role":"assistant","content":[{"type":"toolCall","id":"c2","name":"bash","arguments":{"command":"echo two"}}]}}`;
const OOO_RESULT_2 = `{"type":"message","id":"12","parentId":null,"timestamp":"2026-01-01T00:00:02.000Z","message":{"role":"toolResult","toolCallId":"c2","toolName":"bash","content":[{"type":"text","text":"two"}],"isError":false}}`;
const OOO_RESULT_1 = `{"type":"message","id":"13","parentId":null,"timestamp":"2026-01-01T00:00:03.000Z","message":{"role":"toolResult","toolCallId":"c1","toolName":"bash","content":[{"type":"text","text":"one"}],"isError":false}}`;

test("firstArgOf is the single derivation the tree row copy consumes", () => {
	const call = parseTranscript(OOO_CALL_1)[0];
	expect(firstArgOf(call)).toBe("echo one");
	// non-JSON / no-arg details degrade to ""
	expect(firstArgOf({ ...call, detail: undefined })).toBe("");
	expect(firstArgOf({ ...call, detail: "not json" })).toBe("");
});

test("parseTranscript pairs out-of-order same-name results by toolCallId, not position", () => {
	const blocks = parseTranscript([OOO_CALL_1, OOO_CALL_2, OOO_RESULT_2, OOO_RESULT_1].join("\n"));
	const calls = blocks.filter((b) => b.kind === "toolCall");
	const results = blocks.filter((b) => b.kind === "toolResult");
	expect(calls.map((c) => c.toolCallId)).toEqual(["c1", "c2"]);
	expect(results.map((r) => r.toolCallId)).toEqual(["c2", "c1"]); // arrival order
	// Pair by identity: c1's result carries c1's output, c2's carries c2's.
	// A positional call[i]→result[i] pairing gives c1→"two" and fails this.
	const byId = new Map(results.map((r) => [r.toolCallId, r]));
	expect(byId.get("c1")!.detail).toBe("one");
	expect(byId.get("c2")!.detail).toBe("two");
});

test("parseTranscript exposes error state on tool results", () => {
	const ok = `{"type":"message","id":"20","parentId":null,"timestamp":"2026-01-01T00:00:00.000Z","message":{"role":"toolResult","toolCallId":"c1","toolName":"bash","content":[{"type":"text","text":"fine"}],"isError":false}}`;
	const bad = `{"type":"message","id":"21","parentId":null,"timestamp":"2026-01-01T00:00:01.000Z","message":{"role":"toolResult","toolCallId":"c2","toolName":"bash","content":[{"type":"text","text":"boom"}],"isError":true}}`;
	const [okBlock, badBlock] = parseTranscript(ok + "\n" + bad);
	expect(okBlock.isError).toBe(false);
	expect(badBlock.isError).toBe(true);
});

test("TranscriptTail tolerates only new blocks and buffers partials", () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "council-tail-")), "s.jsonl");
	fs.writeFileSync(file, HEADER + "\n" + USER + "\n");
	const tail = new TranscriptTail(file);
	expect(tail.poll().map((b) => b.kind)).toEqual(["user"]);
	expect(tail.poll()).toEqual([]);
	// partial append: split RESULT mid-line
	fs.appendFileSync(file, RESULT.slice(0, 40));
	expect(tail.poll()).toEqual([]);
	fs.appendFileSync(file, RESULT.slice(40) + "\n");
	expect(tail.poll().map((b) => b.kind)).toEqual(["toolResult"]);
});