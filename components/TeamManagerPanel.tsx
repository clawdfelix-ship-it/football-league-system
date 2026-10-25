'use client';

import { useCallback, useEffect, useState } from 'react';

type TeamRow = {
  id: number;
  name: string;
  shortName: string | null;
  nameZh: string | null;
  color: string | null;
  venue: string | null;
  status: string;
  coach: { name: string; email?: string; phone?: string } | null;
  manager: { name: string; email?: string; phone?: string } | null;
  captains: Array<{ name: string; email?: string; phone?: string }> | null;
  sortOrder: number | null;
  leagueId: number;
};

const EMPTY_FORM = {
  name: '',
  shortName: '',
  nameZh: '',
  color: '',
  venue: '',
  coachName: '',
  coachEmail: '',
  coachPhone: '',
  managerName: '',
  managerEmail: '',
  managerPhone: '',
  captainsText: '', // one per line: "Name, email, phone"
  sortOrder: '',
};

/**
 * Admin panel section for managing teams (add / edit / delete).
 * Replaces the read-only TEAM_CONTACTS list with a DB-backed CRUD UI.
 */
export function TeamManagerPanel() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
      setTeams(body.data.teams);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: TeamRow) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      shortName: t.shortName ?? '',
      nameZh: t.nameZh ?? '',
      color: t.color ?? '',
      venue: t.venue ?? '',
      coachName: t.coach?.name ?? '',
      coachEmail: t.coach?.email ?? '',
      coachPhone: t.coach?.phone ?? '',
      managerName: t.manager?.name ?? '',
      managerEmail: t.manager?.email ?? '',
      managerPhone: t.manager?.phone ?? '',
      captainsText: (t.captains ?? [])
        .map((c) => `${c.name}${c.email ? `, ${c.email}` : ''}${c.phone ? `, ${c.phone}` : ''}`)
        .join('\n'),
      sortOrder: t.sortOrder != null ? String(t.sortOrder) : '',
    });
    setShowForm(true);
  }

  function parseCaptains(text: string) {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, email, phone] = line.split(',').map((s) => s.trim());
        return { name: name || '', email: email || undefined, phone: phone || undefined };
      })
      .filter((c) => c.name);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        shortName: form.shortName.trim() || undefined,
        nameZh: form.nameZh.trim() || undefined,
        color: form.color.trim() || undefined,
        venue: form.venue.trim() || undefined,
        coach: form.coachName
          ? { name: form.coachName, email: form.coachEmail || undefined, phone: form.coachPhone || undefined }
          : null,
        manager: form.managerName
          ? { name: form.managerName, email: form.managerEmail || undefined, phone: form.managerPhone || undefined }
          : null,
        captains: parseCaptains(form.captainsText).length > 0 ? parseCaptains(form.captainsText) : null,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
      };

      const res = editingId
        ? await fetch(`/api/teams/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '儲存失敗');

      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, name: string) {
    // First, check associations
    setBusy(true);
    setError('');
    try {
      const assocRes = await fetch(`/api/teams/${id}?dryRun=true`, { method: 'DELETE' });
      const assocBody = await assocRes.json();
      
      if (assocBody?.error?.code === 'HAS_MATCHES') {
        // Has matches — suggest archive
        if (confirm(`「${name}」有 ${assocBody.error.data?.matchCount ?? 0} 場比賽記錄，唔可以刪除。\n\n要唔要改為「封存」？封存後唔會喺新比賽出現，但歷史記錄會保留。`)) {
          const archiveRes = await fetch(`/api/teams/${id}/archive`, { method: 'POST' });
          const archiveBody = await archiveRes.json();
          if (!archiveBody?.ok) throw new Error(archiveBody?.error?.message || '封存失敗');
          await load();
        }
        return;
      }

      const playerCount = assocBody?.data?.playerCount ?? assocBody?.error?.data?.playerCount ?? 0;
      if (playerCount > 0) {
        // Has players — choose release or delete
        const choice = confirm(
          `「${name}」有 ${playerCount} 個球員。\n\n點處理球員？\nOK = 轉做「自由球員」（保留資料）\nCancel = 一併刪除`
        );
        const mode = choice ? 'release' : 'delete';
        if (!confirm(`確定要${choice ? '釋放' : '刪除'} ${playerCount} 個球員並刪除「${name}」？`)) return;
        
        const res = await fetch(`/api/teams/${id}?mode=${mode}`, { method: 'DELETE' });
        const body = await res.json();
        if (!body?.ok) throw new Error(body?.error?.message || '刪除失敗');
      } else {
        // No associations — direct delete
        if (!confirm(`確定要刪除球隊「${name}」？`)) return;
        const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        const body = await res.json();
        if (!body?.ok) throw new Error(body?.error?.message || '刪除失敗');
      }
      
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '刪除失敗');
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: number, name: string) {
    if (!confirm(`確定要封存「${name}」？封存後唔會喺新比賽出現，但歷史記錄會保留。`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/teams/${id}/archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '封存失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '封存失敗');
    } finally {
      setBusy(false);
    }
  }

  async function unarchive(id: number, name: string) {
    if (!confirm(`確定要恢復「${name}」？`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/teams/${id}/archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unarchive' }) });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '恢復失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '恢復失敗');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">載入中…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">球隊管理（{teams.length} 支）</h3>
        <button
          onClick={openCreate}
          className="rounded-lg border border-[#0f172a] bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e293b]"
        >
          + 新增球隊
        </button>
      </div>

      {error && <div className="alert-error mb-3">{error}</div>}

      {showForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            {editingId ? '編輯球隊' : '新增球隊'}
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="英文名稱 *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="簡稱" value={form.shortName} onChange={(v) => setForm({ ...form, shortName: v })} />
            <Field label="中文名稱" value={form.nameZh} onChange={(v) => setForm({ ...form, nameZh: v })} />
            <Field label="顏色（tailwind classes）" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
            <Field label="主場" value={form.venue} onChange={(v) => setForm({ ...form, venue: v })} />
            <Field label="排序（數字，細先排前）" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: v })} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-700">教練</p>
              <div className="space-y-1">
                <input placeholder="姓名" value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                <input placeholder="電郵" value={form.coachEmail} onChange={(e) => setForm({ ...form, coachEmail: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                <input placeholder="電話" value={form.coachPhone} onChange={(e) => setForm({ ...form, coachPhone: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-700">領隊</p>
              <div className="space-y-1">
                <input placeholder="姓名" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                <input placeholder="電郵" value={form.managerEmail} onChange={(e) => setForm({ ...form, managerEmail: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                <input placeholder="電話" value={form.managerPhone} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-slate-700">隊長（每行一個：姓名， 電郵， 電話）</p>
            <textarea
              value={form.captainsText}
              onChange={(e) => setForm({ ...form, captainsText: e.target.value })}
              rows={3}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="陳大文, chan@example.com, 9123 4567&#10;李小明, lee@example.com"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void save()}
              disabled={busy}
              className="rounded-lg border border-[#0f172a] bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e293b] disabled:opacity-50"
            >
              {busy ? '儲存中…' : '儲存'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {teams.map((t) => (
          <li key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {t.name}
                  {t.nameZh && <span className="ml-2 text-sm font-normal text-slate-600">{t.nameZh}</span>}
                  {t.status === 'archived' && (
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      已封存
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {t.shortName} · {t.venue ?? '—'} · 排序 {t.sortOrder ?? '—'}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(t)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  編輯
                </button>
                {t.status === 'active' ? (
                  <>
                    <button
                      onClick={() => void archive(t.id, t.name)}
                      className="rounded-lg border border-amber-600 bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      封存
                    </button>
                    <button
                      onClick={() => void remove(t.id, t.name)}
                      className="rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      刪除
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => void unarchive(t.id, t.name)}
                    className="rounded-lg border border-green-600 bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    恢復
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
