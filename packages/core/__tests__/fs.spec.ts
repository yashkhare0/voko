import { describe, it, expect } from 'vitest';
import { writeFileStable, discover, writeLocaleJson, readLocaleJson } from '../src/index';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import os from 'node:os';

describe('fs helpers', () => {
  const tmp = resolve(os.tmpdir(), 'voko-tests', String(Date.now()), String(Math.random()));

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
    const dir = resolve(tmp, 'x', 'y');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.ts'), '');
    writeFileSync(join(dir, 'b.ts'), '');
    // Intentional test file to be ignored by glob ignore filter
    writeFileSync(join(dir, 'c.test.ts'), '');
    const patternBase = dir.replace(/\\/g, '/');
    const files = await discover([`${patternBase}/**/*.ts`], ['**/*.test.ts']);
    expect(files.map((f) => f.split('/').pop())).toEqual(['a.ts', 'b.ts']);
  });

  it('locale writer sorts keys and enforces trailing newline', () => {
    rmSync(tmp, { recursive: true, force: true });
    const dir = resolve(tmp, 'locales', 'en');
    mkdirSync(dir, { recursive: true });
    const fileRel = resolve(dir, 'ns.json');
    writeLocaleJson(fileRel, { b: 1, a: { y: 2, x: 1 } });
    const parsed = readLocaleJson(fileRel);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    expect(Object.keys((parsed as Record<string, unknown>).a as Record<string, unknown>)).toEqual([
      'x',
      'y',
    ]);
    const raw = readFileSync(fileRel, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
  });
});
