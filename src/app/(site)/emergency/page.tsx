import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { problems } from "@/content/problems";
import { clips } from "@/content/media";
import { VideoBand } from "@/components/VideoBand";
import { PhoneIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: `Emergency plumber in ${site.city}`,
  description: `Burst pipe or leak? Call ${site.phone}. What to do right now while we're on the way.`,
};

export default function EmergencyPage() {
  const urgent = problems.filter((p) => p.urgency !== "Plan ahead");
  return (
    <>
      <VideoBand video={clips.pipeDrip} align="full" labelledBy="em-title">
        <div className="wrap grid gap-8 py-24 md:py-32">
          <p className="label">Emergency plumber · {site.city}</p>
          <h1 id="em-title" className="max-w-[14ch] text-[clamp(2.6rem,5vw+0.5rem,5rem)]">Water where it shouldn&apos;t be? Call now.</h1>
          <a
            href={site.phoneHref}
            className="tap justify-self-start font-display text-[clamp(2.2rem,5vw+0.5rem,4.5rem)] font-extrabold leading-none text-sky no-underline decoration-[3px] hover:underline [font-stretch:125%]"
          >
            {site.phone}
          </a>
          {/* TODO: add your typical emergency response time here once you can stand behind it. */}
          <p className="lede !text-on-dark-muted">
            A real person answers, tells you how to stop the water, and gives you an honest arrival time.
          </p>
          <a href={site.phoneHref} className="btn justify-self-start"><PhoneIcon /> Call the emergency line</a>
        </div>
      </VideoBand>

      <section className="section" aria-labelledby="now-title">
        <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="rv grid content-start gap-4">
            <p className="label">While you wait</p>
            <h2 id="now-title" className="max-w-[12ch]">What to do right now</h2>
            <p className="lede">Find your problem. Each one tells you the safest first step.</p>
          </div>
          <div className="rv-stagger grid gap-4">
            {urgent.map((p) => (
              <article key={p.id} className="grid gap-3 rounded-md bg-surface p-6 shadow-hair md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl">{p.label}</h3>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.urgency === "Emergency" ? "bg-[#b3261e] text-white" : "bg-brand text-white"}`}>
                    {p.urgency}
                  </span>
                </div>
                <p>{p.firstStep}</p>
                <Link href={`/services/${p.service}`} className="tap font-semibold text-water">More about this</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
