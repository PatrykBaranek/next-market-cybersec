import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SECURITY (typical): no global headers, default poweredBy header present.
  // baseline diff: same.
  // hardened diff: + headers(), poweredBy: false, restrictive images.remotePatterns.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // SECURITY (typical): permissive.
    ],
  },
};

export default nextConfig;
