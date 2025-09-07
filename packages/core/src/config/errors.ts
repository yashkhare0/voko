export type ConfigErrorCode = 'CONF_MISSING_FILE' | 'CONF_INVALID_JSON' | 'CONF_INVALID_SCHEMA';

export interface JsonPosition {
  position: number;
  line: number;
  column: number;
}

export class ConfigError extends Error {
  public readonly code: ConfigErrorCode;
  public readonly cause?: unknown;
  public readonly json?: JsonPosition;
  public readonly issues?: { path: string; message: string }[];

  constructor(
    code: ConfigErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      json?: JsonPosition;
      issues?: { path: string; message: string }[];
    },
  ) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
    this.cause = options?.cause;
    this.json = options?.json;
    this.issues = options?.issues;
  }
}

export function computeJsonLineCol(content: string, position: number): JsonPosition {
  let line = 1;
  let col = 1;
  for (let i = 0; i < position && i < content.length; i += 1) {
    if (content[i] === '\n') {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { position, line, column: col };
}
