import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { extractBlocks } from '../src/extract/blocks';
import { deriveNamespace } from '../src/namespace';

describe('shadcn coverage', () => {
  it('treats listed components as text containers', async () => {
    const here =
      typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
    const file = path.resolve(here, 'fixtures/components/Shadcn.tsx');
    const ns = deriveNamespace(file);
    const content = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
    const ir = extractBlocks(file, sf, ns, 'react-next');
    expect(ir.some((c) => c.tag === 'Button' && c.kind === 'block')).toBe(true);
    expect(ir.some((c) => c.tag === 'DialogTitle' && c.kind === 'block')).toBe(true);
  });
});
