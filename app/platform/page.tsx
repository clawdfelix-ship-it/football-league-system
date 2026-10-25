import { getPlatformAdmin } from '@/lib/authz';
import { getRequestTenant } from '@/lib/tenant/context';
import ConsoleClient from './ConsoleClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Platform Console · ZENEX SPORTS',
};

/**
 * Platform console host page.
 * - Must resolve to the PLATFORM host (apex/www/admin), not a tenant subdomain.
 * - Signed-in email must be in PLATFORM_ADMIN_EMAILS.
 * The API routes enforce the same two checks independently.
 */
export default async function PlatformConsolePage() {
  const tenant = await getRequestTenant();

  // On a tenant subdomain this URL is meaningless -> 404 rather than a console.
  if (tenant.resolution?.status !== 'platform') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900">404</h1>
          <p className="mt-2 text-sm text-slate-600">此路徑只在平台主機提供。</p>
        </div>
      </main>
    );
  }

  const admin = await getPlatformAdmin();
  if (!admin) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
              <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">需要平台管理員權限</h1>
          <p className="mt-2 text-sm text-slate-600">
            請以 <code className="rounded bg-slate-100 px-1.5 py-0.5">PLATFORM_ADMIN_EMAILS</code>{' '}
            名單內的帳號登入。
          </p>
        </div>
      </main>
    );
  }

  return <ConsoleClient />;
}
