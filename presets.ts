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
