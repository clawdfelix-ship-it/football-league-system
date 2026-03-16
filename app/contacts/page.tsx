'use client';

import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

export const dynamic = 'force-dynamic';

type Captain = {
  name: string;
  email?: string;
};

type TeamContacts = {
  team: string;
  captains: Captain[];
};

const CONTACTS: TeamContacts[] = [
  {
    team: 'BBVA',
    captains: [
      { name: 'Ibai Garatea', email: 'ibai.garatea1@bbva.com' },
      { name: 'Yassine Ayadi', email: 'yassine.ayadi@bbva.com' },
    ],
  },
  {
    team: 'CACIB',
    captains: [
      { name: 'Maxime Bonte', email: 'maxime.bonte@ca-cib.com' },
      { name: 'Victor Romier', email: 'victor.romier@ca-cib.com' },
    ],
  },
  {
    team: 'CITI',
    captains: [
      { name: 'Michael Mak', email: 'michael.mak@citi.com' },
      { name: 'Toan Nguyen', email: 'toan.dc.nguyen@citi.com' },
    ],
  },
  {
    team: 'LGT',
    captains: [
      { name: 'David Pun', email: 'david.pun@lgt.com' },
      { name: 'Alvin Li', email: 'alvin.li@lgt.com' },
    ],
  },
  {
    team: 'NOMURA',
    captains: [
      { name: 'Terrence Tan', email: 'terrence.tan@nomura.com' },
      { name: 'Kenneth Miranda', email: 'kenneth.miranda@nomura.com' },
    ],
  },
  {
    team: 'SCB',
    captains: [
      { name: 'David Oliveira', email: 'david.oliviera@sc.com' },
      { name: 'Andy Wan', email: 'andyty.wan@sc.com' },
    ],
  },
  {
    team: 'UBS',
    captains: [
      { name: 'Mo', email: 'mortadha.lagha@ubs.com' },
      { name: 'Fu Bong', email: 'fu-bong.chan@ubs.com' },
    ],
  },
  {
    team: 'HSBC',
    captains: [{ name: 'Jimmy Chan', email: 'jimmy.k.p.chan@hsbc.com.hk' }],
  },
  {
    team: 'KPMG',
    captains: [
      { name: 'Terrence Chan', email: 'terrence.chan@kpmg.com' },
      { name: 'Andrew Chan', email: 'andrew.chan@kpmg.com' },
    ],
  },
];

export default function ContactsPage() {
  const { t } = useLanguage();

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-10 pb-12 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black italic mb-2 tracking-tight">
            {t('隊長聯絡資料', 'Captains Contacts')}
          </h2>
          <p className="text-blue-200 text-base font-light tracking-widest uppercase">
            {t('香港銀行足球聯賽 2026', 'Hong Kong Bank League 2026')}
          </p>
        </header>

        <main className="max-w-5xl mx-auto px-6 -mt-6 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="font-bold">{t('官方聯絡電郵', 'Official Emails')}</div>
            </div>
            <div className="p-6 grid gap-4">
              {CONTACTS.map((block) => (
                <div key={block.team} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-black text-slate-900 mb-2">{block.team}</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {block.captains.map((c) => (
                      <div key={`${block.team}-${c.email ?? c.name}`} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-md px-3 py-2">
                        <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-sm text-blue-700 hover:underline break-all">
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

