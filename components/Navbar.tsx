'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold">
            Football League Center
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/#standings" className="hover:text-gray-300 transition-colors">
              Standings
            </Link>
            <Link href="/#matches" className="hover:text-gray-300 transition-colors">
              Fixtures & Results
            </Link>
            <Link href="/admin" className="hover:text-gray-300 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
