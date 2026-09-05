'use client';

import { useEffect, useState } from 'react';
import { venueCoord, describeWeather } from '@/lib/weather';

// 模組級快取：同一球場只抓一次（一個 forecast 已含未來 16 日）
const forecastCache = new Map<string, Promise<Record<string, DayWeather> | null>>();

interface DayWeather {
  code: number;
  tmax: number;
  tmin: number;
  precip: number;
}

function dateKey(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fetchForecast(lat: number, lon: number): Promise<Record<string, DayWeather> | null> {
  const key = `${lat},${lon}`;
  const cached = forecastCache.get(key);
  if (cached) return cached;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=Asia%2FHong_Kong&forecast_days=16`;

  const p = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j || !j.daily) return null;
      const d = j.daily;
      const map: Record<string, DayWeather> = {};
      const times: string[] = d.time || [];
      times.forEach((t: string, i: number) => {
        map[t] = {
          code: d.weather_code?.[i] ?? 0,
          tmax: Math.round(d.temperature_2m_max?.[i] ?? 0),
          tmin: Math.round(d.temperature_2m_min?.[i] ?? 0),
          precip: d.precipitation_probability_max?.[i] ?? 0,
        };
      });
      return map;
    })
    .catch(() => null);

  forecastCache.set(key, p);
  return p;
}

export default function MatchWeather({
  venue,
  date,
  className = '',
}: {
  venue: string | null;
  date: string | Date | null;
  className?: string;
}) {
  const [w, setW] = useState<DayWeather | null>(null);

  useEffect(() => {
    const coord = venueCoord(venue);
    // 冇場地/TBC 或日期：維持初始 null（唔同步 setState，觸發 set-state-in-effect）
    if (!coord || !date) return;
    let alive = true;
    fetchForecast(coord.lat, coord.lon).then((map) => {
      if (!alive) return;
      setW(map ? map[dateKey(date)] ?? null : null);
    });
    return () => {
      alive = false;
    };
  }, [venue, date]);

  if (!w) return null;

  const info = describeWeather(w.code);
  const rainy = w.precip >= 50 || w.code >= 80;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        rainy ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
      } ${className}`}
      title={`${info.zh} / ${info.en} · 降雨機率 ${w.precip}%`}
    >
      <span>{info.icon}</span>
      <span>
        {w.tmin}–{w.tmax}°C
      </span>
      <span className="opacity-70">· 💧{w.precip}%</span>
    </span>
  );
}
