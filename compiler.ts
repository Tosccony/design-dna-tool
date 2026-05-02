/**
 * Design DNA Compiler
 *
 * Takes a DesignDNA + preset library, returns:
 *   - themeCss: a Tailwind v4 @theme block ready to drop into app/globals.css
 *   - fonts: preconnect + stylesheet metadata for <head>
 *   - typeScale: computed modular scale with fluid clamp() for display sizes
 *   - resolved: the dereferenced presets (handy for downstream code generation)
 *
 * Output is pure data — this module never writes to disk. The caller decides
 * what to do with the strings (drop in a project, send to an LLM, etc).
 */

import {
  type DesignDNA,
  type TypographyPreset,
  type ColorPreset,
  type EasingPreset,
  type MotionPrimitive,
  type LayoutArchetype,
  typographyPresets,
  colorPresets,
  easingPresets,
  motionPrimitives,
  layoutArchetypes,
} from './presets';

// ================================================================
// Types
// ================================================================

export interface PresetLibrary {
  typography: TypographyPreset[];
  colors: ColorPreset[];
  easings: EasingPreset[];
  motion: MotionPrimitive[];
  layouts: LayoutArchetype[];
}

export const defaultLibrary: PresetLibrary = {
  typography: typographyPresets,
  colors: colorPresets,
  easings: easingPresets,
  motion: motionPrimitives,
  layouts: layoutArchetypes,
};

export interface ScaleEntry {
  px: number;
  rem: number;
  /** clamp() expression — only present on fluid (display) steps */
  clamp?: string;
}

export interface TypeScale {
  micro: ScaleEntry;   // step -2
  small: ScaleEntry;   // step -1
  base: ScaleEntry;    // step  0
  lead: ScaleEntry;    // step  1
  h4: ScaleEntry;      // step  2 — fluid from here up
  h3: ScaleEntry;      // step  3
  h2: ScaleEntry;      // step  4
  h1: ScaleEntry;      // step  5
  display: ScaleEntry; // step  6
}

export interface ResolvedDNA {
  typography: TypographyPreset;
  color: ColorPreset;
  layout: LayoutArchetype;
  easings: {
    primary: EasingPreset;
    entrance: EasingPreset;
    exit: EasingPreset;
    attention: EasingPreset;
  };
  motion: MotionPrimitive[];
}

export interface CompiledDNA {
  /** Resolved presets — useful for downstream code generation */
  resolved: ResolvedDNA;
  /** Computed type scale (also embedded in themeCss) */
  typeScale: TypeScale;
  /** Tailwind v4 @theme block + base layer styles. Drop into app/globals.css. */
  themeCss: string;
  /** Font loading metadata for the document <head> */
  fonts: {
    preconnects: string[];
    stylesheets: string[];
  };
}

// ================================================================
// Helpers
// ================================================================

export class CompileError extends Error {
  constructor(category: string, id: string) {
    super(`Preset not found: ${category} = "${id}"`);
    this.name = 'CompileError';
  }
}

function findPreset<T extends { id: string }>(
  arr: T[],
  id: string,
  category: string
): T {
  const found = arr.find((p) => p.id === id);
  if (!found) throw new CompileError(category, id);
  return found;
}

const kebab = (s: string): string =>
  s.replace(/([A-Z])/g, '-$1').toLowerCase();

const bezierToCss = (b: [number, number, number, number]): string =>
  `cubic-bezier(${b.join(', ')})`;

const round = (n: number, places: number): number => {
  const factor = Math.pow(10, places);
  return Math.round(n * factor) / factor;
};

// ================================================================
// Type scale computation
// ================================================================

/**
 * Modular scale: each step multiplies by ratio.
 * Display sizes (h4 and up) get a fluid clamp() that scales linearly
 * between 360px and 1440px viewport. Mobile size is the desktop size
 * compressed by ratio^2 (two steps down) — generous on phones, full
 * impact on desktop.
 */
function computeTypeScale(baseSize: number, ratio: number): TypeScale {
  const sizeAtStep = (n: number): number => baseSize * Math.pow(ratio, n);

  const fixedStep = (n: number): ScaleEntry => {
    const px = sizeAtStep(n);
    return { px: round(px, 2), rem: round(px / 16, 4) };
  };

  const fluidStep = (n: number): ScaleEntry => {
    const desktopPx = sizeAtStep(n);
    const mobilePx = desktopPx / Math.pow(ratio, 2);
    const minRem = mobilePx / 16;
    const maxRem = desktopPx / 16;
    // Linear interpolation between viewport 360 and 1440
    const slopeVw = ((desktopPx - mobilePx) / (1440 - 360)) * 100;
    const interceptPx = mobilePx - (slopeVw * 360) / 100;
    const interceptRem = interceptPx / 16;
    const preferred = `${round(interceptRem, 4)}rem + ${round(slopeVw, 4)}vw`;
    return {
      px: round(desktopPx, 2),
      rem: round(maxRem, 4),
      clamp: `clamp(${round(minRem, 4)}rem, ${preferred}, ${round(maxRem, 4)}rem)`,
    };
  };

  return {
    micro:   fixedStep(-2),
    small:   fixedStep(-1),
    base:    fixedStep(0),
    lead:    fixedStep(1),
    h4:      fluidStep(2),
    h3:      fluidStep(3),
    h2:      fluidStep(4),
    h1:      fluidStep(5),
    display: fluidStep(6),
  };
}

// ================================================================
// Font imports
// ================================================================

function generateFontImports(typo: TypographyPreset): CompiledDNA['fonts'] {
  const stylesheets: string[] = [];
  const preconnects = new Set<string>();

  const addFont = (family: TypographyPreset['display']) => {
    if (family.source.type === 'google') {
      stylesheets.push(family.source.url);
      preconnects.add('https://fonts.googleapis.com');
      preconnects.add('https://fonts.gstatic.com');
    }
    // local + system fonts need no <head> work
  };

  addFont(typo.display);
  addFont(typo.body);
  if (typo.mono) addFont(typo.mono);

  return {
    preconnects: Array.from(preconnects),
    stylesheets,
  };
}

// ================================================================
// Theme CSS builder (Tailwind v4)
// ================================================================

function buildThemeCss(
  dna: ResolvedDNA,
  scale: TypeScale,
  source: { projectId: string; projectName: string }
): string {
  const { typography: t, color: c, layout: l, easings: e } = dna;

  const fontStack = (f: TypographyPreset['display']): string =>
    [`"${f.name}"`, ...f.fallback].join(', ');

  const lines: string[] = [];

  lines.push(`/* Generated by Design DNA compiler — do not edit by hand. */`);
  lines.push(`/* Project: ${source.projectName} (${source.projectId}) */`);
  lines.push('');
  lines.push(`@import "tailwindcss";`);
  lines.push('');
  lines.push(`@theme {`);

  // Color tokens — emit as --color-* so Tailwind generates bg-/text-/border- utilities
  lines.push(`  /* === Color === */`);
  for (const [k, v] of Object.entries(c.tokens)) {
    lines.push(`  --color-${kebab(k)}: ${v};`);
  }

  // Font families — emit as --font-* so Tailwind generates font-display etc.
  lines.push('');
  lines.push(`  /* === Typography === */`);
  lines.push(`  --font-display: ${fontStack(t.display)};`);
  lines.push(`  --font-body: ${fontStack(t.body)};`);
  if (t.mono) lines.push(`  --font-mono: ${fontStack(t.mono)};`);

  // Type scale — emit as --text-* so Tailwind generates text-base, text-h1 etc.
  lines.push('');
  lines.push(`  /* Type scale (display sizes are fluid via clamp) */`);
  for (const [name, entry] of Object.entries(scale)) {
    const value = entry.clamp ?? `${entry.rem}rem`;
    lines.push(`  --text-${name}: ${value};`);
  }

  // Easings — emit as --ease-* so Tailwind generates ease-entrance etc.
  lines.push('');
  lines.push(`  /* === Motion === */`);
  lines.push(`  --ease-primary: ${bezierToCss(e.primary.bezier)};`);
  lines.push(`  --ease-entrance: ${bezierToCss(e.entrance.bezier)};`);
  lines.push(`  --ease-exit: ${bezierToCss(e.exit.bezier)};`);
  lines.push(`  --ease-attention: ${bezierToCss(e.attention.bezier)};`);
  // Durations referenced by motion primitives, NOT in @theme since they're
  // not Tailwind utility values — they're consumed by primitive code.
  lines.push(`}`);

  // Outside @theme: durations + base layer styles + grid tokens
  lines.push('');
  lines.push(`:root {`);
  lines.push(`  /* Motion durations (consumed by primitives, not Tailwind utilities) */`);
  lines.push(`  --duration-fast: 0.3s;`);
  lines.push(`  --duration-base: 0.6s;`);
  lines.push(`  --duration-slow: 1.1s;`);
  lines.push('');
  lines.push(`  /* Layout grid */`);
  lines.push(`  --grid-columns: ${l.grid.columns};`);
  lines.push(`  --grid-gutter: ${l.grid.gutter};`);
  lines.push(`  --grid-max-width: ${l.grid.maxWidth};`);
  lines.push('');
  lines.push(`  color-scheme: ${c.mode === 'dark' ? 'dark' : 'light'};`);
  lines.push(`}`);

  // Type defaults — these are project defaults, not utilities
  lines.push('');
  lines.push(`/* === Type defaults === */`);
  lines.push(`html {`);
  lines.push(`  font-size: ${t.baseSize}px;`);
  lines.push(`}`);
  lines.push('');
  lines.push(`body {`);
  lines.push(`  font-family: var(--font-body);`);
  lines.push(`  font-weight: ${t.bodySpec.weight};`);
  lines.push(`  line-height: ${t.bodySpec.lineHeight};`);
  lines.push(`  letter-spacing: ${t.bodySpec.tracking}em;`);
  lines.push(`  color: var(--color-ink);`);
  lines.push(`  background: var(--color-background);`);
  lines.push(`  -webkit-font-smoothing: antialiased;`);
  lines.push(`  text-rendering: optimizeLegibility;`);
  lines.push(`}`);

  // Display utility class — applies the display spec to any element
  lines.push('');
  lines.push(`.display {`);
  lines.push(`  font-family: var(--font-display);`);
  lines.push(`  font-weight: ${t.displaySpec.weight};`);
  lines.push(`  line-height: ${t.displaySpec.lineHeight};`);
  lines.push(`  letter-spacing: ${t.displaySpec.tracking}em;`);
  if (t.display.opticalSizing) {
    lines.push(`  font-optical-sizing: auto;`);
  }
  lines.push(`}`);

  // Eyebrow utility class (optional)
  if (t.eyebrowSpec) {
    lines.push('');
    lines.push(`.eyebrow {`);
    lines.push(`  font-family: var(--font-body);`);
    lines.push(`  font-weight: ${t.eyebrowSpec.weight};`);
    lines.push(`  font-size: var(--text-small);`);
    lines.push(`  line-height: ${t.eyebrowSpec.lineHeight};`);
    lines.push(`  letter-spacing: ${t.eyebrowSpec.tracking}em;`);
    lines.push(`  text-transform: ${t.eyebrowSpec.textTransform};`);
    lines.push(`  color: var(--color-ink-muted);`);
    lines.push(`}`);
  }

  // Reduced motion — non-negotiable
  lines.push('');
  lines.push(`/* === Reduced motion override === */`);
  lines.push(`@media (prefers-reduced-motion: reduce) {`);
  lines.push(`  :root {`);
  lines.push(`    --duration-fast: 0.001s;`);
  lines.push(`    --duration-base: 0.001s;`);
  lines.push(`    --duration-slow: 0.001s;`);
  lines.push(`  }`);
  lines.push(`  *, *::before, *::after {`);
  lines.push(`    animation-duration: 0.001s !important;`);
  lines.push(`    animation-iteration-count: 1 !important;`);
  lines.push(`    transition-duration: 0.001s !important;`);
  lines.push(`    scroll-behavior: auto !important;`);
  lines.push(`  }`);
  lines.push(`}`);

  return lines.join('\n');
}

// ================================================================
// Public API
// ================================================================

export function compileDesignDNA(
  dna: DesignDNA,
  library: PresetLibrary = defaultLibrary
): CompiledDNA {
  // Resolve preset references
  const typography = findPreset(library.typography, dna.typographyId, 'typography');
  let color = findPreset(library.colors, dna.colorId, 'color');
  const layout = findPreset(library.layouts, dna.layoutId, 'layout');
  const easings = {
    primary:   findPreset(library.easings, dna.easingsByRole.primary,   'easing.primary'),
    entrance:  findPreset(library.easings, dna.easingsByRole.entrance,  'easing.entrance'),
    exit:      findPreset(library.easings, dna.easingsByRole.exit,      'easing.exit'),
    attention: findPreset(library.easings, dna.easingsByRole.attention, 'easing.attention'),
  };
  const motion = dna.motionPrimitiveIds.map((id) =>
    findPreset(library.motion, id, 'motion')
  );

  // Apply per-project overrides without mutating the shared library
  if (dna.overrides?.accentColor) {
    color = {
      ...color,
      tokens: { ...color.tokens, accent: dna.overrides.accentColor },
    };
  }

  const resolved: ResolvedDNA = { typography, color, layout, easings, motion };
  const typeScale = computeTypeScale(typography.baseSize, typography.scaleRatio);
  const themeCss = buildThemeCss(resolved, typeScale, {
    projectId: dna.projectId,
    projectName: dna.projectName,
  });
  const fonts = generateFontImports(typography);

  return { resolved, typeScale, themeCss, fonts };
}
