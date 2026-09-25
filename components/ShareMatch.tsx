'use client';

import { useState } from 'react';
import { venueMapsUrl } from '@/lib/weather';
import { useLanguage } from '@/context/LanguageContext';

interface ShareMatchProps {
  homeTeam: string;
  awayTeam: string;
  date: string | Date | null;
  venue?: string | null;
  round?: string | null;
  className?: string;
  iconOnly?: boolean;
}

function buildText(p: ShareMatchProps, language: 'zh' | 'en'): string {
  const when = p.date
    ? new Date(p.date).toLocaleString(language === 'zh' ? 'zh-HK' : 'en-GB', {
        timeZone: 'Asia/Hong_Kong',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBC';
  const lines = [
    `⚽ ${p.homeTeam} vs ${p.awayTeam}`,
    p.round ? `📅 ${when}（${p.round}）` : `📅 ${when}`,
  ];
  if (p.venue && !/^tbc$/i.test(p.venue.trim())) {
    lines.push(`📍 ${p.venue}`);
    const maps = venueMapsUrl(p.venue);
    if (maps) lines.push(`${language === 'zh' ? '🗺️ 地圖：' : '🗺️ Map: '}${maps}`);
  }
  lines.push(language === 'zh' ? '— 香港銀行足球聯賽 2026' : '— HK Bank League 2026');
  return lines.join('\n');
}

export default function ShareMatch(props: ShareMatchProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = buildText(props, language);
  const enc = encodeURIComponent(text);
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin + '/fixtures' : 'https://football-league-system-zenex.vercel.app/fixtures';

  const wa = `https://wa.me/?text=${enc}`;
  const tg = `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${enc}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard 不可用就算，唔報錯
    }
  };

  return (
    <div className={`relative inline-block ${props.className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className={
          props.iconOnly
            ? 'inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-base text-slate-600 hover:bg-slate-300'
            : 'inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-700'
        }
      >
        📤{props.iconOnly ? '' : ` ${t('分享', 'Share')}`}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            🟢 WhatsApp
          </a>
          <a
            href={tg}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            ✈️ Telegram
          </a>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={copy}
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
          >
            {copied ? t('✅ 已複製', '✅ Copied') : t('📋 複製文字', '📋 Copy text')}
          </button>
        </div>
      )}
    </div>
  );
}
