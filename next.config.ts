import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains; eligible for HSTS preload.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disallow MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking via frames/iframes.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Limit referrer leakage to same-origin; send only origin cross-origin.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down powerful browser features the site does not use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactCompiler: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
