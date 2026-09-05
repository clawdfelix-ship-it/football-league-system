'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';
import type { PublicPlayer } from '@/lib/public-types';
import { TEAMS } from '@/lib/constants';

function PlayersPageInner(props: { initialPlayers: PublicPlayer[] }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get('team');

  const [players] = useState<PublicPlayer[]>(props.initialPlayers);

  const normalizedTeam = useMemo(() => teamParam?.trim().toUpperCase() ?? '', [teamParam]);
  const validTeams = useMemo(() => new Set(TEAMS.filter((x) => x.name !== 'DEMO').map((x) => x.name)), []);
  const activeTeam = useMemo(() => (validTeams.has(normalizedTeam) ? normalizedTeam : ''), [normalizedTeam, validTeams]);

  const filtered = useMemo(() => {
    // 永遠排除 DEMO 測試隊球員（無論總頁定球隊專頁都唔可以公開露出）
    const real = players.filter((p) => (p.team ?? '').trim().toUpperCase() !== 'DEMO');
    if (!activeTeam) return real;
    return real.filter((p) => (p.team ?? '').toUpperCase() === activeTeam);
  }, [players, activeTeam]);

  const title = activeTeam ? `${activeTeam} ${t('球員名單', 'Players')}` : t('所有球員', 'All Players');

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-20 px-6 text-center">
          <h2 className="text-5xl font-black italic mb-2 tracking-tight">{title}</h2>
          <p className="text-blue-200 text-base font-light tracking-widest uppercase">Hong Kong Bank League 2026</p>
        </header>

        <main className="max-w-5xl mx-auto px-6 -mt-10 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {t('人數', 'Count')}: {filtered.length}
              </div>
              {activeTeam ? (
                <a href="/teams" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                  {t('返回球隊', 'Back to Teams')} →
                </a>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-500">{t('暫無球員資料', 'No players')}</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered
                  .slice()
                  .sort((a, b) => {
                    const ta = (a.team ?? '').toString();
                    const tb = (b.team ?? '').toString();
                    if (ta !== tb) return ta.localeCompare(tb);
                    const na = a.jerseyNumber ?? 999;
                    const nb = b.jerseyNumber ?? 999;
                    if (na !== nb) return na - nb;
                    return (a.name ?? '').localeCompare(b.name ?? '');
                  })
                  .map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white px-2 py-1 rounded-md text-xs font-black">
                          #{p.jerseyNumber ?? '-'}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            {(p.team ?? '').toString()} {p.position ? `• ${p.position}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

export default function PlayersClient(props: { initialPlayers: PublicPlayer[] }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading...</div>}>
      <PlayersPageInner initialPlayers={props.initialPlayers} />
    </Suspense>
  );
}

