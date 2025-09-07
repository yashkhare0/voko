import { describe, expect, it } from 'vitest';
import { applyPatches } from '../src/patch/apply';
import type { Patch } from '../src/patch/types';

describe('applyPatches', () => {
  it('applies edits back-to-front and merges imports', () => {
    const text = 'Hello brave new world';
    const patches: Patch[] = [
      {
        file: 'x.ts',
        edits: [
          { start: 6, end: 11, replacement: 'kind' }, // replace 'brave' with 'kind'
          { start: 16, end: 21, replacement: 'web' }, // replace 'world' with 'web'
        ],
        imports: [
          { from: 'next-intl', code: "import { useTranslations } from 'next-intl'" },
          { from: 'next-intl', code: "import { useTranslations } from 'next-intl'" },
        ],
      },
    ];
    const res = applyPatches(patches, { contents: { 'x.ts': text } });
    expect(res.conflicts.length).toBe(0);
    expect(res.files[0].newContent).toBe('Hello kind new web');
    expect(res.files[0].mergedImports.length).toBe(1);
  });

  it('detects overlapping edits as conflicts', () => {
    const text = 'abcdef';
    const patches: Patch[] = [
      { file: 'y.ts', edits: [{ start: 1, end: 4, replacement: 'XXX' }] },
      { file: 'y.ts', edits: [{ start: 3, end: 5, replacement: 'YYY' }] },
    ];
    const res = applyPatches(patches, { contents: { 'y.ts': text } });
    expect(res.conflicts.length).toBe(1);
    expect(res.files.length).toBe(0);
  });
});
