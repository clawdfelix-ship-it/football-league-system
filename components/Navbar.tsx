'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ZENEX-SPORTS LeagueCenter
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#standings" className="text-sm font-medium hover:text-gray-300 transition-colors">
              Standings
            </Link>
            <Link href="/#matches" className="text-sm font-medium hover:text-gray-300 transition-colors">
              Fixtures & Results
            </Link>
          </div>
        </div>
        <div>
          <Link href="/admin" className="text-sm font-medium bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}