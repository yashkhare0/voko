import { describe, expect, it } from 'vitest';
import { ConfigSchema } from '../src/config/schema';

describe('ConfigSchema', () => {
  it('applies defaults for minimal input', () => {
    const parsed = ConfigSchema.parse({});
    expect(parsed.frameworks).toEqual(['react-next']);
    expect(parsed.library['react-next']).toBe('next-intl');
    expect(parsed.defaultLocale).toBe('en');
    expect(parsed.locales).toEqual(['en']);
    expect(parsed.globs['react-next']).toBeTruthy();
    expect(parsed.ignore.length).toBeGreaterThan(0);
    expect(parsed.namespaceStrategy['react-next']).toBe('route');
    expect(parsed.attributes).toEqual(['alt', 'title', 'aria-label', 'placeholder']);
    expect(parsed.rewrite.enabled).toBe(false);
    expect(parsed.rewrite.rich).toBe(true);
    expect(parsed.rewrite.keepFormatting).toBe(true);
    expect(parsed.quarantineDays).toBe(14);
  });

  it('rejects unknown keys', () => {
    // Cast through unknown to avoid any in test while still simulating bad input
    const bad: unknown = { foo: 1 };

    expect(() => ConfigSchema.parse(bad)).toThrowError();
  });
});
