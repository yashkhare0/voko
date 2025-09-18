import { describe, it, expect } from 'vitest';
import { printUnifiedDiffs } from '../../core/src/inject/diff';

describe('inject diff printer', () => {
  it('prints a simple unified diff for a changed file', () => {
    const files = [
      {
        file: 'app/page.tsx',
        oldContent: '<h1>Hello</h1>\n',
        newContent: "<h1>{t('hero.title')}</h1>\n",
        wrote: false,
        mergedImports: [],
      },
    ];
    const diffs = printUnifiedDiffs(files);
    expect(diffs).toContain('--- a/app/page.tsx');
    expect(diffs).toContain('+++ b/app/page.tsx');
    expect(diffs).toContain('-<h1>Hello</h1>');
    expect(diffs).toContain("+<h1>{t('hero.title')}</h1>");
  });
});
