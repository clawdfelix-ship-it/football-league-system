import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import TenantGate from "@/components/tenant/TenantGate";
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

export const metadata: Metadata = {
  title: "Hong Kong Bank League 2026 | 香港銀行足球聯賽",
  description: "ZENEX SPORTS 合作夥伴 - 香港銀行足球聯賽2026官方資訊平台",
  // Fixed light-only product: tell browsers not to apply dark-mode chrome.
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" },
  ],
};

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
      </body>
    </html>
  );
}
