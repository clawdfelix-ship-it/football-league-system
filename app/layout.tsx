import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import TenantGate from "@/components/tenant/TenantGate";
import { getSeoTenant } from "@/lib/tenant/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const PLATFORM_NAME = "ZENEX Sports League Platform";
const PLATFORM_DESC =
  "為你的足球聯賽開一個專屬網站：賽程、賽果、積分榜、球隊管理一應俱全，中英對照，開箱即用。";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoTenant();
  const origin = seo.origin;
  const canonical = `${origin}/`;

  const title = seo.isPlatform
    ? "ZENEX Sports | 聯賽管理平台"
    : seo.leagueName
      ? `${seo.leagueName} | 官方賽程・積分榜・球隊`
      : "Hong Kong Bank League 2026 | 香港銀行足球聯賽";

  const description = seo.isPlatform
    ? PLATFORM_DESC
    : seo.leagueName
      ? `${seo.leagueName}官方資訊平台：即時賽程、賽果、積分榜、球隊與球員資料。由 ZENEX SPORTS 提供技術支援。`
      : "ZENEX SPORTS 合作夥伴 - 香港銀行足球聯賽2026官方資訊平台";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seo.isPlatform ? PLATFORM_NAME : seo.leagueName ?? "ZENEX Sports",
      type: "website",
      locale: "zh_HK",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

// Next.js 16: colorScheme/themeColor must live in the viewport export.
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0f172a",
};

async function JsonLd() {
  const seo = await getSeoTenant();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ZENEX SPORTS",
    url: "https://www.zenex-sports.com/",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seo.isPlatform ? PLATFORM_NAME : seo.leagueName ?? "Hong Kong Bank League 2026",
    url: `${seo.origin}/`,
    inLanguage: ["zh-Hant-HK", "en"],
  };

  const graph: object[] = seo.isPlatform
    ? [
        org,
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: PLATFORM_NAME,
          applicationCategory: "SportsApplication",
          operatingSystem: "Web",
          url: `${seo.origin}/`,
          description: PLATFORM_DESC,
          publisher: { "@type": "Organization", name: "ZENEX SPORTS" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "HKD" },
        },
        website,
      ]
    : [
        org,
        {
          "@context": "https://schema.org",
          "@type": "SportsLeague",
          name: seo.leagueName ?? "Hong Kong Bank League 2026",
          url: `${seo.origin}/`,
          sport: "Soccer",
          inLanguage: ["zh-Hant-HK", "en"],
          publisher: { "@type": "Organization", name: "ZENEX SPORTS" },
        },
        website,
      ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" data-theme="light" style={{ colorScheme: "light" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansTC.variable} antialiased`}
      >
        <ClientLayout>
          <TenantGate>{children}</TenantGate>
        </ClientLayout>
        <JsonLd />
      </body>
    </html>
  );
}
