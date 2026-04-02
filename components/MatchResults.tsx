'use client';

import { useState } from 'react';
import { updateMatch, deleteMatch } from '@/lib/actions';

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

export function MatchResults({ matches }: { matches: Match[] }) {
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
    window.location.reload();
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (confirm('Are you sure you want to delete this match?')) {
      await deleteMatch(matchId);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3">
      {matches.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No finished matches.</p>
      ) : (
        matches.map((match) => (
          <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">{match.homeTeam} vs {match.awayTeam}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {match.date ? new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' (' + new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short' }) + ')' : 'TBC'} {match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} • {match.venue || 'TBC'} {match.round ? `• ${match.round}` : ''}
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
                  <input name="venue" list="results-venues" defaultValue={match.venue || ''} className="w-full border dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                  <datalist id="results-venues">
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
  );
}
