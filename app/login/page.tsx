'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session) return;
    if (session.user?.role === 'user') {
      router.replace('/');
      return;
    }
    router.replace('/admin');
  }, [router, session]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('電郵、密碼錯誤，或此 manager 帳號未綁定球隊。');
      } else if (result?.ok) {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError('登入時發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ZENEX-SPORTS LeagueCenter</h1>
          <p className="text-zinc-400">管理員 / Team Manager 登入</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                電郵地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
