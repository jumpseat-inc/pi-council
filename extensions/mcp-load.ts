/**
 * FLLWUP-23 — guarded, memoized lazy load of the MCP module graph.
 *
 * `extensions/mcp/index.ts` statically pulls `client.ts`/`oauth.ts`, the only
 * `@modelcontextprotocol/sdk` import sites in `extensions/`. When the package
 * is installed by path/copy without its node_modules, resolving that SDK is
 * the FIRST unresolvable specifier the loader's two-stage jiti walk hits, and
 * the extension fails to load with a raw `Cannot find module
 * '@modelcontextprotocol/sdk/client'` plus pi's actively-wrong `pi -ne` hint.
 *
 * The guard is the import attempt itself (never an fs probe or
 * import.meta.resolve — both diverge from jiti's loader-bound stage-2 walk):
 * on primary-import failure the SDK is confirm-imported; if that ALSO fails
 * the SDK is genuinely unresolvable and the named prose is thrown (becoming
 * the inner message under pi's fixed "Failed to load extension:" wrappers,
 * reaching both discoverAndLoadExtensions.errors and stderr BEFORE the -ne
 * hint). If the SDK resolves, the original failure is rethrown — a real
 * mcp/* bug with the SDK present stays honest. On success the memoized
 * module object is returned to every caller, behavior byte-identical to the
 * static import it replaces (healthy install: zero additional output).
 *
 * Node-builtins only, by construction: nothing here pulls ./mcp/* at load.
 * The only `@modelcontextprotocol` reference below is a bare dynamic import
 * that runs only AFTER the primary import already failed.
 */

type McpModule = typeof import("./mcp/index.ts");

const NAMED_PROSE =
	'pi-council could not load: the runtime package "@modelcontextprotocol/sdk" could not be resolved ' +
	'(first unresolved entry: "@modelcontextprotocol/sdk/client"). Council commands are unavailable — ' +
	"this is an installation dependency error, not an MCP configuration or authentication error. " +
	"At the package root (the directory containing package.json), run bun install (or npm install), " +
	'then restart pi. Do NOT use "pi -ne" — it disables extensions entirely and does not repair this ' +
	"missing dependency.";

let cached: McpModule | null = null;

export async function getMcp(): Promise<McpModule> {
	if (cached) return cached;
	try {
		return (cached = await import("./mcp/index.ts"));
	} catch (e) {
		try {
			await import("@modelcontextprotocol/sdk/client");
		} catch {
			throw new Error(NAMED_PROSE);
		}
		throw e;
	}
}