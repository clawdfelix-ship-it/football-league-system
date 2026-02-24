import React from 'react';
import { getStandings, getMatches } from '@/lib/actions';
import HomeLayout from '@/components/HomeLayout';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let standings: any[] = [];
  let upcomingFixtures: any[] = [];
  let recentResults: any[] = [];

  try {
    standings = await getStandings();
    upcomingFixtures = await getMatches('scheduled');
    recentResults = await getMatches('finished');
  } catch (error) {
    console.error('Failed to fetch data from database:', error);
    // Continue rendering with empty data
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">EXCELLENCE IN MOTION</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Official League Information Hub</p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          <section id="standings" className="mb-12">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight">LEAGUE TABLE 2026</h3>
                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-black">LIVE UPDATE</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 text-left">Rank</th>
                      <th className="px-6 py-4 text-left">Team</th>
                      <th className="px-6 py-4 text-center">Played</th>
                      <th className="px-6 py-4 text-center">Won</th>
                      <th className="px-6 py-4 text-center">Drawn</th>
                      <th className="px-6 py-4 text-center">Lost</th>
                      <th className="px-6 py-4 text-center">GF</th>
                      <th className="px-6 py-4 text-center">GA</th>
                      <th className="px-6 py-4 text-center">GD</th>
                      <th className="px-6 py-4 text-center">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                          {standings.length === 0 && upcomingFixtures.length === 0 && recentResults.length === 0 
                            ? "Database not initialized or connection failed. Please run /api/init-db" 
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
                <h3 className="text-xl font-bold tracking-tight">UPCOMING FIXTURES</h3>
              </div>
              <div className="p-6 space-y-4">
                {upcomingFixtures.length === 0 ? (
                  <p className="text-center text-gray-500">No upcoming fixtures.</p>
                ) : (
                  upcomingFixtures.map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="text-left w-1/3">
                        <div className="font-bold text-slate-900">{match.homeTeam}</div>
                        <div className="text-xs text-slate-500">Home</div>
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
                        <div className="text-xs text-slate-500">Away</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-red-600 text-white px-8 py-5">
                <h3 className="text-xl font-bold tracking-tight">RECENT RESULTS</h3>
              </div>
              <div className="p-6 space-y-4">
                {recentResults.length === 0 ? (
                  <p className="text-center text-gray-500">No recent results.</p>
                ) : (
                  recentResults.map((match) => (
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
                        <div className="text-xs text-slate-500">Final</div>
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