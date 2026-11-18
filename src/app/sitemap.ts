import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { siteUrl } from "@/components/JsonLd";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/emergency", "/gallery", "/about", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, priority: p === "" ? 1 : 0.8 })),
    ...services.map((s) => ({ url: `${siteUrl}/services/${s.slug}`, priority: 0.9 })),
  ];
}
