import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.bulekeats.com",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },

      {
        protocol: "http",
        hostname: "192.168.1.35",
      },
    ],
  },
  trailingSlash: false
};

export default nextConfig;
