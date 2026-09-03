## [2026-09-03] ingest | v0.14.0 — Domain-Neutral + Stack-Agnostic
Ingested the v0.14.0 release (commits d3a6f38 / 7d5bfa3 / 033f450 / dd49bf1):
seats, procedures, and wiki pages stripped of the EV-charging/PLN product
domain (AGENTS.md convention #1 inverted: "opinionated on purpose" → "domain-
neutral by design"; grounding flows only via <repository_grounding>), Bun/TS
stack assumptions replaced by the repo's own tooling (scaffold preflight now
invites the consumer's own gates), 28 superseded specs/plans archived to
wiki-pointing stubs, prose regression guards added. Created the source page;
updated pi-council-overview (version → v0.14.0, new table row, "domain prose
ships as-is" claim reconciled to procedural-only doctrine), updated index.
- **Created:** sources/2026-09-03-v0.14.0-domain-neutral-stack-agnostic
- **Updated:** pi-council-overview, index, log
- **Contradictions flagged:** 1 — overview claimed "the seats' domain prose
  (portfolio doctrine, gate discipline) ship as-is"; v0.14.0 removes exactly
  that. Reconciled: procedural doctrine ships, domain grounding is per-repo.

## [2026-09-03] lint | Mechanical lint pass — post-v0.14.0 drift sweep
Ran the Lint operation against repo state (HEAD = v0.14.0). Mechanical fixes:
council-loop "15 steps" was missing step 0 (preflight) — added, matching
`council/procedures/council.md` steps 0–14; run-transcripts "EPIC-2 v0.12.x" →
released as v0.13.0; dropped llm-wiki's dangling `vault/.llm-wiki-bootstrap.md`
citation (file no longer exists); council-theme's `council/agents/AGENTS.md`
source path → repo-root `AGENTS.md` 9.6; garbled text fixed (designer summary
"fears durably evidence" → "files durable evidence"; owner heading "the four
gates, is exposed"); product-owner/steward inline Related/Sources → proper
`##` sections; owner/skeptic frontmatter `sources` → quoted-array form;
preflight.md trailing fragment dropped; council-runner gained its first
[[smoke-test]] link. No broken wikilinks, no orphans, index complete,
frontmatter schema clean.
- **Changed:** council-loop, run-transcripts, llm-wiki, council-theme,
  designer, owner, skeptic, product-owner, steward, preflight, council-runner,
  log
- **Contradictions flagged:** 2 — (1) v0.14.0 shipped (domain-neutral +
  stack-agnostic refactors) with no wiki ingest yet; (2) judge page says
  "Deliberately NOT a Council seat" while seats/index count it among the nine.
  Both left for human steer.

## [2026-08-26] lint | Wiki lint pass — v0.13.0 + stale-claim reconciliation
Ran the Lint operation. Fixed mechanical issues (log.md EPIC-2 entry out of
chronological order → moved to top; mcp-support header note v0.2.0→v0.11.0 →
v0.11.2; 9 source pages missing `aliases`; broken `[[superpowers-dependency]]`
link → plain text). Recorded the v0.13.0 release (EPIC-2 now tagged, commit
fae42f3) in pi-council-overview; reconciled council-theme's stale "modal"
references to the inline panel; aligned mcp-support's "fixed loopback URI"
claim with the v0.11.1 registered-URI derivation. No orphan pages; index
complete.
- **Changed:** log, pi-council-overview, council-theme, mcp-support,
  9 source pages (aliases)
- **Contradictions flagged:** 3 (v0.13.0 release unrecorded; council-theme
  "modal" vs EPIC-2 inline; mcp-support "fixed URI" vs v0.11.1 derivation).
  Reconciled, not silently overwritten.

## [2026-08-26] ingest | EPIC-2 Inline Council Job Tree
Ingested the whole EPIC-2 run: /council-tree became an **inline below-editor
panel** (EV-7 per-row last activity via a transcript timestamp seam) with
editor-driven arrow-key focus (EV-8) and Enter opening inline progress
(EV-9). Created the council-job-tree-inline concept page and 5 source pages
(design-ev8, po-ev8-ruling editor-driven, design-ev9, design-ev9-round2,
po-ev9-tiny-regime-floor min-height-7). Reconcord run-transcripts
(modal → inline), added the EPIC-2 row to pi-council-overview (still v0.12.1,
tag pending), cross-linked council-theme, updated index.
- **Created:** council-job-tree-inline + sources/2026-08-26-design-ev8,
  sources/2026-08-26-po-ev8-ruling, sources/2026-08-26-design-ev9,
  sources/2026-08-26-design-ev9-round2, sources/2026-08-26-po-ev9-tiny-regime-floor
- **Updated:** run-transcripts, pi-council-overview, council-theme, index
- **Contradictions flagged:** 1 — run-transcripts claimed /council-tree is a
  v0.11.4 full-screen modal; EPIC-2 replaces that with the inline below-editor
  panel (per the card goal). Reconciled, not silently overwritten; the modal
  path survives only behind navigator.ts:57 (FLLWUP-4).

## [2026-08-26] ingest | Theme module resolution fix (v0.12.1)
Ingested the bug/root-cause/fix: in an installed package the council theme
silently never activated because `loadPiThemeModule` located pi's theme
module via a bare-specifier `import.meta.resolve("@earendil-works/pi-
coding-agent")`, a filesystem walk pi's extension remap does NOT cover —
the plugin clone's node_modules has no peer, so it threw "Cannot find
module". Fixed by walking pi's own install root with public getPackageDir().
Created sources/2026-08-26-theme-module-resolution-fix; folded the resolution
invariant into council-theme (new "Locating pi's theme module" subsection +
cross-ref from Contradictions #2); added the v0.12.1 row to
pi-council-overview; updated index. Fix itself committed as `392dce7`, version
bumped 0.12.0→0.12.1 (tag pending).
- **Created:** sources/2026-08-26-theme-module-resolution-fix
- **Updated:** council-theme, pi-council-overview, index
- **Contradictions flagged:** none

## [2026-08-26] lint | Wiki consistency pass
Ran the Lint operation. Fixed stale claim (pi-council-overview: theme epic now
v0.12.0-tagged, not "yet-to-be-tagged"), re-pointed the one broken wikilink
superpowers-dependency → [[council-dependencies]] in log (left the
plain-text historical mentions intact), added the [[2026-08-23-agents]] source
cross-ref to seats/override-resolution/repository-grounding Sources, and
grounded remote-oauth-login with the RFC 7636 (PKCE) citation + Sources
entries. No orphan concept pages; frontmatter schema clean; "three production
bugs" vs Bug 1-4 is accurate (Bug 4 is repo hygiene).
- **Changed:** pi-council-overview, log, seats, override-resolution,
  repository-grounding, remote-oauth-login
- **Contradictions flagged:** none

## [2026-08-26] ingest | Smoke Test v0.12.0 clean green
Recorded the unattended smoke-test run of v0.12.0 (bun run smoke, EXIT=0):
full /council EV-1 loop + /features-deliver EPIC-1 epic green from a fresh
container, tsc clean, 5→18 test suite, exact CLI probes. Created
sources/2026-08-26-smoke-v0.12.0; updated smoke-test (added the clean-green
datum to Track record), pi-council-overview (v0.12.0 version row + header),
council-theme (cross-link), index. No contradictions — this run confirms the
harness is now a stability gate, not a bug-hunter.
- **Created:** sources/2026-08-26-smoke-v0.12.0, vault/raw/2026-08-26-smoke-v0.12.0
- **Updated:** smoke-test, pi-council-overview, council-theme, index
- **Contradictions flagged:** none

## [2026-08-25] ingest | EPIC-1 Council Theme subsystem
Ingested the EPIC-1 theme deliverable — the oh-my-pi-palette theme subsystem
(EV-1 port, EV-2 config, EV-3 activation, EV-4 compliance/repaint) and the
design + governance reasoning trail behind it. Created the council-theme
concept page and 5 source pages (design-ev1-round2, po-ev1-escalation,
design-ev3, design-ev3-round2, design-ev4-round1); updated council-config
(theme section + reserved key), run-transcripts (token-drawn modal + live
repaint), pi-council-overview (EPIC-1 row), index. Flagged 4 contradictions
between raw designer positions and the settled spec/rule (see the page's
Contradictions section).
- **Created:** council-theme, sources/2026-08-25-design-ev1-round2,
  sources/2026-08-25-po-ev1-escalation, sources/2026-08-25-design-ev3,
  sources/2026-08-25-design-ev3-round2, sources/2026-08-25-design-ev4-round1.
- **Updated:** council-config, run-transcripts, pi-council-overview, index.
- **Contradictions flagged:** 4 (EV-3 ui.theme vs env variance; tempfile vs
  in-memory; sentinel//settings vs RULING 2 + FLLWUP-1 deferral; custom-pair
  activate-vs-block).

## [2026-08-25] ingest | /council-tree full-screen modal backdrop (v0.11.4)
Ingested the v0.11.4 fix: /council-tree and the transcript viewer rendered as
bare overlays — the TUI compositor has no backdrop (OverlayOptions lacks a
background/dim field; compositeTuiLine splices lines over the base), so the
session UI showed through. New withModalFrame draws a full-screen opaque
backdrop (theme.bg customMessageBg) + centered bordered panel; both open
paths use overlayOptions width/maxHeight 100% anchor top-left; CouncilTree
windows to maxRows around the selection.
- **Created:** sources/2026-08-25-council-tree-modal.
- **Updated:** run-transcripts (modal presentation + Related), pi-council-overview
  (v0.11.4 row, commit count 85→87), index.
- **Contradictions flagged:** none.

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
- **Key takeaway:** pi-council generalizes the originating council + wiki into an
  installable, override-able package; the wiki + board are the durable product.

## [2026-08-23] query | Drop the git-history page
Removed `git-history-and-releases` after human review; its version-arc and
commit-discipline content was redistributed into [[pi-council-overview]],
[[preflight]], [[mcp-support]], [[council-dependencies]], and
[[model-output-floors]].

## [2026-08-22] scaffold | LLM Wiki initialized
Vault scaffolded; index.md and log.md created. No sources ingested yet.

<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] <op> | <title> -->
