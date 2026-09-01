import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { TEAMS } from '@/lib/constants';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { getManagerMapping } from '@/lib/auth/load-manager-mapping';
import { rehashIfLegacy } from '@/lib/auth/password';

/**
 * How often (seconds) to re-validate the session's role/team against the DB
 * during JWT refresh. Lower = tighter security, higher = less DB load.
 * 5 minutes is a reasonable balance for a low-traffic league admin app.
 */
const JWT_RECHECK_INTERVAL = Number(process.env.JWT_RECHECK_INTERVAL ?? 300);

/**
 * Constant-time string comparison for shared/server-side secrets.
 *
 * Why: `a === b` short-circuits on the first differing byte, so an attacker who
 * can measure response latency can statistically infer the password prefix.
 * Per-user bcrypt compares are already constant-time; this covers the shared
 * admin/team passwords which are compared in plaintext.
 */
function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still burn a constant-time comparison against bufA so length differences
    // don't leak via timing, then report mismatch.
    const padded = Buffer.alloc(bufA.length);
    bufB.copy(padded, 0, 0, Math.min(bufB.length, bufA.length));
    timingSafeEqual(bufA, padded);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

interface CustomUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'manager' | 'user';
  teamId?: number; // Index in TEAMS array
  mustChangePassword?: boolean;
}

export function resolveManagerTeamId(email: string): number | null {
  const inputEmail = email.toLowerCase();

  // Source of truth is now lib/auth/load-manager-mapping (env var, gitignored file,
  // or empty placeholder). Real PII lives outside the repo.
  const mapping = getManagerMapping();
  const mappedTeamIndex = mapping[inputEmail];
  if (mappedTeamIndex !== undefined && mappedTeamIndex >= 0 && mappedTeamIndex < TEAMS.length) {
    return mappedTeamIndex;
  }

  const emailPrefix = inputEmail.split('@')[0].toUpperCase();
  const prefixTeamIndex = TEAMS.findIndex((t) => t.shortName === emailPrefix);
  if (prefixTeamIndex !== -1) {
    return prefixTeamIndex;
  }

  return null;
}

// Legacy export kept for backward compatibility with any consumer that imported
// the raw map. Now proxies through the loader so updates propagate.
export const MANAGER_EMAILS: Readonly<Record<string, number>> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const map = getManagerMapping();
      return map[prop.toLowerCase()];
    },
    has(_target, prop: string) {
      const map = getManagerMapping();
      return map[prop.toLowerCase()] !== undefined;
    },
    ownKeys() {
      return Object.keys(getManagerMapping());
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      const map = getManagerMapping();
      const value = map[prop.toLowerCase()];
      if (value === undefined) return undefined;
      return { configurable: true, enumerable: true, value, writable: false };
    },
  }
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const inputEmail = credentials.email.toLowerCase();

        // 1. Super Admin Check
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (adminEmail && adminPassword && inputEmail === adminEmail.toLowerCase() && safeEqualString(credentials.password, adminPassword)) {
          return {
            id: 'admin',
            email: adminEmail,
            username: 'Admin',
            role: 'admin'
          };
        }
        
        // 2. Team Manager Check
        const TEAM_PASSWORD = process.env.MANAGER_PASSWORD;

        try {
          const [dbUser] = await db
            .select({
              id: users.id,
              email: users.email,
              username: users.username,
              role: users.role,
              passwordHash: users.passwordHash,
              mustChangePassword: users.mustChangePassword,
            })
            .from(users)
            .where(eq(users.email, inputEmail));

          if (dbUser) {
            const ok = await bcrypt.compare(credentials.password, dbUser.passwordHash);
            if (!ok) return null;

            // Non-blocking auto-upgrade: if this user's password was hashed with
            // an older bcrypt cost, transparently re-hash at the current cost.
            // Never throws and never blocks the login path.
            void rehashIfLegacy(credentials.password, dbUser.passwordHash).then(
              async (newHash) => {
                if (!newHash) return;
                try {
                  await db
                    .update(users)
                    .set({ passwordHash: newHash })
                    .where(eq(users.id, dbUser.id));
                } catch (e) {
                  console.warn('[auth] failed to upgrade password hash for user', dbUser.id, e);
                }
              },
              () => {
                // intentionally ignored
              }
            );

            const mustChange = Boolean(dbUser.mustChangePassword);

            if (dbUser.role === 'manager') {
              const teamIndex = resolveManagerTeamId(inputEmail);
              if (teamIndex === null) {
                console.warn('Manager login denied due to missing team mapping:', inputEmail);
                return null;
              }

              return {
                id: `manager-${dbUser.id}`,
                email: dbUser.email,
                username: dbUser.username,
                role: 'manager',
                teamId: teamIndex,
                mustChangePassword: mustChange,
              };
            }

            if (dbUser.role === 'user') {
              return {
                id: `user-${dbUser.id}`,
                email: dbUser.email,
                username: dbUser.username,
                role: 'user',
                mustChangePassword: mustChange,
              };
            }

            return null;
          }
        } catch (e) {
          console.error('Manager DB auth check failed:', e);
        }

        // Bootstrap-only fallback for whitelisted managers that do not yet have a DB account.
        // Gated on MANAGER_PASSWORD env var so it ONLY works if the admin explicitly
        // sets it (typically for the very first deploy before running the seed script).
        // After seed-team-passwords.ts is run, every manager has a DB row and falls
        // through the dbUser branch above instead of this one.
        if (TEAM_PASSWORD && safeEqualString(credentials.password, TEAM_PASSWORD)) {
          const teamIndex = MANAGER_EMAILS[inputEmail];
          if (teamIndex !== undefined) {
            const team = TEAMS[teamIndex];
            const namePart = inputEmail.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            return {
              id: `manager-${teamIndex}-${namePart}`,
              email: inputEmail,
              username: inputEmail === 'test@manager.com' ? 'Test Manager' : `${namePart} (${team.shortName})`,
              role: 'manager',
              teamId: teamIndex,
              mustChangePassword: true, // force password set on first login
            };
          }
        }

        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const customUser = user as CustomUser;
        token.username = customUser.username;
        token.role = customUser.role;
        token.teamId = customUser.teamId;
        token.mustChangePassword = customUser.mustChangePassword;
        return token;
      }

      // Re-validate the session against the DB so role/team changes or account
      // deletion take effect without waiting for the (30-day) JWT to expire.
      // Runs on explicit `update()` or once the token is older than
      // JWT_RECHECK_INTERVAL. The env-based super admin has no users row, so it
      // is exempt; returning null discards the token and forces re-login.
      const now = Math.floor(Date.now() / 1000);
      const lastCheck = typeof token.iat === 'number' ? token.iat : now;
      const email = typeof token.email === 'string' ? token.email : null;
      const shouldRecheck =
        trigger === 'update' || now - lastCheck > JWT_RECHECK_INTERVAL;

      if (shouldRecheck && email && token.role !== 'admin') {
        try {
          const [dbUser] = await db
            .select({ role: users.role, must: users.mustChangePassword })
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

          if (!dbUser) {
            // Account deleted — revoke.
            return null as unknown as typeof token;
          }
          if (dbUser.role !== token.role) {
            console.warn(`[auth] JWT role drift for ${email}; revoking session.`);
            return null as unknown as typeof token;
          }
          if (
            dbUser.role === 'manager' &&
            typeof token.teamId === 'number' &&
            resolveManagerTeamId(email) !== token.teamId
          ) {
            console.warn(`[auth] JWT teamId drift for ${email}; revoking session.`);
            return null as unknown as typeof token;
          }
          // Also keeps the must-change-password flag fresh (trigger==='update').
          token.mustChangePassword = Boolean(dbUser.must);
        } catch (e) {
          // DB hiccup — fail open (keep the token) but log it, otherwise a
          // transient outage would lock everyone out.
          console.error('[auth] JWT recheck failed; keeping existing token:', e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.teamId = token.teamId;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
};
