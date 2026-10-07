// 球場地址雙語 normalization
// DB 入面歷史數據可能淨係存中文、淨係存英文、或中英括號混排。
// 顯示時統一返做「中文 (English)」，唔改 DB 原值（maps / weather 照用原字 match）。

export interface VenueEntry {
  zh: string;
  en: string;
  // 關鍵字（細寫），中咗就歸類呢個場
  keywords: string[];
}

// 已知嘅香港島球場（同 UpcomingFixtures 編輯選項一致）
export const VENUE_ENTRIES: VenueEntry[] = [
  {
    zh: '跑馬地遊樂場 8 號場',
    en: 'Happy Valley Recreation Ground No. 8',
    keywords: ['happy valley', '跑馬地', '跑马地'],
  },
  {
    zh: '跑馬地遊樂場 3 號場',
    en: 'Happy Valley Recreation Ground No. 3',
    keywords: ['happy valley', '跑馬地', '跑马地'],
  },
  {
    zh: '跑馬地遊樂場',
    en: 'Happy Valley Recreation Ground',
    keywords: ['happy valley', '跑馬地', '跑马地'],
  },
  {
    zh: '中山紀念公園',
    en: 'Sun Yat Sen Memorial Park',
    keywords: ['sun yat sen', '中山'],
  },
  {
    zh: '鰂魚涌公園 1 號場',
    en: 'Quarry Bay Park No. 1, near Taikoo Shing',
    keywords: ['quarry bay', '鰂魚涌', '鲗鱼涌'],
  },
  {
    zh: '鰂魚涌公園 2 號場',
    en: 'Quarry Bay Park No. 2, near Quarry Bay Station',
    keywords: ['quarry bay', '鰂魚涌', '鲗鱼涌'],
  },
  {
    zh: '鰂魚涌公園',
    en: 'Quarry Bay Park',
    keywords: ['quarry bay', '鰂魚涌', '鲗鱼涌'],
  },
];

// 編輯表單 datalist 用嘅標準中英選項
export const VENUE_OPTIONS: string[] = [
  '跑馬地遊樂場 8 號場 (Happy Valley Recreation Ground No. 8)',
  '跑馬地遊樂場 3 號場 (Happy Valley Recreation Ground No. 3)',
  '中山紀念公園 (Sun Yat Sen Memorial Park)',
  '鰂魚涌公園 1 號場 (Quarry Bay Park No. 1, near Taikoo Shing)',
  '鰂魚涌公園 2 號場 (Quarry Bay Park No. 2, near Quarry Bay Station)',
  'TBC',
];

function courtNumber(raw: string): number | null {
  // "No. 8" / "no 2" / "8 號場" / "1号"
  const en = raw.match(/\bn?o\.?\s*([0-9]+)/i);
  if (en) return Number(en[1]);
  const zh = raw.match(/([0-9]+)\s*[號号]/);
  if (zh) return Number(zh[1]);
  return null;
}

// 由已知場地當中揀最匹配嘅一項
function matchKnown(raw: string): VenueEntry | null {
  const v = raw.toLowerCase();
  const group = VENUE_ENTRIES.filter((e) => e.keywords.some((k) => v.includes(k)));
  if (group.length === 0) return null;

  // 跑馬地：按場號區分（預設沿用 8 號場）
  if (group.some((e) => e.keywords.includes('happy valley'))) {
    const num = courtNumber(v);
    if (num === 3) return VENUE_ENTRIES.find((e) => e.en === 'Happy Valley Recreation Ground No. 3')!;
    if (num === 8) return VENUE_ENTRIES.find((e) => e.en === 'Happy Valley Recreation Ground No. 8')!;
    return VENUE_ENTRIES.find((e) => e.en === 'Happy Valley Recreation Ground No. 8')!;
  }
  // 中山紀念公園
  if (group.some((e) => e.keywords.includes('中山'))) {
    return VENUE_ENTRIES.find((e) => e.en === 'Sun Yat Sen Memorial Park')!;
  }
  // 鰂魚涌：按場號區分
  const num = courtNumber(v);
  if (num === 1) return VENUE_ENTRIES.find((e) => e.en.startsWith('Quarry Bay Park No. 1'))!;
  if (num === 2) return VENUE_ENTRIES.find((e) => e.en.startsWith('Quarry Bay Park No. 2'))!;
  return VENUE_ENTRIES.find((e) => e.en === 'Quarry Bay Park')!;
}

// 拆「中文 (English)」一類已經係雙語嘅輸入
function splitParen(raw: string): { zh: string; en: string } | null {
  const m = raw.trim().match(/^(.+?)[（(]\s*([^)）]+?)\s*[)）]\s*$/);
  if (!m) return null;
  const zh = m[1].trim();
  const en = m[2].trim();
  if (!zh || !en) return null;
  return { zh, en };
}

// 返雙語 parts；未知場地就盡量保留原結構
export function bilingualVenueParts(venue: string | null | undefined): { zh: string; en: string } | null {
  if (!venue) return null;
  const raw = venue.trim();
  if (!raw) return null;
  if (/^tbc$/i.test(raw)) return { zh: 'TBC', en: 'TBC' };

  const known = matchKnown(raw);
  if (known) return { zh: known.zh, en: known.en };

  // 未知但本身已經有中英括號：原樣返
  const split = splitParen(raw);
  if (split) return split;

  // 未知場地：純中／純英都冇得對，惟有原字
  return { zh: raw, en: raw };
}

// 完整雙語地址：「中文 (English, 連近邊個站嘅說明)」
export function bilingualVenue(venue: string | null | undefined): string {
  const p = bilingualVenueParts(venue);
  if (!p) return '';
  if (p.zh === p.en) return p.zh;
  return `${p.zh} (${p.en})`;
}

// 核心雙語（一行短版）：去掉 ", near ..." 嘅車站說明，首頁 / 卡片用
export function bilingualCoreVenue(venue: string | null | undefined): string {
  const p = bilingualVenueParts(venue);
  if (!p) return '';
  const enCore = p.en.replace(/,\s*near\s.*$/i, '').trim();
  if (p.zh === enCore || p.zh === p.en) return p.zh;
  return `${p.zh} (${enCore})`;
}
