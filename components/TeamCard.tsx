'use client';

import { useState } from 'react';
import type { TeamContact } from '@/lib/team-contacts';
import type { Player } from '@/lib/schema';

interface TeamCardProps {
  team: TeamContact;
  players: Player[];
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={`複製 ${label}`}
      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 transition-colors flex-shrink-0"
    >
      <span className="max-w-[90px] truncate">{value}</span>
      <span className="text-zinc-400 flex-shrink-0">
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        )}
      </span>
    </button>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const hasPhone = !!player.phoneNumber;
  const hasEmail = !!player.email;

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">#{player.jerseyNumber ?? '—'}</span>
        </div>
        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-100 truncate">{player.name}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {hasPhone ? (
          <a href={`tel:${player.phoneNumber!}`} onClick={e => e.stopPropagation()} className="text-xs" title={player.phoneNumber!}>📞</a>
        ) : null}
        {hasEmail ? (
          <a href={`mailto:${player.email!}`} onClick={e => e.stopPropagation()} className="text-xs" title={`📧 ${player.email!}`}>📧</a>
        ) : null}
      </div>
    </div>
  );
}

export function TeamCard({ team, players }: TeamCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(false);

  const teamPlayers = players.filter(p => p.team === team.team);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden transition-all hover:shadow-md">
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${team.color} flex-shrink-0`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">{team.shortName}</span>
              <span className="text-xs text-zinc-400">({team.teamZh})</span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              <span>{teamPlayers.length} 人</span>
            </div>
          </div>
        </div>
        <div className={`flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          {/* 1. 基本資料 */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">領隊</span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 space-y-2">
              {team.captains.map((captain, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400 w-10 flex-shrink-0 text-xs">{index + 1}.</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{captain.name}</span>
                  <span className="text-zinc-400 text-xs">({captain.email ?? '—'})</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 領隊聯絡 */}
          {team.captains.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">教練</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 space-y-2">
                {team.captains.map((captain, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-400 flex-shrink-0">{index + 1}.</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">{captain.name}</span>
                    </div>
                    {captain.email && (
                      <div className="flex items-center gap-2 ml-5">
                        <span className="text-zinc-400 flex-shrink-0">📧</span>
                        <a href={`mailto:${captain.email}`} onClick={e => e.stopPropagation()} className="text-xs text-blue-600 hover:underline truncate">{captain.email}</a>
                        <CopyButton value={captain.email} label="領隊電郵" />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  {team.captains[0]?.email && (
                    <a href={`mailto:${team.captains[0].email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors">
                      📧 發郵件領隊
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. 球員列表 */}
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setPlayersExpanded(!playersExpanded); }}
              className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">球員列表</span>
                <span className="text-[10px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-1.5 py-0.5 rounded-full font-bold">{teamPlayers.length}</span>
              </div>
              <div className={`flex items-center gap-1 text-[10px] text-zinc-500 transition-transform duration-200 ${playersExpanded ? 'rotate-180' : ''}`}>
                <span>{playersExpanded ? '收起' : '展開'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${playersExpanded ? 'max-h-[2000px] mt-2' : 'max-h-0'}`}>
              {teamPlayers.length === 0 ? (
                <div className="text-center py-6 text-sm text-zinc-400">暫無球員資料</div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between gap-2 py-1.5 px-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase w-10 flex-shrink-0">號碼</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">球員</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase flex-shrink-0">
                      <span className="w-3.5 text-center">電</span>
                      <span className="w-3.5 text-center">電</span>
                      <span className="w-3.5 text-center">郵</span>
                    </div>
                  </div>
                  {teamPlayers.slice().sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)).map(player => (
                    <PlayerRow key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
