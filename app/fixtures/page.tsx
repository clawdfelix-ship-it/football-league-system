'use client';

import { useState, useEffect } from 'react';
import HomeLayout from '@/components/HomeLayout';
import { KIT_COLORS } from '@/lib/kitColors';

interface Team {
  name: string;
  homeKitColor: string;
  awayKitColor: string;
}

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  round: string;
  status: string;
}

export default function FixturesPage() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load team settings
      const teamsRes = await fetch('/api/teams/settings');
      const teamsData = await teamsRes.json();
      
      const teamMap: Record<string, Team> = {};
      (teamsData.teams || []).forEach((t: any) => {
        teamMap[t.name] = {
          name: t.name,
          homeKitColor: t.home_kit_color || 'white',
          awayKitColor: t.away_kit_color || 'black',
        };
      });
      setTeams(teamMap);

      // Load matches
      const matchesRes = await fetch('/api/matches');
      const matchesData = await matchesRes.json();
      setMatches(matchesData.matches || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKitColor = (teamName: string, isHome: boolean) => {
    const team = teams[teamName];
    if (!team) return KIT_COLORS[0]; // Default white
    
    const colorValue = isHome ? team.homeKitColor : team.awayKitColor;
    return KIT_COLORS.find(c => c.value === colorValue) || KIT_COLORS[0];
  };

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">FIXTURES</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Upcoming Matches</p>
        </header>

        <main className="max-w-5xl mx-auto px-6 -mt-16 pb-20">
          <div className="space-y-4">
            {matches.map((match) => {
              const homeColor = getKitColor(match.homeTeam, true);
              const awayColor = getKitColor(match.awayTeam, false);

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {match.round}
                    </span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      match.status === 'finished' ? 'bg-green-100 text-green-700' :
                      match.status === 'tbc' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {match.status === 'finished' ? '完場' : match.status === 'tbc' ? '待定' : '即將進行'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Home Team */}
                    <div className="flex-1 text-right">
                      <div className="text-xl font-bold text-slate-800 mb-2">{match.homeTeam}</div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-gray-500">主場</span>
                        <div
                          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: homeColor.hex }}
                          title={`主場球衣：${homeColor.label}`}
                        />
                      </div>
                    </div>

                    {/* VS / Score */}
                    <div className="flex flex-col items-center px-6">
                      {match.status === 'finished' ? (
                        <div className="text-3xl font-black text-slate-900">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                      )}
                      <div className="text-sm text-gray-500 mt-2 text-center">
                        <div>{new Date(match.date).toLocaleDateString('zh-HK')}</div>
                        <div>{match.venue}</div>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-left">
                      <div className="text-xl font-bold text-slate-800 mb-2">{match.awayTeam}</div>
                      <div className="flex items-center justify-start gap-2">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: awayColor.hex }}
                          title={`客場球衣：${awayColor.label}`}
                        />
                        <span className="text-sm text-gray-500">客場</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
