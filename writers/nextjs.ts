/**
 * Project Writer
 *
 * Takes a Design DNA, compiles it, and writes a complete, runnable
 * Next.js 15 + Tailwind v4 starter project to disk.
 *
 * The output is a real npm package — `cd <outDir> && npm install && npm run dev`
 * gets you a live mockup with the full design DNA applied.
 *
 * Output structure:
 *   <outDir>/
 *     package.json, tsconfig.json, next.config.ts, postcss.config.mjs
 *     app/
 *       layout.tsx       — root layout with font loading
 *       globals.css      — compiled @theme block + reduced motion
 *       page.tsx         — demo page using the layout archetype
 *       fonts.ts         — next/font setup
 *     components/primitives/
 *       TextMaskReveal.tsx
 *       MagneticButton.tsx
 *       SmoothScroll.tsx
 *     CLAUDE.md          — design DNA brief for Claude Code
 *     README.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DesignDNA } from '../presets';
import { compileDesignDNA, type CompiledDNA } from '../compiler';
import type { WriteProjectOptions, WriteProjectResult } from './index';

// ================================================================
// Public API
// ================================================================

export function writeProject(opts: WriteProjectOptions): WriteProjectResult {
  const { dna, outDir, overwrite = false } = opts;
  const compiled = compileDesignDNA(dna);

  if (fs.existsSync(outDir) && !overwrite) {
    throw new Error(
      `Output directory exists: ${outDir} (pass { overwrite: true } to clobber)`
    );
  }
  fs.mkdirSync(outDir, { recursive: true });

  const filesWritten: string[] = [];
  const write = (relativePath: string, content: string) => {
    const full = path.join(outDir, relativePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    filesWritten.push(relativePath);
  };

  // Root config
  write('package.json', renderPackageJson(dna));
  write('tsconfig.json', renderTsConfig());
  write('next.config.ts', renderNextConfig());
  write('postcss.config.mjs', renderPostcssConfig());
  write('next-env.d.ts', renderNextEnvDts());
  write('.gitignore', renderGitignore());

  // Determine which primitives the DNA wants and whether any need to mount
  // globally (preloader, cursor follower, page transition wrap children of
  // root layout — those go through a client Chrome wrapper).
  const motionIds = new Set(compiled.resolved.motion.map((m) => m.id));
  const hasChrome =
    motionIds.has('motion.preloader') ||
    motionIds.has('motion.cursor-follower') ||
    motionIds.has('motion.page-transition');

  // App
  write('app/globals.css', adaptCssForNextFont(compiled.themeCss));
  write('app/fonts.ts', renderFontsModule(compiled));
  write('app/layout.tsx', renderRootLayout(dna, hasChrome));
  write('app/page.tsx', renderHomePage(dna, compiled));

  // Motion primitives — SmoothScroll is a baseline (not in the preset
  // library) and ships unconditionally. Everything else is DNA-driven:
  // for known primitives we use the writer's polished implementations;
  // for new primitives we use the template stored on the preset.
  write('components/primitives/SmoothScroll.tsx', renderSmoothScroll());
  for (const primitive of compiled.resolved.motion) {
    const filename = `components/primitives/${pascalFromMotionId(primitive.id)}.tsx`;
    const source =
      primitive.id === 'motion.text-mask-reveal'
        ? renderTextMaskReveal()
        : primitive.id === 'motion.magnetic-button'
        ? renderMagneticButton()
        : primitive.template + '\n';
    write(filename, source);
  }

  if (hasChrome) {
    write('components/Chrome.tsx', renderChrome(motionIds));
  }

  // Docs
  write('CLAUDE.md', renderClaudeMd(dna, compiled));
  write('README.md', renderReadme(dna));

  return { outDir, filesWritten };
}

// ================================================================
// Helpers
// ================================================================

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "Inter Tight" -> "Inter_Tight" (next/font/google import name) */
function googleFontImportName(fontName: string): string {
  return fontName.replace(/\s+/g, '_');
}

/** "motion.page-transition" -> "PageTransition" (file/component name) */
function pascalFromMotionId(motionId: string): string {
  const after = motionId.replace(/^motion\./, '');
  return after
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Transform the compiler's @theme CSS so font tokens reference next/font's
 * generated CSS variable as primary, falling back to the literal font name.
 *
 *   --font-display: "Fraunces", Georgia, serif;
 *     becomes
 *   --font-display: var(--font-display-loaded), "Fraunces", Georgia, serif;
 */
function adaptCssForNextFont(themeCss: string): string {
  return themeCss
    .replace(
      /(--font-display:\s*)(.+?);/,
      '$1var(--font-display-loaded), $2;'
    )
    .replace(
      /(--font-body:\s*)(.+?);/,
      '$1var(--font-body-loaded), $2;'
    )
    .replace(
      /(--font-mono:\s*)(.+?);/,
      '$1var(--font-mono-loaded), $2;'
    );
}

// ================================================================
// Config file renderers
// ================================================================

function renderPackageJson(dna: DesignDNA): string {
  const pkg = {
    name: `${slugify(dna.projectName)}-mockup`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'framer-motion': '^11.15.0',
      gsap: '^3.12.0',
      lenis: '^1.1.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      tailwindcss: '^4.0.0',
      '@tailwindcss/postcss': '^4.0.0',
      typescript: '^5.6.0',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

function renderTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
  return JSON.stringify(config, null, 2) + '\n';
}

function renderNextConfig(): string {
  return `import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
};

export default config;
`;
}

function renderPostcssConfig(): string {
  return `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;
}

function renderNextEnvDts(): string {
  return `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`;
}

function renderGitignore(): string {
  return `node_modules/
.next/
out/
.env*.local
*.log
.DS_Store
`;
}

// ================================================================
// App file renderers
// ================================================================

function renderFontsModule(compiled: CompiledDNA): string {
  const t = compiled.resolved.typography;
  const display = t.display;
  const body = t.body;

  const displayIsGoogle = display.source.type === 'google';
  const bodyIsGoogle = body.source.type === 'google';
  const sameFamily = display.name === body.name;

  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * Font setup using next/font.');
  lines.push(' *');
  lines.push(' * next/font self-hosts the font files at build time, eliminating');
  lines.push(' * layout shift and the Google Fonts request entirely. The exposed');
  lines.push(" * .variable property gets applied to <html> in layout.tsx, then");
  lines.push(' * referenced from app/globals.css via var(--font-*-loaded).');
  lines.push(' */');
  lines.push('');

  // Imports
  if (displayIsGoogle) {
    lines.push(
      `import { ${googleFontImportName(display.name)} } from 'next/font/google';`
    );
  }
  if (bodyIsGoogle && !sameFamily) {
    lines.push(
      `import { ${googleFontImportName(body.name)} } from 'next/font/google';`
    );
  }
  lines.push('');

  // Display font
  if (displayIsGoogle) {
    lines.push(`export const displayFont = ${googleFontImportName(display.name)}({`);
    lines.push(`  subsets: ['latin'],`);
    lines.push(
      `  weight: [${display.weights.map((w) => `'${w}'`).join(', ')}],`
    );
    lines.push(`  variable: '--font-display-loaded',`);
    lines.push(`  display: 'swap',`);
    lines.push(`});`);
  } else {
    lines.push(`// Display font is ${display.source.type} — handled outside next/font`);
    lines.push(`export const displayFont = { variable: '' as const };`);
  }
  lines.push('');

  // Body font — even when same family as display, we declare a second next/font
  // call. We need both --font-display-loaded AND --font-body-loaded set on <html>
  // (globals.css references both). next/font dedupes the underlying font files
  // when configs match, so this doesn't double the bundle — it just gives us two
  // CSS variables pointing at the same self-hosted family.
  if (sameFamily && bodyIsGoogle) {
    lines.push(`// Display + body share a family. Declared as a separate next/font call so`);
    lines.push(`// --font-body-loaded resolves; next/font dedupes the underlying font load.`);
    lines.push(`export const bodyFont = ${googleFontImportName(body.name)}({`);
    lines.push(`  subsets: ['latin'],`);
    lines.push(`  weight: [${body.weights.map((w) => `'${w}'`).join(', ')}],`);
    lines.push(`  variable: '--font-body-loaded',`);
    lines.push(`  display: 'swap',`);
    lines.push(`});`);
  } else if (bodyIsGoogle) {
    lines.push(`export const bodyFont = ${googleFontImportName(body.name)}({`);
    lines.push(`  subsets: ['latin'],`);
    lines.push(`  weight: [${body.weights.map((w) => `'${w}'`).join(', ')}],`);
    lines.push(`  variable: '--font-body-loaded',`);
    lines.push(`  display: 'swap',`);
    lines.push(`});`);
  } else {
    lines.push(`// Body font is ${body.source.type}`);
    lines.push(`export const bodyFont = { variable: '' as const };`);
  }

  return lines.join('\n') + '\n';
}

function renderRootLayout(dna: DesignDNA, hasChrome: boolean): string {
  const title = JSON.stringify(dna.projectName);
  const description = JSON.stringify(`Mockup scaffolded from a Design DNA composition for ${dna.client}.`);

  const chromeImport = hasChrome
    ? `import { Chrome } from '@/components/Chrome';\n`
    : '';
  const bodyContents = hasChrome ? '<Chrome>{children}</Chrome>' : '{children}';

  return `import type { Metadata } from 'next';
${chromeImport}import { displayFont, bodyFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: ${title},
  description: ${description},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning on <html> + <body>: browser extensions (Grammarly,
  // SwiftRead, etc.) inject attributes onto these elements before React hydrates.
  // This is the React/Next.js docs' explicit recommendation — it only suppresses
  // *attribute* mismatches one level deep, not legitimate render mismatches.
  return (
    <html lang="en" className={\`\${displayFont.variable} \${bodyFont.variable}\`} suppressHydrationWarning>
      <body suppressHydrationWarning>${bodyContents}</body>
    </html>
  );
}
`;
}

function renderHomePage(dna: DesignDNA, compiled: CompiledDNA): string {
  const layoutId = compiled.resolved.layout.id;

  switch (layoutId) {
    case 'layout.full-bleed':
      return renderFullBleedPage(dna);
    case 'layout.cinematic-gallery':
      return renderCinematicGalleryPage(dna);
    case 'layout.split-editorial':
    default:
      return renderSplitEditorialPage(dna);
  }
}

function renderSplitEditorialPage(dna: DesignDNA): string {
  const projectName = JSON.stringify(dna.projectName);
  const client = JSON.stringify(dna.client);

  return `'use client';

import { TextMaskReveal } from '@/components/primitives/TextMaskReveal';
import { MagneticButton } from '@/components/primitives/MagneticButton';
import { SmoothScroll } from '@/components/primitives/SmoothScroll';

const projectName = ${projectName};
const client = ${client};

export default function HomePage() {
  return (
    <SmoothScroll>
      <main>
        {/* Hero — Split Editorial 7/5 */}
        <section className="grid grid-cols-12 gap-6 px-6 lg:px-12 pt-24 lg:pt-40 pb-32">
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-end">
            <span className="eyebrow mb-6 block">A studio with {client}</span>
            <TextMaskReveal as="h1" className="display text-h1 text-ink">
              Considered design for businesses building something real.
            </TextMaskReveal>
            <p className="mt-8 text-lead text-ink-muted max-w-xl">
              We make websites and identity systems for companies that want
              their work to feel deliberate &mdash; not loud.
            </p>
            <div className="mt-12">
              <MagneticButton className="bg-accent text-accent-ink px-8 py-4 text-base font-medium rounded-full">
                Start a project &rarr;
              </MagneticButton>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-12">
            <figure className="aspect-[4/5] bg-surface-alt relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="eyebrow text-ink-subtle">Mockup imagery</span>
              </div>
            </figure>
          </div>
        </section>

        {/* Section 2 — typographic statement */}
        <section className="px-6 lg:px-12 py-32 border-t border-border">
          <span className="eyebrow mb-12 block">Approach</span>
          <TextMaskReveal as="h2" className="display text-h2 text-ink max-w-5xl">
            We build the things that look small but feel large &mdash; pages
            that read like printed matter, weighty in the hand even on screen.
          </TextMaskReveal>
        </section>

        <footer className="px-6 lg:px-12 py-16 border-t border-border">
          <div className="flex justify-between items-end">
            <span className="display text-h4 text-ink">{projectName}</span>
            <span className="eyebrow text-ink-subtle">
              Mockup &middot; {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </main>
    </SmoothScroll>
  );
}
`;
}

function renderFullBleedPage(dna: DesignDNA): string {
  const projectName = JSON.stringify(dna.projectName);
  const client = JSON.stringify(dna.client);

  return `'use client';

import { TextMaskReveal } from '@/components/primitives/TextMaskReveal';
import { MagneticButton } from '@/components/primitives/MagneticButton';
import { SmoothScroll } from '@/components/primitives/SmoothScroll';

const projectName = ${projectName};
const client = ${client};

export default function HomePage() {
  return (
    <SmoothScroll>
      <main>
        {/* Hero — Full Bleed */}
        <section className="relative h-screen w-full bg-surface-alt overflow-hidden">
          {/* Mockup imagery placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-surface-alt via-surface to-border" />

          <div className="relative z-10 h-full flex flex-col justify-end px-6 lg:px-12 pb-16">
            <span className="eyebrow text-ink-muted mb-6 block">{client}</span>
            <TextMaskReveal as="h1" className="display text-display text-ink max-w-5xl">
              {projectName}
            </TextMaskReveal>
            <div className="mt-10">
              <MagneticButton className="bg-ink text-background px-8 py-4 rounded-full text-base font-medium">
                Begin &rarr;
              </MagneticButton>
            </div>
          </div>
        </section>

        <section className="px-6 lg:px-12 py-40">
          <span className="eyebrow mb-12 block">A statement</span>
          <TextMaskReveal as="h2" className="display text-h2 text-ink max-w-4xl">
            A line that anchors the work in language as deliberate as the visual.
          </TextMaskReveal>
        </section>

        <footer className="px-6 lg:px-12 py-16 border-t border-border">
          <span className="eyebrow text-ink-subtle">
            Mockup &middot; {new Date().getFullYear()}
          </span>
        </footer>
      </main>
    </SmoothScroll>
  );
}
`;
}

function renderCinematicGalleryPage(dna: DesignDNA): string {
  const projectName = JSON.stringify(dna.projectName);
  const client = JSON.stringify(dna.client);

  return `'use client';

import Image from 'next/image';
import { TextMaskReveal } from '@/components/primitives/TextMaskReveal';
import { MagneticButton } from '@/components/primitives/MagneticButton';
import { SmoothScroll } from '@/components/primitives/SmoothScroll';
import { HorizontalGallery } from '@/components/primitives/HorizontalGallery';

const projectName = ${projectName};
const client = ${client};

const services = [
  {
    id: '01',
    name: 'Architecture',
    description:
      'Full-service residential design — site evaluation through construction documents. Every plan starts with the way the family will live in the home, not with the house itself.',
  },
  {
    id: '02',
    name: 'Interiors',
    description:
      'Material, light, and proportion read together as one composition. Selections completed in lockstep with construction, never bolted on after.',
  },
  {
    id: '03',
    name: 'Construction',
    description:
      'In-house build team. The drawings the architect made are the drawings we build — no value-engineering away the parts that make it the project.',
  },
];

const works = [
  {
    id: '01',
    name: 'Larkspur Residence',
    location: 'Larkspur, CA',
    year: '2025',
    image: {
      src: '/images/work-01-larkspur.png',
      alt: 'Long single-story residence with horizontal cedar siding and a low-pitched copper roof, sited on a Larkspur ridgeline, photographed in soft late-afternoon light with native grasses in the foreground',
    },
  },
  {
    id: '02',
    name: 'Studio in the Woods',
    location: 'Sonoma, CA',
    year: '2024',
    image: {
      src: '/images/work-02-studio.png',
      alt: 'Compact glass-and-timber studio nestled among Sonoma redwoods, soft morning fog, the structure barely separating itself from the trees',
    },
  },
  {
    id: '03',
    name: 'House on the Bluff',
    location: 'Mendocino, CA',
    year: '2024',
    image: {
      src: '/images/work-03-bluff.png',
      alt: 'Mendocino coastal residence on a windswept bluff, charcoal-stained shou-sugi-ban siding, the ocean horizon visible past the home under overcast diffuse light',
    },
  },
  {
    id: '04',
    name: 'Hillside Compound',
    location: 'Marin, CA',
    year: '2023',
    image: {
      src: '/images/work-04-hillside.png',
      alt: 'Modern Marin compound stepping down a hillside in three connected volumes, board-formed concrete and weathered steel, dusk light coming from the west',
    },
  },
];

const hero = {
  src: '/images/hero.png',
  alt: 'A long modern custom home with a cantilevered roof and floor-to-ceiling glazing, set against a Northern California hillside at golden hour, mature oaks framing the entrance',
};

export default function HomePage() {
  return (
    <SmoothScroll>
      <main>
        {/* Hero — full-bleed cinematic */}
        <section className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-surface-alt via-surface to-border">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="relative z-10 flex h-full flex-col justify-end px-6 lg:px-12 pb-16">
            <span className="eyebrow text-ink-muted mb-6 block">{client}</span>
            <TextMaskReveal as="h1" className="display text-display text-ink max-w-5xl">
              Custom homes built without compromise.
            </TextMaskReveal>
            <p className="mt-8 text-lead text-ink-muted max-w-2xl">
              A small studio designing and building considered residences on the Northern California coast.
            </p>
            <div className="mt-12">
              <MagneticButton className="bg-ink text-background px-8 py-4 rounded-full text-base font-medium">
                Begin a project &rarr;
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* Approach + services */}
        <section className="px-6 lg:px-12 py-40 border-t border-border">
          <span className="eyebrow mb-12 block">Approach</span>
          <TextMaskReveal as="h2" className="display text-h2 text-ink max-w-4xl">
            We design and build a small number of homes each year, every one held to the same standard from the foundation to the last detail.
          </TextMaskReveal>

          <div className="mt-32 grid grid-cols-12 gap-8">
            {services.map((s) => (
              <div key={s.id} className="col-span-12 lg:col-span-4 border-t border-border pt-8">
                <span className="eyebrow text-ink-subtle mb-6 block">{s.id} &nbsp;/&nbsp; {s.name}</span>
                <p className="text-base text-ink-muted">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Selected homes — eyebrow lead-in then horizontal gallery */}
        <section className="px-6 lg:px-12 pt-32 pb-12">
          <span className="eyebrow mb-8 block">Selected homes</span>
          <p className="text-lead text-ink-muted max-w-2xl">
            A handful of recent residences. Scroll right to walk through.
          </p>
        </section>

        <HorizontalGallery>
          {works.map((w) => (
            <article
              key={w.id}
              className="relative w-screen h-screen flex-shrink-0 overflow-hidden border-l border-border first:border-l-0 bg-gradient-to-br from-surface-alt via-surface to-border"
            >
              <Image
                src={w.image.src}
                alt={w.image.alt}
                fill
                sizes="100vw"
                className="object-cover"
              />

              <div className="relative z-10 h-full flex flex-col justify-end p-12 lg:p-20">
                <span className="eyebrow text-ink-subtle mb-4 block">
                  {w.location} &middot; {w.year}
                </span>
                <span className="display text-h2 text-ink block drop-shadow-sm">{w.name}</span>
              </div>
            </article>
          ))}
        </HorizontalGallery>

        {/* Testimonial */}
        <section className="px-6 lg:px-12 py-40 border-t border-border">
          <span className="eyebrow mb-12 block">In their words</span>
          <TextMaskReveal as="blockquote" className="display text-h2 text-ink max-w-5xl">
            &ldquo;We expected a house. They built a home &mdash; every detail handled with the kind of attention you only see in books.&rdquo;
          </TextMaskReveal>
          <div className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <span className="display text-h4 text-ink">— The Lindgren Family</span>
            <span className="eyebrow text-ink-subtle">Larkspur Residence, 2025</span>
          </div>
        </section>

        <footer className="px-6 lg:px-12 py-16 border-t border-border flex flex-wrap justify-between items-end gap-6">
          <span className="display text-h4 text-ink">{projectName}</span>
          <span className="eyebrow text-ink-subtle">
            Mockup &middot; {new Date().getFullYear()}
          </span>
        </footer>
      </main>
    </SmoothScroll>
  );
}
`;
}

// ================================================================
// Component file renderers
// ================================================================

function renderTextMaskReveal(): string {
  return `'use client';

import { useRef, useEffect, ElementType, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Props {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
}

/**
 * TextMaskReveal
 *
 * Animates lines of text rising from behind a clipping mask, on scroll.
 *
 * How it works:
 *   1. After fonts load, wrap each word in a span we can measure.
 *   2. Group words by offsetTop — words with the same top are on the same line.
 *   3. Wrap each line in an overflow:hidden mask + an inner movable span.
 *   4. Animate each inner span from yPercent: 110 (just below its mask) to 0,
 *      staggered so lines arrive in sequence.
 *
 * Plays once per scroll into view — replaying on scroll-back is annoying
 * on long pages.
 *
 * Limitation: only handles plain text children. Inline formatting like
 * <em> or <strong> inside the children gets flattened.
 */
export function TextMaskReveal({
  children,
  as: Tag = 'h1',
  className = '',
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const originalHtml = el.innerHTML;
    let cancelled = false;
    let scrollTrigger: ScrollTrigger | undefined;

    const run = async () => {
      if (document.fonts) await document.fonts.ready;
      if (cancelled || !el) return;

      const lines = splitIntoLines(el);
      const tween = gsap.from(lines, {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.08,
        delay,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
      scrollTrigger = tween.scrollTrigger ?? undefined;
    };

    run();

    return () => {
      cancelled = true;
      scrollTrigger?.kill();
      if (el) el.innerHTML = originalHtml;
    };
  }, [delay]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Splits a text element into per-line wrappers + inner movable spans.
 * Returns the inner spans (the things that animate).
 */
function splitIntoLines(el: HTMLElement): HTMLElement[] {
  const text = (el.textContent ?? '').trim();
  const words = text.split(/\\s+/);

  // Pass 1: replace text with measurable word spans
  el.innerHTML = words
    .map((w) => \`<span class="word" style="display:inline-block">\${escapeHtml(w)}&nbsp;</span>\`)
    .join('');

  // Pass 2: group words by offsetTop
  const wordEls = Array.from(el.querySelectorAll('.word')) as HTMLElement[];
  const lineGroups: HTMLElement[][] = [];
  let currentTop = -1;
  let currentGroup: HTMLElement[] = [];

  for (const word of wordEls) {
    if (word.offsetTop !== currentTop) {
      if (currentGroup.length) lineGroups.push(currentGroup);
      currentGroup = [];
      currentTop = word.offsetTop;
    }
    currentGroup.push(word);
  }
  if (currentGroup.length) lineGroups.push(currentGroup);

  // Pass 3: rebuild as mask + inner spans
  el.innerHTML = '';
  const innerSpans: HTMLElement[] = [];

  for (const group of lineGroups) {
    const mask = document.createElement('span');
    mask.style.display = 'block';
    mask.style.overflow = 'hidden';

    const inner = document.createElement('span');
    inner.style.display = 'block';
    inner.textContent = group.map((w) => w.textContent).join('').replace(/\\u00A0+$/, '');

    mask.appendChild(inner);
    el.appendChild(mask);
    innerSpans.push(inner);
  }

  return innerSpans;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c
  ));
}
`;
}

function renderMagneticButton(): string {
  return `'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, MouseEvent, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * MagneticButton
 *
 * Button gently follows the cursor within its bounds.
 *
 * Two ideas working together:
 *   1. Displacement — we move the button toward the cursor by a fraction
 *      (strength: 0.35 = 35% of the cursor's offset from button center).
 *   2. Spring — without it, the button would snap and feel rubbery. The
 *      spring smooths the displacement so the motion has weight.
 *
 * Tune stiffness/damping/mass to change personality:
 *   - heavier mass → more sluggish/luxurious
 *   - higher stiffness → more responsive
 *
 * Use sparingly. One per viewport, never on every link or button.
 * No-op on touch devices.
 */
export function MagneticButton({
  children,
  strength = 0.35,
  className = '',
  onClick,
}: Props) {
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
      onClick={onClick}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
`;
}

function renderSmoothScroll(): string {
  return `'use client';

import { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';

/**
 * SmoothScroll
 *
 * Replaces the browser's native scroll with Lenis's interpolated version,
 * which has weight and inertia. Pair with GSAP ScrollTrigger — they
 * coexist without explicit syncing for most use cases.
 *
 * Disabled when prefers-reduced-motion is set. Smooth scroll is one of
 * the most common things motion-sensitive users disable.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Honor reduced motion — never engage Lenis if user opted out
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
`;
}

function renderChrome(motionIds: Set<string>): string {
  const hasPreloader = motionIds.has('motion.preloader');
  const hasCursor = motionIds.has('motion.cursor-follower');
  const hasTransition = motionIds.has('motion.page-transition');

  const imports: string[] = [];
  if (hasPreloader) imports.push(`import { Preloader } from '@/components/primitives/Preloader';`);
  if (hasCursor) imports.push(`import { CursorFollower } from '@/components/primitives/CursorFollower';`);
  if (hasTransition) imports.push(`import { PageTransition } from '@/components/primitives/PageTransition';`);

  // Children either pass straight through or get wrapped in PageTransition.
  const childExpr = hasTransition
    ? '<PageTransition>{children}</PageTransition>'
    : '{children}';
  const preloaderEl = hasPreloader ? '      <Preloader />\n' : '';
  const cursorEl = hasCursor ? '      <CursorFollower />\n' : '';

  return `'use client';

${imports.join('\n')}

/**
 * Chrome
 *
 * Mounts site-wide motion primitives that need to wrap or sit alongside
 * page content: the first-paint preloader, the global cursor follower,
 * and the route-change page transition. Imported by app/layout.tsx so
 * these primitives persist across navigations.
 */
export function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <>
${preloaderEl}${cursorEl}      ${childExpr}
    </>
  );
}
`;
}

// ================================================================
// Documentation renderers
// ================================================================

function renderClaudeMd(dna: DesignDNA, compiled: CompiledDNA): string {
  const t = compiled.resolved.typography;
  const c = compiled.resolved.color;
  const l = compiled.resolved.layout;
  const e = compiled.resolved.easings;
  const motion = compiled.resolved.motion;

  return `# Design DNA: ${dna.projectName}

This project was scaffolded by the Design DNA system. **Read this file before
making any visual or structural changes** — it captures the aesthetic
constraints that keep the project coherent. Future regenerations or refactors
should preserve these constraints unless explicitly told otherwise.

## Project context

- **Client:** ${dna.client}
- **Project ID:** \`${dna.projectId}\`
- **Stage:** mockup → starter for production build

---

## Design DNA

### Typography: ${t.name}

> ${t.character}

- **Display family:** \`${t.display.name}\`, weights ${t.display.weights.join(', ')}
  - Weight: ${t.displaySpec.weight} · Line-height: ${t.displaySpec.lineHeight} · Tracking: ${t.displaySpec.tracking}em
${t.display.opticalSizing ? '  - Uses optical sizing (font-optical-sizing: auto)\n' : ''}- **Body family:** \`${t.body.name}\`, weights ${t.body.weights.join(', ')}
  - Weight: ${t.bodySpec.weight} · Line-height: ${t.bodySpec.lineHeight} · Tracking: ${t.bodySpec.tracking}em
- **Scale ratio:** ${t.scaleRatio} · Base size: ${t.baseSize}px
${t.photoDirection ? `\n**Photo direction:** ${t.photoDirection}\n` : ''}
### Color: ${c.name} (${c.mode} mode)

> ${c.character}

| Token | Value |
|---|---|
| \`background\` | \`${c.tokens.background}\` |
| \`surface\` | \`${c.tokens.surface}\` |
| \`surface-alt\` | \`${c.tokens.surfaceAlt}\` |
| \`ink\` (primary text) | \`${c.tokens.ink}\` |
| \`ink-muted\` | \`${c.tokens.inkMuted}\` |
| \`ink-subtle\` | \`${c.tokens.inkSubtle}\` |
| \`accent\` | \`${c.tokens.accent}\` |
| \`accent-ink\` | \`${c.tokens.accentInk}\` |
| \`border\` | \`${c.tokens.border}\` |
| \`border-strong\` | \`${c.tokens.borderStrong}\` |

**Accent rules:** ${c.accentRules}
${c.photoDirection ? `\n**Photo direction:** ${c.photoDirection}\n` : ''}
### Layout: ${l.name}

> ${l.character}

- **Hero pattern:** \`${l.hero}\`
- **Grid:** ${l.grid.columns} columns · ${l.grid.gutter} gutter · ${l.grid.maxWidth} max-width
- **Flow:** ${l.flow} · **Density:** ${l.density}

${l.notes}
${l.photoDirection ? `\n**Photo direction:** ${l.photoDirection}\n` : ''}
### Easings

| Role | Preset | cubic-bezier | Personality |
|---|---|---|---|
| Primary | ${e.primary.name} | \`${e.primary.bezier.join(', ')}\` | ${e.primary.personality} |
| Entrance | ${e.entrance.name} | \`${e.entrance.bezier.join(', ')}\` | ${e.entrance.personality} |
| Exit | ${e.exit.name} | \`${e.exit.bezier.join(', ')}\` | ${e.exit.personality} |
| Attention | ${e.attention.name} | \`${e.attention.bezier.join(', ')}\` | ${e.attention.personality} |

### Motion primitives included

${motion.map((m) => `- **${m.name}** (\`${m.library}\`) — ${m.description}\n  > ${m.notes}`).join('\n\n')}

---

## Animation conventions

- **GSAP for scroll-driven animations.** ScrollTrigger lives in primitive
  components, never inline in section components.
- **Framer Motion for component-level animations.** Page transitions, layout
  animations, gesture handling, hover states.
- **Lenis for smooth scroll.** Initialized once at the root via \`SmoothScroll\`.
- **Never combine GSAP and Framer Motion on the same element.** They both
  compete for the \`transform\` property and will fight each other.
- **Respect \`prefers-reduced-motion\`.** The CSS override in \`globals.css\`
  neutralizes most animations. \`SmoothScroll\` checks it explicitly. For new
  primitives, check \`window.matchMedia('(prefers-reduced-motion: reduce)').matches\`.

## File structure

\`\`\`
app/
  layout.tsx       — root layout, font loading via next/font
  globals.css      — Tailwind v4 @theme tokens (DO NOT edit by hand)
  page.tsx         — landing page using the layout archetype
  fonts.ts         — next/font setup
components/
  primitives/      — reusable motion components (TextMaskReveal, MagneticButton, SmoothScroll)
  sections/        — page-level section components (add as needed)
\`\`\`

## Tailwind v4 utilities available

This project uses Tailwind v4. The \`@theme\` block in \`globals.css\` generates
utilities automatically — there is no \`tailwind.config.js\`.

**Color utilities:** \`bg-background\`, \`bg-surface\`, \`bg-surface-alt\`, \`bg-accent\`,
\`text-ink\`, \`text-ink-muted\`, \`text-ink-subtle\`, \`text-accent\`,
\`border-border\`, \`border-border-strong\`.

**Type sizes (display sizes are fluid):** \`text-micro\`, \`text-small\`, \`text-base\`,
\`text-lead\`, \`text-h4\`, \`text-h3\`, \`text-h2\`, \`text-h1\`, \`text-display\`.

**Easings:** \`ease-primary\`, \`ease-entrance\`, \`ease-exit\`, \`ease-attention\`.

**Project-specific helper classes** (not Tailwind utilities):
- \`.display\` — applies the display family + weight + line-height + tracking
- \`.eyebrow\` — small uppercase label styling

## Don't do this

- **No default Tailwind colors.** No \`text-gray-500\`, no \`bg-zinc-100\`. The
  design DNA tokens are the entire palette. If you need another shade, add
  it to the DNA, regenerate, and rebuild — don't sneak it inline.
- **No default Tailwind easings.** Don't use \`ease-in-out\`, \`ease-out\`. Use
  \`ease-primary\`, \`ease-entrance\`, etc.
- **Don't add fonts.** The two families in the DNA are it. A third
  sans-serif "for variety" is the cookie-cutter trap.
- **Don't use the accent color for body text or large backgrounds.** See
  Accent rules above.
- **Don't add new motion primitives without thinking.** First check whether
  existing primitives compose to make what you need. New primitives go in
  \`components/primitives/\` with a \`/** */\` block explaining what they do
  and why.
- **Don't use centered three-card layouts unless the layout DNA calls for
  them.** The Bootstrap 6/6 split and the centered-three-cards pattern are
  the two biggest cookie-cutter giveaways.
`;
}

function renderReadme(dna: DesignDNA): string {
  return `# ${dna.projectName}

Mockup scaffolded from a Design DNA composition for ${dna.client}.

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000.

## Build

\`\`\`bash
npm run build
\`\`\`

## Design system

The visual design tokens (color, typography, motion easings) are in
\`app/globals.css\` under the \`@theme\` block. **Do not edit them by hand** —
they're generated from this project's Design DNA. To change them, modify
the source DNA and regenerate.

See [CLAUDE.md](./CLAUDE.md) for the full design brief.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind v4 (CSS-first config via \`@theme\`)
- Framer Motion + GSAP + Lenis for animations
- TypeScript
`;
}
