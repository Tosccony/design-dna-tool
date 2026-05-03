/**
 * Cross-writer utilities.
 *
 * Anything that two or more writers need but that isn't framework-specific
 * lives here. Today: directory-copy plumbing for shared image assets so
 * a single /enrich pass populates multiple framework outputs of the same
 * DNA without paying twice.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Recursively copy every regular file from `fromDir` into `toDir`,
 * creating sub-directories as needed. Overwrites colliding files.
 * Returns relative POSIX paths (relative to `toDir`) of every file
 * written. No-op (returns []) if `fromDir` doesn't exist.
 *
 * Symlinks, sockets, and other non-regular entries are skipped — we
 * don't expect them under public/images/, and silently dropping them
 * is safer than half-resolving them.
 */
export function copyDirRecursive(fromDir: string, toDir: string): string[] {
  if (!fs.existsSync(fromDir)) return [];

  fs.mkdirSync(toDir, { recursive: true });
  const written: string[] = [];

  const walk = (currentFrom: string, currentTo: string, relPrefix: string) => {
    const entries = fs.readdirSync(currentFrom, { withFileTypes: true });
    for (const entry of entries) {
      const fromPath = path.join(currentFrom, entry.name);
      const toPath = path.join(currentTo, entry.name);
      const relPath = relPrefix
        ? path.posix.join(relPrefix, entry.name)
        : entry.name;

      if (entry.isDirectory()) {
        fs.mkdirSync(toPath, { recursive: true });
        walk(fromPath, toPath, relPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(fromPath, toPath);
        written.push(relPath);
      }
    }
  };

  walk(fromDir, toDir, '');
  return written;
}
