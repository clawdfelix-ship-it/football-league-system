import Link from 'next/link';
import type { SuspendedReason } from '@/lib/tenant/map-league';

/**
 * Shown instead of league data when the host resolves to a league whose status
 * is not servable (suspended / closed / lapsed trial). Pure presentational
 * server component — no data queries, so nothing leaks for this tenant.
 */
export default function SuspendedLeague({
  slug,
  reason = 'status',
}: {
  slug: string;
  reason?: SuspendedReason;
}) {
  const isTrial = reason === 'trial_expired';
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
          {isTrial ? '⏳' : '⏸️'}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isTrial ? '試用期已完結' : '聯賽暫停服務'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isTrial ? (
            <>
              The trial period for this league
              {slug ? (
                <>
                  {' '}
                  (<span className="font-medium">{slug}</span>)
                </>
              ) : null}{' '}
              has ended.
            </>
          ) : (
            <>
              This league
              {slug ? (
                <>
                  {' '}
                  (<span className="font-medium">{slug}</span>)
                </>
              ) : null}{' '}
              is currently unavailable. It may be suspended or closed.
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {isTrial
            ? '如你是聯賽負責人，請聯絡平台管理員續訂以恢復服務。'
            : '如你是聯賽負責人，請聯絡平台管理員恢復服務。'}
        </p>
        <Link
          href="mailto:hello@zenex-sports.com?subject=League%20access%20support"
          className="btn-primary mt-6"
        >
          {isTrial ? '聯絡管理員續訂' : '聯絡管理員'}
        </Link>
      </div>
    </main>
  );
}
