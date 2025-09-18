import type { Manifest, ManifestEntry, ReconcileResult } from '../manifest/types';

export interface SyncComputeResult {
  nextManifest: Manifest;
}

export function computeSync(manifest: Manifest, reconcile: ReconcileResult): SyncComputeResult {
  const seen = new Set<ManifestEntry>();
  for (const e of reconcile.created) seen.add(e);
  for (const e of reconcile.unchanged) seen.add(e);
  for (const e of reconcile.updated.map((u) => u.entry)) seen.add(e);

  const orphaned = manifest.entries
    .filter((e) => !seen.has(e))
    .map((e) => ({ ...e, status: 'orphaned' as const }));

  const nextManifest: Manifest = {
    version: manifest.version ?? 1,
    entries: [
      ...reconcile.created,
      ...reconcile.unchanged,
      ...reconcile.updated.map((u) => u.entry),
      ...orphaned,
    ],
  };
  return { nextManifest };
}
