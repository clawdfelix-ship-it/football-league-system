'use client';

import { useState } from 'react';
import { updateMatch, deleteMatch, resetSeason, addMatch } from '@/lib/actions';
import { useTeams } from '@/lib/teams/use-teams';

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
  '跑馬地遊樂場 3 號場 (Happy Valley Recreation Ground No. 3)',
  '跑馬地遊樂場 8 號場 (Happy Valley Recreation Ground No. 8)',
  '中山紀念公園 (Sun Yat Sen Memorial Park)',
  '鰂魚涌公園 1 號場 (Quarry Bay Park No. 1, near Taikoo Shing)',
  '鰂魚涌公園 2 號場 (Quarry Bay Park No. 2, near Quarry Bay Station)'
];

export function MatchList({ 
  scheduledMatches, 
  finishedMatches 
}: { 
  scheduledMatches: Match[], 
  finishedMatches: Match[] 
}) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>('');

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
      const [year, month, day] = dateRaw.split('-').map(Number);
      const [hours, minutes] = timeString.split(':').map(Number);
      // Create date as LOCAL time (Hong Kong), not UTC
      matchDate = new Date(year, month - 1, day, hours, minutes);
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

  const teams = [...new Set([...scheduledMatches, ...finishedMatches].flatMap(m => [m.homeTeam, m.awayTeam]))].sort();

  const filteredScheduled = teamFilter
    ? scheduledMatches.filter(m => m.homeTeam === teamFilter || m.awayTeam === teamFilter)
    : scheduledMatches;
  const filteredFinished = teamFilter
    ? finishedMatches.filter(m => m.homeTeam === teamFilter || m.awayTeam === teamFilter)
    : finishedMatches;

  return (
    <>
      {/* Team filter */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="team-filter" className="text-sm font-medium text-slate-700">篩選球隊：</label>
        <select
          id="team-filter"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">全部球隊</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {teamFilter && (
          <button
            onClick={() => setTeamFilter('')}
            className="btn-admin btn-admin-sm"
          >
            清除
          </button>
        )}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">Upcoming Fixtures</h2>
        <div className="space-y-3 mb-8">
          {filteredScheduled.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming fixtures.</p>
          ) : (
            filteredScheduled.map((match) => (
              <div key={match.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-blue-50/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">{match.homeTeam} vs {match.awayTeam}</div>
                    <div className="text-xs text-slate-600">
                      {match.date ? new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' (' + new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short' }) + ')' : 'TBC'} {match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} • {match.venue || 'TBC'} {match.round ? `• ${match.round}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                      className="btn-admin btn-admin-sm text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    >
                      {editingMatch === match.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => handleDeleteMatch(match.id)}
                      className="btn-admin-danger btn-admin-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {editingMatch === match.id ? (
                  <form action={(formData) => handleUpdateMatch(match.id, formData)} className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Date</label>
                        <input name="date" type="date" defaultValue={match.date ? match.date.split('T')[0] : ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Time</label>
                        <input name="time" type="time" defaultValue={match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Home Score</label>
                        <input name="homeScore" type="number" defaultValue={match.homeScore ?? ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Away Score</label>
                        <input name="awayScore" type="number" defaultValue={match.awayScore ?? ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Venue</label>
                      <input name="venue" list="venues" defaultValue={match.venue || ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      <datalist id="venues">
                        {VENUES.map(v => <option key={v} value={v} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Round</label>
                      <select name="round" defaultValue={match.round || ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
                        <option value="">Select Round</option>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Round ${num}`}>Round {num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Status</label>
                      <select name="status" defaultValue={match.status || 'scheduled'} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
                        <option value="scheduled">Scheduled</option>
                        <option value="tbc">TBC</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn-admin btn-admin-sm" onClick={() => setEditingMatch(null)}>Cancel</button>
                      <button type="submit" className="btn-admin-primary btn-admin-sm">Confirm Update</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-right font-mono text-sm font-bold text-slate-400">
                    VS
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4 pt-4 border-t border-slate-100 text-slate-900">Match Results</h2>
        <div className="space-y-3">
          {filteredFinished.length === 0 ? (
            <p className="text-sm text-slate-600">No finished matches.</p>
          ) : (
            filteredFinished.map((match) => (
              <div key={match.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">{match.homeTeam} vs {match.awayTeam}</div>
                    <div className="text-xs text-slate-600">
                      {match.date ? new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' (' + new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short' }) + ')' : 'TBC'} {match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} • {match.venue || 'TBC'} {match.round ? `• ${match.round}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                      className="btn-admin btn-admin-sm text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    >
                      {editingMatch === match.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => handleDeleteMatch(match.id)}
                      className="btn-admin-danger btn-admin-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {editingMatch === match.id ? (
                  <form action={(formData) => handleUpdateMatch(match.id, formData)} className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Date</label>
                        <input name="date" type="date" defaultValue={match.date ? match.date.split('T')[0] : ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Time</label>
                        <input name="time" type="time" defaultValue={match.date ? new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Home Score</label>
                        <input name="homeScore" type="number" defaultValue={match.homeScore ?? ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Away Score</label>
                        <input name="awayScore" type="number" defaultValue={match.awayScore ?? ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Venue</label>
                      <input name="venue" list="venues" defaultValue={match.venue || ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                      <datalist id="venues">
                        {VENUES.map(v => <option key={v} value={v} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Round</label>
                      <select name="round" defaultValue={match.round || ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
                        <option value="">Select Round</option>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Round ${num}`}>Round {num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Status</label>
                      <select name="status" defaultValue={match.status || 'scheduled'} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
                        <option value="scheduled">Scheduled</option>
                        <option value="tbc">TBC</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn-admin btn-admin-sm" onClick={() => setEditingMatch(null)}>Cancel</button>
                      <button type="submit" className="btn-admin-primary btn-admin-sm">Confirm Update</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-right font-mono text-sm font-bold text-slate-900">
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
  const [isCustomVenue, setIsCustomVenue] = useState(false);
  const { teams } = useTeams();

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
      const [year, month, day] = dateRaw.split('-').map(Number);
      const [hours, minutes] = timeString.split(':').map(Number);
      // Create date as LOCAL time (Hong Kong), not UTC
      matchDate = new Date(year, month - 1, day, hours, minutes);
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Add Match</h2>
      <form action={handleSubmitMatch} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Home team</label>
            <select name="homeTeam" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
              <option value="">Select Home Team</option>
              {teams.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Away team</label>
            <select name="awayTeam" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
              <option value="">Select Away Team</option>
              {teams.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select name="status" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
              <option value="scheduled">Scheduled (Fixture)</option>
              <option value="tbc">TBC</option>
              <option value="finished">Finished (Result)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Match date</label>
            <div className="flex gap-2">
              <input name="date" type="date" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
              <input name="time" type="time" className="w-36 shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Venue</label>
            {isCustomVenue ? (
              <div className="flex gap-2">
                <input
                  name="venue"
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
                  placeholder="輸入自定義場地"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomVenue(false)}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  返回清單
                </button>
              </div>
            ) : (
              <select
                name="venue"
                onChange={(e) => { if (e.target.value === '__custom__') setIsCustomVenue(true); }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
              >
                <option value="">Select Venue</option>
                {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                <option value="__custom__">自定義… (Custom venue)</option>
              </select>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Round</label>
            <select name="round" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25">
              <option value="">Select Round</option>
              {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                <option key={num} value={`Round ${num}`}>Round {num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Home score</label>
            <input name="homeScore" type="number" min="0" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Away score</label>
            <input name="awayScore" type="number" min="0" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full h-auto rounded-lg py-2.5">
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
    <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
      <button
        onClick={handleResetSeason}
        className="btn-admin-danger mt-4"
      >
        Reset Season Data
      </button>
    </section>
  );
}
