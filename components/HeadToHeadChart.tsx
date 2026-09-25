'use client';

import { useMemo } from 'react';
import { TEAMS } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';

interface MatchSummary {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
}

interface TeamTotals {
  name: string;
  shortName: string;
  nameZh: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
}

const EMPTY: Omit<TeamTotals, 'name' | 'shortName' | 'nameZh'> = {
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  gf: 0,
  ga: 0,
  points: 0,
};

export default function HeadToHeadChart({ serverMatches }: { serverMatches: MatchSummary[] }) {
  const { language } = useLanguage();

  const { rows, maxPlayed } = useMemo(() => {
    const teams = TEAMS.filter((t) => t.name !== 'DEMO');
    const map = new Map<string, TeamTotals>();
    for (const t of teams) {
      map.set(t.name, { name: t.name, shortName: t.shortName, nameZh: t.nameZh, ...EMPTY });
    }

    for (const m of serverMatches) {
      if (m.status !== 'finished' || m.homeScore === null || m.awayScore === null) continue;
      const home = map.get(m.homeTeam);
      const away = map.get(m.awayTeam);
      if (!home || !away) continue;

      home.played += 1;
      away.played += 1;
      home.gf += m.homeScore;
      home.ga += m.awayScore;
      away.gf += m.awayScore;
      away.ga += m.homeScore;

      if (m.homeScore > m.awayScore) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (m.homeScore < m.awayScore) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    }

    const list = Array.from(map.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdB = b.gf - b.ga;
      const gdA = a.gf - a.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });

    return { rows: list, maxPlayed: Math.max(1, ...list.map((r) => r.played)) };
  }, [serverMatches]);

  const seg = (n: number) => `${(n / maxPlayed) * 100}%`;

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-4">
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-sm bg-green-600" /> 勝 Win
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-sm bg-amber-500" /> 和 Draw
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-sm bg-red-600" /> 負 Loss
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" /> 未踢 Remaining
        </span>
        <span className="text-slate-400">（按積分排序 · sorted by points）</span>
      </div>

      <div className="space-y-2.5">
        {rows.map((r, i) => {
          const label = language === 'zh' ? r.nameZh : r.name;
          const hasGames = r.played > 0;
          return (
            <div key={r.name} className="flex items-center gap-3">
              <div className="w-5 shrink-0 text-xs font-bold text-slate-400 text-right">{i + 1}</div>
              <div className="w-24 shrink-0 text-[11px] leading-tight font-bold text-slate-800" title={r.name}>
                {label}
              </div>

              <div className="flex-1 h-7 bg-slate-100 rounded-md overflow-hidden flex">
                <div
                  className="h-full bg-green-600 flex items-center justify-center text-[11px] font-bold text-white transition-[width] duration-500"
                  style={{ width: seg(r.wins) }}
                  title={`勝 ${r.wins}`}
                >
                  {r.wins > 0 ? r.wins : ''}
                </div>
                <div
                  className="h-full bg-amber-500 flex items-center justify-center text-[11px] font-bold text-white transition-[width] duration-500"
                  style={{ width: seg(r.draws) }}
                  title={`和 ${r.draws}`}
                >
                  {r.draws > 0 ? r.draws : ''}
                </div>
                <div
                  className="h-full bg-red-600 flex items-center justify-center text-[11px] font-bold text-white transition-[width] duration-500"
                  style={{ width: seg(r.losses) }}
                  title={`負 ${r.losses}`}
                >
                  {r.losses > 0 ? r.losses : ''}
                </div>
                {!hasGames ? (
                  <div className="flex-1 flex items-center px-2 text-[11px] text-slate-400">
                    暫無比賽
                  </div>
                ) : null}
              </div>

              <div className="w-14 shrink-0 text-right">
                <span className="text-sm font-black text-[#1a237e]">{r.points}</span>
                <span className="text-[10px] text-slate-400"> pts</span>
              </div>
              <div className="hidden sm:block w-16 shrink-0 text-right text-[11px] text-slate-500">
                {r.gf}:{r.ga}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
