'use client';

import { Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

function ResetPasswordForm() {
  const { t } = useLanguage();
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
      setError(t('密碼最少要 8 位。', 'Password must be at least 8 characters.'));
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError(t('密碼要同時包含字母同數字。', 'Password must contain both letters and numbers.'));
      return;
    }
    if (password !== confirm) {
      setError(t('兩次輸入嘅密碼唔一致。', 'The two passwords do not match.'));
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
        setError(data?.error?.message || t('重設失敗，請重新申請。', 'Reset failed. Please request a new link.'));
      } else {
        router.replace('/login?reset=1');
      }
    } catch {
      setError(t('網絡錯誤，請稍後再試。', 'Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">{t('連結無效或缺少重設憑證。', 'Invalid link or missing reset token.')}</p>
        <button
          onClick={() => router.replace('/login')}
          className="text-sm text-slate-500 hover:text-[#1a237e]"
        >
          {t('返回登入', 'Back to login')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-500">{t('請輸入你嘅新密碼。', 'Please enter your new password.')}</p>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-2">
          {t('新密碼', 'New password')}
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition"
          placeholder={t('最少 8 位，含字母及數字', 'At least 8 chars, with letters and numbers')}
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-2">
          {t('確認新密碼', 'Confirm new password')}
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent transition"
          placeholder={t('再輸入一次', 'Enter it again')}
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
        className="w-full bg-[#1a237e] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#283593] focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? t('設定中...', 'Setting...') : t('設定新密碼', 'Set new password')}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ZENEX-SPORTS LeagueCenter</h1>
          <p className="text-blue-200">{t('重設密碼', 'Reset Password')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<p className="text-sm text-slate-400">{t('載入中…', 'Loading...')}</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
