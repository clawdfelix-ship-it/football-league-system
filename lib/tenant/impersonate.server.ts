/**
 * Impersonate tokens (server-only).
 *
 * A platform admin can mint a short-lived single-use token for a league,
 * then redirect to https://<slug>.zenex-sports.com/auth/impersonate?token=...
 * to be signed in as that league's admin without knowing their password.
 *
 * Storage: SHA-256 hash only (plaintext never persisted).
 * TTL: 30 minutes. Single use. Every mint + redeem writes an audit event.
 */

import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { impersonateTokens, leagues, platformAuditEvents } from '@/lib/schema';

export const IMPERSONATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class ImpersonateError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ImpersonateError';
    this.code = code;
  }
}

export function hashImpersonateToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export type MintResult = {
  token: string; // plaintext, return once
  expiresAt: Date;
};

/** Mint a new impersonate token for a league. Throws ImpersonateError. */
export async function mintImpersonateToken(
  leagueId: number,
  platformAdminEmail: string
): Promise<MintResult> {
  // Verify league exists
  const [league] = await db
    .select({ id: leagues.id, slug: leagues.slug })
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);

  if (!league) {
    throw new ImpersonateError('NOT_FOUND', `League ${leagueId} not found`);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashImpersonateToken(token);
  const expiresAt = new Date(Date.now() + IMPERSONATE_TTL_MS);

  await db.insert(impersonateTokens).values({
    tokenHash,
    leagueId,
    platformAdminEmail,
    expiresAt,
  });

  // Audit
  try {
    await db.insert(platformAuditEvents).values({
      actorEmail: platformAdminEmail,
      action: 'league.impersonate_mint',
      targetType: 'league',
      targetId: leagueId,
      targetLabel: league.slug,
      metadata: { expiresAt: expiresAt.toISOString() },
    });
  } catch (e) {
    console.error('[audit] impersonate mint failed:', e);
  }

  return { token, expiresAt };
}

export type RedeemResult = {
  leagueId: number;
  platformAdminEmail: string;
};

/** Redeem a token. Single-use; throws ImpersonateError on invalid/expired/used. */
export async function redeemImpersonateToken(token: string): Promise<RedeemResult> {
  const tokenHash = hashImpersonateToken(token);

  const [row] = await db
    .select({
      id: impersonateTokens.id,
      leagueId: impersonateTokens.leagueId,
      platformAdminEmail: impersonateTokens.platformAdminEmail,
      expiresAt: impersonateTokens.expiresAt,
      usedAt: impersonateTokens.usedAt,
    })
    .from(impersonateTokens)
    .where(eq(impersonateTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    throw new ImpersonateError('INVALID_TOKEN', 'Token not recognized');
  }
  if (row.usedAt) {
    throw new ImpersonateError('TOKEN_USED', 'Token has already been used');
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new ImpersonateError('TOKEN_EXPIRED', 'Token has expired');
  }

  await db
    .update(impersonateTokens)
    .set({ usedAt: new Date() })
    .where(eq(impersonateTokens.id, row.id));

  // Audit
  try {
    await db.insert(platformAuditEvents).values({
      actorEmail: row.platformAdminEmail,
      action: 'league.impersonate_redeem',
      targetType: 'league',
      targetId: row.leagueId,
    });
  } catch (e) {
    console.error('[audit] impersonate redeem failed:', e);
  }

  return { leagueId: row.leagueId, platformAdminEmail: row.platformAdminEmail };
}
