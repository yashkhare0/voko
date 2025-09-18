import { describe, it, expect } from 'vitest';
import { buildInjectionPlan } from '../src/inject/plan';
import type { Patch } from '../src/patch/types';

describe('buildInjectionPlan', () => {
  it('dedupes imports and inserts at correct position after imports and directive', () => {
    const content = [
      `'use client';`,
      `import React from 'react';`,
      `import { Something } from 'lib';`,
      `export default function Page() { return <h1/> }`,
    ].join('\n');
    const patches: Patch[] = [
      {
        file: 'a.tsx',
        imports: [
          { from: 'next-intl', code: "import { useTranslations } from 'next-intl'" },
          { from: 'next-intl', code: "import { useTranslations } from 'next-intl'" },
        ],
        edits: [],
      },
    ];
    const plan = buildInjectionPlan(patches, { readFile: () => content });
    expect(plan).toHaveLength(1);
    const p = plan[0];
    // Should insert import after the two existing imports and the directive
    // Replacement block should include import line + newline
    const insertEdit = p.edits.find((e) => e.start === e.end);
    expect(insertEdit?.replacement).toContain("import { useTranslations } from 'next-intl'\n");
    // Edits sorted deterministically
    const sorted = [...p.edits].sort((a, b) => a.start - b.start);
    expect(p.edits).toEqual(sorted);
  });

  it('does not duplicate import if code already present', () => {
    const content = [
      `import { useTranslations } from 'next-intl'`,
      `export default function Page() { return <h1/> }`,
    ].join('\n');
    const patches: Patch[] = [
      {
        file: 'b.tsx',
        imports: [{ from: 'next-intl', code: "import { useTranslations } from 'next-intl'" }],
        edits: [],
      },
    ];
    const plan = buildInjectionPlan(patches, { readFile: () => content });
    expect(plan[0].edits.find((e) => e.start === e.end)).toBeUndefined();
  });

  it('groups multiple patches by file and preserves file order', () => {
    const patches: Patch[] = [
      { file: 'b.ts', edits: [{ start: 10, end: 12, replacement: 'X' }] },
      { file: 'a.ts', edits: [{ start: 1, end: 2, replacement: 'Y' }] },
    ];
    const plan = buildInjectionPlan(patches, { readFile: () => '' });
    expect(plan.map((p) => p.file)).toEqual(['a.ts', 'b.ts']);
  });
});
