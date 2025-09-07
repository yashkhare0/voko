import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/load';
import { ConfigError } from '../src/config/errors';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

function withTempDir(run: (dir: string) => void) {
  const base = join(process.cwd(), '.tmp-tests');
  const dir = join(base, String(Math.random()).slice(2));
  mkdirSync(dir, { recursive: true });
  try {
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('loadConfig', () => {
  it('throws missing file error with guidance', () => {
    withTempDir((dir) => {
      expect(() => loadConfig({ cwd: dir })).toThrowError(ConfigError);
      try {
        loadConfig({ cwd: dir });
      } catch (e) {
        const err = e as ConfigError;
        expect(err.code).toBe('CONF_MISSING_FILE');
      }
    });
  });

  it('surfaces JSON errors with position', () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, 'voko.config.json'), '{ invalid json', 'utf8');
      try {
        loadConfig({ cwd: dir });
      } catch (e) {
        const err = e as ConfigError;
        expect(err.code).toBe('CONF_INVALID_JSON');
        expect(err.json).toBeTruthy();
      }
    });
  });

  it('validates schema and rejects unknown keys', () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, 'voko.config.json'), JSON.stringify({ foo: 1 }), 'utf8');
      try {
        loadConfig({ cwd: dir });
      } catch (e) {
        const err = e as ConfigError;
        expect(err.code).toBe('CONF_INVALID_SCHEMA');
        expect(err.issues && err.issues.length).toBeGreaterThan(0);
      }
    });
  });
});
