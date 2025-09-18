import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Manifest } from './types';

const DEFAULT_MANIFEST: Manifest = { version: 1, entries: [] };

function stripBom(input: string): string {
  if (input.length === 0) return input;
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

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
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    return DEFAULT_MANIFEST;
  }
  try {
    const parsedUnknown = JSON.parse(stripBom(raw));
    if (!parsedUnknown || typeof parsedUnknown !== 'object') {
      return DEFAULT_MANIFEST;
    }
    const parsed = parsedUnknown as Partial<Manifest> & Record<string, unknown>;
    const version =
      typeof parsed.version === 'number' && Number.isFinite(parsed.version)
        ? parsed.version
        : DEFAULT_MANIFEST.version;
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    return { version, entries } as Manifest;
  } catch {
    return DEFAULT_MANIFEST;
  }
}
