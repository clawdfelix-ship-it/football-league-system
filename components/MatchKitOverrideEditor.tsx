'use client';

import { useState, useEffect, useCallback } from 'react';
import KitColorPicker from './KitColorPicker';
import { getMatchKitOverridesLocal, setMatchKitOverrideLocal } from '@/lib/matchKitOverrides';

interface MatchKitOverrideEditorProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  onClose: () => void;
}

export default function MatchKitOverrideEditor({
  matchId,
  homeTeam,
  awayTeam,
  onClose,
}: MatchKitOverrideEditorProps) {
  const [homeOverride, setHomeOverride] = useState<string | null>(null);
  const [awayOverride, setAwayOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'db' | 'local' | 'loading'>('loading');

  const loadOverrides = useCallback(async () => {
    // 先試 DB，5秒 timeout，唔得就用 localStorage
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    try {
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
        setMode('db');
        setLoading(false);
        return;
      }
    } catch (dbError) {
      console.log('DB mode not available, using localStorage:', dbError);
    }
    
    // Fallback: localStorage mode
    try {
      const overrides = getMatchKitOverridesLocal(matchId);
      
      const homeNormalized = homeTeam.trim().toUpperCase();
      const awayNormalized = awayTeam.trim().toUpperCase();
      
      setHomeOverride(overrides[homeNormalized] || null);
      setAwayOverride(overrides[awayNormalized] || null);
      setMode('local');
    } catch (error) {
      console.error('Failed to load overrides:', error);
    } finally {
      setLoading(false);
    }
  }, [awayTeam, homeTeam, matchId]);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  const handleSave = async (team: string, color: string | null) => {
    setSaving(true);
    
    // 如果係 DB mode，先試 DB
    if (mode === 'db') {
      try {
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
          setSaving(false);
          return;
        }
      } catch (dbError) {
        console.log('DB save failed, falling back to localStorage:', dbError);
        setMode('local');
      }
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
    return <div className="text-sm text-slate-500 p-4">載入中...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-lg">🎽</span>
          比賽球衣顏色設置
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6">
        {/* Home Team */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              🏠 {homeTeam} (主場)
            </span>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={homeOverride !== null}
                disabled={saving}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Default to white
                    handleSave(homeTeam, 'white');
                  } else {
                    handleSave(homeTeam, null);
                  }
                }}
                className="rounded"
              />
              <span className="text-slate-500">
                自訂球衣
              </span>
            </label>
          </div>
          
          {homeOverride && (
            <KitColorPicker
              label="主場球衣顏色"
              value={homeOverride}
              onChange={(color) => handleSave(homeTeam, color)}
            />
          )}
        </div>

        {/* Away Team */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              ✈️ {awayTeam} (客場)
            </span>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={awayOverride !== null}
                disabled={saving}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Default to white
                    handleSave(awayTeam, 'white');
                  } else {
                    handleSave(awayTeam, null);
                  }
                }}
                className="rounded"
              />
              <span className="text-slate-500">
                自訂球衣
              </span>
            </label>
          </div>
          
          {awayOverride && (
            <KitColorPicker
              label="客場球衣顏色"
              value={awayOverride}
              onChange={(color) => handleSave(awayTeam, color)}
            />
          )}
        </div>

        {/* Mode Indicator */}
        <div className={`text-xs p-3 rounded-lg ${
          mode === 'db' 
            ? 'bg-green-50 text-green-700'
            : 'bg-yellow-50 text-yellow-700'
        }`}>
          {mode === 'db' ? (
            <>✅ <strong>DB 同步模式</strong>：所有用戶都會睇到同一個顏色</>
          ) : (
            <>⚠️ <strong>本機模式</strong>：設定只會係你嘅瀏覽器度，刷新頁面唔會消失</>
          )}
        </div>
      </div>
    </div>
  );
}
