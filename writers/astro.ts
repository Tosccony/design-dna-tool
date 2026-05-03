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

  // Pages
  write('src/pages/index.astro', renderIndexPage(dna, hasChrome));

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

function renderChrome(_motionIds: Set<string>): string {
  // Mounts site-wide motion primitives that sit alongside page content
  // (preloader, cursor-follower). Page-transition is wired in Layout.astro.
  // In Phase 3 the slot passes through unchanged; primitive imports + mounts
  // land in Phase 4 as the GSAP implementations come online.
  return `---
// Site chrome — mounts page-level motion primitives that wrap or sit
// alongside <main>. Imports populate as motion primitives become available.
---

<slot />
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
    <h1 class="display text-display text-ink max-w-5xl">
      Custom homes built without compromise.
    </h1>
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
  return `<section class="approach">
  <h2>Approach — placeholder</h2>
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
  return `<section class="testimonial">
  <h2>Testimonial — placeholder</h2>
</section>
`;
}

function renderFooterSection(_dna: DesignDNA): string {
  return `<footer>
  <p>Footer — placeholder</p>
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
