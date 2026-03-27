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
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white print:h-screen match-sheet">
      {/* ── Print button (hidden when printing) ── */}
      <div className="flex justify-center mb-4 print:hidden">
        <PrintButton />
      </div>

      {/* ══════════════════════════════════════════════
          A4 container — 210mm × 275mm (SAFE FIT)
          5 columns for player grid (40mm each = 200mm wide)
          
          Layout breakdown (total: 275mm, leaves 22mm margin):
          - Padding: 4mm × 2 = 8mm
          - Header: 13mm
          - Section label: 3mm
          - Gaps: 1mm × 6 = 6mm
          - Player grid: 33mm × 6 rows = 198mm
          - Remarks + Signatures: 47mm
          ══════════════════════════════════════════════ */}
      <div
        className="mx-auto bg-white shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm]"
        style={{
          width: '210mm',
          height: '275mm',
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
        {/* ── ① HEADER (13mm) ───────────────────────── */}
        <header
          style={{
            textAlign: 'center',
            border: '2px solid black',
            padding: '0.6mm 3mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.1mm',
            flexShrink: 0,
            height: '13mm',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '9.5pt', fontWeight: 900, letterSpacing: '0.08em', fontStyle: 'italic', lineHeight: 1.0, color: 'black' }}>
            HONG KONG BANK LEAGUE 2026
          </div>
          <div style={{ fontSize: '4pt', fontWeight: 700, letterSpacing: '0.03em', color: '#555', lineHeight: 1.0 }}>
            PARTNERED WITH ZENEX SPORTS | 香港銀行足球聯賽 2026
          </div>
          <div style={{
            display: 'inline-block',
            borderTop: '1px solid black',
            borderBottom: '1px solid black',
            fontSize: '7.5pt',
            fontWeight: 900,
            letterSpacing: '0.14em',
            padding: '0.1mm 3mm',
            margin: '0.1mm auto 0.15mm',
            lineHeight: 1.1,
            color: 'black',
          }}>
            SQUAD LIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6mm', fontSize: '5pt', fontWeight: 700, lineHeight: 1.1 }}>
            <div style={{ textAlign: 'left' }}>
              隊名 (Team):{' '}
              <span style={{ textDecoration: 'underline dotted black', fontSize: '6.5pt', fontWeight: 800 }}>{team.name}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              地點：_______
            </div>
            <div style={{ textAlign: 'right' }}>
              日期：_______
            </div>
          </div>
        </header>

        {/* ── ② SECTION LABEL (3mm) ─────────────────── */}
        <div style={{
          background: '#dcdcdc',
          border: '1px solid black',
          textAlign: 'center',
          fontSize: '4.5pt',
          fontWeight: 800,
          letterSpacing: '0.08em',
          padding: '0.3mm 2mm',
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

        {/* ── ③ PLAYER GRID (198mm = 33mm × 6 rows) ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 40mm)',
          gridTemplateRows: 'repeat(6, 33mm)',
          borderTop: '1.5px solid black',
          borderLeft: '1.5px solid black',
          flexShrink: 0,
          height: '198mm',
        }}>
          {/* Real players */}
          {players.map((p) => (
            <div
              key={p.id}
              className="group"
              style={{
                borderRight: '1.5px solid black',
                borderBottom: '1.5px solid black',
                padding: '0.3mm 0.7mm 0.2mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.15mm',
                height: '33mm',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              {/* Checkbox corner */}
              <div style={{ position: 'absolute', bottom: '0.15mm', left: '0.15mm', width: '1.8mm', height: '1.8mm', border: '1px solid black' }} />

              {/* Photo */}
              <div style={{ width: '21mm', height: '21mm', border: '1px solid #666', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
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

              {/* Name */}
              <div style={{ fontSize: '5.5pt', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word', width: '100%', color: 'black' }}>
                {p.name}
              </div>

              {/* Jersey number */}
              <div style={{ fontSize: '5pt', fontFamily: 'Courier New, monospace', fontWeight: 700, lineHeight: 1, color: 'black' }}>
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
                padding: '0.3mm 0.7mm 0.2mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                height: '33mm',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ position: 'absolute', bottom: '0.15mm', left: '0.15mm', width: '1.8mm', height: '1.8mm', border: '1px solid black' }} />
              <div style={{ width: '21mm', height: '21mm', border: '1.5px dashed #888', flexShrink: 0, background: '#fafafa' }} />
            </div>
          ))}
        </div>

        {/* ── ④ REMARKS + SIGNATURES (47mm) ────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', flexShrink: 0, height: '47mm' }}>
          {/* ── ④A REMARKS ─────────────────────────── */}
          <div style={{ border: '1px solid black', padding: '0.5mm', display: 'flex', flexDirection: 'column', gap: '0.25mm', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', fontSize: '5.5pt', fontWeight: 800, borderBottom: '1px solid black', paddingBottom: '0.25mm', color: 'black', letterSpacing: '0.07em' }}>
              REMARKS
            </div>
            {/* 3-col × 5-row table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'repeat(5, 1fr)', flex: 1, border: '1px solid #666' }}>
              {/* Row 1: 主隊 + 賽果 + 客隊 */}
              {[
                { label: '主隊' },
                { label: '賽果' },
                { label: '客隊' },
              ].map(({ label }, i) => (
                <div key={i} style={{
                  borderRight: i < 2 ? '1px solid black' : 'none',
                  borderBottom: '1px solid black',
                  background: '#dcdcdc',
                  padding: '0.25mm 0.4mm',
                  fontSize: '4.5pt',
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
              {['比數', '入球', '黃牌', '紅牌'].map((label, ri) => (
                <React.Fragment key={ri}>
                  <div style={{ borderRight: '1px solid #666', borderBottom: '1px solid #666', background: '#fafafa' }} />
                  <div style={{ borderRight: '1px solid #666', borderBottom: '1px solid #666', fontSize: '4pt', fontWeight: 700, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {label}
                  </div>
                  <div style={{ borderBottom: '1px solid #666', background: '#fafafa' }} />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── ④B SIGNATURES ──────────────────────── */}
          <div style={{ border: '1px solid black', padding: '0.5mm', display: 'flex', flexDirection: 'column', gap: '0.35mm', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', fontSize: '5.5pt', fontWeight: 800, borderBottom: '1px solid black', paddingBottom: '0.25mm', color: 'black', letterSpacing: '0.07em' }}>
              簽名區
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35mm', flex: 1 }}>
              {[
                '主隊領隊',
                '客隊領隊',
                '球證',
              ].map((label, i) => (
                <div key={i} style={{ border: '1px solid #aaa', padding: '0.25mm', display: 'flex', flexDirection: 'column', gap: '0.05mm' }}>
                  <div style={{ fontSize: '4.5pt', fontWeight: 700, textAlign: 'center', color: 'black' }}>{label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '25mm', borderBottom: '1px solid black', height: '2.5mm' }} />
                      <div style={{ fontSize: '3pt', color: '#666', marginTop: '0.05mm' }}>簽名</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '13mm', borderBottom: '1px solid black', height: '2.5mm' }} />
                      <div style={{ fontSize: '3pt', color: '#666', marginTop: '0.05mm' }}>日期</div>
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
