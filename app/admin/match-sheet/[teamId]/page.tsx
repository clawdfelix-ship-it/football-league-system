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

  // Always show 40 slots (5 rows × 8 cols)
  const totalSlots = 40;
  const emptySlots = Array(Math.max(0, totalSlots - players.length)).fill(null);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white">
      {/* ── Print button (hidden when printing) ── */}
      <div className="flex justify-center mb-4 print:hidden">
        <PrintButton />
      </div>

      {/* ══════════════════════════════════════════════
          A4 container — 210mm × 297mm
          CSS Grid: 8 equal columns
          ══════════════════════════════════════════════ */}
      <div
        className="mx-auto bg-white shadow-2xl"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '6mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '3mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {/* ── ① HEADER ───────────────────────────────── */}
        <header
          style={{
            textAlign: 'center',
            border: '2px solid black',
            padding: '3mm 4mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '1mm',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '15pt', fontWeight: 900, letterSpacing: '0.15em', fontStyle: 'italic', lineHeight: 1.1, color: 'black' }}>
            Hong Kong Bank League 2026
          </div>
          <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.08em', color: '#555', lineHeight: 1.3 }}>
            Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026
          </div>
          <div style={{
            display: 'inline-block',
            borderTop: '1.5px solid black',
            borderBottom: '1.5px solid black',
            fontSize: '11pt',
            fontWeight: 900,
            letterSpacing: '0.2em',
            padding: '0.5mm 6mm',
            margin: '1mm auto 2mm',
            lineHeight: 1.8,
            color: 'black',
          }}>
            SQUAD LIST
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm', fontSize: '7.5pt', fontWeight: 700, lineHeight: 1.4 }}>
            <div style={{ textAlign: 'left' }}>
              隊名 (Team):{' '}
              <span style={{ textDecoration: 'underline dotted black', fontSize: '9.5pt' }}>{team.name}</span>
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
          fontSize: '6.5pt',
          fontWeight: 700,
          letterSpacing: '0.12em',
          padding: '1mm 2mm',
          flexShrink: 0,
          color: 'black',
        }}>
          常規球員 (REGULAR PLAYERS)
        </div>

        {/* ── ③ PLAYER GRID ─────────────────────────── */}
        {/*
          A4 usable width ≈ 198mm → 8 cols = 24.75mm each
          Cell: 18mm photo + name + number ≈ 33mm tall per row
          5 rows × 33mm = 165mm total
        */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
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
                padding: '1.5mm 1mm 1mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5mm',
                minHeight: '33mm',
                position: 'relative',
              }}
            >
              {/* Checkbox corner */}
              <div style={{ position: 'absolute', bottom: '1mm', left: '1mm', width: '3mm', height: '3mm', border: '1px solid black' }} />

              {/* Photo */}
              <div style={{ width: '18mm', height: '22mm', border: '0.5px solid #ccc', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#ccc' }}>
                    NO PHOTO
                  </div>
                )}
                <UploadPhotoButton playerId={p.id} />
              </div>

              {/* Name */}
              <div style={{ fontSize: '6.5pt', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word', width: '100%', color: 'black' }}>
                {p.name}
              </div>

              {/* Jersey number */}
              <div style={{ fontSize: '6pt', fontFamily: 'Courier New, monospace', lineHeight: 1, color: 'black' }}>
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
                padding: '1.5mm 1mm 1mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minHeight: '33mm',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', bottom: '1mm', left: '1mm', width: '3mm', height: '3mm', border: '1px solid black' }} />
              <div style={{ width: '18mm', height: '22mm', border: '1px dashed #bbb', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* ── ④ REMARKS + SIGNATURES ───────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3mm', flexShrink: 0 }}>
          {/* ── ④A REMARKS ─────────────────────────── */}
          <div style={{ border: '1px solid black', padding: '2mm', display: 'flex', flexDirection: 'column', gap: '1mm' }}>
            <div style={{ textAlign: 'center', fontSize: '7pt', fontWeight: 700, borderBottom: '1px solid black', paddingBottom: '1mm', color: 'black', letterSpacing: '0.1em' }}>
              REMARKS
            </div>
            {/* 3-col × 5-row table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, border: '1px solid #999', minHeight: '52mm' }}>
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
                  padding: '1mm 1.5mm',
                  fontSize: '6.5pt',
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
                  <div style={{ borderRight: '1px solid #999', borderBottom: '1px solid #999', fontSize: '6pt', fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', paddingLeft: '1mm' }}>
                    {label}
                  </div>
                  <div style={{ borderRight: '1px solid #999', borderBottom: '1px solid #999' }} />
                  <div style={{ borderBottom: '1px solid #999' }} />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── ④B SIGNATURES ──────────────────────── */}
          <div style={{ border: '1px solid black', padding: '2mm', display: 'flex', flexDirection: 'column', gap: '2mm' }}>
            <div style={{ textAlign: 'center', fontSize: '7pt', fontWeight: 700, borderBottom: '1px solid black', paddingBottom: '1mm', color: 'black', letterSpacing: '0.1em' }}>
              簽名區 (SIGNATURES)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm', flex: 1 }}>
              {/* Each signature row: label + 2 signature lines */}
              {[
                '主隊領隊 / Home Team Manager',
                '客隊領隊 / Away Team Manager',
                '球證 / Referee',
              ].map((label, i) => (
                <div key={i} style={{ border: '1px solid #bbb', padding: '1.5mm', display: 'flex', flexDirection: 'column', gap: '1mm' }}>
                  <div style={{ fontSize: '6.5pt', fontWeight: 700, textAlign: 'center', color: 'black' }}>{label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1mm' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '32mm', borderBottom: '1px solid black', height: '6mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                      <div style={{ fontSize: '5.5pt', color: '#777', marginTop: '0.5mm' }}>簽名 Signature</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '24mm', borderBottom: '1px solid black', height: '6mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                      <div style={{ fontSize: '5.5pt', color: '#777', marginTop: '0.5mm' }}>日期 Date</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ⑤ FOOTER ────────────────────────────── */}
        <div style={{ textAlign: 'center', fontSize: '5.5pt', color: '#aaa', letterSpacing: '0.08em', flexShrink: 0, paddingTop: '1mm' }}>
          Zenex Cup official match sheet • Do not duplicate
        </div>
      </div>
    </div>
  );
}
