'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomeLayout from '@/components/HomeLayout';
import type { Player } from '@/lib/schema';

const PLAYER_STATUS = {
  active: '活躍',
  injured: '受傷',
  suspended: '停賽',
  inactive: '非活躍',
} as const;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // 載入球員資料
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/players');
      if (!res.ok) {
        throw new Error('無法載入球員資料');
      }
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (error) {
      console.error('載入球員資料失敗:', error);
      alert('載入球員資料失敗，請刷新頁面重試');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.jerseyNumber?.toString().includes(searchTerm);
    const matchesTeam = !selectedTeam || player.team === selectedTeam;
    const matchesStatus = !selectedStatus || player.status === selectedStatus;
    
    return matchesSearch && matchesTeam && matchesStatus;
  });

  const teams = [
    ...new Set(
      players
        .map((p) => p.team)
        .filter((team): team is string => !!team),
    ),
  ];
  const statusOptions = Object.entries(PLAYER_STATUS);

  const getStatusColor = (status: keyof typeof PLAYER_STATUS) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'injured': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeletePlayer = async (playerId: number, playerName: string) => {
    if (!confirm(`確定要刪除球員 ${playerName} 嗎？`)) return;
    
    try {
      const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(`刪除失敗：${data?.message || res.statusText}`);
        return;
      }
      // 重新載入球員資料
      await loadPlayers();
      alert('球員已成功刪除');
    } catch (error) {
      console.error('刪除球員失敗:', error);
      alert('刪除過程中發生錯誤');
    }
  };

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
          <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
            <h2 className="text-6xl font-black italic mb-2 tracking-tight">PLAYER MANAGEMENT</h2>
            <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Squad Registration & Tracking</p>
          </header>

          <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">載入球員資料中...</p>
              </div>
            </div>
          </main>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        {/* Hero 橫幅 */}
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">PLAYER MANAGEMENT</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Squad Registration & Tracking</p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* 頁面標題和操作 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">球員管理</h1>
                <Link
                  href="/players/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  + 新增球員
                </Link>
              </div>
            </div>

            {/* 篩選器 */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    搜尋球員
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="姓名或球衣號碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    球隊
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部球隊</option>
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    狀態
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部狀態</option>
                    {statusOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedTeam('');
                      setSelectedStatus('');
                    }}
                    className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    清除篩選
                  </button>
                </div>
              </div>
            </div>

            {/* 球員列表 */}
            <div className="p-6">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">沒有符合條件的球員</p>
                  <Link
                    href="/players/register"
                    className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    新增第一個球員
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          球員資訊
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          球隊
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          位置
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          狀態
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          聯絡方式
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt={player.name} className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                    {player.jerseyNumber}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {player.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {player.age}歲 • {player.nationality}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {player.height}cm / {player.weight}kg
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{player.team}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{player.position}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const statusKey =
                                (player.status ?? 'inactive') as keyof typeof PLAYER_STATUS;
                              return (
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    statusKey,
                                  )}`}
                                >
                                  {PLAYER_STATUS[statusKey]}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {player.phoneNumber && (
                                <div>📱 {player.phoneNumber}</div>
                              )}
                              {player.email && (
                                <div>📧 {player.email}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link
                                href={`/players/${player.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                查看
                              </Link>
                              <Link
                                href={`/players/${player.id}/edit`}
                                className="text-green-600 hover:text-green-900"
                              >
                                編輯
                              </Link>
                              <button
                                onClick={() => handleDeletePlayer(player.id!, player.name)}
                                className="text-red-600 hover:text-red-900"
                              >
                                刪除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                共找到 {filteredPlayers.length} 名球員
              </div>
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
