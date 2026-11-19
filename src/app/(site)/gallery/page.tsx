import type { Metadata } from "next";
import { Suspense } from "react";
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
        image="bathroom-remodel"
        label="Our work"
        title="Recent jobs, big and small."
        lede="Real jobs, photographed by us: bathrooms, kitchens, boilers, water heaters and the pipework behind the walls. Filter by type of job or open any photo full size."
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
  return <Gallery photos={photos} />;
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
