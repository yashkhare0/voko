import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Manifest } from './types';

export interface ReadManifestOptions {
  /** Root of the consumer project (contains .voko/) */
  cwd?: string;
  /** Relative path to manifest file from cwd */
  path?: string;
}

export function readManifest(opts: ReadManifestOptions = {}): Manifest {
  const cwd = opts.cwd ?? process.cwd();
  const rel = opts.path ?? '.voko/manifest.json';
  const filePath = resolve(cwd, rel);
  if (!existsSync(filePath)) {
    return { version: 1, entries: [] };
  }
  const raw = readFileSync(filePath, 'utf8');
  try {
    const parsed = JSON.parse(raw) as Manifest;
    // Basic shape guard; fallback to empty if malformed
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
      return { version: 1, entries: [] };
    }
    return { version: parsed.version ?? 1, entries: parsed.entries };
  } catch {
    // Malformed JSON → initialize new manifest
    return { version: 1, entries: [] };
  }
}
