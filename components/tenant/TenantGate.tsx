import { notFound } from 'next/navigation';
import { getRequestTenant } from '@/lib/tenant/context';
import SuspendedLeague from './SuspendedLeague';

/**
 * Server-side tenant gate, mounted once in the root layout so EVERY route gets
 * the same host policy without each page remembering to call getRequestTenant.
 *
 *   servable (incl. vercel.app / localhost -> founding league)
 *       -> render the league UI normally.
 *   unknown real subdomain (slug that matches no league)
 *       -> hard 404. Previously these requests resolved to league 0 and every
 *          page returned HTTP 200 with silently empty data.
 *   suspended / closed league
 *       -> a branded notice instead of data.
 *   platform console host
 *       -> children for now; the console ships in Phase 3b and will own these
 *          routes explicitly. League data queries already scope to league 0 on
 *          this host, so no tenant data can leak here.
 *
 * This only renders correctly inside a request (it reads next/headers), which
 * is exactly where the root layout runs.
 */
export default async function TenantGate({ children }: { children: React.ReactNode }) {
  const tenant = await getRequestTenant();

  if (tenant.notFound) {
    notFound();
  }

  // resolution.status === 'suspended'
  if (!tenant.servable && tenant.resolution?.status === 'suspended') {
    return <SuspendedLeague slug={tenant.slug} />;
  }

  return <>{children}</>;
}
