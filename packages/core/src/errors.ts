export type CoreErrorCode =
  | 'PATCH_CONFLICT'
  | 'SERVER_INJECTION_REFUSED'
  | 'LOCALE_WRITE_FAILED'
  | 'INVALID_CONFIG'
  | 'SCAN_PARSE_ERROR'
  | 'GC_INVALID_AGE';

export class CoreError extends Error {
  public readonly code: CoreErrorCode;
  public readonly cause?: unknown;

  constructor(code: CoreErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'CoreError';
    this.code = code;
    this.cause = options?.cause;
  }
}
