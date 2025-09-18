import ts from 'typescript';
import type { CandidateIR } from '@voko/core';

const ATTRS = new Set(['alt', 'title', 'aria-label', 'placeholder']);

function getAttrText(attr: ts.JsxAttribute): string | null {
  const init = attr.initializer;
  if (!init) return null;
  // <div title="foo" />
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    const t = init.text.trim();
    return t.length ? t : null;
  }
  // <div title={'foo'} /> or <div title={`foo`}/>
  if (ts.isJsxExpression(init) && init.expression) {
    const expr = init.expression;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      const t = expr.text.trim();
      return t.length ? t : null;
    }
  }
  return null;
}

export function extractAttrs(
  filePath: string,
  sourceFile: ts.SourceFile,
  namespace: string,
  frameworkId: string,
): CandidateIR[] {
  const results: CandidateIR[] = [];

  function visit(node: ts.Node): void {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue;
        const name = attr.name.getText();
        if (ATTRS.has(name)) {
          const text = getAttrText(attr);
          if (!text) continue;
          results.push({
            id: '',
            namespace,
            kind: 'attr',
            tag: (ts.isJsxOpeningElement(node) ? node.tagName : node.tagName).getText(),
            attr: name,
            text,
            loc: { file: filePath, start: attr.getStart(), end: attr.getEnd() },
            framework: frameworkId,
          });
        }
      }
      // Special-case: <option value="...">text</option>
      if (ts.isJsxOpeningElement(node) && node.tagName.getText() === 'option') {
        const parent = node.parent;
        if (ts.isJsxElement(parent)) {
          for (const child of parent.children) {
            if (ts.isJsxText(child)) {
              const text = child.getText().trim();
              if (text.length > 0) {
                results.push({
                  id: '',
                  namespace,
                  kind: 'attr',
                  tag: 'option',
                  attr: 'value',
                  text,
                  loc: { file: filePath, start: child.getStart(), end: child.getEnd() },
                  framework: frameworkId,
                });
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}
