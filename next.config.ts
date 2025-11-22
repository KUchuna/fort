import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "i.scdn.co",
        port: '',
      },
      {
        protocol: 'https',
        hostname: "mosaic.scdn.co",
        port: '',
      },
      {
        protocol: 'https',
        hostname: "bnooctlevxxbyb6o.public.blob.vercel-storage.com",
        port: '',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
