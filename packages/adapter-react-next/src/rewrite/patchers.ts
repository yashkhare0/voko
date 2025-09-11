import ts from 'typescript';

export function hasTDeclaration(content: string): boolean {
  return /\bconst\s+t\s*=\s*useTranslations\s*\(/.test(content);
}

export function hasUseTranslationsImport(content: string): boolean {
  return /from\s+['"]next-intl['"]/m.test(content) && /useTranslations/.test(content);
}

export function computeTDeclarationInsertPos(sourceFile: ts.SourceFile): number {
  // Insert after last import or after top "use client" directive block
  let insertPos = 0;
  const stmts = sourceFile.statements;
  let idx = 0;
  // If first is a directive (string literal expression), skip it
  const first = stmts[0];
  if (first && ts.isExpressionStatement(first)) {
    const expr = first.expression;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      idx = 1;
      insertPos = first.end;
    }
  }
  // Advance through imports
  for (; idx < stmts.length; idx += 1) {
    const s = stmts[idx];
    if (ts.isImportDeclaration(s) || ts.isImportEqualsDeclaration(s)) {
      insertPos = s.end;
      continue;
    }
    break;
  }
  return insertPos;
}

export function buildTDeclaration(namespace: string): string {
  return `\nconst t = useTranslations('${namespace}');\n`;
}
