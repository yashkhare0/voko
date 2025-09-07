import { describe, expect, it } from 'vitest';
import type { CandidateIR, NodeKind, InlineTag, SourceLoc } from '../src/types/ir';

describe('IR types', () => {
  it('allows constructing a CandidateIR object shape', () => {
    const loc: SourceLoc = { file: 'app/page.tsx', start: 10, end: 20 };
    const kind: NodeKind = 'block';
    const inline: InlineTag[] = ['strong', 'em'];
    const ir: CandidateIR = {
      id: 'abc',
      namespace: 'marketing.about',
      kind,
      tag: 'h1',
      text: 'About Us',
      inlineTags: inline,
      loc,
      framework: 'react-next',
    };
    expect(ir.namespace).toBe('marketing.about');
  });
});
