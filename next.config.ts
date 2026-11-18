import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Pexels placeholder photos. Remove these once the site uses its own job photos in /public.
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/videos/**" },
    ],
  },
};

export default nextConfig;
