import * as fs from 'node:fs';
import * as path from 'node:path';

import * as nextjs from './nextjs';
import * as astro from './astro';
import type { DesignDNA } from '../presets';

export type Framework = 'nextjs' | 'astro';

export interface WriteProjectOptions {
  dna: DesignDNA;
  outDir: string;
  overwrite?: boolean;
  /**
   * Path to a sibling output's `public/images/` directory whose contents
   * the writer should copy into this output's `public/images/`. Lets a
   * single /enrich pass populate multiple framework outputs of the same
   * DNA — both Next.js and Astro serve `public/images/foo.png` at
   * `/images/foo.png`, so the bytes are identical across frameworks.
   */
  inheritAssetsFrom?: string;
}

export interface WriteProjectResult {
  outDir: string;
  filesWritten: string[];
}

export type WriteProject = (opts: WriteProjectOptions) => WriteProjectResult;

export const writers: Record<Framework, WriteProject> = {
  nextjs: nextjs.writeProject,
  astro: astro.writeProject,
};

export const availableFrameworks: Framework[] = Object.keys(writers) as Framework[];

export function isFramework(value: string): value is Framework {
  return value in writers;
}

/**
 * Default output directory name for a slug under a given framework.
 * Mirrors the convention used by `bin/generate.ts`: nextjs at
 * `<slug>` (no suffix), other frameworks at `<slug>.<framework>`.
 */
export function defaultOutDirName(slug: string, framework: Framework): string {
  return framework === 'nextjs' ? slug : `${slug}.${framework}`;
}

/**
 * Look for an enriched-images directory under any framework's default
 * output for the given slug, except `currentFramework` itself. Returns
 * the first match (in `availableFrameworks` order) or null if no sibling
 * has been enriched.
 */
export function findSiblingAssetsDir(
  slug: string,
  currentFramework: Framework,
  generatedRoot = 'generated'
): string | null {
  for (const other of availableFrameworks) {
    if (other === currentFramework) continue;
    const candidate = path.join(
      generatedRoot,
      defaultOutDirName(slug, other),
      'public',
      'images'
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
