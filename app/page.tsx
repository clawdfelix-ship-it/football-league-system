import React from 'react';
import { getStandings } from '@/lib/actions';

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* 導航欄 */}
      <nav className="bg-[#1a237e] text-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-2xl font-black tracking-tighter italic text-yellow-400">ZENEX CUP</span>
          <div className="space-x-6 text-sm font-bold uppercase tracking-widest">
            <a href="#standings" className="hover:text-yellow-400 transition">積分表</a>
            <a href="#matches" className="hover:text-yellow-400 transition">賽程賽果</a>
          </div>
        </div>
      </nav>

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
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-tighter">
                    <th className="px-6 py-4 text-left">Pos</th>
                    <th className="px-6 py-4 text-left">Club</th>
                    <th className="px-6 py-4 text-center">P</th>
                    <th className="px-6 py-4 text-center">W</th>
                    <th className="px-6 py-4 text-center">D</th>
                    <th className="px-6 py-4 text-center">L</th>
                    <th className="px-6 py-4 text-center">GD</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-800">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standings.map((team, i) => (
                    <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-5 font-bold text-slate-300 group-hover:text-blue-600">{i + 1}</td>
                      <td className="px-6 py-5 font-black text-slate-800 text-lg">{team.teamName}</td>
                      <td className="px-6 py-5 text-center font-medium">{team.played}</td>
                      <td className="px-6 py-5 text-center text-green-600">{team.wins}</td>
                      <td className="px-6 py-5 text-center text-slate-400">{team.draws}</td>
                      <td className="px-6 py-5 text-center text-red-400">{team.losses}</td>
                      <td className="px-6 py-5 text-center font-mono">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                      <td className="px-6 py-5 text-center font-black text-2xl text-[#1a237e]">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div id="matches" className="grid lg:grid-cols-2 gap-10">
          
          {/* 賽果 Results */}
          <div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
              <span className="w-2 h-8 bg-red-600 rounded-full"></span> LATEST RESULTS
            </h3>
            <div className="space-y-4">
              {MOCK_RESULTS.map((m, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="flex justify-between items-center">
                    <div className="w-2/5 text-right font-bold text-lg">{m.home}</div>
                    <div className="flex flex-col items-center px-4">
                      <div className="bg-slate-900 text-white px-4 py-1 rounded-lg font-mono text-xl font-bold tracking-tighter">
                        {m.score}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{m.date}</span>
                    </div>
                    <div className="w-2/5 font-bold text-lg">{m.away}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 賽程 Fixtures */}
          <div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
              <span className="w-2 h-8 bg-yellow-500 rounded-full"></span> UPCOMING FIXTURES
            </h3>
            <div className="space-y-4">
              {MOCK_FIXTURES.map((m, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-yellow-500">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{m.date} • {m.time}</span>
                    <span className="text-xs font-bold text-blue-600">{m.venue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-2/5 text-right font-bold text-lg text-slate-600">{m.home}</div>
                    <div className="text-xs font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400">VS</div>
                    <div className="w-2/5 font-bold text-lg text-slate-600">{m.away}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 text-center text-sm border-t border-slate-800">
        <p className="font-bold tracking-widest uppercase mb-2 text-slate-400">ZENEX CUP &copy; 2026</p>
        <p>Managed by Football Excellence Committee</p>
      </footer>
    </div>
  );
}
