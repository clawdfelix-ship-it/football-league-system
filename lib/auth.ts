import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// 自定義用戶類型
interface CustomUser {
  id: string;
  email: string;
  username: string;
  role: string;
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

        // 模擬用戶資料 - 你可以修改這些資料
        const mockUsers = [
          {
            id: "1",
            email: "admin@football.com",
            username: "admin",
            password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
            role: "admin"
          },
          {
            id: "2", 
            email: "user@football.com",
            username: "user",
            password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
            role: "user"
          }
        ];

        const user = mockUsers.find(u => u.email === credentials.email);
        
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return user as any;
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
};