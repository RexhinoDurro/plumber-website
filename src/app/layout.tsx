import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/components/JsonLd";
import { site } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — Plumbing & heating in ${site.city}`,
    template: `%s · ${site.name}`,
  },
  description: `Leaks, blocked drains, bathrooms, kitchens and boilers in ${site.city}. ${site.promise}`,
  openGraph: {
    title: `${site.name} — Plumbing & heating in ${site.city}`,
    description: site.promise,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1a33",
  // Lets the layout use the full screen on iPhones with a notch / home bar; env(safe-area-inset-*) keeps content clear.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
