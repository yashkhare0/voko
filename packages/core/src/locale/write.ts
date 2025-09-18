import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type LocaleData = Record<string, unknown>;

export interface WriteLocaleOptions {
  cwd?: string;
}

function sortObjectDeep(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((v) => sortObjectDeep(v));
  }
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
      out[key] = sortObjectDeep(obj[key]);
    }
    return out;
  }
  return input;
}

/**
 * Writes locale JSON with lexicographically sorted keys and trailing newline.
 * Creates parent directories as needed.
 */
export function writeLocaleJson(
  relativePath: string,
  data: LocaleData,
  opts: WriteLocaleOptions = {},
): { wrote: boolean; path: string } {
  const cwd = opts.cwd ?? process.cwd();
  const file = resolve(cwd, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  const sorted = sortObjectDeep(data) as LocaleData;
  const content = JSON.stringify(sorted, null, 2) + '\n';
  writeFileSync(file, content, 'utf8');
  return { wrote: true, path: file };
}
