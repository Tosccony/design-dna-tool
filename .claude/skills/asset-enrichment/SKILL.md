---
name: asset-enrichment
description: Generate AI imagery for a generated mockup using Nano Banana (Gemini 2.5 Flash Image). Use this skill after a mockup is written, or for re-enriching an existing one, to fill placeholder image references with on-DNA imagery. Triggers include "enrich the mockup with images", "generate the hero image for [slug]", "fill in the missing images", "add real images", "replace the placeholders", or invoking `/enrich`. The skill has two modes — manual (free, copy-paste prompts into the Nano Banana web UI) and auto (paid, dispatches sub-agents that run `bin/gemini-image.ts` against Google's REST API). Use even when the user doesn't say "use the skill" — if they're filling imagery in `generated/<slug>/`, this is the path.
---

# Asset Enrichment

The recipe for taking a generated mockup from placeholder images to on-DNA imagery via Nano Banana. The design rationale is in `docs/plans/2026-04-29-asset-enrichment-design.md`; this skill is the operational recipe.

## When to use

- Inline at the end of `/new-mockup`, after the writer has run and the user wants imagery before viewing the mockup.
- Standalone via `/enrich <slug>` for an already-generated mockup that needs imagery (or re-imagery). Astro mockups have a `.astro` suffix on their slug directory (e.g., `/enrich atelier-house.astro` → `generated/atelier-house.astro/`).
- Whenever the user asks for "real images" or to "replace placeholders" inside `generated/<slug>/` or `generated/<slug>.astro/`.

Don't use for: copy generation (not handled by this skill), CSS `background-image` references, or anything outside the mockup directory.

**Framework detection.** The discovery pass globs both Next.js (`.tsx`, `.ts`) and Astro (`.astro`) source files in one walk, so you don't need to detect upfront. If you do need to know — for path messages or stack notes — the simplest signal is the directory suffix: `<slug>.astro/` means Astro, otherwise Next.js. Both frameworks store images at `public/images/<filename>`, so output paths are identical.

## Prerequisites

Before any other step, verify three things in order:

1. **Mockup directory exists.** `generated/<slug>/` is present. If not, halt with: "No mockup at `generated/<slug>/`. Generate it first via `tsx bin/generate.ts library/<slug>.json` or `/new-mockup`."

2. **CLAUDE.md has photoDirection.** Open `generated/<slug>/CLAUDE.md` and confirm three `**Photo direction:**` lines are present (under Typography, Color, Layout). If any are absent, halt with: "Mockup `CLAUDE.md` is missing photoDirection fields — it was generated before Task 3. Re-run `tsx bin/generate.ts library/<slug>.json --overwrite` first, then come back."

3. **Auto-mode prerequisites.** Only check these if the user picks `auto` in step 1 below.
   - `GEMINI_API_KEY` env var is set (don't print or log the key value — just verify presence). If missing, halt with: "GEMINI_API_KEY not set. Generate a key at https://aistudio.google.com/apikey with billing enabled, then set persistently via PowerShell: `[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'YOUR-KEY', 'User')` and restart the terminal. Or pick `manual` mode to skip."
   - `bin/gemini-image.ts` exists in the tool repo (not the mockup). This is the direct REST-API client the sub-agents run. If missing, the asset-enrichment branch wasn't merged correctly — halt and flag.
   - Note: do NOT use the Gemini CLI (`gemini -p "..."`) for image generation — that CLI is an agentic coding tool whose default model can't generate images, and `gemini-2.5-flash-image` doesn't support function calling. Only `bin/gemini-image.ts` (direct REST API) works.
   - If the first dispatch returns a quota/billing error, surface it cleanly and offer to fall back to manual (see step 5). Nano Banana has no free tier — auto mode requires billing enabled, ~$0.04/image.

## The five-step flow

### 1. Ask scope and mode

Ask three questions in sequence. Don't bundle them into one wall — each answer narrows the next.

**Scope:** "What scope of imagery? `hero` / `work` / `both` / `all` / `none`"
- `hero` — only files matching `hero*.png` / `hero*.jpg`
- `work` — only `work-*` files (portfolio thumbnails)
- `both` — hero + work
- `all` — every `<Image>` reference in the mockup
- `none` — exit the workflow cleanly

**Generation mode:** "Manual or auto? (default: manual)"
- `manual` — skill composes prompts and outputs them as a copy-paste checklist. The user runs each prompt in the Nano Banana web UI (gemini.google.com or aistudio.google.com), downloads the result, and drops PNGs into `generated/<slug>/public/images/` with the exact filenames the checklist specifies. No CLI, no API key, no billing.
- `auto` — skill dispatches sub-agents that run `npx tsx bin/gemini-image.ts "<prompt>" <output-path>` (a small REST-API client in this repo's `bin/`). Requires `GEMINI_API_KEY` env var set and on a paid API tier (Nano Banana free-tier quota is 0).

**Existing-image policy:** if the user invoked with a fourth positional arg `keep` (e.g., `/enrich foo all auto keep`), skip targets where the file already exists with size > 100 KB. Otherwise default is overwrite.

**Review mode (auto only):** "Auto-confirm or review? (default: auto-confirm)"
- `auto-confirm` — dispatch all, report results, done unless the user asks to retry.
- `review` — dispatch all, list each result by absolute path with a one-line description, ask which to retry or refine.

In manual mode, review is implicit — the user inspects each generated image in the web UI before downloading — so the review-mode question doesn't fire.

If the user invoked `/enrich <slug> <scope> <mode>` with positional args, skip the questions you already have answers for.

### 2. Discovery pass

Generated mockups reference images in two shapes, and discovery must catch both:

**A) JSX/HTML shape** (typically heroes):

```tsx
// Next.js
<Image src="/images/hero.png" alt="..." fill ... />
```

```astro
<!-- Astro -->
<img src="/images/hero.png" alt="..." class="..." />
```

**B) Data-array shape** (service grids, work rosters, etc.) — identical syntax in both frameworks since the const declaration lives in JS/TS body or Astro frontmatter:

```ts
const services = [
  { title: '...', image: { src: '/images/service-screen.png', alt: 'Black screen printing ink being pulled across a fine mesh screen' } },
];
```

A single regex against either shape alone misses the other. Instead, do a two-pass walk:

1. **First-pass grep** for `/images/[A-Za-z0-9._-]+` across `generated/<slug>/**/*.tsx`, `generated/<slug>/**/*.ts`, and `generated/<slug>/**/*.astro` (or `generated/<slug>.astro/**/*.astro` when the user invoked with the Astro slug), **excluding** `node_modules/`, `.next/`, `dist/`, `.astro/`, and `public/`. The broad glob (not just `components/sections/**` and `app/**/page.tsx`) catches future mockups that put image data in `lib/` or other helper modules. The literal-path regex captures every reference regardless of shape or framework.
2. **For each match**, read 3–5 lines of context around the `src` reference and find the corresponding alt:
   - JSX shape: an `alt="..."` attribute on the same element.
   - Data-array shape: an `alt:` sibling key inside the same object literal.
   - If `alt` can't be found within ~10 lines of the `src` reference, treat as missing-alt (apply the guardrail below).

Build a target list:

```ts
{ src: '/images/hero.png', alt: '...', sectionFile: '...', suggestedAspect: '16:9' }
```

`sectionFile` is wherever the reference lives — not necessarily a file under `components/sections/`.

**Aspect inference (filename-driven):**
- `hero*` → 16:9 (full-bleed)
- `work-*` → 4:3 (portfolio thumbnails)
- `service-*` → 1:1 (cards)
- Anything else → read the enclosing element in the section file and decide. If the JSX wraps it in something like `aspect-[3/4]` or a fixed-height container, infer from that.

Filter the list by the user's scope choice from step 1.

**Missing-alt guardrail (hard rule).** If any target has empty or generic alt text — `""`, `"hero image"`, `"placeholder"`, `"image"`, `"photo"` — pause and ask the user to provide a real description, one per offender. **Do not fabricate alt text.** The alt is the prompt's subject line; making one up means generating an image the section file doesn't actually want.

### 3. Prompt assembly

Read the mockup's `generated/<slug>/CLAUDE.md` and extract:
- The three `**Photo direction:**` lines (Typography, Color, Layout) — these are the aesthetic preamble. Use a regex match against `\*\*Photo direction:\*\*\s*(.+?)$` (multiline) on the CLAUDE.md content. Expect exactly 3 matches. If fewer, halt with: "Mockup CLAUDE.md is missing photoDirection lines (expected 3, found N). Re-run `tsx bin/generate.ts library/<slug>.json --overwrite` to regenerate."
- The `**Accent rules:**` line — used for negative cues.

For each target, compose the prompt by concatenating in this order:

1. **Aesthetic preamble** — the three photoDirection strings, joined by spaces.
2. **Subject** — the alt text, verbatim.
3. **Style cue** — derived from accentRules + any layout notes (e.g., "no second strong color", "calm zone for typography overlay", "off-center subject").
4. **Format spec** — `<aspect>, no text overlays, no recognizable brand names or logos.`

**Hard constraints, baked into every prompt:**
- "No text overlays in the image." (Typography is the page's job, not the image's.)
- "No recognizable brand names, logos, or trademarked products."
- Negative cues from the color preset's `accentRules` (e.g., "no cool blue tones" for the Obsidian palette).

Same composition logic runs in both modes. Only the dispatch differs.

### 4. Dispatch

Branch on the generation mode from step 1.

#### Manual mode

Output a numbered markdown checklist for the user to work through. One entry per target:

```
### 1. `hero.png` — 16:9 → save to `generated/<slug>/public/images/hero.png`

Prompt to paste into the Nano Banana web UI:

> <full composed prompt: preamble + subject + style cue + format spec>

When the result looks right, download as `hero.png` and move it to the path above.
```

After printing all entries, tell the user: "Once all images are saved, reply `done` and I'll verify they all landed in the right place." Wait for that reply before reconciling.

#### Auto mode

Spawn one `general-purpose` sub-agent per target, **all in a single message** so they run concurrently. **Cap parallelism at 4 concurrent agents.** For N>4 targets, dispatch in batches of 4 sequentially.

Each sub-agent prompt must be self-contained — the sub-agent has no access to this skill or the surrounding conversation:

```
You are generating one image for a design mockup via Google's Gemini REST API.

Working directory: <ABSOLUTE_PATH_TO_TOOL_REPO_ROOT> (the design-dna-tool dir, not the generated mockup)

Run this exact command:
npx tsx bin/gemini-image.ts "<COMPOSED_PROMPT>" "<ABSOLUTE_OUTPUT_PATH>"

The script calls Gemini's gemini-2.5-flash-image model directly (REST API, not the agentic CLI), receives base64 image bytes inline, and writes the PNG to <ABSOLUTE_OUTPUT_PATH>. GEMINI_API_KEY must be set in the environment.

Quote handling: <COMPOSED_PROMPT> may contain double quotes. Escape them as \" inside the outer "..." so the shell sees one argument. If the prompt contains backticks, escape those too.

Retry policy: if the script exits with a transient error (network timeout, 503, rate limit), wait 5 seconds and retry once. If it exits with a quota or billing error (text contains "quota", "billing", "exhausted", or HTTP 429), do NOT retry — return the error verbatim so the controller can fall back to manual mode.

Return only one of:
- On success (script exits 0, prints "OK <path>"): "OK <ABSOLUTE_OUTPUT_PATH>"
- On failure: "FAIL <error message from script stderr>"

Do not return any other prose.
```

Each sub-agent owns exactly one image. Substitute the per-target absolute path, filename, and composed prompt into the template before dispatch.

### 5. Reconciliation

Branch on mode again.

#### Manual mode

After the user replies `done`, check each expected filename exists in `generated/<slug>/public/images/` with a non-trivial size (>100 KB — anything smaller is almost certainly a stub or accidental empty file). Post a checklist:

```
✓ hero.png (1.8 MB)
✓ work-teaser.png (2.1 MB)
✗ service-dtf.png — missing
```

For misses, ask whether to retry that one (re-print the prompt) or skip.

#### Auto mode

Collect sub-agent return values. Post a one-line summary per image:

```
✓ hero.png
✓ work-teaser.png
✗ service-dtf.png — error: rate limit exceeded
```

If any sub-agent failure contains `quota` or `billing` in the error string, surface a clear note: "Auto generation hit a billing/quota error. Want to fall back to manual mode for the failures? I'll output the prompts to paste." If the user accepts, re-print the manual checklist for the failed targets only.

If failures are transient (rate limit, network), ask "Retry failures?" and dispatch another parallel batch (still capped at 4) for those.

**Review mode (auto only):** after the success summary, list each successful image by its absolute path so the user can open it and look. Then ask: "Any to retry, refine, or regenerate with a different angle? Reply with names + notes (e.g., `hero — too dark`, `service-dtf — wrong subject`)." For each flagged item, append the user's note to the original composed prompt as a refinement clause and dispatch a fresh sub-agent. Repeat until the user says done.

## Edge cases

- **Image already exists.** Default behavior is overwrite — clients pay for the freshest take. If the user invoked with the optional `keep` flag (`/enrich <slug> <scope> <mode> keep`), skip targets where the file already exists at >100 KB. Note skipped targets in the report.
- **Missing photoDirection on a preset.** Fall back to that preset's `character` field for the contribution, and note the degraded-quality caveat in the final report. Don't halt — the mockup is still enrichable, just less precisely.
- **Sub-agent failure handling.** Each sub-agent retries once on transient errors (per the template above). After a second failure, surface in reconciliation. Don't infinite-retry — the user is in the loop.
- **Concurrency cap.** Hard limit of 4 concurrent sub-agents in auto mode. The Gemini API rate-limits aggressively; more parallelism doesn't go faster, it just produces rate-limit errors.
- **Quota or billing error → manual fallback.** Always offered, never automatic. The user gets to decide whether to fund the API or paste prompts by hand.

## Out of scope

This skill doesn't handle — flag them, don't attempt them:

- **Copy generation** (replacing placeholder headlines and body text with on-brief copy). Not handled by this skill.
- **CSS `background-image` references.** This skill only handles `<Image>` JSX components.
- **Cost estimation.** Auto mode is paid; the skill doesn't estimate spend ahead of dispatch. The user knows the rough rate (~$0.04/image) and can multiply.
- **Video / motion assets.** Static imagery only — no animated outputs.
- **Multi-provider imagery.** Gemini / Nano Banana is the only generator. If a refinement isn't landing, the answer is a sharper prompt or manual mode, not a different provider.

## What success looks like

After enrichment, every `Image` reference in the scoped section files resolves to a real on-DNA image in `generated/<slug>/public/images/`. The imagery feels of a piece with the typography and color, because the prompt was composed from the same DNA the rest of the mockup was.
