'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getStandings, getMatches } from '@/lib/actions';
import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

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
  date: { toLocaleDateString: (locale: string) => string; toLocaleTimeString: (locale: string, options?: object) => string };
  venue: string | null;
  status: string | null;
}

function HomeContent() {
  const { t } = useLanguage();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState<Match[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [standingsData, fixturesData, resultsData] = await Promise.all([
        getStandings(),
        getMatches('scheduled'),
        getMatches('finished')
      ]);
      setStandings(standingsData);
      setUpcomingFixtures(fixturesData);
      setRecentResults(resultsData);
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
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Partnered with ZENEX SPORTS | 香港銀行友誼足球聯賽2026</p>
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
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Partnered with ZENEX SPORTS | 香港銀行友誼足球聯賽2026</p>
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
                      <th className="px-6 py-4 text-left">{t('排名', 'Rank')}</th>
                      <th className="px-6 py-4 text-left">{t('球隊', 'Team')}</th>
                      <th className="px-6 py-4 text-center">{t('踢咗', 'Played')}</th>
                      <th className="px-6 py-4 text-center">{t('贏', 'Won')}</th>
                      <th className="px-6 py-4 text-center">{t('和', 'Drawn')}</th>
                      <th className="px-6 py-4 text-center">{t('輸', 'Lost')}</th>
                      <th className="px-6 py-4 text-center">{t('入球', 'GF')}</th>
                      <th className="px-6 py-4 text-center">{t('失球', 'GA')}</th>
                      <th className="px-6 py-4 text-center">{t('球差', 'GD')}</th>
                      <th className="px-6 py-4 text-center">{t('分數', 'Points')}</th>
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
                          <td className="px-6 py-4 font-black text-lg text-slate-900">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{team.teamName}</td>
                          <td className="px-6 py-4 text-center text-slate-600">{team.played}</td>
                          <td className="px-6 py-4 text-center text-green-600 font-bold">{team.wins}</td>
                          <td className="px-6 py-4 text-center text-yellow-600 font-bold">{team.draws}</td>
                          <td className="px-6 py-4 text-center text-red-600 font-bold">{team.losses}</td>
                          <td className="px-6 py-4 text-center text-slate-600">{team.goalsFor}</td>
                          <td className="px-6 py-4 text-center text-slate-600">{team.goalsAgainst}</td>
                          <td
                            className={`px-6 py-4 text-center font-bold ${
                              team.goalDifference > 0
                                ? 'text-green-600'
                                : team.goalDifference < 0
                                ? 'text-red-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {team.goalDifference > 0 ? '+' : ''}
                            {team.goalDifference}
                          </td>
                          <td className="px-6 py-4 text-center bg-slate-900 text-yellow-400 font-black text-lg">
                            {team.points}
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
              <div className="bg-green-600 text-white px-8 py-5">
                <h3 className="text-xl font-bold tracking-tight">{t('近期賽事', 'Upcoming Fixtures')}</h3>
              </div>
              <div className="p-6 space-y-4">
                {upcomingFixtures.length === 0 ? (
                  <p className="text-center text-gray-500">{t('沒有近期賽事', 'No upcoming fixtures.')}</p>
                ) : (
                  upcomingFixtures.slice(0, 5).map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="text-left w-1/3">
                        <div className="font-bold text-slate-900">{match.homeTeam}</div>
                        <div className="text-xs text-slate-500">{t('主場', 'Home')}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="text-sm text-slate-600">
                          {match.date.toLocaleDateString('en-GB')}
                        </div>
                         <div className="text-sm text-slate-600">
                          {match.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500">{match.venue}</div>
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
                  recentResults.slice(0, 5).map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="text-left w-1/3">
                        <div className="font-bold text-slate-900">{match.homeTeam}</div>
                        <div className="text-xs text-slate-500">{match.date.toLocaleDateString('en-GB')}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-black text-lg text-slate-900">{match.homeScore} - {match.awayScore}</div>
                        <div className="text-xs text-slate-500">{t('完場', 'Final')}</div>
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
        </main>
      </div>
    </HomeLayout>
  );
}

export default function Home() {
  return <HomeContent />;
}
