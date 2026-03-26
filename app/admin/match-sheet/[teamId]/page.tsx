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

  // Position order for display
  const positionOrder = ['GK', 'DF', 'MF', 'FW'];
  const positionLabels: Record<string, string> = {
    GK: '門將 (GK)',
    DF: '後衞 (DF)',
    MF: '中場 (MF)',
    FW: '前鋒 (FW)',
  };

  // Group players by position
  const grouped = positionOrder.reduce<Record<string, Player[]>>((acc, pos) => {
    acc[pos] = players.filter(p => p.position === pos);
    return acc;
  }, {});

  // Total grid: 5 rows × 4 cols = 20 slots, 2 per player row = 10 players max for table
  // Actually use 2 rows per player (photo + line), so 5 rows = 10 players in table
  // But we need 18+ for a proper squad. Let's do 3 columns × 12 rows = 36 players
  // Table format: Position | Number | Name | Photo | Signature — 2 rows per player entry

  const maxRows = 18; // 18 rows for a full squad

  return (
    <div className="min-h-screen bg-gray-100 text-black flex flex-col items-center p-4 print:p-0 print:bg-white">
      {/* 操作欄 — 列印時隱藏 */}
      <div className="print:hidden mb-4">
        <PrintButton />
      </div>

      {/* A4 Match Sheet */}
      <div
        className="w-[210mm] min-h-[297mm] bg-white border-2 border-black flex flex-col"
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >

        {/* ── HEADER ── */}
        <header className="border-b-4 border-black px-6 pt-6 pb-4">
          {/* Title block */}
          <div className="text-center mb-3">
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-0.5">
              Partnered with ZENEX SPORTS
            </div>
            <h1 className="text-2xl font-black tracking-widest uppercase italic leading-none">
              Hong Kong Bank League 2026
            </h1>
            <div className="text-[10px] text-gray-500 tracking-wider">
              香港銀行足球聯賽2026
            </div>
          </div>

          {/* Squad list title */}
          <div className="border-t-2 border-b border-black mx-auto mt-2 mb-3">
            <h2 className="text-base font-black tracking-widest text-center py-1.5 uppercase">
              Squad List / 出賽名單
            </h2>
          </div>

          {/* Team / Venue / Date row */}
          <div className="grid grid-cols-3 gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">球隊 (Team):</span>
              <span className="flex-1 border-b-2 border-black px-1 font-black text-sm tracking-wider">
                {team.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">地點 (Venue):</span>
              <span className="flex-1 border-b-2 border-dotted border-gray-400 px-1"></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">日期 (Date):</span>
              <span className="flex-1 border-b-2 border-dotted border-gray-400 px-1"></span>
            </div>
          </div>
        </header>

        {/* ── PLAYER TABLE ── */}
        <section className="flex-1 px-6 py-3">

          {/* Table column headers */}
          <div className="grid grid-cols-[40px_56px_1fr_90px_90px_90px] border-2 border-black text-[9px] font-black uppercase text-center bg-black text-white">
            <div className="py-1.5 border-r border-gray-700 flex items-center justify-center">
              位置<br/><span className="font-normal text-gray-300">Pos</span>
            </div>
            <div className="py-1.5 border-r border-gray-700 flex items-center justify-center">
              號碼<br/><span className="font-normal text-gray-300">No.</span>
            </div>
            <div className="py-1.5 border-r border-gray-700 flex items-center justify-center">
              球員姓名 (Player Name)
            </div>
            <div className="py-1.5 border-r border-gray-700 flex items-center justify-center">
              證件首3位<br/><span className="font-normal text-gray-300">ID Prefix</span>
            </div>
            <div className="py-1.5 border-r border-gray-700 flex items-center justify-center">
              球員照片<br/><span className="font-normal text-gray-300">Photo</span>
            </div>
            <div className="py-1.5 flex items-center justify-center">
              球員簽名<br/><span className="font-normal text-gray-300">Signature</span>
            </div>
          </div>

          {/* Player rows — grouped by position */}
          {positionOrder.map(pos => {
            const posPlayers = grouped[pos];
            if (!posPlayers || posPlayers.length === 0) return null;
            return (
              <div key={pos}>
                {/* Position group label */}
                <div className="bg-gray-100 border-l-2 border-r-2 border-black text-[9px] font-bold text-gray-600 px-2 py-0.5 uppercase tracking-wider">
                  {positionLabels[pos]}
                </div>
                {posPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="group grid grid-cols-[40px_56px_1fr_90px_90px_90px] border-l-2 border-r-2 border-black border-t-0 text-xs hover:bg-blue-50 transition-colors"
                  >
                    {/* Position */}
                    <div className="flex items-center justify-center font-bold border-r border-gray-200 py-2 text-[10px]">
                      {pos}
                    </div>
                    {/* Jersey number */}
                    <div className="flex items-center justify-center font-black border-r border-gray-200 py-2 text-sm">
                      #{p.jerseyNumber ?? '?'}
                    </div>
                    {/* Name */}
                    <div className="flex items-center border-r border-gray-200 py-2 px-2">
                      <span className="font-semibold text-[11px] leading-tight">{p.name}</span>
                    </div>
                    {/* ID prefix */}
                    <div className="flex items-center justify-center border-r border-gray-200 py-2">
                      <span className="font-mono text-[10px] border border-gray-300 px-2 py-0.5 rounded-sm">
                        {p.identityPrefix ?? '—'}
                      </span>
                    </div>
                    {/* Photo */}
                    <div className="flex items-center justify-center border-r border-gray-200 py-1 relative">
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="h-9 w-7 object-cover border border-gray-300 rounded-sm"
                        />
                      ) : (
                        <div className="h-9 w-7 border border-dashed border-gray-300 rounded-sm flex items-center justify-center text-[8px] text-gray-300">
                          N/A
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 print:hidden">
                        <UploadPhotoButton playerId={p.id} iconOnly />
                      </div>
                    </div>
                    {/* Signature line */}
                    <div className="flex items-end justify-center pb-1">
                      <div className="w-full border-b border-gray-400 mx-1 h-7"></div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Empty rows for hand-written additions */}
          {Array.from({ length: Math.max(0, 22 - players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="grid grid-cols-[40px_56px_1fr_90px_90px_90px] border-l-2 border-r-2 border-black border-t-0 text-xs"
            >
              <div className="flex items-center justify-center border-r border-gray-200 py-2 text-gray-300 text-[10px]">—</div>
              <div className="flex items-center justify-center border-r border-gray-200 py-2 text-gray-300 text-[10px]">#</div>
              <div className="border-r border-gray-200 py-2"></div>
              <div className="flex items-center justify-center border-r border-gray-200 py-2 text-gray-300 text-[10px]">—</div>
              <div className="flex items-center justify-center border-r border-gray-200 py-1">
                <div className="h-9 w-7 border border-dashed border-gray-200 rounded-sm"></div>
              </div>
              <div className="flex items-end justify-center pb-1">
                <div className="w-full border-b border-gray-200 mx-1 h-7"></div>
              </div>
            </div>
          ))}

          {/* Bottom border of table */}
          <div className="h-0.5 bg-black border-2 border-t-0 border-black -mx-px"></div>
        </section>

        {/* ── FOOTER: REMARKS + MATCH EVENTS ── */}
        <footer className="px-6 pb-4 mt-1">

          {/* Bottom grid: Remarks + Match Events */}
          <div className="grid grid-cols-2 gap-4 border-2 border-black">

            {/* REMARKS */}
            <div className="border-r border-black flex flex-col">
              <div className="bg-black text-white text-center text-[10px] font-black uppercase tracking-wider py-1.5 px-2">
                備註 (Remarks)
              </div>
              <div className="flex-1 p-2">
                <div className="border border-gray-300 h-24 p-2 text-[9px] italic leading-relaxed space-y-1">
                  <div>換人情況 (Substitutions):</div>
                  <div className="mt-2"></div>
                </div>
              </div>
              <div className="flex justify-between px-3 py-2 border-t-2 border-black text-[9px] font-bold">
                <div className="text-center">
                  <div className="border-t-2 border-black pt-1 px-4">領隊簽署 (Manager)</div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-black pt-1 px-4">球證簽署 (Referee)</div>
                </div>
              </div>
            </div>

            {/* MATCH EVENTS */}
            <div className="flex flex-col">
              <div className="bg-black text-white text-center text-[10px] font-black uppercase tracking-wider py-1.5 px-2">
                賽事統計 (Match Statistics)
              </div>
              <div className="flex-1 p-2">
                <div className="grid grid-rows-2 gap-2 h-full">
                  <div className="border border-gray-300 p-1.5 text-[9px] flex flex-col">
                    <span className="font-bold uppercase mb-1">入球球員 (Scorers)</span>
                    <div className="flex-1"></div>
                  </div>
                  <div className="border border-gray-300 p-1.5 text-[9px] flex flex-col">
                    <span className="font-bold uppercase mb-1">紅黃牌 (Cards)</span>
                    <div className="flex-1"></div>
                  </div>
                </div>
              </div>
              {/* Score boxes */}
              <div className="grid grid-cols-2 border-t-2 border-black text-[10px] font-bold">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-black">
                  <span>主隊 (Home):</span>
                  <div className="flex-1 border-b-2 border-black text-center"></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span>客隊 (Away):</span>
                  <div className="flex-1 border-b-2 border-black text-center"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div className="text-center text-[8px] mt-2 text-gray-400 uppercase tracking-widest">
            Zenex Cup Official Match Sheet — Do Not Duplicate
          </div>
        </footer>
      </div>
    </div>
  );
}
