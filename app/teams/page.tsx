'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';
import type { Player } from '@/lib/schema';

interface TeamInfo {
  name: string;
  nameZh: string;
  shortName: string;
  color: string;
  playerCount: number;
  players: Player[];
}

const TEAMS = [
  { name: 'NOMURA', nameZh: '野村證券', shortName: 'NOMURA', color: 'from-red-600 to-red-800' },
  { name: 'BBVA', nameZh: '西班牙對外銀行', shortName: 'BBVA', color: 'from-blue-600 to-blue-800' },
  { name: 'LGT', nameZh: 'LGT 銀行', shortName: 'LGT', color: 'from-purple-600 to-purple-800' },
  { name: 'CACIB', nameZh: '法興銀行', shortName: 'CACIB', color: 'from-green-600 to-green-800' },
  { name: 'CITI', nameZh: '花旗銀行', shortName: 'CITI', color: 'from-blue-400 to-blue-600' },
  { name: 'SCB', nameZh: '渣打銀行', shortName: 'SCB', color: 'from-red-400 to-red-600' },
  { name: 'UBS', nameZh: '瑞銀集團', shortName: 'UBS', color: 'from-yellow-500 to-orange-600' },
];

const DEFAULT_TEAMS: TeamInfo[] = TEAMS.map(team => ({
  ...team,
  playerCount: 0,
  players: [],
}));

export default function TeamsPage() {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<TeamInfo[]>(DEFAULT_TEAMS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/players');
      if (!res.ok) {
        throw new Error('無法載入球員資料');
      }
      const data = await res.json();
      const playerList = data.players || [];
      setPlayers(playerList);
      
      // Map players to teams
      const teamsWithPlayers = TEAMS.map(team => ({
        ...team,
        playerCount: playerList.filter((p: Player) => p.team === team.name).length,
        players: playerList.filter((p: Player) => p.team === team.name),
      }));
      
      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error('載入球隊資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        {/* Hero Banner */}
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">{t('球隊', 'TEAMS')}</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">
            Hong Kong Bank League 2026 | {t('香港銀行友誼足球聯賽', 'Hong Kong Bank Football League')}
          </p>
          <p className="text-yellow-400 text-lg font-bold mt-2">
            ZENEX SPORTS
          </p>
        </header>

        <main className="max-w-7xl mx-auto px-6 -mt-16 pb-20">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {teams.map((team) => (
                <div 
                  key={team.name} 
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  {/* Team Header with Color */}
                  <div className={`bg-gradient-to-r ${team.color} text-white px-6 py-5 text-center`}>
                    <div className="mb-2">
                      {/* Placeholder for team logo */}
                      <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-black">{team.shortName.substring(0, 2)}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{team.name}</h3>
                    <p className="text-white/80 text-sm">{team.nameZh}</p>
                  </div>
                  
                  {/* Team Stats */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500">{t('球員', 'Players')}</span>
                      <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                        {team.playerCount} {t('人', '')}
                      </span>
                    </div>
                    
                    {/* Players List Preview */}
                    <div className="space-y-2 mb-4">
                      {team.players.length > 0 ? (
                        team.players.slice(0, 3).map((player) => (
                          <div key={player.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs font-bold">
                                #{player.jerseyNumber}
                              </span>
                              <span className="text-gray-700">{player.name}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm text-center py-2">
                          {t('暫無球員', 'No players yet')}
                        </p>
                      )}
                      {team.players.length > 3 && (
                        <p className="text-blue-600 text-sm text-center">
                          + {team.players.length - 3} {t('更多球員', 'more players')}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <Link
                      href={`/players?team=${encodeURIComponent(team.name)}`}
                      className="block text-center bg-slate-100 text-slate-700 py-2 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      {t('查看球員', 'View Players')} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </HomeLayout>
  );
}
