'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { signIn, useSession, getSession } from 'next-auth/react';
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
  const { data: session, status } = useSession();

  // After a client-side sign-in the new session cookie is not yet attached to
  // the next RSC fetch, so router.push('/admin') can render the signed-out
  // (blank) state until a manual refresh. A full-page navigation sends the
  // fresh cookie on the very first request, so the admin renders logged-in.
  function goAfterLogin(dest: string) {
    window.location.assign(dest);
  }

  useEffect(() => {
    if (!session) return;
    if (session.user?.isPlatform) {
      goAfterLogin('/platform');
      return;
    }
    if (session.user?.role === 'user') {
      goAfterLogin('/');
      return;
    }
    goAfterLogin('/admin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
        // Read the fresh session to route by the real principal, then do a full
        // navigation so the destination server render has the auth cookie.
        const fresh = await getSession();
        const dest = fresh?.user?.isPlatform
          ? '/platform'
          : fresh?.user?.role === 'user'
            ? '/'
            : '/admin';
        goAfterLogin(dest);
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
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4 py-12">
      <div className="auth-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ZENEX-SPORTS LeagueCenter</h1>
          <p className="text-blue-200">
            {mode === 'login' ? t('管理員 / Team Manager 登入', 'Admin / Team Manager Login') : t('重設密碼', 'Reset Password')}
          </p>
        </div>

        <div className="card p-8 shadow-2xl">
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
                  className="field h-11 rounded-lg bg-slate-50"
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
                    className="text-xs text-slate-500 hover:text-[#0f172a] transition"
                  >
                    {t('忘記密碼？', 'Forgot password?')}
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field h-11 rounded-lg bg-slate-50"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="alert-error rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 rounded-lg font-bold"
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
                  className="field h-11 rounded-lg bg-slate-50"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && (
                <div className="alert-error rounded-lg">
                  {error}
                </div>
              )}
              {notice && (
                <div className="alert-success rounded-lg">
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 rounded-lg font-bold"
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
                className="w-full text-sm text-slate-500 hover:text-[#0f172a] transition"
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
