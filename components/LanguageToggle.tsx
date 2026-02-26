'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
      className="text-sm font-medium bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
    >
      <span className={language === 'zh' ? 'text-yellow-400' : 'text-gray-400'}>中文</span>
      <span className="text-gray-500">|</span>
      <span className={language === 'en' ? 'text-yellow-400' : 'text-gray-400'}>EN</span>
    </button>
  );
}
