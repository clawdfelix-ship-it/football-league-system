/**
 * Pure helpers for league provisioning (Phase 3).
 * Edge-safe: no db/fs/next imports — fully unit-testable.
 *
 * Covers:
 *   - league slug generation / validation from a display name
 *   - application status state machine (pending -> approved/rejected/...)
 *   - deterministic slug de-duplication against already-taken slugs
 *
 * The DB/transaction side lives in ./provisioning.server.ts.
 */

// Reuse the same slug character rule as the host resolver.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export function isValidLeagueSlug(slug: string | null | undefined): boolean {
  return Boolean(slug && SLUG_RE.test(slug) && !slug.includes('--'));
}

/**
 * Turn an arbitrary display name into a URL/subdomain-safe slug.
 * - transliterates nothing fancy; strips accents via NFKD
 * - non [a-z0-9] runs -> single hyphen
 * - truncates to 63 chars (safe for a single DNS label)
 * Falls back to 'league' when nothing usable remains; caller then de-dupes.
 */
export function slugifyLeagueName(input: string | null | undefined): string {
  const base = (input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop combining accents
    .toLowerCase()
    .replace(/['’]s?\b/g, '') // crude possessive cleanup
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
  return base || 'league';
}

/**
 * Return a slug not present in `taken`. Appends -2, -3 … on collision.
 * Guarantees termination by widening the numeric suffix; with a 63-char cap
 * it trims the base to leave room for the suffix.
 */
export function uniqueLeagueSlug(
  desired: string,
  taken: ReadonlySet<string> | Iterable<string>
): string {
  const takenSet = taken instanceof Set ? taken : new Set(taken);
  let slug = slugifyLeagueName(desired).slice(0, 63);
  if (!takenSet.has(slug)) return slug;
  for (let n = 2; n < 10000; n++) {
    const suffix = `-${n}`;
    const candidate = slug.slice(0, 63 - suffix.length) + suffix;
    if (!takenSet.has(candidate)) return candidate;
  }
  // Practically unreachable; final safety net with a short random tail.
  return slug.slice(0, 56) + '-' + Math.random().toString(36).slice(2, 8);
}

// ---------------- Application status state machine ----------------

export type ApplicationStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export const APPLICATION_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  'pending',
  'in_review',
  'approved',
  'rejected',
  'withdrawn',
]);

// Allowed forward/side transitions. Approval is terminal (provisioning runs
// once, guarded separately by the unique league_id on the application).
const TRANSITIONS: Record<ApplicationStatus, ReadonlySet<ApplicationStatus>> = {
  pending: new Set(['in_review', 'approved', 'rejected', 'withdrawn']),
  in_review: new Set(['approved', 'rejected', 'withdrawn', 'pending']),
  approved: new Set<ApplicationStatus>(), // terminal
  rejected: new Set(['pending']), // allow reopen on appeal
  withdrawn: new Set(['pending']), // allow resubmit
};

export function canTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.has(to) ?? false;
}

/** Throws on an illegal transition; returns the target status otherwise. */
export function assertApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus
): ApplicationStatus {
  if (!canTransitionApplication(from, to)) {
    throw new Error(`Illegal application status transition: ${from} -> ${to}`);
  }
  return to;
}

/** Only an application in exactly this state may be provisioned once. */
export function canProvision(status: ApplicationStatus): boolean {
  return status === 'approved';
}
