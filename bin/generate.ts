#!/usr/bin/env -S tsx
/**
 * Generate a mockup project from a saved Design DNA.
 *
 * Usage:
 *   tsx bin/generate.ts <dna.json> [options]
 *
 * Examples:
 *   tsx bin/generate.ts library/thursday-flowers.json
 *   tsx bin/generate.ts library/foo.json --overwrite
 *   tsx bin/generate.ts library/foo.json --out-dir /tmp/preview
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';

import type { DesignDNA } from '../presets';
import { writeProject } from '../writer';

// ================================================================
// Argument parsing
// ================================================================

function parseCliArgs() {
  try {
    return parseArgs({
      options: {
        'out-dir':   { type: 'string' },
        'name':      { type: 'string' },
        'overwrite': { type: 'boolean' },
        'help':      { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    });
  } catch (err) {
    fail(`Could not parse arguments: ${(err as Error).message}`);
  }
}

function printUsage() {
  console.log(`
Generate a mockup project from a saved Design DNA.

Usage:
  tsx bin/generate.ts <dna.json> [options]

Arguments:
  <dna.json>        Path to a saved DNA JSON file (e.g. library/foo.json)

Options:
  --out-dir <dir>   Override output directory (default: generated/<slug>)
  --name <slug>     Override the slug used for the output folder
  --overwrite       Overwrite an existing output directory
  -h, --help        Show this help

Examples:
  tsx bin/generate.ts library/thursday-flowers.json
  tsx bin/generate.ts library/foo.json --overwrite
  tsx bin/generate.ts library/foo.json --out-dir /tmp/preview
`);
}

// ================================================================
// Validation
// ================================================================

const requiredTopLevelFields: Array<keyof DesignDNA> = [
  'projectId',
  'projectName',
  'client',
  'typographyId',
  'colorId',
  'layoutId',
  'easingsByRole',
  'motionPrimitiveIds',
];

const requiredEasingRoles = ['primary', 'entrance', 'exit', 'attention'] as const;

function validateDna(value: unknown, source: string): asserts value is DesignDNA {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(`${source} must be a JSON object (got ${Array.isArray(value) ? 'array' : typeof value})`);
  }

  const dna = value as Record<string, unknown>;

  const missing = requiredTopLevelFields.filter((field) => dna[field] === undefined);
  if (missing.length) {
    fail(`${source} is missing required field(s): ${missing.join(', ')}`);
  }

  const easings = dna.easingsByRole;
  if (typeof easings !== 'object' || easings === null) {
    fail(`${source}.easingsByRole must be an object`);
  }
  const missingEasings = requiredEasingRoles.filter(
    (role) => !(role in (easings as Record<string, unknown>))
  );
  if (missingEasings.length) {
    fail(`${source}.easingsByRole is missing role(s): ${missingEasings.join(', ')}`);
  }

  if (!Array.isArray(dna.motionPrimitiveIds)) {
    fail(
      `${source}.motionPrimitiveIds must be an array (got ${typeof dna.motionPrimitiveIds})`
    );
  }
}

// ================================================================
// Helpers
// ================================================================

function slugFromPath(filePath: string): string {
  return path
    .basename(filePath, path.extname(filePath))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

// ================================================================
// Main
// ================================================================

function main() {
  const { values, positionals } = parseCliArgs();

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  if (positionals.length === 0) {
    printUsage();
    process.exit(1);
  }

  if (positionals.length > 1) {
    fail(`Only one DNA file is supported per run (got ${positionals.length})`);
  }

  const dnaPath = positionals[0];

  if (!fs.existsSync(dnaPath)) {
    fail(`DNA file not found: ${dnaPath}`);
  }

  // Read + parse JSON
  let raw: string;
  try {
    raw = fs.readFileSync(dnaPath, 'utf-8');
  } catch (err) {
    fail(`Could not read ${dnaPath}: ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail(`Could not parse ${dnaPath} as JSON: ${(err as Error).message}`);
  }

  // Structural validation (compiler does the deeper preset-resolution check)
  validateDna(parsed, dnaPath);
  const dna: DesignDNA = parsed;

  // Output directory
  const slug = values.name ?? slugFromPath(dnaPath);
  const outDir = values['out-dir'] ?? path.join('generated', slug);

  console.log(`→ Generating mockup`);
  console.log(`  DNA:    ${dnaPath}`);
  console.log(`  Output: ${outDir}`);
  console.log(``);

  // Generate
  let result;
  try {
    result = writeProject({
      dna,
      outDir,
      overwrite: values.overwrite,
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes('exists') && !values.overwrite) {
      fail(`${message}\n  Pass --overwrite to clobber existing files.`);
    }
    fail(`Generation failed: ${message}`);
  }

  console.log(`✓ ${result.filesWritten.length} files written\n`);
  console.log(`Next steps:`);
  console.log(`  cd ${result.outDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log(``);
}

main();
