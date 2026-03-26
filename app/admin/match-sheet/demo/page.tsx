'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PrintButton } from '../[teamId]/PrintButton';

type DemoPlayer = {
  id: number;
  name: string;
  jerseyNumber: number | null;
  photoUrl: string | null;
};

const DEMO_TEAM = {
  name: 'REAL MADRID (DEMO)',
};

const DEMO_PLAYERS_BASE: DemoPlayer[] = [
  { id: 1, name: 'Thibaut Courtois', jerseyNumber: 1, photoUrl: null },
  { id: 2, name: 'Andriy Lunin', jerseyNumber: 13, photoUrl: null },
  { id: 3, name: 'Dani Carvajal', jerseyNumber: 2, photoUrl: null },
  { id: 4, name: 'Eder Militao', jerseyNumber: 3, photoUrl: null },
  { id: 5, name: 'David Alaba', jerseyNumber: 4, photoUrl: null },
  { id: 6, name: 'Trent Alexander-Arnold', jerseyNumber: 12, photoUrl: null },
  { id: 7, name: 'Antonio Rudiger', jerseyNumber: 22, photoUrl: null },
  { id: 8, name: 'Ferland Mendy', jerseyNumber: 23, photoUrl: null },
  { id: 9, name: 'Jude Bellingham', jerseyNumber: 5, photoUrl: null },
  { id: 10, name: 'Eduardo Camavinga', jerseyNumber: 6, photoUrl: null },
  { id: 11, name: 'Federico Valverde', jerseyNumber: 19, photoUrl: null },
  { id: 12, name: 'Aurelien Tchouameni', jerseyNumber: 14, photoUrl: null },
  { id: 13, name: 'Vinicius Junior', jerseyNumber: 7, photoUrl: null },
  { id: 14, name: 'Kylian Mbappe', jerseyNumber: 10, photoUrl: null },
  { id: 15, name: 'Rodrygo', jerseyNumber: 11, photoUrl: null },
  { id: 16, name: 'Brahim Diaz', jerseyNumber: 21, photoUrl: null },
];

function storageKey(id: number) {
  return `demo_rm_photo_${id}`;
}

export default function DemoMatchSheet() {
  const [players, setPlayers] = useState<DemoPlayer[]>(DEMO_PLAYERS_BASE);
  const totalGridSlots = 30;
  const emptySlots = useMemo(() => Array(Math.max(0, totalGridSlots - players.length)).fill(null), [players.length]);

  useEffect(() => {
    setPlayers((prev) =>
      prev.map((p) => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(p.id)) : null;
        return { ...p, photoUrl: stored || null };
      })
    );
  }, []);

  const setPhoto = async (playerId: number, file: File) => {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });

    try {
      window.localStorage.setItem(storageKey(playerId), dataUrl);
    } catch {}

    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, photoUrl: dataUrl } : p)));
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <PrintButton />
      </div>

      <div className="w-[210mm] min-h-[297mm] mx-auto border-2 border-black p-6 flex flex-col bg-white">
        <header className="text-center border-b-4 border-black pb-4 mb-4">
          <h1 className="text-2xl font-black tracking-widest italic">Hong Kong Bank League 2026</h1>
          <h2 className="text-sm font-bold tracking-wider text-gray-600 mb-1">Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026</h2>
          <h3 className="text-lg font-bold tracking-wider text-black border-t-2 border-black pt-1 mt-1 inline-block px-4">SQUAD LIST</h3>
          <div className="grid grid-cols-3 mt-4 text-left font-bold text-sm">
            <div>隊名 (Team): <span className="underline decoration-dotted text-lg">{DEMO_TEAM.name}</span></div>
            <div>地點 (Venue): ________________</div>
            <div>日期 (Date): ________________</div>
          </div>
        </header>

        <section className="flex-grow">
          <h2 className="bg-slate-200 text-center font-bold border-y border-black py-1 text-xs mb-2 italic print:bg-gray-200 print:text-black">常規球員 (REGULAR PLAYERS)</h2>
          <div className="grid grid-cols-6 border-t border-l border-black">
            {players.map((p) => (
              <div key={p.id} className="group relative border-r border-b border-black p-1 text-center h-[115px] grid grid-rows-[minmax(44px,80px)_auto_auto] justify-items-center gap-1">
                <div className="absolute bottom-1 left-1 w-3 h-3 border border-black"></div>
                <div className="w-16 h-full max-h-20 border border-gray-200 bg-gray-50 overflow-hidden relative print:bg-white print:border-gray-400">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">NO PHOTO</div>
                  )}
                  <label className="absolute top-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 cursor-pointer print:hidden">
                    Edit
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void setPhoto(p.id, file);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="text-[9px] font-bold leading-tight whitespace-normal break-words w-full px-0.5">{p.name}</div>
                <div className="text-[9px] font-mono leading-none">#{p.jerseyNumber ?? '—'}</div>
              </div>
            ))}
            {emptySlots.map((_, i) => (
              <div key={`empty-${i}`} className="relative border-r border-b border-black h-[115px] p-1 flex items-start justify-center">
                <div className="absolute bottom-1 left-1 w-3 h-3 border border-black"></div>
                <div className="w-16 h-16 border border-dashed border-gray-200 print:border-gray-300"></div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* REMARKS — Column A（左） */}
          <div className="border border-black p-2 flex flex-col">
            <h3 className="text-center font-bold text-xs border-b border-black pb-1 mb-2">REMARKS</h3>
            {/* 3 column × 5 row table: Row1=headers, Rows2-5=fillable */}
            <div className="flex-grow border border-gray-300 h-40 overflow-hidden">
              <div className="grid grid-cols-3 h-full auto-rows-fr">
                {/* Row 1: headers */}
                <div className="border-r border-b border-black bg-slate-100 p-1 text-center text-[10px] font-bold">主隊 Home</div>
                <div className="border-r border-b border-black bg-slate-100 p-1 text-center text-[10px] font-bold">賽果 Results</div>
                <div className="border-b border-black bg-slate-100 p-1 text-center text-[10px] font-bold">客隊 Away</div>
                {/* Row 2: 比數 Score */}
                <div className="border-r border-b border-gray-300"></div>
                <div className="border-r border-b border-gray-300 text-[9px] font-bold text-zinc-500 flex items-center justify-center">比數 Score</div>
                <div className="border-b border-gray-300"></div>
                {/* Row 3: 入球球員 Scorers */}
                <div className="border-r border-b border-gray-300"></div>
                <div className="border-r border-b border-gray-300 text-[9px] font-bold text-zinc-500 flex items-center justify-center">入球球員 Scorers</div>
                <div className="border-b border-gray-300"></div>
                {/* Row 4: 黃牌 Yellow Cards */}
                <div className="border-r border-b border-gray-300"></div>
                <div className="border-r border-b border-gray-300 text-[9px] font-bold text-zinc-500 flex items-center justify-center">黃牌 Yellow Cards</div>
                <div className="border-b border-gray-300"></div>
                {/* Row 5: 紅牌 Red Cards */}
                <div className="border-r border-b border-gray-300"></div>
                <div className="border-r border-gray-300 text-[9px] font-bold text-zinc-500 flex items-center justify-center">紅牌 Red Cards</div>
                <div></div>
              </div>
            </div>
          </div>

          {/* 簽名區 — Column B（右） */}
          <div className="border border-black p-2 flex flex-col">
            <h3 className="text-center font-bold text-xs border-b border-black pb-1 mb-2">簽名區 (SIGNATURES)</h3>
            <div className="flex flex-col gap-4 text-[10px] flex-grow pt-2">
              <div className="border border-gray-300 p-2">
                <div className="font-bold text-center mb-2">主隊領隊 / Home Team Manager</div>
                <div className="flex items-end justify-between mt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-32 border-b border-black text-center py-1"></div>
                    <div className="text-[9px] text-gray-500 mt-1">簽名 (Signature)</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 border-b border-black text-center py-1"></div>
                    <div className="text-[9px] text-gray-500 mt-1">日期 (Date)</div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300 p-2">
                <div className="font-bold text-center mb-2">客隊領隊 / Away Team Manager</div>
                <div className="flex items-end justify-between mt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-32 border-b border-black text-center py-1"></div>
                    <div className="text-[9px] text-gray-500 mt-1">簽名 (Signature)</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 border-b border-black text-center py-1"></div>
                    <div className="text-[9px] text-gray-500 mt-1">日期 (Date)</div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300 p-2">
                <div className="font-bold text-center mb-2">球證 / Referee</div>
                <div className="flex items-end justify-between mt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-32 border-b border-black text-center py-1"></div>
                    <div className="text-[9px] text-gray-500 mt-1">簽名 (Signature)</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 border-b border-black text-center py-1"></div>
                    <div className="text-[9px] text-gray-500 mt-1">日期 (Date)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs mt-4 text-gray-400 uppercase">
          Zenex Cup official match sheet • Do not duplicate
        </div>
      </div>
    </div>
  );
}
