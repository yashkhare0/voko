export function parseAge(input: string): number | null {
  const m = /^([0-9]+)\s*([dw])$/.exec(input.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = m[2];
  const days = unit === 'w' ? n * 7 : n;
  return days;
}
