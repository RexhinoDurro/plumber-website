import type { Metadata } from "next";
import { Suspense } from "react";
import { hero } from "@/content/media";
import { PageHead } from "@/components/PageHead";
import { Gallery } from "@/components/Gallery";
import { CtaBand } from "@/components/CtaBand";
import { getGallery } from "@/lib/content";

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
        <Suspense fallback={<GallerySkeleton />}>
          <LiveGallery />
        </Suspense>
      </div>
      <CtaBand title="Want your job to look like these?" text="Send us a few details and a photo of the space. We'll come back with a fixed price." />
    </>
  );
}

/** Photos and videos posted from the dashboard. Falls back to the built-in set if the backend is down. */
async function LiveGallery() {
  const { photos } = await getGallery();
  const credited = photos.filter((p) => p.credit);
  const stock = credited.some((p) => p.creditUrl.includes("pexels.com"));
  return (
    <>
      {stock && (
        <p className="placeholder-note mb-8 max-w-[70ch]">
          Some of these are free stock photos and videos from Pexels, used as placeholders. Upload photos of your own jobs from the
          dashboard and unpublish these. Real work builds far more trust.
        </p>
      )}
      <Gallery photos={photos} />

      {credited.length > 0 && (
        <section id="credits" className="mt-20 text-sm text-muted" aria-labelledby="credits-title">
          <h2 id="credits-title" className="mb-3 font-body text-base font-semibold [font-stretch:100%] tracking-normal">
            Photo credits
          </h2>
          <ul className="list-disc columns-[260px] pl-5">
            <li>
              Hero video by <a href={hero.creditUrl}>{hero.credit}</a> on Pexels
            </li>
            {credited.map((p) => (
              <li key={p.id}>
                {p.title}: <a href={p.creditUrl}>{p.credit === "Pexels" ? "Pexels" : `${p.credit} on Pexels`}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function GallerySkeleton() {
  const shapes = ["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]", "aspect-[16/10]", "aspect-[4/3]"];
  return (
    <div aria-busy="true" aria-label="Loading photos">
      <div className="mb-8 flex flex-wrap gap-2">
        {[64, 84, 90, 100, 84].map((w, i) => (
          <span key={i} className="h-11 animate-pulse rounded-full bg-photo" style={{ width: w }} />
        ))}
      </div>
      <ul className="columns-[300px] gap-4">
        {shapes.map((s, i) => (
          <li key={i} className={`mb-6 break-inside-avoid animate-pulse rounded-md bg-photo ${s}`} />
        ))}
      </ul>
    </div>
  );
}
