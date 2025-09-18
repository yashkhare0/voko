import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type LocaleData = Record<string, unknown>;

export interface ReadLocaleOptions {
  cwd?: string;
}

/**
 * Read a locale JSON file. Returns an empty object if the file does not exist or is malformed.
 */
export function readLocaleJson(relativePath: string, opts: ReadLocaleOptions = {}): LocaleData {
  const cwd = opts.cwd ?? process.cwd();
  const file = resolve(cwd, relativePath);
  if (!existsSync(file)) return {};
  try {
    const raw = readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as LocaleData;
  } catch {
    return {};
  }
}
