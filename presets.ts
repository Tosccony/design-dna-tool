/**
 * Preset Schema — the foundation of the Design DNA system.
 *
 * Philosophy: each preset is a curated *constraint*, not a starting point.
 * The generator composes one from each category into a "Design DNA" that
 * commits the entire mockup to a coherent aesthetic.
 *
 * All presets are JSON-serializable so they can:
 *   - be stored as files in /presets
 *   - be passed to the LLM as constraints during generation
 *   - be diffed and versioned in git
 *   - be compiled to CSS variables at runtime
 */

// === Shared metadata ============================================

export type ProjectKind =
  | 'editorial'
  | 'commerce'
  | 'portfolio'
  | 'product'
  | 'agency'
  | 'corporate'
  | 'landing';

export interface PresetMeta {
  id: string;
  name: string;
  /** One-line summary shown in pickers */
  description: string;
  /** Character notes — also fed to the LLM as aesthetic guidance */
  character: string;
  /** Project types this preset suits */
  bestFor: ProjectKind[];
  version: number;
}

// === TYPOGRAPHY =================================================

export interface FontFamily {
  name: string;
  fallback: string[];
  weights: number[];
  source:
    | { type: 'google'; url: string }
    | { type: 'local'; path: string }
    | { type: 'system' };
  opticalSizing?: boolean;
}

export interface TypeSpec {
  weight: number;
  /** Unitless line-height */
  lineHeight: number;
  /** Letter-spacing in em (e.g. -0.02 = -2%) */
  tracking: number;
}

export interface TypographyPreset extends PresetMeta {
  display: FontFamily;
  body: FontFamily;
  mono?: FontFamily;
  /** Modular scale ratio (1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618) */
  scaleRatio: number;
  /** Base body size in px */
  baseSize: number;
  displaySpec: TypeSpec;
  bodySpec: TypeSpec;
  eyebrowSpec?: TypeSpec & {
    textTransform: 'uppercase' | 'none';
  };

  /** Photographic direction — mood, lighting, subject. Concatenated across the DNA's typography, color, and layout presets to form the preamble of an image-generation prompt. */
  photoDirection?: string;
}

// === COLOR ======================================================

export type ColorMode = 'light' | 'dark' | 'duotone';

/** Semantic tokens — roles, not values. The whole point. */
export interface ColorTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  accent: string;
  accentInk: string;
  border: string;
  borderStrong: string;
}

export interface ColorPreset extends PresetMeta {
  mode: ColorMode;
  tokens: ColorTokens;
  /** Rules for when the accent earns its place — guides the LLM */
  accentRules: string;
  contrast: {
    inkOnBackground: number;
    inkMutedOnBackground: number;
    accentInkOnAccent: number;
  };

  /** Photographic direction — mood, lighting, subject. Concatenated across the DNA's typography, color, and layout presets to form the preamble of an image-generation prompt. */
  photoDirection?: string;
}

// === EASING =====================================================

export type EasingRole = 'entrance' | 'exit' | 'state-change' | 'attention' | 'continuous';
export type EasingPersonality = 'snappy' | 'smooth' | 'dramatic' | 'gentle' | 'mechanical';

export interface EasingPreset extends PresetMeta {
  /** cubic-bezier(x1, y1, x2, y2) */
  bezier: [number, number, number, number];
  /** GSAP equivalent if one exists, e.g. 'expo.out' */
  gsapName?: string;
  useFor: EasingRole[];
  personality: EasingPersonality;
}

// === MOTION PRIMITIVES ==========================================

export type MotionLibrary = 'gsap' | 'framer-motion' | 'css';

export interface MotionPrimitive extends PresetMeta {
  library: MotionLibrary;
  /** Parameterized code template — generator fills selectors/values */
  template: string;
  /** Default easing preset id to pair with */
  defaultEasingId: string;
  useCase: string;
  imports: string[];
  performance: string;
  /** What's happening and why — for learning */
  notes: string;
  reducedMotion: 'disable' | 'instant' | 'simplify';
}

// === LAYOUT ARCHETYPES ==========================================

export type HeroPattern =
  | 'split'
  | 'centered-editorial'
  | 'full-bleed-image'
  | 'asymmetric'
  | 'horizontal-scroll'
  | 'minimal-typographic';

export interface LayoutArchetype extends PresetMeta {
  grid: {
    columns: number;
    gutter: string;
    maxWidth: string;
  };
  hero: HeroPattern;
  flow: 'rhythmic' | 'punctuated' | 'continuous' | 'modular';
  density: 'spacious' | 'balanced' | 'dense';
  notes: string;

  /** Photographic direction — mood, lighting, subject. Concatenated across the DNA's typography, color, and layout presets to form the preamble of an image-generation prompt. */
  photoDirection?: string;
}

// === DESIGN DNA — the composition ===============================

export interface DesignDNA {
  projectId: string;
  projectName: string;
  client: string;
  typographyId: string;
  colorId: string;
  /** Easings assigned to roles — most projects use 2-3 curves total */
  easingsByRole: {
    primary: string;
    entrance: string;
    exit: string;
    attention: string;
  };
  motionPrimitiveIds: string[];
  layoutId: string;
  /** Project-specific overrides without forking the preset */
  overrides?: Partial<{
    accentColor: string;
    displayFont: string;
  }>;
}

// ================================================================
// SEED PRESETS
// Two each — enough to prove the schema and start composing.
// ================================================================

export const typographyPresets: TypographyPreset[] = [
  {
    id: 'typo.editorial-fraunces',
    name: 'Editorial',
    description: 'Magazine-grade serif display with a quiet sans body.',
    character:
      'Considered, literary, time-on-press. Optical sizing makes display feel custom-cut.',
    photoDirection: 'Editorial photography — considered, archival quality. Natural light, shallow depth of field. Subjects feel observed, not posed. Feels like a Sunday magazine spread.',
    bestFor: ['editorial', 'portfolio', 'agency'],
    version: 1,
    display: {
      name: 'Fraunces',
      fallback: ['Georgia', 'serif'],
      weights: [300, 400, 500, 700, 900],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&display=swap',
      },
      opticalSizing: true,
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.333,
    baseSize: 17,
    displaySpec: { weight: 300, lineHeight: 0.95, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: -0.005 },
    eyebrowSpec: { weight: 500, lineHeight: 1.2, tracking: 0.08, textTransform: 'uppercase' },
  },
  {
    id: 'typo.modernist-inter-tight',
    name: 'Modernist',
    description: 'Single-family system relying on weight contrast for hierarchy.',
    character:
      'Confident, technical, late-Helvetica energy. Display at 900, body at 400 — the gap does the work.',
    photoDirection: 'Product/architectural photography — clean, geometric, technically composed. Surfaces and edges over warmth and texture. No styling clutter; the subject is the form. Late-modernist clarity.',
    bestFor: ['product', 'agency', 'commerce', 'landing'],
    version: 1,
    display: {
      name: 'Inter Tight',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 700, 900],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700;900&display=swap',
      },
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.25,
    baseSize: 16,
    displaySpec: { weight: 900, lineHeight: 0.92, tracking: -0.04 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: -0.01 },
  },
  {
    id: 'typo.workshop-libre-franklin',
    name: 'Workshop',
    description: 'American grotesque heritage — Franklin Gothic revival as a single-family system.',
    character:
      'Press-room utility with body. Reads as workshop-confident, not tech-product. Demi (600) holds the eyebrow/label work — the weight Franklin Gothic was built around in advertising. Display at 800 lets hero type land on screen the way Demi lands on print.',
    photoDirection: 'Documentary, lived-in. Real working environment, not a styled studio. Visible wear and use on tools and surfaces. Warm work-light, not flash. Press-room utility.',
    bestFor: ['agency', 'commerce', 'editorial', 'product'],
    version: 1,
    display: {
      name: 'Libre Franklin',
      fallback: ['Franklin Gothic Medium', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      weights: [400, 500, 600, 700, 800, 900],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800;900&display=swap',
      },
    },
    body: {
      name: 'Libre Franklin',
      fallback: ['Franklin Gothic Medium', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.333,
    baseSize: 16,
    displaySpec: { weight: 800, lineHeight: 0.95, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: -0.005 },
    eyebrowSpec: { weight: 600, lineHeight: 1.2, tracking: 0.08, textTransform: 'uppercase' },
  },
  {
    id: 'typo.swiss-neutral',
    name: 'Swiss Neutral',
    description: 'Inter as a weight-contrast system — Söhne substitute for SaaS work.',
    character: 'Rationalist Swiss sensibility translated for digital. Confident, neutral, screen-native — the typographic equivalent of clean white space. The pairing the design canon defaults to when they cite "Söhne" — Stripe, Linear, Vercel-era SaaS.',
    bestFor: ['product', 'landing', 'corporate', 'agency'],
    version: 1,
    display: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.2,
    baseSize: 16,
    displaySpec: { weight: 600, lineHeight: 1.05, tracking: -0.02 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: -0.005 },
  },
  {
    id: 'typo.geist-developer',
    name: 'Geist Developer',
    description: 'Vercel\'s open-source typeface paired with its mono companion.',
    character: 'Engineering-first, terminal-adjacent — Vercel\'s house language. Mono body anchors the design in tooling and code without going full brutalist. Default look for AI/dev-tool landing pages.',
    bestFor: ['product', 'landing', 'agency'],
    version: 1,
    display: {
      name: 'Geist',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap',
      },
    },
    body: {
      name: 'Geist Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap',
      },
    },
    mono: {
      name: 'Geist Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.25,
    baseSize: 15,
    displaySpec: { weight: 600, lineHeight: 1.0, tracking: -0.03 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: 0 },
  },
  {
    id: 'typo.quiet-geometric',
    name: 'Quiet Geometric',
    description: 'Manrope single-family — semi-geometric sans with warm terminals.',
    character: 'Approachable, semi-geometric, slightly warm — startup-friendly without being generic. Soft enough for fintech, sharp enough for B2B. Distinctive against Inter via warmer terminals and slightly higher contrast.',
    bestFor: ['product', 'landing', 'corporate'],
    version: 1,
    display: {
      name: 'Manrope',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap',
      },
    },
    body: {
      name: 'Manrope',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap',
      },
    },
    scaleRatio: 1.25,
    baseSize: 16,
    displaySpec: { weight: 700, lineHeight: 1.1, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: 0 },
  },
  {
    id: 'typo.ibm-technical',
    name: 'IBM Technical',
    description: 'IBM Plex Sans display + Plex Mono body — GT America substitute.',
    character: 'Engineering pedigree — corporate-but-credible sibling of Geist. Plex carries 100 years of "this is serious computing." Higher x-height and squarer terminals than Geist — feels enterprise rather than indie-dev.',
    bestFor: ['corporate', 'product', 'agency'],
    version: 1,
    display: {
      name: 'IBM Plex Sans',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
      },
    },
    body: {
      name: 'IBM Plex Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap',
      },
    },
    mono: {
      name: 'IBM Plex Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.25,
    baseSize: 15,
    displaySpec: { weight: 600, lineHeight: 1.1, tracking: -0.015 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: 0 },
  },
  {
    id: 'typo.jetbrains-hacker',
    name: 'JetBrains Hacker',
    description: 'All-mono with humanist proportions — real-engineering-tool register.',
    character: 'All-mono with ligature support. Humanist proportions and sharper geometry than Space Mono — reads "real engineering tool," not aesthetic-mono. Recurring on AI/ML company sites.',
    bestFor: ['product', 'landing', 'agency'],
    version: 1,
    display: {
      name: 'JetBrains Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
      },
    },
    body: {
      name: 'JetBrains Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
      },
    },
    mono: {
      name: 'JetBrains Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
      },
    },
    scaleRatio: 1.2,
    baseSize: 15,
    displaySpec: { weight: 700, lineHeight: 1.05, tracking: 0 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: 0 },
  },
  {
    id: 'typo.editorial-display-bodoni',
    name: 'Editorial Display',
    description: 'Bodoni Moda Didone display + Inter body — magazine-cover energy.',
    character: 'Vogue-cover energy — high-contrast Didone hairlines as oversized display, set against neutral sans body. Reads as a fashion masthead. Closest free analog to Migra/Reckless.',
    bestFor: ['editorial', 'commerce', 'agency'],
    version: 1,
    display: {
      name: 'Bodoni Moda',
      fallback: ['Didot', 'Georgia', 'serif'],
      weights: [400, 700, 900],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;700;900&display=swap',
      },
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.5,
    baseSize: 17,
    displaySpec: { weight: 700, lineHeight: 0.95, tracking: -0.02 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: -0.005 },
  },
  {
    id: 'typo.bookish-modern',
    name: 'Bookish Modern',
    description: 'Newsreader single-family — body-first contemporary serif with optical sizing.',
    character: 'Substack-meets-The-Atlantic. Long-form reading-first serif with optical-size variants. Warm, contemporary, made to read 2,000 words. Body-first serif system — softer terminals than display-led editorial faces.',
    bestFor: ['editorial', 'corporate', 'landing'],
    version: 1,
    display: {
      name: 'Newsreader',
      fallback: ['Georgia', 'serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..700&display=swap',
      },
      opticalSizing: true,
    },
    body: {
      name: 'Newsreader',
      fallback: ['Georgia', 'serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..700&display=swap',
      },
      opticalSizing: true,
    },
    scaleRatio: 1.333,
    baseSize: 18,
    displaySpec: { weight: 600, lineHeight: 1.15, tracking: -0.01 },
    bodySpec: { weight: 400, lineHeight: 1.65, tracking: 0 },
  },
  {
    id: 'typo.garamond-classic',
    name: 'Garamond Classic',
    description: 'EB Garamond as a single-family book-press system.',
    character: 'Renaissance proportions, scholarly, unhurried — a faithful Claude Garamond revival. Reads university-press, indie-bookstore, considered. Honors 500 years of book typography convention.',
    bestFor: ['editorial', 'corporate'],
    version: 1,
    display: {
      name: 'EB Garamond',
      fallback: ['Garamond', 'Georgia', 'serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&display=swap',
      },
    },
    body: {
      name: 'EB Garamond',
      fallback: ['Garamond', 'Georgia', 'serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.333,
    baseSize: 18,
    displaySpec: { weight: 600, lineHeight: 1.15, tracking: 0 },
    bodySpec: { weight: 400, lineHeight: 1.7, tracking: 0 },
  },
  {
    id: 'typo.spectral-reader',
    name: 'Spectral Reader',
    description: 'Spectral single-family — Production Type\'s reading-first serif.',
    character: 'Long-form reading at its most considered. Production Type built Spectral to compete with commercial text faces. Quiet, confident, classical without being stuffy. The most respected free reading serif per Typewolf.',
    bestFor: ['editorial', 'corporate'],
    version: 1,
    display: {
      name: 'Spectral',
      fallback: ['Georgia', 'serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&display=swap',
      },
    },
    body: {
      name: 'Spectral',
      fallback: ['Georgia', 'serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.25,
    baseSize: 18,
    displaySpec: { weight: 600, lineHeight: 1.1, tracking: 0 },
    bodySpec: { weight: 400, lineHeight: 1.7, tracking: 0 },
  },
  {
    id: 'typo.plain-serif-modern',
    name: 'Plain Serif Modern',
    description: 'Source Serif 4 + Source Sans 3 — Adobe-pedigree designed-as-a-system pairing.',
    character: 'Both designed by Frank Grießhammer as a paired system. Reads professional-services, considered, not flashy — the "design is mature" register. Sibling families with matching x-heights, drawn together.',
    bestFor: ['corporate', 'editorial', 'product'],
    version: 1,
    display: {
      name: 'Source Serif 4',
      fallback: ['Georgia', 'serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap',
      },
    },
    body: {
      name: 'Source Sans 3',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.333,
    baseSize: 16,
    displaySpec: { weight: 600, lineHeight: 1.1, tracking: -0.015 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: 0 },
  },
  {
    id: 'typo.display-grotesque',
    name: 'Display Grotesque',
    description: 'Space Grotesk single-family — geometric grotesque with descender quirks.',
    character: 'Quirky-modern, slightly off-grid. Geometric forms with personality in the descenders and tail of the R. Reads "design studio with a sense of humor." Recognizable signature without going brutalist.',
    bestFor: ['agency', 'portfolio', 'product', 'landing'],
    version: 1,
    display: {
      name: 'Space Grotesk',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap',
      },
    },
    body: {
      name: 'Space Grotesk',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap',
      },
    },
    scaleRatio: 1.333,
    baseSize: 16,
    displaySpec: { weight: 700, lineHeight: 1.0, tracking: -0.03 },
    bodySpec: { weight: 400, lineHeight: 1.5, tracking: 0 },
  },
  {
    id: 'typo.brutalist-mono',
    name: 'Brutalist Mono',
    description: 'Space Mono single-family — terminal output as design system.',
    character: 'All-mono, uncompromising — terminal output as design system. Reads as either "tech/crypto" or "post-internet art studio" depending on color treatment. Are.na / Read.cv aesthetic.',
    bestFor: ['portfolio', 'agency', 'landing'],
    version: 1,
    display: {
      name: 'Space Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
      },
    },
    body: {
      name: 'Space Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
      },
    },
    mono: {
      name: 'Space Mono',
      fallback: ['ui-monospace', 'Menlo', 'monospace'],
      weights: [400, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
      },
    },
    scaleRatio: 1.2,
    baseSize: 15,
    displaySpec: { weight: 700, lineHeight: 1.05, tracking: 0 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: 0 },
  },
  {
    id: 'typo.bricolage-modern',
    name: 'Bricolage Modern',
    description: 'Bricolage Grotesque heavyweight display + Inter body.',
    character: 'French-Swiss collage — Bricolage\'s reverse-stress flicks and ink traps give heavyweight display a hand-cut feel. Ferocious at 120px. Most-adopted "new" Google Font on Awwwards SOTD selections.',
    bestFor: ['agency', 'portfolio'],
    version: 1,
    display: {
      name: 'Bricolage Grotesque',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 700, 800],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;700;800&display=swap',
      },
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.414,
    baseSize: 16,
    displaySpec: { weight: 800, lineHeight: 0.95, tracking: -0.04 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: 0 },
  },
  {
    id: 'typo.syne-studio',
    name: 'Syne Studio',
    description: 'Syne display + Inter body — contemporary art-center energy.',
    character: 'Designed for the Synesthésie art center; carries that experimental-but-legible vibe. Quietly weird at large sizes — narrow proportions and an unconventional bold (different shape than the regular).',
    bestFor: ['agency', 'portfolio'],
    version: 1,
    display: {
      name: 'Syne',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600, 700, 800],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap',
      },
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.414,
    baseSize: 16,
    displaySpec: { weight: 700, lineHeight: 1.0, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: 0 },
  },
  {
    id: 'typo.familjen-editorial',
    name: 'Familjen Editorial',
    description: 'Familjen Grotesk display + Newsreader body — Nordic sans-on-serif inversion.',
    character: 'Inverts the typical magazine pattern (serif display + sans body). Swedish grotesque headlines on a warm serif body. Ink traps in Familjen add character; Newsreader keeps the body warm. Recurring on Scandinavian cultural sites.',
    bestFor: ['editorial', 'agency'],
    version: 1,
    display: {
      name: 'Familjen Grotesk',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;700&display=swap',
      },
    },
    body: {
      name: 'Newsreader',
      fallback: ['Georgia', 'serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..500&display=swap',
      },
      opticalSizing: true,
    },
    scaleRatio: 1.333,
    baseSize: 17,
    displaySpec: { weight: 700, lineHeight: 1.0, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.7, tracking: 0 },
  },
  {
    id: 'typo.dm-editorial',
    name: 'DM Editorial',
    description: 'DM Serif Display + DM Sans — Colophon-designed paired system.',
    character: 'Refined and gentle — high-contrast Didone display tempered by DM Sans\' geometric warmth. Lifestyle, wellness, soft commerce. High-contrast display without Bodoni\'s coldness.',
    bestFor: ['commerce', 'landing', 'editorial'],
    version: 1,
    display: {
      name: 'DM Serif Display',
      fallback: ['Georgia', 'serif'],
      weights: [400],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
      },
    },
    body: {
      name: 'DM Sans',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.333,
    baseSize: 16,
    displaySpec: { weight: 400, lineHeight: 1.0, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: -0.01 },
  },
  {
    id: 'typo.cormorant-luxury',
    name: 'Cormorant Luxury',
    description: 'Cormorant Garamond hairline display + Inter body — five-star hospitality.',
    character: 'Luxury-hospitality elegance — extreme stroke contrast, delicate hairlines. Five-star hotel, fine wine, perfumery. Display-only serif paired with neutral Inter body — display does the heavy emotional lifting.',
    bestFor: ['commerce', 'editorial'],
    version: 1,
    display: {
      name: 'Cormorant Garamond',
      fallback: ['Garamond', 'Georgia', 'serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
      },
    },
    body: {
      name: 'Inter',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap',
      },
    },
    scaleRatio: 1.5,
    baseSize: 17,
    displaySpec: { weight: 500, lineHeight: 1.05, tracking: 0.005 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: 0 },
  },
  {
    id: 'typo.condensed-display',
    name: 'Condensed Display',
    description: 'Anton single-weight condensed display + Work Sans body — Druk substitute.',
    character: 'Vertical, poster-ish, athletic — tall condensed display reads as sports/fashion/culture. Stadium-scale at large sizes. Single-weight design forces hierarchy through size, not weight.',
    bestFor: ['commerce', 'landing', 'agency'],
    version: 1,
    display: {
      name: 'Anton',
      fallback: ['Impact', 'Helvetica', 'sans-serif'],
      weights: [400],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Anton&display=swap',
      },
    },
    body: {
      name: 'Work Sans',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap',
      },
    },
    scaleRatio: 1.618,
    baseSize: 16,
    displaySpec: { weight: 400, lineHeight: 0.95, tracking: 0 },
    bodySpec: { weight: 400, lineHeight: 1.6, tracking: 0 },
  },
  {
    id: 'typo.archivo-newsroom',
    name: 'Archivo Newsroom',
    description: 'Archivo Black headline + Archivo body — tabloid headline density.',
    character: 'Tabloid headline density — heavy gothic display with high-readability text companion. Punchy, declarative, news-like. Wider proportions than Anton (more Druk than Bebas).',
    bestFor: ['editorial', 'agency', 'landing'],
    version: 1,
    display: {
      name: 'Archivo Black',
      fallback: ['Helvetica', 'Arial', 'sans-serif'],
      weights: [400],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
      },
    },
    body: {
      name: 'Archivo',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap',
      },
    },
    scaleRatio: 1.5,
    baseSize: 16,
    displaySpec: { weight: 400, lineHeight: 0.9, tracking: -0.025 },
    bodySpec: { weight: 400, lineHeight: 1.55, tracking: 0 },
    eyebrowSpec: { weight: 600, lineHeight: 1.2, tracking: 0.06, textTransform: 'uppercase' },
  },
  {
    id: 'typo.schibsted-ui',
    name: 'Schibsted UI',
    description: 'Schibsted Grotesk single-family — Nordic newsroom commission.',
    character: 'Bakken & Bæck commissioned this for the largest Scandinavian media group. Reads precise, editorial-but-digital. Designed digital-first — slightly higher x-height and softer terminals than Inter.',
    bestFor: ['editorial', 'product', 'corporate'],
    version: 1,
    display: {
      name: 'Schibsted Grotesk',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap',
      },
    },
    body: {
      name: 'Schibsted Grotesk',
      fallback: ['system-ui', 'sans-serif'],
      weights: [400, 500, 600, 700],
      source: {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap',
      },
    },
    scaleRatio: 1.25,
    baseSize: 16,
    displaySpec: { weight: 700, lineHeight: 1.05, tracking: -0.02 },
    bodySpec: { weight: 400, lineHeight: 1.5, tracking: -0.005 },
  },
];

export const colorPresets: ColorPreset[] = [
  {
    id: 'color.paper',
    name: 'Paper',
    description: 'Off-white background, deep ink, single warm accent.',
    character:
      'Quiet luxury. Reads like printed matter. The accent is rare and meaningful.',
    photoDirection: 'Warm neutral palette — bone, cream, deep ink. One small terracotta accent if any. Soft daylight, no cool blue tones. Printed-matter feel, not screen-feel.',
    bestFor: ['editorial', 'portfolio', 'agency'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#F4F1EC',
      surface: '#FFFFFF',
      surfaceAlt: '#EAE6DF',
      ink: '#141210',
      inkMuted: '#5C5853',
      inkSubtle: '#8E8A85',
      accent: '#C8553D',
      accentInk: '#FFFFFF',
      border: '#E2DDD5',
      borderStrong: '#C8C3BB',
    },
    accentRules:
      'Accent reserved for: primary CTA, single hover state, one editorial pull-quote per page. Never used for body text or backgrounds larger than a button.',
    contrast: {
      inkOnBackground: 14.8,
      inkMutedOnBackground: 6.1,
      accentInkOnAccent: 4.9,
    },
  },
  {
    id: 'color.obsidian',
    name: 'Obsidian',
    description: 'Near-black ground, paper ink, electric accent.',
    character:
      'Cinematic dark mode. Background is warm-black, not pure black. Accent has voltage.',
    photoDirection: 'Warm-black palette, deep shadows, single warm light source. No cool blue tones, no flat exposure. Cinematic dark — the kind of frame that holds an entire opening title.',
    bestFor: ['product', 'agency', 'landing'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#0B0B0D',
      surface: '#15151A',
      surfaceAlt: '#1F1F26',
      ink: '#F2EFEA',
      inkMuted: '#9E9B96',
      inkSubtle: '#605E5A',
      accent: '#7CFF6B',
      accentInk: '#0B0B0D',
      border: '#2A2A33',
      borderStrong: '#3D3D48',
    },
    accentRules:
      'Accent is high-voltage; one point of focus per viewport. Never two accents visible at once. Avoid using it for body links — too aggressive.',
    contrast: {
      inkOnBackground: 16.2,
      inkMutedOnBackground: 5.4,
      accentInkOnAccent: 17.1,
    },
  },
  {
    id: 'color.cool-slate',
    name: 'Cool Slate',
    description: 'Cool grayscale + electric indigo for product surfaces.',
    character:
      'The default Stripe / Linear marketing register. Confident, technical — the accent does the talking. Reads as "well-engineered SaaS" without trying.',
    bestFor: ['product', 'landing', 'corporate', 'agency'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#FFFFFF',
      surface: '#F6F9FC',
      surfaceAlt: '#EFF3F8',
      ink: '#0A2540',
      inkMuted: '#425466',
      inkSubtle: '#8898AA',
      accent: '#635BFF',
      accentInk: '#FFFFFF',
      border: '#E3E8EE',
      borderStrong: '#C1C9D2',
    },
    accentRules:
      'Accent reserved for primary CTA, active nav state, single inline link color, and one chart series. Never used for body text, large fills, or decorative backgrounds.',
    contrast: {
      inkOnBackground: 15.5,
      inkMutedOnBackground: 7.8,
      accentInkOnAccent: 4.7,
    },
  },
  {
    id: 'color.anthropic-clay',
    name: 'Anthropic Clay',
    description: 'Warm bone background, soft black ink, terracotta accent.',
    character:
      'Quiet, considered, faintly handcrafted. Reads as "thoughtful research lab" — warmer than tech-default, calmer than fashion-default. The accent has the warmth of Sienna pigment, not a CTA color.',
    bestFor: ['editorial', 'corporate', 'landing', 'portfolio'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#FAF9F5',
      surface: '#F4F2EA',
      surfaceAlt: '#E8E6DC',
      ink: '#141413',
      inkMuted: '#6B6A60',
      inkSubtle: '#B0AEA5',
      accent: '#D97757',
      accentInk: '#141413',
      border: '#E8E6DC',
      borderStrong: '#CFCCC0',
    },
    accentRules:
      'Accent for primary CTA, link underlines, and one named-section accent. Never as a tint on text and never used in dense data.',
    contrast: {
      inkOnBackground: 17.5,
      inkMutedOnBackground: 5.2,
      accentInkOnAccent: 5.9,
    },
  },
  {
    id: 'color.sage-wellness',
    name: 'Sage Wellness',
    description: 'Off-white canvas, dusty sage surfaces, deep-pine accent.',
    character:
      'Apothecary calm. The DTC-wellness register — Aesop, Necessaire, Loop Earplugs. Doesn\'t shout, doesn\'t apologize, smells faintly of eucalyptus.',
    bestFor: ['commerce', 'landing', 'portfolio'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#F2EFE6',
      surface: '#E8E4D7',
      surfaceAlt: '#D9D6C7',
      ink: '#2B2E27',
      inkMuted: '#5D6155',
      inkSubtle: '#8E9285',
      accent: '#3F5340',
      accentInk: '#F2EFE6',
      border: '#D9D6C7',
      borderStrong: '#B5B2A3',
    },
    accentRules:
      'Accent reserved for primary CTA and one product-row badge. Never used for body text — the system relies on tonal hierarchy, not color hits.',
    contrast: {
      inkOnBackground: 12.0,
      inkMutedOnBackground: 5.5,
      accentInkOnAccent: 7.2,
    },
  },
  {
    id: 'color.newsprint',
    name: 'Newsprint',
    description: 'Cool oat background, true black ink, dusk-blue link as the only color.',
    character:
      'The Times / NYT Magazine / Read Max register. Reads first as "this is editorial, the writing is the point." Black is true black; the link blue is the only color voltage.',
    bestFor: ['editorial', 'portfolio'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#F5F2E8',
      surface: '#EDE9DC',
      surfaceAlt: '#E2DDCA',
      ink: '#0E0E0C',
      inkMuted: '#3E3E3A',
      inkSubtle: '#7A7770',
      accent: '#1E4D7B',
      accentInk: '#F5F2E8',
      border: '#D8D3BF',
      borderStrong: '#A8A292',
    },
    accentRules:
      'Accent only for hyperlinks and pull-quote rules. Never a CTA fill — buttons are filled with ink, not accent. The blue is a 1973-Linotype reference, not a brand color.',
    contrast: {
      inkOnBackground: 17.3,
      inkMutedOnBackground: 9.6,
      accentInkOnAccent: 7.8,
    },
  },
  {
    id: 'color.ald-salon',
    name: 'ALD Salon',
    description: 'Warm taupe background, deep cocoa ink, vintage forest accent.',
    character:
      'Aimé Leon Dore at the Madison shop. Old-money menswear aesthetic — wood paneling, lambswool, Italian café posters. Reads "considered storefront" not "tech site."',
    bestFor: ['commerce', 'editorial', 'portfolio'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#E8E1D3',
      surface: '#DDD4C2',
      surfaceAlt: '#CFC5AE',
      ink: '#2B221B',
      inkMuted: '#5C4F3E',
      inkSubtle: '#8A7E6C',
      accent: '#2E4A35',
      accentInk: '#E8E1D3',
      border: '#CFC5AE',
      borderStrong: '#A89C84',
    },
    accentRules:
      'Accent reserved for primary CTA, sale-tag pill, and the brand wordmark on dark imagery. Never tint backgrounds; the warmth comes from background, not accent.',
    contrast: {
      inkOnBackground: 12.0,
      inkMutedOnBackground: 6.1,
      accentInkOnAccent: 7.5,
    },
  },
  {
    id: 'color.substack-reader',
    name: 'Substack Reader',
    description: 'Cream paper, near-black serif ink, single saturated orange accent.',
    character:
      'Indie publication / writer\'s site. The orange is signature — a Klim-foundry-flavored vermilion that says "this person publishes." Pairs aggressively well with serif headings.',
    bestFor: ['editorial', 'portfolio', 'landing'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#FBF9F4',
      surface: '#F3F0E7',
      surfaceAlt: '#EAE6D8',
      ink: '#1A1A1A',
      inkMuted: '#525252',
      inkSubtle: '#8A8A8A',
      accent: '#FF6719',
      accentInk: '#1A1A1A',
      border: '#E5E1D2',
      borderStrong: '#BCB5A0',
    },
    accentRules:
      'Accent for subscribe CTA, active tag pill, and a single section underline. Never used as body text or large hero fills — the orange is a signature, not a wash.',
    contrast: {
      inkOnBackground: 16.5,
      inkMutedOnBackground: 7.4,
      accentInkOnAccent: 6.0,
    },
  },
  {
    id: 'color.klim-bone',
    name: 'Klim Bone',
    description: 'Cool bone paper, charcoal ink, no chromatic accent — accent equals ink.',
    character:
      'Type foundry / monograph register. Klim, Pangram Pangram, Commercial Type. Reads as "the typography is the design." The lack of an accent is the design choice.',
    bestFor: ['editorial', 'portfolio', 'agency'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#EFECE3',
      surface: '#E6E2D7',
      surfaceAlt: '#DBD6C8',
      ink: '#1B1B19',
      inkMuted: '#4D4B45',
      inkSubtle: '#8A877E',
      accent: '#1B1B19',
      accentInk: '#EFECE3',
      border: '#D2CCBC',
      borderStrong: '#A6A092',
    },
    accentRules:
      'Accent equals ink — buttons, underlines, and rules are all the same dark. Hierarchy is built entirely from weight, scale, and whitespace.',
    contrast: {
      inkOnBackground: 14.6,
      inkMutedOnBackground: 7.4,
      accentInkOnAccent: 14.6,
    },
  },
  {
    id: 'color.arena-manila',
    name: 'Are.na Manila',
    description: 'Manila-folder background, true black ink, single ultramarine accent.',
    character:
      'The Are.na / research-archive register. Clinical without being cold. Looks like a card catalog — organized, neutral, slightly archival.',
    bestFor: ['editorial', 'portfolio', 'product'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#E8E5DA',
      surface: '#DDD9CB',
      surfaceAlt: '#CFCBBA',
      ink: '#000000',
      inkMuted: '#3D3D3D',
      inkSubtle: '#7A7A7A',
      accent: '#1632F0',
      accentInk: '#E8E5DA',
      border: '#CFCBBA',
      borderStrong: '#9F9C8D',
    },
    accentRules:
      'Accent for hyperlinks, the connect/save CTA, and the active-channel indicator. Never used as a fill larger than 8px tall.',
    contrast: {
      inkOnBackground: 16.7,
      inkMutedOnBackground: 8.6,
      accentInkOnAccent: 6.1,
    },
  },
  {
    id: 'color.glossier-blush',
    name: 'Glossier Blush',
    description: 'Warm blush paper, cool brown ink, dusty rose accent.',
    character:
      'Millennial DTC matured for 2026. The pink is muted, slightly translucent, deliberately not "feminine" — gender-neutral apothecary pink. Pairs with imagery, not against it.',
    bestFor: ['commerce', 'landing', 'portfolio'],
    version: 1,
    mode: 'light',
    tokens: {
      background: '#FAEAE6',
      surface: '#F4DDD7',
      surfaceAlt: '#EDCEC5',
      ink: '#3A2A24',
      inkMuted: '#6B564E',
      inkSubtle: '#998479',
      accent: '#C8786E',
      accentInk: '#3A2A24',
      border: '#EDCEC5',
      borderStrong: '#C9A89C',
    },
    accentRules:
      'Accent reserved for primary CTA and one product-row hover. Never re-tint surfaces with accent — the blush is already doing chromatic work.',
    contrast: {
      inkOnBackground: 11.7,
      inkMutedOnBackground: 5.9,
      accentInkOnAccent: 4.1,
    },
  },
  {
    id: 'color.linear-graphite',
    name: 'Linear Graphite',
    description: 'Cool blue-black surfaces stepped through woodsmoke, with pale violet accent.',
    character:
      'Linear\'s exact dark mode. Engineered, professional — the violet is single-pixel-precise. Ships as "this is a serious tool."',
    bestFor: ['product', 'landing', 'agency'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#08090A',
      surface: '#101113',
      surfaceAlt: '#1A1B1E',
      ink: '#F4F5F8',
      inkMuted: '#9CA3AF',
      inkSubtle: '#6B7280',
      accent: '#A8A4F4',
      accentInk: '#08090A',
      border: '#23252A',
      borderStrong: '#34373D',
    },
    accentRules:
      'Accent for primary CTA, focus ring, single chart series, and active-state nav. Never used as background fill or large illustration color.',
    contrast: {
      inkOnBackground: 18.3,
      inkMutedOnBackground: 7.9,
      accentInkOnAccent: 8.8,
    },
  },
  {
    id: 'color.vercel-black',
    name: 'Vercel Black',
    description: 'Near-true-black with neutral grayscale and electric blue.',
    character:
      'Vercel\'s dark mode and the "developer docs" register at large. Pure neutral — no warmth, no cool. The canvas disappears so the content ships.',
    bestFor: ['product', 'landing', 'agency'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#000000',
      surface: '#0A0A0A',
      surfaceAlt: '#171717',
      ink: '#FAFAFA',
      inkMuted: '#A1A1A1',
      inkSubtle: '#737373',
      accent: '#0070F3',
      accentInk: '#FFFFFF',
      border: '#262626',
      borderStrong: '#404040',
    },
    accentRules:
      'Accent for CTAs, links, and focus rings. Never tint surfaces with accent; surfaces are pure neutral steps.',
    contrast: {
      inkOnBackground: 20.1,
      inkMutedOnBackground: 8.1,
      accentInkOnAccent: 4.6,
    },
  },
  {
    id: 'color.midnight-atlas',
    name: 'Midnight Atlas',
    description: 'Deep navy-black background, cool ink, soft cyan accent.',
    character:
      'Cinematic but cool — late-night blueprint, pre-dawn airport. Reads as "infrastructure / fintech / serious money." Less aggressive than pure black, more atmospheric.',
    bestFor: ['corporate', 'product', 'landing'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#0B1320',
      surface: '#121C2E',
      surfaceAlt: '#1A2538',
      ink: '#E6EBF1',
      inkMuted: '#94A3B8',
      inkSubtle: '#64748B',
      accent: '#7DD3FC',
      accentInk: '#0B1320',
      border: '#243044',
      borderStrong: '#374558',
    },
    accentRules:
      'Accent for primary CTA, single chart highlight, and active-state. Never on body text and never as a fill on hero illustrations.',
    contrast: {
      inkOnBackground: 15.5,
      inkMutedOnBackground: 7.3,
      accentInkOnAccent: 11.2,
    },
  },
  {
    id: 'color.forest-terminal',
    name: 'Forest Terminal',
    description: 'Warm-black background, off-white ink, deep moss-green accent.',
    character:
      'Quiet dark mode for editorial / climate / outdoor brands. Not the cinematic register — more like a leather-bound journal in a candlelit room. The green is forest, not phosphor.',
    bestFor: ['editorial', 'portfolio', 'commerce', 'corporate'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#0F1310',
      surface: '#171C18',
      surfaceAlt: '#1F251F',
      ink: '#EDE8DD',
      inkMuted: '#A39E92',
      inkSubtle: '#6E6A60',
      accent: '#5B7A4F',
      accentInk: '#EDE8DD',
      border: '#2A302A',
      borderStrong: '#404640',
    },
    accentRules:
      'Accent for primary CTA, section dividers on long-reads, and one named-product highlight. Never on body text — the green is too low-contrast for fine ink work.',
    contrast: {
      inkOnBackground: 15.3,
      inkMutedOnBackground: 7.0,
      accentInkOnAccent: 4.0,
    },
  },
  {
    id: 'color.plum-velvet',
    name: 'Plum Velvet',
    description: 'Deep aubergine-black, cream ink, warm gold accent.',
    character:
      'Theater program / wine-bar / late-night-talk-show register. Saturated and slightly nostalgic. The plum reads as fabric, not pixel.',
    bestFor: ['editorial', 'portfolio', 'commerce', 'agency'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#191320',
      surface: '#231B2C',
      surfaceAlt: '#2D2438',
      ink: '#F1E8DA',
      inkMuted: '#A89B9D',
      inkSubtle: '#766D71',
      accent: '#D4A857',
      accentInk: '#191320',
      border: '#3A2F47',
      borderStrong: '#4F4159',
    },
    accentRules:
      'Accent for primary CTA, one editorial section rule, and the brand wordmark. Never used in dense data; the gold is decorative voltage.',
    contrast: {
      inkOnBackground: 15.0,
      inkMutedOnBackground: 6.8,
      accentInkOnAccent: 8.3,
    },
  },
  {
    id: 'color.slate-workspace',
    name: 'Slate Workspace',
    description: 'Cool slate gray-blue stepped background with soft amber accent.',
    character:
      'The Notion-dark / Arc browser side panel / Figma dark UI register. Less black than Vercel-dark, less warm than Linear-graphite. Made for sustained use.',
    bestFor: ['product', 'agency', 'corporate'],
    version: 1,
    mode: 'dark',
    tokens: {
      background: '#1B1F24',
      surface: '#23282F',
      surfaceAlt: '#2C323A',
      ink: '#E8ECF1',
      inkMuted: '#A0A8B3',
      inkSubtle: '#6F7884',
      accent: '#F0B458',
      accentInk: '#1B1F24',
      border: '#363D47',
      borderStrong: '#4A525E',
    },
    accentRules:
      'Accent for primary CTA, focus ring, and "saved/synced" status indicator. Never used to color text and never used as a section background.',
    contrast: {
      inkOnBackground: 14.0,
      inkMutedOnBackground: 6.9,
      accentInkOnAccent: 9.0,
    },
  },
  {
    id: 'color.riso-red-black',
    name: 'Riso Red & Black',
    description: 'Cream + black + fluoro red, no neutral midtones.',
    character:
      'Indie graphic studio / zine / Pangram-foundry-special-project register. Loud and committed. The whole site looks printed on a Risograph machine.',
    bestFor: ['agency', 'editorial', 'portfolio'],
    version: 1,
    mode: 'duotone',
    tokens: {
      background: '#F4F0E6',
      surface: '#F4F0E6',
      surfaceAlt: '#EAE3D2',
      ink: '#0D0D0D',
      inkMuted: '#0D0D0D',
      inkSubtle: '#5A5A5A',
      accent: '#FF3B30',
      accentInk: '#F4F0E6',
      border: '#0D0D0D',
      borderStrong: '#0D0D0D',
    },
    accentRules:
      'Accent for headlines, key callouts, and CTA fills. The system inverts normal hierarchy — the red can BE the body of a hero, not just a button. Borders are always pure ink, no gray.',
    contrast: {
      inkOnBackground: 17.1,
      inkMutedOnBackground: 17.1,
      accentInkOnAccent: 3.1,
    },
  },
  {
    id: 'color.cyan-blueprint',
    name: 'Cyan Blueprint',
    description: 'Single-saturated cyan canvas, white ink, black accent — chromatic monosurface.',
    character:
      'The Browser Company / Arc / single-hue-immersive landing register. The whole page is one mood. Used when the brand wants to BE a color, not just have one.',
    bestFor: ['landing', 'agency', 'product'],
    version: 1,
    mode: 'duotone',
    tokens: {
      background: '#0050D8',
      surface: '#0044BC',
      surfaceAlt: '#003AA1',
      ink: '#FFFFFF',
      inkMuted: '#C8D8F5',
      inkSubtle: '#8FA9DB',
      accent: '#0A0A0A',
      accentInk: '#FFFFFF',
      border: '#1B5FE0',
      borderStrong: '#3B7AED',
    },
    accentRules:
      'Accent (black) reserved for primary CTA and hero-image vignettes — it inverts the usual relationship: the brand color is the canvas, the accent is the punctuation. Never use a third color.',
    contrast: {
      inkOnBackground: 6.7,
      inkMutedOnBackground: 4.7,
      accentInkOnAccent: 19.8,
    },
  },
];

export const easingPresets: EasingPreset[] = [
  {
    id: 'ease.expo-out',
    name: 'Expo Out',
    description: 'The classic awwwards entrance — hits hard, settles fast.',
    character: 'Most "expensive" feeling curve. Default for big reveals.',
    bestFor: ['editorial', 'portfolio', 'agency', 'product', 'landing'],
    version: 1,
    bezier: [0.16, 1, 0.3, 1],
    gsapName: 'expo.out',
    useFor: ['entrance'],
    personality: 'dramatic',
  },
  {
    id: 'ease.power4-in-out',
    name: 'Power4 InOut',
    description: 'Slow start, slow end, fast middle — for transitions between scenes.',
    character: 'Two-phase ease used for full-screen transitions and pinned sections.',
    bestFor: ['agency', 'portfolio'],
    version: 1,
    bezier: [0.77, 0, 0.175, 1],
    gsapName: 'power4.inOut',
    useFor: ['state-change'],
    personality: 'smooth',
  },
  {
    id: 'ease.snappy-out',
    name: 'Snappy',
    description: 'Slight overshoot — for UI affordances that should feel mechanical.',
    character: "Buttons, toggles, magnetic hovers. Don't use on hero copy.",
    bestFor: ['product', 'commerce'],
    version: 1,
    bezier: [0.34, 1.56, 0.64, 1],
    useFor: ['state-change', 'attention'],
    personality: 'snappy',
  },
];

export const motionPrimitives: MotionPrimitive[] = [
  {
    id: 'motion.text-mask-reveal',
    name: 'Text Mask Reveal',
    description: 'Lines of text reveal from behind a mask, staggered, on scroll.',
    character: 'The signature awwwards typography animation.',
    bestFor: ['editorial', 'portfolio', 'agency', 'landing'],
    version: 1,
    library: 'gsap',
    template: `
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function textMaskReveal(target: string | Element) {
  const split = new SplitText(target, { type: 'lines', linesClass: 'line' });

  // Wrap each line in a mask container so we can clip the rise.
  split.lines.forEach((line) => {
    const wrap = document.createElement('span');
    wrap.className = 'line-mask';
    wrap.style.display = 'block';
    wrap.style.overflow = 'hidden';
    line.parentNode?.insertBefore(wrap, line);
    wrap.appendChild(line);
  });

  gsap.from(split.lines, {
    yPercent: 110,
    duration: 1.1,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: target,
      start: 'top 85%',
      once: true,
    },
  });
}
`.trim(),
    defaultEasingId: 'ease.expo-out',
    useCase: 'Hero headlines, section openers, editorial pull-quotes.',
    imports: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText'],
    performance:
      'Cheap — animates transform only. Watch font loading: run after document.fonts.ready or you get FOUT inside the mask.',
    notes:
      "The trick is the mask wrapper, not the text. Each line slides up from yPercent: 110 (just below its own height) inside an overflow:hidden parent. The eye reads it as type emerging from behind a horizontal edge — same effect as letterpress prints when paper lifts away. Stagger of 0.08s per line is what makes it feel composed instead of mechanical: the eye lands on each line in sequence, not all at once.",
    reducedMotion: 'instant',
  },
  {
    id: 'motion.magnetic-button',
    name: 'Magnetic Button',
    description: 'Button gently attracts the cursor within a radius.',
    character: 'Tactile microinteraction for primary CTAs. One per viewport, never on every link.',
    bestFor: ['agency', 'portfolio', 'landing'],
    version: 1,
    library: 'framer-motion',
    template: `
'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, MouseEvent } from 'react';

export function MagneticButton({
  children,
  strength = 0.35,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.5 });

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
    >
      {children}
    </motion.button>
  );
}
`.trim(),
    defaultEasingId: 'ease.snappy-out',
    useCase: 'Hero CTA, single signature button. Never on nav links or every button on a page.',
    imports: ['framer-motion'],
    performance:
      "GPU-accelerated transforms. Spring is cheap. Don't put many on a page — the appeal is rarity.",
    notes:
      "Two ideas working together. First, the displacement: we move the button toward the cursor by a fraction (strength: 0.35 = 35% of the cursor's offset from center). Second, the spring: without it, the button would snap to position and feel rubbery. The spring smooths the displacement so the motion has weight. Tune stiffness/damping/mass to change personality — heavier mass = more sluggish/luxurious, higher stiffness = more responsive. No-op on touch devices.",
    reducedMotion: 'disable',
  },
  {
    id: 'motion.preloader',
    name: 'Preloader',
    description:
      'Mask-and-counter intro that covers the screen on first load and wipes after fonts and hero image are ready.',
    character:
      'The site presents itself before content arrives. Sets the cinematic tone before anything else renders.',
    bestFor: ['portfolio', 'agency', 'editorial'],
    version: 1,
    library: 'gsap',
    template: `
'use client';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

export function Preloader({ onComplete }: { onComplete?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let tl: gsap.core.Timeline;

    const run = async () => {
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch {}
      }

      const counter = { value: 0 };
      tl = gsap.timeline({
        onComplete: () => {
          setDone(true);
          onComplete?.();
        },
      });

      tl.to(counter, {
        value: 100,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0');
          }
        },
      })
        .to(
          containerRef.current,
          {
            yPercent: -100,
            duration: 1.1,
            ease: 'power4.inOut',
          },
          '+=0.2'
        );
    };

    run();

    return () => {
      tl?.kill();
    };
  }, [onComplete]);

  if (done) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-end justify-end bg-ink p-8 text-background"
      aria-hidden
    >
      <span ref={counterRef} className="font-display text-h1 tabular-nums">
        000
      </span>
    </div>
  );
}
`.trim(),
    defaultEasingId: 'ease.power4-in-out',
    useCase:
      "First-paint gateway. Mounted in the root layout. Wraps the rest of the site behind a counter-and-wipe intro.",
    imports: ['gsap'],
    performance:
      "Cheap — single yPercent transform at the end. Counter only updates a small text node. Watch: if heavy hero imagery is not preloaded, the wipe finishes and the page is empty for a beat. Trigger after document.fonts.ready and the first hero image's onload for best result.",
    notes:
      'A preloader gives the site a moment of self-presentation before content. Without one, the site is reactive — content appears, you scroll. With one, the site introduced itself first. Same psychological move as a film studio bumper before a movie. The counter is the trick: it tells the viewer "something is being prepared," so the wait reads as choreography instead of slowness. Power4 InOut on the wipe gives the slow-middle drama; power2.inOut on the counter is steadier so it does not fight the wipe.',
    reducedMotion: 'instant',
  },
  {
    id: 'motion.page-transition',
    name: 'Page Transition',
    description:
      'Full-screen overlay sweep on route change. Covers outgoing content and reveals the incoming page.',
    character:
      'Kills the click-to-flash jank. Slow middle with Power4 InOut gives camera-pan drama.',
    bestFor: ['portfolio', 'agency', 'editorial'],
    version: 1,
    library: 'framer-motion',
    template: `
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} className="relative">
        {children}
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] origin-bottom bg-ink"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1, originY: 0 }}
          transition={{ duration: 1.0, ease: [0.77, 0, 0.175, 1] }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
`.trim(),
    defaultEasingId: 'ease.power4-in-out',
    useCase:
      "Wrap the app router's page content. Triggers automatically on route change.",
    imports: ['framer-motion', 'next/navigation'],
    performance:
      'GPU-accelerated single transform. Cheap. ~1s cover — long enough to read as a transition, short enough not to annoy.',
    notes:
      'Two halves: the outgoing page covers itself with a vertical sweep (originY bottom, scaleY 0 → 1), the incoming page reveals from the top (originY top, scaleY 1 → 0). The cubic-bezier(0.77, 0, 0.175, 1) is power4.inOut — slow-out, fast-middle, slow-in. That slow middle is the cinematic beat; a faster ease would feel ordinary. Tuning duration is the call: under 800ms feels rushed, over 1200ms feels self-important.',
    reducedMotion: 'simplify',
  },
  {
    id: 'motion.horizontal-gallery',
    name: 'Horizontal Gallery',
    description:
      'Pinned vertical section that translates horizontally as the user scrolls — one viewport panel per project.',
    character:
      'The works-page move. Each panel earns a viewport; nothing crowds anything else.',
    bestFor: ['portfolio', 'agency', 'editorial'],
    version: 1,
    library: 'gsap',
    template: `
'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function HorizontalGallery({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const distance = track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => '+=' + distance,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div ref={trackRef} className="flex h-screen w-max">
        {children}
      </div>
    </section>
  );
}
`.trim(),
    defaultEasingId: 'ease.power4-in-out',
    useCase:
      'Works/projects gallery section. Wrap each project as a child sized to viewport width (w-screen).',
    imports: ['gsap', 'gsap/ScrollTrigger'],
    performance:
      'Pinned sections are heavier than free scroll — ScrollTrigger does layout calculations, scrub:1 smooths them. Mobile and reduced-motion fall back to natural vertical stacking. invalidateOnRefresh:true is required if any panel content is responsive.',
    notes:
      'The illusion is that the section pins (sticks to viewport) while the user scrolls, and the inner track translates horizontally to "consume" the same scroll distance. End is +=distance — the scroll cost equals the horizontal travel, so panel pacing matches scroll pacing. ease: "none" is correct here: scrub IS the easing — adding power-out on top would create lag/snap. The disable-on-mobile is a hard rule for this primitive: pinned horizontal scroll is uncomfortable on phones, where the OS already owns horizontal gestures.',
    reducedMotion: 'disable',
  },
  {
    id: 'motion.cursor-follower',
    name: 'Cursor Follower',
    description:
      'Custom cursor — small ring that follows the pointer and scales over interactive elements.',
    character:
      'Constant subtle motion of the cursor itself reads as "alive." Cheap, hover-only.',
    bestFor: ['portfolio', 'agency'],
    version: 1,
    library: 'framer-motion',
    template: `
'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export function CursorFollower() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 280, damping: 28, mass: 0.4 });
  const [hovering, setHovering] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) {
      setTouch(true);
      return;
    }

    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    function onOver(e: MouseEvent) {
      const t = e.target as Element | null;
      setHovering(!!t?.closest('a, button, [data-cursor="hover"]'));
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, [x, y]);

  if (touch) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[80] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink mix-blend-difference"
      style={{ x: sx, y: sy }}
      animate={{ scale: hovering ? 3 : 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
    />
  );
}
`.trim(),
    defaultEasingId: 'ease.snappy-out',
    useCase:
      'Mounted once in the root layout. Active on hover-capable devices only (no-op on touch).',
    imports: ['framer-motion'],
    performance:
      'Two motion values + one spring = trivial cost. mix-blend-difference can be expensive on very large painted areas — keep the cursor small. Hides itself on touch via (hover: none).',
    notes:
      'The constant subtle motion of the cursor is what reads as "alive." Two design decisions: (1) the spring lag — a tiny gap between pointer and cursor (stiffness 280, damping 28) gives the cursor a hint of inertia, like it has weight, without feeling sluggish. (2) mix-blend-difference inverts the cursor against whatever is behind it, so it works on light AND dark sections without per-section logic. The 3x scale on interactive elements is the "this is clickable" affordance — too small and it is missed; too big and it covers the thing you are trying to click.',
    reducedMotion: 'simplify',
  },
];

export const layoutArchetypes: LayoutArchetype[] = [
  {
    id: 'layout.split-editorial',
    name: 'Split Editorial',
    description: 'Asymmetric split — text-heavy left, image-led right. 7/5 columns, not 6/6.',
    character:
      'The 7/5 asymmetry is what separates this from cookie-cutter splits. Eye lands left, falls right.',
    photoDirection: 'Compositional weight on one side of the frame, breathing room on the other. Subject placed deliberately off-center. Image must read at half-width without losing its anchor.',
    bestFor: ['editorial', 'agency', 'portfolio'],
    version: 1,
    grid: { columns: 12, gutter: '24px', maxWidth: '1440px' },
    hero: 'split',
    flow: 'rhythmic',
    density: 'spacious',
    notes:
      'Avoid the 6/6 trap. 7/5 or 8/4 splits read as deliberate; 6/6 reads as Bootstrap. Image side bleeds to viewport edge on desktop, contained on mobile.',
  },
  {
    id: 'layout.full-bleed',
    name: 'Full Bleed',
    description: 'Image-led hero with overlay typography. Generous whitespace below.',
    character:
      'Cinematic, slow. Single image must carry the entire opening — generated mockup imagery shines here.',
    photoDirection: 'Hero-quality compositional weight. Single subject must carry the entire frame at full-screen. Avoid busy backgrounds — typography overlay needs a calm zone. Everything else recedes.',
    bestFor: ['portfolio', 'editorial', 'agency'],
    version: 1,
    grid: { columns: 12, gutter: '24px', maxWidth: '1600px' },
    hero: 'full-bleed-image',
    flow: 'punctuated',
    density: 'spacious',
    notes:
      'Hero image needs to be hero-quality — this archetype amplifies image weakness. Pair with strong display typography overlay. Avoid gradient overlays unless absolutely needed for legibility (they cheapen the image).',
  },
  {
    id: 'layout.cinematic-gallery',
    name: 'Cinematic Gallery',
    description:
      'Full-bleed cinematic sections plus a horizontal-scroll works page. Photography-led, motion-anchored.',
    character:
      'The site presents itself before content arrives — preloader, scripted reveals, page transitions, horizontal gallery. Type plays a supporting role to choreography. For brands whose value is in the work itself.',
    photoDirection:
      'Cinematic stillness. Each image must hold a full viewport and read at panel-width inside a horizontal track. Architectural composition — strong negative space, single subject, restrained color. No motion blur or busy frames; the page motion supplies the dynamics, the photography supplies the calm.',
    bestFor: ['portfolio', 'agency', 'editorial'],
    version: 1,
    grid: { columns: 12, gutter: '24px', maxWidth: '1600px' },
    hero: 'full-bleed-image',
    flow: 'punctuated',
    density: 'spacious',
    notes:
      'Choreography is the main idea. Required: preloader covers the screen on first paint and wipes after fonts.ready and the hero image preload. Hero is full-bleed with overlay typography revealed via text-mask after preloader exits. Insert one horizontal-scroll gallery section (works page) — pinned vertical → translateX, one viewport panel per project. Page transitions cover/reveal on route change. Motion primitives carry the personality; type stays restrained. Avoid stacking too many ambient motions in a single viewport — choreography is sequence, not chord.',
  },
];

// ================================================================
// COMPILATION HINT
// ================================================================
/**
 * Each Design DNA compiles to CSS variables at build/runtime, e.g.:
 *
 *   :root {
 *     --bg: #F4F1EC; --surface: #FFFFFF; --ink: #141210; ...
 *     --font-display: 'Fraunces', Georgia, serif;
 *     --font-body:    'Inter', system-ui, sans-serif;
 *     --scale-ratio:  1.333;
 *     --base-size:    17px;
 *     --ease-entrance: cubic-bezier(0.16, 1, 0.3, 1);
 *   }
 *
 * Tailwind's config consumes these as the source of truth, so generated
 * components reference `text-ink` / `bg-surface` instead of hard-coded hex.
 * That's what lets the same generated component swap themes by changing
 * one preset id.
 */
