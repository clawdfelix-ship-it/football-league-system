'use client';

import { useState } from 'react';
import Link from 'next/link';
import HomeLayout from '@/components/HomeLayout';
import PageHero from '@/components/PageHero';
import { useLanguage } from '@/context/LanguageContext';
import type { PublicPlayer } from '@/lib/public-types';

interface TeamInfo {
  name: string;
  nameZh: string;
  shortName: string;
  color: string;
  playerCount: number;
  players: PublicPlayer[];
}

export default function TeamsClient(props: { initialTeams: TeamInfo[] }) {
  const { t } = useLanguage();
  const [teams] = useState<TeamInfo[]>(props.initialTeams);

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <PageHero
          title={t('球隊', 'TEAMS')}
          subtitle={`Hong Kong Bank League 2026 | ${t('香港銀行足球聯賽', 'Hong Kong Bank Football League')}`}
          footer={<p className="text-yellow-400 text-base font-bold tracking-widest mt-3">ZENEX SPORTS</p>}
        />

        <main className="page-container -mt-16 pb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <div
                key={team.name}
                className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="bg-[#0f172a] p-6 text-center border-b-4 border-[#1e293b]">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center border-2 border-slate-300 shadow-md">
                      <span
                        className={`text-2xl font-bold bg-gradient-to-br ${team.color} bg-clip-text text-transparent`}
                      >
                        {team.shortName.substring(0, 2)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{team.name}</h3>
                  <p className="text-slate-300 text-sm font-medium tracking-wide">{team.nameZh}</p>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-slate-500">{t('球員', 'Players')}</span>
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                      {team.playerCount} {t('人', '')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {team.players.length > 0 ? (
                      team.players.slice(0, 3).map((player) => (
                        <div key={player.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs font-bold">
                              #{player.jerseyNumber ?? '-'}
                            </span>
                            <span className="text-slate-700">{player.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{player.position || '-'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 text-sm py-2">{t('暫無球員', 'No players')}</p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Link
                      href={`/players?team=${encodeURIComponent(team.name)}`}
                      className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors w-full text-center inline-flex items-center justify-center"
                    >
                      {t('查看全部球員', 'View All Players')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

