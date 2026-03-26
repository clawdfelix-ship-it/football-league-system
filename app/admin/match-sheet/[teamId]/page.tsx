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

  // Always show 30 slots (5 rows × 6 cols)
  const totalSlots = 30;
  const emptySlots = Array(Math.max(0, totalSlots - players.length)).fill(null);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white match-sheet">
      {/* ── Print button (hidden when printing) ── */}
      <div className="flex justify-center mb-4 print:hidden">
        <PrintButton />
      </div>

      {/* ══════════════════════════════════════════════
          A4 container — 210mm × 297mm
          8 columns for player grid
          ══════════════════════════════════════════════ */}
      <div
        className="mx-auto bg-white shadow-2xl"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '3mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
          overflow: 'hidden',
          breakInside: 'avoid',
        }}
      >
        {/* ── ① HEADER ───────────────────────────────── */}
        <header
          style={{
            textAlign: 'center',
            border: '2px solid black',
            padding: '1.5mm 3mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3mm',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '12pt', fontWeight: 900, letterSpacing: '0.1em', fontStyle: 'italic', lineHeight: 1.1, color: 'black' }}>
            Hong Kong Bank League 2026
          </div>
          <div style={{ fontSize: '6pt', fontWeight: 700, letterSpacing: '0.05em', color: '#555', lineHeight: 1.2 }}>
            Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026
          </div>
          <div style={{
            display: 'inline-block',
            borderTop: '1px solid black',
            borderBottom: '1px solid black',
            fontSize: '9pt',
            fontWeight: 900,
            letterSpacing: '0.16em',
            padding: '0.2mm 5mm',
            margin: '0.4mm auto 0.8mm',
            lineHeight: 1.5,
            color: 'black',
          }}>
            SQUAD LIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1mm', fontSize: '7pt', fontWeight: 700, lineHeight: 1.3 }}>
            <div style={{ textAlign: 'left' }}>
              隊名 (Team):{' '}
              <span style={{ textDecoration: 'underline dotted black', fontSize: '8pt' }}>{team.name}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              地點 (Venue): ___________________
            </div>
            <div style={{ textAlign: 'right' }}>
              日期 (Date): ___________________
            </div>
          </div>
        </header>

        {/* ── ② SECTION LABEL ───────────────────────── */}
        <div style={{
          background: '#dcdcdc',
          border: '1px solid black',
          textAlign: 'center',
          fontSize: '6pt',
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '0.8mm 2mm',
          flexShrink: 0,
          color: 'black',
        }}>
          常規球員 (REGULAR PLAYERS)
        </div>

        {/* ── ③ PLAYER GRID ─────────────────────────── */}
        {/*
          A4 width: 210mm, padding: 3mm each side = 204mm usable
          6 cols × 34mm = 204mm exactly
          Cell: 11mm photo + name + number ≈ 23mm tall per row
        */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 34mm)',
          borderTop: '1px solid black',
          borderLeft: '1px solid black',
          flexShrink: 0,
        }}>
          {/* Real players */}
          {players.map((p) => (
            <div
              key={p.id}
              className="group"
              style={{
                borderRight: '1px solid black',
                borderBottom: '1px solid black',
                padding: '0.6mm 0.5mm 0.5mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25mm',
                minHeight: '23mm',
                position: 'relative',
              }}
            >
              {/* Checkbox corner */}
              <div style={{ position: 'absolute', bottom: '0.4mm', left: '0.4mm', width: '2mm', height: '2mm', border: '1px solid black' }} />

              {/* Photo */}
              <div style={{ width: '11mm', height: '15mm', border: '0.5px solid #ccc', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5pt', color: '#ccc' }}>
                    NO PHOTO
                  </div>
                )}
                <UploadPhotoButton playerId={p.id} />
              </div>

              {/* Name */}
              <div style={{ fontSize: '5.5pt', fontWeight: 700, textAlign: 'center', lineHeight: 1.15, wordBreak: 'break-word', width: '100%', color: 'black' }}>
                {p.name}
              </div>

              {/* Jersey number */}
              <div style={{ fontSize: '5pt', fontFamily: 'Courier New, monospace', lineHeight: 1, color: 'black' }}>
                #{p.jerseyNumber}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {emptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                borderRight: '1px solid black',
                borderBottom: '1px solid black',
                padding: '0.6mm 0.5mm 0.5mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minHeight: '23mm',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', bottom: '0.4mm', left: '0.4mm', width: '2mm', height: '2mm', border: '1px solid black' }} />
              <div style={{ width: '11mm', height: '15mm', border: '1px dashed #bbb', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* ── ④ REMARKS + SIGNATURES ───────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5mm', flexShrink: 0 }}>
          {/* ── ④A REMARKS ─────────────────────────── */}
          <div style={{ border: '1px solid black', padding: '1mm', display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
            <div style={{ textAlign: 'center', fontSize: '6pt', fontWeight: 700, borderBottom: '1px solid black', paddingBottom: '0.5mm', color: 'black', letterSpacing: '0.08em' }}>
              REMARKS
            </div>
            {/* 3-col × 5-row table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, border: '1px solid #999', minHeight: '38mm' }}>
              {/* Row 1: 主隊 + 賽果 + 客隊 */}
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
              {/* Row 2–5: 比數 / 入球球員 / 黃牌 / 紅牌 */}
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

          {/* ── ④B SIGNATURES ──────────────────────── */}
          <div style={{ border: '1px solid black', padding: '1mm', display: 'flex', flexDirection: 'column', gap: '1mm' }}>
            <div style={{ textAlign: 'center', fontSize: '6pt', fontWeight: 700, borderBottom: '1px solid black', paddingBottom: '0.5mm', color: 'black', letterSpacing: '0.08em' }}>
              簽名區 (SIGNATURES)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1mm', flex: 1 }}>
              {/* Each signature row: label + 2 signature lines */}
              {[
                '主隊領隊 / Home Team Manager',
                '客隊領隊 / Away Team Manager',
                '球證 / Referee',
              ].map((label, i) => (
                <div key={i} style={{ border: '1px solid #bbb', padding: '0.75mm', display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
                  <div style={{ fontSize: '5.5pt', fontWeight: 700, textAlign: 'center', color: 'black' }}>{label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.4mm' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '26mm', borderBottom: '1px solid black', height: '4.5mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                      <div style={{ fontSize: '4.5pt', color: '#777', marginTop: '0.25mm' }}>簽名 Signature</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '18mm', borderBottom: '1px solid black', height: '4.5mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                      <div style={{ fontSize: '4.5pt', color: '#777', marginTop: '0.25mm' }}>日期 Date</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ⑤ FOOTER ────────────────────────────── */}
        <div style={{ textAlign: 'center', fontSize: '5pt', color: '#aaa', letterSpacing: '0.08em', flexShrink: 0, paddingTop: '0.5mm' }}>
          Zenex Cup official match sheet • Do not duplicate
        </div>
      </div>
    </div>
  );
}
