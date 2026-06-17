'use client';

import { useState, useEffect } from 'react';
import KitColorPicker from './KitColorPicker';
import { apiJson } from '@/lib/api/client';

interface KitColorManagerProps {
  teamName: string;
}

export function KitColorManager({ teamName }: KitColorManagerProps) {
  const [homeKitColor, setHomeKitColor] = useState<string>('white');
  const [awayKitColor, setAwayKitColor] = useState<string>('black');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [canSave, setCanSave] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) {
          setLoading(true);
          setCanSave(false);
        }
        setDebugInfo('載入中...');
        const data = await apiJson<{
          teams: Array<{ name: string; homeKitColor: string; awayKitColor: string }>;
        }>(await fetch('/api/teams/settings'));
        const teamRows = data.teams ?? [];

        const normalizedTarget = teamName.trim().toUpperCase();
        const team = teamRows.find(
          (t) => t.name.trim().toUpperCase() === normalizedTarget
        );

        if (cancelled) return;

        if (team) {
          const home = team.homeKitColor || 'white';
          const away = team.awayKitColor || 'black';
          setHomeKitColor(home);
          setAwayKitColor(away);
          setCanSave(true);
          setDebugInfo(`已載入：${team.name} - 主場：${home}, 客場：${away}`);
        } else {
          const available = teamRows.map((t) => t.name).filter(Boolean);
          setDebugInfo(`未找到球隊 "${teamName}"，可用球隊：${available.join(', ')}`);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load team colors:', error);
          setDebugInfo(`錯誤：${String(error)}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamName]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setDebugInfo('儲存中...');
    try {
      await apiJson<{ message: string }>(
        await fetch('/api/teams/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName,
            homeKitColor,
            awayKitColor,
          }),
        })
      );
      alert('球衣顏色已更新！');
      setDebugInfo('✅ 儲存成功！');
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
          disabled={saving || !canSave}
          className={`
            w-full py-2 px-4 rounded-lg text-sm font-semibold text-white transition-all
            ${saving || !canSave
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
