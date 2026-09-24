/**
 * EV-90 — pass renderProcedure-substituted council.md and features-deliver.md
 * into the council-runner dispatch.
 *
 * Spec: docs/superpowers/specs/2026-09-24-EV-90-design.md (§§1–6). The
 * D1-epic-null ruling recorded on council/cards/EV-90.md is binding: a null or
 * absent `epic:` field is a fail-loud refusal naming the card; no-throw
 * variants (un-substituted or omitted overlay) are rejected.
 *
 * Pure, ms-scale, no network (test-suite-budget). Load-bearing assertions
 * first — byte-identity against renderProcedure is asserted IN ADDITION to
 * substituted-substring assertions, never instead (skeptic job-9.5 item 6:
 * byte-identity alone is tautological and cannot red a wrong args binding).
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import {
	composeRunnerInput,
	proceduresDir,
	PKG_ROOT,
	renderProcedure,
} from "../extensions/seats.ts";
import { getHub, initHubIdentity, registerHubTools, shutdownHub } from "../extensions/hub-tools.ts";

const STUB = path.join(import.meta.dir, "stub-child.ts");

function tmpRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "ev90-"));
}

/** A minimal card face; `epic === undefined` writes a face with no epic line. */
function writeCardFace(root: string, cardId: string, epic: string | null | undefined): void {
	fs.mkdirSync(path.join(root, "council", "cards"), { recursive: true });
	const epicLine = epic === undefined ? "" : `epic: ${epic}\n`;
	fs.writeFileSync(
		path.join(root, "council", "cards", `${cardId}.md`),
		`---\nid: ${cardId}\n${epicLine}state: In Progress\n---\nface body`,
	);
}

function readPackagedBody(name: string): string {
	return fs
		.readFileSync(path.join(PKG_ROOT, "council", "procedures", name), "utf-8")
		.replace(/^---\n[\s\S]*?\n---\n/, "");
}

// ================= §6.1 — per-file override falsifier =================

test("EV-90 §6.1: per-file override-first — override council.md + packaged features-deliver.md", () => {
	const root = tmpRepo();
	const ov = path.join(root, CONFIG_DIR_NAME, "council", "procedures");
	fs.mkdirSync(ov, { recursive: true });
	fs.writeFileSync(
		path.join(ov, "council.md"),
		"---\ndescription: override sentinel\n---\nOVERRIDE-COUNCIL-SENTINEL on `council/cards/$ARGUMENTS.md`",
	);
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "do the work");
	// the override council body — stripped AND substituted with the card id
	expect(composed).toContain("OVERRIDE-COUNCIL-SENTINEL on `council/cards/EV-90.md`");
	// the strip applied to the override too
	expect(composed).not.toContain("description: override sentinel");
	// packaged features-deliver body still resolves (per-file, never half-mixing)
	expect(composed).toContain("You are the orchestrator delivering `EPIC-23` autonomously");
	// the packaged council.md body is NOT included
	expect(composed).not.toContain("You are the facilitator of a Council run on card");
});

// ================= §6.2 — two-args non-tautology =================

test("EV-90 §6.2: two-args binding — card id renders council.md, epic renders features-deliver.md", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "task");
	expect(composed).toContain("council/cards/EV-90.md");
	expect(composed).not.toContain("council/cards/EPIC-23.md");
	expect(composed).toContain("delivering `EPIC-23` autonomously");
	expect(composed).toContain("every card in `EPIC-23`'s scope");
	expect(composed).not.toContain("delivering EV-90 autonomously");
});

// Byte-identity asserted IN ADDITION to the load-bearing substrings above —
// per body with its OWN args, as contiguous substrings in block order.
test("EV-90 §6.2b: bodies byte-identical to renderProcedure output, per body with its own args, in order", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const composed = composeRunnerInput(root, "EV-90", "the task text");
	const procDir = proceduresDir(root);
	const councilRender = renderProcedure(readPackagedBody("council.md"), procDir, "EV-90");
	const featuresRender = renderProcedure(readPackagedBody("features-deliver.md"), procDir, "EPIC-23");
	expect(composed).toContain(councilRender);
	expect(composed).toContain(featuresRender);
	expect(composed.indexOf(councilRender)).toBeLessThan(composed.indexOf(featuresRender));
});

// ================= §6.3 — verbatim $& tail + frontmatter strip =================

test("EV-90 §6.3: $&-bearing task text appears exactly once, unmodified, as the <task> tail; strip holds", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-23");
	const task = 'resume card EV-90 with $& and $1 metachars "quoted" and\na newline';
	const composed = composeRunnerInput(root, "EV-90", task);
	// the tail is the last block, byte-verbatim
	expect(composed.endsWith(`<task>\n${task}\n</task>`)).toBe(true);
	// exactly once (the $& metachar must not have been consumed by any .replace)
	expect(composed.indexOf(task)).toBeGreaterThanOrEqual(0);
	expect(composed.indexOf(task, composed.indexOf(task) + 1)).toBe(-1);
	// the scan's frontmatter strip applied to both bodies
	expect(composed).not.toMatch(/^description:/m);
	expect(composed).not.toMatch(/^argument-hint:/m);
	// no unresolved $ARGUMENTS anywhere in the composed input
	expect(composed.includes("$ARGUMENTS")).toBe(false);
});

// ================= §6.4 — epic derivation + the D1 ruling throw =================

test("EV-90 §6.4: epic key derived from the face; epic: null/absent throws naming the card", () => {
	const root = tmpRepo();
	writeCardFace(root, "EV-90", "EPIC-9");
	expect(composeRunnerInput(root, "EV-90", "t")).toContain("delivering `EPIC-9` autonomously");

	const nullRoot = tmpRepo();
	writeCardFace(nullRoot, "EV-45", null);
	expect(() => composeRunnerInput(nullRoot, "EV-45", "t")).toThrow(/EV-45/);

	// absent epic line — the same refusal
	const absentRoot = tmpRepo();
	writeCardFace(absentRoot, "EV-46", undefined);
	expect(() => composeRunnerInput(absentRoot, "EV-46", "t")).toThrow(/EV-46/);
});

// ================= §6.5 — placement / re-export / no-cycle =================

test("EV-90 §6.5: renderProcedure defined once in seats.ts, re-exported from index.ts, no cycle edges", () => {
	const seatsSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "seats.ts"), "utf-8");
	const indexSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "index.ts"), "utf-8");
	const hubToolsSrc = fs.readFileSync(path.join(PKG_ROOT, "extensions", "hub-tools.ts"), "utf-8");
	expect(seatsSrc).toContain("export function renderProcedure");
	expect(indexSrc).not.toContain("export function renderProcedure");
	expect(indexSrc).toMatch(/export\s*\{\s*renderProcedure\s*\}/);
	expect(seatsSrc.includes('from "./index.ts"')).toBe(false);
	expect(hubToolsSrc.includes('from "./index.ts"')).toBe(false);
});

// ================= §6.6 — AC3 prose pins (EV-89 precedent) =================

test("EV-90 §6.6: council-runner <procedure> block names the in-input blocks; read-in-full instruction gone", () => {
	const seatSrc = fs.readFileSync(path.join(PKG_ROOT, "council", "agents", "council-runner.md"), "utf-8");
	const norm = seatSrc.replace(/\s+/g, " ");
	// the read-in-full instruction is gone (normalized: it wrapped across lines)
	expect(norm).not.toContain("read `council.md` and `features-deliver.md` from the procedures directory");
	expect(norm).not.toContain("Before doing anything else, read");
	// the in-input block names are present
	expect(seatSrc).toContain("<council-procedure>");
	expect(seatSrc).toContain("<features-deliver-overlay>");
	expect(seatSrc).toContain("<task>");
	// byte-anchored survivors
	expect(seatSrc).toContain("**Skip step 0 (preflight).**");
	expect(seatSrc).toContain("Everything else in council.md applies as written");
	// the escalation Phase-1 class-list pointer stays (AC3 scopes only the <procedure> block)
	expect(seatSrc).toContain("council/procedures/features-deliver.md");
});

// ================= §6.7 — card_id contract at the council_dispatch seam =====

/**
 * The test/override.test.ts harness pattern: the REAL registerHubTools tool
 * registration against a fake pi ExtensionAPI + modelRegistry; hub.spawnJob
 * (and respawn, for the retry test) wrapped to capture argv and run the repo's
 * stub child so no pi binary or network is involved.
 */
function makeDispatcher(
	root: string,
	catalogue: string[],
	opts: {
		policy?: { enabled: boolean; maxAttempts: number; baseDelayMs: number; maxDelayMs: number; jitter: boolean };
		flaky?: { state: string; failTimes: string };
	} = {},
): {
	dispatch: (params: Record<string, unknown>) => Promise<Record<string, any>>;
	spawns: Array<{ args: string[]; env: Record<string, string> }>;
	respawns: Array<{ args: string[] }>;
	hub: ReturnType<typeof getHub>;
} {
	const spawns: Array<{ args: string[]; env: Record<string, string> }> = [];
	const respawns: Array<{ args: string[] }> = [];
	let dispatchTool:
		| {
				execute: (
					id: unknown,
					params: unknown,
					signal: unknown,
					onUpdate: unknown,
					ctx: unknown,
				) => Promise<Record<string, any>>;
		  }
		| undefined;
	const pi: unknown = {
		registerTool: (t: {
			name: string;
			execute: (
				id: unknown,
				params: unknown,
				signal: unknown,
				onUpdate: unknown,
				ctx: unknown,
			) => Promise<Record<string, any>>;
		}) => {
			if (t.name === "council_dispatch") dispatchTool = { execute: t.execute };
		},
	};
	registerHubTools(pi as never, root, opts.policy ? ({ retryPolicy: () => opts.policy } as never) : {});
	const hub = getHub(root);
	const realSpawn = hub.spawnJob.bind(hub);
	(hub as unknown as { spawnJob: (o: Record<string, unknown>) => unknown }).spawnJob = (o: Record<string, unknown>) => {
		const env = opts.flaky
			? {
					...(o.env as Record<string, string>),
					STUB_MODE: "flaky",
					STUB_STATE: opts.flaky.state,
					STUB_FAIL_TIMES: opts.flaky.failTimes,
				}
			: (o.env as Record<string, string>);
		spawns.push({ args: o.args as string[], env });
		return realSpawn({ ...o, command: "bun", args: [STUB], env } as Parameters<typeof realSpawn>[0]);
	};
	const realRespawn = hub.respawn.bind(hub);
	(hub as unknown as { respawn: (id: string, s: Record<string, unknown>) => unknown }).respawn = (
		id: string,
		s: Record<string, unknown>,
	) => {
		const env = opts.flaky
			? {
					...(s.env as Record<string, string>),
					STUB_MODE: "flaky",
					STUB_STATE: opts.flaky.state,
					STUB_FAIL_TIMES: opts.flaky.failTimes,
				}
			: (s.env as Record<string, string>);
		respawns.push({ args: s.args as string[] });
		return realRespawn(id, { ...s, command: "bun", args: [STUB], env } as unknown as Parameters<typeof realRespawn>[1]);
	};
	if (!dispatchTool) throw new Error("council_dispatch was not registered");
	const ctx = { modelRegistry: { getAvailable: () => catalogueFor(catalogue) } };
	return {
		dispatch: (params) => dispatchTool!.execute(null, params, undefined, undefined, ctx),
		spawns,
		respawns,
		hub,
	};
}

function catalogueFor(qualified: string[]): Array<{ provider: string; id: string }> {
	return qualified.map((q) => {
		const slash = q.indexOf("/");
		if (slash === -1) throw new Error(`test fixture model must be qualified: ${q}`);
		return { provider: q.slice(0, slash), id: q.slice(slash + 1) };
	});
}

function writeRepoSeat(root: string, name: string): void {
	const dir = path.join(root, CONFIG_DIR_NAME, "agents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, `${name}.md`),
		`---\nname: ${name}\ndescription: test\nmodel: openrouter/test/model\ntools: Read\n---\nunit-test body`,
	);
}

const SHELL_COUNCIL_EVAL_MODEL = process.env.COUNCIL_EVAL_MODEL;

beforeEach(() => {
	delete process.env.COUNCIL_EVAL_MODEL;
});

afterEach(() => {
	shutdownHub();
	if (SHELL_COUNCIL_EVAL_MODEL === undefined) delete process.env.COUNCIL_EVAL_MODEL;
	else process.env.COUNCIL_EVAL_MODEL = SHELL_COUNCIL_EVAL_MODEL;
});

test("EV-90 §6.7: runner dispatch without card_id → refusal naming param + seat; non-runner unchanged; runner with card_id composes", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "council-runner");
	writeRepoSeat(root, "agent-s");
	initHubIdentity("run-ev90a");
	const { dispatch, spawns } = makeDispatcher(root, ["openrouter/test/model"]);

	// runner dispatch without card_id → refusal naming the parameter and the seat
	const refused = await dispatch({ seat: "council-runner", input: "do card work" });
	expect(refused.isError).toBe(true);
	expect(String(refused.content[0].text)).toContain("card_id");
	expect(String(refused.content[0].text)).toContain("council-runner");
	expect(spawns).toHaveLength(0);

	// epic-null card face at the tool seam: refusal names the card, nothing spawns
	writeCardFace(root, "EV-47", null);
	const epicNull = await dispatch({ seat: "council-runner", input: "do card work", card_id: "EV-47" });
	expect(epicNull.isError).toBe(true);
	expect(String(epicNull.content[0].text)).toContain("EV-47");
	expect(spawns).toHaveLength(0);

	// non-runner dispatch without card_id: raw input, byte-identical to today (AC5)
	const plain = await dispatch({ seat: "agent-s", input: "raw task $& text" });
	expect(plain.isError).toBeFalsy();
	expect(spawns[0]!.args[spawns[0]!.args.length - 1]).toBe("raw task $& text");

	// runner dispatch with card_id: composed input reaches the child argv
	writeCardFace(root, "EV-90", "EPIC-23");
	const ok = await dispatch({ seat: "council-runner", input: "do card work", card_id: "EV-90" });
	expect(ok.isError).toBeFalsy();
	const tail = spawns[1]!.args[spawns[1]!.args.length - 1];
	expect(tail).toContain("<council-procedure>");
	expect(tail).toContain("You are the orchestrator delivering `EPIC-23` autonomously");
	expect(tail).toContain("<task>\ndo card work\n</task>");
});

// ================= §6.8 — retry byte-identity =================

test("EV-90 §6.8: retry attempt carries byte-identical composed input", async () => {
	const root = tmpRepo();
	writeRepoSeat(root, "council-runner");
	writeCardFace(root, "EV-90", "EPIC-23");
	initHubIdentity("run-ev90b");
	// Real retry supervisor armed via registerHubTools opts; attempt 1 fails
	// retryably once via the flaky stub (the test/job-retry.test.ts pattern).
	const policy = { enabled: true, maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 2, jitter: false };
	const state = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ev90-flaky-")), "state.json");
	const { dispatch, spawns, respawns, hub } = makeDispatcher(root, ["openrouter/test/model"], {
		policy,
		flaky: { state, failTimes: "1" },
	});
	const res = await dispatch({ seat: "council-runner", input: "do card work", card_id: "EV-90" });
	expect(res.isError).toBeFalsy();
	const id = res.details.jobId as string;
	const [r] = await hub.wait([id], 10_000);
	expect(r.state).toBe("done");
	// attempt 2 respawned exactly once, carrying the SAME composed input bytes
	expect(respawns).toHaveLength(1);
	const initialTail = spawns[0]!.args[spawns[0]!.args.length - 1];
	const retryTail = respawns[0]!.args[respawns[0]!.args.length - 1];
	expect(retryTail).toBe(initialTail);
	expect(retryTail).toContain("<council-procedure>");
	expect(retryTail).toContain("You are the orchestrator delivering `EPIC-23` autonomously");
	expect(retryTail).toContain("<task>\ndo card work\n</task>");
	// the two attempts differ only in session id
	const sid = (args: string[]) => args[args.indexOf("--session-id") + 1];
	expect(sid(respawns[0]!.args)).toBe(`${id}-attempt2`);
	expect(sid(spawns[0]!.args)).toBe(id);
}, 15_000);
