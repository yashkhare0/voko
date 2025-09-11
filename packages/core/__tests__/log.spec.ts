import { describe, it, expect } from 'vitest';
import { createLogger } from '../src/index';

describe('logger', () => {
  it('gates messages by level', () => {
    const lines: string[] = [];
    const log = createLogger({ level: 'warn', sink: (l) => lines.push(l) });
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d', { code: 123 });
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('[WARN]');
    expect(lines[1]).toContain('[ERROR]');
  });

  it('emits JSON when json=true', () => {
    const lines: string[] = [];
    const log = createLogger({ level: 'debug', json: true, sink: (l) => lines.push(l) });
    log.info('hello', { extra: 'x' });
    const obj = JSON.parse(lines[0]);
    expect(obj.level).toBe('info');
    expect(obj.msg).toBe('hello');
    expect(obj.extra).toBe('x');
  });
});
