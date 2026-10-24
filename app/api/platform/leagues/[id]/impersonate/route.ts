import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { mintImpersonateToken, ImpersonateError } from '@/lib/tenant/impersonate.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * Platform console: mint an impersonate token for a league.
 * Returns the plaintext token once — caller should immediately redirect
 * the admin to https://<slug>.zenex-sports.com/auth/impersonate?token=...
 */
export async function POST(_request: Request, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const leagueId = Number(id);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid league id');
  }

  try {
    const result = await mintImpersonateToken(leagueId, admin.email);
    return ok({
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof ImpersonateError) {
      return fail(e.code === 'NOT_FOUND' ? 404 : 400, e.code, e.message);
    }
    console.error('[platform] impersonate mint failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to mint impersonate token');
  }
}
