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

type LeagueRow = {
  id: number;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  createdAt: string | Date | null;
};

type AuditEventRow = {
  id: number;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: number | null;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | Date;
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-slate-200 text-slate-700',
};

const LEAGUE_STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-700',
  trial: 'bg-blue-100 text-blue-800',
  pending: 'bg-slate-100 text-slate-700',
};

const AUDIT_ACTION_LABEL: Record<string, string> = {
  'application.pending': '申請提交',
  'application.in_review': '開始審閱',
  'application.approved': '批准申請',
  'application.rejected': '拒絕申請',
  'application.withdrawn': '撤回申請',
  'application.update_notes': '更新備註',
  'application.provision': '開通聯賽',
  'league.suspend': '暫停聯賽',
  'league.reactivate': '恢復聯賽',
  'league.close': '關閉聯賽',
};

export default function ConsoleClient() {
  const [tab, setTab] = useState<'applications' | 'leagues' | 'audit'>('applications');
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadApplications = useCallback(async () => {
    const res = await fetch('/api/platform/applications', { cache: 'no-store' });
    const body = await res.json();
    if (res.status === 403) throw new Error('你不是平台管理員（需 PLATFORM_ADMIN_EMAILS）');
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setRows(body.data.applications);
  }, []);

  const loadLeagues = useCallback(async () => {
    const res = await fetch('/api/platform/leagues', { cache: 'no-store' });
    const body = await res.json();
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setLeagues(body.data.leagues);
  }, []);

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/platform/audit-events?limit=50', { cache: 'no-store' });
    const body = await res.json();
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setAuditEvents(body.data.events);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'applications') await loadApplications();
      else if (tab === 'leagues') await loadLeagues();
      else if (tab === 'audit') await loadAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [tab, loadApplications, loadLeagues, loadAudit]);

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

  async function leagueAct(id: number, action: 'suspend' | 'reactivate' | 'close') {
    const confirmMsg =
      action === 'close'
        ? '確定要關閉此聯賽？此操作不可還原。'
        : action === 'suspend'
          ? '確定要暫停此聯賽？'
          : '確定要恢復此聯賽？';
    if (!confirm(confirmMsg)) return;

    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/leagues/${id}/${action}`, {
        method: 'POST',
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

        {/* Tabs */}
        <nav className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              { key: 'applications', label: '申請' },
              { key: 'leagues', label: '已開通聯賽' },
              { key: 'audit', label: '審計日誌' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">載入中…</p>
        ) : tab === 'applications' ? (
          <ApplicationsTab
            rows={rows}
            busyId={busyId}
            act={act}
            provision={provision}
          />
        ) : tab === 'leagues' ? (
          <LeaguesTab leagues={leagues} busyId={busyId} leagueAct={leagueAct} />
        ) : (
          <AuditTab events={auditEvents} />
        )}
      </div>
    </div>
  );
}

/* ---------- Tab components ---------- */

function ApplicationsTab({
  rows,
  busyId,
  act,
  provision,
}: {
  rows: ApplicationRow[];
  busyId: number | null;
  act: (id: number, status: string) => Promise<void>;
  provision: (id: number) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        暫無申請
      </div>
    );
  }

  return (
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
                  <span className="rounded-full bg-[#0f172a]/10 px-2 py-0.5 text-xs font-semibold text-[#0f172a]">
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
                申請代稱：{a.requestedSlug || '—'} · 預計隊數：{a.teamCountEst ?? '—'}
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
  );
}

function LeaguesTab({
  leagues,
  busyId,
  leagueAct,
}: {
  leagues: LeagueRow[];
  busyId: number | null;
  leagueAct: (id: number, action: 'suspend' | 'reactivate' | 'close') => Promise<void>;
}) {
  if (leagues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        暫無已開通聯賽
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {leagues.map((l) => (
        <li
          key={l.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">{l.slug}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    LEAGUE_STATUS_STYLE[l.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {l.status}
                </span>
                {l.plan && (
                  <span className="rounded-full bg-[#0f172a]/10 px-2 py-0.5 text-xs font-semibold text-[#0f172a]">
                    {l.plan}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{l.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                開通於 {l.createdAt ? new Date(l.createdAt).toLocaleDateString('zh-HK') : '—'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {l.status === 'active' && (
                <>
                  <Btn tone="slate" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'suspend')}>
                    暫停
                  </Btn>
                  <Btn tone="red" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'close')}>
                    關閉
                  </Btn>
                </>
              )}
              {l.status === 'suspended' && (
                <>
                  <Btn tone="green" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'reactivate')}>
                    恢復
                  </Btn>
                  <Btn tone="red" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'close')}>
                    關閉
                  </Btn>
                </>
              )}
              {(l.status === 'trial' || l.status === 'pending') && (
                <Btn tone="green" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'reactivate')}>
                  恢復
                </Btn>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AuditTab({ events }: { events: AuditEventRow[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        暫無審計記錄
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li
          key={e.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {AUDIT_ACTION_LABEL[e.action] ?? e.action}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {e.targetLabel ?? `${e.targetType} #${e.targetId ?? '—'}`}
                {e.metadata && typeof e.metadata === 'object' && 'from' in e.metadata && 'to' in e.metadata
                  ? ` · ${String(e.metadata.from)} → ${String(e.metadata.to)}`
                  : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {new Date(e.createdAt).toLocaleString('zh-HK')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{e.actorEmail}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Shared button ---------- */

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
    indigo: 'border-[#0f172a] bg-[#0f172a] text-white hover:bg-[#1e293b]',
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
