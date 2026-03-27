'use client';

import { useState, useEffect } from 'react';
import KitColorPicker from './KitColorPicker';

interface KitColorManagerProps {
  teamName: string;
}

export function KitColorManager({ teamName }: KitColorManagerProps) {
  const [homeKitColor, setHomeKitColor] = useState<string>('white');
  const [awayKitColor, setAwayKitColor] = useState<string>('black');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    loadTeamColors();
  }, [teamName]);

  const loadTeamColors = async () => {
    try {
      setDebugInfo('載入中...');
      const res = await fetch('/api/teams/settings');
      const data = await res.json();
      
      console.log('📦 API 返回數據:', data);
      console.log('🔍 尋找球隊:', teamName);
      
      // 嘗試多種匹配方式
      const team = (data.teams || []).find((t: any) => {
        const match = t.name === teamName || 
                     t.name?.toUpperCase() === teamName?.toUpperCase() ||
                     t.name?.trim().toUpperCase() === teamName?.trim().toUpperCase();
        if (match) {
          console.log('✅ 找到球隊:', t);
        }
        return match;
      });
      
      if (team) {
        console.log('🎨 設置顏色:', team.home_kit_color, team.away_kit_color);
        setHomeKitColor(team.home_kit_color || 'white');
        setAwayKitColor(team.away_kit_color || 'black');
        setDebugInfo(`已載入：${team.name} - 主場：${team.home_kit_color}, 客場：${team.away_kit_color}`);
      } else {
        console.log('❌ 找不到球隊，可用球隊:', data.teams?.map((t: any) => t.name));
        setDebugInfo(`未找到球隊 "${teamName}"，可用球隊：${data.teams?.map((t: any) => t.name).join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to load team colors:', error);
      setDebugInfo(`錯誤：${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setDebugInfo('儲存中...');
    try {
      console.log('💾 儲存顏色:', { teamName, homeKitColor, awayKitColor });
      
      const res = await fetch('/api/teams/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          homeKitColor,
          awayKitColor,
        }),
      });
      
      const result = await res.json();
      console.log('📥 儲存結果:', result);
      
      if (res.ok) {
        alert('球衣顏色已更新！');
        setDebugInfo('✅ 儲存成功！');
      } else {
        throw new Error(result.error || '儲存失敗');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('儲存失敗，請再試一次');
      setDebugInfo(`❌ 儲存失敗：${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        載入中...
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 rounded-xl p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="4"/>
          <line x1="21.17" y1="8" x2="12" y2="8"/>
          <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
          <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
        </svg>
        球衣顏色設置
      </h3>

      {debugInfo && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 font-mono">
          {debugInfo}
        </div>
      )}

      <div className="space-y-4">
        {/* Home Kit */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <label className="text-xs font-medium text-zinc-600">主場球衣 (Home Kit)</label>
          </div>
          <KitColorPicker
            label=""
            value={homeKitColor}
            onChange={setHomeKitColor}
          />
        </div>

        {/* Away Kit */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            <label className="text-xs font-medium text-zinc-600">客場球衣 (Away Kit)</label>
          </div>
          <KitColorPicker
            label=""
            value={awayKitColor}
            onChange={setAwayKitColor}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`
            w-full py-2 px-4 rounded-lg text-sm font-semibold text-white transition-all
            ${saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'}
          `}
        >
          {saving ? '儲存中...' : '儲存顏色設置'}
        </button>
      </div>
    </div>
  );
}
