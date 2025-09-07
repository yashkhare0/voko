import { createHash } from 'node:crypto';

/**
 * Stable 64-bit hash (hex) of input string.
 * We use SHA-256 and take the first 8 bytes for portability; can be swapped to xxhash later.
 */
export function hash64(input: string): string {
  const h = createHash('sha256').update(input, 'utf8').digest('hex');
  // first 16 hex chars = 8 bytes (64-bit)
  return h.slice(0, 16);
}
