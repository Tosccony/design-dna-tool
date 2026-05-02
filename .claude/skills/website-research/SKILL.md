---
name: website-research
description: Research design-press-recognized reference websites for a vertical, run them through the four-lens analysis, and save the findings as a research note. Use this skill when the user has a brief but no references (or wants to augment what they have), or invokes `/research`. Triggers include "research [vertical] websites", "find me references for a [type] site", "what's working in [industry] right now", "give me some examples of good [vertical] sites", or `/research <input>`. The output is a markdown note in `docs/research/` that accumulates as a library asset and feeds `/new-mockup` brainstorms.
---

# Website Research

The recipe for filling a "no references" gap before a brainstorm. Pulls 5 design-press references for the vertical, analyzes each through the same four lenses as `/analyze`, surfaces cross-cutting patterns, bridges to the preset library, and saves the whole session as a markdown note that future projects can build on.

The design rationale is in `docs/plans/2026-04-29-website-research-design.md`; this skill is the operational recipe.

## When to use

- Inline in `/new-mockup`'s Step 1 when the user has no reference points (or asks for help finding some).
- Standalone via `/research <free-form input>` for ad-hoc inspiration runs.
- When the user asks "what's working in [vertical]" or "give me examples of good [type] sites" — even if they don't say `/research`, the skill applies.

Don't use for: cloning a specific site (we extract patterns, not assets), commercial-success research (wrong signal — see `docs/plans/2026-04-29-website-research-design.md` for why), or analyzing a single ref the user already provided (use `/analyze` for that).

## Prerequisites

Before running, verify three things:

1. **`docs/research/` exists.** It should — Task 1 of this plan creates it. If the directory is missing, create it on the fly with `mkdir -p docs/research/` and continue. (Don't halt on this — auto-recovery is fine here.)
2. **The input has enough signal.** A single generic word like "SaaS" or "e-commerce" is too broad — see Edge case #1 below; ask for narrowing before running.
3. **Tool access.** `WebSearch` and `WebFetch` must be available. If they're disabled, halt with: "Web tool calls are disabled. `/research` needs both WebSearch and WebFetch to discover and verify candidates. Enable them or fall back to manual reference-gathering."

## The five-step flow

### 1. Parse the input

The input is free-form. Read it and extract:
- **Vertical** — what kind of business or product (law firm / printmaker / SaaS landing / merch / agency portfolio / editorial publication / etc.).
- **Constraints** — adjectives that narrow the candidate set (modern / traditional / dark / light / premium / playful / minimalist / dense / etc.).
- **Hard exclusions** — anything the user explicitly doesn't want (e.g., "but not corporate," "no e-commerce templates").

If extraction is ambiguous (e.g., the input is genuinely just "SaaS"), apply Edge case #1 and ask one clarifying question before running.

**Prior-research lookup:** before discovery, list `docs/research/*.md` and check filenames + first-line topics for matches against the parsed vertical. If a recent note covers the same vertical (typically < 3 months for fast-moving categories like SaaS landing or AI tools, < 6 months for slower-moving ones like law firms — anchor on whether the design-press canon for the vertical has visibly shifted, not the calendar), surface it: *"Found `<filename>` from <date> on the same vertical. Reuse, run fresh, or augment with new picks?"* Reuse skips discovery; fresh starts over; augment uses the prior note's candidates as a seed and finds additional sites.

### 2. Discovery (hybrid)

Two passes feed a unified candidate list.

**Pass A — LLM general knowledge.** Propose 5–10 sites from your training data. Filter with this prompt structure:

> "List sites in [vertical] that are widely recognized as design-press exemplars (Awwwards, FWA, Land-book, Site Inspire, Brutalist Websites) or referenced by practitioners. Filter for [constraints]. Output as `name | url | one-line why-it's-recognized`."

**Criteria for "doing really well":**
- **Primary:** design-press recognition (awards, featured placements) + aesthetic craft (looks excellent, considered typography, original layout, tight motion).
- **Secondary:** practitioner reputation (referenced in design discourse).
- **Skipped:** commercial-success proxies (well-funded brands can have mediocre sites — wrong signal).

**Design-press recognition threshold.** A single Awwwards SOTD by itself is not enough — too many sites get them. Require at least one of: (a) SOTM/SOTY at Awwwards/FWA/CSS Design Awards, (b) editor's pick on Land-book / Site Inspire / Brutalist Websites / Page Collective, OR (c) practitioner reference in design discourse (cited in design newsletters like Sidebar.io, Hover States, Frontend Focus; or referenced in agency case studies / designer Twitter/Bluesky threads). Funding and commercial success tell you nothing about design quality even when they correlate.

**Pass B — WebSearch supplement.** Compose 1–2 queries based on input, e.g., `"best law firm websites 2025 awwwards"`, `"premium printmaker website inspiration"`. Triage results: keep design publications (Awwwards, FWA, Site Inspire, Land-book, Brutalist Websites, Sidebar.io, Typewolf, Page Collective), agency case-study pages, and practitioner posts. Drop SEO-driven listicles ("top 10 X websites in 2025"), template-marketplace galleries (Wix/Squarespace/Webflow showcase pages of templates, not real sites), and AI-summary content farms.

(If a named source returns 404 or has clearly shut down, drop it silently and lean on the others — don't surface dead-source reports as part of discovery output.)

Pull 3–5 additional candidates.

**Dedupe + verify.** Combine both lists. Drop duplicates. For each remaining candidate, run `WebFetch` (single GET, light touch) to confirm the URL is alive. Discard dead URLs. Cap the verified list at **5 sites** by default; the user can override via the skill prompt (`--count 8` or natural-language "find me 8 sites").

### 3. Per-site analysis

For each verified site, run the existing `/analyze` workflow inline (don't invoke the slash command — apply the four-lens pattern directly):

- **Typography:** family characteristics, weight contrast, scale ratio, tracking.
- **Color:** mode, the logic (not hexes), where the accent earns its place.
- **Layout:** hero pattern, asymmetry, density, vertical rhythm.
- **Motion:** easing personalities, where motion lives, density.

3–4 bullets per category, brief and concrete. Then a one-paragraph "Why it works" synthesizing the design strengths.

**Banned phrases in "Why it works":** "modern and clean", "bold typography", "elegant design", "perfect balance", "stunning visuals" — these are content-free. The paragraph should name a specific tradeoff or a non-obvious choice (e.g., *"The condensed display does the loud work so the body can stay quiet — letting them use a single weight in body without losing hierarchy"*).

**Ethics reminder:** patterns yes, assets no. The output never proposes copying a site verbatim — we extract design language, not specific layouts or imagery.

### 4. Aggregate cross-cutting patterns

After all sites are analyzed, summarize what's common across the set:

- **Typography:** "4 of 5 use a single-family system, weight-led hierarchy."
- **Color:** "All 5 are dark-mode default; 3 use monochrome-with-one-accent."
- **Layout:** "Asymmetric heroes dominate; 4 of 5 avoid 6/6 splits."
- **Motion:** "Expo-out entrance dominates; 3 of 5 use scroll-driven reveals."

Bridge to preset library: read `presets.ts`, identify the closest existing presets *for each preset category present in the file*, and **flag gaps explicitly** — patterns that no current preset covers. If `presets.ts` has grown a new preset category since this skill was written (e.g., interaction primitives, data-display presets), include it in the bridge — don't skip it just because the four lenses didn't anticipate it. Better to flag the gap than shoehorn a bad fit.

If the patterns are weak ("3 of 5 use sans-serif" — true of 95% of the web, useless), say so explicitly. Don't dress up generic findings.

### 5. Save the research note

Write to `docs/research/<slug>-<YYYY-MM-DD>.md` where slug is a kebab-case keyword. If the path already exists (same vertical, same day), append `-v2`, `-v3`, etc., until the path is free. Use this structure verbatim:

```markdown
# Research: <topic / vertical>
**Date:** YYYY-MM-DD · **Brief:** <verbatim user input>

## Candidates analyzed
1. <Site Name> — <url> · <one-line why-recognized>
2. ...
(+ list of any candidates dropped, with reason)

## Per-site analysis
### 1. <Site Name>
[four-lens analysis: 3–4 bullets per category]
**Why it works:** <1–2 sentences synthesizing the design strengths>

### 2. <Site Name>
...

## Cross-cutting patterns
- **Typography:** ...
- **Color:** ...
- **Layout:** ...
- **Motion:** ...

## Bridge to preset library
- **Closest existing presets:** ...
- **Gaps:** ... (or "none — current presets cover the patterns")

## Recommended DNA direction
<2–3 sentences on what design direction makes sense given the patterns and gaps — phrased as a starting point for a future DNA proposal, not a final pick. Don't reuse the word "brief" here, since standalone /research runs may not have one.>
```

After writing, post a short summary in chat (not the full note — that's saved). If invoked from `/new-mockup`, hand off to the brainstorm step with the patterns + gaps as context. If standalone, end here.

## Edge cases

1. **Vertical too broad.** If the input is one or two generic nouns ("e-commerce", "SaaS"), halt before discovery and ask for narrowing: "E-commerce is wide — what's the brand position (premium / playful / utilitarian)? And the product category? That'll sharpen the list." Resume after the user replies.
2. **All LLM-proposed URLs dead.** Training cutoff means ~10–20% of LLM-proposed URLs may be moved or dead. If verification drops the list below 3 sites, fall through to a WebSearch-only pass. If still under 3 sites after that, admit the gap: "Couldn't reliably find 5 design-press references for this brief. Got <N> candidates analyzed; want to proceed with these, or do you have any starting points yourself?"
3. **JS-rendered sites.** `WebFetch` returns unrendered HTML; modern SPAs may show empty markup (script tags + an empty `<div id="root">`). Detect (no meaningful content extracted), flag the site as "couldn't analyze without a rendered view — URL recorded for manual review," continue with the rest. Don't try to parse the empty DOM as if it had content.
4. **Patterns too generic.** When extracted patterns are weak, say so explicitly rather than dressing up the findings: "Patterns across these 5 sites are mostly generic — the vertical may be too broad, or the design-press canon for this niche is thin. Recommend pulling additional refs by hand or sharpening the brief."
5. **Augment mode.** If the user has 1–2 refs and wants research to find more (*"I have site X, find me a few more like it"*), accept existing URLs as seed input. Deduplicate against the candidate list. Run analysis on the union. Existing refs aren't ignored.

## Out of scope

This skill doesn't handle:

- **Screenshot-based multimodal analysis.** `WebFetch` works with HTML only; JS-rendered SPAs may need a rendered view that this skill doesn't capture.
- **Cached cross-session research.** Each `/research` run is fresh.
- **Automated tagging / archive search.** Filename + grep is the search story.
- **Direct gallery scraping** (Awwwards, Land-book). No public APIs; ToS-sensitive.
- **Commercial-success metrics or traffic data.** Wrong signal — we research design language, not business strategy.

## What success looks like

After a `/research` session, the user has a saved markdown note with 5 verified, design-press-quality reference sites analyzed through the same lenses as everything else in the tool, with patterns extracted and gaps in the preset library called out. Future projects in the same vertical surface the note via the prior-research lookup, so no research effort gets thrown away.
