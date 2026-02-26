'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (zh: string, en: string) => string;
}

const defaultContext: LanguageContextType = {
  language: 'zh',
  setLanguage: () => {},
  t: (zh: string) => zh,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language;
      if (saved) {
        setLanguage(saved);
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (zh: string, en: string): string => {
    if (!mounted) return zh; // Default to Chinese during SSR
    return language === 'zh' ? zh : en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}

// 常用翻譯
export const translations = {
  // Navigation
  standings: { zh: '積分榜', en: 'Standings' },
  fixtures: { zh: '賽程', en: 'Fixtures' },
  results: { zh: '結果', en: 'Results' },
  teams: { zh: '球隊', en: 'Teams' },
  players: { zh: '球員', en: 'Players' },
  admin: { zh: '後台', en: 'Admin' },
  
  // Home Page
  leagueTable: { zh: '積分榜 2026', en: 'League Table 2026' },
  liveUpdate: { zh: '即時更新', en: 'LIVE UPDATE' },
  rank: { zh: '排名', en: 'Rank' },
  team: { zh: '球隊', en: 'Team' },
  played: { zh: '踢咗', en: 'Played' },
  won: { zh: '贏', en: 'Won' },
  drawn: { zh: '和', en: 'Drawn' },
  lost: { zh: '輸', en: 'Lost' },
  gf: { zh: '入球', en: 'GF' },
  ga: { zh: '失球', en: 'GA' },
  gd: { zh: '球差', en: 'GD' },
  points: { zh: '分數', en: 'Points' },
  upcomingFixtures: { zh: '近期賽事', en: 'Upcoming Fixtures' },
  recentResults: { zh: '最近結果', en: 'Recent Results' },
  home: { zh: '主場', en: 'Home' },
  away: { zh: '作客', en: 'Away' },
  venue: { zh: '場地', en: 'Venue' },
  final: { zh: '完場', en: 'Final' },
  
  // Teams Page
  teamList: { zh: '球隊列表', en: 'Team List' },
  squad: { zh: '球員名單', en: 'Squad' },
  viewAll: { zh: '查看全部', en: 'View All' },
  noTeams: { zh: '暫時沒有球隊資料', en: 'No teams available' },
  
  // Status
  active: { zh: '活躍', en: 'Active' },
  injured: { zh: '受傷', en: 'Injured' },
  suspended: { zh: '停賽', en: 'Suspended' },
  inactive: { zh: '非活躍', en: 'Inactive' },
};
