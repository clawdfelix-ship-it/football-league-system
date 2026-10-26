'use client';

import { useState, useEffect } from 'react';

type SiteSettings = {
  heroTitle?: string;
  heroSubtitle?: string;
  venues?: string[];
  navbarLinks?: Array<{ href: string; zh: string; en: string }>;
  footerLinks?: Array<{ href: string; label: string }>;
};

type Props = { leagueId: number };

export function SiteSettingsPanel({ leagueId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [venues, setVenues] = useState('');
  const [navbarLinks, setNavbarLinks] = useState('');
  const [footerLinks, setFooterLinks] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/leagues/${leagueId}/settings`, { cache: 'no-store' });
        if (!res.ok) throw new Error('載入失敗');
        const body = await res.json();
        if (body?.ok) {
          const d = body.data;
          const s = (d.siteSettings as SiteSettings) || {};
          setHeroTitle(s.heroTitle ?? '');
          setHeroSubtitle(s.heroSubtitle ?? '');
          setVenues((s.venues ?? []).join('\n'));
          setNavbarLinks((s.navbarLinks ?? []).map((l) => `${l.href}|${l.zh}|${l.en}`).join('\n'));
          setFooterLinks((s.footerLinks ?? []).map((l) => `${l.href}|${l.label}`).join('\n'));
        }
      } catch {
        setError('載入設定失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, [leagueId]);

  async function save() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const siteSettings: SiteSettings = {};
      if (heroTitle.trim()) siteSettings.heroTitle = heroTitle.trim();
      if (heroSubtitle.trim()) siteSettings.heroSubtitle = heroSubtitle.trim();
      if (venues.trim()) siteSettings.venues = venues.split('\n').map((v) => v.trim()).filter(Boolean);
      if (navbarLinks.trim()) {
        siteSettings.navbarLinks = navbarLinks
          .split('\n')
          .map((line) => {
            const [href, zh, en] = line.split('|').map((s) => s.trim());
            return href && zh && en ? { href, zh, en } : null;
          })
          .filter(Boolean) as Array<{ href: string; zh: string; en: string }>;
      }
      if (footerLinks.trim()) {
        siteSettings.footerLinks = footerLinks
          .split('\n')
          .map((line) => {
            const [href, label] = line.split('|').map((s) => s.trim());
            return href && label ? { href, label } : null;
          })
          .filter(Boolean) as Array<{ href: string; label: string }>;
      }

      const res = await fetch(`/api/leagues/${leagueId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteSettings }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '儲存失敗');
      setSuccess('已儲存前台設定');
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">載入中…</p>;

  return (
    <div className="space-y-4">
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">首頁 Hero 標題</label>
        <input
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
          placeholder="例如：Hong Kong Bank League 2026"
          className="field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">首頁 Hero 副標</label>
        <input
          value={heroSubtitle}
          onChange={(e) => setHeroSubtitle(e.target.value)}
          placeholder="例如：第九屆香港銀行家足球聯賽"
          className="field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">場地選項（每行一個）</label>
        <textarea
          value={venues}
          onChange={(e) => setVenues(e.target.value)}
          rows={5}
          placeholder="跑馬地遊樂場 3 號場 (Happy Valley Recreation Ground No. 3)&#10;中山紀念公園 (Sun Yat Sen Memorial Park)"
          className="field font-mono text-xs"
        />
        <p className="mt-1 text-xs text-slate-500">呢啲場地會喺 admin 新增/編輯比賽時出現喺下拉選單。</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">自訂 Navbar 連結（每行一個，格式：href|中文|English）</label>
        <textarea
          value={navbarLinks}
          onChange={(e) => setNavbarLinks(e.target.value)}
          rows={4}
          placeholder="/about|關於我們|About Us&#10;/sponsors|贊助商|Sponsors"
          className="field font-mono text-xs"
        />
        <p className="mt-1 text-xs text-slate-500">留空即用預設導航。格式錯誤嘅行會被忽略。</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">自訂 Footer 連結（每行一個，格式：href|顯示文字）</label>
        <textarea
          value={footerLinks}
          onChange={(e) => setFooterLinks(e.target.value)}
          rows={4}
          placeholder="/contact|聯絡我們&#10;/faq|常見問題"
          className="field font-mono text-xs"
        />
      </div>

      <button onClick={() => void save()} disabled={saving} className="btn-admin-primary">
        {saving ? '儲存中…' : '儲存前台設定'}
      </button>
    </div>
  );
}
