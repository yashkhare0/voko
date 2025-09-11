import { createLogger, type Config, loadConfig } from '@voko/core';

export interface GlobalFlags {
  config?: string;
  json?: boolean;
  verbose?: boolean;
}

export function getLogger(flags: GlobalFlags) {
  return createLogger({ level: flags.verbose ? 'debug' : 'info', json: Boolean(flags.json) });
}

export function getConfig(flags: GlobalFlags): Config {
  return loadConfig(flags.config ? { path: flags.config } : {});
}
