import Link from 'next/link';

/**
 * Shown instead of league data when the host resolves to a league whose status
 * is not servable (suspended / closed / lapsed trial). Pure presentational
 * server component — no data queries, so nothing leaks for this tenant.
 */
export default function SuspendedLeague({ slug }: { slug: string }) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
          ⏸️
        </div>
        <h1 className="text-2xl font-bold text-slate-900">聯賽暫停服務</h1>
        <p className="mt-2 text-sm text-slate-600">
          This league
          {slug ? <> (<span className="font-medium">{slug}</span>)</> : null} is
          currently unavailable. It may be suspended or its trial may have
          ended.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          如你是聯賽負責人，請聯絡平台管理員恢復服務。
        </p>
        <Link
          href="mailto:hello@zenex-sports.com?subject=League%20access%20support"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          聯絡管理員
        </Link>
      </div>
    </main>
  );
}
