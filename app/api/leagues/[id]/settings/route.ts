import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { db } from '@/lib/db';
import { leagues } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zodDetails } from '@/lib/api/zod';
import { isValidLeagueSlug, isReservedSlug } from '@/lib/tenant/provisioning';
import { ensureTenantCert } from '@/lib/tenant/vercel-tls';
import { invalidateLeagueDirectory } from '@/lib/tenant/leagues';
import { recordPlatformEvent } from '@/lib/tenant/audit.server';

export const dynamic = 'force-dynamic';

const SiteSettingsSchema = z.object({
  heroTitle: z.string().max(200).optional(),
  heroSubtitle: z.string().max(500).optional(),
  venues: z.array(z.string().max(200)).max(20).optional(),
  navbarLinks: z.array(z.object({
    href: z.string().max(200),
    zh: z.string().max(50),
    en: z.string().max(50),
  })).max(20).optional(),
  footerLinks: z.array(z.object({
    href: z.string().max(200),
    label: z.string().max(50),
  })).max(20).optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(80).optional(),
  announcement: z.string().max(2000).optional(),
  contactEmail: z.string().email().max(200).optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  siteSettings: SiteSettingsSchema.optional(),
});

type Params = { params: Promise<{ id: string }> };

/** League admin: read own league settings. */
export async function GET(_request: NextRequest, context: Params) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

  const { id } = await context.params;
  const leagueId = Number(id);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid league id');
  }
  if (auth.leagueId !== leagueId) {
    return fail(403, 'FORBIDDEN', 'Cannot read another league');
  }

  try {
    const [league] = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
        announcement: leagues.announcement,
        contactEmail: leagues.contactEmail,
        contactPhone: leagues.contactPhone,
        siteSettings: leagues.siteSettings,
      })
      .from(leagues)
      .where(eq(leagues.id, leagueId))
      .limit(1);

    if (!league) return fail(404, 'NOT_FOUND', 'League not found');
    return ok(league);
  } catch (e) {
    console.error('[league-settings] read failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to load league settings');
  }
}

/** League admin: update own league settings (name, slug, announcement, contact info). */
export async function PATCH(request: NextRequest, context: Params) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

  const { id } = await context.params;
  const leagueId = Number(id);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid league id');
  }

  // League admin can only update their own league
  if (auth.leagueId !== leagueId) {
    return fail(403, 'FORBIDDEN', 'Cannot update another league');
  }

  let parsed;
  try {
    parsed = UpdateSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  try {
    // If slug is changing, validate + provision cert for the new hostname
    let slugChanged = false;
    let oldSlug = '';
    let certResult: { ok: boolean; error?: string } | undefined;

    if (parsed.slug !== undefined) {
      const newSlug = parsed.slug.trim().toLowerCase();

      // Validate slug format
      if (!isValidLeagueSlug(newSlug)) {
        return fail(400, 'INVALID_SLUG', '子網域名稱格式無效（只限小寫字母、數字、連字號）');
      }
      if (isReservedSlug(newSlug)) {
        return fail(400, 'RESERVED_SLUG', '此名稱為平台保留，不能使用');
      }

      // Check if slug is already taken by another league
      const [existing] = await db
        .select({ id: leagues.id, slug: leagues.slug })
        .from(leagues)
        .where(eq(leagues.slug, newSlug))
        .limit(1);

      if (existing && existing.id !== leagueId) {
        return fail(409, 'SLUG_TAKEN', '此子網域名稱已被使用');
      }

      // Get current slug for comparison
      const [current] = await db
        .select({ slug: leagues.slug })
        .from(leagues)
        .where(eq(leagues.id, leagueId))
        .limit(1);

      if (!current) {
        return fail(404, 'NOT_FOUND', 'League not found');
      }

      oldSlug = current.slug;
      if (oldSlug !== newSlug) {
        slugChanged = true;
        // Provision TLS cert for the new hostname (best-effort)
        certResult = await ensureTenantCert(newSlug);
      }
    }

    // If siteSettings provided, merge with existing (partial update)
    let mergedSiteSettings: Record<string, unknown> | undefined;
    if (parsed.siteSettings !== undefined) {
      const [current] = await db
        .select({ siteSettings: leagues.siteSettings })
        .from(leagues)
        .where(eq(leagues.id, leagueId))
        .limit(1);
      mergedSiteSettings = { ...(current?.siteSettings as Record<string, unknown> ?? {}), ...parsed.siteSettings };
    }

    const [updated] = await db
      .update(leagues)
      .set({
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.slug !== undefined && { slug: parsed.slug.trim().toLowerCase() }),
        ...(parsed.announcement !== undefined && { announcement: parsed.announcement }),
        ...(parsed.contactEmail !== undefined && { contactEmail: parsed.contactEmail || null }),
        ...(parsed.contactPhone !== undefined && { contactPhone: parsed.contactPhone || null }),
        ...(mergedSiteSettings !== undefined && { siteSettings: mergedSiteSettings }),
        updatedAt: new Date(),
      })
      .where(eq(leagues.id, leagueId))
      .returning({ id: leagues.id, name: leagues.name, slug: leagues.slug });

    // Invalidate league directory cache so the new slug resolves
    if (slugChanged) {
      invalidateLeagueDirectory();
    }

    // Audit the change
    void recordPlatformEvent({
      actorEmail: auth.email ?? 'unknown',
      action: slugChanged ? 'league.change_slug' : 'league.update_settings',
      targetType: 'league',
      targetId: leagueId,
      targetLabel: updated.slug,
      metadata: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(slugChanged && { oldSlug, newSlug: updated.slug, certProvisioned: certResult?.ok }),
      },
    });

    return ok({
      updated,
      slugChanged,
      cert: certResult,
      ...(slugChanged && {
        newUrl: `https://${updated.slug}.zenex-sports.com`,
        warning: '子網域名稱已更改。舊網址將會失效，請通知所有使用者。',
      }),
    });
  } catch (e) {
    console.error('[league-settings] update failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to update league settings');
  }
}
