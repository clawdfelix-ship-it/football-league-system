'use client';

import { useState } from 'react';
import HomeLayout from '@/components/HomeLayout';
import { apiJson } from '@/lib/api/client';

export default function InitTeamsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInit = async () => {
    setStatus('loading');
    try {
      await apiJson<{ message: string; count: number }>(await fetch('/api/teams/init', { method: 'POST' }));
      setStatus('success');
      setMessage('✅ 球隊數據初始化成功！');
    } catch (error) {
      setStatus('error');
      setMessage(`❌ 錯誤：${String(error)}`);
    }
  };

  const handleCheck = async () => {
    setStatus('loading');
    try {
      const data = await apiJson<{
        teams: Array<{ name: string; homeKitColor: string; awayKitColor: string }>;
      }>(await fetch('/api/teams/settings'));
      
      if (data.teams && data.teams.length > 0) {
        const rows = data.teams ?? [];
        setStatus('success');
        setMessage(
          `✅ 找到 ${rows.length} 支球隊：\n\n${rows
            .map((t) => `${t.name}: 主場=${t.homeKitColor}, 客場=${t.awayKitColor}`)
            .join('\n')}`
        );
      } else {
        setStatus('error');
        setMessage('❌ 數據庫為空，請點擊「初始化數據庫」');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ 錯誤：${String(error)}`);
    }
  };

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎨 球隊球衣顏色初始化
            </h1>
            <p className="text-gray-600 mb-8">
              初始化球隊數據庫，設置各隊嘅主場同客場球衣顏色
            </p>

            <div className="space-y-4">
              {/* Check Status Button */}
              <button
                onClick={handleCheck}
                disabled={status === 'loading'}
                className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? '檢查中...' : '檢查數據庫狀態'}
              </button>

              {/* Init Button */}
              <button
                onClick={handleInit}
                disabled={status === 'loading'}
                className="w-full py-3 px-6 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? '初始化中...' : '初始化數據庫'}
              </button>

              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-lg text-sm whitespace-pre-line ${
                  status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-gray-50 text-gray-800 border border-gray-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Next Steps */}
              {status === 'success' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">下一步：</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>去 <a href="/admin" className="underline hover:text-blue-600">/admin</a> 登入 Team Manager</li>
                    <li>滾動到 <strong>Kit Colors</strong> 區域</li>
                    <li>選擇球隊嘅主場同客場顏色</li>
                    <li>點擊「儲存顏色設置」</li>
                    <li>去 <a href="/overview" className="underline hover:text-blue-600">/overview</a> 查看效果</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
