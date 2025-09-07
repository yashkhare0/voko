import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { ConfigSchema } from './schema';
import type { Config } from './types';
import { ConfigError, computeJsonLineCol } from './errors';

export interface LoadConfigOptions {
  cwd?: string;
  path?: string; // overrides cwd
}

export function loadConfig(options: LoadConfigOptions = {}): Config {
  const configPath = options.path ?? resolve(options.cwd ?? process.cwd(), 'voko.config.json');

  if (!existsSync(configPath)) {
    throw new ConfigError(
      'CONF_MISSING_FILE',
      `Missing voko.config.json at ${configPath}. Run "voko init" to scaffold one.`,
    );
  }

  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new ConfigError('CONF_MISSING_FILE', `Unable to read ${configPath}`, { cause: err });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // try to extract position from message pattern like "at position 123"
    const match = message.match(/position\s+(\d+)/i);
    const pos = match ? Number(match[1]) : 0;
    const loc = computeJsonLineCol(raw, Number.isFinite(pos) ? pos : 0);
    throw new ConfigError('CONF_INVALID_JSON', `Invalid JSON in ${configPath}`, {
      cause: err,
      json: loc,
    });
  }

  try {
    return ConfigSchema.parse(json) as Config;
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      throw new ConfigError('CONF_INVALID_SCHEMA', `Invalid config schema in ${configPath}`, {
        cause: err,
        issues,
      });
    }
    throw new ConfigError('CONF_INVALID_SCHEMA', `Invalid config schema in ${configPath}`, {
      cause: err,
    });
  }
}
