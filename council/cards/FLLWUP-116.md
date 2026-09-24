---
id: FLLWUP-116
title: Quote-agnostic file-content import pins across the suite
state: In Review
owner: null
epic: EPIC-24
goal: The suite's file-content import pins (tests that read packaged .md/.ts sources and assert on their contents) match the pinned sentence regardless of whether it is wrapped in double quotes or single quotes, or one pin arm documents the double-quote convention as the contract — whichever arm the implementation takes, a convention-conforming requote of pinned source lines cannot red a pin.
---

## Intent

Several suite tests pin packaged source content by reading the file and
asserting a `.includes(...)` on an exact sentence (e.g. `test/prose.test.ts`
pins seat-block and procedure sentences this way). Those pins break if the
pinned source line's quotation style changes — a double-quoted string
requoted as single quotes (or vice versa) shifts the bytes the pin matches,
even though every gate stays green and no behavior changed. Small test-hygiene
work with a binary outcome: either widen the pins to be quote-agnostic
(normalize both the file text and the expected sentence before matching), or
pin the double-quote convention as the contract and document that a requote is
a pin-breaking change by design. Either arm closes it cheaply.

Filed from EV-90's step-13 candidate (draft title "Quote-agnostic file-content
import pins across the suite"), product-owner-ratified `File` 2026-09-24
(confirmation-authority; recorded gate basis: composite 0.45 < merge threshold
1.00).

## Acceptance

1. One arm is implemented and stated in the card's record: either (a) the
   file-content pins normalize quote style on both sides before asserting, so
   a convention-conforming requote stays green, or (b) a test pins the
   double-quote convention for the pinned surfaces and the convention is
   documented where the pins live, making a requote a loud, intended red.
2. Every file-content pin that reads a packaged source file and asserts an
   exact sentence is covered by the chosen arm — a survey of `test/*.ts` for
   `readFileSync` + `.includes(` pins is recorded in the card.
3. `bun test` and `bunx tsc --noEmit` pass; no packaged source file is edited
   (the card touches tests and, under arm (b), docs only).

## Deliberation record

Routing (facilitator): recorded ROOT mode `Deliberate` (decisions gate active,
fallback at read-back — inert; full-vs-mechanical judgment not made).
Surface-touching bit: **false** (test pins only; no person-visible surface) —
no `designer` seating. Phase 1 classes: all five `n/a:` in
`council/phase1-rulings.json`.

### Round 1 — independent first pass (owner, principal)

**owner (job-10.1, verbatim):**

> Survey complete. Here is my position.
>
> **Survey run (facts, not recollection):**
> - `grep readFileSync test/*.ts` → 100 matches in 24 files; `.includes(`/`toContain` → 173 matches in 54 files. Most are runtime-behavior assertions (tool output, rendered lines, JSON writer output), not file-content pins.
> - The file-content-pin class — reads a **packaged** `council/**.md` or `extensions/**.ts` source and asserts an exact sentence/fragment — lives in ~15 files: `prose.test.ts` (~30 pins, all on `council/agents|procedures/*.md`), `gate-route.test.ts` (4 procedure pins + T1 import canary), `ev83-runner-followup.test.ts`, `ev90-runner-input.test.ts` (§6.5/§6.6), `preflight.test.ts`, `ev80`, `gate-render`, `gate-run`, `gate-spend-reconcile`, `ev66`, `ev74`, `council-models`, `eval-leaderboard`, `eval-runner`, `council-update` (T10b), `cost-baseline`.
> - The house pattern for prose pins is already normalization: `text.replace(/\s+/g, " ")` before `.toContain(...)` — inlined 20+ times in `prose.test.ts` alone, plus `norm()` locals in `ev83`/`ev90`. Quote-agnosticism is the missing half of an existing idea.
> - The quote-sensitive needle subset (needle itself embeds a quote char): `` `op: "route"`/`"recheck"`/`"authority"` `` (`gate-route.test.ts:545,559,570`), `from "./index.ts"` (`ev90:144-145`), `'".pi"'` as a **negative canary** (`ev80:266`), `pi.registerCommand("…` (`ev74:386`, `council-models:240`, `eval-leaderboard:226`, `eval-runner:560`, `council-update:500`), `from "./catalogue` (`gate-spend-reconcile:152`), `from "./runs.ts"` (`cost-baseline:151`), and `a stale "named agent" resolution` (`prose.test.ts:47`).
> - Byte-identity pins exist and are intentionally byte-exact: `STEP4_FIXTURE` `toEqual` slice, the sha256 pin of council.md step 2 (`gate-route.test.ts:535`), preflight script digest pins (`preflight.test.ts:212+`), `renderProcedure` byte-identity (`ev90 §6.2b`). These are not `.includes(...)` sentence pins.
> - No formatter config exists (`ls` for prettier/biome/eslint/dprint → nothing; nothing in `package.json`/`tsconfig.json`), so "the double-quote convention" is de facto, not enforced by any tool.
>
> - **Approach** — Take **arm (a)**: quote-agnostic normalization in the pins, defined as the existing whitespace flatten plus mapping `"` and `'` (only those two chars; backticks stay literal — they're markdown code markers, not quote wrapping) applied to **both** needle and haystack at every surveyed pin site, via one small shared helper (e.g. `test/src-pin.ts`) rather than a 15th inline copy. Crucially, apply it to the two negative canaries that ban quoted bytes (`'.pi"'`, `from "./index.ts"`): today those are **false-green** against a single-quoted requote — a requote doesn't just red positive pins, it *silently weakens* the canaries' documented intent (AGENTS.md hard convention 3, the no-cycle import fence). Normalization makes them strictly stronger. Byte-identity pins, JSON-shape pins (`council-config-writer`), vault/cards/installed-dist pins (`fllwup58`, `retry.test.ts`) are outside the card's "packaged source `.includes` sentence" class and stay byte-exact — the recorded survey states that boundary explicitly.
>
> - **Tradeoffs accepted** — Normalized positive pins can no longer distinguish `"` from `'` in source. I checked whether any pin's *intent* depends on that distinction: none does (the `op:` pins claim the op name exists; the register pins claim registration; no test asserts a quote style as the claim). Arm (b) is rejected on two grounds: it would document a convention nothing enforces (no formatter config exists), and it does nothing about the false-green canary hole — which is the one place a requote causes an actual undetected regression class rather than pin churn.
>
> - **Testable claims** —
>   1. Red-first pair for the implementation: a test that the `.pi` canary fails on source containing `'.pi'` (single-quoted). Current `ev80:266` passes such a source → test red; after normalization it's green. This is the demonstrable defect arm (b) leaves in place.
>   2. `pinFlat("op: 'route'") === pinFlat('op: "route"')` and `pinFlat("from './index.ts'") === pinFlat('from "./index.ts"')` — the requote-goes-green guarantee, per needle from the survey list.
>   3. A source variant with a *semantic* byte change (e.g. `op: "route"` → `op: "recheck"`) still fails the normalized pin — normalization doesn't blur content, only wrap style.
>
> - **Position** — Arm (a). A single shared normalize-both-sides helper (whitespace collapse + `"`/`'` → canonical char), applied to every surveyed packaged-source `.includes`/`toContain` pin including the negative canaries, byte-identity and JSON pins explicitly excluded, survey recorded in the card per acceptance 2. A convention-conforming requote cannot red a pin, and a requote can no longer silently evade a canary — which arm (b) cannot claim.

**principal (job-10.2, verbatim):**

> ## Position — principal seat, FLLWUP-116 (first pass)
>
> **Wiki read:** `vault/wiki/index.md`, `vault/wiki/test-suite-budget.md` (standing rules 1 and 5). The wiki does **not** document test-pin quote hygiene or a quote-style convention anywhere — no page owns this, and AGENTS.md is silent on quote style. That absence is itself a fact the arm choice rests on.
>
> ---
>
> ### Cross-seam reading — what the contract actually is
>
> The survey I ran over `test/*.ts`: `readFileSync`/`Bun.file(...).text()` sites cross-referenced with `.toContain(`/`.includes(`/`indexOf(` pins on packaged sources. The quote-sensitive population is **not** what the card cites. It splits into two classes with opposite remedies.
>
> **Class 1 — delimiter-quote pins (requote breaks the bytes).** ~14 sites across 10 files, two mechanical shapes:
>
> - *Import-specifier pins:* `test/gate-tool.test.ts:420` (`from "./gate-tool.ts"`), `test/gate-route.test.ts:396` (`from "./runs.ts"`), `test/gate-spend-reconcile.test.ts:152` (neg, `from "./catalogue`), `test/rubric.test.ts:338` (`from "./eval-fixtures.ts"`), `test/cost-baseline.test.ts:150` (`from "./runs.ts"`) and `:164` (regex `from\s*"([^"]+)";`), `test/ev90-runner-input.test.ts:144-145` (neg, `from "./index.ts"`), `test/faux-provider-shape.test.ts:281` (`from "./faux-provider/harness.ts"`).
> - *`registerCommand` pins:* `test/council-models.test.ts:240,246`, `test/ev74-council-gate-command.test.ts:386-388`, `test/eval-leaderboard.test.ts:226,229`, `test/eval-runner.test.ts:560`, `test/council-update.test.ts:500` (`pi.registerCommand("council-…"`). Several are simultaneously **slice anchors** (`indexOf(...)` → `toBeGreaterThan(0)`/block slice), so a requote reds *or* silently slices nothing.
>
> Two of these are negative guards that would **not red** on requote — they silently lose detection power: `test/ev80-followup-state.test.ts:266` and `test/gate-ledger.test.ts:224` (`not.toContain('".pi"')`), and `test/gate-route.test.ts:398` (`src.match(/"(Deliberate|Verify|Direct)"/g)`, double-quote-only).
>
> **Class 2 — content-quote pins (quote is data, must stay exact).** `test/ev77-gate-docs.test.ts` `SOURCE_SEGMENTS` pin template-literal *content* — `extensions/preflight.ts:29` is `` `… (mode "${mode}") …` ``, `extensions/council-gate-cmd.ts:22` is `` `… unknown mode "${arg}" …` ``. Same for JSON pins (`council-config-writer.test.ts:188-189`), rendered-output pins (`ev83:350` `` `status: "ok"` ``, `gate-route:545-573` `` `op: "route"` ``), and the one prose-content needle (`prose.test.ts:47`, `a stale "named agent" resolution`). For these, a `"`→`'` change is a **content** change, and normalizing it away would be a defect.
>
> **Repo precedent already exists for arm (a):** `test/rubric.test.ts:318-320` checks `from "node:`, `from 'node:`, and `require("node:`; `test/gate-route.test.ts:251` builds its banned-import regex as `` `from ["']\\./${…}` ``. The authors' existing instinct is normalize, not convention-pin. And there is no formatter/linter config anywhere (no `.prettierrc`, `biome.json`, `oxfmt`, `.editorconfig`), so nothing mechanically requotes today.
>
> ---
>
> ### Blind spots, named per vantage
>
> - **The card's author (from the card's own framing):** cited `test/prose.test.ts` as the exemplar ("seat-block and procedure sentences"). Those pins are *content* matches on `.md` prose — their only quoted needle is prose content, and a `.md` is never formatter-requoted. The example does not instantiate the hazard; the real hazard lives in the `extensions/*.ts` pins the card doesn't name. The card is more urgent than its example suggests and its class boundary is defined wrong.
> - **Source-side (owner/pipeline) view:** from inside the pipeline, a pin is a behavior assertion; you cannot see from there that the matched bytes are the *literal delimiters* rather than the emitted *content*, so you would either ignore the issue or over-normalize it.
> - **Emitted-surface (frontend) view:** from inside the render path, the `"` around an interpolated value IS the user-visible contract. A blanket normalizer applied suite-wide is exactly the change that would make the emitted-output pins stop guarding output — a false negative in the surface the frontend seat is chartered to protect.
> - **The negative guards:** nobody's slice sees these, because their failure mode is *green*. Requote doesn't red them; it makes a canary unable to detect the thing it names. Arm (b) leaves them quietly weaker unless separately addressed.
>
> ---
>
> ### Reframe
>
> **Choose arm (a), but scope it — do not apply a suite-wide quote normalizer.** The card frames one binary arm; the survey shows the pins are two classes, and only one is normalizable. Concretely:
>
> - Add a tiny shared helper (e.g. `test/pin-quotes.ts`) exporting a normalizer that maps the double-quote delimiter to `'` on both haystack and needle (`s.replace(/"/g, "'")`), used by the Class-1 pins — for `toContain`, `.includes`, the `indexOf` slice anchors, and the negative guards — so import-specifier and `registerCommand` pins survive a convention-conforming requote, and the `.pi`/mode-literal canaries get *stronger* (both styles caught).
> - Explicitly enumerate the Class-2 pins in the card's survey as **exact-by-design**: their quotes are content, so arm (a) is deliberately not applied. The helper's doc comment states this contract where the pins live.
> - Strengthen `gate-route.test.ts:398` to the bracket class `["']` as part of the same pass.
>
> This is within arm (a) as the card allows it. Arm (b) is the weaker option here: it requires *inventing* and documenting a convention no config or AGENTS.md currently states, and its enforcement test is itself a quote-sensitive pin; it fixes only the red-on-requote sites and leaves the silent-weakening negative guards unhandled.
>
> ---
>
> ### Testable claims
>
> 1. **Arm-(a) falsifier (acceptance 1):** in a temp copy of a packaged `.ts` source, requote one pinned line `from "./gate-tool.ts"` → `from './gate-tool.ts'`; the corresponding pin must stay green. Today (`gate-tool.test.ts:420`) it reds.
> 2. **Negative-guard claim:** `ev80:266` / `gate-ledger:224` `not.toContain('".pi"')` must catch source text `'.pi'` under the helper. Today it passes on `'.pi'` (false negative) — a runnable red-then-green pair.
> 3. **Class-2 exclusion claim:** with the helper in place, change `extensions/preflight.ts:29` content `(mode "${mode}")` → `(mode '${mode}')`; `ev77-gate-docs.test.ts`'s source-segment guard must still **red**. If a global normalizer were used, it would go green — this test distinguishes scoped arm (a) from blanket arm (a).
> 4. **Convention-absence claim:** `rg -l 'singleQuote|quote style|double quote' AGENTS.md package.json` returns nothing today, so arm (b) has no existing convention source to point at.
>
> **Crisp position: arm (a), implemented as a scoped quote-delimiter-normalizing helper applied to the ~14 Class-1 source pins (imports, `registerCommand`, and the negative canaries), with the Class-2 content-bearing pins enumerated in the card's survey as exact-by-design and deliberately excluded. Arm (b) is rejected — it would legislate a convention the repo has never had while leaving the silent-weakening guards weak.**

### Round 2 — bounded exchange (owner, principal); positions stabilised, exchange stopped at 2 of 3 rounds

**owner (job-10.3, verbatim):**

> I've now read every line the principal cited, plus the Class-2 exemplars in source. I concede — the Class-1/Class-2 split survives contact with the actual code, and my round-1 blanket position fails the principal's claim-3 falsifier by construction.
>
> **What the files actually show:**
>
> - `extensions/preflight.ts:29` and `extensions/council-gate-cmd.ts:22`: the `"` sits *inside* backtick templates interpolating user-facing output — `(mode "${mode}")` and `unknown mode "${arg}"`. That quote is emitted content. Worse for my position: `test/ev77-gate-docs.test.ts:99-126` pins these sources **byte-verbatim** via `SOURCE_SEGMENTS` (hand-split at the interpolation boundary: `'FAIL: decisions gate is enabled (mode "'`, `'") but no OpenRouter…'`). Under my blanket normalizer, changing the emitted output to `(mode '${mode}')` would leave ev77 green — a silent user-visible output change. That's a defect, exactly as claimed.
> - `test/gate-route.test.ts:545-573` (`'`op: "route"`'`) and `test/ev83-runner-followup.test.ts:350` (`'`status: "ok"`'`): these pin **packaged `.md` procedure prose**. A JS formatter's requote can never touch `.md` bytes, so normalizing those pins buys nothing against the hazard and only weakens the pins. My round-1 "normalize every surveyed site" applied a Class-1 remedy to a population with no Class-1 exposure.
> - `test/prose.test.ts:47-48`: the actual needle is `not.toContain("named agent")` — the quotes appear only in the assertion *message*, not the pin. My cited exemplar never instantiated the hazard. The principal was right to call this out, and I was wrong twice over (wrong exemplar, wrong boundary).
> - The Class-1 side verifies too: `gate-tool.test.ts:420` (`from "./gate-tool.ts"`), `council-models.test.ts:240+242` (`toContain('pi.registerCommand("council-models"')` **and** the same string as an `indexOf` slice anchor two lines later), `cost-baseline.test.ts:150+161` (pin + `from\s*"([^"]+)"` regex), and the repo's own normalize-instinct precedent (`rubric.test.ts:318-320`, `gate-route.test.ts:251`).
>
> **Approach** — I concede the Class-2 exclusion and adopt the principal's scoped arm (a) as the converged design: a shared helper (e.g. `test/pin-quotes.ts`) mapping `"`→`'` on both haystack and needle, applied to the ~14 Class-1 delimiter pins (import specifiers, `registerCommand` pins and their `indexOf` slice anchors, and the negative canaries); Class-2 pins enumerated in the card as exact-by-design with the exclusion contract in the helper's doc comment; `gate-route.test.ts:398` strengthened to `["']` in the same pass. My round-1 error was scope, not arm — I now see the emitted-surface and `.md`-content populations where the quote is data.
>
> **Two refinements I add to the converged design** (new, from reading the lines, not restatement):
>
> 1. **One normalized haystack per test block, not per call.** `council-models.test.ts:240-242` uses the *same literal* as both a `toContain` needle and an `indexOf` slice anchor. If the helper normalizes only the assertion calls and the anchor stays raw, a convention-conforming requote still reds (or slices nothing) at the anchor. The helper's contract must be: normalize once into a local, derive every pin in the block from it.
> 2. **The negative-canary normalization has a manufacturing tradeoff that must be documented, not hidden.** `ev80:266` / `gate-ledger:224` are `not.toContain('".pi"')`. Mapping `"`→`'` on the haystack means raw bytes like `x".pi'y` normalize to a `'.pi'` match that didn't exist raw. I judge this acceptable — for a hardcoded-`.pi` canary, a red on near-miss bytes is the right error direction (false-alarm beats missed detection, matching the wiki's canary discipline) — but the helper doc comment must state it, so a future maintainer doesn't "fix" the false positive by reverting the normalization and silently reopening the hole the principal's claim 2 identifies.
>
> **Tradeoffs accepted** — Class-2 pins stay single-style, so a hypothetical *manual* doc edit flipping `"`→`'` in prose would red; I accept that because (a) no formatter touches `.md`, (b) the doc text is itself the contract, and (c) the exclusion is now explicit in the card rather than an accident. I also accept one normalizer call-site discipline burden (refinement 1) in exchange for slice anchors surviving requote.
>
> **Testable claims** — I accept the principal's claims 1–4 as the card's falsifiers (claim 3 is the one that kills my round-1 position, and I've verified by reading that it would in fact distinguish: ev77's `SOURCE_SEGMENTS` byte-verbatim pins red on a `'`-quoted `mode "` output under scoped arm (a) and would go green under blanket normalization). One additional claim from my refinement 1: requote `from "./gate-tool.ts"` → `from './gate-tool.ts'` in a temp copy and the full `gate-tool.test.ts` block must stay green *including* the `indexOf`-anchored ordering assertions — a partial normalization reds there even though the `toContain` half passes.
>
> **Crisp position: arm (a), scoped — shared normalize-both-sides helper for the ~14 Class-1 delimiter pins only (imports, `registerCommand` + their slice anchors, negative canaries), Class-2 content pins enumerated exact-by-design and excluded, `gate-route.test.ts:398` widened to `["']`, single-normalized-haystack discipline at multi-pin blocks. Arm (b) rejected; my round-1 blanket scope withdrawn.**

**principal (job-10.4, verbatim):**

> **Cross-seam reading** — what the contract actually is right now, both sides opened:
>
> The surveyed pin family splits into two mechanically different things that both read as `expect(readFileSync(src)).toContain("…")` from inside the test file:
>
> - **Delimiter pins** — the matched quote is JS/markdown *syntax wrapping a literal*: `extensions/index.ts:1187` `pi.registerCommand("council-gate", {` (needle at `ev74-council-gate-command.test.ts:386`), `from "./index.ts"` (`ev90:144-145`), the `".pi"` canary (`ev80-followup-state.test.ts:266`). A formatter free to set `singleQuote` rewrites exactly these bytes.
> - **Interior-content pins** — the matched quote is *inside* a string template or a markdown code span: `extensions/preflight.ts:29` `` `FAIL: … (mode "${mode}") …` `` (guarded at `ev77-gate-docs.test.ts:106-116`), `council/procedures/council.md:90` `op: "route"`, `council-runner.md:170` `` `status: "ok"` ``. The `"` here is template-literal body or prose, not a delimiter. A formatter **never** rewrites it.
>
> That distinction is not taste — it is whether the character is formatter-mutable. And the card's entire premise (a formatter requote reds the pin) only reaches the first family. That is the cross-seam fact the owner's rule does not encode.
>
> **Blind spots**
>
> - *What the test-side survey cannot see:* `.includes(`/`.toContain` counts cannot distinguish a needle that is *content lifted from the source* from one that is *syntax describing the source*. The contract lives in comment text, not in the match: `ev77-gate-docs.test.ts:7-9` ("the page carries it verbatim … the pinned templates cannot drift from the shipped strings") and `:92-96` ("must still sit in the emitting source file byte-verbatim … a code-side wording change reds here, not silently"). A grep-and-classify survey systematically misses `ev77` — and indeed the owner's enumerated survey omits it, though `SOURCE_SEGMENTS` is literally a *packaged-source `extensions/**.ts` `.toContain` exact-fragment pin*, i.e. inside the owner's own class definition.
> - *What the pipeline/source side cannot see:* from inside `preflight.ts`, `(mode "${mode}")` is just a template literal; you cannot see that a test lifts that exact fragment as a byte-verbatim guard. Only holding both sides shows the quote is load-bearing evidence there.
> - *What I under-weighted in round 1:* the owner is right that the `".pi"` canary is **false-green today** against `'.pi'` — a requote silently evades a documented AGENTS.md-convention fence. That is a real hole my narrower `"`→`'` scoping did not fix, and symmetric normalization does. Credit where due.
>
> **Reframe** — the proposed design is sound; the application set needs one boundary, not a reframe.
>
> The two sides are ~90% converged. I adopt the owner's architecture unchanged:
> - **Arm (a)**, one shared helper (`test/src-pin.ts`), whitespace-collapse + symmetric `"`/`'` → one canonical char, applied to **both** haystack and needle.
> - Symmetric beats my asymmetric map: the canary must catch both directions, so canonicalizing both quote chars is correct.
> - Byte-identity pins (sha256 step-2, `toEqual` slices, digest pins, JSON-shape pins) stay exact — agreed.
>
> The one place I hold against "every surveyed site":
>
> **Exclude the interior-content pins — concretely `ev77-gate-docs.test.ts` `SOURCE_SEGMENTS` and the `EV75/EV76` byte-copy literals — and add `ev77` to the survey.** The owner's falsifier claim was "no pin's intent depends on distinguishing quote styles." `ev77` is the counterexample: its stated intent *is* byte-verbatim source fidelity, and its `'…(mode "'` segment exists so that a code-side wording change reds, not silently. Normalizing it makes `(mode '` pass — silencing exactly the drift the guard was written to catch. Cost of excluding: zero (template-literal interiors are formatter-immune). Cost of including: a documented guard converted to a no-op. That asymmetry decides it.
>
> The same logic covers `op: "route"` / `status: "ok"` / prose needles: interior to a code span, no formatter requotes them, so normalization there buys nothing and only widens the blind spot. Note also `prose.test.ts:47` is not actually a quote-sensitive needle — `.not.toContain("named agent")` has no quote in the needle; the `"…"` is the *message* template. Both our round-1 lists miscounted it; drop it from the subset.
>
> **Testable claims (the disagreement as a runnable test)**
>
> 1. **The `ev77` discriminator.** Copy `extensions/preflight.ts`, replace `(mode "` with `(mode '`, point `SOURCE_SEGMENTS` at the copy: the *current* byte-verbatim check **fails** (red) — correct. Run the same source against the owner's normalize-both-sides helper: it **passes** (green) — proving normalization defeats the guard. That red-green pair is the whole dispute in one fixture.
> 2. **Formatter-invariance of the interior family.** Run prettier/biome with `singleQuote: true` over `ev77-gate-docs.test.ts`'s needle `'…(mode "'` and over `council.md`'s `op: "route"`: assert the *logical* `.toContain` needle value is byte-unchanged (interior `"` escaped or preserved, matched characters identical). Demonstrates Class-2 needs no normalization.
> 3. **Canary strengthening (owner's, accepted).** `not.toContain('".pi"')` passes a source containing `'.pi'` today; under symmetric normalization it reds. This is the card's strongest justification for arm (a) and I endorse it.
>
> **Position**
>
> Arm (a), shared symmetric-normalize-both-sides helper, applied **only to formatter-mutable delimiter pins** — import-specifier and `registerCommand(` pins, plus the `".pi"` / `from "./index.ts"` canaries (which normalization strictly strengthens and which fix a present false-green). **Exclude the interior-content family**: `ev77` `SOURCE_SEGMENTS` and byte-copy literals, the `op:`/`status:` prose tokens, and JSON-shape pins — because formatters never touch string interiors, so normalization there cannot serve the card and does silently disable a byte-verbatim guard. Add `ev77` to the recorded survey; drop the miscounted `prose.test.ts:47` needle. The owner's architecture stands; the application set narrows to the family the formatter can actually reach.
>
> *Grounding: `vault/wiki/index.md` (routing/test pages `[[metered-deliberation-routing]]`, `[[test-suite-budget]]`, `[[red-base evidence]]`). The wiki does not cover test-pin quoting conventions, so this position is grounded in the source lines cited above rather than a wiki page.*

Exchange note (facilitator): both seats now state the same design — arm (a), shared symmetric normalize-both-sides helper applied only to formatter-mutable delimiter pins (import-specifier, `registerCommand`, `indexOf` slice anchors, negative canaries), interior-content pins (ev77 `SOURCE_SEGMENTS` byte-verbatim pins, `op:`/`status:` prose tokens, JSON-shape pins) exact-by-design and excluded, byte-identity pins exact, `gate-route.test.ts:398` widened to `["']`, block-level single-normalized-haystack discipline, ev77 added to the survey and `prose.test.ts:47` dropped as miscounted. Remaining deltas are survey-recording details, not disputes. Positions stabilised — exchange stopped at 2 rounds.

### Round 3 — skeptic attack (step 4; results are the seat's actual runs)

**skeptic (job-10.5, verbatim):**

> ## Skeptic verification — FLLWUP-116
>
> ### Load-bearing factual claims (run, not read)
>
> | Claim | Test | Result |
> |---|---|---|
> | Suite green | `bun test` (timeout 240s) | **`1530 pass / 6 skip / 0 fail`** — green |
> | Typecheck clean | `bunx tsc --noEmit` | **exit 0, no output** |
> | No formatter config | `ls .prettierrc* .editorconfig biome.json* …`, grep package.json | **nothing** — deliberation's "no formatter config" claim holds |
> | Canary sites exist | read ev80:263-266, gate-ledger:218-233, gate-route:393-399, gate-tool:413-424, ev90:138-145, council-models:239-250, ev77:99-126, 285-294 | **all present as described**; ev77 `SOURCE_SEGMENTS` pins byte-verbatim segments incl. `'FAIL: decisions gate is enabled (mode "'` |
>
> ### Objections
>
> **O1 — Survey incompleteness: `gate-ledger.test.ts:230` is Class-1 and absent from the recorded survey.** The deliberation's Class-1 enumeration cites `gate-ledger` only at `:224` (the `.pi` canary). But `gate-ledger.test.ts:230` reads packaged `extensions/gate-ledger.ts` and asserts its exact import set via a **double-quote-only regex** `/(?:^|\n)import\s[^;]*from\s*"([^"]+)";/g` — the same machine shape as `cost-baseline.test.ts:163` (which *is* surveyed). Settling test = requote `gate-ledger.ts` imports and run the pin's own extraction/assertion. **Status: closed-red.**
> Raw output (probe5): `original: ["@earendil-works/pi-coding-agent","node:crypto","node:fs","node:path"] … requoted: [] … FAIL <-- RED on requote`. Acceptance 2 ("every file-content pin … is covered") cannot be met by a survey that doesn't list this pin.
>
> **O2 — The design's helper cannot be applied to the `matchAll` regex pins; either choice reds.** The converged mechanism (whitespace-collapse + `"`/`'`→canonical, both sides) breaks both import-extraction regexes on the **current** tree: normalization collapses the `\n` that the `(?:^|\n)` anchor needs. Settling test = feed the normalized haystack to the exact regex from both test files. **Status: closed-red.**
> Raw output (probe8): `gate-ledger.ts NORMALIZED matchAll: []` (raw: 4 imports), `cost-baseline.ts NORMALIZED matchAll: []` (raw: `["./runs.ts"]`). So: leave regex raw → reds on requote (bug per goal); normalize haystack → reds on current tree (worse). Only regex-widening to `["']` works, and the design specifies that fix **only** for `gate-route:398`'s mode-regex — the import-extraction regexes get no instruction. The record must either widen both regexes or list them explicitly.
>
> **O3 — ev77 exclusion correctly drawn.** Settling test = mutate a copy of `preflight.ts` (`(mode "` → `(mode '`) and run ev77's byte-verbatim segment check, then the same under blanket normalization. **Status: closed-green.** Byte check stays **RED** on the mutant (1 segment missing); blanket normalization **passes** the mutant — the discriminator works, so excluding `SOURCE_SEGMENTS` from the helper is right. The pinned `"` sits inside a template literal `(mode "${mode}")` (preflight.ts:29) — formatter-immune, as the deliberation argued.
>
> **O4 — Canary tradeoff is real and matches the design's claim.** Settling tests: (a) `not.toContain('".pi"')` on a `'.pi'`-containing source → **passes today (false-green)**; (b) `x".pi'y` under symmetric normalization → **matches the needle** (probe3: `norm(hay)="x'.pi'y"` … `normalized includes => true` → the `not.toContain` would red); (c) current trees `followup-state.ts`/`gate-ledger.ts` contain **no** `.pi` variant → no current-tree regression. **Status: closed-green** on the mechanics as documented; the acceptance-1 "documented in the helper doc comment" obligation is implementation-time (not yet satisfied, nothing implemented).
>
> **O5 — Gate-tool block falsifier premise holds; design fixes it.** Settling test = requote `from "./gate-tool.ts"` → `'./gate-tool.ts'` and run gate-tool:420-424's exact assertions. **Status: closed-green.** Today: `includes('from "./gate-tool.ts"') => false` on requote (red). The `indexOf` anchors (`runChildMode(pi, repoRoot, seatName)`, `registerGateTool(pi, repoRoot)`) contain no quote characters → requote-immune; under the design's normalize-once block discipline (probe9: normalized haystack) all three assertions pass. So the owner's refinement-1 discipline is necessary and sufficient for this block.
>
> **O6 — No current-tree flips for surveyed Class-1 positives under the helper.** Probed all 14 surveyed needles against their real packaged sources (probe7): every one stays green today under normalization. **Status: closed-green.**
>
> **O7 — Goal satisfiability — `open-untested` (record-level, not test-level).** The goal's "a convention-conforming requote of pinned source lines cannot red a pin" is only satisfiable on a scoped reading: "convention-conforming" must mean *formatter-produced delimiter requote*, because the design intentionally leaves Class-2 pins red-producing (ev77 byte-checks, `op:`/`status:` tokens). Probe4 demonstrates ev77 stays red on a `(mode '` change by design. That scoping must be stated in the card's implementation record (acceptance 1) or the goal as literally worded is not met; this cannot be tested until the record/implementation exists.
>
> ### What I ran
> Commands and raw outputs above: `bun test` (1530/6/0), `bunx tsc --noEmit`, probes 1–10 in `/tmp/requote-probe/` (temp copies only; `git status --short` shows no tracked-file mutation by me). Also independently re-surveyed `test/*.ts` (`readFileSync`+quote-needle cross-reference) → found the O1 site my survey adds beyond the deliberation's enumeration.
>
> ### Verdict
> **blocks** — two specific defects: **(O1)** `gate-ledger.test.ts:230`'s quote-sensitive import-regex pin is missing from the recorded survey, so acceptance 2 cannot be met as the card stands; **(O2)** the design's only specified mechanism (shared normalize-both-sides helper) demonstrably cannot be applied to the two `matchAll` import-extraction regexes — it reds the current tree if applied to the haystack, and the goal-reds on requote if left raw; no fix mechanism is assigned to them. Both are closed-red with runnable evidence. The rest of the converged design (Class-1/2 split, ev77 exclusion, canary strengthening, block discipline, gate-route:398 widening) survives contact: closed-green.

### Round 4 — synthesis (step 5, consolidator job-10.6, verbatim)

> ## Synthesis — FLLWUP-116 Consolidation
>
> ### Agreed design
>
> - **Arm choice**: Arm (a) — quote-normalizing helper on both sides. Arm (b) was rejected by both owner and principal. Settled by seat convergence; skeptic did not contest it and produced no evidence against it.
> - **Helper architecture**: one shared helper (e.g. `test/src-pin.ts`), whitespace-collapse + symmetric `"`/`'` → one canonical delimiter, applied to **both** haystack and needle. Settled by seat convergence.
> - **Scope**: formatter-mutable delimiter pins only — import-specifier pins, `registerCommand(` pins, their indexOf slice anchors, negative canaries, and gate-route.test.ts:398's mode-literal regex widened to `["']`. Settled by seat convergence.
> - **Exclusions**: ev77 SOURCE_SEGMENTS and byte-copy literals, `op:`/`status:` prose tokens, JSON-shape pins, byte-identity pins (sha256, toEqual slices, digest). Settled by seat convergence; skeptic's O3 probe confirmed the ev77 exclusion is mechanically correct (the discriminator catches the mutant).
> - **Canary tradeoff**: near-miss bytes like `x".pi'y` normalizing to a red is accepted as the right error direction; documented in helper doc comment. Settled by seat convergence; skeptic's O4 probe confirmed the mechanics.
> - **Survey adjustments**: ev77 added to the Class-1 survey; prose.test.ts:47 dropped (needle is `not.toContain("named agent")`, no quote in needle). Settled by seat convergence.
>
> ### Settled disputes
>
> | Dispute | Test / evidence | Result |
> |---|---|---|
> | Arm (b) rejected | Both seats converged; no counter-test. | Arm (a) wins. |
> | ev77 exclusion correct | Skeptic O3 probe: mutant `(mode "` → `(mode '` would pass blanket normalization but the discriminator catches it. | Confirmed correct to exclude. |
> | Canary false-positive mechanics | Skeptic O4 probe: `.pi` source is false-green today; `x".pi'y` reds under normalization; no current-tree regression. | Confirmed as documented. |
> | gate-tool block fixable | Skeptic O5: indexOf anchors are quote-free; normalize-once block discipline is necessary and sufficient. | Confirmed. |
> | Current-tree safety | Skeptic O6: all 14 Class-1 needles stay green on current tree under normalization. | No current-tree flips. |
> | baseline green | Skeptic baseline: 1530 pass / 6 skip / 0 fail; `bunx tsc --noEmit` clean. | Clean baseline established. |
>
> ### Open objections (blocking — must be resolved before implementation)
>
> 1. **O1 — gate-ledger.test.ts:230 missing from survey.** The skeptic ran the probe and confirmed: the regex `/(?:^|\n)import\s[^;]*from\s*"([^"]+)";/g` at gate-ledger.test.ts:230 is a double-quote-only matchAll import extractor in exactly the same machine shape as cost-baseline.test.ts:163. It is absent from the deliberation's recorded Class-1 survey. Acceptance condition (2) — "every file-content pin reading a packaged source and asserting an exact sentence is covered by the chosen arm" — cannot be met with the current survey. The survey must be amended to include this pin (or a documented justification for its exclusion must be provided) before implementation can satisfy the card's acceptance. **This is a blocking open objection**: the design is incomplete as recorded, and any implementation proceeding against the current survey would ship a card that fails its own acceptance (2).
>
> 2. **O2 — matchAll regex pins cannot use the normalize-both-sides helper.** The skeptic's probe demonstrated: normalizing whitespace destroys the `(?:^|\n)` anchor in both gate-ledger.test.ts:230 and cost-baseline.test.ts:163, causing `matchAll` to return `[]` on the **current** (unmutated) tree — not just on requote. Leave the regex raw → reds on requote. Normalize → reds now. The converged design assigns regex-widening only to gate-route.test.ts:398's mode-literal regex; it assigns no fix mechanism to these two matchAll import-extraction regexes. **This is a blocking open objection**: the design must assign a concrete remediation strategy for these two pins (whether that is widening the regex to `["']`, rephrasing the assertion, or documenting an explicit carve-out with rationale). Without it, implementation has no instruction for these pins.
>
> Both O1 and O2 are **design amendment requirements**, not settled work items the owner simply executes. They are distinct from the settled work items (helper implementation, survey additions for ev77 and prose.test.ts:47 drop, gate-route.test.ts:398 widening) because they require a **new design decision** — the original design did not contemplate the matchAll regex class, and the survey is factually incomplete. The facilitator should route these to a design amendment before handing implementation to the owner.
>
> ### Open judgment — for `product-owner`, escalating to `steward`
>
> 1. **O7 — goal phrasing scoping.** The skeptic observed that the card's literally-worded goal ("convention-conforming requote of pinned source lines cannot red a pin") is satisfiable only on a scoped reading where "convention-conforming" means "formatter-produced delimiter requote" — because Class-2 pins (ev77, byte-identity, etc.) intentionally red on requote. The question is whether this scoping is:
>    - **(a)** A natural-language implicit that the implementation record simply restates (the goal is already scoped by the card's own acceptance conditions, which carve out excluded categories; the record just needs to say so explicitly), or
>    - **(b)** A substantive ambiguity in the goal that requires a product ruling — because the goal's literal wording promises more than the implementation delivers, and a future reader or judge could hold the card to the unscoped reading.
>
>    Both positions survived scrutiny. The owner's likely view is (a): the acceptance conditions already constrain the goal's scope, and the record just needs to restate that constraint. The skeptic's implicit view is (b): if the goal's literal words promise universality, the card's acceptance (1) should explicitly narrow it, or the card should be amended. **This routes to `product-owner` for a ruling.** If `product-owner` rules (a), the implementation record's obligation is to document the scoped reading as part of acceptance (1). If `product-owner` rules (b), the card's goal text needs amendment.
>
> ### Ready to hand off?
>
> **No.** Two blocking open objections prevent handoff:
>
> - **O1** (survey gap): the Class-1 survey is factually incomplete — gate-ledger.test.ts:230 is missing. Acceptance (2) cannot be satisfied without amending the survey.
> - **O2** (design gap): the matchAll import-extraction regexes at gate-ledger.test.ts:230 and cost-baseline.test.ts:163 have no assigned remediation strategy. The design must assign one (or document a justified carve-out) before the owner can implement.
>
> Once O1 and O2 are resolved (via design amendment routed by the facilitator), the remaining work is pure execution: implement the shared helper, apply it to the settled scope, widen gate-route.test.ts:398, run the amended survey, and verify `bun test` + `bunx tsc --noEmit` pass. The open judgment on O7 should be routed in parallel to `product-owner` and need not block implementation if the implementation record simply restates the scoped reading while awaiting the ruling.

### Step 6 — routing (facilitator)

- **O1/O2 (closed-red, blocking)**: routed as a design amendment into the step-7 spec. Basis: the probes settled the mechanics (helper on the regex haystacks reds the current tree; raw regexes red on requote — both closed-red), and the card's settled goal requires a convention-conforming requote not to red a pin; the only remediation compatible with that settled goal is widening both import-extraction regexes to `["']` — the same mechanism the converged design already assigns to `gate-route.test.ts:398` and the same one `cost-baseline`/`gate-ledger` precedent shape implies. This extends an already-converged mechanism to the two newly-surveyed same-shape sites; recorded here so the ruling seat can veto it if it reads the extension as improper.
- **O7 (open judgment)**: not covered by any Phase 1 class ruling (all five `n/a:`; none addresses goal-text scoping). Ruling seat is `product-owner` per the overlay's judgment row; this container does not dispatch ruling seats → **escalated to the orchestrator**. Card stays `Deliberating` pending the ruling; steps 7–14 resume on the confirming dispatch.

### Round 5 — confirming ruling (product-owner, job-11, verbatim; appended on the resuming dispatch, 2026-09-24)

> Q1 — ruling (a). The goal's "convention-conforming requote" is already scoped by the goal's own terms and by acceptance 1's arm structure; the goal text stands unchanged, and the implementation record must restate the scoped reading explicitly. The word doing the work is *convention-conforming*: a convention is a rule about string delimiters in TS source — no formatter config exists in this repo, no formatter rewrites markdown prose or template-literal interiors, and byte-identity pins are excluded from the card's pin class in both arms' framings. A quote flip inside `SOURCE_SEGMENTS` or an `op: "route"` token is a content change, not a requote — the goal never promised content changes stay green. Arm (a) as converged covers exactly the formatter-mutable delimiter family, which is the whole population the hazard reaches. The implementation record must therefore state, as part of acceptance 1, verbatim:
>
> > "convention-conforming requote" means a formatter-produced delimiter requote in packaged `.ts` sources; Class-2 interior-content pins (ev77 `SOURCE_SEGMENTS`, `op:`/`status:` prose tokens, JSON-shape pins) and byte-identity pins are exact-by-design and intentionally red on content change.
>
> That restatement closes O7's record-level obligation. Ruling (b) is declined: amending the goal text of a card already in flight rewrites the card's contract mid-run.
>
> Q2 — confirmed, with the O1 survey amendment folded in as its precondition. Extending the `["']` widening to both `matchAll` import-extraction regexes (`test/gate-ledger.test.ts:230`, `test/cost-baseline.test.ts:163`) is the proper design amendment. The normalize-both-sides helper reds the current tree on these regexes (the `(?:^|\n)` anchor needs raw newlines), and leaving them raw reds on requote. Widening to `["']` keeps the current tree green and survives requote, and it is the same mechanism the converged design already assigns to `gate-route.test.ts:398`, backed by repo precedent (`test/rubric.test.ts:318-320`, `test/gate-route.test.ts:251`). These pins assert the import set, not the quote style. This is a test-side change only, so acceptance 3's "no packaged source file is edited" constraint holds. O1's remediation is subsumed: `gate-ledger.test.ts:230` and its sibling must appear in the recorded survey before acceptance 2 can read as met.
>
> Standing fact accepted: O7's record-level obligation is open-untested and remains so until the implementation record exists at step 9; this ruling does not pre-close it. The card resumes at step 7 with the amendment as confirmed; the implementation record must carry the scoped-reading sentence above verbatim under acceptance 1, and the amended survey must include both `matchAll` sites.

**Routing applied (facilitator):** ruling is binding. O1 and O2 are closed by Q2 (widen both `matchAll` import-extraction regexes to `["']`); the two blocking objections are settled design amendments, not open items. O7 is closed at the record level by Q1's mandated verbatim restatement sentence; its residual status remains `open-untested` until the step-9 implementation record exists, per the ruling's own standing fact. Resuming at **step 7** with the design as converged plus the Q2 amendment and the Q1 record obligation.

### Step 7 — spec written and committed

`docs/superpowers/specs/2026-09-24-FLLWUP-116-design.md` (commit 7fe6f68) — the settled design: scoped arm (a), helper `test/src-pin.ts`, Class-1 population with block-level normalize-once discipline, three regex widenings to `["']`, Class-2/byte-identity exclusions, the verbatim scoped-reading sentence as an implementation-record obligation. Self-reviewed against the deliberation record: no placeholders, no scope beyond the goal, no ambiguity an owner could resolve two ways. Card state `In Progress` (commit b939d69).

### Step 8 — owner implementation (job-12.1, Deliberate)

Owner implemented in worktree `/tmp/fllwup-116`, branch `feat/fllwup-116-quote-agnostic-pins` (base b939d69), 4 conventional commits, all 15 changed files under `test/` (facilitator-verified: `git diff --name-only b939d69..4515efe` — zero packaged-source edits). PR #116 opened at head `4515efe9ba220b445a23923f353739797be7c51f`; owner's local gates: tsc clean, `bun test` 1530/6/0, preflight PASS. **Implementation record (acceptance 1/2/3):**

(a) Scoped-reading sentence, verbatim per ruling Q1:

> "convention-conforming requote" means a formatter-produced delimiter requote in packaged `.ts` sources; Class-2 interior-content pins (ev77 `SOURCE_SEGMENTS`, `op:`/`status:` prose tokens, JSON-shape pins) and byte-identity pins are exact-by-design and intentionally red on content change.

(b) Survey (owner's, base b939d69): Class-1 converted — `gate-tool.test.ts:420`, `ev90-runner-input.test.ts:144-145` (neg), `gate-spend-reconcile.test.ts:152` (neg), `faux-provider-shape.test.ts:281`, `rubric.test.ts:318-320` + `:338`, `cost-baseline.test.ts:151`, `gate-route.test.ts:396`, `council-models.test.ts:240+246-247`, `ev74-council-gate-command.test.ts:386-388`, `eval-leaderboard.test.ts:226+229-230`, `eval-runner.test.ts:560`, `council-update.test.ts:500`, canaries `ev80-followup-state.test.ts:266` + `gate-ledger.test.ts:224` (strengthened); regex-widened `["']` — `gate-ledger.test.ts:230`, `cost-baseline.test.ts:163`, `gate-route.test.ts:398`; Class-2 exact-by-design — `ev77-gate-docs.test.ts` (`SOURCE_SEGMENTS` + byte-copy literals), `gate-route.test.ts:545-573` (`op:` tokens), `ev83-runner-followup.test.ts:350` (`status: "ok"`), `council-config-writer.test.ts:188-189` (JSON-shape); byte-identity excluded — sha256/digest/`toEqual` slices; dropped as miscounted — `prose.test.ts:47`. Survey includes both `matchAll` sites and ev77 (ruling Q2 / O1 satisfied).

(c) Arm (a) implemented over the scoped Class-1 population with excluded classes exact-by-design; the three regex pins widened to `["']` per ruling Q2 (the helper cannot touch the `(?:^|\n)` anchors).

### Step 9 — skeptic verification (job-12.2, verify-cycle 1 of ≤3; no fix cycles used)

Verdict **VERIFIED** at head `4515efe9ba220b445a23923f353739797be7c51f` (worktree HEAD confirmed to subject SHA first). Gates re-run in full at the head: tsc exit 0; `bun test` **1530 pass / 6 skip / 0 fail** (run twice — pristine and after restore); preflight PASS; diff scope all-under-`test/` (also checked per-commit and against the PR base). Probes all green: requote survival (7/7, including `indexOf`-anchored ordering), canary strengthening (`'.pi'` now reds; no false alarm on current tree), Class-2 exclusion intact (`(mode '` mutant still reds ev77's byte check), widened regexes extract full import sets on current tree AND requoted copies (old regexes extract zero — load-bearing), content change still reds (`op: "recheck"`). Gate-integrity spot-checks (each gate watched to fail, then restored green). Process disclosure: a `cp -al` probe accidentally truncated a shared inode on `extensions/preflight.ts` in the worktree; detected via `git status`, restored from the head SHA, restoration re-verified (ev77 + full suite green); main repo and branch state untouched. Objections: O-rubric-require `closed-green` (conceded as wrong); O-class-2-token `closed-green` (cosmetic — the literal "Class-2" token appears in this record and the spec, satisfying the label requirement; facilitator noted). **No blocking objection; O7's open-untested residual is closed by this record carrying the verbatim sentence (a).**
