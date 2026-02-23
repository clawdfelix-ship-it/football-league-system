import React from 'react';
import { getStandings } from '@/lib/actions';
import HomeLayout from '@/components/HomeLayout';

// --- Mock data for upcoming matches ---
const MOCK_FIXTURES = [
  { home: "熱刺", away: "阿森納", time: "20:00", date: "2026-02-28", venue: "熱刺球場" },
  { home: "切爾西", away: "利物浦", time: "19:30", date: "2026-03-05", venue: "斯坦福橋" },
];

// --- Mock data for results ---
const MOCK_RESULTS = [
  { home: "曼城", away: "利物浦", score: "2 - 1", date: "2026-02-20" },
  { home: "阿森納", away: "切爾西", score: "1 - 1", date: "2026-02-21" },
  { home: "利物浦", away: "阿森納", score: "3 - 0", date: "2026-02-22" },
  { home: "切爾西", away: "曼城", score: "1 - 2", date: "2026-02-23" },
];

export default async function Home() {
  const standings = await getStandings();
  
  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        {/* Hero 橫幅 */}
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">EXCELLENCE IN MOTION</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Official League Information Hub</p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          
          {/* 積分表 Section */}
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
                      <th className="px-6 py-4 text-left">排名</th>
                      <th className="px-6 py-4 text-left">球隊</th>
                      <th className="px-6 py-4 text-center">比賽</th>
                      <th className="px-6 py-4 text-center">勝</th>
                      <th className="px-6 py-4 text-center">和</th>
                      <th className="px-6 py-4 text-center">負</th>
                      <th className="px-6 py-4 text-center">入球</th>
                      <th className="px-6 py-4 text-center">失球</th>
                      <th className="px-6 py-4 text-center">球差</th>
                      <th className="px-6 py-4 text-center">積分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, index) => (
                      <tr key={team.teamName} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-black text-lg text-slate-900">{index + 1}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{team.teamName}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{team.played}</td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold">{team.wins}</td>
                        <td className="px-6 py-4 text-center text-yellow-600 font-bold">{team.draws}</td>
                        <td className="px-6 py-4 text-center text-red-600 font-bold">{team.losses}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{team.goalsFor}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{team.goalsAgainst}</td>
                        <td className={`px-6 py-4 text-center font-bold ${team.goalDifference > 0 ? 'text-green-600' : team.goalDifference < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </td>
                        <td className="px-6 py-4 text-center bg-slate-900 text-yellow-400 font-black text-lg">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 賽程賽果 Section */}
          <section id="matches" className="grid md:grid-cols-2 gap-8">
            {/* 即將舉行 */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-green-600 text-white px-8 py-5">
                <h3 className="text-xl font-bold tracking-tight">UPCOMING FIXTURES</h3>
              </div>
              <div className="p-6 space-y-4">
                {MOCK_FIXTURES.map((match, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-left">
                      <div className="font-bold text-slate-900">{match.home}</div>
                      <div className="text-xs text-slate-500">主場</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-600">{match.date} {match.time}</div>
                      <div className="text-xs text-slate-500">{match.venue}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{match.away}</div>
                      <div className="text-xs text-slate-500">客場</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近結果 */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-red-600 text-white px-8 py-5">
                <h3 className="text-xl font-bold tracking-tight">RECENT RESULTS</h3>
              </div>
              <div className="p-6 space-y-4">
                {MOCK_RESULTS.map((match, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-left">
                      <div className="font-bold text-slate-900">{match.home}</div>
                      <div className="text-xs text-slate-500">{match.date}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-black text-lg text-slate-900">{match.score}</div>
                      <div className="text-xs text-slate-500">FINAL</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{match.away}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </HomeLayout>
  );
}