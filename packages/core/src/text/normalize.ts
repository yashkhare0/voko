/**
 * Normalize text for stable hashing and comparisons.
 * - Convert CRLF to LF
 * - Replace non-breaking spaces with regular spaces
 * - Collapse all whitespace runs (spaces, tabs, newlines) to a single space
 * - Trim leading/trailing whitespace
 */
export function normalizeText(input: string): string {
  // Normalize line endings to LF
  let s = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Replace NBSP and other common unicode spaces with normal space
  s = s.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
  // Collapse all whitespace (space, tab, newline) to single space
  s = s.replace(/\s+/g, ' ');
  // Trim
  s = s.trim();
  return s;
}
