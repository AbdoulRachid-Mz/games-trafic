import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents: process.env.NODE_ENV === "production", // Only enable in production
  // experimental: {
  //   useCache: process.env.NODE_ENV === "production",
  //   globalNotFound: true,
  // },
  /* config options here */
  cacheComponents: true,
  experimental: {
    useCache: true,
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
