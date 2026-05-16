'use client';

import { useState, useEffect } from 'react';
import { TEAMS } from '@/lib/constants';

interface MatchRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface H2HData {
  [teamA: string]: {
    [teamB: string]: MatchRecord;
  };
}

interface Props {
  serverMatches: any[];
}

export default function HeadToHeadTable({ serverMatches }: Props) {
  const [h2hData, setH2hData] = useState<H2HData>({});
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const teams = TEAMS.filter(t => t.name !== 'DEMO');

  useEffect(() => {
    async function loadH2H() {
      try {
        const allMatches = serverMatches; // 用 Server 傳過黎嘅數據
        const finishedMatches = allMatches.filter(m => 
          m.status === 'finished' && 
          m.homeScore !== null && 
          m.awayScore !== null
        );
        
        setDebugInfo(`總共 ${allMatches.length} 場比賽，其中 ${finishedMatches.length} 場已完成有比分`);
        
        const data: H2HData = {};

        // Initialize all team pairs
        for (const teamA of teams) {
          data[teamA.name] = {};
          for (const teamB of teams) {
            if (teamA.name !== teamB.name) {
              data[teamA.name][teamB.name] = {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
              };
            }
          }
        }

        // Process matches - 用已 filter 嘅
        for (const match of finishedMatches) {
          const homeTeam = match.homeTeam;
          const awayTeam = match.awayTeam;
          const homeScore = match.homeScore!;
          const awayScore = match.awayScore!;

          // Skip if team not in our list
          if (!data[homeTeam] || !data[awayTeam]) {
            console.log('Skipping match with unknown teams:', homeTeam, 'vs', awayTeam);
            continue;
          }

          // Update home team vs away team
          data[homeTeam][awayTeam].played += 1;
          data[homeTeam][awayTeam].goalsFor += homeScore;
          data[homeTeam][awayTeam].goalsAgainst += awayScore;

          // Update away team vs home team
          data[awayTeam][homeTeam].played += 1;
          data[awayTeam][homeTeam].goalsFor += awayScore;
          data[awayTeam][homeTeam].goalsAgainst += homeScore;

          if (homeScore > awayScore) {
            data[homeTeam][awayTeam].wins += 1;
            data[awayTeam][homeTeam].losses += 1;
          } else if (homeScore < awayScore) {
            data[homeTeam][awayTeam].losses += 1;
            data[awayTeam][homeTeam].wins += 1;
          } else {
            data[homeTeam][awayTeam].draws += 1;
            data[awayTeam][homeTeam].draws += 1;
          }
        }

        setH2hData(data);
      } catch (e) {
        console.error('Failed to load H2H data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadH2H();
  }, [teams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          📊 {debugInfo}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-3 bg-slate-100 font-bold text-slate-700 text-left border-b border-slate-200">
              球隊
            </th>
            {teams.map((team) => (
              <th
                key={team.name}
                className="px-2 py-3 bg-slate-100 font-bold text-slate-700 text-center border-b border-slate-200 whitespace-nowrap"
              >
                {team.shortName}
              </th>
            ))}
            <th className="px-3 py-3 bg-blue-100 font-bold text-blue-700 text-center border-b border-slate-200">
              總計
            </th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, rowIdx) => {
            const teamData = h2hData[team.name];
            const totalPlayed = teamData
              ? Object.values(teamData).reduce((sum, d) => sum + d.played, 0)
              : 0;
            const totalWins = teamData
              ? Object.values(teamData).reduce((sum, d) => sum + d.wins, 0)
              : 0;
            const totalDraws = teamData
              ? Object.values(teamData).reduce((sum, d) => sum + d.draws, 0)
              : 0;
            const totalLosses = teamData
              ? Object.values(teamData).reduce((sum, d) => sum + d.losses, 0)
              : 0;
            const totalGF = teamData
              ? Object.values(teamData).reduce((sum, d) => sum + d.goalsFor, 0)
              : 0;
            const totalGA = teamData
              ? Object.values(teamData).reduce((sum, d) => sum + d.goalsAgainst, 0)
              : 0;

            return (
              <tr key={team.name} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-3 font-bold text-slate-800 border-b border-slate-200">
                  {team.shortName}
                </td>
                {teams.map((opponent) => {
                  if (team.name === opponent.name) {
                    return (
                      <td
                        key={opponent.name}
                        className="px-2 py-3 text-center border-b border-slate-200 bg-slate-200"
                      >
                        <span className="text-slate-400">-</span>
                      </td>
                    );
                  }

                  const record = teamData?.[opponent.name];

                  if (!record || record.played === 0) {
                    return (
                      <td
                        key={opponent.name}
                        className="px-2 py-3 text-center border-b border-slate-200"
                      >
                        <span className="text-slate-300">未對賽</span>
                      </td>
                    );
                  }

                  const gd = record.goalsFor - record.goalsAgainst;

                  return (
                    <td
                      key={opponent.name}
                      className="px-2 py-3 text-center border-b border-slate-200 text-xs"
                    >
                      <div className="font-bold text-slate-700">
                        {record.wins}-{record.draws}-{record.losses}
                      </div>
                      <div className={`text-xs ${
                        gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {record.goalsFor}:{record.goalsAgainst}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center border-b border-slate-200 bg-blue-50 font-bold">
                  <div className="text-slate-700">
                    {totalWins}-{totalDraws}-{totalLosses}
                  </div>
                  <div className={`text-xs ${
                    totalGF - totalGA > 0 ? 'text-green-600' :
                    totalGF - totalGA < 0 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {totalGF}:{totalGA}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
        <p className="font-bold mb-2">圖例說明：</p>
        <ul className="space-y-1">
          <li>📊 <code>勝-和-負</code> — 對賽成績</li>
          <li>⚽ <code>入球:失球</code> — 得失球數</li>
          <li>🟢 綠色 = 正得失球差 | 🔴 紅色 = 負得失球差</li>
        </ul>
      </div>
    </div>
  );
}
