'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

type Mode = 'login' | 'forgot';

export default function LoginPage() {
  const { t } = useLanguage();
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
        setError(t('電郵、密碼錯誤，或此 manager 帳號未綁定球隊。', 'Wrong email or password, or this manager account is not linked to a team.'));
      } else if (result?.ok) {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError(t('登入時發生錯誤，請稍後再試。', 'Something went wrong signing in. Please try again.'));
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
        setError(data?.error?.message || t('無法發送重設電郵，請稍後再試。', 'Could not send reset email. Please try again.'));
      } else {
        setNotice(t('如果該帳號存在，重設電郵已經發出。請檢查你的收件箱（包括垃圾郵件）。', 'If that account exists, a reset email has been sent. Check your inbox (including spam).'));
      }
    } catch {
      setError(t('網絡錯誤，請稍後再試。', 'Network error. Please try again.'));
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
            {mode === 'login' ? t('管理員 / Team Manager 登入', 'Admin / Team Manager Login') : t('重設密碼', 'Reset Password')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-8">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('電郵地址', 'Email address')}
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
                    {t('密碼', 'Password')}
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
                    {t('忘記密碼？', 'Forgot password?')}
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
                {loading ? t('登入中...', 'Signing in...') : t('登入', 'Login')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-6">
              <p className="text-sm text-slate-500">
                {t('輸入你嘅帳號電郵，我哋會發送一條重設密碼連結（30 分鐘內有效）。', 'Enter your account email and we’ll send a password reset link (valid for 30 minutes).')}
              </p>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('電郵地址', 'Email address')}
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
                {loading ? t('發送中...', 'Sending...') : t('發送重設連結', 'Send reset link')}
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
                ← {t('返回登入', 'Back to login')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
