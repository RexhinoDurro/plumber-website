import { byId, type Photo as PhotoT } from "@/content/media";
import { getFeatured } from "@/lib/content";
import { Photo } from "./Photo";

type Elbow = "tl" | "br" | "none";

// Five slots of different sizes; filled from the photos marked "featured" in the dashboard, then our own job photos.
const slots: [string, Elbow][] = [
  ["col-span-12 row-span-2 md:col-span-7", "tl"],
  ["col-span-6 md:col-span-5", "none"],
  ["col-span-6 md:col-span-5", "none"],
  ["col-span-12 md:col-span-4", "none"],
  ["col-span-12 md:col-span-8", "br"],
];
const fallback = ["bathroom-remodel", "kitchen-high-rise", "boiler-install", "water-heaters", "sump-pumps"].map(byId);

export async function RecentWork() {
  const featured = (await getFeatured()) ?? [];
  // Fill all five slots: featured uploads first, then the built-in photos.
  const seen = new Set<string>();
  const items: PhotoT[] = [...featured.filter((p) => p.src), ...fallback]
    .filter((p) => !seen.has(p.src.split("/").pop()!) && seen.add(p.src.split("/").pop()!))
    .slice(0, slots.length);
  return (
    <div className="grid auto-rows-[160px] grid-cols-12 gap-4 md:auto-rows-[190px]">
      {items.map((p, i) => (
        <figure key={p.id} className={`lift relative m-0 ${slots[i][0]}`}>
          <Photo src={p.src} alt={p.alt} focus={p.focus} elbow={slots[i][1]} className="rv-img h-full" sizes="(max-width: 760px) 100vw, 60vw" />
          <figcaption className="absolute bottom-3 left-3 rounded-full bg-surface px-3 py-1 text-[0.8125rem] font-semibold">
            {p.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
