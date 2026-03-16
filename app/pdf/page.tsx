'use client';

import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

export const dynamic = 'force-dynamic';

export default function PdfPage() {
  const { t } = useLanguage();

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-10 pb-12 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black italic mb-2 tracking-tight">
            {t('PDF 文件', 'PDF')}
          </h2>
          <p className="text-blue-200 text-base font-light tracking-widest uppercase">
            HKBL2026-ZENEX.pdf
          </p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-6 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="font-bold">{t('直接查看', 'View')}</div>
              <a
                href="/HKBL2026-ZENEX.pdf"
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-yellow-500 text-black px-3 py-2 rounded font-black hover:opacity-90 transition-opacity"
              >
                {t('新分頁打開', 'Open in new tab')}
              </a>
            </div>
            <div className="h-[75vh]">
              <iframe
                src="/HKBL2026-ZENEX.pdf"
                className="w-full h-full"
                title="HKBL2026-ZENEX.pdf"
              />
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}

