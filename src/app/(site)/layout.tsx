import { ViewTransition } from "react";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { MobileCallBar } from "@/components/MobileCallBar";
import { BusinessJsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";

/** Public website chrome. The dashboard under /admin has its own layout. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="pb-[76px] md:pb-0">
      <BusinessJsonLd />
      <a href="#main" className="absolute left-4 -top-24 z-[100] rounded-sm bg-ink px-4 py-3 text-on-dark focus:top-4">
        Skip to content
      </a>
      <TopBar />
      <Header />
      <ViewTransition>
        <main id="main">{children}</main>
      </ViewTransition>
      <Footer />
      <MobileCallBar />
      <ChatWidget />
    </div>
  );
}
