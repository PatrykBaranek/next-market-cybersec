import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredBy: false,
  images: {
    remotePatterns: [
      // SECURITY (hardened): explicit allowlist for image hosts.
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
