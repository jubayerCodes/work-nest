import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Railway deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Allow importing from workspace packages
  transpilePackages: ['@worknest/types', '@worknest/utils', '@worknest/validators'],
};

export default nextConfig;
