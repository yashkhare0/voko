import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Manifest } from './types';

// Use a deterministic, locale-stable collator for lexicographic sorting
const COLLATOR = new Intl.Collator('en', {
  usage: 'sort',
  sensitivity: 'variant',
  numeric: false,
});

// Recursively returns a deep-cloned value with object keys sorted lexicographically
function sortKeysDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item)) as unknown as T;
  }
  const input = value as Record<string, unknown>;
  const sortedKeys = Object.keys(input).sort(COLLATOR.compare);
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = sortKeysDeep(input[key]);
  }
  return result as unknown as T;
}

export interface WriteManifestOptions {
  cwd?: string;
  path?: string;
}

function stringifyStable(manifest: Manifest): string {
  // Ensure stable ordering of entries by namespace, file, key
  const entries = [...manifest.entries].sort((a, b) => {
    if (a.namespace !== b.namespace) return COLLATOR.compare(a.namespace, b.namespace);
    if (a.file !== b.file) return COLLATOR.compare(a.file, b.file);
    const ak = a.key ?? '';
    const bk = b.key ?? '';
    return COLLATOR.compare(ak, bk);
  });
  const data: Manifest = { version: manifest.version ?? 1, entries };
  const sorted = sortKeysDeep(data);
  return JSON.stringify(sorted, null, 2) + '\n';
}

export function writeManifest(manifest: Manifest, opts: WriteManifestOptions = {}): void {
  const cwd = opts.cwd ?? process.cwd();
  const rel = opts.path ?? '.voko/manifest.json';
  const filePath = resolve(cwd, rel);
  mkdirSync(dirname(filePath), { recursive: true });

  const nextContent = stringifyStable(manifest);
  try {
    const prev = readFileSync(filePath, 'utf8');
    if (prev === nextContent) return; // stable write: skip when unchanged
  } catch (err) {
    // Only ignore missing file; bubble up other issues.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  writeFileSync(filePath, nextContent, 'utf8');
}
