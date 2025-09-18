import path from 'node:path';

const RESERVED_APP_FILENAMES = new Set([
  'page',
  'layout',
  'template',
  'route',
  'loading',
  'error',
  'not-found',
  'default',
]);

function normalizeSlashes(p: string): string {
  return p.replace(/\\/g, '/');
}

function stripExtension(filename: string): string {
  const ext = path.extname(filename);
  return filename.slice(0, filename.length - ext.length);
}

function isDynamic(seg: string): boolean {
  // matches [slug], [...slug], [[...slug]] without regex escapes
  if (seg.startsWith('[[...') && seg.endsWith(']]')) return true;
  if (seg.startsWith('[...') && seg.endsWith(']')) return true;
  if (seg.startsWith('[') && seg.endsWith(']')) return true;
  return false;
}

function normalizeSegment(seg: string): string | null {
  // Route groups like (marketing) -> marketing
  if (/^\(.*\)$/.test(seg)) return seg.slice(1, -1);
  if (isDynamic(seg)) {
    // [slug], [...slug], [[...slug]] -> slug
    return seg.replace(/^\[+|\]+$/g, '').replace(/^\.\.\./, '');
  }
  return seg;
}

export function deriveNamespace(filePath: string): string {
  const p = normalizeSlashes(filePath);
  const parts = p.split('/');

  const appIdx = parts.indexOf('app');
  const pagesIdx = parts.indexOf('pages');

  if (appIdx !== -1) {
    const after = parts.slice(appIdx + 1);
    if (after.length === 0) return 'app';
    // Drop filename if reserved (e.g., page.tsx), use directory path
    let routeSegs = after;
    const last = stripExtension(after[after.length - 1]);
    if (RESERVED_APP_FILENAMES.has(last)) {
      routeSegs = after.slice(0, -1);
    }
    // Ignore API prefix only when it's the first segment under /app
    if (routeSegs[0] === 'api') {
      routeSegs = routeSegs.slice(1);
    }
    const normalized = routeSegs
      .map((seg) => normalizeSegment(seg))
      .filter((seg): seg is string => !!seg && seg.length > 0);
    if (normalized.length === 0) return 'app';
    return normalized.join('.');
  }

  if (pagesIdx !== -1) {
    const after = parts.slice(pagesIdx + 1);
    if (after.length === 0) return 'pages';
    const withoutExt = stripExtension(after.join('/'));
    let segs = withoutExt.split('/');
    // Drop trailing index
    if (segs[segs.length - 1] === 'index') segs = segs.slice(0, -1);
    const normalized = segs
      .map((seg) => normalizeSegment(seg))
      .filter((seg): seg is string => !!seg && seg.length > 0);
    return normalized.join('.');
  }

  // Fallback: use path without extension, joined by '.'
  const base = stripExtension(p);
  const normalized = base
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return normalized.join('.');
}
