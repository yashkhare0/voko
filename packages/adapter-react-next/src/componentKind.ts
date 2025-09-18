import { readFileSync } from 'node:fs';
import ts from 'typescript';

function getTopStringDirective(sourceFile: ts.SourceFile): string | null {
  const first = sourceFile.statements[0];
  if (!first || !ts.isExpressionStatement(first)) return null;
  const expr = first.expression;
  if (ts.isStringLiteral(expr)) {
    return expr.text;
  }
  return null;
}

export function detectComponentKind(filePath: string): 'client' | 'server' | 'unknown' {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return 'unknown';
  }

  try {
    const sf = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.TSX,
    );
    const directive = getTopStringDirective(sf);
    if (directive === 'use client') return 'client';
    if (directive === 'use server') return 'server';
    return 'server';
  } catch {
    return 'unknown';
  }
}
