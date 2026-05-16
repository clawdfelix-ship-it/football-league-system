'use client';

import { useState, useEffect } from 'react';
import KitColorPicker from './KitColorPicker';
import { KIT_COLORS } from '@/lib/kitColors';
import { getMatchKitOverridesLocal, setMatchKitOverrideLocal } from '@/lib/matchKitOverrides';

interface MatchKitOverrideEditorProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  onClose: () => void;
}

export function MatchKitOverrideEditor({
  matchId,
  homeTeam,
  awayTeam,
  onClose,
}: MatchKitOverrideEditorProps) {
  const [homeOverride, setHomeOverride] = useState<string | null>(null);
  const [awayOverride, setAwayOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOverrides();
  }, [matchId]);

  const loadOverrides = async () => {
    // 3 秒 timeout，太耐就自動 fallback 去 localStorage
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    
    try {
      // 先試 DB/API mode
      const res = await Promise.race([
        fetch(`/api/matches/${matchId}/kit-overrides`),
        timeoutPromise
      ]);
      
      if (res && res.ok) {
        const data = await res.json();
        const overrides = data.overrides || {};
        
        const homeNormalized = homeTeam.trim().toUpperCase();
        const awayNormalized = awayTeam.trim().toUpperCase();
        
        setHomeOverride(overrides[homeNormalized] || null);
        setAwayOverride(overrides[awayNormalized] || null);
        setLoading(false);
        return;
      }
    } catch (dbError) {
      console.log('DB mode failed or timeout, falling back to localStorage:', dbError);
    }
    
    // Fallback: localStorage mode
    try {
      const overrides = getMatchKitOverridesLocal(matchId);
      
      const homeNormalized = homeTeam.trim().toUpperCase();
      const awayNormalized = awayTeam.trim().toUpperCase();
      
      setHomeOverride(overrides[homeNormalized] || null);
      setAwayOverride(overrides[awayNormalized] || null);
    } catch (error) {
      console.error('Failed to load overrides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (team: string, color: string | null) => {
    setSaving(true);
    try {
      // 先試 DB/API mode
      let res;
      if (color) {
        res = await fetch(`/api/matches/${matchId}/kit-overrides`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName: team, kitColor: color }),
        });
      } else {
        res = await fetch(`/api/matches/${matchId}/kit-overrides`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName: team }),
        });
      }
      
      if (res.ok) {
        await loadOverrides();
        return;
      }
    } catch (dbError) {
      console.log('DB mode save failed, falling back to localStorage:', dbError);
    }
    
    // Fallback: localStorage mode
    try {
      setMatchKitOverrideLocal(matchId, team, color);
      
      // Update local state
      if (team.trim().toUpperCase() === homeTeam.trim().toUpperCase()) {
        setHomeOverride(color);
      } else {
        setAwayOverride(color);
      }
    } catch (error) {
      console.error('Failed to save override:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 p-4">載入中...</div>;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <span className="text-lg">🎽</span>
          比賽球衣顏色設置
        </h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6">
        {/* Home Team */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              🏠 {homeTeam} (主場)
            </span>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={homeOverride !== null}
                onChange={(e) => {
                  if (e.target.checked) {
                    setHomeOverride('red'); // Default override color
                  } else {
                    handleSave(homeTeam, null);
                    setHomeOverride(null);
                  }
                }}
                className="rounded"
              />
              自訂顏色
            </label>
          </div>
          
          {homeOverride !== null && (
            <div className="space-y-2">
              <KitColorPicker
                label=""
                value={homeOverride}
                onChange={(color) => setHomeOverride(color)}
              />
              <button
                onClick={() => handleSave(homeTeam, homeOverride)}
                disabled={saving}
                className="w-full py-1.5 px-3 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ✈️ {awayTeam} (客場)
            </span>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={awayOverride !== null}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAwayOverride('white-green'); // Default override color
                  } else {
                    handleSave(awayTeam, null);
                    setAwayOverride(null);
                  }
                }}
                className="rounded"
              />
              自訂顏色
            </label>
          </div>
          
          {awayOverride !== null && (
            <div className="space-y-2">
              <KitColorPicker
                label=""
                value={awayOverride}
                onChange={(color) => setAwayOverride(color)}
              />
              <button
                onClick={() => handleSave(awayTeam, awayOverride)}
                disabled={saving}
                className="w-full py-1.5 px-3 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </div>

        {/* Color Reference */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 mb-2">顏色參考：</p>
          <div className="flex flex-wrap gap-1">
            {KIT_COLORS.slice(0, 8).map((color) => (
              <div
                key={color.value}
                className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                style={{
                  backgroundColor: color.type === 'split' && color.hex2
                    ? `linear-gradient(90deg, ${color.hex} 50%, ${color.hex2} 50%)`
                    : color.hex
                }}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchKitOverrideEditor;
