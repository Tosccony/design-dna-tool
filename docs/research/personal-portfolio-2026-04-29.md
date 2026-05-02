# Research: Personal portfolio sites that demonstrate visual craft

**Date:** 2026-04-29 · **Brief:** Personal portfolio page that demonstrates visually exquisite skills — sites where the site itself is a showcase, not just a project list.

## Candidates analyzed

1. **Bruno Simon** — bruno-simon.com · 3D drivable portfolio, Awwwards SOTY 2019 + SOTM January 2026 (refreshed). Canonical reference for portfolio-as-experience.
2. **Olivier Larose** — olivierlarose.com · Awwwards-recognized motion designer portfolio, frontend-craft showcase.
3. **Brittany Chiang** — brittanychiang.com · Practitioner-referenced developer portfolio (Hover States, Sidebar.io). Restraint-led — included for aesthetic contrast against the 3D-heavy canon.
4. **Lee Robinson** — leerob.com · Practitioner-referenced (React/Next.js community), content-led developer portfolio. Provides a second restraint-led data point.

**Candidates flagged but not analyzed (JS-rendered SPA — `WebFetch` couldn't extract content):**
- **Henry Heffernan** — henryheffernan.com · Awwwards SOTM 2022, 3D OS-style portfolio. Three.js-driven; UI is canvas. Recorded for manual review.
- **Robin Mastromarino** — robinmastromarino.com · Multi-time SOTM. WebFetch hit a redirect loop (HTTPS↔HTTP); site exists but couldn't extract content. Recorded for manual review.
- **Daniel Spatzek** — danielspatzek.com · Multi-time SOTM. Canvas-driven; only the page title was visible in markup. Recorded for manual review.

**Pattern in flagged set:** all three flagged sites are heavily JS-rendered (Three.js or canvas-driven). For this specific vertical (visually-striking portfolios), the design-press canon skews toward sites where the entire interface is canvas — `WebFetch`'s static-HTML approach systematically misses them. Manual review is the workaround for now.

## Per-site analysis

### 1. Bruno Simon

**Typography**
- Humanist sans-serif system (Nunito for body, Amatic SC for display) — friendly, approachable personality.
- Moderate weight contrast between UI labels and body copy.
- Moderate scale hierarchy (headings 2–3× body) tuned for both mobile and desktop legibility.
- Loose tracking on UI elements (buttons, labels) for legibility at small sizes.

**Color**
- Dark mode foundation; selective accent highlights (reds, oranges, whites) reserved for interactive states.
- Accent colors signal interaction richness (achievement unlocks, UI controls) without overwhelming the 3D world.
- Neutral grays as secondary; muted gold/flame as aspirational reward markers.

**Layout**
- Full-bleed interactive 3D canvas dominates; UI panels dock to edges (map, options, achievements) as overlays.
- Asymmetric density — sparse main canvas vs. information-dense sidebars and modals.
- Vertical rhythm broken intentionally by floating action buttons and context-aware prompts.

**Motion**
- Mechanical, responsive easing on UI interactions (panel slides, button states).
- Continuous motion in 3D world (car physics, camera flow, ambient elements).
- Hover-triggered feedback on interactive UI.

**Why it works:** The driveable-car metaphor turns the portfolio into a single object you operate, not a document you read. UI restraint keeps the world the hero, while accent colors guide attention to milestones — reading like progress in a game, not navigation in a site.

### 2. Olivier Larose

**Typography**
- Geometric sans-serif with deliberately generous letter-spacing on nav elements ("B l o g", "C o n t a c t").
- Minimal weight differentiation — consistent medium weight across hierarchy.
- Large display scale for project titles, restrained body copy.
- Optical sizing implied via tighter tracking on smaller text.

**Color**
- High-contrast light mode — black on white.
- Strategic accent use: small symbols (sun, chemical motifs) as tonal punctuation, not dominant CTAs.
- Monochromatic project cards rely on imagery for visual interest.

**Layout**
- Hero: centered stacked layout, symmetrical alignment.
- Asymmetric project grid — alternating full-width and contained card layouts.
- Dense tabular project listings (Project, Category, Client, Year) contrasted with sparse white space between sections.

**Motion**
- Low motion density; restraint matches the minimalist aesthetic.
- Motion concentrated on link hover states and image reveals.
- Easing personalities understated rather than dramatic.

**Why it works:** Spacing — not weight contrast — does the work of hierarchy. Letter-spaced nav and dense project tables create rhythm through pacing, making small chromatic moments feel intentional and premium.

### 3. Brittany Chiang

*Caveat: WebFetch inferred some details from Next.js/Tailwind context rather than direct observation.*

**Typography**
- Inter typeface — clean modern neutrality, technical credibility.
- Clear weight hierarchy implied between headings and body.
- Structured scale progression (H1 → smaller sections).
- Optical sizing consistent with Tailwind defaults.

**Color**
- Dark theme as default — minimal dark-blue aesthetic.
- High contrast tuned for accessibility.
- Accent color reserved for interactive elements (links, CTAs).
- Monochromatic foundation with strategic color where engagement matters.

**Layout**
- Left-aligned navigation, content-first structure.
- Asymmetric project cards with image/text pairing variation.
- Consistent vertical rhythm via sectioned content blocks.
- Dense information without crowding — whitespace breathing room.

**Motion**
- Subtle hover/focus states on links and social icons.
- Easter-egg micro-interactions (rotating Tardis GIF) suggest playful personality without dominating.
- Motion limited to interaction feedback rather than entrance animations.

**Why it works:** A developer's restraint-as-aesthetic. The accent color does precise work where it earns its place; everything else stays out of the way of fast scanning. Easter eggs are the personality vector — not entrance choreography.

### 4. Lee Robinson

*Caveat: some details inferred from developer-audience context rather than direct observation.*

**Typography**
- Serif body text with clean sans-serif for navigation/headers — readable hierarchy.
- Moderate weight contrast between body and headings emphasizes section breaks.
- Generous line-height supports scanning of link-heavy content.
- Favors system fonts for performance over custom typefaces.

**Color**
- Dark mode with high contrast (light text on dark background).
- Accent color reserved for interactive elements (links, CTAs) — sparing.
- Monochromatic foundation with selective color for calls-to-action.

**Layout**
- Single-column vertical flow with abundant whitespace between sections.
- No aggressive grid — emphasis on breathing room and legibility.
- Moderate density; list-based organization without cramming.
- Consistent left-alignment creates predictable rhythm.

**Motion**
- Static; no entrance animation.
- Subtle hover states on links only.
- Motion intentionally absent — favors instant clarity.

**Why it works:** Performance and content-first aesthetics double as brand position. The site loads instantly, scans cleanly, and trusts the reader — exactly the values the audience cares about.

## Cross-cutting patterns

The 4 analyzed sites split clearly into TWO distinct directions, not one.

**Cluster A — Showcase canvas (Bruno; the 3 flagged sites likely also fit here):**
- Full-bleed interactive canvas as the hero.
- Site IS the portfolio piece — interaction is content.
- Motion is continuous and ambient.
- Typography is friendly/playful, not restraint-led.

**Cluster B — Content-led restraint (Olivier, Brittany, Lee):**
- Vertical-flow asymmetric layouts with breathing room.
- Motion is minimal — concentrated on hover states only.
- Typography uses moderate weight contrast and generous spacing.
- Color: 3 of 3 use dark or high-contrast palette with monochromatic foundation + sparing accent reserved for CTAs.

**Specific patterns within Cluster B (3 of 3 share):**
- **Typography:** sans-serif primary (Inter or similar geometric grotesque); restraint over expression; weight contrast moderate.
- **Color:** monochromatic foundation; accent reserved for interaction; 2 of 3 use dark mode (Brittany, Lee), 1 uses light mode (Olivier).
- **Layout:** asymmetric vertical grid; alternating density (dense tables ↔ sparse white space).
- **Motion:** minimal entrance animation; hover-states-only; rejection of decorative animation.

The vertical's design-press canon does not converge on a single aesthetic — it has two opposing winning archetypes. Knowing which one the client wants is the upstream design decision, not which preset to pick.

## Bridge to preset library

**Closest existing presets (Cluster B — content-led restraint):**
- **Typography:** `typo.modernist-inter-tight` is the right preset — confident, technical, weight-led hierarchy. Could also work: a future "Portfolio Restraint" preset closer to system-serif body + sans display (Lee Robinson's pattern), which doesn't currently exist.
- **Color:** `color.obsidian` for dark mode; `color.paper` for the Olivier-style light mode. Both fit.
- **Layout:** **gap.** No current preset matches "vertical-flow asymmetric portfolio cards with alternating density." The closest is `layout.split-editorial`, but that's a hero archetype, not a multi-section flow. Recommend adding a `layout.portfolio-vertical` archetype before composing a DNA from Cluster B references.

**Closest existing presets (Cluster A — showcase canvas):**
- **Typography:** **gap.** No current preset is friendly + display-led the way Bruno's Nunito + Amatic SC pairing is. Recommend a `typo.playful-display-pair` preset for portfolios that lean expressive over restrained.
- **Color:** `color.obsidian` is dark-mode-friendly but tuned for cinematic flat design, not 3D-with-accent-rewards. A `color.canvas-game` palette (warm dark + multiple-purpose accent colors for state feedback) is the gap.
- **Layout:** `layout.full-bleed` is closest, but it's tuned for static hero imagery. A `layout.showcase-canvas` archetype (full-viewport interactive surface + edge-docked overlay UI) is the gap.

**Big-picture:** the preset library currently serves Cluster B reasonably but Cluster A almost not at all. If the user takes on portfolio briefs that lean into the visually-explosive direction, three new presets should land first — typography, color, layout.

## Recommended design direction

For the brief as stated ("portfolio that demonstrates visually exquisite skills"), pick the cluster before composing presets. The two paths produce categorically different mockups:

1. **Cluster A (showcase canvas).** If the client is a designer/creative-coder wanting the portfolio itself to be a 3D/interactive art piece, this is the canon — but the preset library has structural gaps and would need three new presets first. Most ambitious; longest path to a polished mockup.
2. **Cluster B (content-led restraint).** If the client is a designer/developer wanting their work to take center stage with the portfolio as a reading frame, the existing `Modernist + Obsidian + (new layout.portfolio-vertical)` composition gets close. Most practical; one new layout archetype away from a strong DNA.

Confirm the cluster choice with the client before composing. Both win design awards; neither is obviously the "right" answer.
