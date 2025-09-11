import type { CandidateIR } from '../types/ir';
import { normalizeText } from '../text/normalize';
import { hash64 } from '../hash';
import type { Manifest, ManifestEntry, ReconcileResult } from './types';

interface ReconcileOptions {
  now?: string; // ISO timestamp for lastSeen; default new Date().toISOString()
}

function indexByKey(entries: ManifestEntry[]): Map<string, ManifestEntry> {
  const m = new Map<string, ManifestEntry>();
  for (const e of entries) {
    if (e.key) m.set(`${e.namespace}::${e.key}`, e);
  }
  return m;
}

function indexByContentHash(entries: ManifestEntry[]): Map<string, ManifestEntry[]> {
  const m = new Map<string, ManifestEntry[]>();
  for (const e of entries) {
    const arr = m.get(e.contentHash) ?? [];
    arr.push(e);
    m.set(e.contentHash, arr);
  }
  return m;
}

export function reconcile(
  candidates: CandidateIR[],
  manifest: Manifest,
  options: ReconcileOptions = {},
): { result: ReconcileResult; nextManifest: Manifest } {
  const now = options.now ?? new Date().toISOString();

  const byKey = indexByKey(manifest.entries);
  const byHash = indexByContentHash(manifest.entries);

  const created: ManifestEntry[] = [];
  const updated: { previous: ManifestEntry; entry: ManifestEntry }[] = [];
  const unchanged: ManifestEntry[] = [];

  const seen = new Set<ManifestEntry>();

  for (const c of candidates) {
    const candidateKey = c.hints?.key ?? null;
    const candidateHash = hash64(normalizeText(c.text));

    // 1) Match by exact namespace+key if provided via hints and present in manifest
    if (candidateKey) {
      const maybeKey = byKey.get(`${c.namespace}::${candidateKey}`);
      if (maybeKey) {
        const isChanged = maybeKey.contentHash !== candidateHash;
        const next: ManifestEntry = {
          ...maybeKey,
          file: c.loc.file,
          tag: c.tag,
          start: c.loc.start,
          end: c.loc.end,
          lastSeen: now,
          contentHash: candidateHash,
        };
        seen.add(maybeKey);
        if (isChanged) {
          updated.push({ previous: maybeKey, entry: next });
        } else {
          unchanged.push(next);
        }
        continue;
      }
    }

    // 2) Match by contentHash
    const hashMatches = (byHash.get(candidateHash) ?? []).filter((e) => !seen.has(e));
    if (hashMatches.length > 0) {
      const prev = hashMatches[0];
      const next: ManifestEntry = {
        ...prev,
        file: c.loc.file,
        namespace: c.namespace,
        tag: c.tag,
        start: c.loc.start,
        end: c.loc.end,
        lastSeen: now,
        status: prev.status === 'orphaned' ? 'extracted' : prev.status,
        contentHash: candidateHash,
      };
      seen.add(prev);
      unchanged.push(next);
      continue;
    }

    // 3) Fallback: create new entry
    const entry: ManifestEntry = {
      file: c.loc.file,
      namespace: c.namespace,
      key: candidateKey,
      tag: c.tag,
      status: 'extracted',
      contentHash: candidateHash,
      fingerprint: { descriptor: `${c.tag ?? ''}#${c.loc.start}` },
      start: c.loc.start,
      end: c.loc.end,
      lastSeen: now,
    };
    created.push(entry);
  }

  // Orphaned: entries in manifest not seen this run
  const orphaned = manifest.entries
    .filter((e) => !seen.has(e))
    .map((e) => ({ ...e, status: 'orphaned' as const }));

  const nextEntries: ManifestEntry[] = [
    ...unchanged,
    ...updated.map((u) => u.entry),
    ...created,
    ...orphaned,
  ];

  const nextManifest: Manifest = { version: manifest.version ?? 1, entries: nextEntries };
  const result: ReconcileResult = {
    created,
    updated,
    unchanged,
    orphaned,
  };
  return { result, nextManifest };
}
