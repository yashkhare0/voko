export function hello(name: string): string {
  return `Hello, ${name}!`;
}

export * from './config/schema';
export type { Config } from './config/types';
export { loadConfig } from './config/load';
export { ConfigError } from './config/errors';
