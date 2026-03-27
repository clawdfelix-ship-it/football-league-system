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
          A4 container — 210mm × 297mm (FIT TO 1 PAGE)
          5 columns for player grid (40mm each = 200mm wide)
          
          Layout breakdown (total: 285mm, leaves 12mm margin for printer):
          - Padding: 4mm × 2 = 8mm
          - Header: 16mm
          - Section label: 3mm
          - Gaps: 1mm × 6 = 6mm
          - Player grid: 34mm × 6 rows = 204mm
          - Remarks + Signatures: 48mm
          ══════════════════════════════════════════════ */}
      <div
        className="mx-auto bg-white shadow-2xl print:shadow-none"
        style={{
          width: '210mm',
          height: '285mm',
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
        {/* ── ① HEADER (16mm) ───────────────────────── */}
        <header
          style={{
            textAlign: 'center',
            border: '2px solid black',
            padding: '1.2mm 3mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2mm',
            flexShrink: 0,
            height: '16mm',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '12pt', fontWeight: 900, letterSpacing: '0.11em', fontStyle: 'italic', lineHeight: 1.1, color: 'black' }}>
            HONG KONG BANK LEAGUE 2026
          </div>
          <div style={{ fontSize: '5.5pt', fontWeight: 700, letterSpacing: '0.05em', color: '#555', lineHeight: 1.2 }}>
            PARTNERED WITH ZENEX SPORTS | 香港銀行足球聯賽 2026
          </div>
          <div style={{
            display: 'inline-block',
            borderTop: '1.5px solid black',
            borderBottom: '1.5px solid black',
            fontSize: '9pt',
            fontWeight: 900,
            letterSpacing: '0.18em',
            padding: '0.25mm 5mm',
            margin: '0.25mm auto 0.4mm',
            lineHeight: 1.3,
            color: 'black',
          }}>
            SQUAD LIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1mm', fontSize: '6.5pt', fontWeight: 700, lineHeight: 1.3 }}>
            <div style={{ textAlign: 'left' }}>
              隊名 (Team):{' '}
              <span style={{ textDecoration: 'underline dotted black', fontSize: '8pt', fontWeight: 800 }}>{team.name}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              地點 (Venue): ___________________
            </div>
            <div style={{ textAlign: 'right' }}>
              日期 (Date): ___________________
            </div>
          </div>
        </header>

        {/* ── ② SECTION LABEL (3mm) ─────────────────── */}
        <div style={{
          background: '#dcdcdc',
          border: '1px solid black',
          textAlign: 'center',
          fontSize: '5.5pt',
          fontWeight: 800,
          letterSpacing: '0.11em',
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
          gridTemplateRows: 'repeat(6, 34mm)',
          borderTop: '1.5px solid black',
          borderLeft: '1.5px solid black',
          flexShrink: 0,
          height: '204mm',
        }}>
          {/* Real players */}
          {players.map((p) => (
            <div
              key={p.id}
              className="group"
              style={{
                borderRight: '1.5px solid black',
                borderBottom: '1.5px solid black',
                padding: '0.5mm 0.9mm 0.4mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25mm',
                height: '34mm',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              {/* Checkbox corner */}
              <div style={{ position: 'absolute', bottom: '0.25mm', left: '0.25mm', width: '2.3mm', height: '2.3mm', border: '1px solid black' }} />

              {/* Photo */}
              <div style={{ width: '23mm', height: '23mm', border: '1px solid #666', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#999', fontWeight: 600 }}>
                    NO PHOTO
                  </div>
                )}
                <UploadPhotoButton playerId={p.id} />
              </div>

              {/* Name */}
              <div style={{ fontSize: '6.5pt', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word', width: '100%', color: 'black' }}>
                {p.name}
              </div>

              {/* Jersey number */}
              <div style={{ fontSize: '6pt', fontFamily: 'Courier New, monospace', fontWeight: 700, lineHeight: 1, color: 'black' }}>
                #{p.jerseyNumber}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {emptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                borderRight: '1.5px solid black',
                borderBottom: '1.5px solid black',
                padding: '0.5mm 0.9mm 0.4mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                height: '34mm',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ position: 'absolute', bottom: '0.25mm', left: '0.25mm', width: '2.3mm', height: '2.3mm', border: '1px solid black' }} />
              <div style={{ width: '23mm', height: '23mm', border: '1.5px dashed #888', flexShrink: 0, background: '#fafafa' }} />
            </div>
          ))}
        </div>

        {/* ── ④ REMARKS + SIGNATURES (48mm) ────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', flexShrink: 0, height: '48mm' }}>
          {/* ── ④A REMARKS ─────────────────────────── */}
          <div style={{ border: '1px solid black', padding: '0.7mm', display: 'flex', flexDirection: 'column', gap: '0.4mm', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', fontSize: '6.5pt', fontWeight: 800, borderBottom: '1px solid black', paddingBottom: '0.4mm', color: 'black', letterSpacing: '0.09em' }}>
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
                  padding: '0.4mm 0.7mm',
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
            <div style={{ textAlign: 'center', fontSize: '6.5pt', fontWeight: 800, borderBottom: '1px solid black', paddingBottom: '0.4mm', color: 'black', letterSpacing: '0.09em' }}>
              簽名區 (SIGNATURES)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5mm', flex: 1 }}>
              {[
                '主隊領隊 / Home Manager',
                '客隊領隊 / Away Manager',
                '球證 / Referee',
              ].map((label, i) => (
                <div key={i} style={{ border: '1px solid #aaa', padding: '0.35mm', display: 'flex', flexDirection: 'column', gap: '0.15mm' }}>
                  <div style={{ fontSize: '5.5pt', fontWeight: 700, textAlign: 'center', color: 'black' }}>{label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '27mm', borderBottom: '1px solid black', height: '3.5mm' }} />
                      <div style={{ fontSize: '4pt', color: '#666', marginTop: '0.1mm' }}>簽名</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '15mm', borderBottom: '1px solid black', height: '3.5mm' }} />
                      <div style={{ fontSize: '4pt', color: '#666', marginTop: '0.1mm' }}>日期</div>
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
