import { describe, it, expect } from 'vitest';
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
