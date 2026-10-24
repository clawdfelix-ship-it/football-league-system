'use client';

import { useCallback, useEffect, useState } from 'react';

type ApplicationRow = {
  id: number;
  leagueName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  teamCountEst: number | null;
  notes: string | null;
  requestedSlug: string | null;
  status: string;
  reviewNotes: string | null;
  leagueId: number | null;
  createdAt: string | Date | null;
  reviewedAt: string | Date | null;
};

type LeagueRow = {
  id: number;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  createdAt: string | Date | null;
};

type AuditEventRow = {
  id: number;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: number | null;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | Date;
};

type UserRow = {
  id: number;
  email: string;
  username: string;
  role: string | null;
  leagueId: number | null;
  leagueSlug: string | null;
  leagueName: string | null;
  mustChangePassword: string | Date | null;
  createdAt: string | Date | null;
};

type AdminRow = {
  id: number;
  email: string;
  addedBy: string | null;
  note: string | null;
  createdAt: string | Date | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-slate-200 text-slate-700',
};

const LEAGUE_STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-700',
  trial: 'bg-blue-100 text-blue-800',
  pending: 'bg-slate-100 text-slate-700',
};

const AUDIT_ACTION_LABEL: Record<string, string> = {
  'application.pending': '申請提交',
  'application.in_review': '開始審閱',
  'application.approved': '批准申請',
  'application.rejected': '拒絕申請',
  'application.withdrawn': '撤回申請',
  'application.update_notes': '更新備註',
  'application.provision': '開通聯賽',
  'league.suspend': '暫停聯賽',
  'league.reactivate': '恢復聯賽',
  'league.close': '關閉聯賽',
  'user.reset_password': '重置用戶密碼',
  'platform.add_admin': '新增平台管理員',
  'platform.remove_admin': '移除平台管理員',
};

type TabKey = 'applications' | 'leagues' | 'users' | 'admins' | 'audit';

export default function ConsoleClient() {
  const [tab, setTab] = useState<TabKey>('applications');
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadApplications = useCallback(async () => {
    const res = await fetch('/api/platform/applications', { cache: 'no-store' });
    const body = await res.json();
    if (res.status === 403) throw new Error('你不是平台管理員（需 PLATFORM_ADMIN_EMAILS）');
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setRows(body.data.applications);
  }, []);

  const loadLeagues = useCallback(async () => {
    const res = await fetch('/api/platform/leagues', { cache: 'no-store' });
    const body = await res.json();
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setLeagues(body.data.leagues);
  }, []);

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/platform/audit-events?limit=50', { cache: 'no-store' });
    const body = await res.json();
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setAuditEvents(body.data.events);
  }, []);

  const loadAdmins = useCallback(async () => {
    const res = await fetch('/api/platform/admins', { cache: 'no-store' });
    const body = await res.json();
    if (!body?.ok) throw new Error(body?.error?.message || '載入失敗');
    setAdmins(body.data.admins);
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    const res = await fetch(`/api/platform/users?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    const body = await res.json();
    if (!body?.ok) throw new Error(body?.error?.message || '搜尋失敗');
    setUsers(body.data.users);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'applications') await loadApplications();
      else if (tab === 'leagues') await loadLeagues();
      else if (tab === 'audit') await loadAudit();
      else if (tab === 'admins') await loadAdmins();
      // users tab is query-driven, no initial load
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [tab, loadApplications, loadLeagues, loadAudit, loadAdmins]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: number, status: string) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '操作失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失敗');
    } finally {
      setBusyId(null);
    }
  }

  async function provision(id: number) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/applications/${id}/provision`, {
        method: 'POST',
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || 'Provision 失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Provision 失敗');
    } finally {
      setBusyId(null);
    }
  }

  async function leagueAct(id: number, action: 'suspend' | 'reactivate' | 'close') {
    const confirmMsg =
      action === 'close'
        ? '確定要關閉此聯賽？此操作不可還原。'
        : action === 'suspend'
          ? '確定要暫停此聯賽？'
          : '確定要恢復此聯賽？';
    if (!confirm(confirmMsg)) return;

    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/leagues/${id}/${action}`, {
        method: 'POST',
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '操作失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失敗');
    } finally {
      setBusyId(null);
    }
  }

  async function saveNotes(id: number, reviewNotes: string) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '儲存失敗');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(id: number) {
    if (!confirm('確定要重置此用戶密碼？會生成一個臨時密碼。')) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/users/${id}/reset-password`, { method: 'POST' });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '重置失敗');
      alert(`臨時密碼（只顯示一次）：\n\n${body.data.tempPassword}\n\n用戶：${body.data.email}\n請立即通知用戶更改。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失敗');
    } finally {
      setBusyId(null);
    }
  }

  async function addAdmin() {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    setError('');
    try {
      const res = await fetch('/api/platform/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '新增失敗');
      setNewAdminEmail('');
      await loadAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : '新增失敗');
    }
  }

  async function removeAdmin(id: number, email: string) {
    if (!confirm(`確定要移除平台管理員 ${email}？`)) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/platform/admins/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error?.message || '移除失敗');
      await loadAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : '移除失敗');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="page-container-narrow">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">平台控制台</h1>
            <p className="text-sm text-slate-500">聯賽申請審批與開通</p>
          </div>
          <button
            onClick={() => void load()}
            className="btn-secondary h-8 rounded-lg px-3 py-1.5 text-sm font-medium"
          >
            重新整理
          </button>
        </header>

        {/* Tabs */}
        <nav className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              { key: 'applications', label: '申請' },
              { key: 'leagues', label: '已開通聯賽' },
              { key: 'users', label: '用戶' },
              { key: 'admins', label: '管理員' },
              { key: 'audit', label: '審計日誌' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">載入中…</p>
        ) : tab === 'applications' ? (
          <ApplicationsTab
            rows={rows}
            busyId={busyId}
            act={act}
            provision={provision}
            saveNotes={saveNotes}
          />
        ) : tab === 'leagues' ? (
          <LeaguesTab leagues={leagues} busyId={busyId} leagueAct={leagueAct} />
        ) : tab === 'users' ? (
          <UsersTab
            users={users}
            userQuery={userQuery}
            setUserQuery={setUserQuery}
            searchUsers={searchUsers}
            busyId={busyId}
            resetPassword={resetPassword}
          />
        ) : tab === 'admins' ? (
          <AdminsTab
            admins={admins}
            newAdminEmail={newAdminEmail}
            setNewAdminEmail={setNewAdminEmail}
            addAdmin={addAdmin}
            removeAdmin={removeAdmin}
            busyId={busyId}
          />
        ) : (
          <AuditTab events={auditEvents} />
        )}
      </div>
    </div>
  );
}

/* ---------- Tab components ---------- */

function ApplicationsTab({
  rows,
  busyId,
  act,
  provision,
  saveNotes,
}: {
  rows: ApplicationRow[];
  busyId: number | null;
  act: (id: number, status: string) => Promise<void>;
  provision: (id: number) => Promise<void>;
  saveNotes: (id: number, notes: string) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        暫無申請
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((a) => (
        <li
          key={a.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">{a.leagueName}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {a.status}
                </span>
                {a.leagueId != null && (
                  <span className="rounded-full bg-[#0f172a]/10 px-2 py-0.5 text-xs font-semibold text-[#0f172a]">
                    league #{a.leagueId}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {a.contactName} ·{' '}
                <a className="text-blue-600 hover:underline" href={`mailto:${a.contactEmail}`}>
                  {a.contactEmail}
                </a>
                {a.contactPhone ? ` · ${a.contactPhone}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                申請代稱：{a.requestedSlug || '—'} · 預計隊數：{a.teamCountEst ?? '—'}
              </p>
              {a.notes && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {a.notes}
                </p>
              )}
              <NotesEditor
                value={a.reviewNotes ?? ''}
                disabled={busyId === a.id}
                onSave={(notes) => void saveNotes(a.id, notes)}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(a.status === 'pending' || a.status === 'in_review') && (
                <>
                  {a.status === 'pending' && (
                    <Btn disabled={busyId === a.id} onClick={() => void act(a.id, 'in_review')}>
                      開始審閱
                    </Btn>
                  )}
                  <Btn tone="green" disabled={busyId === a.id} onClick={() => void act(a.id, 'approved')}>
                    批准
                  </Btn>
                  <Btn tone="red" disabled={busyId === a.id} onClick={() => void act(a.id, 'rejected')}>
                    拒絕
                  </Btn>
                </>
              )}
              {a.status === 'approved' && a.leagueId == null && (
                <Btn tone="indigo" disabled={busyId === a.id} onClick={() => void provision(a.id)}>
                  開通聯賽
                </Btn>
              )}
              {(a.status === 'rejected' || a.status === 'withdrawn') && (
                <Btn disabled={busyId === a.id} onClick={() => void act(a.id, 'pending')}>
                  重新打開
                </Btn>
              )}
              {(a.status === 'pending' || a.status === 'in_review') && (
                <Btn tone="slate" disabled={busyId === a.id} onClick={() => void act(a.id, 'withdrawn')}>
                  撤回
                </Btn>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LeaguesTab({
  leagues,
  busyId,
  leagueAct,
}: {
  leagues: LeagueRow[];
  busyId: number | null;
  leagueAct: (id: number, action: 'suspend' | 'reactivate' | 'close') => Promise<void>;
}) {
  if (leagues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        暫無已開通聯賽
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {leagues.map((l) => (
        <li
          key={l.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">{l.slug}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    LEAGUE_STATUS_STYLE[l.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {l.status}
                </span>
                {l.plan && (
                  <span className="rounded-full bg-[#0f172a]/10 px-2 py-0.5 text-xs font-semibold text-[#0f172a]">
                    {l.plan}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{l.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                開通於 {l.createdAt ? new Date(l.createdAt).toLocaleDateString('zh-HK') : '—'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {l.status === 'active' && (
                <>
                  <Btn tone="slate" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'suspend')}>
                    暫停
                  </Btn>
                  <Btn tone="red" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'close')}>
                    關閉
                  </Btn>
                </>
              )}
              {l.status === 'suspended' && (
                <>
                  <Btn tone="green" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'reactivate')}>
                    恢復
                  </Btn>
                  <Btn tone="red" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'close')}>
                    關閉
                  </Btn>
                </>
              )}
              {(l.status === 'trial' || l.status === 'pending') && (
                <Btn tone="green" disabled={busyId === l.id} onClick={() => void leagueAct(l.id, 'reactivate')}>
                  恢復
                </Btn>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AuditTab({ events }: { events: AuditEventRow[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        暫無審計記錄
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li
          key={e.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {AUDIT_ACTION_LABEL[e.action] ?? e.action}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {e.targetLabel ?? `${e.targetType} #${e.targetId ?? '—'}`}
                {e.metadata && typeof e.metadata === 'object' && 'from' in e.metadata && 'to' in e.metadata
                  ? ` · ${String(e.metadata.from)} → ${String(e.metadata.to)}`
                  : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {new Date(e.createdAt).toLocaleString('zh-HK')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{e.actorEmail}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function UsersTab({
  users,
  userQuery,
  setUserQuery,
  searchUsers,
  busyId,
  resetPassword,
}: {
  users: UserRow[];
  userQuery: string;
  setUserQuery: (q: string) => void;
  searchUsers: (q: string) => Promise<void>;
  busyId: number | null;
  resetPassword: (id: number) => Promise<void>;
}) {
  return (
    <div>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void searchUsers(userQuery);
        }}
      >
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="搜尋 email 或 username…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <Btn tone="indigo" onClick={() => void searchUsers(userQuery)}>
          搜尋
        </Btn>
      </form>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {userQuery ? '冇符合嘅用戶' : '輸入關鍵字搜尋用戶'}
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{u.username}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {u.role ?? 'user'}
                    </span>
                    {u.mustChangePassword && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        需改密碼
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{u.email}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {u.leagueSlug ? `${u.leagueName} (${u.leagueSlug})` : '未綁定聯賽'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Btn tone="red" disabled={busyId === u.id} onClick={() => void resetPassword(u.id)}>
                    重置密碼
                  </Btn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminsTab({
  admins,
  newAdminEmail,
  setNewAdminEmail,
  addAdmin,
  removeAdmin,
  busyId,
}: {
  admins: AdminRow[];
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  addAdmin: () => Promise<void>;
  removeAdmin: (id: number, email: string) => Promise<void>;
  busyId: number | null;
}) {
  return (
    <div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">新增平台管理員</h2>
        <p className="mt-1 text-xs text-slate-500">
          DB 名單即時生效，唔使 redeploy。Env PLATFORM_ADMIN_EMAILS 嘅帳號仍然有效（唔會喺下邊顯示）。
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void addAdmin();
          }}
        >
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="admin@example.com"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <Btn tone="indigo" onClick={() => void addAdmin()}>
            新增
          </Btn>
        </form>
      </div>

      {admins.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          DB 名單暫時為空（env 名單仍然有效）
        </div>
      ) : (
        <ul className="space-y-3">
          {admins.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{a.email}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.addedBy ? `由 ${a.addedBy} 新增` : ''}
                    {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString('zh-HK')}` : ''}
                  </p>
                </div>
                <Btn tone="red" disabled={busyId === a.id} onClick={() => void removeAdmin(a.id, a.email)}>
                  移除
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotesEditor({
  value,
  disabled,
  onSave,
}: {
  value: string;
  disabled?: boolean;
  onSave: (notes: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="mt-2">
      <textarea
        value={draft}
        disabled={disabled}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
        }}
        placeholder="審批備註（只有平台管理員見到）…"
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      {dirty && (
        <div className="mt-1 flex gap-2">
          <Btn
            tone="indigo"
            disabled={disabled}
            onClick={() => {
              onSave(draft);
              setDirty(false);
            }}
          >
            儲存備註
          </Btn>
          <Btn
            disabled={disabled}
            onClick={() => {
              setDraft(value);
              setDirty(false);
            }}
          >
            取消
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ---------- Shared button ---------- */

function Btn({
  children,
  onClick,
  disabled,
  tone = 'slate',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'slate' | 'green' | 'red' | 'indigo';
}) {
  const tones: Record<string, string> = {
    slate: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
    green: 'border-green-600 bg-green-600 text-white hover:bg-green-700',
    red: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
    indigo: 'border-[#0f172a] bg-[#0f172a] text-white hover:bg-[#1e293b]',
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
