import HomeLayout from '@/components/HomeLayout';
import { KIT_COLORS } from '@/lib/kitColors';
import { getMatchKitOverrides } from '@/lib/matchKitOverrides';
import { listMatches, listTeamSettings } from '@/lib/queries';

export const dynamic = 'force-dynamic';

type Team = { name: string; homeKitColor: string; awayKitColor: string };

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: Date | null;
  venue: string | null;
  round: string | null;
  status: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export default async function FixturesPage() {
  let teamRows: Awaited<ReturnType<typeof listTeamSettings>> = [];
  let matchRows: Awaited<ReturnType<typeof listMatches>> = [];
  try {
    [teamRows, matchRows] = await Promise.all([listTeamSettings(), listMatches()]);
  } catch {
    teamRows = [];
    matchRows = [];
  }

  const teams: Record<string, Team> = {};
  for (const t of teamRows) {
    teams[t.name] = {
      name: t.name,
      homeKitColor: t.homeKitColor ?? 'white',
      awayKitColor: t.awayKitColor ?? 'black',
    };
  }

  const matches: Match[] = matchRows;

  // Preload all kit overrides for sync lookup
  const allMatchIds = matches.map(m => m.id);
  const allOverrides: Record<number, Record<string, string>> = {};
  for (const matchId of allMatchIds) {
    try {
      allOverrides[matchId] = await getMatchKitOverrides(matchId);
    } catch (e) {
      allOverrides[matchId] = {};
    }
  }

  const getKitColor = (matchId: number, teamName: string, isHome: boolean) => {
    const team = teams[teamName];
    if (!team) return KIT_COLORS[0];
    const normalizedName = teamName.trim().toUpperCase();
    const override = allOverrides[matchId]?.[normalizedName];
    const colorValue = override ?? (isHome ? team.homeKitColor : team.awayKitColor);
    return KIT_COLORS.find((c) => c.value === colorValue) || KIT_COLORS[0];
  };

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">FIXTURES</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Upcoming Matches</p>
        </header>

        <main className="max-w-5xl mx-auto px-6 -mt-16 pb-20">
          <div className="space-y-4">
            {matches.map((match) => {
              const homeColor = getKitColor(match.id, match.homeTeam, true);
              const awayColor = getKitColor(match.id, match.awayTeam, false);

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {match.round || ''}
                    </span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      match.status === 'finished' ? 'bg-green-100 text-green-700' :
                      match.status === 'tbc' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {match.status === 'finished' ? '完場' : match.status === 'tbc' ? '待定' : '即將進行'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Home Team */}
                    <div className="flex-1 text-right">
                      <div className="text-xl font-bold text-slate-800 mb-2">{match.homeTeam}</div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-gray-500">主場</span>
                        <div
                          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: homeColor.hex }}
                          title={`主場球衣：${homeColor.label}`}
                        />
                      </div>
                    </div>

                    {/* VS / Score */}
                    <div className="flex flex-col items-center px-6">
                      {match.status === 'finished' ? (
                        <div className="text-3xl font-black text-slate-900">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                      )}
                      <div className="text-sm text-gray-500 mt-2 text-center">
                        <div>{match.date ? new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' (' + new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short' }) + ')' : 'TBC'}</div>
                        <div>{match.venue || 'TBC'}</div>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-left">
                      <div className="text-xl font-bold text-slate-800 mb-2">{match.awayTeam}</div>
                      <div className="flex items-center justify-start gap-2">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: awayColor.hex }}
                          title={`客場球衣：${awayColor.label}`}
                        />
                        <span className="text-sm text-gray-500">客場</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
