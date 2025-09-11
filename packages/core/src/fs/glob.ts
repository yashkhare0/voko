import fg from 'fast-glob';

export async function discover(globs: string[], ignore: string[]): Promise<string[]> {
  const files = await fg(globs, {
    ignore,
    dot: true,
    followSymbolicLinks: false,
    onlyFiles: true,
    unique: true,
  });
  return [...files].sort((a, b) => a.localeCompare(b));
}
