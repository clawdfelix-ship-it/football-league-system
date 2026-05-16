'use client';

import { useState, useEffect } from 'react';
import { listMatches } from '@/lib/queries';

export default function DebugMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await listMatches();
        setMatches(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  const finished = matches.filter(m => m.status === 'finished');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: 數據庫比賽記錄</h1>
      <p className="mb-4">總共: {matches.length} 場 | 已完成: {finished.length} 場</p>
      
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-slate-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">主場</th>
            <th className="p-2 text-left">比分</th>
            <th className="p-2 text-left">作客</th>
            <th className="p-2 text-left">狀態</th>
            <th className="p-2 text-left">日期</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id} className="border-t">
              <td className="p-2">{m.id}</td>
              <td className="p-2 font-bold">{m.homeTeam}</td>
              <td className="p-2">{m.homeScore} : {m.awayScore}</td>
              <td className="p-2 font-bold">{m.awayTeam}</td>
              <td className="p-2">{m.status}</td>
              <td className="p-2">{m.date ? new Date(m.date).toLocaleDateString('zh-HK') : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
