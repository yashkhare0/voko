import { readFileSync, writeFileSync } from 'node:fs';
import type {
  Patch,
  ApplyOptions,
  ApplyResult,
  ApplyFileResult,
  ApplyConflict,
  ImportSpec,
} from './types';

function mergeImports(imports: ImportSpec[] | undefined): ImportSpec[] {
  if (!imports || imports.length === 0) return [];
  const seen = new Set<string>();
  const result: ImportSpec[] = [];
  for (const imp of imports) {
    const key = `${imp.from}::${imp.code}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(imp);
    }
  }
  return result;
}

function applyEditsBackToFront(
  content: string,
  edits: { start: number; end: number; replacement: string }[],
): string {
  let result = content;
  // sort by start descending to avoid shifting subsequent ranges
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  for (const e of sorted) {
    result = result.slice(0, e.start) + e.replacement + result.slice(e.end);
  }
  return result;
}

export function applyPatches(patches: Patch[], opts: ApplyOptions = {}): ApplyResult {
  const byFile = new Map<string, Patch[]>();
  for (const p of patches) {
    byFile.set(p.file, [...(byFile.get(p.file) ?? []), p]);
  }

  const conflicts: ApplyConflict[] = [];
  const files: ApplyFileResult[] = [];

  for (const [file, group] of byFile) {
    const original = opts.contents?.[file] ?? readFileSync(file, 'utf8');
    const allEdits = group.flatMap((g) => g.edits);

    // conflict detection: any overlapping ranges
    const sortedAsc = [...allEdits].sort((a, b) => a.start - b.start);
    const localConflicts: { start: number; end: number }[] = [];
    for (let i = 1; i < sortedAsc.length; i += 1) {
      const prev = sortedAsc[i - 1];
      const curr = sortedAsc[i];
      if (curr.start < prev.end) {
        localConflicts.push({ start: curr.start, end: prev.end });
      }
    }

    if (localConflicts.length > 0) {
      conflicts.push({ file, ranges: localConflicts });
      continue;
    }

    const mergedImports = mergeImports(group.flatMap((g) => g.imports ?? []));

    const newContent = applyEditsBackToFront(original, allEdits);

    const wrote = opts.write === true && newContent !== original;
    if (wrote) {
      writeFileSync(file, newContent, 'utf8');
    }

    files.push({ file, oldContent: original, newContent, wrote, mergedImports });
  }

  return { files, conflicts };
}
