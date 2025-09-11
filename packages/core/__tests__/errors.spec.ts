import { describe, it, expect } from 'vitest';
import { CoreError } from '../src/index';

describe('CoreError', () => {
  it('carries code and message', () => {
    const err = new CoreError('PATCH_CONFLICT', 'Conflicting edits');
    expect(err.code).toBe('PATCH_CONFLICT');
    expect(err.message).toBe('Conflicting edits');
  });
});
