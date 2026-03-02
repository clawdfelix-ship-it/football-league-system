'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { addMatch, getMatches, resetSeason, updateMatch, deleteMatch } from '@/lib/actions';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string | null;
  status: string | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadMatches();
    }
  }, [status]);

  const loadMatches = async () => {
    try {
      const allMatches = await getMatches() as Match[];
      
      const scheduled = allMatches.filter(m => m.status === 'scheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
      const finished = allMatches.filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setScheduledMatches(scheduled);
      setFinishedMatches(finished);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    }
  };

  const handleSubmitMatch = async (formData: FormData) => {
    const homeTeam = formData.get('homeTeam')?.toString().trim() ?? '';
    const awayTeam = formData.get('awayTeam')?.toString().trim() ?? '';
    const homeScoreRaw = formData.get('homeScore')?.toString();
    const awayScoreRaw = formData.get('awayScore')?.toString();
    const dateRaw = formData.get('date')?.toString();
    const timeRaw = formData.get('time')?.toString();
    const venueRaw = formData.get('venue')?.toString().trim();
    const status = formData.get('status')?.toString() as 'scheduled' | 'finished';

    if (!homeTeam || !awayTeam || !dateRaw) return;

    const homeScore = homeScoreRaw !== '' ? Number(homeScoreRaw) : undefined;
    const awayScore = awayScoreRaw !== '' ? Number(awayScoreRaw) : undefined;

    // Construct date string explicitly to ensure local time is respected
    // input type="date" returns YYYY-MM-DD
    // input type="time" returns HH:MM
    const timeString = timeRaw || '00:00';
    const dateTimeString = `${dateRaw}T${timeString}`;
    const matchDate = new Date(dateTimeString);

    await addMatch({
      homeTeam,
      awayTeam,
      homeScore: Number.isNaN(homeScore) ? undefined : homeScore,
      awayScore: Number.isNaN(awayScore) ? undefined : awayScore,
      date: matchDate,
      venue: venueRaw || 'Unknown Venue',
      status: status || 'finished',
    });

    loadMatches();
    // Reset form
    (document.getElementById('add-match-form') as HTMLFormElement).reset();
  };

  const handleUpdateMatch = async (matchId: number, formData: FormData) => {
    const homeScoreRaw = formData.get('homeScore')?.toString();
    const awayScoreRaw = formData.get('awayScore')?.toString();
    const status = formData.get('status')?.toString() as 'scheduled' | 'finished';
    const dateRaw = formData.get('date')?.toString();
    const timeRaw = formData.get('time')?.toString();
    const venueRaw = formData.get('venue')?.toString().trim();
    
    const homeScore = homeScoreRaw !== '' ? Number(homeScoreRaw) : undefined;
    const awayScore = awayScoreRaw !== '' ? Number(awayScoreRaw) : undefined;

    let matchDate: Date | undefined;
    if (dateRaw) {
      const timeString = timeRaw || '00:00';
      const dateTimeString = `${dateRaw}T${timeString}`;
      matchDate = new Date(dateTimeString);
    }

    await updateMatch(matchId, {
      homeScore: Number.isNaN(homeScore) ? undefined : homeScore,
      awayScore: Number.isNaN(awayScore) ? undefined : awayScore,
      status,
      date: matchDate,
      venue: venueRaw || undefined
    });
    
    setEditingMatch(null);
    loadMatches();
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (confirm('Are you sure you want to delete this match?')) {
      await deleteMatch(matchId);
      loadMatches();
    }
  };

  const handleResetSeason = async () => {
    if (confirm('Are you sure you want to reset the entire season? This cannot be undone.')) {
      try {
        await resetSeason();
        loadMatches();
        alert('Season reset successfully. Please refresh the homepage to see changes.');
        // Force hard reload to clear client caches
        window.location.reload();
      } catch (error) {
        console.error('Reset failed:', error);
        alert('Reset failed. ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Handle loading state separately to avoid hydration mismatch
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading admin panel...</div>
      </div>
    );
  }

  // Handle redirecting state
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-zinc-500">You need to sign in to access this page.</div>
          <Link 
            href="/login" 
            className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Handle no session state
  if (!session?.user) {
    // Only redirect if not already loading or checking auth
    if (status !== 'loading' && status !== 'authenticated') {
        return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
            <div className="text-center space-y-4">
            <div className="text-zinc-500">You need to sign in to access this page.</div>
            <Link 
                href="/login" 
                className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
            >
                Sign In
            </Link>
            </div>
        </div>
        );
    }
    // Fallback loading while session is being established
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-500">Authenticating...</div>
      </div>
    );
  }

  const username = session.user.name || 'Admin';

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Manage Matches
            </h1>
            <div className="text-sm text-zinc-500">
              Logged in as {username}
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add fixtures or results. The league table and homepage will be updated automatically.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h2 className="text-lg font-semibold">Add Match</h2>
          <form id="add-match-form" action={handleSubmitMatch} className="mt-4 space-y-4">
            {/* Form fields same as before */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Home team</label>
                <input name="homeTeam" required className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" placeholder="e.g. Manchester City" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Away team</label>
                <input name="awayTeam" required className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" placeholder="e.g. Liverpool" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Status</label>
                <select name="status" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                  <option value="scheduled">Scheduled (Fixture)</option>
                  <option value="finished">Finished (Result)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Match date</label>
                <div className="flex gap-2">
                  <input name="date" type="date" required className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
                  <input name="time" type="time" className="w-32 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Home score</label>
                <input name="homeScore" type="number" min="0" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Away score</label>
                <input name="awayScore" type="number" min="0" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Venue</label>
              <input name="venue" list="venues" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm" placeholder="Select or type venue" />
              <datalist id="venues">
                <option value="中山紀念公園 (Sun Yat Sen Memorial Park)" />
                <option value="鰂魚涌公園1號場 (Quarry Bay Park No. 1, near Taikoo Shing)" />
                <option value="鰂魚涌公園2號場 (Quarry Bay Park No. 2, near Quarry Bay Station)" />
              </datalist>
            </div>

            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
              Submit Match
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Fixtures</h2>
          <div className="space-y-3 mb-8">
            {scheduledMatches.length === 0 ? (
              <p className="text-sm text-zinc-500">No upcoming fixtures.</p>
            ) : (
              scheduledMatches.map((match) => (
                <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-blue-50/50 p-3 dark:border-zinc-800 dark:bg-blue-900/10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-semibold">{match.homeTeam} vs {match.awayTeam}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(match.date).toLocaleDateString('en-GB')} {new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {match.venue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        {editingMatch === match.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button 
                        onClick={() => handleDeleteMatch(match.id)}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {editingMatch === match.id ? (
                    <form action={(formData) => handleUpdateMatch(match.id, formData)} className="mt-2 p-3 bg-white rounded border border-blue-200 grid gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium">Date</label>
                          <input name="date" type="date" defaultValue={match.date ? match.date.split('T')[0] : ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Time</label>
                          <input name="time" type="time" defaultValue={match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium">Home Score</label>
                          <input name="homeScore" type="number" defaultValue={match.homeScore ?? ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Away Score</label>
                          <input name="awayScore" type="number" defaultValue={match.awayScore ?? ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Venue</label>
                        <input name="venue" list="venues" defaultValue={match.venue || ''} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Status</label>
                        <select name="status" defaultValue={match.status || 'scheduled'} className="w-full border rounded px-2 py-1 text-sm">
                          <option value="scheduled">Scheduled</option>
                          <option value="finished">Finished</option>
                        </select>
                      </div>
                      <button type="submit" className="bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700">Update Result</button>
                    </form>
                  ) : (
                    <div className="text-right font-mono text-sm font-bold text-zinc-400">
                      VS
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <h2 className="text-lg font-semibold mb-4 pt-4 border-t border-zinc-100">Match Results</h2>
          <div className="space-y-3">
            {finishedMatches.length === 0 ? (
              <p className="text-sm text-zinc-500">No finished matches.</p>
            ) : (
              finishedMatches.map((match) => (
                <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-semibold">{match.homeTeam} vs {match.awayTeam}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(match.date).toLocaleDateString('en-GB')} {new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {match.venue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        {editingMatch === match.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button 
                        onClick={() => handleDeleteMatch(match.id)}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {editingMatch === match.id ? (
                    <form action={(formData) => handleUpdateMatch(match.id, formData)} className="mt-2 p-3 bg-white rounded border border-blue-200 grid gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium">Date</label>
                          <input name="date" type="date" defaultValue={match.date ? match.date.split('T')[0] : ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Time</label>
                          <input name="time" type="time" defaultValue={match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium">Home Score</label>
                          <input name="homeScore" type="number" defaultValue={match.homeScore ?? ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Away Score</label>
                          <input name="awayScore" type="number" defaultValue={match.awayScore ?? ''} className="w-full border rounded px-2 py-1 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Venue</label>
                        <input name="venue" list="venues" defaultValue={match.venue || ''} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Status</label>
                        <select name="status" defaultValue={match.status || 'scheduled'} className="w-full border rounded px-2 py-1 text-sm">
                          <option value="scheduled">Scheduled</option>
                          <option value="finished">Finished</option>
                        </select>
                      </div>
                      <button type="submit" className="bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700">Update Result</button>
                    </form>
                  ) : (
                    <div className="text-right font-mono text-sm font-bold">
                      {match.homeScore} - {match.awayScore}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950 sm:p-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
          <button
            onClick={handleResetSeason}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            Reset Season Data
          </button>
        </section>
      </main>
    </div>
  );
}