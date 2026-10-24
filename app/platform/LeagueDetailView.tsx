'use client';

import { useCallback, useEffect, useState } from 'react';

type LeagueDetails = {
  league: {
    id: number;
    slug: string;
    name: string;
    status: string;
    plan: string | null;
    createdAt: string;
  };
  stats: {
    teamCount: number;
    playerCount: number;
    matchCount: number;
    announcementCount: number;
  };
  recentMatches: Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    matchDate: string | null;
    updatedAt: string | null;
  }>;
  managers: Array<{
    id: number;
    email: string;
    username: string;
    role: string | null;
    lastSignIn: string | null;
  }>;
  recentActivity: Array<{
    kind: 'match' | 'team' | 'player' | 'announcement';
    label: string;
    happenedAt: string | null;
  }>;
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-700',
  trial: 'bg-blue-100 text-blue-800',
};

const KIND_LABEL: Record<string, string> = {
  match: '比賽',
  team: '球隊',
  player: '球員',
  announcement: '公告',
};

export default function LeagueDetailView({
  leagueId,
  onBack,
}: {
  leagueId: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<LeagueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/platform/leagues/${leagueId}/details`, { cache: 'no-store' });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
      setData(body.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: 'suspend' | 'reactivate' | 'close') {
    const confirmMsg =
      action === 'close'
        ? '確定要關閉此聯賽？此操作不可還原。'
        : action === 'suspend'
          ? '確定要暫停此聯賽？'
          : '確定要恢復此聯賽？';
    if (!confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/platform/leagues/${leagueId}/${action}`, { method: 'POST' });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '操作失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失敗');
    } finally {
      setBusy(false);
    }
  }

  async function impersonate() {
    if (!confirm('以平台管理員身份進入此聯賽後台？此動作會記入審計日誌。')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/platform/leagues/${leagueId}/impersonate`, { method: 'POST' });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || 'Impersonate 失敗');
      const token = body.data.token;
      const slug = data?.league.slug;
      window.open(`https://${slug}.zenex-sports.com/auth/impersonate?token=${token}`, '_blank');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impersonate 失敗');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">載入中…</p>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return null;

  const { league, stats, recentMatches, managers, recentActivity } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ← 返回
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{league.slug}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  STATUS_STYLE[league.status] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                {league.status}
              </span>
              {league.plan && (
                <span className="rounded-full bg-[#0f172a]/10 px-2 py-0.5 text-xs font-semibold text-[#0f172a]">
                  {league.plan}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {league.name} · 開通於 {new Date(league.createdAt).toLocaleDateString('zh-HK')}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5">
          <ActionBtn tone="indigo" disabled={busy} onClick={() => void impersonate()}>
            進入聯賽後台 →
          </ActionBtn>
          {league.status === 'active' && (
            <ActionBtn disabled={busy} onClick={() => void act('suspend')}>
              暫停
            </ActionBtn>
          )}
          {league.status === 'suspended' && (
            <ActionBtn tone="green" disabled={busy} onClick={() => void act('reactivate')}>
              恢復
            </ActionBtn>
          )}
          {league.status !== 'closed' && (
            <ActionBtn tone="red" disabled={busy} onClick={() => void act('close')}>
              關閉
            </ActionBtn>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="球隊" value={stats.teamCount} />
        <StatCard label="球員" value={stats.playerCount} />
        <StatCard label="比賽" value={stats.matchCount} />
        <StatCard label="公告" value={stats.announcementCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent matches */}
        <Section title="最近比賽">
          {recentMatches.length === 0 ? (
            <Empty text="暫無比賽" />
          ) : (
            <ul className="space-y-2">
              {recentMatches.map((m) => (
                <li key={m.id} className="text-sm">
                  <span className="font-medium text-slate-900">
                    {m.homeTeam} vs {m.awayTeam}
                  </span>
                  {m.homeScore != null && m.awayScore != null && (
                    <span className="ml-2 text-slate-600">
                      {m.homeScore}:{m.awayScore}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-slate-400">{m.matchDate ?? ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Managers */}
        <Section title="Manager 帳號">
          {managers.length === 0 ? (
            <Empty text="暫無 manager" />
          ) : (
            <ul className="space-y-2">
              {managers.map((m) => (
                <li key={m.id} className="text-sm">
                  <span className="font-medium text-slate-900">{m.username}</span>
                  <span className="ml-2 text-slate-600">{m.email}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {m.lastSignIn
                      ? `最後活動 ${new Date(m.lastSignIn).toLocaleDateString('zh-HK')}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Recent activity */}
      <div className="mt-4">
        <Section title="近期活動">
          {recentActivity.length === 0 ? (
            <Empty text="暫無活動" />
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {KIND_LABEL[a.kind] ?? a.kind}
                  </span>
                  <span className="text-slate-700">{a.label}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {a.happenedAt ? new Date(a.happenedAt).toLocaleString('zh-HK') : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}

function ActionBtn({
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
