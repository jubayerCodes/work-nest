/** @type {import('next').NextConfig} */
const nextConfig = {
  // No 'standalone' needed — Vercel handles Next.js deployment natively.
  // For self-hosted (Railway/Docker), set NEXT_STANDALONE=true to enable it.
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '//**',
      },
    ],
  },
  // Allow cross-origin requests from the API domain in production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
