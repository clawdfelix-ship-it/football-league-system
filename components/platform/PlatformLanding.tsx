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
 * theme, single brand-blue accent (#0f172a, matching the tenant product),
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
  { n: '多', labelZh: '支球隊同時管理', labelEn: 'clubs managed together' },
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
/* Hand-drawn line icons (stroke=currentColor, inherit colour/size)    */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

const IconStandings = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 5h16M4 12h16M4 19h16" />
    <circle cx="8" cy="5" r="1.6" />
    <circle cx="16" cy="12" r="1.6" />
    <circle cx="10" cy="19" r="1.6" />
  </svg>
);

const IconCalendar = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M8.5 14l2 2 3.5-3.5" />
  </svg>
);

const IconUsers = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19.5c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" />
    <path d="M16 6.2a3 3 0 0 1 0 5.2M17.5 14.9c2 .6 3.2 2.1 3.2 4.3" />
  </svg>
);

const IconLanguage = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 5h7M7.5 5v0c0 3.2-1.4 6-4 7.7M5 9.5c.9 2 2.5 3.6 4.4 4.5" />
    <path d="M13 19l3.2-7.5L19.5 19M14.4 16.4h3.7" />
  </svg>
);

const IconPhone = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.5 5.5h3M11 18.6h2" />
  </svg>
);

const IconDoc = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M7 3.5h7l4 4V20.5H7z" />
    <path d="M14 3.5V8h4M9.5 12.5h6M9.5 15.5h6" />
  </svg>
);

const IconShieldCheck = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8-7 9.5C8 19 5 15.5 5 11V6z" />
    <path d="M9 11.5l2.2 2.2L15.5 9.5" />
  </svg>
);

const IconKey = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="8" cy="8" r="4" />
    <path d="M11 11l8 8M16.5 16.5l1.8-1.8M18.7 18.7l1.6-1.6" />
  </svg>
);

const IconWhistle = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M3 9h11a4 4 0 1 1-4 4H7a4 4 0 0 1-4-4z" />
    <path d="M14 9l6-2.5M14 9l5 1.6M7.5 9V6" />
  </svg>
);

const IconTrophy = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4l.5 3h-5z" />
  </svg>
);

const IconBall = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4z" />
    <path d="M12 3v4.5M20.6 9.2l-4.8 1.1M18.2 18.4l-3.9-2.9M5.8 18.4l3.9-2.9M3.4 9.2l4.8 1.1" />
  </svg>
);

const IconGlobe = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z" />
  </svg>
);

const IconBolt = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M13 2L4 14h6.5L10 22l9-12.5h-6.5z" />
  </svg>
);

const FEATURE_ICONS = [IconStandings, IconCalendar, IconUsers, IconLanguage, IconPhone];
const STEP_ICONS = [IconDoc, IconShieldCheck, IconKey, IconWhistle];

/* Sticky-scroll story: left copy scrolls past, right photo crossfades. */
const STORY = [
  {
    src: '/platform/gallery/match-7.jpg',
    kickerZh: '開季',
    kickerEn: 'Kick-off',
    titleZh: '賽程一鍵公佈',
    titleEn: 'Publish the whole season at once',
    bodyZh: '對賽、時間、場地排好，球員打開手機就見到自己球隊嘅每一場。',
    bodyEn: 'Fixtures, kick-offs and venues laid out so every player sees their run-in on their phone.',
  },
  {
    src: '/platform/gallery/match-5.jpg',
    kickerZh: '比賽夜',
    kickerEn: 'Match night',
    titleZh: '入完波即刻出賽果',
    titleEn: 'Post a score, standings move',
    bodyZh: '球場上入個比數，積分榜、得失球、排名即時自動更新。',
    bodyEn: 'Enter the final whistle score and points, goal difference and rank update instantly.',
  },
  {
    src: '/platform/gallery/match-3.jpg',
    kickerZh: '球隊',
    kickerEn: 'Clubs',
    titleZh: '每隊自己管陣容',
    titleEn: 'Every club owns its squad',
    bodyZh: '球隊有獨立帳號，自己報陣、更新球員，聯賽專心做聯賽。',
    bodyEn: 'Each club gets a login to submit the line-up and keep profiles current — the league runs the league.',
  },
  {
    src: '/platform/gallery/match-6.jpg',
    kickerZh: '頒獎',
    kickerEn: 'Trophy',
    titleZh: '成季回憶一頁收藏',
    titleEn: 'A whole season in one place',
    bodyZh: '賽果、積分、大合照全部留低，下一季又係一個新故事。',
    bodyEn: 'Results, tables and the line-up photos stay together — then next season starts a new story.',
  },
];

/* Compact trust / included-feature strip under the hero. */
const INCLUDED = [
  { icon: IconGlobe, zh: '專屬網址', en: 'Own subdomain' },
  { icon: IconBolt, zh: '即時更新', en: 'Live updates' },
  { icon: IconShieldCheck, zh: '帳號權限', en: 'Roles & access' },
  { icon: IconTrophy, zh: '積分運算', en: 'Auto standings' },
  { icon: IconLanguage, zh: '中英雙語', en: 'Bilingual' },
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
/* 3D tilt browser mockup — follows pointer/touch with spring-back and  */
/* a moving radial sheen. DOM-synced, reduced-motion + no-JS safe.      */
/* ------------------------------------------------------------------ */

function TiltMockup({ t }: { t: (zh: string, en: string) => string }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Fine pointers (mouse) only; touch tilt feels jittery on mobile.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;
    let targetRx = 0;
    let targetRy = 0;
    let rx = 0;
    let ry = 0;

    const render = () => {
      // Critically-damped follow (spring-back toward the target, incl. 0).
      rx += (targetRx - rx) * 0.12;
      ry += (targetRy - ry) * 0.12;
      inner.style.transform = `perspective(1100px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      if (Math.abs(targetRx - rx) > 0.05 || Math.abs(targetRy - ry) > 0.05 || targetRx !== 0) {
        raf = requestAnimationFrame(render);
      } else {
        inner.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height;
      targetRy = (px - 0.5) * 14; // rotateY
      targetRx = (0.5 - py) * 12; // rotateX
      if (sheenRef.current) {
        sheenRef.current.style.background = `radial-gradient(420px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.22), rgba(255,255,255,0) 60%)`;
        sheenRef.current.style.opacity = '1';
      }
      kick();
    };
    const onLeave = () => {
      targetRx = 0;
      targetRy = 0;
      if (sheenRef.current) sheenRef.current.style.opacity = '0';
      kick();
    };

    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerleave', onLeave);
    return () => {
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={frameRef} className="relative [perspective:1100px]">
      <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-tr from-[#0f172a]/40 to-transparent blur-2xl" />
      <div
        ref={innerRef}
        className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/40 ring-1 ring-black/20 transition-transform duration-200 will-change-transform [transform-style:preserve-3d]"
      >
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 hidden truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200 sm:block">
            hkbankleague2026.zenex-sports.com
          </span>
        </div>
        <div className="relative">
          <Image
            src="/platform/screen-home.png"
            alt={t('真實聯賽網站預覽', 'Preview of a live league site')}
            width={1440}
            height={900}
            priority
            className="block h-auto w-full"
          />
          {/* moving sheen over the screenshot (doesn't block pointer) */}
          <div
            ref={sheenRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sticky-scroll story — left copy steps past, right photo crossfades  */
/* (flip-book). Scroll-driven via IO; reduced-motion/no-JS shows all.   */
/* ------------------------------------------------------------------ */

function StorySection({ t }: { t: (zh: string, en: string) => string }) {
  const imgsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const blocksRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // leave every image visible / let copy stack plainly
    const setActive = (i: number) => {
      imgsRef.current.forEach((el, j) => {
        if (el) el.style.opacity = j === i ? '1' : '0';
      });
      dotsRef.current.forEach((el, j) => {
        if (el) {
          el.setAttribute('aria-current', j === i ? 'true' : 'false');
          el.dataset.active = j === i ? 'true' : 'false';
        }
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible step currently crossing the viewport centre.
        let best: { i: number; r: number } | null = null;
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            const r = e.intersectionRatio;
            if (!best || r > best.r) best = { i, r };
          }
        }
        if (best) setActive(best.i);
      },
      // Trigger around the vertical centre so the swap feels pinned.
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    blocksRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-widest text-[#0f172a]">
            {t('一個球季', 'A season on the platform')}
          </span>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t('由開季第一場，到捧盃那一晚', 'From the first fixture to the night they lift it')}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: scroll copy steps (the sticky rail is on the right) */}
          <ol className="flex flex-col">
            {STORY.map((s, i) => (
              <li
                key={s.titleEn}
                data-i={i}
                ref={(el) => {
                  blocksRef.current[i] = el;
                }}
                className="flex min-h-[46vh] flex-col justify-center border-b border-slate-100 py-10 last:border-b-0 lg:min-h-[52vh]"
              >
                <span className="text-sm font-bold text-[#0f172a]">
                  {t(s.kickerZh, s.kickerEn)}
                </span>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {t(s.titleZh, s.titleEn)}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
                  {t(s.bodyZh, s.bodyEn)}
                </p>
              </li>
            ))}
          </ol>

          {/* Right: pinned crossfading photo */}
          <div className="relative hidden lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl shadow-slate-900/10">
              <div className="relative aspect-[4/3]">
                {STORY.map((s, i) => (
                  <div
                    key={s.src}
                    ref={(el) => {
                      imgsRef.current[i] = el;
                    }}
                    className="absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none"
                    style={{ opacity: i === 0 ? 1 : 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt="" loading={i === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
                  </div>
                ))}
                {/* subtle brand scrim + dots */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {STORY.map((s, i) => (
                    <button
                      key={s.src}
                      type="button"
                      ref={(el) => {
                        dotsRef.current[i] = el;
                      }}
                      data-active={i === 0 ? 'true' : 'false'}
                      aria-current={i === 0 ? 'true' : 'false'}
                      aria-label={`Story step ${i + 1}`}
                      tabIndex={-1}
                      className="h-2 cursor-default rounded-full bg-white/50 transition-all duration-300 data-[active=true]:w-6 data-[active=true]:bg-white"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/tablet: images inline with each step instead of sticky */}
          <div className="-mt-2 flex flex-col gap-8 lg:hidden">
            {STORY.map((s, i) => (
              <div key={s.src} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt="" loading={i === 0 ? 'eager' : 'lazy'} className="aspect-[4/3] w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
  return (
    <header className="sticky top-0 z-30 bg-[#0f172a] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" draggable={false} priority />
          <span className="text-[17px] font-bold tracking-tight text-white">ZENEX Sports</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label={t('平台導覽', 'Platform navigation')}>
          <LanguageToggle />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            {t(HERO.secondaryZh, HERO.secondaryEn)}
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[#0f172a] shadow-sm transition-all duration-200 hover:bg-blue-50 active:scale-[0.98]"
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

function FaqSection() {
  const { t } = useLanguage();
  const faqs = [
    {
      qZh: '要唔要自己整網站？',
      qEn: 'Do I have to build a website myself?',
      aZh: '唔使。平台已包含對外公開頁同管理後台，開通即有獨立子網域。',
      aEn: 'No. The public site and admin console are included; each league gets its own subdomain on activation.',
    },
    {
      qZh: '支援咩語言？',
      qEn: 'Which languages are supported?',
      aZh: '繁體中文同英文，全站一鍵切換，切合香港聯賽需要。',
      aEn: 'Traditional Chinese and English, with a site-wide toggle, built for Hong Kong leagues.',
    },
    {
      qZh: '積分榜會自動更新嗎？',
      qEn: 'Does the standings table update automatically?',
      aZh: '會。賽後輸入比數，勝和負、得失球同排名即時自動運算。',
      aEn: 'Yes. Enter a score after a match and points, goal difference and rank are calculated instantly.',
    },
    {
      qZh: '球隊可唔可以自己更新陣容？',
      qEn: 'Can clubs update their own squads?',
      aZh: '可以。每支球隊有獨立帳號，可自行提交陣容同球員資料。',
      aEn: 'Yes. Each club gets its own login to submit its squad and keep player profiles current.',
    },
    {
      qZh: '點樣申請開辦聯賽？',
      qEn: 'How do I launch a league?',
      aZh: '撳「開辦聯賽」填妥申請，大會審核後即可開通。',
      aEn: 'Click “Start a league”, submit the application, and your site is provisioned after approval.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.qZh,
      acceptedAnswer: { '@type': 'Answer', text: f.aZh },
    })),
  };

  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t('常見問題', 'Frequently asked questions')}
        </h2>
        <div className="mt-10 flex flex-col gap-3">
          {faqs.map((f) => (
            <details
              key={f.qEn}
              className="group rounded-2xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900">
                {t(f.qZh, f.qEn)}
                <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden>＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t(f.aZh, f.aEn)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

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
                <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_24px_rgba(2,6,23,0.65)] sm:text-5xl">
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
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0f172a] shadow-lg shadow-black/20 transition-all duration-200 hover:gap-3 hover:bg-blue-50 active:scale-[0.98]"
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
                      <dt className="text-2xl font-bold tracking-tight text-white">{s.n}</dt>
                      <dd className="mt-1 text-xs leading-snug text-blue-50/90">{t(s.labelZh, s.labelEn)}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {/* Real product preview — 3D tilt browser mockup */}
            <Reveal delay={160} className="relative">
              <TiltMockup t={t} />
            </Reveal>
          </div>
        </section>

        {/* Included / trust strip */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              {INCLUDED.map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.en} className="flex items-center gap-2.5 text-slate-700">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f172a]/10 text-[#0f172a]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[13px] font-medium leading-tight">{t(f.zh, f.en)}</span>
                  </li>
                );
              })}
            </ul>
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
                  className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition-all duration-200 hover:gap-2.5 hover:bg-blue-50"
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
            {BENTO.map((b, i) => {
              const Icon = FEATURE_ICONS[i] ?? IconBall;
              return (
                <Reveal key={b.titleEn} delay={(i % 3) * 80} className={b.span}>
                  <article
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 ${
                      b.image ? 'min-h-[340px]' : ''
                    }`}
                  >
                    {b.image ? (
                      <>
                        <div className="relative flex-1 overflow-hidden bg-slate-100">
                          {/* Floating icon chip so even image cards carry the icon system */}
                          <span className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-[#0f172a] shadow-md ring-1 ring-slate-900/5 backdrop-blur transition-transform duration-300 group-hover:scale-110">
                            <Icon className="h-5 w-5" />
                          </span>
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
                          className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#334155] text-white shadow-md shadow-[#0f172a]/25 transition-transform duration-300 group-hover:scale-110"
                        >
                          <Icon className="h-6 w-6" />
                          <span
                            aria-hidden="true"
                            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"
                          />
                        </span>
                        <h3 className="mt-4 text-base font-semibold text-slate-900">{t(b.titleZh, b.titleEn)}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(b.bodyZh, b.bodyEn)}</p>
                      </div>
                    )}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Sticky flip-book story: kick-off → trophy */}
        <StorySection t={t} />

        {/* How it works — vertical-stack layout family, numbered */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t('四步開通', 'Live in four steps')}
              </h2>
            </Reveal>
            <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => {
                const StepIcon = STEP_ICONS[i] ?? IconBall;
                return (
                  <li key={s.en} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                    {/* connector arrow on desktop */}
                    {i < STEPS.length - 1 && (
                      <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-300 ring-1 ring-slate-200 lg:flex">
                        →
                      </span>
                    )}
                    <Reveal delay={i * 80}>
                      <div className="flex h-full flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f172a]/10 text-[#0f172a]">
                            <StepIcon className="h-6 w-6" />
                          </span>
                          <span className="text-2xl font-bold tracking-tight text-slate-200">0{i + 1}</span>
                        </div>
                        <p className="text-[15px] font-medium leading-snug text-slate-900">{t(s.zh, s.en)}</p>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* FAQ — citation-friendly answer blocks + FAQPage schema */}
        <FaqSection />

        {/* Final CTA — rotating conic glow border */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <div className="group relative rounded-3xl p-px">
                {/* Rotating conic border + breathing glow (decorative, pause-safe) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90 motion-reverse:animate-none"
                  style={{ background: 'conic-gradient(from 0deg, rgba(26,35,126,0.0), rgba(96,130,255,0.55), rgba(26,35,126,0.0) 35%)', animation: 'zenex-spin 7s linear infinite' }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{ padding: 1.5, background: 'conic-gradient(from 0deg, rgba(255,255,255,0.06), rgba(140,165,255,0.9), rgba(255,255,255,0.06) 30%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', animation: 'zenex-spin 6s linear infinite' }}
                />
                <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] px-6 py-14 text-center sm:px-12 sm:py-16">
                <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t('準備好開辦你的聯賽？', 'Ready to launch your league?')}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100 sm:text-base">
                  {t('立即申請，幾步即可擁有專屬聯賽網站。', 'Apply now and get your dedicated league site in just a few steps.')}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/apply"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0f172a] transition-all duration-200 hover:gap-3 hover:bg-blue-50 active:scale-[0.98]"
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

      {/* Component-scoped keyframes for the CTA rotating glow border. */}
      <style jsx global>{`
        @keyframes zenex-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*='zenex-spin'] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
