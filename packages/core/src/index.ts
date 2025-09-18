export function hello(name: string): string {
  return `Hello, ${name}!`;
}

export * from './config/schema';
export type { Config } from './config/types';
export { loadConfig } from './config/load';
export { ConfigError } from './config/errors';
export * from './types/ir';
export * from './patch/types';
export { applyPatches } from './patch/apply';
export { normalizeText } from './text/normalize';
export { hash64 } from './hash/index';
export type {
  Manifest,
  ManifestEntry,
  ManifestStatus,
  ManifestFingerprint,
  ReconcileResult,
} from './manifest/types';
export { readManifest } from './manifest/read';
export { writeManifest } from './manifest/write';
export { reconcile as reconcileManifest } from './manifest/reconcile';
export { writeScanReport } from './report/write';
export { createLogger } from './log/index';
export { CoreError } from './errors';
export { discover } from './fs/glob';
export { writeFileStable } from './fs/write';
export type { FrameworkAdapter } from './types/adapter';
export { readLocaleJson } from './locale/read';
export { writeLocaleJson } from './locale/write';
export { mergeLocales } from './locale/merge';
export { printUnifiedDiff, printUnifiedDiffs } from './inject/diff';
export { computeSync } from './sync/compute';
export { moveOrphansToTrash } from './sync/quarantine';
export { parseAge } from './gc/age';
export { gcTrash } from './gc/remove';
export { runCheck } from './check/index';
export { buildInjectionPlan } from './inject/plan';
