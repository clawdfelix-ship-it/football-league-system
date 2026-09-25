'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/fixtures', label: '賽程', icon: '📅' },
  { href: '/teams', label: '球隊', icon: '🛡️' },
  { href: '/players', label: '球員', icon: '👥' },
] as const;

export default function MobileTabBar() {
  const pathname = usePathname() ?? '/';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="主導航"
    >
      <ul className="grid grid-cols-4">
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
                {tab.label}
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
