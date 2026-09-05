// 比賽場地 → 地理坐標（用於 Open-Meteo 天氣預報）
// 香港港島人工草地球場
export interface VenueCoord {
  lat: number;
  lon: number;
}

// 場地名稱（中英混排）→ 坐標；未知/TBC 回傳 null（唔顯示天氣）
export function venueCoord(venue: string | null | undefined): VenueCoord | null {
  if (!venue) return null;
  const v = venue.toLowerCase();
  if (v.includes('tbc') || v.trim() === '') return null;
  // 跑馬地遊樂場 Happy Valley Recreation Ground
  if (v.includes('happy valley') || v.includes('跑馬地')) {
    return { lat: 22.2704, lon: 114.1849 };
  }
  // 中山紀念公園 Sun Yat Sen Memorial Park
  if (v.includes('sun yat sen') || v.includes('中山')) {
    return { lat: 22.2898, lon: 114.1441 };
  }
  // 鰂魚涌公園 Quarry Bay Park
  if (v.includes('quarry bay') || v.includes('鰂魚涌')) {
    return { lat: 22.2914, lon: 114.2124 };
  }
  // 後備：場地名稱未知但非 TBC，用香港島中心（中環）作近似
  return { lat: 22.28, lon: 114.17 };
}

// WMO weather code → 圖標 + 中文描述
export function describeWeather(code: number): { icon: string; zh: string; en: string } {
  if (code === 0) return { icon: '☀️', zh: '天晴', en: 'Clear' };
  if (code === 1) return { icon: '🌤️', zh: '大致天晴', en: 'Mostly clear' };
  if (code === 2) return { icon: '⛅', zh: '多雲', en: 'Partly cloudy' };
  if (code === 3) return { icon: '☁️', zh: '陰天', en: 'Overcast' };
  if (code === 45 || code === 48) return { icon: '🌫️', zh: '有霧', en: 'Fog' };
  if (code >= 51 && code <= 57) return { icon: '🌦️', zh: '毛毛雨', en: 'Drizzle' };
  if (code >= 61 && code <= 67) return { icon: '🌧️', zh: '有雨', en: 'Rain' };
  if (code >= 71 && code <= 77) return { icon: '🌨️', zh: '有雪', en: 'Snow' };
  if (code >= 80 && code <= 82) return { icon: '🌧️', zh: '驟雨', en: 'Showers' };
  if (code >= 85 && code <= 86) return { icon: '🌨️', zh: '驟雪', en: 'Snow showers' };
  if (code === 95) return { icon: '⛈️', zh: '雷暴', en: 'Thunderstorm' };
  if (code >= 96) return { icon: '⛈️', zh: '雷暴冰雹', en: 'Thunderstorm + hail' };
  return { icon: '🌡️', zh: '天氣', en: 'Weather' };
}
