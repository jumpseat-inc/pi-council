import * as fs from "node:fs";

export interface TranscriptBlock {
	kind: "user" | "assistant" | "thinking" | "toolCall" | "toolResult";
	text: string;
	detail?: string;
	label?: string;
	bytes?: number;
}

function firstLine(s: string): string {
	return s.split("\n")[0] ?? "";
}

function textOf(content: unknown): string {
	if (!Array.isArray(content)) return "";
	return (content as Array<{ type?: string; text?: string }>)
		.filter((p) => p.type === "text")
		.map((p) => p.text ?? "")
		.join("\n");
}

export function parseTranscript(raw: string): TranscriptBlock[] {
	const blocks: TranscriptBlock[] = [];
	for (const line of raw.split("\n")) {
		if (!line.trim()) continue;
		let e: any;
		try {
			e = JSON.parse(line);
		} catch {
			continue; // incomplete trailing line during live tail
		}
		if (e?.type !== "message") continue;
		const m = e.message;
		if (m?.role === "user") {
			blocks.push({ kind: "user", text: textOf(m.content) });
		} else if (m?.role === "assistant") {
			for (const part of (m.content ?? []) as Array<Record<string, any>>) {
				if (part.type === "thinking") {
					blocks.push({ kind: "thinking", text: firstLine(part.thinking ?? ""), detail: part.thinking ?? "" });
				} else if (part.type === "text" && part.text) {
					blocks.push({ kind: "assistant", text: part.text });
				} else if (part.type === "toolCall") {
					blocks.push({
						kind: "toolCall",
						label: String(part.name ?? "tool"),
						text: String(part.name ?? "tool"),
						detail: JSON.stringify(part.arguments ?? {}, null, 2),
					});
				}
			}
		} else if (m?.role === "toolResult") {
			const t = Array.isArray(m.content)
				? (m.content as Array<{ type?: string; text?: string }>)
						.map((c) => (c.type === "text" ? (c.text ?? "") : `[${c.type}]`))
						.join("\n")
				: "";
			blocks.push({ kind: "toolResult", label: String(m.toolName ?? "tool"), text: firstLine(t), detail: t, bytes: t.length });
		}
	}
	return blocks;
}

/** Incremental reader: parses bytes appended since the last poll;
 * holds an incomplete trailing line until it completes. */
export class TranscriptTail {
	private offset = 0;
	private partial = "";

	constructor(private file: string) {}

	poll(): TranscriptBlock[] {
		let stat: fs.Stats;
		try {
			stat = fs.statSync(this.file);
		} catch {
			return [];
		}
		if (stat.size <= this.offset) return [];
		const fd = fs.openSync(this.file, "r");
		const buf = Buffer.alloc(stat.size - this.offset);
		fs.readSync(fd, buf, 0, buf.length, this.offset);
		fs.closeSync(fd);
		this.offset = stat.size;
		const text = this.partial + buf.toString();
		const lines = text.split("\n");
		this.partial = lines.pop() ?? "";
		return parseTranscript(lines.join("\n"));
	}
}