import type { Metadata } from 'next';
import HomeClient from '@/app/HomeClient';
import PlatformLanding from '@/components/platform/PlatformLanding';
import { getRequestTenant } from '@/lib/tenant/context';
import { shouldRenderPlatformLanding } from '@/lib/tenant/landing';
import { PLATFORM_PUBLIC_URL } from '@/lib/tenant/config';
import { listAnnouncements, listMatches, listTeamSettings } from '@/lib/queries';
import { iso } from '@/lib/serialize';
import type { PublicAnnouncement } from '@/lib/public-types';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.isPlatform) {
    const title = 'ZENEX Sports | 聯賽管理平台';
    const description =
      '為你的足球聯賽開一個專屬網站：賽程、賽果、積分榜、球隊管理一應俱全，中英對照，開箱即用。';
    return {
      metadataBase: new URL(PLATFORM_PUBLIC_URL),
      title,
      description,
      alternates: { canonical: PLATFORM_PUBLIC_URL },
      openGraph: {
        type: 'website',
        url: PLATFORM_PUBLIC_URL,
        siteName: 'ZENEX Sports',
        title,
        description,
        locale: 'zh_HK',
        alternateLocale: ['en_HK'],
      },
    };
  }
  // Tenant hosts: inherit the HKBL defaults exported by the root layout
  // (single source of truth — do not duplicate them here).
  return {};
}

type HomeMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string | null;
  venue: string | null;
  status: string | null;
  round: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export default async function Home() {
  // Platform host (e.g. platform.zenex-sports.com) serves the SaaS marketing
  // landing — never the HKBL fixtures/standings data. League queries on this
  // host resolve to league 0 anyway, but rendering the tenant UI here would
  // show an empty, HKBL-branded shell.
  const tenant = await getRequestTenant();
  if (shouldRenderPlatformLanding(tenant)) {
    return <PlatformLanding />;
  }

  let initial: {
    teamSettings: Array<{ name: string; homeKitColor: string; awayKitColor: string }>;
    fixtures: HomeMatch[];
    results: HomeMatch[];
    announcements: PublicAnnouncement[];
  } = { teamSettings: [], fixtures: [], results: [], announcements: [] };

  try {
    const [teamSettingsRows, fixturesRows, resultsRows, announcementsRows] = await Promise.all([
      listTeamSettings(),
      listMatches('scheduled'),
      listMatches('finished'),
      listAnnouncements(),
    ]);

    initial = {
      teamSettings: teamSettingsRows.map((t) => ({
        name: t.name,
        homeKitColor: t.homeKitColor ?? 'white',
        awayKitColor: t.awayKitColor ?? 'black',
      })),
      fixtures: fixturesRows.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        date: iso(m.date),
        venue: m.venue ?? null,
        status: m.status ?? null,
        round: m.round ?? null,
        createdAt: iso(m.createdAt),
        updatedAt: iso(m.updatedAt),
      })),
      results: resultsRows.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        date: iso(m.date),
        venue: m.venue ?? null,
        status: m.status ?? null,
        round: m.round ?? null,
        createdAt: iso(m.createdAt),
        updatedAt: iso(m.updatedAt),
      })),
      announcements: announcementsRows.map((a) => ({
        id: a.id,
        title: a.title ?? null,
        content: a.content,
        date: iso(a.date) ?? new Date().toISOString(),
        createdAt: iso(a.createdAt),
        updatedAt: iso(a.updatedAt),
      })),
    };
  } catch {
  }

  return <HomeClient initial={initial} />;
}
