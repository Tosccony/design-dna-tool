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

  // File emissions land here in subsequent tasks. For now the writer
  // resolves the DNA, validates layout scope, prepares the output dir,
  // and returns an empty result — the bones are in place.
  void compiled;
  void write;

  return { outDir, filesWritten };
}
