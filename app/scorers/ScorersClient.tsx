'use client';

import { useMemo, useState } from 'react';
import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

type ScorerRow = {
  playerId: number;
  playerName: string;
  team: string | null;
  goals: number;
  lastMatchDate: string | null;
};

export default function ScorersClient(props: { initialRows: ScorerRow[] }) {
  const { t } = useLanguage();
  const [rows] = useState<ScorerRow[]>(props.initialRows);

  const displayRows = useMemo(() => rows.filter((r) => (r.goals ?? 0) > 0), [rows]);

  return (
    <HomeLayout>
      <div className="min-h-screen bg-white text-slate-900 font-sans">
        <header className="bg-slate-900 text-white py-12 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black italic mb-4">{t('神射手榜', 'Top Scorers')}</h1>
          <p className="text-xl md:text-2xl text-blue-200 font-light tracking-wide uppercase">
            {t('球員名 / 球隊 / 入球', 'Player / Team / Goals')}
          </p>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 font-semibold">{t('排行榜', 'Leaderboard')}</div>
            {displayRows.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-600">{t('暫時未有入球記錄', 'No goals recorded yet')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-slate-200">
                    <tr className="text-left">
                      <th className="px-6 py-3 font-semibold text-slate-700 w-16">#</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t('球員', 'Player')}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t('球隊', 'Team')}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t('賽事日期', 'Match Date')}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700 text-right w-24">{t('入球', 'Goals')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((r, idx) => (
                      <tr key={r.playerId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-6 py-3 text-slate-600">{idx + 1}</td>
                        <td className="px-6 py-3 font-semibold text-slate-900">{r.playerName}</td>
                        <td className="px-6 py-3 text-slate-700">{r.team || '-'}</td>
                        <td className="px-6 py-3 text-slate-700">
                          {r.lastMatchDate
                            ? new Date(r.lastMatchDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-900">{r.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

