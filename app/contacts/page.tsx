'use client';

import HomeLayout from '@/components/HomeLayout';
import PageHero from '@/components/PageHero';
import { useLanguage } from '@/context/LanguageContext';
import { useTeams } from '@/lib/teams/use-teams';

export const dynamic = 'force-dynamic';

export default function ContactsPage() {
  const { t } = useLanguage();
  const { teams: allTeams, loading } = useTeams();
  const teams = allTeams.filter((t) => t.name !== 'DEMO');

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <PageHero
          title={t('隊長聯絡資料', 'Captains Contacts')}
          subtitle={t('香港銀行足球聯賽 2026', 'Hong Kong Bank League 2026')}
        />

        <main className="page-container -mt-16 pb-20">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="font-bold">{t('官方聯絡電郵', 'Official Emails')}</div>
            </div>
            <div className="p-6 grid gap-4">
              {teams.map((team) => (
                <div key={team.name} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-2">{team.name}</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {(team.captains ?? []).map((c) => (
                      <div key={`${team.name}-${c.email ?? c.name}`} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-md px-3 py-2">
                        <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-sm text-blue-700 hover:underline break-all inline-flex items-center min-h-[44px] -my-2 py-2"
                          >
                            {c.email}
                          </a>
                        ) : (
                          <div className="text-sm text-slate-400">—</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
