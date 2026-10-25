'use client';

import { useCallback, useEffect, useState } from 'react';

type ManagerRow = {
  id: number;
  email: string;
  username: string;
  teamId: number;
  createdAt: string;
  teamName: string | null;
  teamShortName: string | null;
};

type TeamOption = {
  id: number;
  name: string;
  shortName: string | null;
};

async function readJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) throw new Error(`伺服器回應為空 (HTTP ${res.status})`);
  try { return JSON.parse(text); } catch { throw new Error(`伺服器回應格式錯誤 (HTTP ${res.status})`); }
}

export function ManagerAccountsPanel() {
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', teamId: '' });
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mRes, tRes] = await Promise.all([
        fetch('/api/admin/managers', { cache: 'no-store' }),
        fetch('/api/teams', { cache: 'no-store' }),
      ]);
      const mBody = await readJsonSafe(mRes);
      const tBody = await readJsonSafe(tRes);
      if (!mBody?.ok) throw new Error(mBody?.error?.message || '載入失敗');
      if (!tBody?.ok) throw new Error(tBody?.error?.message || '載入球隊失敗');
      setManagers(mBody.data.managers);
      setTeams(tBody.data.teams.map((t: any) => ({ id: t.id, name: t.name, shortName: t.shortName })));
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createManager() {
    if (!form.email.trim() || !form.name.trim() || !form.teamId) return;
    setBusy(true);
    setError('');
    setNewPassword(null);
    try {
      const res = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, teamId: Number(form.teamId) }),
      });
      const body = await readJsonSafe(res);
      if (!body?.ok) throw new Error(body?.error?.message || '建立失敗');
      setNewPassword(body.data.tempPassword);
      setForm({ email: '', name: '', teamId: '' });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '建立失敗');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(id: number, email: string) {
    if (!confirm(`確定要重設 ${email} 嘅密碼？`)) return;
    setBusy(true);
    setError('');
    setNewPassword(null);
    try {
      const res = await fetch(`/api/admin/managers/${id}`, { method: 'POST' });
      const body = await readJsonSafe(res);
      if (!body?.ok) throw new Error(body?.error?.message || '重設失敗');
      setNewPassword(body.data.tempPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重設失敗');
    } finally {
      setBusy(false);
    }
  }

  async function removeManager(id: number, email: string) {
    if (!confirm(`確定要移除 ${email}？呢個動作唔可以復原。`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/managers/${id}`, { method: 'DELETE' });
      const body = await readJsonSafe(res);
      if (!body?.ok) throw new Error(body?.error?.message || '移除失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '移除失敗');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">載入中…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Manager 帳號（{managers.length} 個）</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-admin-primary btn-admin-sm">
          + 新增 Manager
        </button>
      </div>

      {error && <div className="alert-error mb-3">{error}</div>}

      {newPassword && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">✅ 臨時密碼（只顯示一次）</p>
          <p className="mt-2 font-mono text-lg text-green-900">{newPassword}</p>
          <p className="mt-1 text-xs text-green-600">已經電郵通知該 manager。請立即記低。</p>
        </div>
      )}

      {showForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">新增 Manager</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="field"
            />
            <input
              placeholder="姓名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field"
            />
            <select
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              className="field"
            >
              <option value="">揀球隊</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.shortName || t.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => void createManager()} disabled={busy} className="btn-admin-primary">
              {busy ? '建立中…' : '建立'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-admin">取消</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {managers.length === 0 ? (
          <p className="text-sm text-slate-500">暫時冇 manager 帳號</p>
        ) : (
          managers.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{m.email}</p>
                <p className="text-xs text-slate-500">{m.teamName || '—'} · {m.username}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => void resetPassword(m.id, m.email)} className="btn-admin btn-admin-sm text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100">
                  重設密碼
                </button>
                <button onClick={() => void removeManager(m.id, m.email)} className="btn-admin-danger btn-admin-sm">
                  移除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
