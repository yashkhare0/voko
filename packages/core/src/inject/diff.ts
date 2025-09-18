import type { ApplyFileResult } from '../patch/types';

function splitLines(s: string): string[] {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

/**
 * Very simple unified diff generator for display in --dry-run.
 * If content changed, outputs a pseudo-unified diff block per file.
 */
export function printUnifiedDiff(fileResult: ApplyFileResult): string | null {
  if (fileResult.oldContent === fileResult.newContent) return null;
  const oldLines = splitLines(fileResult.oldContent);
  const newLines = splitLines(fileResult.newContent);
  const header = `--- a/${fileResult.file}\n+++ b/${fileResult.file}`;
  const body: string[] = [];
  // Naive line compare: mark all old as removed and all new as added when different length/content
  // This is sufficient for previewing changes at MVP; can be improved later.
  for (const line of oldLines) body.push(`-${line}`);
  for (const line of newLines) body.push(`+${line}`);
  return [header, ...body].join('\n') + '\n';
}

export function printUnifiedDiffs(results: ApplyFileResult[]): string {
  const chunks: string[] = [];
  for (const r of results) {
    const d = printUnifiedDiff(r);
    if (d) chunks.push(d);
  }
  return chunks.join('\n');
}
