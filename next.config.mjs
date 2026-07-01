import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // `npm run check` performs strict TypeScript validation. Skipping the duplicate
  // Next.js build-time pass avoids reparsing the dynamic MDX manifest.
  typescript: { ignoreBuildErrors: true },
  outputFileTracingIncludes: {
    '/docs/[[...slug]]': ['./content/docs/**/*.mdx'],
  },
  serverExternalPackages: ['shiki'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
