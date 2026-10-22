'use client';

import HomeLayout from '@/components/HomeLayout';
import PageHero from '@/components/PageHero';
import HeadToHeadTable from '@/components/HeadToHeadTable';
import HeadToHeadChart from '@/components/HeadToHeadChart';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
};

export default function HeadToHeadPage() {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 用 fetch API 拎數據
    fetch('/api/matches')
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load matches:', err);
        setMatches([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f172a]"></div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <PageHero
          title={t('對戰記錄表', 'Head-to-Head Records')}
          subtitle={t('球隊對賽成績', 'Head-to-Head Match Records')}
        />
        <main className="page-container -mt-16 pb-20">
          <div className="card overflow-hidden">
            <div className="p-5 sm:p-6">
              <h2 className="text-lg font-black text-slate-800 mb-1">{t('全隊總覽', 'All Teams Overview')}</h2>
              <p className="text-xs text-slate-400 mb-4">{t('各隊勝 / 和 / 負總覽', 'All Teams — Win / Draw / Loss Overview')}</p>
              <HeadToHeadChart serverMatches={matches} />
            </div>
            <div className="border-t border-slate-100 p-5 sm:p-6">
              <h2 className="text-lg font-black text-slate-800 mb-4">{t('對戰矩陣', 'Head-to-Head Matrix')}</h2>
              <HeadToHeadTable serverMatches={matches} />
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
