import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import { platformAdmins, platformAuditEvents } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zodDetails } from '@/lib/api/zod';

export const dynamic = 'force-dynamic';

const AddSchema = z.object({
  email: z.string().email().max(200),
  note: z.string().max(500).optional(),
});

/** GET: list DB-backed platform admins (env list shown separately in UI). */
export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  try {
    const rows = await db
      .select({
        id: platformAdmins.id,
        email: platformAdmins.email,
        addedBy: platformAdmins.addedBy,
        note: platformAdmins.note,
        createdAt: platformAdmins.createdAt,
      })
      .from(platformAdmins)
      .orderBy(platformAdmins.createdAt);
    return ok({ admins: rows });
  } catch (e) {
    console.error('[platform] list admins failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to list admins');
  }
}

/** POST: add a new platform admin (DB-backed). */
export async function POST(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  let parsed;
  try {
    parsed = AddSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  const email = parsed.email.trim().toLowerCase();

  try {
    const [row] = await db
      .insert(platformAdmins)
      .values({ email, addedBy: admin.email, note: parsed.note ?? null })
      .returning({ id: platformAdmins.id, email: platformAdmins.email });

    // Audit
    try {
      await db.insert(platformAuditEvents).values({
        actorEmail: admin.email,
        actorUserId: admin.userId,
        action: 'platform.add_admin',
        targetType: 'platform',
        targetId: row.id,
        targetLabel: email,
        metadata: { addedEmail: email },
      });
    } catch (auditErr) {
      console.error('[audit] platform.add_admin failed:', auditErr);
    }

    return ok(row, { status: 201 });
  } catch (e: unknown) {
    // Unique violation on lower(email)
    if (e instanceof Error && /unique/i.test(e.message)) {
      return fail(409, 'ALREADY_EXISTS', '此 email 已在名單內');
    }
    console.error('[platform] add admin failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to add admin');
  }
}
