'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const TABS = [
  { href: '/', zh: '首頁', en: 'Home', icon: '🏠' },
  { href: '/fixtures', zh: '賽程', en: 'Fixtures', icon: '📅' },
  { href: '/#standings', zh: '積分', en: 'Table', icon: '🏆' },
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
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-semibold transition-colors ${
                  active ? 'text-[#1a237e]' : 'text-slate-400'
                }`}
              >
                <span className={`text-lg leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                {t(tab.zh, tab.en)}
                <span
                  className={`h-0.5 w-6 rounded-full transition-colors ${
                    active ? 'bg-[#1a237e]' : 'bg-transparent'
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
