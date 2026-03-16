import { notFound } from 'next/navigation';
import { getTeamPlayers } from '@/lib/actions';
import { TEAMS } from '@/lib/constants';
import { PrintButton } from './PrintButton';
import { UploadPhotoButton } from './PlayerManager';
import type { Player } from '@/lib/schema';

export default async function MatchSheet({ params }: { params: Promise<{ teamId: string }> }) {
  // Await params in Next.js 15+ if needed, but safe to await in 13+ too if it's a promise
  const { teamId } = await params;
  
  // Use index from URL to find team in constant
  const teamIndex = parseInt(teamId);
  const team = TEAMS[teamIndex];

  if (!team) return notFound();

  // Fetch players using the team name from the constant
  const players: Player[] = await getTeamPlayers(team.name);

  // 補足 40 個格子（5行 x 8欄）
  const totalGridSlots = 40;
  const emptySlots = Array(Math.max(0, totalGridSlots - players.length)).fill(null);

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      {/* 操作欄 - 列印時隱藏 */}
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <PrintButton />
      </div>

      {/* A4 出場表容器 */}
      <div className="w-[210mm] min-h-[297mm] mx-auto border-2 border-black p-6 flex flex-col bg-white">
        
        {/* Header */}
        <header className="text-center border-b-4 border-black pb-4 mb-4">
          <h1 className="text-2xl font-black tracking-widest italic">Hong Kong Bank League 2026</h1>
          <h2 className="text-sm font-bold tracking-wider text-gray-600 mb-1">Partnered with ZENEX SPORTS | 香港銀行足球聯賽2026</h2>
          <h3 className="text-lg font-bold tracking-wider text-black border-t-2 border-black pt-1 mt-1 inline-block px-4">OFFICIAL MATCH SHEET</h3>
          <div className="grid grid-cols-3 mt-4 text-left font-bold text-sm">
            <div>隊名 (Team): <span className="underline decoration-dotted text-lg">{team.name}</span></div>
            <div>地點 (Venue): ________________</div>
            <div>日期 (Date): ________________</div>
          </div>
        </header>

        {/* 球員名單網格 (8欄式) */}
        <section className="flex-grow">
          <h2 className="bg-slate-200 text-center font-bold border-y border-black py-1 text-xs mb-2 italic print:bg-gray-200 print:text-black">常規球員 (REGULAR PLAYERS)</h2>
          <div className="grid grid-cols-8 border-t border-l border-black">
            {/* 渲染現有球員 */}
            {players.map((p) => (
              <div key={p.id} className="group relative border-r border-b border-black p-1 text-center h-[115px] grid grid-rows-[minmax(44px,80px)_auto_auto] justify-items-center gap-1">
                <div className="absolute bottom-1 left-1 w-3 h-3 border border-black"></div>
                <div className="w-16 h-full max-h-20 border border-gray-200 bg-gray-50 overflow-hidden relative print:bg-white print:border-gray-400 group/photo">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">NO PHOTO</div>
                  )}
                  {/* 只保留照片上傳按鈕，移除刪除按鈕 */}
                  <UploadPhotoButton playerId={p.id} />
                </div>
                <div className="text-[9px] font-bold leading-tight whitespace-normal break-words w-full px-0.5">{p.name}</div>
                <div className="text-[9px] font-mono leading-none">#{p.jerseyNumber}</div>
                {/* 移除刪除按鈕，因為用戶要求這裡只顯示，不進行管理 */}
                {/* <DeletePlayerButton playerId={p.id} /> */}
              </div>
            ))}
            {/* 渲染空白手寫格 */}
            {emptySlots.map((_, i) => (
              <div key={`empty-${i}`} className="relative border-r border-b border-black h-[115px] p-1 flex items-start justify-center">
                <div className="absolute bottom-1 left-1 w-3 h-3 border border-black"></div>
                <div className="w-16 h-16 border border-dashed border-gray-200 print:border-gray-300"></div>
              </div>
            ))}
          </div>
        </section>

        {/* 下方紀錄區：換人與事件 */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="border border-black p-2 flex flex-col">
            <h3 className="text-center font-bold text-xs border-b border-black pb-1 mb-2">REMARKS</h3>
            <div className="flex-grow border border-gray-300 p-2 text-[10px] italic h-40">REMARKS:</div>
            <div className="mt-3 pt-3 border-t border-black text-[10px]">
              <div className="flex justify-between pt-2">
                <span className="border-t border-black w-24 text-center py-1">領隊簽署<br/>(Manager Sign)</span>
                <span className="border-t border-black w-24 text-center py-1">球證簽署<br/>(Referee Sign)</span>
              </div>
            </div>
          </div>

          {/* 事件區 */}
          <div className="border border-black p-2 flex flex-col">
            <h3 className="text-center font-bold text-xs border-b border-black pb-1 mb-2">賽事統計 (MATCH EVENTS)</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] flex-grow">
               <div className="border border-gray-300 p-2 italic h-40">入球球員 (SCORERS):</div>
               <div className="border border-gray-300 p-2 italic h-40">紅黃牌 (CARDS):</div>
            </div>
            <div className="mt-3 pt-2 border-t border-black text-[10px] space-y-3">
              <div className="flex justify-between font-bold">
                <span>主隊總分 (Home Score): ______</span>
                <span>客隊總分 (Away Score): ______</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center text-[8px] mt-4 text-gray-400 uppercase">
          Zenex Cup official match sheet • Do not duplicate
        </div>
      </div>
    </div>
  );
}
