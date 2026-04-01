'use client';

import { useState } from 'react';
import { updateMatch, deleteMatch, resetSeason, addMatch } from '@/lib/actions';
import { TEAMS } from '@/lib/constants';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string | null;
  status: string | null;
  round?: string | null;
}

const VENUES = [
  '跑馬地遊樂場 8 號場 (Happy Valley Recreation Ground No. 8)',
  '中山紀念公園 (Sun Yat Sen Memorial Park)',
  '鰂魚涌公園 1 號場 (Quarry Bay Park No. 1, near Taikoo Shing)',
  '鰂魚涌公園 2 號場 (Quarry Bay Park No. 2, near Quarry Bay Station)',
  'TBC'
];

export function MatchList({ 
  scheduledMatches, 
  finishedMatches 
}: { 
  scheduledMatches: Match[], 
  finishedMatches: Match[] 
}) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);

  const handleUpdateMatch = async (matchId: number, formData: FormData) => {
    const homeScoreRaw = formData.get('homeScore')?.toString();
    const awayScoreRaw = formData.get('awayScore')?.toString();
    const status = formData.get('status')?.toString() as 'scheduled' | 'finished' | 'tbc';
    const dateRaw = formData.get('date')?.toString();
    const timeRaw = formData.get('time')?.toString();
    const venueRaw = formData.get('venue')?.toString().trim();
    const roundRaw = formData.get('round')?.toString().trim();
    
    const homeScore = homeScoreRaw !== '' ? Number(homeScoreRaw) : undefined;
    const awayScore = awayScoreRaw !== '' ? Number(awayScoreRaw) : undefined;

    let matchDate: Date | undefined;
    if (dateRaw && dateRaw !== 'TBC') {
      const timeString = timeRaw || '00:00';
      const dateTimeString = `${dateRaw}T${timeString}`;
      matchDate = new Date(dateTimeString);
    }

    await updateMatch(matchId, {
      homeScore: Number.isNaN(homeScore) ? undefined : homeScore,
      awayScore: Number.isNaN(awayScore) ? undefined : awayScore,
      status,
      date: matchDate,
      venue: venueRaw || undefined,
      round: roundRaw || undefined
    });
    
    setEditingMatch(null);
    window.location.reload(); // Force refresh to update server data
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (confirm('Are you sure you want to delete this match?')) {
      await deleteMatch(matchId);
      window.location.reload();
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Upcoming Fixtures</h2>
        <div className="space-y-3 mb-8">
          {scheduledMatches.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No upcoming fixtures.</p>
          ) : (
            scheduledMatches.map((match) => (
              <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-blue-50/50 dark:bg-zinc-900 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{match.homeTeam} vs {match.awayTeam}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {match.date ? new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'} {match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} • {match.venue || 'TBC'} {match.round ? `• ${match.round}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      {editingMatch === match.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => handleDeleteMatch(match.id)}
                      className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {editingMatch === match.id ? (
                  <form action={(formData) => handleUpdateMatch(match.id, formData)} className="mt-2 p-3 bg-white dark:bg-zinc-900 rounded border border-blue-200 dark:border-zinc-700 grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Date</label>
                        <input name="date" type="date" defaultValue={match.date ? match.date.split('T')[0] : ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Time</label>
                        <input name="time" type="time" defaultValue={match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Home Score</label>
                        <input name="homeScore" type="number" defaultValue={match.homeScore ?? ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Away Score</label>
                        <input name="awayScore" type="number" defaultValue={match.awayScore ?? ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Venue</label>
                      <input name="venue" list="venues" defaultValue={match.venue || ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      <datalist id="venues">
                        {VENUES.map(v => <option key={v} value={v} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Round</label>
                      <select name="round" defaultValue={match.round || ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <option value="">Select Round</option>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Round ${num}`}>Round {num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                      <select name="status" defaultValue={match.status || 'scheduled'} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <option value="scheduled">Scheduled</option>
                        <option value="tbc">TBC</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 transition-colors">Update Result</button>
                  </form>
                ) : (
                  <div className="text-right font-mono text-sm font-bold text-zinc-400 dark:text-zinc-600">
                    VS
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">Match Results</h2>
        <div className="space-y-3">
          {finishedMatches.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No finished matches.</p>
          ) : (
            finishedMatches.map((match) => (
              <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{match.homeTeam} vs {match.awayTeam}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {match.date ? new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'} {match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} • {match.venue || 'TBC'} {match.round ? `• ${match.round}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      {editingMatch === match.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => handleDeleteMatch(match.id)}
                      className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {editingMatch === match.id ? (
                  <form action={(formData) => handleUpdateMatch(match.id, formData)} className="mt-2 p-3 bg-white dark:bg-zinc-900 rounded border border-blue-200 dark:border-zinc-700 grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Date</label>
                        <input name="date" type="date" defaultValue={match.date ? match.date.split('T')[0] : ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Time</label>
                        <input name="time" type="time" defaultValue={match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Home Score</label>
                        <input name="homeScore" type="number" defaultValue={match.homeScore ?? ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Away Score</label>
                        <input name="awayScore" type="number" defaultValue={match.awayScore ?? ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Venue</label>
                      <input name="venue" list="venues" defaultValue={match.venue || ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                      <datalist id="venues">
                        {VENUES.map(v => <option key={v} value={v} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Round</label>
                      <select name="round" defaultValue={match.round || ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <option value="">Select Round</option>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Round ${num}`}>Round {num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                      <select name="status" defaultValue={match.status || 'scheduled'} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <option value="scheduled">Scheduled</option>
                        <option value="tbc">TBC</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 transition-colors">Update Result</button>
                  </form>
                ) : (
                  <div className="text-right font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export function MatchForm() {
  const handleSubmitMatch = async (formData: FormData) => {
    const homeTeam = formData.get('homeTeam')?.toString().trim() ?? '';
    const awayTeam = formData.get('awayTeam')?.toString().trim() ?? '';
    const homeScoreRaw = formData.get('homeScore')?.toString();
    const awayScoreRaw = formData.get('awayScore')?.toString();
    const dateRaw = formData.get('date')?.toString();
    const timeRaw = formData.get('time')?.toString();
    const venueRaw = formData.get('venue')?.toString().trim();
    const status = formData.get('status')?.toString() as 'scheduled' | 'finished' | 'tbc';
    const roundRaw = formData.get('round')?.toString().trim();

    if (!homeTeam || !awayTeam) return;

    const homeScore = homeScoreRaw !== '' ? Number(homeScoreRaw) : undefined;
    const awayScore = awayScoreRaw !== '' ? Number(awayScoreRaw) : undefined;

    let matchDate: Date | undefined;
    if (dateRaw && dateRaw !== 'TBC') {
      const timeString = timeRaw || '00:00';
      const dateTimeString = `${dateRaw}T${timeString}`;
      matchDate = new Date(dateTimeString);
    }

    await addMatch({
      homeTeam,
      awayTeam,
      homeScore: Number.isNaN(homeScore) ? undefined : homeScore,
      awayScore: Number.isNaN(awayScore) ? undefined : awayScore,
      date: matchDate, // Can be undefined for TBC
      venue: venueRaw || 'TBC',
      status: status || 'scheduled',
      round: roundRaw || undefined
    });

    window.location.reload();
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add Match</h2>
      <form action={handleSubmitMatch} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Home team</label>
            <select name="homeTeam" required className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
              <option value="">Select Home Team</option>
              {TEAMS.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Away team</label>
            <select name="awayTeam" required className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
              <option value="">Select Away Team</option>
              {TEAMS.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Status</label>
            <select name="status" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
              <option value="scheduled">Scheduled (Fixture)</option>
              <option value="tbc">TBC</option>
              <option value="finished">Finished (Result)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Match date</label>
            <div className="flex gap-2">
              <input name="date" type="date" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" />
              <input name="time" type="time" className="w-32 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Venue</label>
            <input name="venue" list="venues" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" placeholder="Select or type venue" />
            <datalist id="venues">
              {VENUES.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Round</label>
            <select name="round" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
              <option value="">Select Round</option>
              {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                <option key={num} value={`Round ${num}`}>Round {num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Home score</label>
            <input name="homeScore" type="number" min="0" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Away score</label>
            <input name="awayScore" type="number" min="0" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100" />
          </div>
        </div>

        <button type="submit" className="w-full rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
          Submit Match
        </button>
      </form>
    </section>
  );
}

export function ResetButton() {
  const handleResetSeason = async () => {
    if (confirm('Are you sure you want to reset the entire season? This cannot be undone.')) {
      try {
        await resetSeason();
        alert('Season reset successfully. Please refresh the homepage to see changes.');
        window.location.reload();
      } catch (error) {
        console.error('Reset failed:', error);
        alert('Reset failed. ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  return (
    <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
      <button
        onClick={handleResetSeason}
        className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
      >
        Reset Season Data
      </button>
    </section>
  );
}
