import { describe, it, expect } from 'vitest';
import { writeScanReport } from '../src/index';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

describe('writeScanReport', () => {
  const tmp = resolve(process.cwd(), '.tmp-tests-reports');

  it('writes file with stable timestamped name and schema', () => {
    rmSync(tmp, { recursive: true, force: true });
    const path = writeScanReport(
      {
        summary: { created: 1, updated: 2, orphaned: 3, skipped: 4 },
        byNamespace: {
          'marketing.about': { created: 1, updated: 2, orphaned: 0, skipped: 0 },
        },
        notes: ['server component at app/page.tsx: extraction only'],
      },
      { cwd: tmp, now: '2024-01-01T12:34:00.000Z' },
    );
    expect(path.endsWith('voko-scan-20240101-1234.json')).toBe(true);
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, 'utf8');
    const json = JSON.parse(text);
    expect(json.summary.created).toBe(1);
    expect(json.byNamespace['marketing.about'].updated).toBe(2);
    expect(text.endsWith('\n')).toBe(true);
  });
});
