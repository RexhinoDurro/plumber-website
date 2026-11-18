import Link from "next/link";
import { site } from "@/content/site";
import { PhoneIcon } from "@/components/Icons";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
    <TopBar />
    <Header />
    <main id="main">
    <section className="blueprint">
      <div className="wrap grid min-h-[70svh] content-center gap-6 py-24">
        <p className="label">Page not found</p>
        <h1 className="max-w-[14ch] text-[clamp(2.4rem,5vw+0.5rem,4.5rem)]">This pipe doesn&apos;t lead anywhere.</h1>
        <p className="lede">The page may have moved. Try one of these, or call us if it&apos;s urgent.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn">Back to home</Link>
          <Link href="/services" className="btn btn-secondary">See services</Link>
          <a href={site.phoneHref} className="btn btn-secondary"><PhoneIcon /> {site.phone}</a>
        </div>
      </div>
    </section>
    </main>
    <Footer />
    </>
  );
}
