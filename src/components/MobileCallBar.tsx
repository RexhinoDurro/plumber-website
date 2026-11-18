import Link from "next/link";
import { site } from "@/content/site";
import { PhoneIcon } from "./Icons";

/** Sticky bottom bar on phones: the call button stays in the thumb zone while scrolling. */
export function MobileCallBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1.3fr_1fr] gap-2 border-t border-line bg-surface/95 px-3 pt-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <a href={site.phoneHref} className="btn min-h-12 px-3 text-[0.95rem]">
        <PhoneIcon /> Call now
      </a>
      <Link href="/contact" className="btn btn-secondary min-h-12 px-3 text-[0.95rem]">
        Get a quote
      </Link>
    </div>
  );
}
