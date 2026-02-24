'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold">
            足球聯賽管理系統
          </Link>
          
          {session?.user && (
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-300 transition-colors">
                聯賽積分榜
              </Link>
              <Link href="/players" className="hover:text-gray-300 transition-colors">
                球員管理
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
                統計儀表板
              </Link>
              {(session.user as any).role === 'admin' && (
                <Link href="/admin" className="hover:text-gray-300 transition-colors">
                  管理員後台
                </Link>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <>
              <span className="text-sm">
                歡迎, {(session.user as any).username} ({(session.user as any).role})
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                登出
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition-colors">
              登入
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}