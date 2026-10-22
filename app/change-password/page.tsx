'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isForced = Boolean(session?.user?.mustChangePassword);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters and contain letters and a number');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          isForced
            ? { newPassword, confirmPassword }
            : { currentPassword, newPassword, confirmPassword }
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? 'Failed to change password');
        return;
      }
      setDone(true);
      // Force a JWT refresh: this fires the jwt callback with trigger='update',
      // which re-reads mustChangePassword from the DB (now null) and re-signs
      // the cookie. Without this, the stale token keeps mustChangePassword=true
      // and middleware bounces the user back to this page.
      try {
        await update();
      } catch {
        // Session refresh is best-effort; the hard navigation below plus a
        // fresh login would also recover.
      }
      setTimeout(() => {
        // Hard navigation with the refreshed cookie -> middleware lets them through.
        // Route by role: platform admins return to /platform, everyone else /admin.
        const isPlatformRole = Boolean(session?.user?.isPlatform);
        window.location.href = isPlatformRole ? '/platform' : '/admin';
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-blue-100">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] bg-gradient-to-b from-[#0f172a] to-[#1e293b] px-4 py-12">
      <div className="auth-container rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-slate-900">
          {isForced ? 'Set your password' : 'Change password'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isForced
            ? 'You must set a new password before continuing. The temporary password you used to log in is no longer valid.'
            : 'Enter your current password and a new password.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {!isForced && (
            <div>
              <label className="field-label">Current password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="field"
              />
            </div>
          )}
          <div>
            <label className="field-label">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="field-label">Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
            />
          </div>

          {error ? <div className="alert-error">{error}</div> : null}

          {done ? (
            <div className="alert-success">Password updated. Redirecting…</div>
          ) : null}

          <button type="submit" disabled={busy || done} className="btn-primary w-full">
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  );
}