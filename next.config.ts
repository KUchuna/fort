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
    ],
  },
};

export default nextConfig;
