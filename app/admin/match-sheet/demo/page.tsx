'use client';

import React, { useMemo, useState } from 'react';
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
  const [players, setPlayers] = useState<DemoPlayer[]>(() =>
    DEMO_PLAYERS_BASE.map((p) => {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(p.id)) : null;
      return { ...p, photoUrl: stored || null };
    })
  );
  const totalGridSlots = 30;
  const emptySlots = useMemo(() => Array(Math.max(0, totalGridSlots - players.length)).fill(null), [players.length]);

  const setPhoto = async (playerId: number, file: File) => {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
    try { window.localStorage.setItem(storageKey(playerId), dataUrl); } catch {}
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, photoUrl: dataUrl } : p)));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white">
      {/* Print button (hidden when printing) */}
      <div className="flex justify-center mb-4 print:hidden">
        <PrintButton />
      </div>

      {/* A4 container — matches teamId page layout */}
      <div
        className="mx-auto bg-white shadow-2xl"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '4mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '1mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
          overflow: 'hidden',
          breakInside: 'avoid',
        }}
      >
        {/* ── ① HEADER ─────────────────────────────── */}
        <header
          style={{
            textAlign: 'center',
            border: '2px solid black',
            padding: '1mm 3mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15mm',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '11pt', fontWeight: 900, letterSpacing: '0.1em', fontStyle: 'italic', lineHeight: 1.1, color: 'black' }}>
            Hong Kong Bank League 2026
          </div>
          <div style={{ fontSize: '5.5pt', fontWeight: 700, letterSpacing: '0.05em', color: '#555', lineHeight: 1.2 }}>
            Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026
          </div>
          <div style={{
            display: 'inline-block',
            borderTop: '1px solid black',
            borderBottom: '1px solid black',
            fontSize: '8pt',
            fontWeight: 900,
            letterSpacing: '0.16em',
            padding: '0.15mm 5mm',
            margin: '0.25mm auto 0.5mm',
            lineHeight: 1.4,
            color: 'black',
          }}>
            SQUAD LIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1mm', fontSize: '6.5pt', fontWeight: 700, lineHeight: 1.3 }}>
            <div style={{ textAlign: 'left' }}>
              隊名 (Team):{' '}
              <span style={{ textDecoration: 'underline dotted black', fontSize: '8pt' }}>{DEMO_TEAM.name}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              地點 (Venue): ___________________
            </div>
            <div style={{ textAlign: 'right' }}>
              日期 (Date): ___________________
            </div>
          </div>
        </header>

        {/* ── ② SECTION LABEL ─────────────────────── */}
        <div style={{
          background: '#dcdcdc',
          border: '1px solid black',
          textAlign: 'center',
          fontSize: '5.5pt',
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '0.5mm 2mm',
          flexShrink: 0,
          color: 'black',
        }}>
          常規球員 (REGULAR PLAYERS)
        </div>

        {/* ── ③ PLAYER GRID ────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 40mm)',
          borderTop: '1.5px solid black',
          borderLeft: '1.5px solid black',
          flexShrink: 0,
        }}>
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                borderRight: '1.5px solid black',
                borderBottom: '1.5px solid black',
                padding: '0.5mm 0.8mm 0.4mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2mm',
                minHeight: '28mm',
                height: '28mm',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', bottom: '0.2mm', left: '0.2mm', width: '2mm', height: '2mm', border: '1px solid black' }} />
              <div style={{ width: '20mm', height: '20mm', border: '1px solid #999', background: '#f0f0f0', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#bbb' }}>
                    NO PHOTO
                  </div>
                )}
                {/* Upload button (hidden in print) */}
                <label style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '5pt', padding: '0.5mm 1mm', cursor: 'pointer', display: 'none' }} className="print:hidden group-hover:display-block">
                  Edit
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void setPhoto(p.id, file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
              <div style={{ fontSize: '6pt', fontWeight: 700, textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word', width: '100%', color: 'black' }}>
                {p.name}
              </div>
              <div style={{ fontSize: '5.5pt', fontFamily: 'Courier New, monospace', lineHeight: 1, color: 'black' }}>
                #{p.jerseyNumber ?? '—'}
              </div>
            </div>
          ))}
          {emptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                borderRight: '1.5px solid black',
                borderBottom: '1.5px solid black',
                padding: '0.5mm 0.8mm 0.4mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minHeight: '28mm',
                height: '28mm',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', bottom: '0.2mm', left: '0.2mm', width: '2mm', height: '2mm', border: '1px solid black' }} />
              <div style={{ width: '20mm', height: '20mm', border: '1px dashed #aaa', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* ── ④ REMARKS + SIGNATURES ─────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', flexShrink: 0 }}>
          {/* ④A REMARKS */}
          <div style={{ border: '1px solid black', padding: '1mm', display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
            <div style={{ textAlign: 'center', fontSize: '6pt', fontWeight: 700, borderBottom: '1px solid black', paddingBottom: '0.5mm', color: 'black', letterSpacing: '0.08em' }}>
              REMARKS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, border: '1px solid #999', minHeight: '20mm' }}>
              {[
                { label: '主隊 Home', span: 1 },
                { label: '賽果 Results', span: 1 },
                { label: '客隊 Away', span: 1 },
              ].map(({ label }, i) => (
                <div key={i} style={{
                  borderRight: i < 2 ? '1px solid black' : 'none',
                  borderBottom: '1px solid black',
                  background: '#dcdcdc',
                  padding: '0.5mm 1mm',
                  fontSize: '5.5pt',
                  fontWeight: 700,
                  textAlign: 'center',
                  color: 'black',
                }}>
                  {label}
                </div>
              ))}
              {['比數 Score', '入球球員 Scorers', '黃牌 Yellow Cards', '紅牌 Red Cards'].map((label, ri) => (
                <React.Fragment key={ri}>
                  <div style={{ borderRight: '1px solid #999', borderBottom: '1px solid #999' }} />
                  <div style={{ borderRight: '1px solid #999', borderBottom: '1px solid #999', fontSize: '5pt', fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {label}
                  </div>
                  <div style={{ borderBottom: '1px solid #999' }} />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ④B SIGNATURES */}
          <div style={{ border: '1px solid black', padding: '1mm', display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
            <div style={{ textAlign: 'center', fontSize: '6pt', fontWeight: 700, borderBottom: '1px solid black', paddingBottom: '0.5mm', color: 'black', letterSpacing: '0.08em' }}>
              簽名區 (SIGNATURES)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75mm', flex: 1 }}>
              {[
                '主隊領隊 / Home Team Manager',
                '客隊領隊 / Away Team Manager',
                '球證 / Referee',
              ].map((label, i) => (
                <div key={i} style={{ border: '1px solid #bbb', padding: '0.5mm', display: 'flex', flexDirection: 'column', gap: '0.3mm' }}>
                  <div style={{ fontSize: '5.5pt', fontWeight: 700, textAlign: 'center', color: 'black' }}>{label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.3mm' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '26mm', borderBottom: '1px solid black', height: '4mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                      <div style={{ fontSize: '4.5pt', color: '#777', marginTop: '0.2mm' }}>簽名 Signature</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '18mm', borderBottom: '1px solid black', height: '4mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                      <div style={{ fontSize: '4.5pt', color: '#777', marginTop: '0.2mm' }}>日期 Date</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
