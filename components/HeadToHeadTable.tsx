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

interface MatchSummary {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
}

interface Props {
  serverMatches: MatchSummary[];
}

const EMPTY_RECORD: MatchRecord = {
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
};

// Diagonal hatch to mark "not yet played" cells so they don't read as missing data.
const HATCH =
  'repeating-linear-gradient(45deg, #f1f5f9 0px, #f1f5f9 4px, #ffffff 4px, #ffffff 9px)';

export default function HeadToHeadTable({ serverMatches }: Props) {
  const [h2hData, setH2hData] = useState<H2HData>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const teams = TEAMS.filter(t => t.name !== 'DEMO');

  useEffect(() => {
    function loadH2H() {
      try {
        const finishedMatches = serverMatches.filter(
          m => m.status === 'finished' && m.homeScore !== null && m.awayScore !== null
        );

        const data: H2HData = {};
        for (const teamA of teams) {
          data[teamA.name] = {};
          for (const teamB of teams) {
            if (teamA.name !== teamB.name) {
              data[teamA.name][teamB.name] = { ...EMPTY_RECORD };
            }
          }
        }

        for (const match of finishedMatches) {
          const homeTeam = match.homeTeam;
          const awayTeam = match.awayTeam;
          const homeScore = match.homeScore!;
          const awayScore = match.awayScore!;

          if (!data[homeTeam] || !data[awayTeam]) continue;

          data[homeTeam][awayTeam].played += 1;
          data[homeTeam][awayTeam].goalsFor += homeScore;
          data[homeTeam][awayTeam].goalsAgainst += awayScore;

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
        if (teams.length && !selectedTeam) setSelectedTeam(teams[0].name);
      } catch (e) {
        console.error('Failed to load H2H data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadH2H();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMatches]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const gdClass = (gd: number) =>
    gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-500' : 'text-slate-500';

  const totalFor = (teamName: string) => {
    const td = h2hData[teamName];
    if (!td) return { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    return {
      wins: Object.values(td).reduce((s, d) => s + d.wins, 0),
      draws: Object.values(td).reduce((s, d) => s + d.draws, 0),
      losses: Object.values(td).reduce((s, d) => s + d.losses, 0),
      gf: Object.values(td).reduce((s, d) => s + d.goalsFor, 0),
      ga: Object.values(td).reduce((s, d) => s + d.goalsAgainst, 0),
    };
  };

  const selectedRecord = h2hData[selectedTeam];

  return (
    <div>
      {/* ── Desktop / tablet: full matrix (kept, with hatched unplayed cells) ── */}
      <div className="hidden md:block overflow-x-auto">
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
              const t = totalFor(team.name);
              return (
                <tr key={team.name} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="px-3 py-3 font-bold text-slate-800 border-b border-slate-200 whitespace-nowrap">
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
                          style={{ background: HATCH }}
                          title="未對賽"
                        >
                          <span className="text-slate-300 text-xs">·</span>
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
                        <div className={`text-xs ${gdClass(gd)}`}>
                          {record.goalsFor}:{record.goalsAgainst}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center border-b border-slate-200 bg-blue-50 font-bold">
                    <div className="text-slate-700">
                      {t.wins}-{t.draws}-{t.losses}
                    </div>
                    <div className={`text-xs ${gdClass(t.gf - t.ga)}`}>
                      {t.gf}:{t.ga}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: pick a team, see its record vs each opponent ── */}
      <div className="md:hidden">
        <label className="block text-sm font-semibold text-slate-700 mb-2">選擇球隊</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {teams.map((team) => (
            <option key={team.name} value={team.name}>
              {team.shortName} — {team.nameZh}
            </option>
          ))}
        </select>

        {selectedRecord && (
          <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold">{selectedTeam} 對賽成績</span>
              {(() => {
                const t = totalFor(selectedTeam);
                return (
                  <span className="text-sm font-semibold bg-white/20 rounded-full px-3 py-0.5">
                    總計 {t.wins}-{t.draws}-{t.losses}
                  </span>
                );
              })()}
            </div>
            <ul className="divide-y divide-slate-100">
              {teams
                .filter((opp) => opp.name !== selectedTeam)
                .map((opp) => {
                  const rec = selectedRecord[opp.name] ?? EMPTY_RECORD;
                  const played = rec.played > 0;
                  const gd = rec.goalsFor - rec.goalsAgainst;
                  return (
                    <li key={opp.name} className="flex items-center justify-between px-4 py-3">
                      <div className="font-semibold text-slate-800 text-sm">{opp.shortName}</div>
                      {played ? (
                        <div className="text-right">
                          <div className="font-bold text-slate-800 text-sm">
                            {rec.wins}-{rec.draws}-{rec.losses}
                          </div>
                          <div className={`text-xs ${gdClass(gd)}`}>
                            {rec.goalsFor}:{rec.goalsAgainst}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="text-xs text-slate-400 rounded px-2 py-1 border border-slate-200"
                          style={{ background: HATCH }}
                        >
                          未對賽
                        </span>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
        <p className="font-bold mb-2">圖例說明：</p>
        <ul className="space-y-1">
          <li>📊 <code>勝-和-負</code> — 對賽成績</li>
          <li>⚽ <code>入球:失球</code> — 得失球數</li>
          <li>🟢 綠色 = 正得失球差 | 🔴 紅色 = 負得失球差</li>
          <li>
            <span
              className="inline-block align-middle rounded border border-slate-200 px-2"
              style={{ background: HATCH }}
            >
              &nbsp;
            </span>{' '}
            斜紋格 = 未對賽
          </li>
        </ul>
      </div>
    </div>
  );
}
