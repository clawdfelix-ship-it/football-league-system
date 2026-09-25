'use client';

import { useMemo, useState } from 'react';
import HomeLayout from '@/components/HomeLayout';
import MatchWeather from '@/components/MatchWeather';
import ShareMatch from '@/components/ShareMatch';
import { KIT_COLORS } from '@/lib/kitColors';
import { venueMapsUrl } from '@/lib/weather';
import { googleCalendarUrl } from '@/lib/calendar';
import { useLanguage } from '@/context/LanguageContext';

export type Team = { name: string; homeKitColor: string; awayKitColor: string };

export type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: Date | string | null;
  venue: string | null;
  round: string | null;
  status: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

type FilterMode = 'all' | 'upcoming' | 'finished';

export default function FixturesClient(props: {
  matches: Match[];
  teams: Record<string, Team>;
  allOverrides: Record<number, Record<string, string>>;
}) {
  const { t } = useLanguage();
  const { matches, teams, allOverrides } = props;

  const [mode, setMode] = useState<FilterMode>('all');
  const [round, setRound] = useState('');

  const rounds = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      if (m.round) set.add(m.round);
    }
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10);
      const nb = parseInt(b.replace(/\D/g, ''), 10);
      return (Number.isNaN(na) ? 99 : na) - (Number.isNaN(nb) ? 99 : nb);
    });
  }, [matches]);

  const getKitColor = (matchId: number, teamName: string, isHome: boolean) => {
    const team = teams[teamName];
    if (!team) return KIT_COLORS[0];
    const normalizedName = teamName.trim().toUpperCase();
    const override = allOverrides[matchId]?.[normalizedName];
    const colorValue = override ?? (isHome ? team.homeKitColor : team.awayKitColor);
    return KIT_COLORS.find((c) => c.value === colorValue) || KIT_COLORS[0];
  };

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (mode === 'finished') return m.status === 'finished';
        if (mode === 'upcoming') return m.status !== 'finished';
        return true;
      })
      .filter((m) => (round ? m.round === round : true))
      .slice()
      .sort((a, b) => {
        // 未來賽事由近到遠、過去賽事由新到舊：統一用日期 desc
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });
  }, [matches, mode, round]);

  const counts = useMemo(() => {
    let upcoming = 0;
    let finished = 0;
    for (const m of matches) {
      if (m.status === 'finished') finished += 1;
      else upcoming += 1;
    }
    return { all: matches.length, upcoming, finished };
  }, [matches]);

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">FIXTURES</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">
            Upcoming Matches
          </p>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 pb-20">
          {/* 篩選列 */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterButton
                active={mode === 'all'}
                label={t('全部', 'All')}
                count={counts.all}
                onClick={() => setMode('all')}
              />
              <FilterButton
                active={mode === 'upcoming'}
                label={t('即將', 'Upcoming')}
                count={counts.upcoming}
                onClick={() => setMode('upcoming')}
              />
              <FilterButton
                active={mode === 'finished'}
                label={t('完場', 'Results')}
                count={counts.finished}
                onClick={() => setMode('finished')}
              />
            </div>

            <div className="sm:ml-auto flex items-center gap-2">
              <label htmlFor="round-select" className="text-sm text-slate-500 whitespace-nowrap">
                {t('輪次', 'Round')}
              </label>
              <select
                id="round-select"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="min-h-[44px] pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              >
                <option value="">{t('全部輪次', 'All rounds')}</option>
                {rounds.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center text-slate-500">
              {t('暫無符合嘅比賽', 'No matches match your filters')}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((match, i) => {
                const homeColor = getKitColor(match.id, match.homeTeam, true);
                const awayColor = getKitColor(match.id, match.awayTeam, false);

                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow animate-[fixturefade_0.35s_ease_both]"
                    style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {match.round || ''}
                      </span>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          match.status === 'finished'
                            ? 'bg-green-100 text-green-700'
                            : match.status === 'tbc'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {match.status === 'finished'
                          ? t('完場', 'Finished')
                          : match.status === 'tbc'
                            ? t('待定', 'TBC')
                            : t('即將進行', 'Upcoming')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      {/* Home Team */}
                      <div className="flex-1 text-right">
                        <div className="text-xl font-bold text-slate-800 mb-2">
                          {match.homeTeam}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-gray-500">{t('主場', 'Home')}</span>
                          <div
                            className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: homeColor.hex }}
                            title={`${t('主場球衣', 'Home kit')}：${homeColor.label}`}
                          />
                        </div>
                      </div>

                      {/* VS / Score */}
                      <div className="flex flex-col items-center px-2 sm:px-6">
                        {match.status === 'finished' ? (
                          <div className="text-3xl font-black text-slate-900">
                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-gray-400">VS</div>
                        )}
                        <div className="text-sm text-gray-500 mt-2 text-center">
                          <div>
                            {match.date
                              ? new Date(match.date).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                }) +
                                ' (' +
                                new Date(match.date).toLocaleDateString('en-GB', {
                                  weekday: 'short',
                                }) +
                                ')'
                              : 'TBC'}
                          </div>
                          <div>
                            {match.venue && !/^tbc$/i.test(match.venue.trim()) ? (
                              <a
                                href={venueMapsUrl(match.venue) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                📍 {match.venue}
                              </a>
                            ) : (
                              <>{match.venue || 'TBC'}</>
                            )}
                          </div>
                          {match.status !== 'finished' && match.date && (
                            <div className="mt-1.5 flex flex-col items-center gap-1.5">
                              <MatchWeather venue={match.venue} date={match.date} />
                              <div className="flex items-center gap-2">
                                {googleCalendarUrl({
                                  homeTeam: match.homeTeam,
                                  awayTeam: match.awayTeam,
                                  date: match.date,
                                  venue: match.venue,
                                  round: match.round,
                                }) && (
                                  <a
                                    href={googleCalendarUrl({
                                      homeTeam: match.homeTeam,
                                      awayTeam: match.awayTeam,
                                      date: match.date,
                                      venue: match.venue,
                                      round: match.round,
                                    })!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                                  >
                                    📅 {t('加入日曆', 'Calendar')}
                                  </a>
                                )}
                                <ShareMatch
                                  homeTeam={match.homeTeam}
                                  awayTeam={match.awayTeam}
                                  date={match.date}
                                  venue={match.venue}
                                  round={match.round}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 text-left">
                        <div className="text-xl font-bold text-slate-800 mb-2">
                          {match.awayTeam}
                        </div>
                        <div className="flex items-center justify-start gap-2">
                          <div
                            className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: awayColor.hex }}
                            title={`${t('客場球衣', 'Away kit')}：${awayColor.label}`}
                          />
                          <span className="text-sm text-gray-500">{t('客場', 'Away')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fixturefade {
          from {
            opacity: 0;
            transform: translateY(8px);
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

function FilterButton(props: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
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
      <span className={`ml-1.5 text-xs ${props.active ? 'text-blue-200' : 'text-slate-400'}`}>
        {props.count}
      </span>
    </button>
  );
}
