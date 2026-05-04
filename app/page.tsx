import HomeClient from '@/app/HomeClient';
import { listAnnouncements, listMatches, listTeamSettings } from '@/lib/queries';
import { iso } from '@/lib/serialize';
import type { PublicAnnouncement } from '@/lib/public-types';

export const dynamic = 'force-dynamic';

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
