'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import HomeLayout from '@/components/HomeLayout';
import Logo from '@/components/Logo';
import { useLanguage } from '@/context/LanguageContext';
import { TEAMS } from '@/lib/constants';
import { getKitColorInfo } from '@/lib/kitColors';
import { getMatchKitOverrideColorValueClient, getMatchKitOverridesLocal } from '@/lib/matchKitOverrides';
import type { PublicAnnouncement } from '@/lib/public-types';
import { apiJson } from '@/lib/api/client';

interface TeamStanding {
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

type TeamSetting = { name: string; homeKitColor: string; awayKitColor: string };

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string | null;
  venue: string | null;
  status: string | null;
  round?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function nextValidDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }
  return null;
}

function maxDate(items: unknown[], keys: string[]) {
  let max: Date | null = null;
  for (const item of items) {
    const rec = item as Record<string, unknown> | null;
    if (!rec) continue;
    for (const key of keys) {
      const d = nextValidDate(rec[key]);
      if (!d) continue;
      if (!max || d.getTime() > max.getTime()) max = d;
    }
  }
  return max;
}

function sortMatches(matches: Match[], direction: 'asc' | 'desc') {
  const sorted = matches.slice();
  sorted.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return direction === 'asc' ? diff : -diff;
  });
  return sorted;
}

function computeStandings(results: Match[]) {
  const table = new Map<string, TeamStanding>();
  const ensureTeam = (name: string) => {
    if (!table.has(name)) {
      table.set(name, {
        teamName: name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
    return table.get(name)!;
  };

  TEAMS.filter((team) => team.name !== 'DEMO').forEach((team) => ensureTeam(team.name));

  for (const match of results) {
    if (match.status !== 'finished') continue;
    const home = ensureTeam(match.homeTeam);
    const away = ensureTeam(match.awayTeam);
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    home.played += 1;
    away.played += 1;

    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (homeScore > awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (homeScore < awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      home.points += 1;
      away.draws += 1;
      away.points += 1;
    }
  }

  const standingsArray = Array.from(table.values());
  standingsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
  return standingsArray;
}

export default function HomeClient(props: {
  initial: {
    teamSettings: TeamSetting[];
    fixtures: Match[];
    results: Match[];
    announcements: PublicAnnouncement[];
  };
}) {
  const { t } = useLanguage();

  const initialTeams = useMemo(() => {
    const teamMap: Record<string, { homeKitColor: string; awayKitColor: string }> = {};
    for (const row of props.initial.teamSettings) {
      const normalizedName = row.name.trim().toUpperCase();
      if (!normalizedName) continue;
      teamMap[normalizedName] = {
        homeKitColor: row.homeKitColor || 'white',
        awayKitColor: row.awayKitColor || 'black',
      };
    }
    return teamMap;
  }, [props.initial.teamSettings]);

  const [teams, setTeams] = useState<Record<string, { homeKitColor: string; awayKitColor: string }>>(initialTeams);
  const [kitOverrides, setKitOverrides] = useState<Record<number, Record<string, string>>>({});
  const [showAllResults, setShowAllResults] = useState(false);
  const [upcomingFixtures, setUpcomingFixtures] = useState<Match[]>(() => {
    const fixtures = props.initial.fixtures.slice();
    fixtures.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return fixtures;
  });
  const [recentResults, setRecentResults] = useState<Match[]>(() => {
    const results = props.initial.results.slice();
    results.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return results;
  });
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>(props.initial.announcements);
  const [loading, setLoading] = useState(false);

  const standings = useMemo(() => computeStandings(recentResults), [recentResults]);
  const fixturesLastUpdatedAt = useMemo(() => maxDate(upcomingFixtures, ['updatedAt', 'createdAt']), [upcomingFixtures]);
  const announcementsLastUpdatedAt = useMemo(
    () => maxDate(announcements, ['updatedAt', 'createdAt']),
    [announcements]
  );

  // 先試 DB，5秒 timeout，唔得就用 localStorage
  useEffect(() => {
    const loadOverrides = async () => {
      const allMatches = [...upcomingFixtures, ...recentResults];
      const allOverrides: Record<number, Record<string, string>> = {};
      let useApiMode = true;
      
      for (const match of allMatches) {
        try {
          if (useApiMode) {
            // 5秒 timeout per request
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            
            const res = await Promise.race([
              fetch(`/api/matches/${match.id}/kit-overrides`),
              timeoutPromise
            ]);
            
            if (res && res.ok) {
              const data = await res.json();
              allOverrides[match.id] = data.overrides || {};
            } else {
              useApiMode = false;
              allOverrides[match.id] = getMatchKitOverridesLocal(match.id);
            }
          } else {
            allOverrides[match.id] = getMatchKitOverridesLocal(match.id);
          }
        } catch {
          useApiMode = false;
          allOverrides[match.id] = getMatchKitOverridesLocal(match.id);
        }
      }
      setKitOverrides(allOverrides);
    };
    loadOverrides();
  }, [upcomingFixtures, recentResults]);

  const getKitColor = (matchId: number, teamName: string, isHome: boolean) => {
    const normalizedName = teamName?.trim().toUpperCase();
    const team = teams[normalizedName || ''];
    const override = getMatchKitOverrideColorValueClient(kitOverrides, matchId, normalizedName || '');
    const colorValue = override ?? (isHome ? team?.homeKitColor : team?.awayKitColor);
    return getKitColorInfo(colorValue || 'white');
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [teamSettings, matchesRes, announcementsData] = await Promise.all([
        apiJson<{ teams: Array<{ name: string; homeKitColor: string; awayKitColor: string }> }>(
          await fetch('/api/teams/settings', { cache: 'no-store' })
        ),
        fetch('/api/matches', { cache: 'no-store' }),
        apiJson<{ announcements: PublicAnnouncement[] }>(
          await fetch('/api/announcements', { cache: 'no-store' })
        ),
      ]);
      const rawMatches = (await matchesRes.json()) as unknown;
      const allMatches = Array.isArray(rawMatches) ? (rawMatches as Match[]) : [];
      const fixtures = sortMatches(
        allMatches.filter((match) => match.status === 'scheduled' || match.status === 'tbc'),
        'asc'
      );
      const results = sortMatches(
        allMatches.filter((match) => match.status === 'finished'),
        'desc'
      );

      const teamMap: Record<string, { homeKitColor: string; awayKitColor: string }> = {};
      for (const trow of teamSettings.teams) {
        const normalizedName = trow.name.trim().toUpperCase();
        if (!normalizedName) continue;
        teamMap[normalizedName] = {
          homeKitColor: trow.homeKitColor || 'white',
          awayKitColor: trow.awayKitColor || 'black',
        };
      }
      setTeams(teamMap);
      setUpcomingFixtures(fixtures);
      setRecentResults(results);
      setAnnouncements(announcementsData.announcements || []);

      // Load kit overrides for all matches
      const allOverrides: Record<number, Record<string, string>> = {};
      for (const match of [...fixtures, ...results]) {
        try {
          const res = await fetch(`/api/matches/${match.id}/kit-overrides`);
          const data = await res.json();
          allOverrides[match.id] = data.overrides || {};
        } catch {
          // Ignore errors
        }
      }
      setKitOverrides(allOverrides);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasAnyData = standings.length > 0 || upcomingFixtures.length > 0 || recentResults.length > 0;

  if (loading && !hasAnyData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-14 pb-20 sm:pt-16 sm:pb-24 px-6 text-center flex flex-col items-center">
          <div className="mb-5 sm:mb-6 h-24 w-24 sm:h-32 sm:w-32">
            <Logo className="h-full w-full drop-shadow-lg" />
          </div>
          <h2 className="font-black italic mb-2 tracking-[-0.02em] leading-[1.05] text-balance text-[clamp(1.9rem,7vw,3.75rem)]">Hong Kong Bank League 2026</h2>
          <p className="text-blue-200 font-light tracking-widest uppercase text-[clamp(0.7rem,2.6vw,1.125rem)] text-balance">
            Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026
          </p>
        </header>
        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-14 pb-20 sm:pt-16 sm:pb-24 px-6 text-center flex flex-col items-center">
          <div className="mb-5 sm:mb-6 h-24 w-24 sm:h-32 sm:w-32">
            <Logo className="h-full w-full drop-shadow-lg" />
          </div>
          <h2 className="font-black italic mb-2 tracking-[-0.02em] leading-[1.05] text-balance text-[clamp(1.9rem,7vw,3.75rem)]">Hong Kong Bank League 2026</h2>
          <p className="text-blue-200 font-light tracking-widest uppercase text-[clamp(0.7rem,2.6vw,1.125rem)] text-balance">
            Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026
          </p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          <section id="standings" className="mb-12">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight">{t('積分榜 2026', 'League Table 2026')}</h3>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={loading}
                  className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-black disabled:opacity-70"
                >
                  {t('即時更新', 'LIVE UPDATE')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center w-20">{t('排名', 'Rank')}</th>
                      <th className="px-6 py-4 text-left">{t('球隊', 'Team')}</th>
                      <th className="px-3 md:px-6 py-4 text-center bg-slate-200/50 text-slate-900">{t('分數', 'Points')}</th>
                      <th className="px-3 md:px-6 py-4 text-center text-slate-500 font-normal">{t('踢咗', 'Played')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal hidden md:table-cell">{t('贏', 'Won')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal hidden md:table-cell">{t('和', 'Drawn')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal hidden md:table-cell">{t('輸', 'Lost')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal hidden md:table-cell">{t('入球', 'GF')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal hidden md:table-cell">{t('失球', 'GA')}</th>
                      <th className="px-3 md:px-6 py-4 text-center text-slate-500 font-normal">{t('球差', 'GD')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                          {upcomingFixtures.length === 0 && recentResults.length === 0
                            ? 'Database not initialized. Please run /api/init-db'
                            : 'No standings data available yet.'}
                        </td>
                      </tr>
                    ) : (
                      standings.map((team, index) => (
                        <tr
                          key={team.teamName}
                          className={`border-b border-slate-200 transition-colors ${
                            index === 0
                              ? 'bg-amber-50 hover:bg-amber-100/70'
                              : index === 1
                              ? 'bg-slate-100 hover:bg-slate-200/70'
                              : index === 2
                              ? 'bg-orange-50 hover:bg-orange-100/70'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-3 md:px-6 py-4 font-black text-xl text-center text-slate-900">
                            <span className="inline-flex items-center gap-1">
                              {index === 0 && <span title={t('冠軍', 'Champion')}>🥇</span>}
                              {index === 1 && <span title={t('亞軍', 'Runner-up')}>🥈</span>}
                              {index === 2 && <span title={t('季軍', 'Third place')}>🥉</span>}
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-4 font-bold text-slate-900 text-base md:text-lg whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              {(() => {
                                const info = getKitColorInfo(
                                  teams[team.teamName.trim().toUpperCase()]?.homeKitColor || 'white'
                                );
                                return (
                                  <span
                                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 shadow-sm"
                                    style={{
                                      background:
                                        info.type === 'split'
                                          ? `linear-gradient(135deg, ${info.hex} 0 50%, ${info.hex2} 50% 100%)`
                                          : info.hex,
                                    }}
                                    title={info.label}
                                  />
                                );
                              })()}
                              {team.teamName}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-4 text-center bg-slate-50 text-slate-900 font-black text-xl md:text-2xl border-x border-slate-100">
                            {team.points}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-center text-slate-400">{team.played}</td>
                          <td className="px-6 py-4 text-center text-slate-400 hidden md:table-cell">{team.wins}</td>
                          <td className="px-6 py-4 text-center text-slate-400 hidden md:table-cell">{team.draws}</td>
                          <td className="px-6 py-4 text-center text-slate-400 hidden md:table-cell">{team.losses}</td>
                          <td className="px-6 py-4 text-center text-slate-400 hidden md:table-cell">{team.goalsFor}</td>
                          <td className="px-6 py-4 text-center text-slate-400 hidden md:table-cell">{team.goalsAgainst}</td>
                          <td
                            className={`px-3 md:px-6 py-4 text-center font-bold ${
                              team.goalDifference > 0
                                ? 'text-green-600'
                                : team.goalDifference < 0
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                            }`}
                          >
                            {team.goalDifference > 0 ? '+' : ''}
                            {team.goalDifference}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="matches" className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-green-600 text-white px-8 py-5 flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight">{t('近期賽事', 'Upcoming Fixtures')}</h3>
                {fixturesLastUpdatedAt && (
                  <span className="text-xs text-green-100">
                    {t('最後更新', 'Last update')}:{' '}
                    {fixturesLastUpdatedAt.toLocaleString('en-GB', {
                      timeZone: 'Asia/Hong_Kong',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <div className="p-6 space-y-4">
                {upcomingFixtures.length === 0 ? (
                  <p className="text-center text-gray-500">{t('沒有近期賽事', 'No upcoming fixtures.')}</p>
                ) : (
                  upcomingFixtures.map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="text-left w-1/3 flex items-center gap-2">
                        {(() => {
                          const homeColor = getKitColor(match.id, match.homeTeam, true);
                          const isSplit = homeColor.type === 'split' && homeColor.hex2;
                          return (
                            <div
                              className="w-6 h-6 rounded-full border border-slate-300 shadow-sm flex-shrink-0"
                              style={
                                isSplit
                                  ? { background: `linear-gradient(135deg, ${homeColor.hex} 50%, ${homeColor.hex2} 50%)` }
                                  : { backgroundColor: homeColor.hex }
                              }
                              title={homeColor.label}
                            />
                          );
                        })()}
                        <div>
                          <div className="font-bold text-slate-900">{match.homeTeam}</div>
                          <div className="text-xs text-slate-500">{t('主場', 'Home')}</div>
                        </div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="text-sm text-slate-600 font-bold">
                          {match.date
                            ? `${new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} (${new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short' })})`
                            : 'TBC'}
                        </div>
                        {match.date && (
                          <div className="text-sm text-slate-600">
                            {new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {match.round && (
                          <div className="text-xs font-bold text-green-600 mt-1 uppercase tracking-wide">{match.round}</div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">{match.venue || 'TBC'}</div>
                      </div>
                      <div className="text-right w-1/3 flex items-center gap-2 justify-end">
                        <div>
                          <div className="font-bold text-slate-900">{match.awayTeam}</div>
                          <div className="text-xs text-slate-500">{t('作客', 'Away')}</div>
                        </div>
                        {(() => {
                          const awayColor = getKitColor(match.id, match.awayTeam, false);
                          const isSplit = awayColor.type === 'split' && awayColor.hex2;
                          return (
                            <div
                              className="w-6 h-6 rounded-full border border-slate-300 shadow-sm flex-shrink-0"
                              style={
                                isSplit
                                  ? { background: `linear-gradient(135deg, ${awayColor.hex} 50%, ${awayColor.hex2} 50%)` }
                                  : { backgroundColor: awayColor.hex }
                              }
                              title={awayColor.label}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-red-600 text-white px-8 py-5">
                <h3 className="text-xl font-bold tracking-tight">{t('最近結果', 'Recent Results')}</h3>
              </div>
              <div className="p-6 space-y-4">
                {recentResults.length === 0 ? (
                  <p className="text-center text-gray-500">{t('沒有最近結果', 'No recent results.')}</p>
                ) : (
                  <>
                    {(showAllResults ? recentResults : recentResults.slice(0, 5)).map((match) => (
                      <div
                        key={match.id}
                        className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="text-left w-1/3">
                          <div className="font-bold text-slate-900">{match.homeTeam}</div>
                          <div className="text-xs text-slate-500">
                            {match.date
                              ? `${new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} (${new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short' })})`
                              : ''}
                          </div>
                        </div>
                        <div className="text-center w-1/3">
                          <div className="font-black text-lg text-slate-900">
                            {match.homeScore !== null ? match.homeScore : 0} - {match.awayScore !== null ? match.awayScore : 0}
                          </div>
                          <div className="text-xs text-slate-500">{t('完場', 'Final')}</div>
                          {match.round && <div className="text-[10px] text-slate-400 mt-1 uppercase">{match.round}</div>}
                        </div>
                        <div className="text-right w-1/3">
                          <div className="font-bold text-slate-900">{match.awayTeam}</div>
                        </div>
                      </div>
                    ))}
                    
                    {recentResults.length > 5 && (
                      <button
                        onClick={() => setShowAllResults(!showAllResults)}
                        className="w-full py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors mt-2"
                      >
                        {showAllResults
                          ? `${t('收起', 'Show Less')} ▲`
                          : `${t('顯示更多', `Show ${recentResults.length - 5} More Results`)} ▼`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {announcements.length > 0 && (
            <section id="announcements" className="mt-12">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">{t('場地公告', 'Venue Announcements')}</h3>
                  {announcementsLastUpdatedAt && (
                    <span className="text-xs text-slate-300">
                      {t('最後更新', 'Last update')}:{' '}
                      {announcementsLastUpdatedAt.toLocaleString('en-GB', {
                        timeZone: 'Asia/Hong_Kong',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {announcements.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">
                          {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} (
                          {new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short' })}){' '}
                          {new Date(item.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </HomeLayout>
  );
}
