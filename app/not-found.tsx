import Link from 'next/link';

/**
 * Rendered for an unknown tenant subdomain (a {slug}.zenex-sports.com host that
 * matches no league). Deliberately a generic "not found" so a typo or a
 * not-yet-provisioned league can't probe for which leagues exist.
 */
export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg border border-slate-200 p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          🔍
        </div>
        <h1 className="text-2xl font-bold text-slate-900">找不到此聯賽</h1>
        <p className="mt-2 text-sm text-slate-600">
          The league you&apos;re looking for doesn&apos;t exist or hasn&apos;t
          been set up yet. Check the address, or visit the main platform.
        </p>
        <Link
          href="https://zenex-sports.com"
          className="btn-primary mt-6"
        >
          返回主平台
        </Link>
      </div>
    </main>
  );
}
