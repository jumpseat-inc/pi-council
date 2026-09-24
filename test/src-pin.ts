/**
 * srcPin — the shared normalizer for Class-1 file-content import pins
 * (FLLWUP-116, arm (a), scoped per the Council design + product-owner ruling).
 *
 * Contract — what is covered:
 *   The covered class (Class-1) is the *formatter-mutable delimiter* pin: the
 *   matched quote is JS/TS string syntax wrapping a literal in a packaged
 *   source file — import-specifier pins, `registerCommand` pins with their
 *   `indexOf` slice anchors, and the `".pi"` / `from "./index.ts"` negative
 *   canaries. `srcPin` is applied to BOTH the haystack and the needle:
 *   whitespace collapse (`\s+` → `" "`, the suite's prose-pin convention),
 *   then symmetric quote canonicalization (`"` and `'` each → `"`; backticks
 *   stay literal — they are markdown code markers, not string delimiters).
 *   A convention-conforming requote of a pinned line cannot red a converted
 *   pin, and a block must normalize ONCE into a local and derive every
 *   assertion in it (needle, `indexOf` anchors, slices) from that local.
 *
 * Contract — what is excluded and why:
 *   Class-2 interior-content pins stay exact-by-design: ev77 `SOURCE_SEGMENTS`
 *   byte-verbatim pins (their `"` sits inside a template literal —
 *   formatter-immune; normalizing would pass a `(mode '` mutant and silently
 *   disable a byte-verbatim guard), `op:`/`status:` prose tokens in packaged
 *   `.md` (a formatter never requotes markdown), and JSON-shape pins (the
 *   quotes are data of the JSON format). Byte-identity pins (sha256, `toEqual`
 *   slices, digests) are a different machine shape, not sentence pins.
 *   The `matchAll` import-extraction regexes and the mode-literal regex are
 *   NOT normalized — whitespace collapse destroys the raw `\n` their
 *   `(?:^|\n)` anchor needs (a normalized haystack makes `matchAll` return
 *   `[]` on the current tree); they are widened to `["']` in place instead.
 *
 * Accepted canary tradeoff (do NOT "fix" this):
 *   Symmetric normalization makes near-miss bytes like `x".pi'y` normalize to
 *   a match, so the hardcoded-`.pi` `not.toContain` canaries RED on them — a
 *   false alarm. That is the right error direction for a fence whose failure
 *   mode is silent evasion (before this helper, a single-quoted `'.pi'`
 *   source false-greens the canary). A future maintainer must not revert the
 *   normalization to silence the false positive: that silently reopens the
 *   hole the canary guards (AGENTS.md hard convention 3, the no-cycle import
 *   fence).
 */
export function srcPin(text: string): string {
	return text.replace(/\s+/g, " ").replace(/["']/g, '"');
}
