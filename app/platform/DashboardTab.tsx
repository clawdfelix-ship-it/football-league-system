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

  if (loading) return <p className="text-sm text-slate-500">載入中…</p>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return null;

  return (
    <div>
      {/* Totals cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="活躍聯賽" value={data.totals.activeLeagues} />
        <StatCard label="總隊數" value={data.totals.totalTeams} />
        <StatCard label="總球員" value={data.totals.totalPlayers} />
        <StatCard label="總比賽" value={data.totals.totalMatches} />
      </div>

      {/* League table */}
      {data.leagues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          暫無聯賽
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
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
                      <p className="text-xs text-slate-500">{l.name}</p>
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
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
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
      )}
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
