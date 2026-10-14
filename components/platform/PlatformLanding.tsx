'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

/**
 * SaaS marketing landing rendered ONLY on the platform host (e.g.
 * platform.zenex-sports.com/). League tenants render their own fixtures /
 * standings homepage instead — see app/page.tsx host branch.
 *
 * Self-contained chrome (its own header/footer) so it never inherits the
 * league-specific Navbar or the "Hong Kong Bank League" branding.
 *
 * All internal links are RELATIVE paths: this component only renders on the
 * platform host, so /apply and /platform resolve there without a full-page
 * reload (client navigation) and work on local/preview hosts too.
 */

type Feature = { zh: string; en: string; descZh: string; descEn: string; icon: string };

const FEATURES: Feature[] = [
  {
    zh: '賽程與賽果',
    en: 'Fixtures & Results',
    descZh: '一頁管理對賽、時間、場地，賽果即時更新，自動計算積分榜。',
    descEn: 'Manage matches, times and venues; results update the standings automatically.',
    icon: '📅',
  },
  {
    zh: '球隊與球員',
    en: 'Teams & Squads',
    descZh: '每支球隊擁有獨立帳號，可自行提交陣容、更新球員資料。',
    descEn: 'Each team gets its own login to submit squads and keep player info current.',
    icon: '👥',
  },
  {
    zh: '即時積分榜',
    en: 'Live Standings',
    descZh: '勝和負、得失球、排名自動運算，主頁清晰呈現。',
    descEn: 'Points, goal difference and ranking calculated and shown on the public home.',
    icon: '🏆',
  },
  {
    zh: '雙語支援',
    en: 'Bilingual (中/EN)',
    descZh: '全站中英對照，一鍵切換，適合香港各類聯賽。',
    descEn: 'Full Chinese/English UI with one-click toggle, built for Hong Kong leagues.',
    icon: '🌐',
  },
  {
    zh: '專屬網址與外觀',
    en: 'Your own subdomain',
    descZh: '每個聯賽擁有獨立子網域，數據互相隔離，安全清晰。',
    descEn: 'Every league runs on its own subdomain with fully isolated data.',
    icon: '🔒',
  },
  {
    zh: '開箱即用',
    en: 'Ready to run',
    descZh: '申請、開通、帳號開立一條龍，無需技術知識即可上手。',
    descEn: 'Apply, approve and get your admin login — no technical setup required.',
    icon: '⚡',
  },
];

const STEPS = [
  { zh: '提交申請', en: 'Apply' },
  { zh: '我們審批並為你開通', en: 'We approve & provision' },
  { zh: '收到管理帳號登入', en: 'Receive your login' },
  { zh: '開始管理你的聯賽', en: 'Run your league' },
];

export default function PlatformLanding() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const t = (zh: string, en: string) => (isZh ? zh : en);

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" draggable={false} priority />
            <span className="text-lg font-bold tracking-wide">ZENEX Sports</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label={t('平台導覽', 'Platform navigation')}>
            <LanguageToggle />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10"
            >
              {t('登入', 'Sign in')}
            </Link>
            <Link
              href="/apply"
              className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              {t('開辦聯賽', 'Start a league')}
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              {t('聯賽管理平台 · SaaS', 'League management platform')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              {t('為你的足球聯賽，開一個專屬網站', 'Run your football league on its own site')}
            </h1>
            <p className="mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg">
              {t(
                '賽程、賽果、積分榜、球隊與球員管理一應俱全。申請開通即可獲得獨立網址與管理後台，中英對照，開箱即用。',
                'Fixtures, results, standings and squad management in one place. Apply and get your own subdomain and admin console — bilingual and ready to use.'
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
              >
                {t('免費申請開辦', 'Apply to start')}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('我已有帳號', 'I have an account')}
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              {t('提交後我們會盡快審批，開通後自動發送管理帳號到你的電郵。', 'We review every application and email your admin login once approved.')}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          {t('聯賽營運需要的，全部都有', 'Everything you need to run a league')}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t('由開季到頒獎，一個平台搞掂所有賽務。', 'From kick-off to the trophy — all your league operations in one place.')}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.en}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-2xl dark:bg-zinc-800"
                aria-hidden="true"
              >
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold">{t(f.zh, f.en)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(f.descZh, f.descEn)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t('四步開通', 'Live in four steps')}</h2>
          <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.en} className="relative rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
                  {i + 1}
                </div>
                <p className="mt-3 text-sm font-medium">{t(s.zh, s.en)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-zinc-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('準備好開辦你的聯賽？', 'Ready to launch your league?')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-300">
            {t('立即申請，簡單幾步即可擁有專屬聯賽網站。', 'Apply now and get your dedicated league site in just a few steps.')}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              {t('申請開辦', 'Start your league')}
            </Link>
            <Link
              href="/platform"
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              {t('平台管理員入口 →', 'Platform admin →')}
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p>© {new Date().getFullYear()} ZENEX Sports. {t('版權所有。', 'All rights reserved.')}</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/apply" className="hover:text-zinc-700 dark:hover:text-zinc-200">
              {t('開辦聯賽', 'Run your league')}
            </Link>
            <Link href="/login" className="hover:text-zinc-700 dark:hover:text-zinc-200">
              {t('登入', 'Sign in')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
