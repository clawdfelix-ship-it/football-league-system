import type { DefaultSession } from 'next-auth';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user?: {
      username?: string;
      role?: 'admin' | 'manager' | 'user';
      teamId?: number;
      mustChangePassword?: boolean;
      /**
       * Tenant binding of the authenticated session.
       *  >0  a concrete league; the session is only valid on that league's host
       *  0   platform-wide principal (env super admin / allow-listed platform admin)
       */
      leagueId?: number;
      /** True for platform-wide principals (operate the SaaS console). */
      isPlatform?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    username: string;
    role: 'admin' | 'manager' | 'user';
    teamId?: number;
    mustChangePassword?: boolean;
    leagueId?: number;
    isPlatform?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    role?: 'admin' | 'manager' | 'user';
    teamId?: number;
    mustChangePassword?: boolean;
    leagueId?: number;
    isPlatform?: boolean;
  }
}
