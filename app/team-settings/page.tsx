'use client';

import { useState, useEffect } from 'react';
import HomeLayout from '@/components/HomeLayout';
import KitColorPicker from '@/components/KitColorPicker';
import { TEAMS } from '@/lib/constants';

interface TeamSettings {
  name: string;
  homeKitColor: string;
  awayKitColor: string;
}

export default function TeamSettingsPage() {
  const [teamSettings, setTeamSettings] = useState<Record<string, TeamSettings>>({});
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeamSettings();
  }, []);

  const loadTeamSettings = async () => {
    try {
      const res = await fetch('/api/teams/settings');
      const data = await res.json();
      
      const settings: Record<string, TeamSettings> = {};
      (data.teams || []).forEach((team: any) => {
        settings[team.name] = {
          name: team.name,
          homeKitColor: team.home_kit_color || 'white',
          awayKitColor: team.away_kit_color || 'black',
        };
      });
      
      setTeamSettings(settings);
    } catch (error) {
      console.error('Failed to load team settings:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedTeam) return;
    
    setSaving(true);
    try {
      const settings = teamSettings[selectedTeam];
      await fetch('/api/teams/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: selectedTeam,
          homeKitColor: settings.homeKitColor,
          awayKitColor: settings.awayKitColor,
        }),
      });
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

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">球隊設置</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Team Kit Color Settings</p>
        </header>

        <main className="max-w-4xl mx-auto px-6 -mt-16 pb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">選擇球隊</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
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

            {selectedTeam && teamSettings[selectedTeam] && (
              <div className="border-t pt-6">
                <h4 className="text-xl font-bold text-slate-800 mb-6">
                  {selectedTeam} - 球衣顏色設置
                </h4>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Home Kit */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h5 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                      主場球衣 (Home Kit)
                    </h5>
                    <KitColorPicker
                      label="選擇主場顏色"
                      value={teamSettings[selectedTeam].homeKitColor}
                      onChange={(color) => updateTeamColor(selectedTeam, 'homeKitColor', color)}
                    />
                  </div>

                  {/* Away Kit */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h5 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                      客場球衣 (Away Kit)
                    </h5>
                    <KitColorPicker
                      label="選擇客場顏色"
                      value={teamSettings[selectedTeam].awayKitColor}
                      onChange={(color) => updateTeamColor(selectedTeam, 'awayKitColor', color)}
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
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
            )}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
