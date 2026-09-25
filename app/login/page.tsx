'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'forgot';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
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

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
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

  const handleForgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || '無法發送重設電郵，請稍後再試。');
      } else {
        setNotice('如果該帳號存在，重設電郵已經發出。請檢查你的收件箱（包括垃圾郵件）。');
      }
    } catch {
      setError('網絡錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ZENEX-SPORTS LeagueCenter</h1>
          <p className="text-blue-200">
            {mode === 'login' ? '管理員 / Team Manager 登入' : '重設密碼'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-8">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  電郵地址
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    密碼
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setNotice('');
                    }}
                    className="text-xs text-slate-500 hover:text-[#1a237e] transition"
                  >
                    忘記密碼？
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a237e] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#283593] focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? '登入中...' : '登入'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-6">
              <p className="text-sm text-slate-500">
                輸入你嘅帳號電郵，我哋會發送一條重設密碼連結（30 分鐘內有效）。
              </p>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-2">
                  電郵地址
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              {notice && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a237e] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#283593] focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? '發送中...' : '發送重設連結'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setNotice('');
                }}
                className="w-full text-sm text-slate-500 hover:text-[#1a237e] transition"
              >
                ← 返回登入
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
