'use client';

import { useState } from 'react';
import type { Player } from '@/lib/schema';
import { TEAMS } from '@/lib/constants';

interface PlayerContactListProps {
  players: Player[];
  showTeamFilter?: boolean;
}

export function PlayerContactList({ players, showTeamFilter = false }: PlayerContactListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filterTeam, setFilterTeam] = useState<string>('all');

  const togglePlayer = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredPlayers = filterTeam === 'all'
    ? players
    : players.filter(p => p.team === filterTeam);

  return (
    <div className="space-y-4">
      {showTeamFilter && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTeam('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterTeam === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            All ({players.length})
          </button>
          {TEAMS.map((team) => {
            const count = players.filter(p => p.team === team.name).length;
            if (count === 0) return null;
            return (
              <button
                key={team.name}
                onClick={() => setFilterTeam(team.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filterTeam === team.name
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                <span className={`bg-gradient-to-br ${team.color} bg-clip-text`}>{team.shortName}</span>
                <span className="text-zinc-400">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {filteredPlayers.map((p) => {
          const isExpanded = expandedIds.has(p.id);
          const team = TEAMS.find(t => t.name === p.team);

          return (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden transition-all"
            >
              {/* Header row - always visible */}
              <div
                className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                onClick={() => togglePlayer(p.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Jersey badge */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      #{p.jerseyNumber ?? '—'}
                    </span>
                  </div>

                  {/* Name & position */}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>{p.position}</span>
                      {team && (
                        <>
                          <span>•</span>
                          <span className={`bg-gradient-to-br ${team.color} bg-clip-text text-transparent font-black text-[10px]`}>
                            {team.shortName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayer(p.id);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isExpanded
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                        隱藏
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        顯示
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded contact info */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-3 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {/* Email */}
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 flex-shrink-0">
                        <rect width="20" height="16" x="2" y="4" rx="2"/>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wide">電郵</div>
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {p.email}
                          </a>
                        ) : (
                          <div className="text-sm text-zinc-400">—</div>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 flex-shrink-0">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wide">電話</div>
                        {p.phoneNumber ? (
                          <a
                            href={`tel:${p.phoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-zinc-800 dark:text-zinc-100 hover:underline"
                          >
                            {p.phoneNumber}
                          </a>
                        ) : (
                          <div className="text-sm text-zinc-400">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
          暫無球員資料
        </div>
      )}
    </div>
  );
}
