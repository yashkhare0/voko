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

  // Validate edit ranges early to catch invalid ranges before processing
  for (const [file, group] of byFile) {
    for (const patch of group) {
      for (const edit of patch.edits) {
        const start = edit.start;
        const end = edit.end;
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          throw new Error(
            `Invalid edit range for file "${file}": start=${String(start)} end=${String(end)} (must be finite numbers)`,
          );
        }
        if (!Number.isInteger(start) || !Number.isInteger(end)) {
          throw new Error(
            `Invalid edit range for file "${file}": start=${start} end=${end} (must be integers)`,
          );
        }
        if (start < 0 || end < 0) {
          throw new Error(
            `Invalid edit range for file "${file}": start=${start} end=${end} (must be >= 0)`,
          );
        }
        if (start > end) {
          throw new Error(
            `Invalid edit range for file "${file}": start=${start} end=${end} (start must be <= end)`,
          );
        }
      }
    }
  }

  const conflicts: ApplyConflict[] = [];
  const files: ApplyFileResult[] = [];

  for (const [file, group] of byFile) {
    let original: string;
    try {
      original = opts.contents?.[file] ?? readFileSync(file, 'utf8');
    } catch (error: unknown) {
      // Handle file read errors appropriately
      conflicts.push({
        file,
        ranges: [],
        error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }
    const allEdits = group.flatMap((g) => g.edits);

    // conflict detection: any overlapping ranges
    const sortedAsc = [...allEdits].sort((a, b) => a.start - b.start);
    const localConflicts: { start: number; end: number }[] = [];
    for (let i = 1; i < sortedAsc.length; i += 1) {
      const prev = sortedAsc[i - 1];
      const curr = sortedAsc[i];
      // Treat touching ranges as conflict to be extra safe
      if (curr.start <= prev.end) {
        localConflicts.push({
          start: Math.min(prev.start, curr.start),
          end: Math.max(prev.end, curr.end),
        });
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
