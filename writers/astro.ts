/**
 * Astro Project Writer
 *
 * Takes a Design DNA, compiles it, and writes a complete, runnable
 * Astro 5 + Tailwind v4 starter project to disk.
 *
 * Output is a real npm package — `cd <outDir> && npm install && npm run dev`
 * gets you a live mockup at http://localhost:4321 with the full design DNA
 * applied. Tailwind tokens compile from the same `compiler.ts` used by the
 * Next.js writer, so visual output is identical across frameworks.
 *
 * v1 layout coverage: only `layout.cinematic-gallery` is supported. Other
 * layouts throw loudly until they're ported.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DesignDNA } from '../presets';
import { compileDesignDNA, type CompiledDNA } from '../compiler';
import type { WriteProjectOptions, WriteProjectResult } from './index';

// ================================================================
// Public API
// ================================================================

const SUPPORTED_LAYOUTS = new Set(['layout.cinematic-gallery']);

export function writeProject(opts: WriteProjectOptions): WriteProjectResult {
  const { dna, outDir, overwrite = false } = opts;

  if (!SUPPORTED_LAYOUTS.has(dna.layoutId)) {
    throw new Error(
      `Layout ${dna.layoutId} not yet supported in Astro writer ` +
        `(supported: ${[...SUPPORTED_LAYOUTS].join(', ')})`
    );
  }

  // Pre-flight: every motion primitive in the DNA needs an Astro template
  // (or a layout-mode registration). Fail loudly before any files are
  // written rather than emitting a half-built project that 404s on imports.
  for (const id of dna.motionPrimitiveIds) {
    if (!(id in ASTRO_PRIMITIVES)) {
      throw new Error(`No Astro template for ${id}`);
    }
  }

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
  write('astro.config.mjs', renderAstroConfig());
  write('tsconfig.json', renderTsConfig());
  write('src/env.d.ts', renderEnvDts());
  write('.gitignore', renderGitignore());

  // Theme + layout
  write('src/styles/global.css', renderGlobalCss(compiled.themeCss));
  const motionIds = new Set(compiled.resolved.motion.map((m) => m.id));
  write('src/layouts/Layout.astro', renderLayout(dna, compiled.fonts, motionIds));

  // Site-wide chrome wrapper for page-level motion mounts (preloader,
  // cursor-follower). Page-transition is layout-mode and already wired in
  // Layout.astro via <ClientRouter />. Emit only when at least one of the
  // chrome primitives is present in the DNA.
  const hasChrome =
    motionIds.has('motion.preloader') || motionIds.has('motion.cursor-follower');
  if (hasChrome) {
    write('src/components/Chrome.astro', renderChrome(motionIds));
  }

  // Section components (cinematic-gallery layout)
  write('src/components/sections/Hero.astro', renderHeroSection(dna));
  write('src/components/sections/Approach.astro', renderApproachSection());
  write('src/components/sections/Work.astro', renderWorkSection());
  write('src/components/sections/Testimonial.astro', renderTestimonialSection());
  write('src/components/sections/Footer.astro', renderFooterSection(dna));

  // Motion primitives — emit one .astro file per primitive in the DNA.
  // Layout-mode primitives (page-transition) are registered in
  // ASTRO_PRIMITIVES but emit no file; they're wired in Layout.astro by id.
  emitMotionPrimitives(dna, write);

  // Pages
  write('src/pages/index.astro', renderIndexPage(dna, hasChrome));

  return { outDir, filesWritten };
}

// ================================================================
// Motion primitive infrastructure
// ================================================================

type AstroPrimitiveMode = 'component' | 'layout';

interface AstroPrimitive {
  mode: AstroPrimitiveMode;
  /** Component file name (e.g. 'TextMaskReveal.astro') — required for 'component' mode */
  filename?: string;
  /** Astro source — required for 'component' mode */
  template?: string;
}

/**
 * Per-primitive Astro implementations. Populated incrementally —
 * each primitive ID maps to either a component file (most) or a
 * layout-mode marker (page-transition, handled in Layout.astro).
 *
 * If the writer encounters a DNA primitive ID that isn't here, it
 * throws "No Astro template for <id>" before writing anything.
 * Better to fail fast than ship a mockup with broken imports.
 */
const ASTRO_PRIMITIVES: Record<string, AstroPrimitive> = {
  'motion.text-mask-reveal': {
    mode: 'component',
    filename: 'TextMaskReveal.astro',
    template: textMaskRevealTemplate(),
  },
  'motion.preloader': {
    mode: 'component',
    filename: 'Preloader.astro',
    template: preloaderTemplate(),
  },
};

function textMaskRevealTemplate(): string {
  // Hand-rolled line-splitter (no GSAP SplitText dep — keeps free-tier
  // GSAP sufficient). The component takes any element type via `as` and
  // wraps each rendered line in an overflow-hidden mask + inner span,
  // then animates the inner spans up from yPercent 110 on scroll-into-view.
  // Idempotent via data-tmr-initialized so re-firing on view-transition
  // navigation doesn't double-wrap.
  return `---
interface Props {
  as?: string;
  class?: string;
}
const { as: Tag = 'h1', class: className = '' } = Astro.props as Props;
---

<Tag class:list={['text-mask-reveal', className]}>
  <slot />
</Tag>

<script>
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  gsap.registerPlugin(ScrollTrigger);

  function escapeHtml(s: string): string {
    return s.replace(/[&<>"]/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c
    ));
  }

  function splitIntoLines(el: HTMLElement): HTMLElement[] {
    const text = (el.textContent ?? '').trim();
    const words = text.split(/\\s+/);

    el.innerHTML = words
      .map((w) => \`<span class="word" style="display:inline-block">\${escapeHtml(w)}&nbsp;</span>\`)
      .join('');

    const wordEls = Array.from(el.querySelectorAll<HTMLElement>('.word'));
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

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = document.querySelectorAll<HTMLElement>('.text-mask-reveal');
    if (!targets.length) return;

    document.fonts.ready.then(() => {
      targets.forEach((el) => {
        if (el.dataset.tmrInitialized === '1') return;
        el.dataset.tmrInitialized = '1';

        const lines = splitIntoLines(el);
        gsap.from(lines, {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });
    });
  }

  document.addEventListener('astro:page-load', init);
</script>
`;
}

function preloaderTemplate(): string {
  // First-paint reveal: counter ticks 000 → 100 over ~2.4s, then the
  // overlay wipes upward off the viewport. Persists across view-transition
  // navigations via transition:persist; sessionStorage gates re-fire so it
  // only plays once per browser session. Honors prefers-reduced-motion by
  // skipping the animation entirely (overlay hidden immediately).
  return `---
// Preloader — fixed full-bleed overlay with a tabular-numeric counter
// pinned to bottom-right. Driven by a GSAP timeline; gated by
// sessionStorage so it only runs on the first page of a session.
---

<div class="preloader" transition:persist>
  <div class="preloader-counter">000</div>
</div>

<style>
  .preloader {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--color-background);
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: clamp(1.5rem, 4vw, 3rem);
    pointer-events: none;
  }

  .preloader-counter {
    font-family: var(--font-display);
    font-size: clamp(4rem, 12vw, 12rem);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--color-ink);
    font-variant-numeric: tabular-nums;
  }
</style>

<script>
  import gsap from 'gsap';

  function init() {
    const overlay = document.querySelector<HTMLElement>('.preloader');
    const counter = document.querySelector<HTMLElement>('.preloader-counter');
    if (!overlay || !counter) return;

    if (sessionStorage.getItem('preloaderShown') === '1') {
      overlay.style.display = 'none';
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      overlay.style.display = 'none';
      sessionStorage.setItem('preloaderShown', '1');
      return;
    }

    const counterValue = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('preloaderShown', '1');
      },
    });

    tl.to(counterValue, {
      v: 100,
      duration: 2.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        counter.textContent = String(Math.floor(counterValue.v)).padStart(3, '0');
      },
    });
    tl.to(overlay, {
      yPercent: -100,
      duration: 1.0,
      ease: 'expo.inOut',
    }, '+=0.2');
  }

  document.addEventListener('astro:page-load', init);
</script>
`;
}

function emitMotionPrimitives(
  dna: DesignDNA,
  write: (relativePath: string, content: string) => void
): void {
  for (const id of dna.motionPrimitiveIds) {
    const primitive = ASTRO_PRIMITIVES[id];
    // Pre-flight already validated every id is registered, but TS narrows
    // through the lookup so this assertion is for readers, not the runtime.
    if (!primitive) continue;
    if (primitive.mode === 'component') {
      if (!primitive.filename || !primitive.template) {
        throw new Error(
          `Component primitive "${id}" must declare filename and template`
        );
      }
      write(`src/components/primitives/${primitive.filename}`, primitive.template);
    }
    // mode === 'layout': nothing to emit; Layout.astro reads motionIds
    // and wires the layout-level component (e.g. <ClientRouter />).
  }
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

// ================================================================
// Config file renderers
// ================================================================

function renderPackageJson(dna: DesignDNA): string {
  const pkg = {
    name: `${slugify(dna.projectName)}-mockup`,
    type: 'module',
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
      astro: 'astro',
      check: 'astro check',
    },
    dependencies: {
      astro: '^5.0.0',
      '@astrojs/check': '^0.9.0',
      typescript: '^5.6.0',
      '@tailwindcss/vite': '^4.0.0',
      tailwindcss: '^4.0.0',
      gsap: '^3.12.5',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

function renderAstroConfig(): string {
  // Note: no `// @ts-check` directive. @tailwindcss/vite >=4.2 transitively
  // pulls vite 8, while Astro 5 pins vite 6 — the two Vite type
  // declarations have incompatible Plugin signatures (hotUpdate hook). The
  // runtime works fine; this only affects type-checking of the config file
  // itself. Astro's own integration docs ship this example without
  // @ts-check, so we follow suit. Page components are still strict.
  return `import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
`;
}

function renderTsConfig(): string {
  const config = {
    extends: 'astro/tsconfigs/strict',
    include: ['.astro/types.d.ts', '**/*'],
    exclude: ['dist'],
  };
  return JSON.stringify(config, null, 2) + '\n';
}

function renderEnvDts(): string {
  return `/// <reference types="astro/client" />\n`;
}

function renderGitignore(): string {
  return `node_modules/
dist/
.astro/
.env
.DS_Store
`;
}

// ================================================================
// Theme + layout renderers
// ================================================================

function renderGlobalCss(themeCss: string): string {
  // The compiler already opens with `@import "tailwindcss";` and emits the
  // full @theme block, body defaults, and reduced-motion override. The
  // Astro project consumes that output unchanged — Tailwind v4's CSS-first
  // config is framework-agnostic, so no fork is needed.
  return themeCss + '\n';
}

function renderIndexPage(dna: DesignDNA, hasChrome: boolean): string {
  // Composes the cinematic-gallery sections inside Layout. Chrome wraps the
  // <main> when the DNA includes preloader / cursor-follower (those mount
  // as siblings to page content). Sections themselves are imported from
  // src/components/sections/*.astro.
  const chromeImport = hasChrome
    ? `import Chrome from '../components/Chrome.astro';\n`
    : '';
  const openChrome = hasChrome ? '<Chrome>\n    ' : '';
  const closeChrome = hasChrome ? '\n  </Chrome>' : '';

  return `---
${chromeImport}import Layout from '../layouts/Layout.astro';
import Hero from '../components/sections/Hero.astro';
import Approach from '../components/sections/Approach.astro';
import Work from '../components/sections/Work.astro';
import Testimonial from '../components/sections/Testimonial.astro';
import Footer from '../components/sections/Footer.astro';
---

<Layout title=${JSON.stringify(dna.projectName)}>
  ${openChrome}<main>
      <Hero />
      <Approach />
      <Work />
      <Testimonial />
      <Footer />
    </main>${closeChrome}
</Layout>
`;
}

function renderChrome(motionIds: Set<string>): string {
  // Mounts site-wide motion primitives that sit alongside page content
  // (preloader, cursor-follower). Page-transition is wired in Layout.astro
  // because <ClientRouter /> belongs in <head>, not in body chrome.
  const hasPreloader = motionIds.has('motion.preloader');
  const hasCursor = motionIds.has('motion.cursor-follower');

  const imports: string[] = [];
  const mounts: string[] = [];
  if (hasPreloader) {
    imports.push(`import Preloader from './primitives/Preloader.astro';`);
    mounts.push('<Preloader />');
  }
  if (hasCursor) {
    imports.push(`import CursorFollower from './primitives/CursorFollower.astro';`);
    mounts.push('<CursorFollower />');
  }

  const importBlock = imports.length ? imports.join('\n') + '\n' : '';
  const mountBlock = mounts.length ? mounts.join('\n') + '\n\n' : '';

  return `---
${importBlock}---

${mountBlock}<slot />
`;
}

// ================================================================
// Section renderers — cinematic-gallery layout
// ================================================================
//
// Each section is a self-contained .astro component imported from
// src/pages/index.astro. Section content is hardcoded for the v1 mockup
// shape; future iteration would lift it to props or a content collection.
//
// Phase 3 emits structural HTML only — motion primitive wrappers
// (TextMaskReveal, MagneticButton, HorizontalGallery) land in Phase 4 and
// re-emit each affected section.

function renderHeroSection(dna: DesignDNA): string {
  // Full-bleed cinematic hero. Background image lands at /images/hero.png
  // when /enrich runs; until then, the gradient fallback keeps the
  // composition readable. Eyebrow + display headline + lead + CTA pinned
  // to bottom-left so the image breathes through the top two-thirds.
  const client = dna.client;
  return `---
import TextMaskReveal from '../primitives/TextMaskReveal.astro';

const hero = {
  src: '/images/hero.png',
  alt: 'A long modern custom home with a cantilevered roof and floor-to-ceiling glazing, set against a Northern California hillside at golden hour, mature oaks framing the entrance',
};
---

<section class="relative h-screen w-full overflow-hidden bg-gradient-to-br from-surface-alt via-surface to-border">
  <img
    src={hero.src}
    alt={hero.alt}
    class="absolute inset-0 h-full w-full object-cover"
  />

  <div class="relative z-10 flex h-full flex-col justify-end px-6 lg:px-12 pb-16">
    <span class="eyebrow text-ink-muted mb-6 block">${client}</span>
    <TextMaskReveal as="h1" class="display text-display text-ink max-w-5xl">
      Custom homes built without compromise.
    </TextMaskReveal>
    <p class="mt-8 text-lead text-ink-muted max-w-2xl">
      A small studio designing and building considered residences on the Northern California coast.
    </p>
    <div class="mt-12">
      <button class="bg-ink text-background px-8 py-4 rounded-full text-base font-medium">
        Begin a project &rarr;
      </button>
    </div>
  </div>
</section>
`;
}

function renderApproachSection(): string {
  // Eyebrow + display statement + 3 service columns. The 3-column row uses
  // the layout's 12-col grid (col-span-4 each on lg) — not a centered
  // three-card pattern. Each column leads with a numbered eyebrow and
  // sits behind a top border to read like a typographic ledger.
  return `---
import TextMaskReveal from '../primitives/TextMaskReveal.astro';

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
---

<section class="px-6 lg:px-12 py-40 border-t border-border">
  <span class="eyebrow mb-12 block">Approach</span>
  <TextMaskReveal as="h2" class="display text-h2 text-ink max-w-4xl">
    We design and build a small number of homes each year, every one held to the same standard from the foundation to the last detail.
  </TextMaskReveal>

  <div class="mt-32 grid grid-cols-12 gap-8">
    {services.map((s) => (
      <div class="col-span-12 lg:col-span-4 border-t border-border pt-8">
        <span class="eyebrow text-ink-subtle mb-6 block">
          {s.id} &nbsp;/&nbsp; {s.name}
        </span>
        <p class="text-base text-ink-muted">{s.description}</p>
      </div>
    ))}
  </div>
</section>
`;
}

function renderWorkSection(): string {
  // Two-part section: an eyebrow lead-in, then a horizontal-scrolling track
  // of full-screen work articles. In Phase 3 the track is a native
  // overflow-x-auto container — the same shape `motion.horizontal-gallery`
  // falls back to under prefers-reduced-motion. Phase 4 wraps the track
  // in <HorizontalGallery> to add GSAP pinned scrolling.
  return `---
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
---

<section class="px-6 lg:px-12 pt-32 pb-12">
  <span class="eyebrow mb-8 block">Selected homes</span>
  <p class="text-lead text-ink-muted max-w-2xl">
    A handful of recent residences. Scroll right to walk through.
  </p>
</section>

<div class="flex overflow-x-auto">
  {works.map((w) => (
    <article class="relative w-screen h-screen flex-shrink-0 overflow-hidden border-l border-border first:border-l-0 bg-gradient-to-br from-surface-alt via-surface to-border">
      <img
        src={w.image.src}
        alt={w.image.alt}
        class="absolute inset-0 h-full w-full object-cover"
      />

      <div class="relative z-10 h-full flex flex-col justify-end p-12 lg:p-20">
        <span class="eyebrow text-ink-subtle mb-4 block">
          {w.location} &middot; {w.year}
        </span>
        <span class="display text-h2 text-ink block drop-shadow-sm">{w.name}</span>
      </div>
    </article>
  ))}
</div>
`;
}

function renderTestimonialSection(): string {
  return `---
import TextMaskReveal from '../primitives/TextMaskReveal.astro';
---

<section class="px-6 lg:px-12 py-40 border-t border-border">
  <span class="eyebrow mb-12 block">In their words</span>
  <TextMaskReveal as="blockquote" class="display text-h2 text-ink max-w-5xl">
    &ldquo;We expected a house. They built a home &mdash; every detail handled with the kind of attention you only see in books.&rdquo;
  </TextMaskReveal>
  <div class="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-2">
    <span class="display text-h4 text-ink">— The Lindgren Family</span>
    <span class="eyebrow text-ink-subtle">Larkspur Residence, 2025</span>
  </div>
</section>
`;
}

function renderFooterSection(dna: DesignDNA): string {
  // Year is computed at build time via Astro frontmatter (static), not at
  // render time on the client — same shape Next.js used (`new Date()` in
  // server-rendered RSC).
  return `---
const year = new Date().getFullYear();
---

<footer class="px-6 lg:px-12 py-16 border-t border-border flex flex-wrap justify-between items-end gap-6">
  <span class="display text-h4 text-ink">${dna.projectName}</span>
  <span class="eyebrow text-ink-subtle">
    Mockup &middot; {year}
  </span>
</footer>
`;
}

function renderLayout(
  dna: DesignDNA,
  fonts: CompiledDNA['fonts'],
  motionIds: Set<string>
): string {
  const title = dna.projectName;
  const description = `Mockup scaffolded from a Design DNA composition for ${dna.client}.`;
  const hasPageTransition = motionIds.has('motion.page-transition');

  // Preconnect + stylesheet links — the compiler hands us the URLs so we
  // don't reverse-engineer them here.
  const preconnects = fonts.preconnects.map((url) => {
    const cross = url.includes('gstatic.com') ? ' crossorigin' : '';
    return `    <link rel="preconnect" href="${url}"${cross} />`;
  });
  const stylesheets = fonts.stylesheets.map(
    (url) => `    <link rel="stylesheet" href="${url}" />`
  );

  const importLines = [`import '../styles/global.css';`];
  if (hasPageTransition) {
    importLines.push(`import { ClientRouter } from 'astro:transitions';`);
  }

  // ClientRouter mounts in <head> per Astro docs — its presence enables
  // browser-native View Transitions on cross-page navigation.
  const clientRouterEl = hasPageTransition ? `\n    <ClientRouter />` : '';

  return `---
${importLines.join('\n')}

interface Props {
  title?: string;
  description?: string;
}

const { title = ${JSON.stringify(title)}, description = ${JSON.stringify(description)} } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content={description} />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>

${preconnects.join('\n')}
${stylesheets.join('\n')}${clientRouterEl}
  </head>
  <body class="bg-background text-ink font-body">
    <slot />
  </body>
</html>
`;
}
