import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMatches, getTeamPlayers } from '@/lib/actions';
import { MatchForm, MatchList, ResetButton } from '@/components/AdminClient';
import Link from 'next/link';
import { TEAMS } from '@/lib/constants';
import { PlayerManager } from '@/app/admin/match-sheet/[teamId]/PlayerManager';
import type { Player } from '@/lib/schema';

// Type from Database (Drizzle returns Date object for timestamp)
interface DbMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
  venue: string | null;
  status: string | null;
}

// Type for Client Component (Props must be serializable)
interface SerializedMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string | null;
  status: string | null;
}

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Cast to unknown first to avoid type overlap error if types differ significantly
  const allMatches = (await getMatches()) as unknown as DbMatch[];
  
  const scheduledMatches: SerializedMatch[] = allMatches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(m => ({
      ...m,
      date: m.date.toISOString(),
      venue: m.venue || null, // Ensure null instead of undefined
      status: m.status || null
    }));
    
  const finishedMatches: SerializedMatch[] = allMatches
    .filter(m => m.status === 'finished')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(m => ({
      ...m,
      date: m.date.toISOString(),
      venue: m.venue || null,
      status: m.status || null
    }));

  const username = session.user?.name || (session.user as any)?.username || 'Admin';
  const role = (session.user as any)?.role || 'manager';
  const teamId = (session.user as any)?.teamId;

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  // Fetch team players if is manager
  let teamPlayers: Player[] = [];
  if (isManager && teamId !== undefined) {
    teamPlayers = await getTeamPlayers(TEAMS[teamId].name);
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isAdmin ? 'League Administration' : 'Team Manager Dashboard'}
            </h1>
            <div className="text-sm text-zinc-500">
              Logged in as {username}
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isAdmin 
              ? 'Manage fixtures, results, and league settings.' 
              : 'Access your team\'s match sheets and resources.'}
          </p>
        </header>

        {/* Team Manager Section */}
        {isManager && teamId !== undefined && (
          <section className="space-y-6">
            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold mb-4">Team Management</h2>
              <div className="space-y-4">
                <PlayerManager teamName={TEAMS[teamId].name} players={teamPlayers} />
                
                <Link 
                  href={`/admin/match-sheet/${teamId}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  target="_blank"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9V2h12v7"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <path d="M6 14h12v8H6z"/>
                  </svg>
                  Print Match Sheet
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Admin Only Sections */}
        {isAdmin && (
          <>
            {/* Team Match Sheets Section for Admin */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Print Match Sheets</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TEAMS.map((team, index) => (
                  <Link 
                    key={team.name}
                    href={`/admin/match-sheet/${index}`}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:bg-zinc-100 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    target="_blank"
                  >
                    <div className={`text-lg font-black bg-gradient-to-br ${team.color} bg-clip-text text-transparent`}>
                      {team.shortName}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {team.nameZh}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <MatchForm />
            
            <MatchList 
              scheduledMatches={scheduledMatches} 
              finishedMatches={finishedMatches} 
            />

            <ResetButton />
          </>
        )}
      </main>
    </div>
  );
}
