import { describe, it, expect } from 'vitest';
import { writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
import { buildInjectionPlan } from '../../core/src/inject/plan';
import { applyPatches } from '../../core/src/patch/apply';
import { printUnifiedDiffs } from '../../core/src/inject/diff';
import reactNextAdapter from '../../adapter-react-next/src/index';
import type { Config } from '../../core/src/config/types';

describe('inject --dry-run integration (adapter + plan + diff)', () => {
  it('prints diffs for t declaration and import on client file', async () => {
    const tmp = resolve(os.tmpdir(), 'voko-inject-int', String(Date.now()));
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const file = resolve(tmp, 'page.tsx');
    writeFileSync(
      file,
      [
        `'use client';`,
        `import React from 'react';`,
        `export default function Page(){`,
        `  return <h1>Hello</h1>;`,
        `}`,
        ``,
      ].join('\n'),
      'utf8',
    );

    const candidates = await reactNextAdapter.extract([file], {} as unknown as Config);
    const patches = await reactNextAdapter.planRewrite(candidates, { dryRun: true });
    expect(patches.length).toBeGreaterThanOrEqual(1);

    const plan = buildInjectionPlan(patches, {
      readFile: (p) => (p === file ? readFileSync(p, 'utf8') : ''),
    });
    const res = applyPatches(plan, { contents: { [file]: readFileSync(file, 'utf8') } });
    const diffs = printUnifiedDiffs(res.files);
    expect(diffs).toContain('--- a');
    expect(diffs).toContain("import { useTranslations } from 'next-intl'");
    expect(diffs).toMatch(/\+const t = useTranslations\('/);
  });
});
