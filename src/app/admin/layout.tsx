import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: { default: `Dashboard · ${site.name}`, template: `%s · Dashboard` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
