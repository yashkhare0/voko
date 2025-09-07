import { describe, expect, it } from 'vitest';
import { hash64 } from '../src/hash';

describe('hash64', () => {
  it('produces same output for same input', () => {
    const a = hash64('hello world');
    const b = hash64('hello world');
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it('produces different outputs for different inputs', () => {
    const a = hash64('foo');
    const b = hash64('bar');
    expect(a).not.toBe(b);
  });
});
