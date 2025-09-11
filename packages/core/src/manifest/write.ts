import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Manifest } from './types';

export interface WriteManifestOptions {
  cwd?: string;
  path?: string;
}

function stringifyStable(manifest: Manifest): string {
  // Ensure stable ordering of entries by namespace, file, key
  const entries = [...manifest.entries].sort((a, b) => {
    if (a.namespace !== b.namespace) return a.namespace.localeCompare(b.namespace);
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    const ak = a.key ?? '';
    const bk = b.key ?? '';
    return ak.localeCompare(bk);
  });
  const data: Manifest = { version: manifest.version ?? 1, entries };
  return JSON.stringify(data, null, 2) + '\n';
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
  } catch {
    // ignore; file may not exist
  }
  writeFileSync(filePath, nextContent, 'utf8');
}
