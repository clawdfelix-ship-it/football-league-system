import React from 'react';
import { notFound } from 'next/navigation';
import { getTeamPlayers } from '@/lib/actions';
import { TEAMS } from '@/lib/constants';
import { PrintButton } from './PrintButton';
import { UploadPhotoButton } from './PlayerManager';
import type { Player } from '@/lib/schema';

export default async function MatchSheet({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const teamIndex = parseInt(teamId);
  const team = TEAMS[teamIndex];

  if (!team) return notFound();

  const players: Player[] = await getTeamPlayers(team.name);

  // Always show 30 slots (5 cols × 6 rows = 30)
  const totalSlots = 30;
  const emptySlots = Array(Math.max(0, totalSlots - players.length)).fill(null);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white match-sheet">
      {/* ── Print button (hidden when printing) ── */}
      <div className="flex justify-center mb-4 print:hidden">
        <PrintButton />
      </div>

      {/* ══════════════════════════════════════════════
          A4 container — 210mm × 297mm (FULL SIZE)
          Inner content: 200mm wide (fits within print margins)
          ══════════════════════════════════════════════ */}
      <div
        className="mx-auto bg-white shadow-2xl print:shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          padding: '5mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '1mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {/* Inner container - 200mm wide for perfect print alignment */}
        <div style={{
          width: '200mm',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1mm',
        }}>
        {/* ── ① HEADER (20mm) ───────────────────────── */}
        <header
          style={{
            textAlign: 'center',
            border: '2px solid black',
            padding: '1.5mm 3mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3mm',
            flexShrink: 0,
            height: '20mm',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '12pt', fontWeight: 900, letterSpacing: '0.1em', fontStyle: 'italic', lineHeight: 1.1, color: 'black' }}>
            HONG KONG BANK LEAGUE 2026
          </div>
          <div style={{ fontSize: '5.5pt', fontWeight: 700, letterSpacing: '0.04em', color: '#555', lineHeight: 1.1 }}>
            PARTNERED WITH ZENEX SPORTS | 香港銀行足球聯賽 2026
          </div>
          <div style={{
            display: 'inline-block',
            borderTop: '1px solid black',
            borderBottom: '1px solid black',
            fontSize: '9pt',
            fontWeight: 900,
            letterSpacing: '0.16em',
            padding: '0.3mm 6mm',
            margin: '0.3mm auto 0.4mm',
            lineHeight: 1.2,
            color: 'black',
          }}>
            SQUAD LIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.2mm', fontSize: '6.5pt', fontWeight: 700, lineHeight: 1.2 }}>
            <div style={{ textAlign: 'left' }}>
              隊名 (Team):{' '}
              <span style={{ textDecoration: 'underline dotted black', fontSize: '8pt', fontWeight: 800 }}>{team.name}</span>
              <span style={{ fontSize: '5.5pt', fontWeight: 700, color: '#555', marginLeft: '1mm' }}>（主 Home / 客 Away）</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              地點：__________
            </div>
            <div style={{ textAlign: 'right' }}>
              日期：__________
            </div>
          </div>
        </header>

        {/* ── ② SECTION LABEL (3mm) ─────────────────── */}
        <div style={{
          background: '#dcdcdc',
          border: '1px solid black',
          textAlign: 'center',
          fontSize: '6pt',
          fontWeight: 800,
          letterSpacing: '0.1em',
          padding: '0.5mm 2mm',
          flexShrink: 0,
          color: 'black',
          height: '3mm',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          常規球員 (REGULAR PLAYERS)
        </div>

        {/* ── ③ PLAYER GRID (204mm = 34mm × 6 rows) ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 40mm)',
          borderTop: '2px solid black',
          borderLeft: '2px solid black',
          borderRight: '2px solid black',
          flexShrink: 0,
        }}>
          {/* Real players */}
          {players.map((p) => (
            <div
              key={p.id}
              className="group"
              style={{
                borderRight: '2px solid black',
                borderBottom: '2px solid black',
                padding: '0.3mm 0.6mm 0.2mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.1mm',
                height: '34mm',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              {/* Checkbox corner */}
              <div style={{ position: 'absolute', bottom: '0.1mm', left: '0.1mm', width: '1.5mm', height: '1.5mm', border: '1px solid black' }} />

              {/* Photo - bigger */}
              <div style={{ width: '24mm', height: '24mm', border: '1px solid #666', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4pt', color: '#999', fontWeight: 600 }}>
                    NO PHOTO
                  </div>
                )}
                <UploadPhotoButton playerId={p.id} />
              </div>

              {/* Name - same as before */}
              <div style={{ fontSize: '6pt', fontWeight: 800, textAlign: 'center', lineHeight: 1.05, wordBreak: 'break-word', width: '100%', color: 'black' }}>
                {p.name}
              </div>

              {/* Jersey number - bigger */}
              <div style={{ fontSize: '6.5pt', fontFamily: 'Courier New, monospace', fontWeight: 700, lineHeight: 1, color: 'black' }}>
                #{p.jerseyNumber}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {emptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                borderRight: '2px solid black',
                borderBottom: '2px solid black',
                padding: '0.3mm 0.6mm 0.2mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                height: '34mm',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ position: 'absolute', bottom: '0.1mm', left: '0.1mm', width: '1.5mm', height: '1.5mm', border: '1px solid black' }} />
              <div style={{ width: '24mm', height: '24mm', border: '1.5px dashed #888', flexShrink: 0, background: '#fafafa' }} />
            </div>
          ))}
        </div>

        {/* ── ④ REMARKS + SIGNATURES (51mm) ────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', flexShrink: 0, height: '51mm' }}>
          {/* ── ④A REMARKS ─────────────────────────── */}
          <div style={{ border: '1px solid black', padding: '0.7mm', display: 'flex', flexDirection: 'column', gap: '0.3mm', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', fontSize: '6.5pt', fontWeight: 800, borderBottom: '1px solid black', paddingBottom: '0.3mm', color: 'black', letterSpacing: '0.08em' }}>
              REMARKS
            </div>
            {/* 3-col × 5-row table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'repeat(5, 1fr)', flex: 1, border: '1px solid #666' }}>
              {/* Row 1: 主隊 + 賽果 + 客隊 */}
              {[
                { label: '主隊 Home' },
                { label: '賽果 Results' },
                { label: '客隊 Away' },
              ].map(({ label }, i) => (
                <div key={i} style={{
                  borderRight: i < 2 ? '1px solid black' : 'none',
                  borderBottom: '1px solid black',
                  background: '#dcdcdc',
                  padding: '0.3mm 0.5mm',
                  fontSize: '5.5pt',
                  fontWeight: 700,
                  textAlign: 'center',
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {label}
                </div>
              ))}
              {/* Row 2–5: 比數 / 入球球員 / 黃牌 / 紅牌 */}
              {['比數 Score', '入球球員 Scorers', '黃牌 Yellow Cards', '紅牌 Red Cards'].map((label, ri) => (
                <React.Fragment key={ri}>
                  <div style={{ borderRight: '1px solid #666', borderBottom: '1px solid #666', background: '#fafafa' }} />
                  <div style={{ borderRight: '1px solid #666', borderBottom: '1px solid #666', fontSize: '5pt', fontWeight: 700, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {label}
                  </div>
                  <div style={{ borderBottom: '1px solid #666', background: '#fafafa' }} />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── ④B SIGNATURES ──────────────────────── */}
          <div style={{ border: '1px solid black', padding: '0.7mm', display: 'flex', flexDirection: 'column', gap: '0.5mm', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', fontSize: '6.5pt', fontWeight: 800, borderBottom: '1px solid black', paddingBottom: '0.3mm', color: 'black', letterSpacing: '0.08em' }}>
              簽名區 (SIGNATURES)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1mm', flex: 1 }}>
              {[
                '主隊領隊 / Home Manager',
                '客隊領隊 / Away Manager',
                '球證 / Referee',
              ].map((label, i) => (
                <div key={i} style={{ border: '1px solid #aaa', padding: '0.5mm', display: 'flex', flexDirection: 'column', gap: '0.2mm', flex: 1 }}>
                  <div style={{ fontSize: '6pt', fontWeight: 700, textAlign: 'center', color: 'black' }}>{label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '28mm', borderBottom: '1px solid black', height: '4mm' }} />
                      <div style={{ fontSize: '4.5pt', color: '#666', marginTop: '0.1mm' }}>簽名</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '16mm', borderBottom: '1px solid black', height: '4mm' }} />
                      <div style={{ fontSize: '4.5pt', color: '#666', marginTop: '0.1mm' }}>日期</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
