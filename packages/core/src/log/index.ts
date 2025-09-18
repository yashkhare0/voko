export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface LoggerOptions {
  level?: LogLevel;
  json?: boolean;
  sink?: (line: string) => void;
}

function levelToNum(level: LogLevel): number {
  switch (level) {
    case 'silent':
      return 100;
    case 'error':
      return 40;
    case 'warn':
      return 30;
    case 'info':
      return 20;
    case 'debug':
      return 10;
    default:
      return 20;
  }
}

export interface Logger {
  level: LogLevel;
  json: boolean;
  error: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  info: (msg: string, data?: Record<string, unknown>) => void;
  debug: (msg: string, data?: Record<string, unknown>) => void;
}

export function createLogger(opts: LoggerOptions = {}): Logger {
  let currentLevel: LogLevel = opts.level ?? 'info';
  let currentJson: boolean = opts.json ?? false;
  const write = opts.sink ?? ((line: string) => process.stdout.write(line + '\n'));

  function emit(
    kind: 'error' | 'warn' | 'info' | 'debug',
    msg: string,
    data?: Record<string, unknown>,
  ): void {
    const numeric = levelToNum(kind);
    const threshold = levelToNum(currentLevel);
    if (numeric < threshold) return;
    if (currentJson) {
      const payload = data ? { level: kind, msg, ...data } : { level: kind, msg };
      write(JSON.stringify(payload));
    } else {
      const prefix =
        kind === 'error'
          ? '[ERROR]'
          : kind === 'warn'
            ? '[WARN] '
            : kind === 'debug'
              ? '[DEBUG]'
              : '[INFO] ';
      const suffix = data ? ` ${JSON.stringify(data)}` : '';
      write(prefix + ' ' + msg + suffix);
    }
  }

  return {
    get level() {
      return currentLevel;
    },
    set level(nextLevel: LogLevel) {
      currentLevel = nextLevel;
    },
    get json() {
      return currentJson;
    },
    set json(nextJson: boolean) {
      currentJson = nextJson;
    },
    error: (m, d) => emit('error', m, d),
    warn: (m, d) => emit('warn', m, d),
    info: (m, d) => emit('info', m, d),
    debug: (m, d) => emit('debug', m, d),
  };
}
