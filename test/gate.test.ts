import { test, expect } from "bun:test";
import { loadGatePolicy } from "../extensions/gate.ts";

test("absent repo file yields the packaged default with a non-empty policyVersion and the pinned model", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev62");
	expect(policy.policyVersion.length).toBeGreaterThan(0);
	expect(policy.model).toBe("typesafe/jev-1.13");
	expect(policy.endpoint).toBe("https://openrouter.ai/api/alpha/decisions");
});

test("the resolved default model id is never the alias", () => {
	const policy = loadGatePolicy("/nonexistent-repo-root-ev62");
	expect(policy.model).not.toContain("~typesafe/jev-latest");
});
