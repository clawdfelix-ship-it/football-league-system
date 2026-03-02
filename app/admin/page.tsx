import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { addMatch, getMatches, resetSeason } from '@/lib/actions';

export const dynamic = 'force-dynamic';

async function handleReset() {
  'use server';
  console.log('Resetting season data...');
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    console.error('Unauthorized reset attempt');
    throw new Error('Unauthorized');
  }
  try {
    await resetSeason();
    console.log('Season data reset successfully');
  } catch (error) {
    console.error('Error resetting season:', error);
    throw error;
  }
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin?success=reset');
}

async function submitMatch(formData: FormData) {
  'use server';

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const homeTeam = formData.get('homeTeam')?.toString().trim() ?? '';
  const awayTeam = formData.get('awayTeam')?.toString().trim() ?? '';
  const homeScoreRaw = formData.get('homeScore')?.toString();
  const awayScoreRaw = formData.get('awayScore')?.toString();
  const dateRaw = formData.get('date')?.toString();
  const timeRaw = formData.get('time')?.toString();
  const venueRaw = formData.get('venue')?.toString().trim();
  const status = formData.get('status')?.toString() as 'scheduled' | 'finished';

  if (!homeTeam || !awayTeam || !dateRaw) {
    return;
  }

  const homeScore = homeScoreRaw !== '' ? Number(homeScoreRaw) : undefined;
  const awayScore = awayScoreRaw !== '' ? Number(awayScoreRaw) : undefined;

  let matchDate = new Date(dateRaw);
  if (timeRaw) {
    const [hours, minutes] = timeRaw.split(':').map(Number);
    matchDate.setHours(hours, minutes);
  }

  await addMatch({
    homeTeam,
    awayTeam,
    homeScore: Number.isNaN(homeScore) ? undefined : homeScore,
    awayScore: Number.isNaN(awayScore) ? undefined : awayScore,
    date: matchDate,
    venue: venueRaw || 'Unknown Venue',
    status: status || 'finished',
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/login');
  }

  let recentMatches: any[] = [];
  try {
    recentMatches = await getMatches();
  } catch (error) {
    console.error("Failed to fetch matches for admin:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Manage Matches
            </h1>
            <div className="text-sm text-zinc-500">
              Logged in as {(session.user as any)?.username || 'Admin'}
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add fixtures or results. The league table and homepage will be updated automatically.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h2 className="text-lg font-semibold">Add Match</h2>
          <form action={submitMatch} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="homeTeam"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Home team
                </label>
                <input
                  id="homeTeam"
                  name="homeTeam"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="e.g. Manchester City"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="awayTeam"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Away team
                </label>
                <input
                  id="awayTeam"
                  name="awayTeam"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="e.g. Liverpool"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                >
                  <option value="finished">Finished (Result)</option>
                  <option value="scheduled">Scheduled (Fixture)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="date"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Match date
                </label>
                <div className="flex gap-2">
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  />
                  <input
                    id="time"
                    name="time"
                    type="time"
                    className="w-32 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="homeScore"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Home score (if finished)
                </label>
                <input
                  id="homeScore"
                  name="homeScore"
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="e.g. 2"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="awayScore"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Away score (if finished)
                </label>
                <input
                  id="awayScore"
                  name="awayScore"
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            <div className="space-y-1">
                <label
                  htmlFor="venue"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Venue
                </label>
                <input
                  id="venue"
                  name="venue"
                  list="venues"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="Select or type venue"
                />
                <datalist id="venues">
                  <option value="中山紀念公園 (Sun Yat Sen Memorial Park)" />
                  <option value="鰂魚涌公園1號場 (Quarry Bay Park No. 1, near Taikoo Shing)" />
                  <option value="鰂魚涌公園2號場 (Quarry Bay Park No. 2, near Quarry Bay Station)" />
                </datalist>
              </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950"
            >
              Submit Match
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Match History</h2>
            <Link
              href="/"
              className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              Back to home
            </Link>
          </div>
          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <p className="text-sm text-zinc-500">No matches found.</p>
            ) : (
              recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {match.venue} • {match.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">
                      {match.status === 'finished' ? (
                        `${match.homeScore} - ${match.awayScore}`
                      ) : (
                        <span className="text-zinc-400">VS</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(match.date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950 sm:p-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
          <div className="mt-2 text-sm text-red-600 dark:text-red-300">
            <p>Resetting the season will delete all matches and scores.</p>
            <p>This action cannot be undone.</p>
          </div>
          <form action={handleReset} className="mt-4">
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reset Season Data
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}