import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import {
  resetUserPassword,
  PlatformUserError,
} from '@/lib/tenant/platform-users.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** Platform console: reset a user's password (platform-admin only). */
export async function POST(request: NextRequest, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid user id');
  }

  try {
    const result = await resetUserPassword(userId, {
      email: admin.email,
      userId: admin.userId,
    });
    // tempPassword is returned to the admin once; never stored in plaintext.
    return ok(result);
  } catch (e) {
    if (e instanceof PlatformUserError) {
      const status = e.code === 'NOT_FOUND' ? 404 : 400;
      return fail(status, e.code, e.message);
    }
    console.error('[platform] reset user password failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to reset password');
  }
}
