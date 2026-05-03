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

  // Pages
  write('src/pages/index.astro', renderIndexPage(dna));

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

function renderIndexPage(dna: DesignDNA): string {
  // v1 stub — sections land in Phase 3. Renders the project name in the
  // display family on the color preset's background, which proves the
  // theme + font wiring resolves end-to-end.
  return `---
import Layout from '../layouts/Layout.astro';
---

<Layout>
  <main class="min-h-screen flex items-center justify-center px-6">
    <h1 class="display text-h1 text-ink text-center">${dna.projectName}</h1>
  </main>
</Layout>
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
