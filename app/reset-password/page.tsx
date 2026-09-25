'use client';

import { Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('密碼最少要 8 位。');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('密碼要同時包含字母同數字。');
      return;
    }
    if (password !== confirm) {
      setError('兩次輸入嘅密碼唔一致。');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || '重設失敗，請重新申請。');
      } else {
        router.replace('/login?reset=1');
      }
    } catch {
      setError('網絡錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-300">連結無效或缺少重設憑證。</p>
        <button
          onClick={() => router.replace('/login')}
          className="text-sm text-zinc-300 hover:text-white"
        >
          返回登入
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-zinc-400">請輸入你嘅新密碼。</p>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-zinc-300 mb-2">
          新密碼
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition"
          placeholder="最少 8 位，含字母及數字"
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-300 mb-2">
          確認新密碼
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition"
          placeholder="再輸入一次"
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
        className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? '設定中...' : '設定新密碼'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ZENEX-SPORTS LeagueCenter</h1>
          <p className="text-zinc-400">重設密碼</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-8">
          <Suspense fallback={<p className="text-sm text-zinc-500">載入中…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
