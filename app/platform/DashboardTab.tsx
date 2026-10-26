'use client';

import { useCallback, useEffect, useState } from 'react';

type OverviewRow = {
  leagueId: number;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  teamCount: number;
  playerCount: number;
  matchCount: number;
  lastActivityAt: string | Date | null;
};

type OverviewTotals = {
  activeLeagues: number;
  suspendedLeagues: number;
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
};

type OverviewData = {
  leagues: OverviewRow[];
  totals: OverviewTotals;
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-700',
  trial: 'bg-blue-100 text-blue-800',
  pending: 'bg-slate-100 text-slate-700',
};

export default function DashboardTab({
  onSelectLeague,
}: {
  onSelectLeague: (leagueId: number) => void;
}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/platform/overview', { cache: 'no-store' });
      const body = await res.json();
      if (res.status === 403) throw new Error('你不是平台管理員');
      if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
      setData(body.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-slate-600">載入中…</p>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return null;

  return (
    <div>
      {/* Totals cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="活躍聯賽" value={data.totals.activeLeagues} />
        <StatCard label="總隊數" value={data.totals.totalTeams} />
        <StatCard label="總球員" value={data.totals.totalPlayers} />
        <StatCard label="總比賽" value={data.totals.totalMatches} />
      </div>

      {/* League list — mobile: dark stat tiles (v4 prototype, Felix picked 2026-10-26);
          desktop (md+): classic table. Two renders share the same data. */}
      {data.leagues.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
          暫無聯賽
        </div>
      ) : (
        <>
          {/* Mobile tiles (<md) */}
          <div className="space-y-3 md:hidden">
            {data.leagues.map((l) => (
              <button
                key={l.leagueId}
                onClick={() => onSelectLeague(l.leagueId)}
                className="block w-full rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4 text-left text-white shadow-md transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-white/60">{l.slug}.zenex-sports.com</p>
                    <h3 className="mt-1 text-base font-bold leading-snug">{l.name}</h3>
                  </div>
                  <span
                    className={`inline-block flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${
                      l.status === 'active'
                        ? 'bg-green-400/20 text-green-300'
                        : l.status === 'trial'
                          ? 'bg-blue-400/20 text-blue-300'
                          : l.status === 'suspended'
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-white/15 text-white/80'
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-2xl font-bold">{l.teamCount}</div>
                    <div className="text-[11px] text-white/60">球隊</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{l.playerCount}</div>
                    <div className="text-[11px] text-white/60">球員</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{l.matchCount}</div>
                    <div className="text-[11px] text-white/60">比賽</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span>
                    {l.lastActivityAt
                      ? `最新活動 ${new Date(l.lastActivityAt).toLocaleDateString('zh-HK')}`
                      : '未有活動'}
                  </span>
                  <span className="font-semibold text-white">詳情 →</span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop table (md+) */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">聯賽</th>
                <th className="px-4 py-3 text-center">狀態</th>
                <th className="px-4 py-3 text-right">隊</th>
                <th className="px-4 py-3 text-right">球員</th>
                <th className="px-4 py-3 text-right">比賽</th>
                <th className="px-4 py-3 text-right">最新活動</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.leagues.map((l) => (
                <tr
                  key={l.leagueId}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{l.slug}</p>
                      <p className="text-xs text-slate-600">{l.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_STYLE[l.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{l.teamCount}</td>
                  <td className="px-4 py-3 text-right">{l.playerCount}</td>
                  <td className="px-4 py-3 text-right">{l.matchCount}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-600">
                    {l.lastActivityAt
                      ? new Date(l.lastActivityAt).toLocaleDateString('zh-HK')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectLeague(l.leagueId)}
                      className="rounded-lg border border-[#0f172a] bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e293b]"
                    >
                      詳情 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
