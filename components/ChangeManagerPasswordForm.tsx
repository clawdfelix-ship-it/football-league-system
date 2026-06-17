'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { apiJson } from '@/lib/api/client';

export default function ChangeManagerPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    if (!currentPassword || !newPassword) {
      setStatus('error');
      setMessage('請填寫所有欄位。');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('新密碼與確認密碼不一致。');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('新密碼最少需要 8 個字元。');
      return;
    }

    setStatus('loading');
    try {
      await apiJson<{ message: string }>(
        await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
      );

      setStatus('success');
      setMessage('密碼已更新。');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">更改密碼</h2>
        <div className={`text-xs ${status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
          {status === 'loading' ? '更新中...' : message}
        </div>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">目前密碼</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">新密碼</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">最少 8 個字元，建議使用獨立強密碼。</span>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">確認新密碼</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          更新密碼
        </button>
      </div>
    </form>
  );
}
