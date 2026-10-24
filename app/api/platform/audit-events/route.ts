import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import { platformAuditEvents } from '@/lib/schema';
import { desc, eq, and, gte, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTION = /^[a-z]+(\.[a-z_]+)?$/i;
const ALLOWED_TARGET_TYPE = new Set(['league', 'application', 'user', 'platform']);

/** Platform console: list audit events (platform-admin only). */
export async function GET(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const params = request.nextUrl.searchParams;
  const limitParam = params.get('limit');
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 500) : 100;
  const action = params.get('action');
  const targetType = params.get('targetType');
  const targetIdParam = params.get('targetId');
  const actor = params.get('actor');
  const since = params.get('since');
  const until = params.get('until');

  // Validate filters
  if (action && !ALLOWED_ACTION.test(action)) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid action filter');
  }
  if (targetType && !ALLOWED_TARGET_TYPE.has(targetType)) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid targetType filter');
  }
  if (targetIdParam && !Number.isInteger(Number(targetIdParam))) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid targetId filter');
  }
  if (actor && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(actor)) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid actor email filter');
  }

  try {
    const conditions = [];
    if (action) conditions.push(eq(platformAuditEvents.action, action));
    if (targetType) conditions.push(eq(platformAuditEvents.targetType, targetType));
    if (targetIdParam) conditions.push(eq(platformAuditEvents.targetId, Number(targetIdParam)));
    if (actor) conditions.push(eq(platformAuditEvents.actorEmail, actor.toLowerCase()));
    if (since) conditions.push(gte(platformAuditEvents.createdAt, new Date(since)));
    if (until) conditions.push(lte(platformAuditEvents.createdAt, new Date(until)));

    const query = db
      .select({
        id: platformAuditEvents.id,
        actorEmail: platformAuditEvents.actorEmail,
        action: platformAuditEvents.action,
        targetType: platformAuditEvents.targetType,
        targetId: platformAuditEvents.targetId,
        targetLabel: platformAuditEvents.targetLabel,
        metadata: platformAuditEvents.metadata,
        createdAt: platformAuditEvents.createdAt,
      })
      .from(platformAuditEvents)
      .orderBy(desc(platformAuditEvents.createdAt))
      .limit(limit);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const rows = await query;
    return ok({ events: rows });
  } catch (e) {
    console.error('[platform] list audit events failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to list audit events');
  }
}
