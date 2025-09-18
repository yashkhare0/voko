import type { ReconcileResult } from '../manifest/types';

export interface CheckResult {
  violations: string[];
}

/**
 * Returns violations if there are any created candidates (raw strings) or
 * base locale keys missing after extract (not enforced yet here).
 */
export function runCheck(reconcile: ReconcileResult): CheckResult {
  const violations: string[] = [];
  if (reconcile.created.length > 0) {
    violations.push(`created:${reconcile.created.length}`);
  }
  // Placeholder for missing base locale keys check (requires locale read)
  return { violations };
}
