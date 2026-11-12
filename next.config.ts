import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Old product records may still contain base64 image data.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
