/**
 * Pure routing predicate for the root page host branch.
 *
 * Extracted from app/page.tsx so the contract "platform host renders the SaaS
 * landing and never runs league queries" is testable without rendering a Next
 * server component (page-level test would need the whole RSC stack).
 */
import type { RequestTenant } from './context';

export function shouldRenderPlatformLanding(
  tenant: Pick<RequestTenant, 'isPlatform'>
): boolean {
  return tenant.isPlatform === true;
}
