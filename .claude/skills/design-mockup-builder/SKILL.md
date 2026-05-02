---
name: design-mockup-builder
description: Build a Next.js website mockup from a client brief or design references. Use this skill whenever the user is starting a new website project, designing a landing page, analyzing a reference site for design patterns, composing a Design DNA, generating mockups in this repo, or iterating on a previously-generated mockup. Triggers include "design a site for [client]", "mockup for [business type]", "look at [site] — what is it doing", "generate a landing page", "I have a new client", or any conversation about composing typography/color/motion combinations for design work. Use even when the user describes a project casually without explicitly saying "use the skill" — if they're discussing website design in this repo, this skill applies.
---

# Design Mockup Builder

The operational recipe for the design conversation in this tool. The repo's `CLAUDE.md` describes the philosophy and rules; this skill is the concrete workflow.

## When to use

Whenever the user is doing design work in this repo:

- Bringing in a new client brief
- Pasting a URL or screenshot of a reference site
- Asking to generate a mockup
- Iterating on an existing DNA or mockup
- Browsing the preset library to plan a project

Don't use this skill for: editing the schema in `presets.ts`, writing new motion primitives, or working inside an already-generated mockup directory (those have their own auto-generated `CLAUDE.md`).

## The five-step flow

### 1. Capture the brief

Before anything else, understand what's being built. Probe for:

- **Business and audience** — what they do, who they serve. This narrows preset `bestFor` matches.
- **Aesthetic direction** — even if vague. "Premium quiet luxury", "tech-forward", "warm and human", "brutalist editorial" are all useful.
- **Reference points** — sites they admire. The single most useful signal.
- **Hard constraints** — brand colors that must be honored, fonts they own, accessibility requirements.

Don't ask all four mechanically. Read what's already in the conversation. If the user opens with "make me a flower shop site," ask 1–2 sharpening questions, not a questionnaire.

If the user provides only "build me a landing page" with no details, push back gently — the whole tool is built around constraint. Generic input produces generic output. Ask one specific question to get them committed (e.g., "What kind of business? And do you have any sites you've seen that hit the vibe?").

**Check the research archive first.** Before running fresh research or pushing for references, scan `docs/research/*.md` for notes touching the same vertical. If a recent note exists (typically < 3 months for fast-moving categories like SaaS landing or AI tools, < 6 months for slower-moving ones — anchor on whether the design-press canon for the vertical has visibly shifted, not the calendar), surface it:

> "Found `<filename>` from <date> on this vertical. Reuse that, run fresh, or augment with new picks?"

Reuse skips discovery and feeds the existing note's patterns into the DNA proposal step. Fresh runs from scratch. Augment seeds the candidate list with the prior note's sites and adds new ones. The library-as-moat principle: each project benefits from prior research.

**No references? Offer research.** If the user signals they have no reference sites ("not really", "I don't have any", "you tell me", "go find some"), offer the research workflow before pushing for refs:

> "Don't have references? I can run a research pass — `/research` will pull 5 design-press-recognized sites in this vertical, analyze each through the same four lenses (typography / color / layout / motion), and surface cross-cutting patterns. The result feeds directly into the DNA proposal step. Want me to do that?"

On *yes*, invoke the website-research skill inline. The skill handles discovery, analysis, and saves a research note. When it returns, continue to Step 3 (Propose 2–3 DNAs) with the patterns and gaps as added context.

On *no*, continue the existing flow.

### 2. Analyze references (when provided)

When the user drops a URL, fetch it with `web_fetch` and characterize the design language. When they drop a screenshot, look at the image directly.

Run through these four lenses, briefly:

**Typography**
- Family characteristics (serif/sans, geometric vs. humanist, condensed vs. wide)
- Weight contrast (do display and body share weight, or is there a strong gap?)
- Approximate scale ratio (modest 1.2 vs dramatic 1.5+)
- Tracking on display (negative tightening? positive opening?)
- Optical sizing or static metrics

**Color**
- Mode (light, dark, duotone)
- The logic, not the hexes — "warm neutrals plus one terracotta accent used only on CTAs", not "#C8553D"
- Contrast level (high contrast hero / soft uniform / mixed)
- Where the accent earns its place

**Layout**
- Hero pattern (split / centered editorial / full-bleed image / asymmetric / horizontal scroll / minimal typographic)
- Asymmetry (7/5 split vs Bootstrap 6/6)
- Density (spacious vs balanced vs dense)
- Vertical rhythm

**Motion**
- Easing personalities visible (snappy / smooth / dramatic / mechanical)
- Where motion lives (page-load reveals / scroll-driven / hover micro / continuous)
- Density (lots of orchestrated motion vs restrained)
- Use of smooth scroll

Report back as a brief — three or four bullets per category — then **bridge to the preset library**: which existing presets are closest matches, or what gap the library has if nothing fits. The bridge is the point of the analysis. Without it, it's just commentary.

**Ethics:** patterns yes, assets no. Don't pull images, don't copy logos, don't reproduce specific layouts wholesale. If the user pushes to clone a site verbatim, push back — clients deserve original work.

### 3. Propose 2–3 DNAs

Before composing, **read `presets.ts`** to see what's currently in the library. Don't compose from memory — the library grows over time, and missing a recently-added preset is a wasted opportunity.

Each DNA proposal should be a meaningfully different aesthetic direction, not three flavors of the same idea. For each:

- **Name it** — give the option a short evocative label ("Editorial / Quiet Luxury", "Modernist / Tactile", "Cinematic Dark")
- **List the chosen presets by name** — typography, color, layout, primary easing
- **State what it prioritizes and what it trades off** — one sentence. "Prioritizes warmth and considered pacing; trades off the bright modern feel a sans-led system would give."
- **Why it fits the brief** — one sentence connecting the choice back to what the client said they want

Format roughly like:

> **Option 1 — Editorial / Quiet Luxury**
> Editorial typography (Fraunces + Inter) · Paper color · Split Editorial layout · Expo Out as primary easing.
> Prioritizes considered pacing and printed-matter feel; trades off the brighter, more product-forward energy a sans-led system would give. Fits because you mentioned wanting "premium without being stuffy" and pointed at sites with strong editorial pull.

If the library doesn't compose well to the brief, **say so**. Better to extend the library deliberately than force a bad fit. Suggest what the new preset would need to capture (e.g., "I'd want a typography preset built around a condensed grotesque — nothing in the library hits that yet").

**Combo lock-in check.** Before settling, glance at `library/*.json` and count occurrences of each candidate DNA's preset combination (typography + color + layout IDs). If a candidate would be the 3rd or later exact-combo repeat across the user's project history, surface it inline:

> "Note: this DNA combo (Modernist + Obsidian + Full Bleed) has been used before — `library/foo.json`, `library/bar.json`. Right call for this brief, or defaulting? Sometimes repeat is correct (presets are foundations, not templates — section variants and imagery on top still differentiate)."

Don't block. Don't punish. Frame as a question — the user has the judgment. The defense is making sure repeats are *intentional*, not defaulted-into.

Wait for the user to pick before generating.

### 4. Save and generate

Once the user picks an option:

1. **Save the DNA as JSON** to `library/<slug>.json`. Slug it from the project or client name (kebab-case). The DNA shape is in `presets.ts` as the `DesignDNA` type — required fields: `projectId`, `projectName`, `client`, `typographyId`, `colorId`, `layoutId`, `easingsByRole` (with `primary`, `entrance`, `exit`, `attention`), `motionPrimitiveIds`. Optional: `overrides`.

2. **Run the generator**:
   ```bash
   tsx bin/generate.ts library/<slug>.json
   ```
   Output lands in `generated/<slug>/`.

3. **Summarize what was generated** — which presets were composed, the key files, and the run instructions (`cd ... && npm install && npm run dev`). Don't `npm install` for the user — they'll do that when they want to view.

4. **Drop one or two teaching beats** — see "Teaching motion craft" below.

5. **Offer asset enrichment.** Once generation is reported, ask: "Generate AI imagery for this mockup? `hero` / `work` / `both` / `all` / `none`". If the user picks anything but `none`, invoke the asset-enrichment skill with their scope choice — the skill takes it from there (asks generation mode `manual` or `auto`, composes prompts, dispatches if auto). The mockup feels finished much faster with real imagery, and the loop is now ~10s in auto mode or a quick paste cycle in manual instead of fully manual prompting.

### 5. Iterate

Three kinds of iteration, each handled differently:

| The user wants… | Do this |
|---|---|
| A different accent color, same DNA | Edit the DNA's `overrides.accentColor`, regenerate |
| One preset swapped (e.g., different typography) | Edit the DNA, regenerate with `--overwrite` |
| New section or page in the existing mockup | Tell the user to `cd generated/<slug>` and open Claude Code there — that mockup's auto-generated `CLAUDE.md` takes over |
| A new direction altogether | Compose a fresh DNA, save under a new slug |

Don't blow away `library/<slug>.json` for major iterations — save variants as `<slug>-v2.json`, `<slug>-warm.json`, etc. The library's value is partly historical.

## DNA composition mechanics

When composing, the order matters because choices constrain each other:

1. **Start with layout archetype.** It sets the structural skeleton and rules out incompatible typography/color directions.
2. **Pick typography.** Its `bestFor` should overlap with the project type. Its `character` should align with the brief's vibe.
3. **Pick color.** Mode (light/dark) is the biggest fork. After that, look at `accentRules` — does the color preset's discipline match how prominent the brand color should be?
4. **Assign easings to roles.** For most projects, primary == entrance is fine, plus a smoother `power4-in-out` for `exit` (page transitions, pinned-section releases) and `snappy-out` for `attention` (button feedback, toggles). Only diverge if there's a reason.
5. **Pick motion primitives.** Default set is `text-mask-reveal` + `magnetic-button`. Add only what the brief actually needs — every primitive added increases visual noise.

## Presenting DNAs to the user

Keep proposals scannable. Bullet-density should be low; the user is reading them to make a design decision, not parsing specs. The format from step 3 above (name, preset list, prioritizes/trades, fits because) hits the sweet spot.

If you find yourself writing more than ~6 lines per option, you're probably over-justifying. Tighten.

## Teaching motion craft

The user is learning the craft side. When generating or iterating motion, drop **one or two short teaching beats** — never a lecture.

Good moments to teach:

- **Why a particular easing fits** — "I picked `ease.expo-out` for the entrance because it lands hard then settles fast — gives that 'expensive' feeling on hero reveals. Compare to `ease.power4-in-out`, which has a slower middle and reads as cinematic instead of confident."
- **Why a stagger value matters** — "The 0.08s stagger between lines is the threshold where the eye reads them in sequence rather than as a chord. Tighter and they feel synchronized; wider and they feel disjointed."
- **Why motion is restrained somewhere** — "I didn't add a parallax to the hero image because the typography is already doing the entrance work — two simultaneous reveals fight each other."

Keep beats to 1–2 sentences. They are seasoning, not the main course.

## Common pitfalls and how to dodge them

- **Pitch decks of options instead of a real conversation.** If you're constantly proposing, never narrowing, you're not helping. After two rounds of options, ask the user to commit to a direction, then iterate within it.
- **Ignoring the layout archetype.** A Split Editorial DNA needs different page content than a Full Bleed one. Generated demo content is selected by the writer, but if the user asks for additional sections, respect the archetype's flow and density.
- **Over-using the accent color.** The color preset's `accentRules` is binding. If the user asks for "more accent color," gently note that the preset's discipline is what makes it feel premium, and suggest other ways to add visual interest (display weight contrast, surface-alt blocks, eyebrow labels).
- **Treating the demo content as final.** The generated headlines are placeholders. When the user is happy with the DNA, suggest replacing the demo copy with real client copy as a separate step.
- **Forgetting `prefers-reduced-motion`.** All generated motion respects it via the global CSS override. If the user adds custom motion later, remind them to honor the same media query.

## Reading current state

When in doubt about what's available, read these files directly:

- `presets.ts` — current preset library (typography, color, easing, motion, layout) and the `DesignDNA` type
- `library/` — saved DNAs from previous projects, useful as composition examples
- `compiler.ts` and `writer.ts` — only when you need to know exactly what gets generated

Don't compose DNAs from memory if it's been more than a few turns since you last looked at `presets.ts` — the library is growing.
