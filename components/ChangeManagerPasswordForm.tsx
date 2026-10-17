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
    <form onSubmit={onSubmit} className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">更改密碼</h2>
        <div className={`text-xs ${status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
          {status === 'loading' ? '更新中...' : message}
        </div>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">目前密碼</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1a237e] focus:outline-none focus:ring-2 focus:ring-[#1a237e]/25"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">新密碼</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1a237e] focus:outline-none focus:ring-2 focus:ring-[#1a237e]/25"
          />
          <span className="text-xs text-slate-500">最少 8 個字元，建議使用獨立強密碼。</span>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">確認新密碼</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1a237e] focus:outline-none focus:ring-2 focus:ring-[#1a237e]/25"
          />
        </label>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-2 btn-primary h-auto rounded-xl py-2.5 disabled:opacity-60"
        >
          更新密碼
        </button>
      </div>
    </form>
  );
}
