'use client';

import { useEffect, useMemo, useState } from 'react';
import { updateMatch, deleteMatch } from '@/lib/actions';
import { apiJson } from '@/lib/api/client';
import type { PublicPlayer } from '@/lib/public-types';

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

type MatchGoalEntry = { playerId: number; playerName: string; team: string | null; goals: number };

const VENUES = [
  '跑馬地遊樂場 8 號場 (Happy Valley Recreation Ground No. 8)',
  '中山紀念公園 (Sun Yat Sen Memorial Park)',
  '鰂魚涌公園 1 號場 (Quarry Bay Park No. 1, near Taikoo Shing)',
  '鰂魚涌公園 2 號場 (Quarry Bay Park No. 2, near Quarry Bay Station)',
  'TBC'
];

export function MatchResults({ matches, allowGoals }: { matches: Match[]; allowGoals?: boolean }) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [players, setPlayers] = useState<PublicPlayer[] | null>(null);
  const [goals, setGoals] = useState<Array<{ playerId: number; goals: number }>>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const playerLabel = (p: PublicPlayer) => (p.jerseyNumber ? `${p.name} #${p.jerseyNumber}` : p.name);

  const editing = useMemo(
    () => (editingMatch === null ? null : matches.find((m) => m.id === editingMatch) ?? null),
    [editingMatch, matches]
  );

  useEffect(() => {
    let active = true;
    async function loadPlayers() {
      if (!allowGoals) return;
      if (players) return;
      try {
        const data = await apiJson<{ players: PublicPlayer[] }>(await fetch('/api/players', { cache: 'no-store' }));
        if (!active) return;
        setPlayers(data.players ?? []);
      } catch {
        if (!active) return;
        setPlayers([]);
      }
    }
    loadPlayers();
    return () => {
      active = false;
    };
  }, [players, allowGoals]);

  useEffect(() => {
    let active = true;
    async function loadGoals(matchId: number) {
      if (!allowGoals) return;
      setGoalsLoading(true);
      setGoalsError(null);
      try {
        const data = await apiJson<{ entries: MatchGoalEntry[] }>(
          await fetch(`/api/matches/${matchId}/goals`, { cache: 'no-store' })
        );
        if (!active) return;
        setGoals((data.entries ?? []).map((e) => ({ playerId: e.playerId, goals: e.goals })));
      } catch (e) {
        if (!active) return;
        setGoals([]);
        setGoalsError(e instanceof Error ? e.message : 'Failed to load match goals');
      } finally {
        if (!active) return;
        setGoalsLoading(false);
      }
    }

    if (editingMatch !== null) {
      loadGoals(editingMatch);
    } else {
      setGoals([]);
      setGoalsError(null);
      setGoalsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [editingMatch, allowGoals]);

  const homePlayers = useMemo(() => {
    if (!editing) return [];
    const list = players ?? [];
    const home = editing.homeTeam.trim().toUpperCase();
    return list.filter((p) => (p.team ?? '').trim().toUpperCase() === home);
  }, [players, editing]);

  const awayPlayers = useMemo(() => {
    if (!editing) return [];
    const list = players ?? [];
    const away = editing.awayTeam.trim().toUpperCase();
    return list.filter((p) => (p.team ?? '').trim().toUpperCase() === away);
  }, [players, editing]);

  const usedIds = useMemo(() => new Set(goals.map((g) => g.playerId)), [goals]);

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

    try {
      if (allowGoals) {
        await apiJson<{ message: string }>(
          await fetch(`/api/matches/${matchId}/goals`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ entries: goals }),
          })
        );
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save match goals');
      return;
    }

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
        <p className="text-sm text-slate-500 py-4 text-center">No finished matches.</p>
      ) : (
        matches.map((match) => (
          <div key={match.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-slate-900">{match.homeTeam} vs {match.awayTeam}</div>
                <div className="text-xs text-slate-500">
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateMatch(match.id, new FormData(e.currentTarget));
                }}
                className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 grid gap-3"
              >
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
                  <input name="venue" list="results-venues" defaultValue={match.venue || ''} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25" />
                  <datalist id="results-venues">
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

                {allowGoals ? (
                  <div className="rounded border border-slate-200 p-3 grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">Goals / 入球球員</div>
                    {goalsLoading ? <div className="text-xs text-slate-500">Loading…</div> : null}
                  </div>
                  {goalsError ? <div className="text-xs text-red-600">{goalsError}</div> : null}

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <div className="text-xs font-medium text-slate-700">{match.homeTeam}</div>
                      {goals
                        .filter((g) => homePlayers.some((p) => p.id === g.playerId))
                        .map((g, idx) => (
                          <div key={`${g.playerId}-${idx}`} className="grid grid-cols-[1fr_84px_28px] gap-2">
                            <select
                              value={g.playerId}
                              onChange={(e) => {
                                const nextId = Number(e.target.value);
                                setGoals((prev) =>
                                  prev.map((x) => (x === g ? { ...x, playerId: nextId } : x))
                                );
                              }}
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
                            >
                              {homePlayers.map((p) => (
                                <option key={p.id} value={p.id} disabled={p.id !== g.playerId && usedIds.has(p.id)}>
                                  {playerLabel(p)}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={g.goals}
                              onChange={(e) => {
                                const nextGoals = Number(e.target.value);
                                setGoals((prev) => prev.map((x) => (x === g ? { ...x, goals: nextGoals } : x)));
                              }}
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
                            />
                            <button
                              type="button"
                              onClick={() => setGoals((prev) => prev.filter((x) => x !== g))}
                              className="text-xs bg-slate-100 text-slate-700 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        onClick={() => {
                          const first = homePlayers.find((p) => !usedIds.has(p.id));
                          if (!first) return;
                          setGoals((prev) => [...prev, { playerId: first.id, goals: 1 }]);
                        }}
                        className="btn-admin btn-admin-sm"
                      >
                        Add scorer
                      </button>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs font-medium text-slate-700">{match.awayTeam}</div>
                      {goals
                        .filter((g) => awayPlayers.some((p) => p.id === g.playerId))
                        .map((g, idx) => (
                          <div key={`${g.playerId}-${idx}`} className="grid grid-cols-[1fr_84px_28px] gap-2">
                            <select
                              value={g.playerId}
                              onChange={(e) => {
                                const nextId = Number(e.target.value);
                                setGoals((prev) =>
                                  prev.map((x) => (x === g ? { ...x, playerId: nextId } : x))
                                );
                              }}
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
                            >
                              {awayPlayers.map((p) => (
                                <option key={p.id} value={p.id} disabled={p.id !== g.playerId && usedIds.has(p.id)}>
                                  {playerLabel(p)}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={g.goals}
                              onChange={(e) => {
                                const nextGoals = Number(e.target.value);
                                setGoals((prev) => prev.map((x) => (x === g ? { ...x, goals: nextGoals } : x)));
                              }}
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/25"
                            />
                            <button
                              type="button"
                              onClick={() => setGoals((prev) => prev.filter((x) => x !== g))}
                              className="text-xs bg-slate-100 text-slate-700 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        onClick={() => {
                          const first = awayPlayers.find((p) => !usedIds.has(p.id));
                          if (!first) return;
                          setGoals((prev) => [...prev, { playerId: first.id, goals: 1 }]);
                        }}
                        className="btn-admin btn-admin-sm"
                      >
                        Add scorer
                      </button>
                    </div>
                  </div>
                </div>
                ) : null}
                <button type="submit" className="btn-admin-primary btn-admin-sm">Update Result</button>
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
  );
}
