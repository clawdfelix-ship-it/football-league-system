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
    } & DefaultSession['user'];
  }

  interface User {
    username: string;
    role: 'admin' | 'manager' | 'user';
    teamId?: number;
    mustChangePassword?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    role?: 'admin' | 'manager' | 'user';
    teamId?: number;
    mustChangePassword?: boolean;
  }
}