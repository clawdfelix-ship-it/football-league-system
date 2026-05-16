'use client';

import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import HomeLayout from '@/components/HomeLayout';

const HeadToHeadTable = dynamic(
  () => import('@/components/HeadToHeadTable'),
  { ssr: false }
);

export default function HeadToHeadPage() {
  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-blue-600 text-white px-8 py-6">
              <h1 className="text-3xl font-black tracking-tight">對戰記錄表</h1>
              <p className="text-blue-100 mt-2">Head-to-Head Match Records</p>
            </div>
            <div className="p-6">
              <HeadToHeadTable />
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
