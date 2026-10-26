'use client';

import { useEffect, useState } from 'react';

type Announcement = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

export function ManagerAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/announcements', { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => {
        if (body?.ok) {
          setAnnouncements(body.data.announcements || []);
        } else {
          setError('載入公告失敗');
        }
      })
      .catch(() => setError('載入公告失敗'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-6 text-sm text-slate-500">載入公告中…</div>;
  if (error) return <div className="card p-6 text-sm text-red-600">{error}</div>;
  if (announcements.length === 0) return null;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">聯賽公告</h2>
      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(a.createdAt).toLocaleDateString('zh-HK')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
