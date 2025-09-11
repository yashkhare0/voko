import ts from 'typescript';
import { readFileSync } from 'node:fs';
import type { CandidateIR, Patch } from '@voko/core';
import { detectComponentKind } from '../componentKind';
import { getBindings } from '../bindings';
import {
  buildTDeclaration,
  computeTDeclarationInsertPos,
  hasTDeclaration,
  hasUseTranslationsImport,
} from './patchers';

export function planRewriteForFile(filePath: string, candidates: CandidateIR[]): Patch | null {
  const kind = detectComponentKind(filePath);
  if (kind !== 'client') return null;
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const sf = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2020,
    true,
    ts.ScriptKind.TSX,
  );
  const ns = candidates[0]?.namespace ?? '';

  const imports = [] as NonNullable<Patch['imports']>;
  const edits: NonNullable<Patch['edits']> = [];

  const bindings = getBindings();
  // Add import if missing
  if (!hasUseTranslationsImport(content)) {
    for (const imp of bindings.imports('client')) {
      imports.push(imp);
    }
  }

  // Add t declaration if missing
  if (!hasTDeclaration(content) && ns) {
    const pos = computeTDeclarationInsertPos(sf);
    edits.push({ start: pos, end: pos, replacement: buildTDeclaration(ns) });
  }

  if (imports.length === 0 && edits.length === 0) return null;
  return { file: filePath, imports, edits };
}

export function planRewrite(candidates: CandidateIR[]): Patch[] {
  const byFile = new Map<string, CandidateIR[]>();
  for (const c of candidates) {
    byFile.set(c.loc.file, [...(byFile.get(c.loc.file) ?? []), c]);
  }
  const patches: Patch[] = [];
  for (const [file, list] of byFile) {
    const p = planRewriteForFile(file, list);
    if (p) patches.push(p);
  }
  return patches;
}
