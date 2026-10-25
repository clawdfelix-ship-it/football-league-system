'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const TABS = [
  {
    href: '/',
    zh: '首頁',
    en: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    ),
  },
  {
    href: '/fixtures',
    zh: '賽程',
    en: 'Fixtures',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
        <path d="M8 13h3M13 13h3M8 17h3M13 17h3" />
      </svg>
    ),
  },
  {
    href: '/#standings',
    zh: '積分',
    en: 'Table',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M5 5H3v1a3 3 0 0 0 3 3M19 5h2v1a3 3 0 0 1-3 3" />
        <path d="M12 13v3M9 20h6M10 16h4l.5 4h-5l.5-4Z" />
      </svg>
    ),
  },
] as const;

export default function MobileTabBar() {
  const { t } = useLanguage();
  const pathname = usePathname() ?? '/';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      aria-label={t('主導航', 'Main navigation')}
    >
      <ul className="grid grid-cols-3">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-xs font-semibold transition-colors ${
                  active ? 'text-[#0f172a]' : 'text-slate-400'
                }`}
              >
                {tab.icon(active)}
                {t(tab.zh, tab.en)}
                <span
                  className={`h-0.5 w-6 rounded-full transition-colors ${
                    active ? 'bg-[#0f172a]' : 'bg-transparent'
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
