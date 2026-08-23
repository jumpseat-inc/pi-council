// Requires network + a CONTEXT7_API_KEY env var; skipped unless COUNCIL_MCP_INTEGRATION=1.
import { test, expect } from "bun:test";
import { McpManager } from "../../extensions/mcp/client.ts";

const enabled = process.env.COUNCIL_MCP_INTEGRATION === "1" && !!process.env.CONTEXT7_API_KEY;

test.skipIf(!enabled)(
	"context7 round trip via header auth",
	async () => {
		const mgr = new McpManager();
		const rt = await mgr.connect("context7", {
			url: "https://mcp.context7.com/mcp",
			auth: "header",
			headers: { "CONTEXT7_API_KEY": "$CONTEXT7_API_KEY" },
		});
		try {
			expect(rt.status).toBe("connected");
			expect(rt.tools.length).toBeGreaterThan(0);
			expect(mgr.listToolNames("context7")).toContain("mcp__context7__resolve-library-id");
		} finally {
			await mgr.closeAll();
		}
	},
	60_000,
);
