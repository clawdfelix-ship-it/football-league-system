import HomeLayout from '@/components/HomeLayout';
import { getPlayers, TEAMS, PLAYER_STATUS } from '@/lib/player-actions';

export default function DashboardPage() {
  const players = getPlayers();

  // 統計數據
  const totalPlayers = players.length;
  const activePlayers = players.filter(p => p.status === 'active').length;
  const injuredPlayers = players.filter(p => p.status === 'injured').length;
  const suspendedPlayers = players.filter(p => p.status === 'suspended').length;
  const inactivePlayers = players.filter(p => p.status === 'inactive').length;

  // 按球隊統計
  const teamStats = TEAMS.map(team => {
    const teamPlayers = players.filter(p => p.team === team);
    return {
      team,
      count: teamPlayers.length,
      active: teamPlayers.filter(p => p.status === 'active').length,
      avgAge: teamPlayers.length > 0 ? Math.round(teamPlayers.reduce((sum, p) => sum + p.age, 0) / teamPlayers.length) : 0
    };
  }).filter(t => t.count > 0);

  // 按位置統計
  const positionStats = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 年齡分布
  const ageGroups = {
    '16-20': players.filter(p => p.age >= 16 && p.age <= 20).length,
    '21-25': players.filter(p => p.age >= 21 && p.age <= 25).length,
    '26-30': players.filter(p => p.age >= 26 && p.age <= 30).length,
    '31-35': players.filter(p => p.age >= 31 && p.age <= 35).length,
    '36+': players.filter(p => p.age >= 36).length
  };

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">DASHBOARD</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">League Statistics & Analytics</p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 總覽卡片 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-blue-600">{totalPlayers}</div>
              <div className="text-sm text-gray-600 mt-1">總球員數</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-green-600">{activePlayers}</div>
              <div className="text-sm text-gray-600 mt-1">活躍球員</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-red-600">{injuredPlayers}</div>
              <div className="text-sm text-gray-600 mt-1">受傷球員</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-yellow-600">{suspendedPlayers}</div>
              <div className="text-sm text-gray-600 mt-1">停賽球員</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 球隊統計 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">球隊統計</h3>
              <div className="space-y-3">
                {teamStats.map(team => (
                  <div key={team.team} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{team.team}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">共 {team.count} 人</span>
                      <span className="text-green-600">活躍 {team.active}</span>
                      <span className="text-gray-500">平均 {team.avgAge} 歲</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 位置統計 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">位置分布</h3>
              <div className="space-y-3">
                {Object.entries(positionStats).map(([position, count]) => (
                  <div key={position} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{position}</span>
                    <span className="text-blue-600 font-bold">{count} 人</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 年齡分布 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">年齡分布</h3>
              <div className="space-y-3">
                {Object.entries(ageGroups).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{range} 歲</span>
                    <span className="text-purple-600 font-bold">{count} 人</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 狀態分布 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">球員狀態</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">活躍</span>
                  <span className="text-green-600 font-bold">{activePlayers} 人</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-800">受傷</span>
                  <span className="text-red-600 font-bold">{injuredPlayers} 人</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-yellow-800">停賽</span>
                  <span className="text-yellow-600 font-bold">{suspendedPlayers} 人</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">非活躍</span>
                  <span className="text-gray-600 font-bold">{inactivePlayers} 人</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}