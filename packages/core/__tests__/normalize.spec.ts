import { describe, expect, it } from 'vitest';
import { normalizeText } from '../src/text/normalize';

describe('normalizeText', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeText('  Hello\n\tworld   ')).toBe('Hello world');
  });

  it('replaces NBSP and unicode spaces', () => {
    const nbsp = 'Hello\u00A0world';
    expect(normalizeText(nbsp)).toBe('Hello world');
  });

  it('normalizes line endings', () => {
    expect(normalizeText('a\r\nb\rc')).toBe('a b c');
  });
});
