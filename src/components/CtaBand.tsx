import Link from "next/link";
import { site } from "@/content/site";
import { PhoneIcon } from "./Icons";

export function CtaBand({
  title = "Water where it shouldn't be?",
  text = `Call now and we'll tell you how to stop it while we're on the way. Not urgent? Send a few details and we'll come back with a fixed price.`,
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="on-dark grain bg-brand text-white" aria-labelledby="cta-title">
      <div className="wrap grid items-end gap-8 py-24 md:grid-cols-[1fr_auto]">
        <div>
          <h2 id="cta-title" className="max-w-[18ch]">{title}</h2>
          <p className="mt-4 max-w-[50ch] text-white/90">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={site.phoneHref} className="btn btn-white">
            <PhoneIcon /> Call {site.phone}
          </a>
          <Link href="/contact" className="btn btn-secondary">
            Get a fixed-price quote
          </Link>
        </div>
      </div>
    </section>
  );
}
