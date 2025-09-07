export function hello(name: string): string {
  return `Hello, ${name}!`;
}

export * from './config/schema';
export type { Config } from './config/types';
export { loadConfig } from './config/load';
export { ConfigError } from './config/errors';
export * from './types/ir';
export * from './patch/types';
export { applyPatches } from './patch/apply';
export { normalizeText } from './text/normalize';
export { hash64 } from './hash/index';
