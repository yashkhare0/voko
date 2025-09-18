/**
 * Normalize text for stable hashing and comparisons.
 * - Convert CRLF to LF
 * - Replace non-breaking spaces with regular spaces
 * - Collapse all whitespace runs (spaces, tabs, newlines) to a single space
 * - Trim leading/trailing whitespace
 */
export function normalizeText(input: string): string {
  // Unicode-normalize (prefer NFC for safety; consider NFKC if compatibility folding is desired)
  let s = input.normalize('NFC');
  // Normalize all line terminators to LF (CRLF, CR, NEL, LS, PS)
  s = s.replace(/\r\n?|\u0085|\u2028|\u2029/g, '\n');
  // Replace NBSP and other common unicode spaces with normal space (avoid ranges in class)
  s = s
    .replace(/\u00A0/g, ' ')
    .replace(/\u1680/g, ' ')
    .replace(/[\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A]/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/\u205F/g, ' ')
    .replace(/\u3000/g, ' ');
  // Remove zero-width/format characters (ZWS, ZWNJ, ZWJ, WJ, BOM, MVS)
  s = s.replace(/\u200B|\u200C|\u200D|\u2060|\uFEFF|\u180E/g, '');
  // Collapse all whitespace (space, tab, newline) to single space and trim
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
