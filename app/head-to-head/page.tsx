'use client';

import HomeLayout from '@/components/HomeLayout';
import HeadToHeadTable from '@/components/HeadToHeadTable';
import HeadToHeadChart from '@/components/HeadToHeadChart';
import { useEffect, useState } from 'react';

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
};

export default function HeadToHeadPage() {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a237e]"></div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#1a237e] text-white px-8 py-6">
              <h1 className="text-3xl font-black tracking-tight">對戰記錄表</h1>
              <p className="text-blue-100 mt-2">Head-to-Head Match Records</p>
            </div>
            <div className="p-6">
              <h2 className="text-lg font-black text-slate-800 mb-1">全隊總覽</h2>
              <p className="text-xs text-slate-400 mb-4">All Teams — Win / Draw / Loss Overview</p>
              <HeadToHeadChart serverMatches={matches} />
            </div>
            <div className="border-t border-slate-100 p-6">
              <h2 className="text-lg font-black text-slate-800 mb-4">對戰矩陣</h2>
              <HeadToHeadTable serverMatches={matches} />
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
