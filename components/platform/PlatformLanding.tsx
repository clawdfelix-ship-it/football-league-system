'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

/**
 * SaaS marketing landing rendered ONLY on the platform host (e.g.
 * platform.zenex-sports.com/). League tenants render their own fixtures /
 * standings homepage instead, see app/page.tsx host branch.
 *
 * Design system: anti-slop landing built on Tailwind + Geist. Locked LIGHT
 * theme, single brand-blue accent (#1a237e, matching the tenant product),
 * asymmetric split hero with a REAL product screenshot, bento feature grid
 * with real product imagery (not six equal emoji cards). Relative links so
 * /apply and /platform resolve on the platform host with client navigation.
 */

/* ------------------------------------------------------------------ */
/* Content (zh / en)                                                   */
/* ------------------------------------------------------------------ */

const HERO = {
  eyebrowZh: '聯賽管理平台',
  eyebrowEn: 'League management platform',
  titleZh: '為你的足球聯賽，開一個專屬網站',
  titleEn: 'Run your football league on its own site',
  subZh: '賽程、賽果、積分榜、球隊與球員，一個平台搞掂。申請開通即有獨立網址同管理後台，中英對照。',
  subEn: 'Fixtures, results, standings and squads in one place. Apply and get your own subdomain and admin console, bilingual and ready to run.',
  primaryZh: '開辦聯賽',
  primaryEn: 'Start a league',
  secondaryZh: '登入',
  secondaryEn: 'Sign in',
};

const STATS = [
  { n: '9', labelZh: '支球隊同場管理', labelEn: 'clubs managed live' },
  { n: '2', labelZh: '語言一鍵切換', labelEn: 'languages, one toggle' },
  { n: '1', labelZh: '個聯賽一個獨立網址', labelEn: 'dedicated subdomain per league' },
];

/* Real match-night photography (4:3, floodlit city pitches). Ordered for the
   rotating hero backdrop; the same set drives the gallery slider below. */
const GALLERY = [
  { src: '/platform/gallery/match-7.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-5.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-4.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-2.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-1.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-3.jpg', w: 1600, h: 1200 },
  { src: '/platform/gallery/match-8.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-9.jpg', w: 1920, h: 1440 },
  { src: '/platform/gallery/match-6.jpg', w: 1920, h: 1440 },
];

/* Bento cells: mixed sizes, 5 cells total (exact count rule). */
const BENTO = [
  {
    span: 'lg:col-span-2',
    titleZh: '即時積分榜',
    titleEn: 'Live standings',
    bodyZh: '勝和負、得失球、排名自動運算，主頁清晰呈現。',
    bodyEn: 'Points, goal difference and rank calculated automatically and shown on the public home.',
    image: '/platform/screen-standings.png',
    imageClassName: 'inset-x-6 top-16 bottom-6',
  },
  {
    span: '',
    titleZh: '賽程與賽果',
    titleEn: 'Fixtures & results',
    bodyZh: '對賽、時間、場地一頁管理，賽後輸入比數即時更新。',
    bodyEn: 'Manage matches, kick-off times and venues; enter a score and everything updates.',
    image: '/platform/screen-fixtures.png',
    imageClassName: 'inset-x-5 top-16 bottom-5',
  },
  {
    span: '',
    titleZh: '球隊與球員',
    titleEn: 'Teams & squads',
    bodyZh: '每支球隊有獨立帳號，自行提交陣容、更新球員資料。',
    bodyEn: 'Each club gets its own login to submit the squad and keep player profiles current.',
    image: null,
  },
  {
    span: '',
    titleZh: '中英雙語',
    titleEn: 'Bilingual 中 / EN',
    bodyZh: '全站中英對照，一鍵切換，切合香港聯賽需要。',
    bodyEn: 'Full Chinese and English interface with a single toggle, built for Hong Kong leagues.',
    image: null,
  },
  {
    span: 'lg:col-span-2',
    titleZh: '手機都用到',
    titleEn: 'Built for mobile',
    bodyZh: '球場上用手機睇賽程、入賽果、查積分，版面完全適應手機。',
    bodyEn: 'Check the schedule, post results and follow the table from your phone at the ground. Fully responsive.',
    image: '/platform/screen-mobile.png',
    imageClassName: 'right-8 top-10 bottom-5 left-auto w-[38%]',
  },
];

const STEPS = [
  { zh: '提交申請', en: 'Submit your application' },
  { zh: '我們審批並開通', en: 'We approve and provision' },
  { zh: '收到管理帳號', en: 'Receive your admin login' },
  { zh: '開始管理聯賽', en: 'Run your league' },
];

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll (transform + opacity only, reduced-motion aware)  */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Entrance animation is applied imperatively to the DOM (an external-system
  // sync with IntersectionObserver), NOT via React state. The base markup is
  // always fully visible, so SSR, no-JS clients and SEO/social crawlers see
  // every section; only motion-allowing browsers briefly add the pre-reveal
  // styles on mount and then transition in. prefers-reduced-motion users get
  // no hidden state at all.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const reveal = () => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    };
    // Already on/above the fold on first paint → leave visible, no animation.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    el.style.transition = `opacity 540ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 620ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cross-fading match-night backdrop for the hero (RAF/timer driven,    */
/* reduced-motion + no-JS safe: first frame is a static image).        */
/* ------------------------------------------------------------------ */

const HERO_ROTATE_MS = 6000;

function HeroBackdrop() {
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (GALLERY.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let active = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const prev = layersRef.current[active];
      active = (active + 1) % GALLERY.length;
      const next = layersRef.current[active];
      if (next) next.style.opacity = '1';
      timer = setTimeout(() => {
        if (prev) prev.style.opacity = '0';
      }, 120);
      timer = setTimeout(tick, HERO_ROTATE_MS);
    };
    // Give the browser a beat to decode the next layer before the first swap.
    timer = setTimeout(tick, HERO_ROTATE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {GALLERY.map((g, i) => (
        <div
          key={g.src}
          ref={(el) => {
            layersRef.current[i] = el;
          }}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ease-out"
          style={{
            backgroundImage: `url(${g.src})`,
            opacity: i === 0 ? 1 : 0,
          }}
        />
      ))}
      {/* Legibility scrim: strong dark anchor behind the left copy column,      
         fading toward the product mockup; plus top/bottom vignettes. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, rgba(2,6,23,0.97) 0%, rgba(2,6,23,0.92) 34%, rgba(2,6,23,0.55) 58%, rgba(2,6,23,0.30) 78%, rgba(2,6,23,0.42) 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/55" />
      {/* Soft radial behind copy to flatten busy jerseys/faces. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 18% 45%, rgba(2,6,23,0.72), rgba(2,6,23,0) 60%)',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auto-playing gallery slider (DOM/timer, pause on hover/focus,       */
/* reduced-motion + no-JS safe — first slide always visible).          */
/* ------------------------------------------------------------------ */

const SLIDE_MS = 4200;

function GallerySlider({ t }: { t: (zh: string, en: string) => string }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (GALLERY.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let paused = false;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (!paused) setIndex((v) => (v + 1) % GALLERY.length);
      timer = setTimeout(advance, SLIDE_MS);
    };
    timer = setTimeout(advance, SLIDE_MS);
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    const root = trackRef.current;
    root?.addEventListener('mouseenter', pause);
    root?.addEventListener('mouseleave', resume);
    root?.addEventListener('focusin', pause);
    root?.addEventListener('focusout', resume);
    return () => {
      clearTimeout(timer);
      root?.removeEventListener('mouseenter', pause);
      root?.removeEventListener('mouseleave', resume);
      root?.removeEventListener('focusin', pause);
      root?.removeEventListener('focusout', resume);
    };
  }, []);

  const go = (i: number) => setIndex(((i % GALLERY.length) + GALLERY.length) % GALLERY.length);

  return (
    <div
      ref={trackRef}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl shadow-slate-900/10"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('比賽夜相簿', 'Match-night photo gallery')}
    >
      <div className="flex aspect-[4/3] w-full sm:aspect-[16/9]">
        {GALLERY.map((g, i) => (
          <div
            key={g.src}
            className="relative h-full w-full shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${-index * 100}%)` }}
            aria-hidden={i === index ? undefined : true}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.src}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {GALLERY.map((g, i) => (
          <button
            key={g.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Site header — transparent over the dark hero, frosts on scroll.     */
/* Scroll state is synced to the DOM/className, content visible always. */
/* ------------------------------------------------------------------ */

function SiteHeader({ t }: { t: (zh: string, en: string) => string }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      if (window.scrollY > 24) el.dataset.scrolled = 'true';
      else delete el.dataset.scrolled;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 border-b border-transparent transition-colors duration-300 data-[scrolled=true]:border-white/10 data-[scrolled=true]:bg-slate-950/80 data-[scrolled=true]:backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain drop-shadow" draggable={false} priority />
          <span className="text-[17px] font-bold tracking-tight text-white">ZENEX Sports</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label={t('平台導覽', 'Platform navigation')}>
          <LanguageToggle />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            {t(HERO.secondaryZh, HERO.secondaryEn)}
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[#1a237e] shadow-sm transition-all duration-200 hover:bg-blue-50 active:scale-[0.98]"
          >
            {t(HERO.primaryZh, HERO.primaryEn)}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PlatformLanding() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const t = (zh: string, en: string) => (isZh ? zh : en);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-slate-900 antialiased">
      {/* Header — transparent over the dark hero, frosts to dark on scroll;
          white label/links so it reads on photography. */}
      <SiteHeader t={t} />

      <main id="main-content" className="flex-1">
        {/* Split hero: cinematic match-night backdrop + left copy, right preview */}
        <section className="relative overflow-hidden border-b border-slate-900/10 bg-slate-950">
          <HeroBackdrop />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-28">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {t(HERO.eyebrowZh, HERO.eyebrowEn)}
                </span>
              </Reveal>
              <Reveal delay={70}>
                <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_24px_rgba(2,6,23,0.65)] sm:text-5xl">
                  {t(HERO.titleZh, HERO.titleEn)}
                </h1>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-5 max-w-xl text-base font-normal leading-relaxed text-white [text-shadow:0_1px_18px_rgba(2,6,23,0.8)] sm:text-lg">
                  {t(HERO.subZh, HERO.subEn)}
                </p>
              </Reveal>
              <Reveal delay={210}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/apply"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#1a237e] shadow-lg shadow-black/20 transition-all duration-200 hover:gap-3 hover:bg-blue-50 active:scale-[0.98]"
                  >
                    {t(HERO.primaryZh, HERO.primaryEn)}
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/60 hover:bg-white/10 active:scale-[0.98]"
                  >
                    {t(HERO.secondaryZh, HERO.secondaryEn)}
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={280}>
                <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                  {STATS.map((s) => (
                    <div key={s.n + s.labelEn}>
                      <dt className="text-2xl font-extrabold tracking-tight text-white">{s.n}</dt>
                      <dd className="mt-1 text-xs leading-snug text-blue-50/90">{t(s.labelZh, s.labelEn)}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {/* Real product preview, framed like a browser window */}
            <Reveal delay={160} className="relative">
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-tr from-[#1a237e]/40 to-transparent blur-2xl" />
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/40 ring-1 ring-black/20">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                    <span className="ml-3 hidden truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200 sm:block">
                      hkbankleague2026.zenex-sports.com
                    </span>
                  </div>
                  <Image
                    src="/platform/screen-home.png"
                    alt={t('真實聯賽網站預覽', 'Preview of a live league site')}
                    width={1440}
                    height={900}
                    priority
                    className="block h-auto w-full"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Match-night photo gallery */}
        <section className="border-b border-slate-200 bg-slate-950 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <Reveal>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                  {t('比賽夜現場', 'Match night')}
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t('每週幾隊波，一齊踢、一齊贏', 'Clubs that play together, week after week')}
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-300">
                  {t('燈光球場、高樓夜景、賽後大合照——你嘅聯賽都可以有呢種氣氛。以下全部係平台上聯賽嘅真實夜晚。', 'Floodlit pitches, city lights and the post-match line-up — your league can feel like this too. Every frame below is a real night on the platform.')}
                </p>
                <Link
                  href="/apply"
                  className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1a237e] transition-all duration-200 hover:gap-2.5 hover:bg-blue-50"
                >
                  {t(HERO.primaryZh, HERO.primaryEn)}
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <GallerySlider t={t} />
            </Reveal>
          </div>
        </section>

        {/* Bento features — 5 mixed-size cells with real imagery */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t('開季到頒獎，一個平台搞掂', 'From kick-off to the trophy, one platform')}
            </h2>
          </Reveal>
          <Reveal delay={70}>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
              {t('下圖全部來自正在運作的聯賽網站，唔係概念稿。', 'Everything below is captured from a league running on the platform today, not a mockup.')}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BENTO.map((b, i) => (
              <Reveal key={b.titleEn} delay={(i % 3) * 80} className={b.span}>
                <article
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 ${
                    b.image ? 'min-h-[340px]' : ''
                  }`}
                >
                  {b.image ? (
                    <>
                      <div className="relative flex-1 overflow-hidden bg-slate-100">
                        <Image
                          src={b.image}
                          alt=""
                          width={b.image.includes('mobile') ? 390 : 1440}
                          height={b.image.includes('mobile') ? 844 : 900}
                          className={`absolute ${b.imageClassName} h-auto rounded-lg border border-slate-200 object-cover shadow-lg transition-transform duration-500 group-hover:scale-[1.03]`}
                        />
                      </div>
                      <div className="border-t border-slate-100 p-5">
                        <h3 className="text-base font-semibold text-slate-900">{t(b.titleZh, b.titleEn)}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">{t(b.bodyZh, b.bodyEn)}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col p-6">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a237e]/10 text-[#1a237e] transition-transform duration-300 group-hover:scale-110"
                      >
                        <span className="h-2.5 w-2.5 rounded-sm bg-current" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold text-slate-900">{t(b.titleZh, b.titleEn)}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(b.bodyZh, b.bodyEn)}</p>
                    </div>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works — vertical-stack layout family, numbered */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t('四步開通', 'Live in four steps')}
              </h2>
            </Reveal>
            <ol className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.en} className="bg-white">
                  <Reveal delay={i * 80}>
                    <div className="flex h-full flex-col gap-3 p-6">
                      <span className="text-sm font-bold text-[#1a237e]">0{i + 1}</span>
                      <p className="text-[15px] font-medium leading-snug text-slate-900">{t(s.zh, s.en)}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <div className="overflow-hidden rounded-3xl bg-[#1a237e] px-6 py-14 text-center sm:px-12 sm:py-16">
                <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t('準備好開辦你的聯賽？', 'Ready to launch your league?')}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
                  {t('立即申請，幾步即可擁有專屬聯賽網站。', 'Apply now and get your dedicated league site in just a few steps.')}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/apply"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#1a237e] transition-all duration-200 hover:gap-3 hover:bg-blue-50 active:scale-[0.98]"
                  >
                    {t(HERO.primaryZh, HERO.primaryEn)}
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </Link>
                  <Link
                    href="/platform"
                    className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-medium text-blue-100 transition-colors hover:text-white"
                  >
                    {t('平台管理員入口', 'Platform admin')}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} ZENEX Sports. {t('版權所有。', 'All rights reserved.')}</p>
          <div className="flex items-center gap-5">
            <Link href="/apply" className="transition-colors hover:text-slate-900">
              {t(HERO.primaryZh, HERO.primaryEn)}
            </Link>
            <Link href="/login" className="transition-colors hover:text-slate-900">
              {t(HERO.secondaryZh, HERO.secondaryEn)}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
