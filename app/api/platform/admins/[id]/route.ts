import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import { platformAdmins, platformAuditEvents } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** DELETE: remove a DB-backed platform admin. Cannot remove env-based admins. */
export async function DELETE(request: NextRequest, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId) || rowId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid admin id');
  }

  try {
    const [existing] = await db
      .select({ id: platformAdmins.id, email: platformAdmins.email })
      .from(platformAdmins)
      .where(eq(platformAdmins.id, rowId))
      .limit(1);

    if (!existing) return fail(404, 'NOT_FOUND', 'Admin not found');

    // Safety: refuse to remove yourself
    if (existing.email.toLowerCase() === admin.email) {
      return fail(400, 'CANNOT_REMOVE_SELF', '不能移除自己');
    }

    await db.delete(platformAdmins).where(eq(platformAdmins.id, rowId));

    // Audit
    try {
      await db.insert(platformAuditEvents).values({
        actorEmail: admin.email,
        actorUserId: admin.userId,
        action: 'platform.remove_admin',
        targetType: 'platform',
        targetId: rowId,
        targetLabel: existing.email,
        metadata: { removedEmail: existing.email },
      });
    } catch (auditErr) {
      console.error('[audit] platform.remove_admin failed:', auditErr);
    }

    return ok({ removed: existing.email });
  } catch (e) {
    console.error('[platform] remove admin failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to remove admin');
  }
}
