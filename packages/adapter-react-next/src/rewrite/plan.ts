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
    if (pos >= 0) {
      edits.push({ start: pos, end: pos, replacement: buildTDeclaration(ns) });
    }
  }

  // Build replacements for candidates
  // NOTE: We rely on extractors to provide accurate loc ranges for the node/attr.
  for (const c of candidates) {
    const key = c.hints?.key;
    if (!key) continue;
    if (c.kind === 'block') {
      // Replace the entire element content with a t('key') expression
      // Approximation: wrap in braces within the same tag by replacing inner range
      const start = c.loc.start;
      const end = c.loc.end;
      const replacement = `/* voko */ {t('${key}')}`;
      edits.push({ start, end, replacement });
    } else if (c.kind === 'attr' && c.attr) {
      // Replace attribute initializer to use t('key')
      const start = c.loc.start;
      const end = c.loc.end;
      const attrName = c.attr;
      const replacement = `${attrName}={t('${key}')}`;
      edits.push({ start, end, replacement });
    } else if (c.kind === 'rich') {
      const start = c.loc.start;
      const end = c.loc.end;
      // Build placeholder map from observed inline tags in order
      const placeholders = (c.inlineTags ?? []).map((tag) => `${tag}: (c) => <${tag}>{c}</${tag}>`);
      const map = placeholders.length > 0 ? `, { ${placeholders.join(', ')} }` : '';
      const replacement = `{t.rich('${key}'${map})}`;
      edits.push({ start, end, replacement });
    }
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
