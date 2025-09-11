import ts from 'typescript';
import type { InlineTag } from '@voko/core';

export const INLINE_TAGS: InlineTag[] = ['strong', 'b', 'em', 'i', 'u', 'code', 'a', 'span'];
export const INLINE_TAG_SET = new Set<string>(INLINE_TAGS);

export function isJsxElement(node: ts.Node): node is ts.JsxElement {
  return node.kind === ts.SyntaxKind.JsxElement;
}

export function isJsxSelfClosingElement(node: ts.Node): node is ts.JsxSelfClosingElement {
  return node.kind === ts.SyntaxKind.JsxSelfClosingElement;
}

export function getTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
  const el = isJsxElement(node) ? node.openingElement : node;
  const name = el.tagName.getText();
  return name;
}

export function hasInlineChildren(el: ts.JsxElement): boolean {
  for (const child of el.children) {
    if (ts.isJsxElement(child)) {
      const tag = child.openingElement.tagName.getText();
      if (INLINE_TAG_SET.has(tag)) return true;
    }
  }
  return false;
}

export function collectBlockText(children: ts.NodeArray<ts.JsxChild>): string | null {
  let buf = '';
  for (const child of children) {
    if (ts.isJsxText(child)) {
      buf += child.getText();
      continue;
    }
    // Disallow expressions and nested elements for plain blocks
    if (ts.isJsxExpression(child) || ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      return null;
    }
  }
  const trimmed = buf.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function collectRichHtml(
  children: ts.NodeArray<ts.JsxChild>,
): { html: string; inlineTags: InlineTag[] } | null {
  let html = '';
  const seenOrder: InlineTag[] = [];

  function appendChild(c: ts.JsxChild): boolean {
    if (ts.isJsxText(c)) {
      html += c.getText();
      return true;
    }
    if (ts.isJsxElement(c)) {
      const tag = c.openingElement.tagName.getText();
      if (!INLINE_TAG_SET.has(tag)) return false;
      const asInline = tag as InlineTag;
      if (!seenOrder.includes(asInline)) seenOrder.push(asInline);
      html += `<${tag}>`;
      for (const inner of c.children) {
        if (!appendChild(inner)) return false;
      }
      html += `</${tag}>`;
      return true;
    }
    if (ts.isJsxSelfClosingElement(c)) {
      const tag = c.tagName.getText();
      if (!INLINE_TAG_SET.has(tag)) return false;
      const asInline = tag as InlineTag;
      if (!seenOrder.includes(asInline)) seenOrder.push(asInline);
      html += `<${tag} />`;
      return true;
    }
    // Expressions or other nodes not supported for rich extraction
    return false;
  }

  for (const child of children) {
    const ok = appendChild(child);
    if (!ok) return null;
  }

  const trimmed = html.trim();
  if (trimmed.length === 0) return null;
  return { html: trimmed, inlineTags: seenOrder };
}
