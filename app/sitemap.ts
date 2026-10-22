import type { MetadataRoute } from "next";
import { getSeoTenant } from "@/lib/tenant/seo";

export const dynamic = "force-dynamic";

// Public, indexable routes per host type. Private app/auth/admin routes and
// the league application flow are intentionally excluded.
const LEAGUE_PUBLIC = [
  "/",
  "/fixtures",
  "/teams",
  "/players",
  "/standings",
  "/head-to-head",
  "/overview",
  "/contacts",
];

const PLATFORM_PUBLIC = ["/", "/apply"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoTenant();
  const routes = seo.isPlatform ? PLATFORM_PUBLIC : LEAGUE_PUBLIC;
  const now = new Date();

  return routes.map((path) => ({
    url: `${seo.origin}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/fixtures" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/fixtures" ? 0.9 : 0.7,
  }));
}
