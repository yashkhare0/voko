import ts from 'typescript';
import { normalizeText, type CandidateIR } from '@voko/core';
import { isJsxElement, collectBlockText, getTagName } from './common';
import { isShadcnTextComponent } from '../shadcn-map';

const BLOCK_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'li',
  'label',
  'legend',
  'figcaption',
  'th',
  'td',
]);

export function extractBlocks(
  filePath: string,
  sourceFile: ts.SourceFile,
  namespace: string,
  frameworkId: string,
): CandidateIR[] {
  const results: CandidateIR[] = [];

  function visit(node: ts.Node): void {
    if (isJsxElement(node)) {
      const tag = getTagName(node);
      if (BLOCK_TAGS.has(tag) || isShadcnTextComponent(tag)) {
        const rawText = collectBlockText(node.children);
        const text = rawText ? normalizeText(rawText) : '';
        if (text) {
          results.push({
            id: '',
            namespace,
            kind: 'block',
            tag,
            text,
            loc: { file: filePath, start: node.getStart(), end: node.getEnd() },
            framework: frameworkId,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}
