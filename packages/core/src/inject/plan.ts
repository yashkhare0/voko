import { readFileSync } from 'node:fs';
import type { Patch } from '../patch/types';

function findImportInsertPos(content: string): number {
  // After optional top-level directive (e.g., 'use client') and after last import
  let offset = 0;
  const lines = content.split(/\r?\n/);
  let i = 0;
  // Skip shebang if any
  if (lines[i]?.startsWith('#!')) {
    offset += lines[i].length + 1;
    i += 1;
  }
  // Skip top directive if first non-empty is string literal
  const firstNonEmpty = lines[i]?.trim();
  if (firstNonEmpty && /^['"][A-Za-z ].*['"]\s*;?$/.test(firstNonEmpty)) {
    offset += lines[i].length + 1;
    i += 1;
  }
  // Advance through contiguous import lines
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*import(\s|['"]).*/.test(line)) {
      offset += line.length + 1;
      i += 1;
      continue;
    }
    break;
  }
  return offset;
}

function mergeImports(
  imports: NonNullable<Patch['imports']> | undefined,
): NonNullable<Patch['imports']> {
  if (!imports || imports.length === 0) return [];
  const seen = new Set<string>();
  const out: NonNullable<Patch['imports']> = [];
  for (const imp of imports) {
    const key = `${imp.from}::${imp.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(imp);
  }
  return out;
}

export interface BuildPlanOptions {
  readFile?: (path: string) => string;
}

/**
 * Transform adapter patches into executable patches by inserting import edits
 * at the top of each file when needed. Ensures deterministic grouping per file.
 */
export function buildInjectionPlan(patches: Patch[], opts: BuildPlanOptions = {}): Patch[] {
  const read = opts.readFile ?? ((p: string) => readFileSync(p, 'utf8'));
  const byFile = new Map<
    string,
    { imports: NonNullable<Patch['imports']>; edits: NonNullable<Patch['edits']> }
  >();
  for (const p of patches) {
    const bucket = byFile.get(p.file) ?? { imports: [], edits: [] };
    bucket.edits.push(...(p.edits ?? []));
    bucket.imports.push(...(p.imports ?? []));
    byFile.set(p.file, bucket);
  }

  const result: Patch[] = [];
  for (const [file, group] of byFile) {
    const content = read(file);
    const mergedImps = mergeImports(group.imports);
    const edits = [...group.edits];
    if (mergedImps.length > 0) {
      const pos = findImportInsertPos(content);
      const importBlock = mergedImps
        .map((imp) => (content.includes(imp.code) ? '' : `${imp.code}\n`))
        .filter(Boolean)
        .join('');
      if (importBlock) {
        edits.push({ start: pos, end: pos, replacement: importBlock });
      }
    }
    // Deterministic order: sort edits by start ascending for presentation (apply will reverse)
    edits.sort((a, b) => a.start - b.start);
    result.push({ file, edits, imports: mergedImps });
  }
  // Stable order by file path
  result.sort((a, b) => a.file.localeCompare(b.file));
  return result;
}
