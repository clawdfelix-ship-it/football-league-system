/**
 * Platform-admin determination (Phase 3b).
 *
 * A PLATFORM admin operates the SaaS itself: reviews league applications,
 * provisions/suspends leagues, sees the console. This is distinct from a
 * league 'admin' role in lib/auth/roles, which manages one league's data.
 *
 * Identity is an allow-list of emails from PLATFORM_ADMIN_EMAILS (comma or
 * semicolon separated, case-insensitive). Edge-safe pure helpers live here;
 * the request-scoped wrapper lives in lib/authz.
 */

function parseEnv(raw: string | null | undefined): string[] {
  return (raw ?? '')
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Canonical, de-duplicated set of platform admin emails. */
export function platformAdminEmails(
  raw: string | null | undefined = process.env.PLATFORM_ADMIN_EMAILS
): Set<string> {
  return new Set(parseEnv(raw));
}

/** Is this exact email a platform admin? Pure: pass the env list for tests. */
export function isPlatformAdminEmail(
  email: string | null | undefined,
  raw: string | null | undefined = process.env.PLATFORM_ADMIN_EMAILS
): boolean {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  if (!value) return false;
  return platformAdminEmails(raw).has(value);
}
