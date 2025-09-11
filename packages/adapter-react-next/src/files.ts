import { discover } from '@voko/core';

export async function listFiles(globs: string[], ignore: string[]): Promise<string[]> {
  return discover(globs, ignore);
}
