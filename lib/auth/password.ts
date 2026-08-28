/**
 * Password hashing with backward compatibility.
 *
 * New passwords use BCRYPT_ROUNDS (default 12, was 10 historically).
 * verifyPassword auto-detects the cost factor from the stored hash prefix
 * ($2a$<cost>$...) and falls back to legacy rounds if a legacy hash slips
 * through. Successful verification of a legacy hash triggers a transparent
 * re-hash at the new rounds on the caller side (see rehashIfLegacy).
 *
 * Pure server-only — never import from client components.
 */

import bcrypt from 'bcryptjs';

export const DEFAULT_ROUNDS = 12;
export const LEGACY_ROUNDS = 10;

function currentRounds(): number {
  const raw = process.env.BCRYPT_ROUNDS;
  if (!raw) return DEFAULT_ROUNDS;
  const n = parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 4 || n > 15) return DEFAULT_ROUNDS;
  return n;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, currentRounds());
}

/**
 * Returns the cost factor embedded in a bcrypt hash.
 * Bcrypt format: $2a$<cost>$...
 */
export function detectRounds(hash: string): number | null {
  if (typeof hash !== 'string') return null;
  const m = /^\$2[abxy]?\$(\d{2})\$/.exec(hash);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isInteger(n) ? n : null;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * After successful verify, call this to transparently upgrade legacy hashes.
 * Returns the new hash if upgrade happened, or null if no upgrade needed.
 *
 * Usage in auth.ts authorize():
 *   if (await verifyPassword(pw, dbUser.passwordHash)) {
 *     const upgraded = await rehashIfLegacy(pw, dbUser.passwordHash);
 *     if (upgraded) await updateUserPasswordHash(dbUser.id, upgraded);
 *     ...
 *   }
 */
export async function rehashIfLegacy(
  plain: string,
  existingHash: string
): Promise<string | null> {
  const target = currentRounds();
  const existing = detectRounds(existingHash);
  if (existing === null) return null;        // not a bcrypt hash — leave alone
  if (existing >= target) return null;       // already at or above target
  return hashPassword(plain);
}