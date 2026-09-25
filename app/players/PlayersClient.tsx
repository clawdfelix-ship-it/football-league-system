'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';
import type { PublicPlayer } from '@/lib/public-types';
import { TEAMS } from '@/lib/constants';

function PlayersPageInner(props: { initialPlayers: PublicPlayer[] }) {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get('team');

  const [players] = useState<PublicPlayer[]>(props.initialPlayers);
  const [selectedTeam, setSelectedTeam] = useState<string>(
    teamParam?.trim().toUpperCase() ?? '',
  );
  const [query, setQuery] = useState('');

  const realTeams = useMemo(() => TEAMS.filter((x) => x.name !== 'DEMO'), []);
  const validTeams = useMemo(() => new Set(realTeams.map((x) => x.name)), [realTeams]);
  const activeTeam = validTeams.has(selectedTeam) ? selectedTeam : '';

  const filtered = useMemo(() => {
    // 永遠排除 DEMO 測試隊球員
    const real = players.filter((p) => (p.team ?? '').trim().toUpperCase() !== 'DEMO');
    const byTeam = activeTeam
      ? real.filter((p) => (p.team ?? '').toUpperCase() === activeTeam)
      : real;

    const q = query.trim().toLowerCase();
    const byQuery = q
      ? byTeam.filter(
          (p) =>
            (p.name ?? '').toLowerCase().includes(q) ||
            String(p.jerseyNumber ?? '').includes(q) ||
            (p.position ?? '').toLowerCase().includes(q),
        )
      : byTeam;

    return byQuery.slice().sort((a, b) => {
      const ta = (a.team ?? '').toString();
      const tb = (b.team ?? '').toString();
      if (ta !== tb) return ta.localeCompare(tb);
      const na = a.jerseyNumber ?? 999;
      const nb = b.jerseyNumber ?? 999;
      if (na !== nb) return na - nb;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [players, activeTeam, query]);

  // 每隊人數（用嚟顯示喺 chip 上）
  const teamCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of players) {
      const team = (p.team ?? '').trim().toUpperCase();
      if (team === 'DEMO') continue;
      map.set(team, (map.get(team) ?? 0) + 1);
    }
    return map;
  }, [players]);

  const title = activeTeam
    ? `${activeTeam} ${t('球員名單', 'Players')}`
    : t('所有球員', 'All Players');

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-20 px-6 text-center">
          <h2 className="text-5xl font-black italic mb-2 tracking-tight">{title}</h2>
          <p className="text-blue-200 text-base font-light tracking-widest uppercase">
            Hong Kong Bank League 2026
          </p>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 pb-20">
          {/* 搜尋框 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-3 mb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('搜尋球員名稱、號碼、位置', 'Search name, number, position')}
                className="w-full pl-9 pr-9 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              {query && (
                <button
                  type="button"
                  aria-label={t('清除', 'Clear')}
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition active:scale-90"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* 球隊分段（橫向滑動） */}
            <div className="border-b border-slate-100">
              <div className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TeamChip
                  active={activeTeam === ''}
                  label={t('全部', 'All')}
                  count={teamCounts.size ? filtered.length : 0}
                  forceCount={players.filter((p) => (p.team ?? '').toUpperCase() !== 'DEMO').length}
                  showCount={activeTeam === ''}
                  onClick={() => setSelectedTeam('')}
                />
                {realTeams.map((team) => (
                  <TeamChip
                    key={team.name}
                    active={activeTeam === team.name}
                    label={language === 'zh' ? team.shortName : team.name}
                    sublabel={language === 'zh' ? team.nameZh : undefined}
                    count={teamCounts.get(team.name) ?? 0}
                    showCount={activeTeam === team.name}
                    onClick={() => setSelectedTeam(team.name)}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {t('人數', 'Count')}: {filtered.length}
              </div>
              {activeTeam ? (
                <a
                  href="/teams"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  {t('返回球隊', 'Back to Teams')} →
                </a>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                {query
                  ? t('搵唔到符合嘅球員', 'No players match your search')
                  : t('暫無球員資料', 'No players')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((p, i) => (
                  <div
                    key={p.id}
                    className="p-4 flex items-center justify-between animate-[playerfade_0.35s_ease_both]"
                    style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 bg-slate-900 text-white px-2 py-1 rounded-md text-xs font-black">
                        #{p.jerseyNumber ?? '-'}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {(p.team ?? '').toString()} {p.position ? `• ${p.position}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes playerfade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </HomeLayout>
  );
}

function TeamChip(props: {
  active: boolean;
  label: string;
  sublabel?: string;
  count: number;
  forceCount?: number;
  showCount: boolean;
  onClick: () => void;
}) {
  const shown = props.showCount ? (props.forceCount ?? props.count) : props.count;
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-semibold whitespace-nowrap transition active:scale-95 ${
        props.active
          ? 'bg-[#1a237e] text-white shadow-md'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {props.label}
      {props.sublabel ? (
        <span className={props.active ? 'text-blue-200' : 'text-slate-400'}>
          {' '}
          {props.sublabel}
        </span>
      ) : null}
      <span className={`ml-1.5 text-xs ${props.active ? 'text-blue-200' : 'text-slate-400'}`}>
        {shown}
      </span>
    </button>
  );
}

export default function PlayersClient(props: { initialPlayers: PublicPlayer[] }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading...</div>}>
      <PlayersPageInner initialPlayers={props.initialPlayers} />
    </Suspense>
  );
}
