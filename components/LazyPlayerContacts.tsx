'use client';

import { useState } from 'react';
import { PlayerContactList } from './PlayerContactList';
import type { Player } from '@/lib/schema';

/**
 * Lazy wrapper around PlayerContactList: fetches all players only when the
 * admin expands the section, instead of loading them with the admin page.
 * Keeps the admin shell fast (it mainly needs fixtures/results).
 */
export function LazyPlayerContacts({
  title,
  defaultExpanded = false,
}: {
  title: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function ensureLoaded(next: boolean) {
    setExpanded(next);
    if (!next || loaded || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/players', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players ?? []);
      }
    } catch {
      // keep empty; list shows its own empty state
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => ensureLoaded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-6"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a237e]/20 border-t-[#1a237e]" />
              <span className="text-xs">載入球員中…</span>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <PlayerContactList players={players} showTeamFilter />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
