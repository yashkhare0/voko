import { describe, it, expect } from 'vitest';
import { writeFileStable, discover } from '../src/index';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('fs helpers', () => {
  const tmp = resolve(process.cwd(), '.tmp-tests-fs');

  it('writeFileStable writes once and skips identical content', () => {
    rmSync(tmp, { recursive: true, force: true });
    const path = resolve(tmp, 'a/b.txt');
    const res1 = writeFileStable(path, 'hello');
    const res2 = writeFileStable(path, 'hello');
    const res3 = writeFileStable(path, 'world');
    expect(res1.wrote).toBe(true);
    expect(res2.wrote).toBe(false);
    expect(res3.wrote).toBe(true);
  });

  it('discover honors ignore and returns sorted files', async () => {
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(resolve(tmp, 'x/y'), { recursive: true });
    writeFileSync(resolve(tmp, 'x/y/a.ts'), '');
    writeFileSync(resolve(tmp, 'x/y/b.ts'), '');
    writeFileSync(resolve(tmp, 'x/y/c.test.ts'), '');
    const files = await discover([`${tmp.replace(/\\/g, '/')}/**/*.ts`], ['**/*.test.ts']);
    expect(files.map((f) => f.split('/').pop())).toEqual(['a.ts', 'b.ts']);
  });
});
