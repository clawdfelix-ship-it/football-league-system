'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useTeams } from '@/lib/teams/use-teams';

type Issued = {
  team: string;
  email: string;
  password: string;
  mustChangeOnLogin: boolean;
};

export default function AdminTeamPasswordsPage() {
  const { data: session, status } = useSession();
  const [team, setTeam] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetIssued, setResetIssued] = useState<Issued | null>(null);
  const [revealCountdown, setRevealCountdown] = useState<number>(0);

  // 30s wipe countdown for plaintext displayed on screen.
  useEffect(() => {
    if (revealCountdown <= 0) return;
    const t = setTimeout(() => setRevealCountdown(revealCountdown - 1), 1000);
    return () => clearTimeout(t);
  }, [revealCountdown]);

  function generatePassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let raw = '';
    for (let i = 0; i < 12; i++) {
      raw += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 9)}-${raw.slice(9, 12)}`;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !team) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    const pw = password || generatePassword();
    try {
      const res = await fetch('/api/admin/team-passwords', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ team, password: pw }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? 'Failed to set password');
        return;
      }
      setIssued((prev) => [
        ...prev,
        ...json.data.affectedEmails.map((email: string) => ({
          team: json.data.team,
          email,
          password: pw,
          mustChangeOnLogin: true,
        })),
      ]);
      setSuccess(`Password set for ${json.data.team} (${json.data.affectedEmails.length} manager(s))`);
      setPassword('');
      setRevealCountdown(30);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    if (busy || !resetEmail) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/team-passwords', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? 'Failed to reset');
        return;
      }
      setResetIssued({
        team: '',
        email: json.data.email,
        password: json.data.plaintextPassword,
        mustChangeOnLogin: true,
      });
      setResetEmail('');
      setRevealCountdown(30);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return <div className="p-8 text-slate-600">Loading…</div>;
  }
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          Admin access required.
        </div>
      </div>
    );
  }

  const { teams: allTeams } = useTeams();
  const teams = allTeams.filter((t) => t.name !== 'DEMO');

  return (
    <div className="page-container-narrow py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Team Manager Passwords
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Issue per-team passwords. Each manager will be forced to set a new password on first
          login. Plaintext is wiped from this page after {revealCountdown}s.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Set per-team password</h2>
          <p className="mt-1 text-xs text-slate-600">
            Set the same password for all captain emails of a team. Leave password blank to auto-generate.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
              >
                <option value="">— select team —</option>
                {teams.map((t) => (
                  <option key={t.shortName} value={t.shortName}>
                    {t.shortName} ({t.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password (optional)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="leave blank to generate"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !team}
              className="btn-primary w-full h-auto rounded-md py-2 text-sm font-medium disabled:opacity-60"
            >
              {busy ? 'Setting…' : 'Set team password'}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Reset single manager</h2>
          <p className="mt-1 text-xs text-slate-600">
            Generate a new password for one manager email.
          </p>
          <form onSubmit={onReset} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Manager email
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="manager@example.com"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !resetEmail}
              className="w-full inline-flex h-auto items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 transition-colors"
            >
              {busy ? 'Resetting…' : 'Generate new password'}
            </button>
          </form>
        </section>
      </div>

      {error ? (
        <div className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {(issued.length > 0 || resetIssued) && (
        <section className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium text-amber-900">
              ⚠️ Plaintext passwords — copy NOW
            </h2>
            {revealCountdown > 0 ? (
              <span className="text-sm text-amber-700">
                Auto-wipe in {revealCountdown}s
              </span>
            ) : (
              <span className="text-sm text-amber-700">Wiped</span>
            )}
          </div>
          <ul className="space-y-1 font-mono text-sm text-amber-900">
            {issued.map((it, i) => (
              <li key={i}>
                {revealCountdown > 0 ? (
                  <>
                    <span className="font-semibold">{it.team}</span> / {it.email} → <span className="rounded bg-amber-100 px-1">{it.password}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{it.team}</span> / {it.email} → <span className="text-amber-700/50">[wiped]</span>
                  </>
                )}
              </li>
            ))}
            {resetIssued && (revealCountdown > 0 ? (
              <li>
                <span className="font-semibold">reset</span> / {resetIssued.email} → <span className="rounded bg-amber-100 px-1">{resetIssued.password}</span>
              </li>
            ) : null)}
          </ul>
        </section>
      )}
    </div>
  );
}