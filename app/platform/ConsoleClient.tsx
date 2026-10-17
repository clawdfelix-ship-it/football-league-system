'use client';

import { useCallback, useEffect, useState } from 'react';

type ApplicationRow = {
  id: number;
  leagueName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  teamCountEst: number | null;
  notes: string | null;
  requestedSlug: string | null;
  status: string;
  reviewNotes: string | null;
  leagueId: number | null;
  createdAt: string | Date | null;
  reviewedAt: string | Date | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-slate-200 text-slate-700',
};

export default function ConsoleClient() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/platform/applications', { cache: 'no-store' });
      const body = await res.json();
      if (res.status === 403) throw new Error('你不是平台管理員（需 PLATFORM_ADMIN_EMAILS）');
      if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
      setRows(body.data.applications);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: number, status: string) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '操作失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失敗');
    } finally {
      setBusyId(null);
    }
  }

  async function provision(id: number) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/applications/${id}/provision`, {
        method: 'POST',
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || 'Provision 失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Provision 失敗');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="page-container-narrow">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">平台控制台</h1>
            <p className="text-sm text-slate-500">聯賽申請審批與開通</p>
          </div>
          <button
            onClick={() => void load()}
            className="btn-secondary h-8 rounded-lg px-3 py-1.5 text-sm font-medium"
          >
            重新整理
          </button>
        </header>

        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">載入中…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            暫無申請
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{a.leagueName}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.status}
                      </span>
                      {a.leagueId != null && (
                        <span className="rounded-full bg-[#1a237e]/10 px-2 py-0.5 text-xs font-semibold text-[#1a237e]">
                          league #{a.leagueId}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {a.contactName} ·{' '}
                      <a className="text-blue-600 hover:underline" href={`mailto:${a.contactEmail}`}>
                        {a.contactEmail}
                      </a>
                      {a.contactPhone ? ` · ${a.contactPhone}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      申請代稱：{a.requestedSlug || '—'} · 預計隊數：
                      {a.teamCountEst ?? '—'}
                    </p>
                    {a.notes && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {a.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(a.status === 'pending' || a.status === 'in_review') && (
                      <>
                        {a.status === 'pending' && (
                          <Btn disabled={busyId === a.id} onClick={() => void act(a.id, 'in_review')}>
                            開始審閱
                          </Btn>
                        )}
                        <Btn tone="green" disabled={busyId === a.id} onClick={() => void act(a.id, 'approved')}>
                          批准
                        </Btn>
                        <Btn tone="red" disabled={busyId === a.id} onClick={() => void act(a.id, 'rejected')}>
                          拒絕
                        </Btn>
                      </>
                    )}
                    {a.status === 'approved' && a.leagueId == null && (
                      <Btn tone="indigo" disabled={busyId === a.id} onClick={() => void provision(a.id)}>
                        開通聯賽
                      </Btn>
                    )}
                    {(a.status === 'rejected' || a.status === 'withdrawn') && (
                      <Btn disabled={busyId === a.id} onClick={() => void act(a.id, 'pending')}>
                        重新打開
                      </Btn>
                    )}
                    {(a.status === 'pending' || a.status === 'in_review') && (
                      <Btn tone="slate" disabled={busyId === a.id} onClick={() => void act(a.id, 'withdrawn')}>
                        撤回
                      </Btn>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  tone = 'slate',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'slate' | 'green' | 'red' | 'indigo';
}) {
  const tones: Record<string, string> = {
    slate: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
    green: 'border-green-600 bg-green-600 text-white hover:bg-green-700',
    red: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
    indigo: 'border-[#1a237e] bg-[#1a237e] text-white hover:bg-[#283593]',
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
