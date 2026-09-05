// 比賽 → Google Calendar 新增事件連結（一按加入自己日曆，唔使下載檔案）

export interface CalendarMatch {
  homeTeam: string;
  awayTeam: string;
  date: string | Date | null; // 開賽時間
  venue?: string | null;
  round?: string | null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// 轉做 Google Calendar 用嘅 UTC 格式：YYYYMMDDTHHMMSSZ
function gcalTime(d: Date, addHours: number): string {
  const t = new Date(d.getTime() + addHours * 3600 * 1000);
  return (
    `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`
  );
}

export function googleCalendarUrl(m: CalendarMatch): string | null {
  if (!m.date) return null;
  const start = new Date(m.date);
  if (isNaN(start.getTime())) return null;

  // 預設事件時長 2 小時（60 分鐘比賽 + 熱身/換人）
  const dates = `${gcalTime(start, 0)}/${gcalTime(start, 2)}`;
  const title = `⚽ ${m.homeTeam} vs ${m.awayTeam}`;
  const details = [
    `HK Bank League 2026`,
    m.round ? m.round : '',
    `${m.homeTeam} (主場) vs ${m.awayTeam} (作客)`,
  ]
    .filter(Boolean)
    .join(' — ');
  const location = m.venue && !/^tbc$/i.test(m.venue.trim()) ? m.venue : '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details,
  });
  if (location) params.set('location', location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
