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
import { compileDesignDNA } from '../compiler';
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

  void compiled;

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
  return `// @ts-check
import { defineConfig } from 'astro/config';
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
