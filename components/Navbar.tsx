'use client';

import Link from 'next/link';
import Image from 'next/image';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="ZENEX Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Hong Kong Bank League 2026
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/overview" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('賽事簡介', 'Overview')}
            </Link>
            <Link href="/#standings" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('積分榜', 'Standings')}
            </Link>
            <Link href="/#matches" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('賽程 & 結果', 'Fixtures & Results')}
            </Link>
            <Link href="/teams" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('球隊', 'Teams')}
            </Link>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/admin" className="text-sm font-medium bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
