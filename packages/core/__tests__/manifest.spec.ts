import { describe, it, expect } from 'vitest';
import type { CandidateIR } from '../src/types/ir';
import { reconcileManifest } from '../src/index';

function candidate(partial: Partial<CandidateIR>): CandidateIR {
  return {
    id: partial.id ?? 'hero.title',
    namespace: partial.namespace ?? 'marketing.about',
    kind: partial.kind ?? 'block',
    tag: partial.tag ?? 'h1',
    text: partial.text ?? 'Hello',
    inlineTags: partial.inlineTags,
    hints: partial.hints,
    loc: partial.loc ?? { file: 'app/page.tsx', start: 0, end: 5 },
    framework: partial.framework ?? 'react-next',
  };
}

describe('manifest reconcile', () => {
  it('initial run creates entries; second run is unchanged', () => {
    const ir: CandidateIR[] = [
      candidate({ id: 'hero.title', text: 'Hello', hints: { key: 'hero.title' } }),
      candidate({
        id: 'hero.body.0',
        text: 'World',
        tag: 'p',
        kind: 'rich',
        hints: { key: 'hero.body.0' },
      }),
    ];

    const m0 = { version: 1, entries: [] } as const;
    const { result: r1, nextManifest: m1 } = reconcileManifest(ir, m0, {
      now: '2024-01-01T00:00:00.000Z',
    });
    expect(r1.created.length).toBe(2);
    expect(r1.updated.length).toBe(0);
    expect(r1.unchanged.length).toBe(0);
    expect(r1.orphaned.length).toBe(0);

    const { result: r2 } = reconcileManifest(ir, m1, { now: '2024-01-02T00:00:00.000Z' });
    expect(r2.created.length).toBe(0);
    expect(r2.updated.length).toBe(0);
    expect(r2.unchanged.length).toBe(2);
    expect(r2.orphaned.length).toBe(0);
  });

  it('marks removed entries as orphaned', () => {
    const ir1: CandidateIR[] = [
      candidate({ id: 'hero.title', hints: { key: 'hero.title' } }),
      candidate({ id: 'story.title', hints: { key: 'story.title' } }),
    ];
    const { nextManifest: m1 } = reconcileManifest(
      ir1,
      { version: 1, entries: [] },
      { now: '2024-01-01T00:00:00.000Z' },
    );

    const ir2: CandidateIR[] = [candidate({ id: 'hero.title', hints: { key: 'hero.title' } })];
    const { result: r2 } = reconcileManifest(ir2, m1, { now: '2024-01-02T00:00:00.000Z' });
    expect(r2.orphaned.length).toBe(1);
  });

  it('detects updated content for existing key', () => {
    const ir1: CandidateIR[] = [
      candidate({ id: 'hero.title', text: 'Hello', hints: { key: 'hero.title' } }),
    ];
    const { nextManifest: m1 } = reconcileManifest(
      ir1,
      { version: 1, entries: [] },
      { now: '2024-01-01T00:00:00.000Z' },
    );

    const ir2: CandidateIR[] = [
      candidate({ id: 'hero.title', text: 'Hello!!!', hints: { key: 'hero.title' } }),
    ];
    const { result: r2 } = reconcileManifest(ir2, m1, { now: '2024-01-02T00:00:00.000Z' });
    expect(r2.updated.length).toBe(1);
  });
});
