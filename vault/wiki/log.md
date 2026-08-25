## [2026-08-25] ingest | /council-init --approve trust fix (v0.11.3)
Ingested the v0.11.3 fix: /council-init's pi install -l failed headless with
"Project is not trusted" because pi's trust prompt never appears in
non-interactive modes (defaultProjectTrust "ask" = untrusted). Running
/council-init IS the approval — it now passes --approve (scoped to the
single command) when ctx.isProjectTrusted() is false via a new installArgsFor
helper. superpowers passed earlier because it was already pinned.
- **Created:** sources/2026-08-25-council-init-approve.
- **Updated:** council-dependencies (enforcement + Related), pi-council-overview
  (v0.11.3 row, commit count 83→85), index.
- **Contradictions flagged:** none.

## [2026-08-25] ingest | Live runtime refresh after MCP login (v0.11.2)
Ingested the v0.11.2 fix: /mcp login and /mcp auth stored credentials but
never reconnected the live runtime, so /mcp list kept showing the stale
unauthenticated/tools=0 captured at session start. New refreshServerRuntime
reconnects after header/oauth login and auth (phase 2), fixing status +
dispatch accuracy; tool registration still needs /reload. Test tightened
(was vacuous toContain('connected') — 'not connected' contains it).
- **Created:** sources/2026-08-25-mcp-login-refresh.
- **Updated:** mcp-support (status-freshness section + v0.11.2 lineage),
  pi-council-overview (v0.11.2 row, commit count 81→83), index.
- **Contradictions flagged:** none — the design's "refresh after login" was
  aspirational and is now real (noted, not a conflict).

## [2026-08-25] ingest | Remote OAuth redirect-URI fix (v0.11.1) — catalog completion
Completed the v0.11.1 ingest: source page filed, catalog + overview updated.
- **Created:** sources/2026-08-25-remote-mcp-oauth-fix.
- **Updated:** pi-council-overview (v0.11.1 row + commit count 76→81),
  index (fix source entry), remote-oauth-login + mcp-support (source backlink).
- **Contradictions flagged:** (none new — the "fixed constant" correction was
  recorded in the earlier entry).

## [2026-08-25] ingest | Remote OAuth redirect-URI fix (v0.11.1)
Ingested the v0.11.1 bugfix for the reported invalid_request "redirect_uri
does not match any of the OAuth 2.0 Client's pre-registered redirect urls".
Root cause: a persisted DCR client (from an earlier loopback login) has a
fixed registered redirect-URI list; the login flows advertised a foreign URI
(the remote 127.0.0.1:8765 constant, or a fresh ephemeral listener port) and
Clerk rejected it. Fix: redirectUrl derives from the client's registered
redirect_uris[0]; loopback login pre-invalidates stale clients (re-DCRs them)
so the browser opens once with the correct URL. Fixture AS now echoes +
validates redirect_uris Clerk-style so the class is caught.
- **Updated:** remote-oauth-login (registered-URI derivation + stale-client
  re-registration), mcp-support (same, + v0.11.1 version lineage).
- **Contradictions flagged:** remote-oauth-login/mcp-support previously stated
  the redirect URI is "the fixed 127.0.0.1:8765 constant" — now derived from
  the registered client's list when one exists. Reconciled, not silently
  overwritten.

## [2026-08-25] ingest | Remote MCP OAuth login (v0.11.0)
Ingested the v0.11.0 remote-login feature: the two-phase copy-paste OAuth flow
for headless/remote agents (/mcp login --remote prints the authorization URL;
/mcp auth <name> <pasted-url> exchanges the code). The crux: the PKCE verifier
moved from an in-memory provider field to the persisted auth store
(oauth.verifier, single-use), making the flow divisible across two commands.
No tunnels — fixed 127.0.0.1:8765 loopback URI + PKCE (code useless without
the verifier, which never leaves the agent machine). Auto-detects headless via
SSH_TTY / no DISPLAY; --remote/--local override.
- **Created:** sources/2026-08-25-remote-mcp-oauth, concept remote-oauth-login
  (the pattern generalizes beyond MCP — the user's own cross-agent workflow).
- **Updated:** mcp-support (command surface + verifier schema + two-phase flow
  + security correction), pi-council-overview (v0.11.0 row + commit count
  75→76), headless-pi (auth-half cross-link), index.
- **Contradictions flagged:** mcp-support claimed the OAuth callback "validates
  state" — the code never did (loopback listener extracts only code; `state`
  in oauth.ts is discovery state). Corrected to match code; the paste path
  scopes state validation out. Also corrected mcp-support's stale version
  lineage (was v0.2.0→v0.4.0, now through v0.11.0). Reconciled, not silently
  overwritten.

<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] <op> | <title> -->

## [2026-08-25] lint | Wiki lint pass + run-transcripts page
Ran the Lint operation: fixed 11 pages of mechanical issues (stale claims in
preflight/owner/overview, corrupted seat-derived wording in judge/skeptic/
consolidator, broken link + typos in sources/readme, mcp-support, llm-wiki,
repository-grounding, designer, engineering-board). No contradictions between
pages remained after the v0.10.0 ingest; zero orphans.
- **Created:** concept run-transcripts (v0.9.0 run substrate + /council-tree
  viewer) per human steer on the lint gap.
- **Updated:** hub-job-supervision (Related link), index.
- **Contradictions flagged:** preflight's import-dataset claim (stale vs
  scaffold), owner's ":high count" (stale), overview commit count (41→75).
  Reconciled against the code, not silently overwritten.

## [2026-08-25] ingest | Unattended smoke test + the bugs it caught (v0.10.0)
Ingested the smoke-test round: the definitive unattended end-to-end test
(container + fixture + 3 phases + kill-shot probes), the headless-pi operating
rules it depends on, and three production bugs it caught — headless procedure
dispatch (silent no-op), MCP startup crashes, and hub tools never reaching seat
children (`/features-deliver` broken end-to-end). Released as v0.10.0.
- **Created:** sources/2026-08-24-unattended-smoke-test-design,
  sources/2026-08-24-unattended-smoke-test-plan,
  sources/2026-08-25-smoke-test-bugfixes, concepts smoke-test, headless-pi.
- **Updated:** seats (hub-grant allowlist correction), council-runner (dispatch
  claim corrected), procedure-commands (headless dispatch), hub-job-supervision
  (child tool visibility), pi-council-overview (v0.8.0 → v0.10.0 + version rows),
  index.
- **Contradictions flagged:** seats.md's "hub grant exposes …" (registration-only
  until v0.10.0), council-runner.md's "dispatches the working seats" (aspirational
  until v0.10.0), pi-council-overview.md version v0.8.0 (stale). Reconciled, not
  silently overwritten.

## [2026-08-24] ingest | Ask-user-question dependency (second scaffold dependency)
Ingested the addition of the rpiv-ask-user-question extension as a second
project-local dependency: superpowers.ts generalized into a
COUNCIL_DEPENDENCIES list, /council-init installs both, preflight asserts both.
- **Created:** sources/2026-08-24-ask-user-question, concept council-dependencies
  (renamed from superpowers-dependency), concept ask-user-question.
- **Updated:** preflight (new gate), non-clobbering-scaffold (plural deps),
  council-loop + pi-council-overview + index (link re-points).
- **Contradictions flagged:** superpowers-dependency's resolveSuperpowers /
  superpowers.ts references superseded by resolveCouncilDependencies /
  dependencies.ts; preflight + non-clobbering-scaffold only described the
  single superpowers dependency. Reconciled, not silently overwritten.

## [2026-08-24] ingest | Seat/procedure mechanism-reference hygiene (bugfix)
Ingested the uncommitted bugfix pass: `deliver.md` → `features-deliver.md`,
removed the repo-specific `GATE-EVIDENCE.md` gate path, hardcoded `.pi` →
`CONFIG_DIR_NAME`, corrected the `council_dispatch` seat description, and
replaced the stale "agent registry / restart" framing with disk-at-dispatch-time
seat resolution. Also fixed seed typos found along the way.
- **Created:** sources/2026-08-24-bugfix-seat-prose.
- **Updated:** council-runner, council-loop, procedure-commands,
  hub-job-supervision, override-resolution, seats, llm-wiki (typo), index.
- **Contradictions flagged:** none — the wiki never repeated the stale
  references; these fixes refine, not reverse.

## [2026-08-23] ingest | Committed .council.json override layer (v0.7.0)
Ingested the v0.7.0 engine change: per-seat model/thinking field overrides in a
committed `.council.json`, applied inside `loadSeat`, scaffold-seeded
non-clobbering, plus the 12th AGENTS.md convention.
- **Created:** sources/2026-08-23-council-json-override,
  concept council-config.
- **Updated:** override-resolution (two-tier + field-merge flag),
  seats (schema override note), non-clobbering-scaffold (.council.json listing),
  pi-council-overview (v0.7.0 row), sources/2026-08-23-agents
  (twelve conventions), + 9 seat entity pages (cross-links).
- **Contradictions flagged:** AGENTS.md convention count 11 → 12; and
  override-resolution's "no merging at file level" claim is now only
  filename-tier truth — `.council.json` merges per-field (noted, not
  silently overwritten).

## [2026-08-23] ingest | Repo-doc seed (pi-council)
Seeded the wiki from this repo's own docs + git history + codebase via the
ingesting-repo-docs skill. Discussed plan with the human first; wrote 26 pages.
- **Created:** pi-council-overview, seats, council-loop,
  engineering-board, procedure-commands, repository-grounding, override-resolution,
  non-clobbering-scaffold, model-output-floors, superpowers-dependency,
  hub-job-supervision, mcp-support, preflight, llm-wiki + 9 seat entities
  (owner..council-runner) + 3 more concept pages.
- **Sources filed (7):** readme, agents, pi-council-design-spec,
  mcp-support-design-spec, pi-council-implementation-plan, mcp-implementation-plan,
  context7-preflight-plan.
- **Manifest:** vault/.repo-docs.tsv recorded -- 24 NEW doc files pinned to commit.
- **Key takeaway:** pi-council generalizes the ev-guide council + wiki into an
  installable, override-able package; the wiki + board are the durable product.

## [2026-08-23] query | Drop the git-history page
Removed `git-history-and-releases` after human review; its version-arc and
commit-discipline content was redistributed into [[pi-council-overview]],
[[preflight]], [[mcp-support]], [[superpowers-dependency]], and
[[model-output-floors]].

## [2026-08-22] scaffold | LLM Wiki initialized
Vault scaffolded; index.md and log.md created. No sources ingested yet.
