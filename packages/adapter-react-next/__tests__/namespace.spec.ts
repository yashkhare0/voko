import { describe, it, expect } from 'vitest';
import path from 'node:path';
import adapter from '../src';

describe('namespace mapping', () => {
  it('app router with group', () => {
    const file = path.resolve(__dirname, 'fixtures/app/(marketing)/about/page.tsx');
    expect(adapter.namespace(file)).toBe('marketing.about');
  });

  it('app router dynamic segment', () => {
    const file = path.resolve(__dirname, 'fixtures/app/blog/[slug]/page.tsx');
    expect(adapter.namespace(file)).toBe('blog.slug');
  });

  it('pages router basic route', () => {
    const file = path.resolve(__dirname, 'fixtures/pages/about.tsx');
    expect(adapter.namespace(file)).toBe('about');
  });
});
