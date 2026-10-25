'use client';

import { useLanguage } from '@/context/LanguageContext';

type TeamStat = { team: string; count: number; active: number; avgAge: number };

type Props = {
  loadError: boolean;
  stats: {
    totalPlayers: number;
    activePlayers: number;
    injuredPlayers: number;
    suspendedPlayers: number;
    inactivePlayers: number;
  };
  teamStats: TeamStat[];
  positionStats: Record<string, number>;
  ageGroups: Record<string, number>;
};

export default function DashboardView({
  loadError,
  stats,
  teamStats,
  positionStats,
  ageGroups,
}: Props) {
  const { t } = useLanguage();

  const cards = [
    { key: 'total', value: stats.totalPlayers, zh: '總球員數', en: 'Total players', tone: 'brand' },
    { key: 'active', value: stats.activePlayers, zh: '活躍', en: 'Active', tone: 'positive' },
    { key: 'injured', value: stats.injuredPlayers, zh: '受傷', en: 'Injured', tone: 'danger' },
    { key: 'suspended', value: stats.suspendedPlayers, zh: '停賽', en: 'Suspended', tone: 'warn' },
  ] as const;

  const toneText: Record<string, string> = {
    brand: 'text-[#0f172a]',
    positive: 'text-emerald-600',
    danger: 'text-red-600',
    warn: 'text-amber-600',
  };

  const positionEntries = Object.entries(positionStats);
  const ageEntries = Object.entries(ageGroups);
  const maxPosition = Math.max(1, ...positionEntries.map(([, n]) => n));
  const maxAge = Math.max(1, ...ageEntries.map(([, n]) => n));
  const maxTeam = Math.max(1, ...teamStats.map((s) => s.count));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <header className="bg-[#0f172a] bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white pt-14 pb-20 sm:pt-16 sm:pb-24 px-4 sm:px-6 text-center">
        <h2 className="font-bold mb-2 tracking-[-0.02em] leading-[1.05] text-balance text-[clamp(1.9rem,7vw,3.75rem)]">
          {t('數據總覽', 'DASHBOARD')}
        </h2>
        <p className="text-slate-300 font-normal tracking-widest uppercase text-[clamp(0.7rem,2.6vw,1.125rem)]">
          {t('聯賽統計', 'League Statistics')}
        </p>
      </header>

      <main className="page-container -mt-16 pb-20">
        {loadError ? (
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
            <div className="text-lg font-bold text-red-700">
              {t('無法載入球員數據', 'Unable to load player data')}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {t('請稍後重新整理；若持續出現請聯絡管理員。', 'Please refresh later or contact an admin.')}
            </p>
          </div>
        ) : stats.totalPlayers === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8 text-center">
            <div className="text-lg font-bold text-slate-800">
              {t('暫時未有球員數據', 'No player data yet')}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {t('球員名單建立後會在此顯示統計。', 'Stats will appear here once rosters are set up.')}
            </p>
          </div>
        ) : (
          <>
            {/* summary cards — semantic, not one-color-per-card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              {cards.map((c) => (
                <div key={c.key} className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                  <div className={`text-3xl font-bold tabular-nums ${toneText[c.tone]}`}>{c.value}</div>
                  <div className="text-sm text-slate-600 mt-1">{t(c.zh, c.en)}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* team stats with bars */}
              <Panel title={t('球隊統計', 'By team')}>
                <div className="space-y-3">
                  {teamStats.length === 0 && <Empty />}
                  {teamStats.map((team) => (
                    <div key={team.team} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate font-medium text-sm">{team.team}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0f172a]"
                          style={{ width: `${Math.round((team.count / maxTeam) * 100)}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-xs text-slate-500 tabular-nums">
                        {team.count} · {t('活躍', 'act')} {team.active}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* position distribution */}
              <Panel title={t('位置分布', 'By position')}>
                <div className="space-y-3">
                  {positionEntries.length === 0 && <Empty />}
                  {positionEntries.map(([pos, n]) => (
                    <div key={pos} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate font-medium text-sm">{pos}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#334155]"
                          style={{ width: `${Math.round((n / maxPosition) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums">{n}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* age distribution */}
              <Panel title={t('年齡分布', 'Age distribution')}>
                <div className="space-y-3">
                  {ageEntries.map(([range, n]) => (
                    <div key={range} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 font-medium text-sm">
                        {t(`${range} 歲`, `${range}`)}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#475569]"
                          style={{ width: `${Math.round((n / maxAge) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums">{n}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* status */}
              <Panel title={t('球員狀態', 'Status')}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Status label={t('活躍', 'Active')} value={stats.activePlayers} dot="bg-emerald-500" />
                  <Status label={t('受傷', 'Injured')} value={stats.injuredPlayers} dot="bg-red-500" />
                  <Status label={t('停賽', 'Suspended')} value={stats.suspendedPlayers} dot="bg-amber-500" />
                  <Status label={t('非活躍', 'Inactive')} value={stats.inactivePlayers} dot="bg-slate-400" />
                </div>
              </Panel>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
      <h3 className="text-base font-bold text-slate-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400">—</p>;
}

function Status({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="flex items-center gap-2 text-slate-700">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        {label}
      </span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
