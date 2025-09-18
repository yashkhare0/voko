import * as ts from 'typescript';

export function hasTDeclaration(content: string): boolean {
  // Matches: const|let t = useTranslations<...>(...)
  return /\b(?:const|let)\s+t\s*=\s*useTranslations\s*(?:<[^>]*>)?\s*\(/m.test(content);
}
export function hasUseTranslationsImport(content: string): boolean {
  // Supports aliasing: `useTranslations as t`
  return /import\s*{\s*[^}]*\buseTranslations\b[^}]*}\s*from\s*['"]next-intl['"]/m.test(content);
}

export function computeTDeclarationInsertPos(sourceFile: ts.SourceFile): number {
  // Insert inside the first function/component body, after any directive-like prologue.
  const isDirective = (n: ts.Node) =>
    ts.isExpressionStatement(n) &&
    (ts.isStringLiteral(n.expression) || ts.isNoSubstitutionTemplateLiteral(n.expression));

  const bodyInsertPos = (block: ts.Block): number => {
    // Place insertion just after the opening '{' of the block
    let pos = block.getStart() + 1;
    let i = 0;
    while (i < block.statements.length && isDirective(block.statements[i]!)) {
      pos = block.statements[i]!.end;
      i += 1;
    }
    return pos;
  };

  for (const s of sourceFile.statements) {
    if (ts.isFunctionDeclaration(s) && s.body) {
      return bodyInsertPos(s.body);
    }
    if (ts.isVariableStatement(s)) {
      for (const d of s.declarationList.declarations) {
        if (
          ts.isIdentifier(d.name) &&
          d.initializer &&
          (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))
        ) {
          const b = d.initializer.body;
          if (ts.isBlock(b)) return bodyInsertPos(b);
        }
      }
    }
  }
  // Not found; let caller decide (e.g., skip or locate a specific component).
  return -1;
}

export function buildTDeclaration(namespace: string): string {
  // Use single quotes in the inserted code but escape the namespace properly
  const ns = `'${namespace.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return `\nconst t = useTranslations(${ns});\n`;
}
