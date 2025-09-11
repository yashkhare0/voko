import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function writeFileStable(path: string, content: string): { wrote: boolean } {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  try {
    const prev = readFileSync(path, 'utf8');
    if (prev === content) return { wrote: false };
  } catch {
    // ignore
  }
  writeFileSync(path, content, 'utf8');
  return { wrote: true };
}
