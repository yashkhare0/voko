export function hello(name: string): string {
  return `Hello, ${name}!`;
}

export * from './config/schema';
export type { Config } from './config/types';
