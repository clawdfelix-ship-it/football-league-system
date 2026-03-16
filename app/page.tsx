'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';
import { TEAMS } from '@/lib/constants';
import { getAnnouncements } from '@/lib/actions';
import type { Announcement } from '@/lib/schema';

export const dynamic = 'force-dynamic';

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

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string | null;
  status: string | null;
  round?: string | null;
}

function HomeContent() {
  const { t } = useLanguage();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState<Match[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fixturesRes, resultsRes, announcementsData] = await Promise.all([
        fetch('/api/matches?status=scheduled', { cache: 'no-store' }),
        fetch('/api/matches?status=finished', { cache: 'no-store' }),
        getAnnouncements()
      ]);
      
      const fixturesData = await fixturesRes.json();
      const resultsData = await resultsRes.json();
      
      const fixtures = fixturesData.matches || [];
      const results = resultsData.matches || [];
      
      // Sort fixtures by date ascending (soonest first)
      fixtures.sort((a: Match, b: Match) => {
        // TBC dates (null) should be at the bottom
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Sort results by date descending (latest first)
      results.sort((a: Match, b: Match) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Calculate standings from results
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
      
      // Initialize all teams
      TEAMS.forEach(team => ensureTeam(team.name));
      
      for (const match of results) {
        if (match.status !== 'finished') continue;
        
        const home = ensureTeam(match.homeTeam);
        const away = ensureTeam(match.awayTeam);
        
        home.played += 1;
        away.played += 1;
        
        home.goalsFor += match.homeScore || 0;
        home.goalsAgainst += match.awayScore || 0;
        away.goalsFor += match.awayScore || 0;
        away.goalsAgainst += match.homeScore || 0;
        
        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;
        
        if (match.homeScore > match.awayScore) {
          home.wins += 1;
          home.points += 3;
          away.losses += 1;
        } else if (match.homeScore < match.awayScore) {
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
      
      setStandings(standingsArray);
      setUpcomingFixtures(fixtures);
      setRecentResults(results);
      setAnnouncements(announcementsData);
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center flex flex-col items-center">
          <div className="mb-6 relative h-32 w-32">
            <Image
              src="/logo.png"
              alt="ZENEX Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">Hong Kong Bank League 2026</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026</p>
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
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center flex flex-col items-center">
          <div className="mb-6 relative h-32 w-32">
            <Image
              src="/logo.png"
              alt="ZENEX Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">Hong Kong Bank League 2026</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026</p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          <section id="standings" className="mb-12">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight">{t('積分榜 2026', 'League Table 2026')}</h3>
                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-black">{t('即時更新', 'LIVE UPDATE')}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center w-20">{t('排名', 'Rank')}</th>
                      <th className="px-6 py-4 text-left">{t('球隊', 'Team')}</th>
                      <th className="px-6 py-4 text-center bg-slate-200/50 text-slate-900">{t('分數', 'Points')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('踢咗', 'Played')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('贏', 'Won')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('和', 'Drawn')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('輸', 'Lost')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('入球', 'GF')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('失球', 'GA')}</th>
                      <th className="px-6 py-4 text-center text-slate-500 font-normal">{t('球差', 'GD')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                          {standings.length === 0 && upcomingFixtures.length === 0 && recentResults.length === 0 
                            ? "Database not initialized. Please run /api/init-db" 
                            : "No standings data available yet."}
                        </td>
                      </tr>
                    ) : (
                      standings.map((team, index) => (
                        <tr
                          key={team.teamName}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-black text-xl text-center text-slate-900">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 text-lg">{team.teamName}</td>
                          <td className="px-6 py-4 text-center bg-slate-50 text-slate-900 font-black text-2xl border-x border-slate-100">
                            {team.points}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-400">{team.played}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{team.wins}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{team.draws}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{team.losses}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{team.goalsFor}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{team.goalsAgainst}</td>
                          <td
                            className={`px-6 py-4 text-center font-bold ${
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
                {lastUpdatedAt && (
                  <span className="text-xs text-green-100">
                    {t('最後更新', 'Last update')}: {lastUpdatedAt.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                      <div className="text-left w-1/3">
                        <div className="font-bold text-slate-900">{match.homeTeam}</div>
                        <div className="text-xs text-slate-500">{t('主場', 'Home')}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="text-sm text-slate-600 font-bold">
                          {match.date ? new Date(match.date).toLocaleDateString('en-GB') : 'TBC'}
                        </div>
                        {match.date && (
                          <div className="text-sm text-slate-600">
                            {new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {match.round && (
                          <div className="text-xs font-bold text-green-600 mt-1 uppercase tracking-wide">
                            {match.round}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                          {match.venue || 'TBC'}
                        </div>
                      </div>
                      <div className="text-right w-1/3">
                        <div className="font-bold text-slate-900">{match.awayTeam}</div>
                        <div className="text-xs text-slate-500">{t('作客', 'Away')}</div>
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
                  recentResults.map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="text-left w-1/3">
                        <div className="font-bold text-slate-900">{match.homeTeam}</div>
                        <div className="text-xs text-slate-500">{match.date ? new Date(match.date).toLocaleDateString('en-GB') : ''}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-black text-lg text-slate-900">
                          {match.homeScore !== null ? match.homeScore : 0} - {match.awayScore !== null ? match.awayScore : 0}
                        </div>
                        <div className="text-xs text-slate-500">{t('完場', 'Final')}</div>
                        {match.round && (
                          <div className="text-[10px] text-slate-400 mt-1 uppercase">
                            {match.round}
                          </div>
                        )}
                      </div>
                      <div className="text-right w-1/3">
                        <div className="font-bold text-slate-900">{match.awayTeam}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {announcements.length > 0 && (
            <section id="announcements" className="mt-12">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">{t('場地公告', 'Venue Announcements')}</h3>
                  {lastUpdatedAt && (
                    <span className="text-xs text-slate-300">
                      {t('最後更新', 'Last update')}: {lastUpdatedAt.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {announcements.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">
                          {new Date(item.date).toLocaleDateString('en-GB')} {new Date(item.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
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

export default function Home() {
  return <HomeContent />;
}
