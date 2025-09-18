import type { CandidateIR } from '../types/ir';
import type { Config } from '../config/types';
import type { ReconcileResult } from '../manifest/types';
import { readLocaleJson } from './read';
import { writeLocaleJson } from './write';

function setNested(obj: Record<string, unknown>, parts: string[], value: unknown): void {
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = cur[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      const child: Record<string, unknown> = {};
      cur[key] = child;
      cur = child;
    } else {
      cur = next as Record<string, unknown>;
    }
  }
  cur[parts[parts.length - 1]] = value;
}

function ensureNested(obj: Record<string, unknown>, parts: string[], defaultValue: unknown): void {
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = cur[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      const child: Record<string, unknown> = {};
      cur[key] = child;
      cur = child;
    } else {
      cur = next as Record<string, unknown>;
    }
  }
  const leafKey = parts[parts.length - 1];
  if (!(leafKey in cur)) {
    cur[leafKey] = defaultValue;
  }
}

export interface MergeResultSummary {
  touchedFiles: string[];
  createdKeys: number;
  updatedKeys: number;
  skipped: number;
}

/**
 * Merge candidates into locale files based on reconcile result.
 * - Base locale gets source text values.
 * - Other locales get "" for newly created keys (do not overwrite on updates).
 */
export function mergeLocales(
  candidates: CandidateIR[],
  config: Config,
  reconcile: ReconcileResult,
): MergeResultSummary {
  const defaultLocale = config.defaultLocale;
  const otherLocales = (config.locales ?? []).filter((l) => l !== defaultLocale);

  // Build text map for quick lookup
  const textByNsKey = new Map<string, string>();
  for (const c of candidates) {
    const key = c.hints?.key;
    if (!key) continue;
    textByNsKey.set(`${c.namespace}::${key}`, c.text);
  }

  const createdKeys = new Map<string, Set<string>>(); // ns -> keys
  const updatedKeys = new Map<string, Set<string>>();
  let skipped = 0;

  for (const e of reconcile.created) {
    if (!e.key) {
      skipped += 1;
      continue;
    }
    const set = createdKeys.get(e.namespace) ?? new Set<string>();
    set.add(e.key);
    createdKeys.set(e.namespace, set);
  }
  for (const u of reconcile.updated) {
    if (!u.entry.key) {
      skipped += 1;
      continue;
    }
    const set = updatedKeys.get(u.entry.namespace) ?? new Set<string>();
    set.add(u.entry.key);
    updatedKeys.set(u.entry.namespace, set);
  }

  const namespaces = new Set<string>([
    ...Array.from(createdKeys.keys()),
    ...Array.from(updatedKeys.keys()),
  ]);

  const touchedFiles: string[] = [];

  for (const ns of namespaces) {
    // Base locale
    const basePath = `locales/${defaultLocale}/${ns}.json`;
    const baseData = readLocaleJson(basePath) as Record<string, unknown>;
    for (const key of createdKeys.get(ns) ?? []) {
      const text = textByNsKey.get(`${ns}::${key}`) ?? '';
      setNested(baseData, key.split('.'), text);
    }
    for (const key of updatedKeys.get(ns) ?? []) {
      const text = textByNsKey.get(`${ns}::${key}`) ?? '';
      setNested(baseData, key.split('.'), text);
    }
    const wrote1 = writeLocaleJson(basePath, baseData);
    if (wrote1.wrote) touchedFiles.push(wrote1.path);

    // Other locales
    for (const loc of otherLocales) {
      const p = `locales/${loc}/${ns}.json`;
      const data = readLocaleJson(p) as Record<string, unknown>;
      for (const key of createdKeys.get(ns) ?? []) {
        ensureNested(data, key.split('.'), '');
      }
      const wrote = writeLocaleJson(p, data);
      if (wrote.wrote) touchedFiles.push(wrote.path);
    }
  }

  let createdCount = 0;
  let updatedCount = 0;
  for (const s of createdKeys.values()) createdCount += s.size;
  for (const s of updatedKeys.values()) updatedCount += s.size;

  return { touchedFiles, createdKeys: createdCount, updatedKeys: updatedCount, skipped };
}
