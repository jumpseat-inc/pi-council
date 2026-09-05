# FLLWUP-9: Explicit clear-thinking-override affordance for a seat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit clear operation to the `.council.json` writer that removes a seat's `thinking` override (or its whole `council.<seat>` entry when asked) via a byte-region splice, proven by a round-trip test that clears an existing override and byte-asserts the resulting config — while `absence` continues to mean `preserve` everywhere else and the loader is untouched.

**Architecture:** `extensions/council-config-writer.ts` gains a second exported function, `clearSeatOverride({ repoRoot, seat, what })`, sitting beside `writeSeatOverride` and reusing its infrastructure (`parseValue` span scan, `skipSpace`, `existingMode`, `writeAtomic`, the `WriteSeatOverrideResult` type). Clearing is a *removal* splice, not a write of a selection: it never needs `model`/`catalogue` and does not inherit `writeSeatOverride`'s model validation. A small new pure helper, `removeMemberEdit`, produces the byte region that removes one object member (trailing-comma-aware, per valid JSON output); `clearThinkingEdits` composes the disjoint edits that strip every loader-resolvable thinking carrier; `applyEdits` applies disjoint edits highest-offset-first so lower offsets stay valid. The loader (`extensions/seats.ts` `loadCouncilConfig`/`applySeatOverride`) is the reference and is NOT changed.

**Thinking-carrier parity (the crux):** `applySeatOverride` (`extensions/seats.ts:407-429`) resolves a seat's effective thinking as `explicit "thinking" key > ":suffix" parsed off the model > frontmatter fallback`. The clear's round-trip proof requires `loadCouncilConfig` to no longer return the cleared override — so `what: "thinking"` must remove BOTH carriers: the explicit `thinking` member (when the seat value is an object) AND a known `THINKING_LEVELS` `:suffix` on the model string (same predicate as FLLWUP-10's `existingThinking`: `lastIndexOf(":")` with `colon > 0` and `THINKING_LEVELS.has(suffix)`; an unknown suffix is not a level and is left untouched). A string-shorthand seat value `"provider/id:level"` carries no separable member — there the `:suffix` IS the thinking, and the clear strips it from the string, keeping the shorthand form.

**Tech Stack:** TypeScript (strict, target es2022), bun + bun:test. No new dependencies.

**Spec:** Card FLLWUP-9 (EPIC-6), mechanical-path handoff — the card's Intent, goal, Acceptance, and the binding Phase-1 ruling R-1 (writer-level clear operation on `extensions/council-config-writer.ts` + round-trip test; NO modal UI change, NO new user-visible copy). Wiki ground: `vault/wiki/council-config-writer.md` (byte-region splice seam), `vault/wiki/council-config.md` (override precedence `thinking key > :suffix > frontmatter`), `vault/wiki/gate-parity.md`.

## Global Constraints

- Single seam: `extensions/council-config-writer.ts` + `test/council-config-writer.test.ts`. Do NOT touch `extensions/seats.ts` (the loader is the reference), `council/board.md`, `council/cards/*.md`, `vault/`, or any other file.
- `thinking: null` is NOT the clear — the loader throws on it. The clear is a distinct explicit operation (`clearSeatOverride`), and absence keeps meaning preserve everywhere else: `writeSeatOverride`'s field-level merge, and FLLWUP-10's `existingThinking` carriage, are byte-for-byte unchanged (existing tests stay green untouched).
- Every post-clear file must be loadable by `loadCouncilConfig` (spliced region must be valid JSON), and the splice must leave the `theme` section, every other seat, unknown top-level keys, indentation, and trailing newline byte-identical.
- Final byte output of each clear is deterministic and asserted exactly (full-file equality where the expected text is computable), not just "loads fine".
- TDD: new behavior needs failing tests first; watch them fail with the expected reason (function missing) before implementing. Pre-existing 2 skips (env-dependent integration suite) untouched.
- Commits MUST be Conventional Commits (`feat(council-config-writer): ...`, `docs(superpowers): ...`); no history rewriting; never work on `main`.
- Gates, in order, none lowered: `bun install --frozen-lockfile` (exit 0, lockfile unchanged), `bunx tsc --noEmit` (exit 0), `bun test` (whole suite green; 2 skips expected), `python3 council/validate.py` ("All council artifacts valid").
- Clean tree hygiene: no stray/throwaway `test/*.ts` files — every probe either lands in a commit or is deleted before finishing.

## Regime decisions (the four the card asks to make explicit, tested)

1. **Seat exists as object** (`{"model": ..., "thinking": ...}`):
   - `what: "thinking"` — remove the `thinking` member's byte region (trailing/leading-comma-aware via `removeMemberEdit`); AND strip a known `:suffix` from the `model` member's string value (loader parity). If removing leaves an empty object (thinking-only override with no model), re-emit the seat value span as `{}`. No carrier present at all → no-op (`{ok: true}`, no write).
   - `what: "seat"` — remove the whole seat member from `council`.
2. **Seat exists as string shorthand** (`"provider/id:medium"`):
   - `what: "thinking"` — the value string has no separable `thinking` member; the `:suffix` IS the thinking carrier. Strip the known `:suffix` from the value string, keeping the shorthand form (minimal byte change; the model override is preserved). Shorthand with no known suffix → no-op (nothing to clear; absence means preserve).
   - `what: "seat"` — remove the whole seat member.
3. **Seat absent** (council present without the seat, council section absent, or file absent): **no-op `{ok: true}`, writes nothing** (file byte-identical, mtime unchanged). Chosen over error: clearing an already-clear override is idempotent and harmless; an error would force callers to pre-check existence. Only genuinely broken input refuses: malformed JSON or non-object root/council → `{ok: false, error}` naming the file, nothing written (same refusal contract as `writeSeatOverride`).
4. **Seat is the last member in council** (`what: "seat"` empties `council`): re-emit the `council` value span as `{}`, leaving `"council": {}`. Chosen over deleting the council member entirely — less destructive (the section marker stays, the file stays trivially loadable: `loadCouncilConfig` iterates zero entries → `{}`).

---

### Task 1: `clearSeatOverride` — explicit clear of a seat's thinking override or whole entry

**Files:**
- Modify: `extensions/council-config-writer.ts` (append exports + helpers near `writeSeatOverride`)
- Test: `test/council-config-writer.test.ts` (append `describe("clearSeatOverride", ...)`)

**Interfaces:**
- Consumes: existing module internals `parseValue`, `skipSpace`, `existingMode`, `writeAtomic`, `COUNCIL_CONFIG_FILE`, `THINKING_LEVELS`; existing test helpers `makeRepo`, `cfg`, `T`, `TAB_FIXTURE`, `sha256`, `objectEnd`; `loadCouncilConfig` (already imported in the test file).
- Produces: `export type ClearSeatTarget = "thinking" | "seat";` and `export function clearSeatOverride(args: { repoRoot: string; seat: string; what: ClearSeatTarget }): WriteSeatOverrideResult` — `{ok: true}` on every successful clear and every no-op; `{ok: false, error}` only on malformed/refused input, writing nothing; filesystem failures throw (same asymmetry as `writeSeatOverride`).

- [ ] **Step 1: Write the failing tests**

Append to `test/council-config-writer.test.ts`, after the existing `describe("writeSeatOverride", ...)` block; add `clearSeatOverride` to the import from `../extensions/council-config-writer.ts`:

```ts
describe("clearSeatOverride", () => {
	test("round-trip: clear thinking on an object seat; only the thinking member's span changes; theme, other seats, unknown key byte-identical", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// The ONLY change is the owner value span re-emitted without thinking:
		const ownerKeyAt = before.indexOf('"owner"');
		const ownerValueStart = before.indexOf("{", ownerKeyAt);
		const ownerEnd = objectEnd(before, ownerValueStart);
		const expectedOwner =
			`{\n${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash-0731"\n${T}${T}}`;
		expect(after).toBe(before.slice(0, ownerValueStart) + expectedOwner + before.slice(ownerEnd));

		// theme + unknown top-level key byte-identical (SHA, key-order inclusive);
		// the other seat (judge) untouched:
		expect(sha256(after.slice(after.indexOf('"theme"')))).toBe(sha256(before.slice(before.indexOf('"theme"'))));
		expect(after.slice(after.indexOf('"unknownTopLevel"'))).toBe(before.slice(before.indexOf('"unknownTopLevel"')));
		expect(after.slice(after.indexOf('"judge"'), after.indexOf('"theme"'))).toBe(
			before.slice(before.indexOf('"judge"'), before.indexOf('"theme"')),
		);

		// The loader no longer returns the cleared override:
		expect(loadCouncilConfig(repo).owner).toEqual({ model: "openrouter/deepseek/deepseek-v4-flash-0731" });
	});

	test("round-trip: model :suffix is a thinking carrier and is stripped on clear (loader parity, FLLWUP-10 symmetric)", () => {
		const fixture =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low"\n` +
			`${T}${T}},\n` +
			`${T}${T}"judge": {\n` +
			`${T}${T}${T}"model": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}${T}}\n` +
			`${T}},\n` +
			`${T}"unknownTopLevel": { "kept": true }\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "designer", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// Only the model value span changed: the :low suffix is gone, nothing else.
		const modelValue = '"openrouter/minimax/minimax-m3:low"';
		const modelAt = before.indexOf(modelValue);
		expect(after).toBe(before.slice(0, modelAt) + '"openrouter/minimax/minimax-m3"' + before.slice(modelAt + modelValue.length));
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/minimax/minimax-m3" });
	});

	test("round-trip: explicit thinking key AND model :suffix together are both cleared", () => {
		const fixture =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"designer": {\n` +
			`${T}${T}${T}"model": "openrouter/minimax/minimax-m3:low",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}}\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: fixture });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "designer", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		const keyAt = before.indexOf('"designer"');
		const valueStart = before.indexOf("{", keyAt);
		const valueEnd = objectEnd(before, valueStart);
		expect(after).toBe(
			before.slice(0, valueStart) + `{\n${T}${T}${T}"model": "openrouter/minimax/minimax-m3"\n${T}${T}}` + before.slice(valueEnd),
		);
		expect(loadCouncilConfig(repo).designer).toEqual({ model: "openrouter/minimax/minimax-m3" });
	});

	test("whole-seat clear: member + trailing comma removed; prefix/suffix byte-exact; seat gone from loader", () => {
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "seat" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		// owner is not the last council member — its trailing `,` goes with it:
		const ownerKeyAt = before.indexOf('"owner"');
		const judgeKeyAt = before.indexOf('"judge"');
		expect(after).toBe(before.slice(0, ownerKeyAt) + before.slice(judgeKeyAt));
		expect(loadCouncilConfig(repo).owner).toBeUndefined();
		expect(loadCouncilConfig(repo).judge?.model).toBe("openrouter/qwen/qwen3.6-35b-a3b");
	});

	test("last seat cleared: council re-emits as {} — valid JSON, loadable, theme + unknown key preserved", () => {
		const solo =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"owner": {\n` +
			`${T}${T}${T}"model": "openrouter/deepseek/deepseek-v4-flash-0731",\n` +
			`${T}${T}${T}"thinking": "high"\n` +
			`${T}${T}}\n` +
			`${T}},\n` +
			`${T}"theme": {\n` +
			`${T}${T}"enabled": true,\n` +
			`${T}${T}"variant": "auto"\n` +
			`${T}},\n` +
			`${T}"unknownTopLevel": { "kept": true }\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: solo });

		const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "seat" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		expect(after).toBe(
			`{\n${T}"council": {},\n${T}"theme": {\n${T}${T}"enabled": true,\n${T}${T}"variant": "auto"\n${T}},\n${T}"unknownTopLevel": { "kept": true }\n}`,
		);
		expect(loadCouncilConfig(repo)).toEqual({});
		expect(loadThemeConfig(repo)).toEqual({ enabled: true, variant: "auto" });
	});

	test("string shorthand: clear thinking strips the :suffix, keeps the shorthand form and the model", () => {
		const shorthand =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"judge": "openrouter/qwen/qwen3.6-35b-a3b:medium"\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: shorthand });
		const before = cfg(repo);

		const res = clearSeatOverride({ repoRoot: repo, seat: "judge", what: "thinking" });
		expect(res.ok).toBe(true);
		const after = cfg(repo);

		const valueAt = before.indexOf('"openrouter/qwen/qwen3.6-35b-a3b:medium"');
		expect(after).toBe(before.slice(0, valueAt) + '"openrouter/qwen/qwen3.6-35b-a3b"' + before.slice(valueAt + '"openrouter/qwen/qwen3.6-35b-a3b:medium"'.length));
		expect(loadCouncilConfig(repo).judge).toEqual({ model: "openrouter/qwen/qwen3.6-35b-a3b" });
	});

	test("no-op semantics: shorthand without suffix, seat absent, file absent — ok, no write, bytes + mtime unchanged", () => {
		const shorthand =
			`{\n` +
			`${T}"council": {\n` +
			`${T}${T}"judge": "openrouter/qwen/qwen3.6-35b-a3b"\n` +
			`${T}}\n` +
			`}`;
		const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: shorthand });
		const file = path.join(repo, COUNCIL_CONFIG_FILE);
		const before = cfg(repo);
		const m0 = fs.statSync(file).mtimeMs;

		expect(clearSeatOverride({ repoRoot: repo, seat: "judge", what: "thinking" }).ok).toBe(true);
		expect(cfg(repo)).toBe(before);
		expect(fs.statSync(file).mtimeMs).toBe(m0);

		// seat absent → no-op with a write-free ok:true
		const repo2 = makeRepo({ [COUNCIL_CONFIG_FILE]: TAB_FIXTURE });
		const before2 = cfg(repo2);
		const f2 = path.join(repo2, COUNCIL_CONFIG_FILE);
		const m2 = fs.statSync(f2).mtimeMs;
		expect(clearSeatOverride({ repoRoot: repo2, seat: "skeptic", what: "seat" }).ok).toBe(true);
		expect(clearSeatOverride({ repoRoot: repo2, seat: "skeptic", what: "thinking" }).ok).toBe(true);
		expect(cfg(repo2)).toBe(before2);
		expect(fs.statSync(f2).mtimeMs).toBe(m2);

		// file absent → no-op
		const repo3 = makeRepo();
		expect(clearSeatOverride({ repoRoot: repo3, seat: "owner", what: "seat" }).ok).toBe(true);
		expect(fs.existsSync(path.join(repo3, COUNCIL_CONFIG_FILE))).toBe(false);
	});

	test("malformed JSON or non-object council: refuse with an error naming the file; no write", () => {
		for (const bad of ["{ not json", `{\n${T}"council": "nope"\n}`]) {
			const repo = makeRepo({ [COUNCIL_CONFIG_FILE]: bad });
			const f = path.join(repo, COUNCIL_CONFIG_FILE);
			const before = cfg(repo);
			const m0 = fs.statSync(f).mtimeMs;
			const res = clearSeatOverride({ repoRoot: repo, seat: "owner", what: "thinking" });
			expect(res.ok).toBe(false);
			if (!res.ok) expect(res.error).toContain(COUNCIL_CONFIG_FILE);
			expect(cfg(repo)).toBe(before);
			expect(fs.statSync(f).mtimeMs).toBe(m0);
		}
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test test/council-config-writer.test.ts`
Expected: FAIL — `clearSeatOverride is not a function` / module resolution error. The step-1 gate's "mechanical" nature means the failure reason is the missing export, exactly as intended.

- [ ] **Step 3: Minimal implementation**

Append to `extensions/council-config-writer.ts` (after `writeSeatOverride`; helpers before it, near the existing parse helpers):

```ts
/** Byte-splice region that removes `member` from `objectNode`, trailing-comma
 *  aware (valid JSON output): only-member → re-emit the object span as `{}`;
 *  non-last → eat the member plus its trailing comma/whitespace up to the next
 *  key; last → eat the leading comma/whitespace plus the member. */
function removeMemberEdit(objectNode: ValueNode, member: Member): { start: number; end: number; replacement: string } {
	const members = objectNode.members ?? [];
	if (members.length === 1) {
		return { start: objectNode.start, end: objectNode.end, replacement: "{}" };
	}
	const index = members.indexOf(member);
	if (index === members.length - 1) {
		const prev = members[index - 1];
		return { start: prev.value.end, end: member.value.end, replacement: "" };
	}
	const next = members[index + 1];
	return { start: member.keyStart, end: next.keyStart, replacement: "" };
}

/** Disjoint byte edits that remove every loader-resolvable thinking carrier of
 *  a seat value (applySeatOverride parity: explicit `thinking` key AND a known
 *  `THINKING_LEVELS` `:suffix` on a model string or a string-shorthand value).
 *  Absent carriers → empty edits (no-op; absence means preserve). */
function clearThinkingEdits(text: string, valueNode: ValueNode): Array<{ start: number; end: number; replacement: string }> {
	const edits: Array<{ start: number; end: number; replacement: string }> = [];
	if (valueNode.kind === "object" && valueNode.members !== undefined) {
		const thinkingMember = valueNode.members.find((m) => m.key === "thinking");
		if (thinkingMember !== undefined) edits.push(removeMemberEdit(valueNode, thinkingMember));
		const modelMember = valueNode.members.find((m) => m.key === "model");
		if (modelMember !== undefined && modelMember.value.kind === "string") {
			const raw = text.slice(modelMember.value.start + 1, modelMember.value.end - 1);
			const colon = raw.lastIndexOf(":");
			if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) {
				edits.push({ start: modelMember.value.start, end: modelMember.value.end, replacement: JSON.stringify(raw.slice(0, colon)) });
			}
		}
	} else if (valueNode.kind === "string") {
		const raw = text.slice(valueNode.start + 1, valueNode.end - 1);
		const colon = raw.lastIndexOf(":");
		if (colon > 0 && THINKING_LEVELS.has(raw.slice(colon + 1))) {
			edits.push({ start: valueNode.start, end: valueNode.end, replacement: JSON.stringify(raw.slice(0, colon)) });
		}
	}
	return edits;
}

/** Apply disjoint byte edits highest-offset-first so lower offsets stay valid. */
function applyEdits(text: string, edits: Array<{ start: number; end: number; replacement: string }>): string {
	const sorted = [...edits].sort((a, b) => b.start - a.start);
	let out = text;
	for (const e of sorted) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
	return out;
}

/** Which override a clear removes. */
export type ClearSeatTarget = "thinking" | "seat";

/**
 * FLLWUP-9: the explicit clear affordance. Removes a seat's `thinking` override
 * (what === "thinking": the explicit `thinking` member AND any known `:suffix`
 * thinking carrier on the model, mirroring applySeatOverride's thinking key >
 * :suffix resolution) or its whole `council.<seat>` entry (what === "seat")
 * from `.council.json` via a byte-region splice — the theme section, every
 * other seat, unknown top-level keys, indentation, and trailing newline are
 * byte-identical by construction.
 *
 * Absence still means preserve: the clear is the ONLY way the writer removes
 * a thinking override, and a clear with nothing to remove is an idempotent
 * no-op — `{ ok: true }`, no write (file byte-identical, mtime unchanged).
 * Malformed JSON or a non-object root/council refuse with `{ ok: false, error }`
 * and write NOTHING; only filesystem failures throw (same asymmetry as
 * `writeSeatOverride`). The loader (`loadCouncilConfig`/`applySeatOverride`) is
 * unchanged.
 */
export function clearSeatOverride(args: {
	repoRoot: string;
	seat: string;
	what: ClearSeatTarget; // "thinking" removes the thinking override; "seat" removes the whole council.<seat> entry
}): WriteSeatOverrideResult {
	const { repoRoot, seat, what } = args;
	const file = path.join(repoRoot, COUNCIL_CONFIG_FILE);

	// ---- 1. Absent file → nothing to clear (idempotent no-op) ----
	if (!fs.existsSync(file)) return { ok: true };

	// ---- 2. Read + parse. Malformed / non-object root → refuse, never write. ----
	let text: string;
	try {
		text = fs.readFileSync(file, "utf-8");
	} catch (e) {
		throw e; // filesystem failure — throws by design
	}
	let parsedDoc: unknown;
	try {
		parsedDoc = JSON.parse(text);
	} catch (e) {
		return { ok: false, error: `${file}: malformed JSON — ${e instanceof Error ? e.message : String(e)}` };
	}
	if (typeof parsedDoc !== "object" || parsedDoc === null || Array.isArray(parsedDoc)) {
		return { ok: false, error: `${file}: root must be a JSON object` };
	}

	// ---- 3. Locate council.<seat> (string-aware scan, last duplicate wins) ----
	const root = parseValue(text, skipSpace(text, 0)).node;
	const rootMembers = root.kind === "object" ? (root.members ?? []) : [];
	const councilMember = rootMembers.find((m) => m.key === "council");
	if (councilMember !== undefined && councilMember.value.kind !== "object") {
		return { ok: false, error: `${file}: "council" must be an object keyed by seat name` };
	}
	if (councilMember === undefined) return { ok: true }; // no council section → no-op
	const councilNode = councilMember.value;
	const seatMembers = (councilNode.members ?? []).filter((m) => m.key === seat);
	if (seatMembers.length === 0) return { ok: true }; // seat absent → no-op
	const seatMember = seatMembers[seatMembers.length - 1]; // last wins — JSON.parse semantics

	const edits =
		what === "seat"
			? [removeMemberEdit(councilNode, seatMember)]
			: clearThinkingEdits(text, seatMember.value);
	if (what === "thinking" && edits.length === 0) return { ok: true }; // nothing to clear → no write

	const patched = applyEdits(text, edits);
	writeAtomic(file, patched, existingMode(file));
	return { ok: true };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test test/council-config-writer.test.ts`
Expected: PASS (all `writeSeatOverride` tests AND all `clearSeatOverride` tests — the preservation/FLLWUP-10 tests prove the clear didn't disturb the write path).

- [ ] **Step 5: Full suite + typecheck, then commit**

Run: `bun test` (whole suite green; 2 env-dependent skips expected) and `bunx tsc --noEmit` (exit 0).

```bash
git add extensions/council-config-writer.ts test/council-config-writer.test.ts
git commit -m "feat(council-config-writer): explicit clearSeatOverride — remove a seat's thinking override or whole council entry (FLLWUP-9)

Byte-region removal splice (trailing-comma aware); known model :suffix and
explicit thinking key are both thinking carriers per applySeatOverride parity
(FLLWUP-10 symmetric); absence keeps meaning preserve — clear is a no-op with
nothing to remove. Loader untouched. Round-trip tests byte-assert the result."
```

---

### Task 2: Gate pass + branch/PR

- [ ] **Step 1: Four gates, in order, none lowered** (the CI `gates` workflow at `.github/workflows/gates.yml` is the gate document):

```bash
bun install --frozen-lockfile   # exit 0; lockfile unchanged
bunx tsc --noEmit               # exit 0
bun test                        # all pass; record pass/skip/fail counts
python3 council/validate.py     # prints "All council artifacts valid"
```

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin fllwup-9-clear-thinking-override
# open PR against main (branch name from the card)
```

- [ ] **Step 3: Report** — Approach, Deliverables (plan commit SHA, implementation commit SHA, branch, PR number/URL, head SHA), Gates (command + exit code + observed summary for each), the four Splice decisions with the pinning test, Tradeoffs accepted.