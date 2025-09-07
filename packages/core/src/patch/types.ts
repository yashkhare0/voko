export interface ImportSpec {
  from: string;
  code: string;
}

export interface Edit {
  start: number;
  end: number;
  replacement: string;
}

export interface Patch {
  file: string;
  edits: Edit[];
  imports?: ImportSpec[];
  meta?: Record<string, unknown>;
}

export interface ApplyFileResult {
  file: string;
  oldContent: string;
  newContent: string;
  wrote: boolean;
  mergedImports: ImportSpec[];
}

export interface ConflictRange {
  start: number;
  end: number;
}

export interface ApplyConflict {
  file: string;
  ranges: ConflictRange[];
}

export interface ApplyResult {
  files: ApplyFileResult[];
  conflicts: ApplyConflict[];
}

export interface ApplyOptions {
  /**
   * When true, writes files to disk using Node fs. When false (default), returns newContent in-memory only.
   */
  write?: boolean;
  /**
   * Optional preloaded contents to avoid fs access in tests/callers.
   */
  contents?: Record<string, string>;
}
