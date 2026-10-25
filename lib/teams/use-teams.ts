'use client';

import { useState, useEffect } from 'react';
import type { TeamDisplay } from '@/lib/teams/load';

/**
 * Client-side hook to fetch teams from the API (DB-backed).
 * Used by client components that can't use the server-side getTeamsForCurrentLeague().
 */
export function useTeams() {
  const [teams, setTeams] = useState<TeamDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/teams', { cache: 'no-store' });
        const body = await res.json();
        if (!body?.ok) throw new Error(body?.error?.message || 'Failed to load teams');
        setTeams(
          body.data.teams.map((t: { name: string; nameZh?: string | null; shortName?: string | null; color?: string | null; venue?: string | null; coach?: unknown; manager?: unknown; captains?: unknown }) => ({
            name: t.name,
            nameZh: t.nameZh ?? t.name,
            shortName: t.shortName ?? t.name,
            color: t.color ?? 'from-slate-600 to-slate-800',
            venue: t.venue,
            coach: t.coach as TeamDisplay['coach'],
            manager: t.manager as TeamDisplay['manager'],
            captains: t.captains as TeamDisplay['captains'],
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { teams, loading, error };
}
