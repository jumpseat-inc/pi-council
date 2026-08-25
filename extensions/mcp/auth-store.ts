import * as fs from "node:fs";
import * as path from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export interface McpAuthServerEntry {
	headers?: Record<string, string>;
	oauth?: {
		/** OAuthClientInformationFull from dynamic client registration */
		client?: unknown;
		/** OAuthTokens */
		tokens?: unknown;
		/** OAuthDiscoveryState — persisted discovery results */
		discovery?: unknown;
		/** Pending PKCE verifier for a two-phase remote login (phase 1 → 2). Single-use. */
		verifier?: string;
	};
}

export interface McpAuthFile {
	servers: Record<string, McpAuthServerEntry>;
}

export function authFilePath(): string {
	return path.join(getAgentDir(), "council", "mcp-auth.json");
}

export function loadAuth(file: string = authFilePath()): McpAuthFile {
	if (!fs.existsSync(file)) return { servers: {} };
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { servers: {} };
		return { servers: (parsed as McpAuthFile).servers ?? {} };
	} catch {
		return { servers: {} };
	}
}

/** Atomic write (temp file + rename) at mode 0600. Parent + concurrent seats may refresh. */
export function saveAuth(auth: McpAuthFile, file: string = authFilePath()): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	fs.writeFileSync(tmp, JSON.stringify(auth, null, 2) + "\n", { mode: 0o600 });
	fs.renameSync(tmp, file);
}

export function clearServerSecrets(serverName: string, file: string = authFilePath()): boolean {
	const auth = loadAuth(file);
	if (!(serverName in auth.servers)) return false;
	delete auth.servers[serverName];
	saveAuth(auth, file);
	return true;
}
