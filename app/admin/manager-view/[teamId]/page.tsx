import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthContext } from '@/lib/authz';
import { getTeamsForCurrentLeague } from '@/lib/teams/load';
import { PlayerManager } from '@/app/admin/match-sheet/[teamId]/PlayerManager';
import { KitColorManager } from '@/components/KitColorManager';

export const dynamic = 'force-dynamic';

/**
 * Read-only-ish "manager view" of a team, for league admins.
 *
 * A league admin clicks "Manager 視角" next to a team in /admin; this page
 * renders the same PlayerManager + KitColorManager the real manager would see
 * on their own dashboard, but the admin session stays intact (no impersonate
 * token swap, no sign-out required). URL is its own sub-route so opening in a
 * new tab doesn't disturb the admin page state.
 */
export default async function ManagerViewPage({ params }: { params: Promise<{ teamId: string }> }) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');
  if (auth.role !== 'admin') redirect('/admin');

  const { teamId } = await params;
  const teamIndex = parseInt(teamId, 10);
  const teams = await getTeamsForCurrentLeague();
  const team = Number.isInteger(teamIndex) ? teams[teamIndex] : undefined;
  if (!team) return notFound();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="page-container-narrow flex flex-col gap-6 py-10">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Manager 視角</p>
              <h1 className="text-2xl font-bold tracking-tight">
                {team.name}
                {team.nameZh && <span className="ml-2 text-base font-normal text-slate-600">{team.nameZh}</span>}
              </h1>
            </div>
            <Link href="/admin" className="btn-admin btn-admin-sm">← 返 Admin</Link>
          </div>
          <p className="text-sm text-slate-600">
            你呢家以 admin 身份睇緊 {team.shortName || team.name} 嘅 manager 頁面（改動會即時生效，同該隊 manager 見到嘅一樣）。
          </p>
        </header>

        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">球員名單</h2>
          <PlayerManager teamName={team.name} />
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">球衣顏色</h2>
          <KitColorManager teamName={team.name} />
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">打印 Squad List</h2>
          <Link
            href={`/admin/match-sheet/${teamIndex}`}
            target="_blank"
            className="btn-admin-primary inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <path d="M6 14h12v8H6z"/>
            </svg>
            開 Squad List（新 tab）
          </Link>
        </section>
      </main>
    </div>
  );
}
