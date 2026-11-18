import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import "./globals.css";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { MobileCallBar } from "@/components/MobileCallBar";
import { Footer } from "@/components/Footer";
import { site } from "@/content/site";

export const metadata: Metadata = {
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="pb-[76px] md:pb-0">
        <a
          href="#main"
          className="absolute left-4 -top-24 z-[100] rounded-sm bg-ink px-4 py-3 text-on-dark focus:top-4"
        >
          Skip to content
        </a>
        <TopBar />
        <Header />
        <ViewTransition>
          <main id="main">{children}</main>
        </ViewTransition>
        <Footer />
        <MobileCallBar />
      </body>
    </html>
  );
}
