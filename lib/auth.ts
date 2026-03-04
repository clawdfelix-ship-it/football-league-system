import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { TEAMS } from '@/lib/constants';

interface CustomUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'manager';
  teamId?: number; // Index in TEAMS array
}

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

        // 1. Super Admin Check
        const adminEmail = process.env.ADMIN_EMAIL || 'info@zenex-sports.com';
        const adminPassword = process.env.ADMIN_PASSWORD || '98168789!@#';

        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return {
            id: 'admin',
            email: adminEmail,
            username: 'Admin',
            role: 'admin'
          };
        }
        
        // 2. Team Manager Check
        // Password for all teams: zenex2026 (Hardcoded for simplicity as requested)
        const TEAM_PASSWORD = 'zenex2026';
        
        if (credentials.password === TEAM_PASSWORD) {
          // Check if email matches any team format: {teamName}@zenex.com
          // We use the shortName from TEAMS constant (e.g. NOMURA -> nomura)
          const emailPrefix = credentials.email.split('@')[0].toUpperCase();
          
          const teamIndex = TEAMS.findIndex(t => t.shortName === emailPrefix);
          
          if (teamIndex !== -1) {
            const team = TEAMS[teamIndex];
            return {
              id: `manager-${teamIndex}`,
              email: credentials.email,
              username: `${team.shortName} Manager`,
              role: 'manager',
              teamId: teamIndex
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
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.username = customUser.username;
        token.role = customUser.role;
        token.teamId = customUser.teamId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
        (session.user as any).teamId = token.teamId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
};
