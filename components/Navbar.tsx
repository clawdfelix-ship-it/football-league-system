'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link href="/pdf" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('PDF', 'PDF')}
            </Link>
            <Link href="/contacts" className="text-sm font-medium hover:text-gray-300 transition-colors">
              {t('聯絡', 'Contacts')}
            </Link>
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
        <div className="container mx-auto mt-3 md:hidden space-y-2">
          <Link
            href="/overview"
            className="block px-2 py-2 rounded hover:bg-gray-800 text-sm font-medium transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('賽事簡介', 'Overview')}
          </Link>
          <Link
            href="/#standings"
            className="block px-2 py-2 rounded hover:bg-gray-800 text-sm font-medium transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('積分榜', 'Standings')}
          </Link>
          <Link
            href="/#matches"
            className="block px-2 py-2 rounded hover:bg-gray-800 text-sm font-medium transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('賽程 & 結果', 'Fixtures & Results')}
          </Link>
          <Link
            href="/pdf"
            className="block px-2 py-2 rounded hover:bg-gray-800 text-sm font-medium transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('PDF', 'PDF')}
          </Link>
          <Link
            href="/contacts"
            className="block px-2 py-2 rounded hover:bg-gray-800 text-sm font-medium transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('聯絡', 'Contacts')}
          </Link>
        </div>
      )}
    </nav>
  );
}
