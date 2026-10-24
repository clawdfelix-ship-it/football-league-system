# Platform Console P0 Spec

> **Status**: Draft v1
> **Date**: 2026-10-24
> **Author**: coding-qwen (for Felix review)
> **Branch**: `feat/multitenant-saas` (merge back when complete)
> **Scope**: P0 only — League list management + Audit log. P1 (user mgmt / platform-admin UI) deferred.

---

## 1. 目標

Platform console 而家淨係審批申請,**開通咗嘅 league 完全睇唔到、郁唔到**。出事先冇 record 追。P0 解決兩件事:

1. **League 管理**:睇到晒所有已開通 league,可以 suspend / reactivate / close(soft)
2. **Audit log**:所有 platform admin 動作落 DB,出事查得到

非目標(留 P1/P2):
- User 搜尋 / 重置密碼 UI
- Platform admin 管理 UI(唔使改 Vercel env)
- TLS cert 狀態頁
- 2FA / session 管理
- Usage metrics

---

## 2. 現況(基線)

| 項 | 狀態 |
|---|---|
| `leagues.status` | 已有 `pending / trial / active / suspended / closed` 五態,default `active` |
| `leagues.plan` | 已有(`founding` 等) |
| `/api/platform/leagues` GET | ✅ 存在,返 id/slug/name/status/plan/createdAt |
| Suspend / Reactivate API | ❌ 冇 |
| Audit 表 | ❌ 冇 |
| Console UI 顯示 league list | ❌ 冇,得申請 list |
| `listProvisionedLeagues()` | ✅ `provisioning.server.ts`,join application |

---

## 3. 設計

### 3.1 DB Migration — `0013_platform_audit_events.sql`

```sql
-- Migration 0013: Platform admin audit events
-- Append-only log of every platform-admin mutation.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0013_platform_audit_events.sql

BEGIN;

CREATE TABLE IF NOT EXISTS platform_audit_events (
  id            BIGSERIAL PRIMARY KEY,
  -- Who
  actor_email   VARCHAR(200) NOT NULL,         -- platform admin email (from session)
  actor_user_id INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  -- What
  action        VARCHAR(60)  NOT NULL,          -- e.g. 'league.suspend', 'application.approve'
  target_type   VARCHAR(40)  NOT NULL,          -- 'league' | 'application' | 'user' | 'platform'
  target_id     INTEGER,                        -- nullable for platform-wide actions
  target_label  VARCHAR(200),                   -- human-readable snapshot (league slug, application id, ...)
  -- Payload (diff/before/after, JSON)
  metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  -- Where from
  ip            VARCHAR(60),
  user_agent    TEXT,
  -- When
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_events_created
  ON platform_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_actor
  ON platform_audit_events (actor_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_target
  ON platform_audit_events (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_action
  ON platform_audit_events (action, created_at DESC);

COMMENT ON TABLE platform_audit_events IS
  'Append-only platform admin action log. Never UPDATE/DELETE rows.';

COMMIT;
```

**設計取捨**:
- `actor_email` 直接存(唔 join `users`),因為 platform admin 係 env-based,**未必有 users row**
- `metadata` 用 JSONB,存 before/after diff、application notes 等自由內容
- `target_label` 做 snapshot,即使 league 之後改名都仲見到當時個 slug
- **唔加 RLS policy**(platform admin 用 neon superuser 連,RLS 適用於 tenant 唔適用於 platform 層;同 `0012` 策略一致)

### 3.2 Schema 更新 — `lib/schema.ts`

加:
```ts
export const platformAuditEvents = pgTable(
  'platform_audit_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorEmail: varchar('actor_email', { length: 200 }).notNull(),
    actorUserId: integer('actor_user_id'),
    action: varchar('action', { length: 60 }).notNull(),
    targetType: varchar('target_type', { length: 40 }).notNull(),
    targetId: integer('target_id'),
    targetLabel: varchar('target_label', { length: 200 }),
    metadata: jsonb('metadata').notNull().default({}),
    ip: varchar('ip', { length: 60 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdIdx: index('idx_platform_audit_events_created').on(table.createdAt),
    actorIdx: index('idx_platform_audit_events_actor').on(table.actorEmail, table.createdAt),
    targetIdx: index('idx_platform_audit_events_target').on(table.targetType, table.targetId, table.createdAt),
    actionIdx: index('idx_platform_audit_events_action').on(table.action, table.createdAt),
  })
);
```

### 3.3 Audit helper — `lib/tenant/audit.server.ts`(新檔)

```ts
import { db } from '@/lib/db';
import { platformAuditEvents } from '@/lib/schema';

export type AuditInput = {
  actorEmail: string;
  actorUserId?: number | null;
  action: string;
  targetType: 'league' | 'application' | 'user' | 'platform';
  targetId?: number | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export async function recordPlatformEvent(input: AuditInput): Promise<void> {
  try {
    await db.insert(platformAuditEvents).values({
      actorEmail: input.actorEmail,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetLabel: input.targetLabel ?? null,
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (e) {
    // Audit failure must NOT block the action itself; log + continue.
    console.error('[audit] failed to record event:', input.action, e);
  }
}
```

**關鍵決定**:
- **Audit 失敗唔阻塞主操作**(console.error + swallow),否則 DB 故障會鎖死成個 console
- 但寫入失敗一定要 `console.error`(Vercel log 至少睇到)

### 3.4 League 狀態 API — 3 條新 route

#### `POST /api/platform/leagues/[id]/suspend`
#### `POST /api/platform/leagues/[id]/reactivate`
#### `POST /api/platform/leagues/[id]/close`

**共通邏輯**(抽 helper `lib/tenant/league-lifecycle.server.ts`):

```ts
export async function setLeagueStatus(
  leagueId: number,
  nextStatus: 'active' | 'suspended' | 'closed',
  actor: { email: string; userId?: number | null },
  requestMeta: { ip?: string | null; userAgent?: string | null }
) {
  // 1. Fetch current
  const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);
  if (!league) throw new LeagueError('NOT_FOUND', 'League not found');

  // 2. State machine guard
  assertLeagueTransition(league.status, nextStatus);
  //   active -> suspended | closed
  //   suspended -> active | closed
  //   closed -> (terminal, no exit)
  //   pending/trial -> active (via provision, not this route)

  // 3. Update + audit (in transaction for atomicity)
  await db.update(leagues).set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(leagues.id, leagueId));

  await recordPlatformEvent({
    actorEmail: actor.email,
    actorUserId: actor.userId,
    action: `league.${nextStatus === 'active' ? 'reactivate' : nextStatus}`,
    targetType: 'league',
    targetId: leagueId,
    targetLabel: league.slug,
    metadata: { from: league.status, to: nextStatus, leagueName: league.name },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });
}
```

**Route 共用 pattern**:
```ts
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const leagueId = Number(id);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid league id');
  }

  try {
    await setLeagueStatus(leagueId, 'suspended', {
      email: admin.email,
      userId: admin.userId ?? null,
    }, {
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    });
    return ok({ leagueId, status: 'suspended' });
  } catch (e) {
    if (e instanceof LeagueError) return fail(400, e.code, e.message);
    console.error('[platform] suspend failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to suspend league');
  }
}
```

### 3.5 `getPlatformAdmin` 增強 — 要返 `email`

而家 `getPlatformAdmin()` 只返 truthy 或 null。要擴充返 `{ email, userId }`,先寫到 audit row。

`lib/authz.ts` 改:
```ts
export async function getPlatformAdmin(): Promise<{ email: string; userId: number | null } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { email?: string; isPlatform?: boolean; leagueId?: number; role?: string } | null;
  if (!user?.email) return null;
  if (!isPlatformAdminEmail(user.email)) return null;
  if (user.role !== 'admin') return null;
  // Platform principals carry leagueId 0 / isPlatform=true; not bound to a users row.
  return { email: user.email, userId: null };
}
```

### 3.6 順手補 audit 到現有動作

以下現有 API 全部加 `recordPlatformEvent`(唔改行為,只加觀察):

| Route | Action |
|---|---|
| `POST /api/platform/applications/[id]/provision` | `application.provision` |
| `PATCH /api/platform/applications/[id]` | `application.{approve,reject,withdraw,reopen,review,start_review}` |

---

## 4. Console UI 更新

### 4.1 加 League section

`app/platform/ConsoleClient.tsx` 改:

```
+---------------------------------------------------+
| 平台控制台                              [重新整理] |
| 聯賽申請審批與開通                                 |
+---------------------------------------------------+
| [申請 (N)]  [已開通聯賽 (M)]  [審計日誌]          | <- 新 tabs
+---------------------------------------------------+
```

**Tab 2: 已開通聯賽** (`LeaguesTab.tsx` 新 component)

每 row:
```
┌──────────────────────────────────────────────────────┐
| hkbankleague2026  [active]  plan=founding            |
| HK Bank League 2026                                  |
| 開通於 2026-10-10                                    |
|                                                      |
| [暫停] [關閉]  [查看網站 →]                          |
└──────────────────────────────────────────────────────┘
```

狀態色:
- `active` → 綠
- `suspended` → 琥珀
- `closed` → 灰
- `trial` → 藍

按鈕按 status 顯示:
- `active` → 「暫停」「關閉」
- `suspended` → 「恢復」「關閉」
- `closed` → 冇(terminal)
- 全部都要 **確認 dialog**(用 native `confirm()` 先,P1 先整靚 modal)

### 4.2 加 Audit tab(簡易版)

**Tab 3: 審計日誌** (`AuditTab.tsx`)

```
┌──────────────────────────────────────────────────────┐
| 時間                動作               目標           |
| 2026-10-24 22:30   league.suspend     hkbankleague2026 |
|   by felix3216@gmail.com                             |
|   from: active → to: suspended                       |
├──────────────────────────────────────────────────────┤
| 2026-10-24 22:15   application.approve  #12          |
|   by felix3216@gmail.com                             |
└──────────────────────────────────────────────────────┘
```

**API**: `GET /api/platform/audit-events?limit=100&action=...&targetType=...`

返最近 100 條,唔做 pagination(P1 先)。

---

## 5. Suspend 嘅行為定義(關鍵!)

**Suspending 一個 league 之後會發生咩?**

而家 code 入面 `resolve-league.server.ts` 按 host resolve league id,但冇 check `status`。要補:

```ts
// lib/tenant/resolve-league.server.ts
if (league.status === 'suspended') {
  return { status: 'suspended', league };  // 新狀態
}
if (league.status === 'closed') {
  return { status: 'closed', league };
}
```

跟住喺 middleware / page 層:
- `suspended` → 全站 render 「此聯賽已暫停」頁(503-style,但 200 status 唔影響 SEO)
- `closed` → 404 或跳去 platform 主頁

**豁免**:platform admin 登入後仲係可以入個 league 睇(方便查問題),用 `?platform_preview=1` + platform admin session 繞過。P0 可以暫時唔做,淨係直接擋。

---

## 6. 測試

### 6.1 Unit tests

| 檔 | 覆蓋 |
|---|---|
| `lib/tenant/league-lifecycle.test.ts`(新) | 狀態機轉換、非法轉換 reject |
| `lib/tenant/audit.server.test.ts`(新) | insert 成功、insert 失敗唔 throw |
| `lib/authz.test.ts`(更新) | `getPlatformAdmin` 返 email、非 allowlist 返 null |

### 6.2 Integration tests(用 scratch PG)

```bash
# 跑喺本地 scratch DB
PGSSLMODE=require DATABASE_URL=... npm run test -- leagues.spec.ts
```

- suspend league → DB row status='suspended' + audit row 存在
- 再 suspend → 400 invalid transition
- reactivate → status='active'
- close → status='closed',之後任何 transition 都 400

### 6.3 手動驗收

- [ ] `platform.zenex-sports.com/platform` 見到三個 tab
- [ ] 「已開通聯賽」見到 `hkbankleague2026`,狀態 badge 綠色
- [ ] 撳「暫停」→ 確認 → DB 狀態變 `suspended` → `https://hkbankleague2026.zenex-sports.com` 顯示暫停頁
- [ ] 撳「恢復」→ 網站返嚟
- [ ] Audit tab 見到兩條 record,actor email 正確
- [ ] 撳「關閉」→ 再撳「恢復」→ 400 error

---

## 7. Rollout plan

1. **本地 scratch PG** 跑 migration 0013,verify schema
2. **本機起 Next dev** 行 unit tests,過先繼續
3. **Push branch** `feat/platform-console-p0` → Vercel preview 自動起
4. **Preview URL 實測**(用 `preview-xxx-clawdfelix.vercel.app`,唔好直接動 production)
5. **Apply migration 到 production DB**:
   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0013_platform_audit_events.sql
   ```
6. **Merge to main**(GitHub auto-deploy production)
7. **驗證 production**:suspend + reactivate `hkbankleague2026` 一次(幾秒內還原,影響微)
8. 寫入 `TOOLS.md` football-league-system section

---

## 8. Out of scope(留 P1/P2)

- User 搜尋 + 重置 manager 密碼 UI
- Platform admin 管理 UI(加/減 `PLATFORM_ADMIN_EMAILS`)
- TLS cert 狀態頁
- 2FA for platform admin
- Usage metrics dashboard
- 申請嘅 reviewNotes UI(API 有,未 consume)
- Email 重發 / 直接 send 功能
- Audit log export / 進階 filter / pagination

---

## 9. 風險 & 緩解

| 風險 | 緩解 |
|---|---|
| Audit insert 失敗拖慢主操作 | `recordPlatformEvent` swallow error,唔 throw |
| `getPlatformAdmin` 改 return type 影響現有 API | 而家只有 truthy/null check,返 object 都 truthy;但 TS type 要逐一 check,逐步過 |
| Suspend 後 SEO 受影響 | suspended 頁用 200 status + `noindex` meta,唔用 503 |
| `closed` 不可逆 | UI 加明示「此操作不可還原」,P1 加 type-the-slug-to-confirm |
| `actorUserId` 長期都係 NULL | 因為 platform admin 唔係 users row。可以接受,email 已係足夠 identifier |

---

## 10. 工作量估算

| 部分 | 時間 |
|---|---|
| Migration 0013 + schema.ts + 測試 | 0.5h |
| `audit.server.ts` + 接入現有 4 條 API | 1h |
| `league-lifecycle.server.ts` + 3 條新 route + 測試 | 1.5h |
| `resolve-league.server.ts` suspended/closed 處理 + 暫停頁 UI | 1h |
| Console UI tabs + LeaguesTab + AuditTab | 2h |
| 測試 + rollout + 驗證 | 1h |
| **Total** | **~7h** |

---

## 11. 驗收 checklist

- [ ] Migration 0013 喺 scratch PG 跑兩次都成功(idempotent)
- [ ] 三條新 league status API 有 unit + integration tests
- [ ] 現有 provision/applications API 加 audit,tests pass
- [ ] Console UI 三個 tab 齊,可以 suspend/reactivate/close
- [ ] Suspend 後 subdomain 顯示暫停頁
- [ ] Audit tab 見到所有動作
- [ ] Production rollout 完成,`hkbankleague2026` 正常運作
- [ ] `TOOLS.md` 更新
