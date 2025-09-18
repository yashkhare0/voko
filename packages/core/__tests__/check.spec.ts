import { describe, it, expect } from 'vitest';
import { runCheck } from '../src/check/index';

describe('check', () => {
  it('flags created items as violations', () => {
    const r = runCheck({
      created: [
        {
          file: 'x',
          namespace: 'n',
          key: 'k',
          tag: 'p',
          status: 'extracted',
          contentHash: 'h',
          fingerprint: { descriptor: 'd' },
          start: 0,
          end: 0,
          lastSeen: '2024-01-01T00:00:00.000Z',
        },
      ],
      updated: [],
      unchanged: [],
      orphaned: [],
    });
    expect(r.violations.length).toBe(1);
  });
  it('passes when no violations present', () => {
    const r = runCheck({ created: [], updated: [], unchanged: [], orphaned: [] });
    expect(r.violations.length).toBe(0);
  });
});
