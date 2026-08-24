import { test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseTranscript, TranscriptTail } from "../extensions/transcript.ts";

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

test("TranscriptTail returns only new blocks per poll and buffers partials", () => {
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