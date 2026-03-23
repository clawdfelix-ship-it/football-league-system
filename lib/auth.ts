import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { TEAMS } from '@/lib/constants';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface CustomUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'manager';
  teamId?: number; // Index in TEAMS array
}

// Map emails to team indexes (0-based index from TEAMS constant)
const MANAGER_EMAILS: Record<string, number> = {
  // 0: NOMURA
  'terrence.tan@nomura.com': 0,
  'kenneth.miranda@nomura.com': 0,
  
  // 1: BBVA
  'ibai.garatea1@bbva.com': 1,
  'yassine.ayadi@bbva.com': 1,
  
  // 2: LGT
  'david.pun@lgt.com': 2,
  'alvin.li@lgt.com': 2,
  
  // 3: CACIB
  'maxime.bonte@ca-cib.com': 3,
  'victor.romier@ca-cib.com': 3,
  
  // 4: CITI
  'michael.mak@citi.com': 4,
  'toan.dc.nguyen@citi.com': 4,
  
  // 5: SCB
  'david.oliveira@sc.com': 5,
  'andyty.wan@sc.com': 5,
  
  // 6: UBS
  'mortadha.lagha@ubs.com': 6,
  'fu-bong.chan@ubs.com': 6,
  'keith.kwok@ubs.com': 6,
  'eugene.lam@ubs.com': 6,
  
  // 7: HSBC
  'jimmy.k.p.chan@hsbc.com.hk': 7,

  // 8: KPMG
  'terrence.chan@kpmg.com': 8,
  'andrew.chan@kpmg.com': 8,

  // 9: DEMO
  'hello@zenex-sports.com': 9,

  // TEST ACCOUNT (Linked to NOMURA for testing)
  'test@manager.com': 0,
};

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

        if (adminEmail && adminPassword && inputEmail === adminEmail && credentials.password === adminPassword) {
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
            })
            .from(users)
            .where(eq(users.email, inputEmail));

          if (dbUser && dbUser.role === 'manager') {
            const ok = await bcrypt.compare(credentials.password, dbUser.passwordHash);
            if (!ok) return null;

            const mappedTeamIndex = MANAGER_EMAILS[inputEmail];
            const emailPrefixIndex = TEAMS.findIndex(t => t.shortName === inputEmail.split('@')[0].toUpperCase());
            const teamIndex = mappedTeamIndex ?? emailPrefixIndex;

            return {
              id: `manager-${dbUser.id}`,
              email: dbUser.email,
              username: dbUser.username,
              role: 'manager',
              teamId: teamIndex !== -1 ? teamIndex : undefined
            };
          }
        } catch (e) {
          console.error('Manager DB auth check failed:', e);
        }
        
        if (credentials.password === TEAM_PASSWORD) {
          // Check if email is in our allowed list
          const teamIndex = MANAGER_EMAILS[inputEmail];
          
          if (teamIndex !== undefined) {
            const team = TEAMS[teamIndex];
            // Extract name from email (e.g. david.pun -> David Pun) for display
            let namePart = inputEmail.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            
            // Special handling for test account name
            if (inputEmail === 'test@manager.com') {
              namePart = 'Test Manager';
            }
            
            return {
              id: `manager-${teamIndex}-${namePart}`,
              email: inputEmail,
              username: `${namePart} (${team.shortName})`,
              role: 'manager',
              teamId: teamIndex
            };
          }

          // Fallback: Check for generic team emails (e.g. nomura@zenex.com) as backup
          const emailPrefix = inputEmail.split('@')[0].toUpperCase();
          const genericTeamIndex = TEAMS.findIndex(t => t.shortName === emailPrefix);
          
          if (genericTeamIndex !== -1 && inputEmail.endsWith('@zenex.com')) {
            const team = TEAMS[genericTeamIndex];
            return {
              id: `manager-${genericTeamIndex}`,
              email: inputEmail,
              username: `${team.shortName} Manager`,
              role: 'manager',
              teamId: genericTeamIndex
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
