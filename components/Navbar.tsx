'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';
import { useLanguage } from '@/context/LanguageContext';

type NavItem = { href: string; zh: string; en: string; hash?: string };

const NAV_ITEMS: NavItem[] = [
  { href: '/overview', zh: '賽事簡介', en: 'Overview' },
  { href: '/head-to-head', zh: '對戰表', en: 'Head to Head' },
  { href: '/#standings', zh: '積分榜', en: 'Standings', hash: '#standings' },
  { href: '/#matches', zh: '賽程 & 結果', en: 'Fixtures & Results', hash: '#matches' },
  { href: '/pdf', zh: 'PDF', en: 'PDF' },
];

export default function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [pathname]);

  const isActive = (item: NavItem) => {
    if (item.hash) {
      if (pathname !== '/') return false;
      // On the home page with no hash, highlight the standings (primary) tab.
      return hash === item.hash || (hash === '' && item.hash === '#standings');
    }
    return pathname === item.href;
  };

  const linkClass = (item: NavItem) =>
    [
      'text-sm font-medium rounded-full px-3 py-1.5 transition-colors',
      isActive(item)
        ? 'text-white bg-white/15'
        : 'text-gray-300 hover:text-white hover:bg-white/5',
    ].join(' ');

  const mobileLinkClass = (item: NavItem) =>
    [
      'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      isActive(item) ? 'text-white bg-white/15' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
    ].join(' ');

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Logo className="h-12 w-12 flex-shrink-0" />
            <span className="text-xl font-bold tracking-tight">
              Hong Kong Bank League 2026
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item)}>
                {t(item.zh, item.en)}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <LanguageToggle />
            
            {/* Admin Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                onBlur={() => setTimeout(() => setIsAdminMenuOpen(false), 200)}
                className="text-sm font-medium bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {t('登入', 'Login')}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              
              {isAdminMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden z-50 py-1 border border-gray-100">
                  <Link 
                    href="/admin" 
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-b border-gray-100"
                  >
                    <div className="font-bold">{t('球隊領隊', 'Team Manager')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('管理球隊資料', 'Manage Team Data')}</div>
                  </Link>
                  <Link 
                    href="/admin" 
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >
                    <div className="font-bold">{t('賽事總管', 'League Admin')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('管理賽程及結果', 'Manage League')}</div>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="container mx-auto mt-3 md:hidden space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={mobileLinkClass(item)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t(item.zh, item.en)}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
