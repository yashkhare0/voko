import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ManifestEntry } from '../manifest/types';
import { readLocaleJson } from '../locale/read';
import { writeLocaleJson } from '../locale/write';

export interface QuarantineOptions {
  cwd?: string;
}

function ensureDir(path: string): void {
  mkdirSync(dirname(resolve(path)), { recursive: true });
}

/**
 * Move orphaned keys into .voko/trash/<namespace>.json, grouped by namespace.
 * If an entry has null key, it is skipped.
 */
export function moveOrphansToTrash(
  entries: ManifestEntry[],
  opts: QuarantineOptions = {},
): string[] {
  const cwd = opts.cwd ?? process.cwd();
  const byNs = new Map<string, string[]>();
  for (const e of entries) {
    if (e.key && e.status === 'orphaned') {
      byNs.set(e.namespace, [...(byNs.get(e.namespace) ?? []), e.key]);
    }
  }
  const touched: string[] = [];
  for (const [ns, keys] of byNs) {
    const rel = `.voko/trash/${ns}.json`;
    const abs = resolve(cwd, rel);
    ensureDir(abs);
    const existing = readLocaleJson(abs) as Record<string, unknown>;
    for (const k of keys) {
      // mark as deprecated true to preserve trace
      const parts = k.split('.');
      let cur = existing as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i += 1) {
        const p = parts[i];
        const next = cur[p];
        if (!next || typeof next !== 'object' || Array.isArray(next)) {
          const child: Record<string, unknown> = {};
          cur[p] = child;
          cur = child;
        } else {
          cur = next as Record<string, unknown>;
        }
      }
      cur[parts[parts.length - 1]] = { __deprecated: true };
    }
    const { path } = writeLocaleJson(abs, existing, { cwd });
    touched.push(path);
  }
  return touched;
}
