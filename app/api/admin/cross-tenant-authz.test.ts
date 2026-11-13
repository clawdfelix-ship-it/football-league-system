/**
 * Cross-tenant authorization regression tests (2026-11-13 security fix).
 *
 * Covers:
 *   1. POST /api/admin/team-passwords
 *   2. PUT  /api/admin/team-passwords
 *   3. POST /api/admin/manager-accounts
 *
 * Each proves a league-A admin on a league-B host is rejected (403) BEFORE
 * any DB mutation happens. Also covers: no-session 401, wrong-role 403,
 * platform principal denied (these are league-scoped routes), no-tenant
 * rejection, and same-league happy path is NOT blocked by the new guard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Shared spies (hoisted so vi.mock factory closures can use them) ----
const { sessionSpy, hostLeagueIdSpy, dbSpy } = vi.hoisted(() => {
  const sessionSpy = vi.fn();
  const hostLeagueIdSpy = vi.fn();
  const dbSpy = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  };
  return { sessionSpy, hostLeagueIdSpy, dbSpy };
});

// Mock next-auth session resolver used by getServerSession.
vi.mock('next-auth/next', () => ({
  getServerSession: () => sessionSpy(),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// Tenant host resolution.
vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: () => hostLeagueIdSpy(),
}));

// next/headers: provide empty Headers so nothing crashes.
vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
}));

// DB: every builder chain returns empty arrays by default; mutation methods
// are spies so we can assert they are never called on a denied request.
vi.mock('@/lib/db', () => ({
  db: {
    select: dbSpy.select,
    update: dbSpy.update,
    insert: dbSpy.insert,
    delete: dbSpy.delete,
  },
}));

vi.mock('@/lib/schema', () => ({
  users: { id: 'id', email: 'email', leagueId: 'leagueId', role: 'role', username: 'username' },
  teams: { id: 'id', leagueId: 'leagueId', shortName: 'shortName', name: 'name', captains: 'captains' },
  platformAdmins: { id: 'id', email: 'email' },
}));

vi.mock('@/lib/auth/password', () => ({ hashPassword: async (s: string) => `h:${s}` }));
vi.mock('@/lib/auth/temp-password', () => ({ generateTempPassword: () => 'tmp-pw-123' }));
vi.mock('@/lib/auth/audit-log', () => ({ audit: () => Promise.resolve() }));
vi.mock('@/lib/mail/mailer', () => ({ sendMail: () => Promise.resolve() }));
vi.mock('@/lib/mail/templates', () => ({
  passwordResetByAdminEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  accountCreatedEmail: () => ({ subject: 's', html: 'h', text: 't' }),
}));
vi.mock('@/lib/tenant/team-auth.server', () => ({
  getTeamNameFromDbId: async () => null,
  resolveManagerTeamDbId: async () => null,
}));
vi.mock('@/lib/tenant/platform-admin', () => ({
  isPlatformAdminEmail: () => false,
}));

// A chainable query-builder stub that records mutations.
function chain(terminal: unknown[] = []) {
  const self: Record<string, unknown> = {};
  for (const m of ['from', 'where', 'leftJoin', 'orderBy', 'limit']) {
    self[m] = () => self;
  }
  self.then = (resolve: (v: unknown) => unknown) => resolve(terminal);
  return self;
}

beforeEach(() => {
  vi.clearAllMocks();
  dbSpy.select.mockImplementation(() => chain([]));
  dbSpy.update.mockImplementation(() => chain([]));
  dbSpy.insert.mockImplementation(() => chain([]));
  dbSpy.delete.mockImplementation(() => chain([]));
});

// ---- helpers ----
function session(opts: { role: string; leagueId?: number; isPlatform?: boolean; email?: string }) {
  return {
    user: {
      role: opts.role,
      leagueId: opts.leagueId,
      isPlatform: opts.isPlatform,
      email: opts.email ?? 'a@league-a.test',
      username: 'admin-a',
    },
    expires: '2099-01-01',
  };
}

function req(body: unknown = {}) {
  return new Request('http://localhost/api/admin/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Import routes AFTER mocks are registered.
import { POST as teamPasswordsPOST, PUT as teamPasswordsPUT } from '@/app/api/admin/team-passwords/route';
import { POST as managerAccountsPOST } from '@/app/api/admin/manager-accounts/route';

type Case = { name: string; call: () => Promise<Response> };
const cases: Case[] = [
  { name: 'team-passwords POST', call: () => teamPasswordsPOST(req({ team: 'HSBC', password: 'x' })) },
  { name: 'team-passwords PUT', call: () => teamPasswordsPUT(req({ email: 'm@b.test' })) },
  { name: 'manager-accounts POST', call: () => managerAccountsPOST(req({ regenerate: true, mode: 'random' })) },
];

describe.each(cases)('cross-tenant guard: $name', ({ call }) => {
  it('no session → 401, zero DB mutation', async () => {
    sessionSpy.mockResolvedValue(null);
    hostLeagueIdSpy.mockResolvedValue(2);
    const res = await call();
    expect([401, 403]).toContain(res.status);
    expect(dbSpy.insert).not.toHaveBeenCalled();
    expect(dbSpy.update).not.toHaveBeenCalled();
    expect(dbSpy.delete).not.toHaveBeenCalled();
  });

  it('non-admin role → 403, zero DB mutation', async () => {
    sessionSpy.mockResolvedValue(session({ role: 'manager', leagueId: 2 }));
    hostLeagueIdSpy.mockResolvedValue(2);
    const res = await call();
    expect(res.status).toBe(403);
    expect(dbSpy.insert).not.toHaveBeenCalled();
    expect(dbSpy.update).not.toHaveBeenCalled();
  });

  it('league-A admin on league-B host → 403 (cross-league), zero DB mutation', async () => {
    sessionSpy.mockResolvedValue(session({ role: 'admin', leagueId: 1 }));
    hostLeagueIdSpy.mockResolvedValue(2); // different tenant
    const res = await call();
    expect(res.status).toBe(403);
    expect(dbSpy.insert).not.toHaveBeenCalled();
    expect(dbSpy.update).not.toHaveBeenCalled();
    expect(dbSpy.delete).not.toHaveBeenCalled();
    // The guard must fire before any user-table read for the target
    // (prevents probing B league captain emails).
    expect(dbSpy.select).not.toHaveBeenCalled();
  });

  it('platform principal (isPlatform) on a league host → 403 (league-scoped route)', async () => {
    sessionSpy.mockResolvedValue(session({ role: 'admin', isPlatform: true }));
    hostLeagueIdSpy.mockResolvedValue(2);
    const res = await call();
    expect(res.status).toBe(403);
    expect(dbSpy.insert).not.toHaveBeenCalled();
    expect(dbSpy.update).not.toHaveBeenCalled();
  });

  it('no active tenant (hostLeagueId=0) → rejected, zero DB mutation', async () => {
    sessionSpy.mockResolvedValue(session({ role: 'admin', leagueId: 1 }));
    hostLeagueIdSpy.mockResolvedValue(0);
    const res = await call();
    expect([400, 403]).toContain(res.status);
    expect(dbSpy.insert).not.toHaveBeenCalled();
    expect(dbSpy.update).not.toHaveBeenCalled();
  });

  it('same-league admin on own host → NOT blocked by the guard', async () => {
    sessionSpy.mockResolvedValue(session({ role: 'admin', leagueId: 2 }));
    hostLeagueIdSpy.mockResolvedValue(2);
    // DB returns empty team list → business-layer 404, NOT a 403 authz denial.
    const res = await call();
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});
