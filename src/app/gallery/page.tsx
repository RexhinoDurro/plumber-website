import type { Metadata } from "next";
import { photos, hero } from "@/content/media";
import { PageHead } from "@/components/PageHead";
import { Gallery } from "@/components/Gallery";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Our work",
  description: "Bathrooms, kitchens, heating, repairs and pipework: a look at recent plumbing jobs.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHead
        image="bathroom"
        label="Our work"
        title="Recent jobs, big and small."
        lede="Filter by type of job, open any photo full size, or play the short videos of work in progress."
      />
      <div className="wrap pb-24 pt-16">
        <p className="placeholder-note mb-8 max-w-[70ch]">
          These are free stock photos and videos from Pexels, used as placeholders. Replace them with photos of your own jobs in{" "}
          <code>src/content/media.ts</code>. Real work builds far more trust.
        </p>
        <Gallery photos={photos} />

        <section id="credits" className="mt-20 text-sm text-muted" aria-labelledby="credits-title">
          <h2 id="credits-title" className="mb-3 font-body text-base font-semibold [font-stretch:100%] tracking-normal">
            Photo credits
          </h2>
          <ul className="list-disc columns-[260px] pl-5">
            <li>
              Hero video by <a href={hero.creditUrl}>{hero.credit}</a> on Pexels
            </li>
            {photos.map((p) => (
              <li key={p.id}>
                {p.title}: <a href={p.creditUrl}>{p.credit === "Pexels" ? "Pexels" : `${p.credit} on Pexels`}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <CtaBand title="Want your job to look like these?" text="Send us a few details and a photo of the space. We'll come back with a fixed price." />
    </>
  );
}
