'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HomeLayout from '@/components/HomeLayout';
import { getPlayerById, POSITIONS, TEAMS, PLAYER_STATUS } from '@/lib/player-actions';

export default function PlayerEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const player = typeof id === 'number' && !Number.isNaN(id) ? getPlayerById(id) : undefined;

  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    position: '',
    team: '',
    age: '',
    nationality: '',
    height: '',
    weight: '',
    status: 'active',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
    notes: ''
  });

  useEffect(() => {
    if (!player) {
      setNotFound(true);
      return;
    }
    setFormData({
      name: player.name || '',
      jerseyNumber: String(player.jerseyNumber ?? ''),
      position: player.position || '',
      team: player.team || '',
      age: String(player.age ?? ''),
      nationality: player.nationality || '',
      height: String(player.height ?? ''),
      weight: String(player.weight ?? ''),
      status: player.status || 'active',
      phoneNumber: player.phoneNumber || '',
      email: player.email || '',
      emergencyContact: player.emergencyContact || '',
      notes: player.notes || ''
    });
    setAvatarPreview(player.photoUrl || null);
  }, [player]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          jerseyNumber: parseInt(formData.jerseyNumber),
          position: formData.position,
          team: formData.team,
          age: parseInt(formData.age),
          nationality: formData.nationality.trim(),
          height: parseInt(formData.height) || 0,
          weight: parseInt(formData.weight) || 0,
          status: formData.status,
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          emergencyContact: formData.emergencyContact.trim(),
          notes: formData.notes,
          photoUrl: avatarPreview || undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`更新失敗：${data?.message || res.statusText}`);
        return;
      }
      alert('更新成功！');
      router.push(`/players/${id}`);
    } catch (err) {
      alert('更新過程中發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
          <h2 className="text-6xl font-black italic mb-2 tracking-tight">EDIT PLAYER</h2>
          <p className="text-blue-200 text-lg font-light tracking-widest uppercase">Update Player Information</p>
        </header>
        <main className="max-w-4xl mx-auto px-6 -mt-16 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">PLAYER EDIT FORM</h3>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-black">UPDATE FIELDS</span>
            </div>
            <div className="p-8">
              {notFound ? (
                <div className="text-center">
                  <p className="text-slate-600">找不到該球員。</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 頭像上傳 */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="頭像預覽" className="w-20 h-20 rounded-full object-cover border-2 border-blue-500" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          頭像
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">球員頭像</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingAvatar(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                            if (!res.ok) {
                              const data = await res.json();
                              alert(`上傳失敗：${data.message}`);
                              return;
                            }
                            const data = await res.json();
                            setAvatarPreview(data.url);
                          } catch {
                            alert('上傳過程中發生錯誤');
                          } finally {
                            setUploadingAvatar(false);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={uploadingAvatar}
                      />
                      {uploadingAvatar && <p className="text-xs text-blue-600 mt-1">上傳中...</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                      <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">球衣號碼 *</label>
                      <input type="number" name="jerseyNumber" value={formData.jerseyNumber} onChange={handleChange} required min={1} max={99} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">位置 *</label>
                      <select name="position" value={formData.position} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md">
                        <option value="">請選擇位置</option>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">球隊 *</label>
                      <select name="team" value={formData.team} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md">
                        <option value="">請選擇球隊</option>
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">年齡 *</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} required min={16} max={50} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                      <input type="number" name="height" value={formData.height} onChange={handleChange} min={150} max={220} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">體重 (kg)</label>
                      <input type="number" name="weight" value={formData.weight} onChange={handleChange} min={50} max={120} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                        {Object.entries(PLAYER_STATUS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">國籍</label>
                      <input name="nationality" value={formData.nationality} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">手機號碼</label>
                      <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">緊急聯絡人</label>
                    <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
                      {isSubmitting ? '更新中...' : '保存變更'}
                    </button>
                    <button type="button" onClick={() => router.push(`/players/${id}`)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400">
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
