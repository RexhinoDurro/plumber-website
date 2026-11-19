import Link from "next/link";
import { site } from "@/content/site";
import { PhoneIcon } from "./Icons";

/** Closing band: the emergency line, what to do right now, and the quote route for non-urgent jobs. */
export function EmergencyCta() {
  return (
    <section className="on-dark grain bg-brand text-white" aria-labelledby="final-title">
      <div className="wrap grid gap-12 py-20 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div className="grid gap-5">
          <p className="label !text-white/85">Leak right now? Call any time, 24/7</p>
          <h2 id="final-title" className="max-w-[16ch]">Water where it shouldn&apos;t be?</h2>
          <a
            href={site.phoneHref}
            className="w-fit font-display text-[clamp(2rem,4vw+0.5rem,3.5rem)] font-extrabold leading-none tracking-[-0.02em] text-white no-underline decoration-[3px] hover:underline [font-stretch:125%]"
          >
            {site.phone}
          </a>
          <p className="max-w-[48ch] text-white/90">
            We tell you how to stop it while we&apos;re on the way, usually there within {site.emergencyArrival}. Not urgent? Get a
            fixed price instead.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={site.phoneHref} className="btn btn-white">
              <PhoneIcon /> Call now
            </a>
            <Link href="/contact" className="btn btn-secondary !border-white/70 !text-white hover:!bg-white/10">
              Get a fixed price
            </Link>
          </div>
        </div>
        <ol className="grid rounded-md bg-ink/25 p-6 md:p-8" aria-label="While you wait">
          {[
            ["Turn off the water", "The main shut-off valve is usually by the water meter or under the kitchen sink. Turn it clockwise. In an apartment, call the super too."],
            ["Switch off nearby electrics", "If water is near outlets or light fixtures, turn them off at the breaker panel."],
            ["Tell your super, take a photo", "In an apartment the leak may be from above. A photo helps us bring the right parts."],
          ].map(([b, s], i) => (
            <li key={b} className="grid grid-cols-[36px_1fr] gap-3 border-t border-white/20 py-4 first:border-0 first:pt-0 last:pb-0">
              <span className="font-display text-2xl font-extrabold leading-none text-sky [font-stretch:125%]">{i + 1}</span>
              <span>
                <b className="block font-semibold">{b}</b>
                <span className="text-[0.95rem] text-white/80">{s}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-[0.95rem] text-white/85 lg:col-span-2">
          <b>Smell gas?</b> Don&apos;t use switches or flames. Leave the building, then call 911 or Con Edison (1-800-75-CONED) / National Grid
          (718-643-4050) from outside.
        </p>
      </div>
    </section>
  );
}
