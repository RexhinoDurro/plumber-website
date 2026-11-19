import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: { default: `Dashboard · ${site.name}`, template: `%s · Dashboard` },
  robots: { index: false, follow: false },
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Dashboard", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin-icon-192.png" },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
