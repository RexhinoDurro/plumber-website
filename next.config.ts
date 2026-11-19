import type { NextConfig } from "next";

// Our own job photos are in /public/work. Dashboard uploads are served by the backend under /media/. Allowing that host lets Next resize them and serve
// AVIF/WebP, so a 5 MB phone photo isn't sent as-is to a visitor on mobile data.
const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");
const apiIsLocal = ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Pexels stock photos used around the site (free under the Pexels License).
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/videos/**" },
      {
        protocol: api.protocol.replace(":", "") as "http" | "https",
        hostname: api.hostname,
        port: api.port,
        pathname: "/media/**",
      },
    ],
    // Only for a backend running on this machine (local development). A public backend never needs it.
    dangerouslyAllowLocalIP: apiIsLocal,
  },
};

export default nextConfig;
