import { promises as fs } from 'node:fs';
import path from 'node:path';

const NEXT_CONFIG_FILES = [
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'next.config.cjs',
];

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function detectReactNextProject(projectRoot?: string): Promise<boolean> {
  const root = projectRoot ?? process.cwd();

  // 1) next.config.* present
  const configPresence = await Promise.all(
    NEXT_CONFIG_FILES.map((cfg) => pathExists(path.join(root, cfg))),
  );
  if (configPresence.some(Boolean)) return true;

  // 2) app/ or pages/ directories
  const hasAppDir = await pathExists(path.join(root, 'app'));
  const hasPagesDir = await pathExists(path.join(root, 'pages'));
  if (hasAppDir || hasPagesDir) return true;

  // 3) package.json dependency on next
  try {
    const pkgJsonPath = path.join(root, 'package.json');
    const content = await fs.readFile(pkgJsonPath, 'utf8');
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
    };
    if (typeof deps['next'] === 'string') return true;
  } catch {
    // ignore
  }

  return false;
}
