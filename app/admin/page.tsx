import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRequestTenant } from '@/lib/tenant/context';
import { getMatches, getAnnouncements, getTeamKitSettingsMap } from '@/lib/actions';
import { MatchForm, ResetButton } from '@/components/AdminClient';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { UpcomingFixtures } from '@/components/UpcomingFixtures';
import { MatchResults } from '@/components/MatchResults';
import { TEAMS } from '@/lib/constants';
import { KitColorManager } from '@/components/KitColorManager';
import { PlayerManager } from '@/app/admin/match-sheet/[teamId]/PlayerManager';
import { LazyPlayerContacts } from '@/components/LazyPlayerContacts';
import SignOutButton from '@/components/SignOutButton';
import FixDbButton from '@/components/FixDbButton';
import GenerateManagerAccountsButton from '@/components/GenerateManagerAccountsButton';
import ChangeManagerPasswordForm from '@/components/ChangeManagerPasswordForm';
import type { Announcement } from '@/lib/schema';
import { LeagueSettingsPanel } from '@/components/LeagueSettingsPanel';
import { AnnouncementManager } from '@/components/AnnouncementManager';
import { TEAM_CONTACTS } from '@/lib/team-contacts';
import { TeamCard } from '@/components/TeamCard';

// Type from Database (Drizzle returns Date object for timestamp)
interface DbMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date | null; // Allow null
  venue: string | null;
  status: string | null;
  round?: string | null;
}

// Type for Client Component (Props must be serializable)
interface SerializedMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string; // Changed from string | null to string
  venue: string | null;
  status: string | null;
  round?: string | null;
}

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Host guard (symmetric with app/platform/page.tsx): the league admin
  // console only exists on a league tenant host. On the platform host every
  // league-scoped query resolves to leagueId 0, so a league admin/manager who
  // signed in here would otherwise see an empty/broken console. Platform
  // principals are redirected to their cross-tenant console by /login.
  const tenant = await getRequestTenant();
  if (tenant.isPlatform) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-900">呢度係平台主機</h1>
          <p className="mt-2 text-sm text-slate-600">
            聯賽後台只可以喺你所屬聯賽嘅專屬網址開啟。請到該網址再登入，平台管理員請前往
            {` `}
            <Link href="/platform" className="text-blue-600 hover:underline">
              平台控制台
            </Link>
            。
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-slate-700 hover:underline"
          >
            ← 返回主頁
          </Link>
        </div>
      </main>
    );
  }

  let scheduledMatches: SerializedMatch[] = [];
  let finishedMatches: SerializedMatch[] = [];
  let announcements: Announcement[] = [];
  let teamKitSettingsMap: Record<string, { name: string; homeKitColor: string; awayKitColor: string }> = {};
  let dbError = null;

  // role gating that previously sat between the queries — moved up so every
  // independent DB read can run in ONE parallel batch below.
  const username = session.user?.username || session.user?.name || 'Admin';
  const role = session.user?.role || 'manager';
  const teamId = session.user?.teamId;
  if (role === 'user') {
    redirect('/');
  }
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  // Do NOT preload player rosters — they are lazy-fetched client-side when an
  // admin expands a team. The admin shell mainly needs fixtures/results, so it
  // now loads quickly instead of pulling every player on first paint.
  try {
    const [matchesResult, announcementsResult, kitResult] = await Promise.all([
      getMatches(),
      getAnnouncements(),
      getTeamKitSettingsMap(),
    ]);
    const allMatches = matchesResult as unknown as DbMatch[];
    announcements = announcementsResult;
    teamKitSettingsMap = kitResult;

    scheduledMatches = allMatches
      .filter(m => m.status === 'scheduled' || m.status === 'tbc')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.getTime() - b.date.getTime();
      })
      .map(m => ({
        ...m,
        date: m.date ? m.date.toISOString() : '', // Convert null to empty string or handle TBC appropriately in frontend
        venue: m.venue || null, // Ensure null instead of undefined
        status: m.status || null,
        round: m.round || null
      }));
      
    finishedMatches = allMatches
      .filter(m => m.status === 'finished')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.getTime() - a.date.getTime();
      })
      .map(m => ({
        ...m,
        date: m.date ? m.date.toISOString() : '', // Convert null to empty string
        venue: m.venue || null,
        status: m.status || null,
        round: m.round || null
      }));
  } catch (e) {
    console.error("Failed to fetch matches:", e);
    dbError = "Database schema mismatch. Please click 'Fix Database Schema' button.";
  }


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="page-container-narrow flex flex-col gap-8 py-10">
        <header className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdmin ? 'League Administration' : 'Team Manager Dashboard'}
            </h1>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <div className="text-sm text-slate-500">
                Logged in as {username}
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end sm:gap-3">
                {isAdmin && <GenerateManagerAccountsButton />}
                <FixDbButton />
                <SignOutButton />
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            {isAdmin 
              ? 'Manage fixtures, results, and league settings.' 
              : 'Access your team\'s match sheets and resources.'}
          </p>
          {dbError && (
            <div className="mt-2 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              ⚠️ {dbError}
            </div>
          )}
        </header>

        {/* Team Manager Section */}
        {isManager && teamId !== undefined && (
          <section className="space-y-6">
            {/* Quick Actions Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Team Management</h2>
              <div className="space-y-4">
                <PlayerManager teamName={TEAMS[teamId].name} />
                
                <Link 
                  href={`/admin/match-sheet/${teamId}`}
                  className="btn-primary w-full h-auto rounded-xl py-3"
                  target="_blank"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9V2h12v7"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <path d="M6 14h12v8H6z"/>
                  </svg>
                  Squad List
                </Link>
              </div>
            </div>

            {/* Kit Color Settings */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Kit Colors</h2>
              <KitColorManager teamName={TEAMS[teamId].name} />
            </div>

            <ChangeManagerPasswordForm />
          </section>
        )}

        {/* Admin Only Sections */}
        {isAdmin && (
          <>
            {/* League Settings (name / slug / announcement / contact) */}
            <LeagueSettingsPanel leagueId={tenant.leagueId} />

            {/* Team Match Sheets Section for Admin */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Squad List</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TEAMS.map((team, index) => (
                  <Link 
                    key={team.name}
                    href={`/admin/match-sheet/${index}`}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-slate-100 hover:shadow-sm"
                    target="_blank"
                  >
                    <div className="text-lg font-black px-4 py-2 rounded-lg bg-slate-700 text-white">
                      {team.shortName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {team.nameZh}
                    </div>
                  </Link>
                ))}
                <Link
                  href="/admin/match-sheet/demo"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-slate-100 hover:shadow-sm"
                  target="_blank"
                >
                  <div className="text-lg font-black px-4 py-2 rounded-lg bg-slate-700 text-white">DEMO</div>
                  <div className="text-xs text-slate-500">Real Madrid</div>
                </Link>
              </div>
            </section>

            {/* ── 球隊管理 Card ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">⚽ 球隊管理</h2>
                <div className="text-xs text-slate-500">{TEAM_CONTACTS.length} 支球隊</div>
              </div>
              {TEAM_CONTACTS.map((team) => (
                <TeamCard key={team.team} team={team} />
              ))}
            </section>

            <LazyPlayerContacts title="Player Contacts" defaultExpanded={false} />

            <AnnouncementManager announcements={announcements} />

            <MatchForm />
            
            <CollapsibleSection title="Upcoming Fixtures" badge={scheduledMatches.length} defaultExpanded={false}>
              <div className="p-4 sm:p-6">
                <UpcomingFixtures matches={scheduledMatches} teamsByName={teamKitSettingsMap} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Match Results" badge={finishedMatches.length} defaultExpanded={false}>
              <div className="p-4 sm:p-6">
                <MatchResults matches={finishedMatches} allowGoals={isAdmin} />
              </div>
            </CollapsibleSection>

            <ResetButton />
          </>
        )}
      </main>
    </div>
  );
}
