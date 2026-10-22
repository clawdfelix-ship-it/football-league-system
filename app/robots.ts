import type { MetadataRoute } from "next";
import { getSeoTenant } from "@/lib/tenant/seo";

export const dynamic = "force-dynamic";

/**
 * Tenant-aware robots.txt.
 * - platform console: allow marketing/apply, disallow private app areas
 * - league tenant:      allow public pages, disallow admin/account routes
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoTenant();
  const origin = seo.origin;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/manager-dashboard",
          "/dashboard",
          "/team-settings",
          "/init-teams",
          "/api/",
          "/reset-password",
          "/change-password",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
