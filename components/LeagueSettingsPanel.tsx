'use client';

import { useState, useEffect } from 'react';

type LeagueSettings = {
  id: number;
  name: string;
  slug: string;
  announcement: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

/**
 * League admin settings panel — shown in the league admin dashboard.
 * Allows the league admin to update their league's display name and
 * (with explicit confirmation) the subdomain slug.
 */
export function LeagueSettingsPanel({ leagueId }: { leagueId: number }) {
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugWarning, setSlugWarning] = useState('');

  useEffect(() => {
    // Load current settings from the league detail endpoint
    void (async () => {
      try {
        // Reuse the platform league details API? No — this is league-admin scoped.
        // We need a league-scoped endpoint. For now, fetch from the public league info.
        const res = await fetch(`/api/leagues/${leagueId}/settings`, { cache: 'no-store' });
        if (res.ok) {
          const body = await res.json();
          if (body?.ok) {
            const d = body.data;
            setSettings(d);
            setName(d.name);
            setSlug(d.slug);
            setAnnouncement(d.announcement ?? '');
            setContactEmail(d.contactEmail ?? '');
            setContactPhone(d.contactPhone ?? '');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [leagueId]);

  // Live slug availability hint (client-side only; server validates too)
  useEffect(() => {
    if (!settings) return;
    const newSlug = slug.trim().toLowerCase();
    if (newSlug === settings.slug) {
      setSlugWarning('');
    } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(newSlug)) {
      setSlugWarning('只限小寫字母、數字、連字號，且不能以連字號開頭或結尾');
    } else if (newSlug.includes('--')) {
      setSlugWarning('不能包含連續兩個連字號');
    } else {
      setSlugWarning(`⚠️ 更改後網址會變成 https://${newSlug}.zenex-sports.com，舊網址將失效`);
    }
  }, [slug, settings]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: Record<string, string> = {};
      if (name !== settings.name) payload.name = name;
      if (slug.trim().toLowerCase() !== settings.slug) payload.slug = slug.trim().toLowerCase();
      if (announcement !== (settings.announcement ?? '')) payload.announcement = announcement;
      if (contactEmail !== (settings.contactEmail ?? '')) payload.contactEmail = contactEmail;
      if (contactPhone !== (settings.contactPhone ?? '')) payload.contactPhone = contactPhone;

      if (Object.keys(payload).length === 0) {
        setSuccess('沒有變更');
        return;
      }

      // Extra confirmation for slug change
      if (payload.slug) {
        if (!confirm(`確定要將子網域由 ${settings.slug} 改為 ${payload.slug}？\n\n舊網址 https://${settings.slug}.zenex-sports.com 將會失效。`)) {
          return;
        }
      }

      const res = await fetch(`/api/leagues/${leagueId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '儲存失敗');

      setSuccess('已儲存');
      if (body.data.slugChanged) {
        setSuccess(`已儲存。新網址：${body.data.newUrl}`);
      }
      // Refresh local state
      setSettings((s) => s ? { ...s, ...payload } : s);
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">載入中…</p>;
  if (!settings) return <p className="text-sm text-slate-600">找不到聯賽設定</p>;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">聯賽設定</h3>

      {error && <div className="alert-error mb-3">{error}</div>}
      {success && <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700">聯賽顯示名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">子網域名稱</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <span className="text-sm text-slate-600">.zenex-sports.com</span>
          </div>
          {slugWarning && (
            <p className={`mt-1 text-xs ${slugWarning.startsWith('⚠️') ? 'text-amber-600' : 'text-red-600'}`}>
              {slugWarning}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">聯賽公告</label>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="顯示於聯賽首頁的公告…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">聯絡電郵</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">聯絡電話</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg border border-[#0f172a] bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e293b] disabled:opacity-50"
        >
          {saving ? '儲存中…' : '儲存設定'}
        </button>
      </div>
    </div>
  );
}
