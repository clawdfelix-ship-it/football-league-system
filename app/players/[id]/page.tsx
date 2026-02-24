import HomeLayout from '@/components/HomeLayout';
import Link from 'next/link';
import { getPlayerById, PLAYER_STATUS } from '@/lib/player-actions';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
  const player = getPlayerById(numericId);

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">PLAYER PROFILE</h2>
          <p className="text-blue-2 00 text-lg font-light tracking-widest uppercase">Full Player Information</p>
        </header>

        <main className="max-w-4xl mx-auto px-6 -mt-16 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">PLAYER DETAILS</h3>
              <div className="flex items-center gap-2">
                <Link
                  href={`/players/${numericId}/edit`}
                  className="bg-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  編輯
                </Link>
                <Link
                  href="/players"
                  className="bg-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-700"
                >
                  返回列表
                </Link>
              </div>
            </div>

            {player ? (
              <div className="p-8">
                <div className="flex items-start gap-6">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} className="h-20 w-20 rounded-full object-cover border-2 border-blue-500" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-2xl">
                      {player.jerseyNumber}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-slate-900">{player.name}</h1>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        {player.position}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-900 text-yellow-400 font-black">
                        {PLAYER_STATUS[player.status]}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      {player.team} • {player.age}歲 • {player.nationality}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {player.height}cm / {player.weight}kg
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div className="border rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">聯絡資料</h3>
                    <div className="text-sm text-slate-700 space-y-1">
                      {player.phoneNumber && <div>📱 {player.phoneNumber}</div>}
                      {player.email && <div>📧 {player.email}</div>}
                      {player.emergencyContact && <div>🆘 {player.emergencyContact}</div>}
                    </div>
                  </div>
                  <div className="border rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">備註</h3>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {player.notes || '—'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-slate-600">找不到該球員。</p>
                <Link href="/players" className="inline-block mt-4 text-blue-600 hover:underline">
                  返回球員列表
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
