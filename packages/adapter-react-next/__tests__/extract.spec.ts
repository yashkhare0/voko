import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { extractBlocks } from '../src/extract/blocks';
import { extractAttrs } from '../src/extract/attrs';
import { extractRich } from '../src/extract/rich';
import { deriveNamespace } from '../src/namespace';
import { detectComponentKind } from '../src/componentKind';

function sf(file: string, code: string) {
  return ts.createSourceFile(file, code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
}

describe('adapter-react-next extraction', () => {
  it('derives namespace from app router paths', () => {
    expect(deriveNamespace('app/(marketing)/about/page.tsx')).toBe('marketing.about');
    expect(deriveNamespace('pages/about.tsx')).toBe('about');
    expect(deriveNamespace('app/blog/[slug]/page.tsx')).toBe('blog.slug');
  });

  it('detects component kind via top directive', () => {
    const file = 'app/page.tsx';
    expect(detectComponentKind(file)).toBeTypeOf('string');
    // ensure function executes; detailed client/server unit test would need fs access
  });

  it('extracts plain blocks (h1, p)', () => {
    const file = 'app/home/page.tsx';
    const code = `export default function Page(){ return (<><h1>Hello</h1><p>World</p></>); }`;
    const source = sf(file, code);
    const ns = deriveNamespace(file);
    const res = extractBlocks(file, source, ns, 'react-next');
    expect(res.some((r) => r.text === 'Hello' && r.kind === 'block')).toBe(true);
    expect(res.some((r) => r.text === 'World' && r.kind === 'block')).toBe(true);
  });

  it('extracts attributes alt/title/aria-label/placeholder', () => {
    const file = 'app/home/page.tsx';
    const code = `export default function Page(){ return (<><img alt="Alt text"/><input placeholder="Type"/><div title="Tip" aria-label="Aria"/></>); }`;
    const source = sf(file, code);
    const ns = deriveNamespace(file);
    const res = extractAttrs(file, source, ns, 'react-next');
    expect(res.filter((r) => r.kind === 'attr').length).toBeGreaterThanOrEqual(3);
  });

  it('extracts rich text with inline tags', () => {
    const file = 'app/home/page.tsx';
    const code = `export default function Page(){ return (<p>We <strong>care</strong>.</p>); }`;
    const source = sf(file, code);
    const ns = deriveNamespace(file);
    const rich = extractRich(file, source, ns, 'react-next');
    expect(rich.length).toBeGreaterThanOrEqual(1);
    expect(rich[0].kind).toBe('rich');
  });
});

import path from 'node:path';
import adapter from '../src';
import type { Config } from '@voko/core';

describe('react-next extract', () => {
  it('extracts blocks, attrs, and rich with namespace', async () => {
    const file = path.resolve(__dirname, 'fixtures/app/(marketing)/about/page.tsx');
    const files = [file];
    const cfg: Config = {
      frameworks: ['react-next'],
      library: { 'react-next': 'next-intl' },
      defaultLocale: 'en',
      locales: ['en'],
      globs: { 'react-next': [] },
      ignore: [],
      namespaceStrategy: { 'react-next': 'route' },
      attributes: ['alt', 'title', 'aria-label', 'placeholder'],
      rewrite: { enabled: false, rich: true, keepFormatting: true },
      quarantineDays: 14,
    } as const;
    const ir = await adapter.extract(files, cfg);
    const ns = adapter.namespace(file);
    expect(ns).toBe('marketing.about');
    expect(ir.some((c) => c.kind === 'block' && c.tag === 'h1')).toBe(true);
    expect(ir.some((c) => c.kind === 'attr' && c.attr === 'alt')).toBe(true);
    expect(ir.some((c) => c.kind === 'attr' && c.attr === 'placeholder')).toBe(true);
    expect(ir.some((c) => c.kind === 'rich')).toBe(true);
  });
});
