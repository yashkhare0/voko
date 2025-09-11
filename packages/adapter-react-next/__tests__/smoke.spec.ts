import { describe, it, expect } from 'vitest';
import adapter from '../src';

describe('react-next adapter entry', () => {
  it('exposes required methods and id', () => {
    expect(adapter.id).toBe('react-next');
    expect(typeof adapter.detect).toBe('function');
    expect(typeof adapter.files).toBe('function');
    expect(typeof adapter.namespace).toBe('function');
    expect(typeof adapter.componentKind).toBe('function');
    expect(typeof adapter.bindings).toBe('function');
    expect(typeof adapter.extract).toBe('function');
    expect(typeof adapter.planRewrite).toBe('function');
  });
});
