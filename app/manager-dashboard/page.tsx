'use client';

import { useState, useEffect } from 'react';
import HomeLayout from '@/components/HomeLayout';
import KitColorPicker from '@/components/KitColorPicker';
import { TEAMS } from '@/lib/constants';
import { apiJson } from '@/lib/api/client';

interface TeamSettings {
  name: string;
  homeKitColor: string;
  awayKitColor: string;
}

export default function ManagerDashboardPage() {
  const [teamSettings, setTeamSettings] = useState<Record<string, TeamSettings>>({});
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeamSettings();
  }, []);

  const loadTeamSettings = async () => {
    try {
      const data = await apiJson<{
        teams: Array<{ name: string; homeKitColor: string; awayKitColor: string }>;
      }>(await fetch('/api/teams/settings'));
      
      const settings: Record<string, TeamSettings> = {};
      const teamRows = data.teams ?? [];
      teamRows.forEach((team) => {
        const name = team.name;
        if (!name) return;
        settings[name] = {
          name,
          homeKitColor: team.homeKitColor || 'white',
          awayKitColor: team.awayKitColor || 'black',
        };
      });
      
      setTeamSettings(settings);
    } catch (error) {
      console.error('Failed to load team settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTeam) return;
    
    setSaving(true);
    try {
      const settings = teamSettings[selectedTeam];
      await apiJson<{ message: string }>(
        await fetch('/api/teams/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName: selectedTeam,
            homeKitColor: settings.homeKitColor,
            awayKitColor: settings.awayKitColor,
          }),
        })
      );
      alert('球衣顏色已更新！');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('儲存失敗，請再試一次');
    } finally {
      setSaving(false);
    }
  };

  const updateTeamColor = (teamName: string, field: 'homeKitColor' | 'awayKitColor', color: string) => {
    setTeamSettings(prev => ({
      ...prev,
      [teamName]: {
        ...prev[teamName],
        [field]: color,
      },
    }));
  };

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">TEAM MANAGER</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Dashboard & Kit Settings</p>
        </header>

        <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-blue-600">8</div>
              <div className="text-sm text-gray-600 mt-1">參賽球隊</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-green-600">14</div>
              <div className="text-sm text-gray-600 mt-1">總比賽場數</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="text-3xl font-bold text-purple-600">240</div>
              <div className="text-sm text-gray-600 mt-1">註冊球員</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">選擇球隊</h3>
              <div className="grid grid-cols-2 gap-3">
                {TEAMS.filter(t => t.name !== 'DEMO').map((team) => (
                  <button
                    key={team.name}
                    onClick={() => setSelectedTeam(team.name)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${selectedTeam === team.name 
                        ? 'border-blue-600 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="font-bold text-slate-800">{team.name}</div>
                    <div className="text-xs text-gray-500">{team.nameZh}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kit Color Settings */}
            {selectedTeam && teamSettings[selectedTeam] && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">
                  {selectedTeam} - 球衣顏色設置
                </h3>

                <div className="space-y-6">
                  {/* Home Kit */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                      主場球衣 (Home Kit)
                    </h4>
                    <KitColorPicker
                      label="選擇主場顏色"
                      value={teamSettings[selectedTeam].homeKitColor}
                      onChange={(color) => updateTeamColor(selectedTeam, 'homeKitColor', color)}
                    />
                  </div>

                  {/* Away Kit */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                      客場球衣 (Away Kit)
                    </h4>
                    <KitColorPicker
                      label="選擇客場顏色"
                      value={teamSettings[selectedTeam].awayKitColor}
                      onChange={(color) => updateTeamColor(selectedTeam, 'awayKitColor', color)}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`
                        px-8 py-3 rounded-lg font-bold text-white transition-all
                        ${saving 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}
                      `}
                    >
                      {saving ? '儲存中...' : '儲存設置'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* League Info */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">聯賽資訊</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-slate-700 mb-2">賽季時間</h4>
                <p className="text-gray-600 text-sm">
                  3 月底開始，預計 12 月中結束（7-8 月休賽）
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">比賽格式</h4>
                <p className="text-gray-600 text-sm">
                  雙循環聯賽制，每場 60 分鐘（上下半場各 30 分鐘）
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">比賽時間</h4>
                <p className="text-gray-600 text-sm">
                  逢星期二及星期三（公眾假期除外）, 晚上 8:00 或 9:30
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">查看賽程</h4>
                <a href="/fixtures" className="text-blue-600 hover:underline text-sm font-medium">
                  前往賽程頁面 →
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
