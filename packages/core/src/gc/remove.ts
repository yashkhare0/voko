import { readdirSync, statSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

export interface GcOptions {
  cwd?: string;
}

/**
 * Deletes files under .voko/trash older than N days based on mtime.
 * Returns list of removed files.
 */
export function gcTrash(days: number, opts: GcOptions = {}): string[] {
  const cwd = opts.cwd ?? process.cwd();
  const dir = resolve(cwd, '.voko/trash');
  const removed: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const now = Date.now();
    for (const e of entries) {
      if (!e.isFile()) continue;
      const file = resolve(dir, e.name);
      const st = statSync(file);
      const ageDays = (now - st.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays >= days) {
        rmSync(file);
        removed.push(file);
      }
    }
  } catch {
    // ignore missing directory
  }
  return removed;
}
