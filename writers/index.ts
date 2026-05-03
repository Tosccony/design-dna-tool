import * as nextjs from './nextjs';
import * as astro from './astro';
import type { DesignDNA } from '../presets';

export type Framework = 'nextjs' | 'astro';

export interface WriteProjectOptions {
  dna: DesignDNA;
  outDir: string;
  overwrite?: boolean;
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
