import ts from 'typescript';
import { normalizeText, type CandidateIR, type InlineTag } from '@voko/core';
import { isJsxElement, getTagName, hasInlineChildren, collectRichHtml } from './common';

export function extractRich(
  filePath: string,
  sourceFile: ts.SourceFile,
  namespace: string,
  frameworkId: string,
): CandidateIR[] {
  const results: CandidateIR[] = [];

  function visit(node: ts.Node): void {
    if (isJsxElement(node)) {
      if (hasInlineChildren(node)) {
        const rich = collectRichHtml(node.children);
        if (rich) {
          const tag = getTagName(node);
          const text = normalizeText(rich.html);
          const inlineTags: InlineTag[] = rich.inlineTags;
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const id = `${namespace}:${frameworkId}:${filePath}:${start}:${end}`;
          if (tag && (text || inlineTags.length > 0)) {
            results.push({
              id,
              namespace,
              kind: 'rich',
              tag,
              text,
              inlineTags,
              loc: { file: filePath, start, end },
              framework: frameworkId,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}
