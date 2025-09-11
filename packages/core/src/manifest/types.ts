export type ManifestStatus = 'extracted' | 'rewritten' | 'ignored' | 'orphaned';

export interface ManifestFingerprint {
  /** Concise descriptor combining tag, sibling index, ancestor hints, and a short text sample */
  descriptor: string;
}

export interface ManifestEntry {
  /** Source file path at time of scan */
  file: string;
  /** Derived namespace (e.g., marketing.about) */
  namespace: string;
  /** Structural key path or null if not yet assigned */
  key: string | null;
  /** Optional originating tag (h1, p, Button, etc.) */
  tag?: string;
  /** Current lifecycle status */
  status: ManifestStatus;
  /** Hash of normalized text content (xxh64) */
  contentHash: string;
  /** Resilient locator for fuzzy matching */
  fingerprint: ManifestFingerprint;
  /** Byte offsets at last run to aid diffs */
  start: number;
  end: number;
  /** ISO timestamp of last observation */
  lastSeen: string;
  /** Optional commit id from VCS for auditing */
  lastCommit?: string;
}

export interface Manifest {
  version: number;
  entries: ManifestEntry[];
}

export interface ReconcileCreated {
  type: 'created';
  entry: ManifestEntry;
}

export interface ReconcileUpdated {
  type: 'updated';
  previous: ManifestEntry;
  entry: ManifestEntry;
}

export interface ReconcileUnchanged {
  type: 'unchanged';
  entry: ManifestEntry;
}

export interface ReconcileOrphaned {
  type: 'orphaned';
  entry: ManifestEntry;
}

export interface ReconcileResult {
  created: ManifestEntry[];
  updated: { previous: ManifestEntry; entry: ManifestEntry }[];
  unchanged: ManifestEntry[];
  orphaned: ManifestEntry[];
}
