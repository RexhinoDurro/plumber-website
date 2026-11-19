import Image from "next/image";
import { byId, clips, type ClipName } from "@/content/media";
import { HeroVideo } from "./HeroVideo";

/**
 * Inner-page header: a full-bleed photo, or a muted looping video that matches the page, under an ink overlay,
 * with the elbow corner on the bottom right. The video's still frame loads first (and stays when video is skipped).
 */
export function PageHead({
  label,
  title,
  lede,
  image,
  video,
  aside,
}: {
  label: string;
  title: string;
  lede: string;
  /** A photo id from media.ts. Used when there's no video. */
  image?: string;
  /** A background video from `clips` in media.ts, matching the page's topic. */
  video?: ClipName;
  /** Optional panel on the right, e.g. a quote form, so it sits above the fold. */
  aside?: React.ReactNode;
}) {
  const clip = video ? clips[video] : null;
  const src = clip ? clip.poster : byId(image ?? "steel-pipes").src;
  return (
    <section className="wrap pt-6">
      <div className="on-dark grain relative isolate overflow-hidden rounded-md rounded-br-elbow bg-ink text-on-dark">
        <Image src={src} alt="" fill priority sizes="100vw" className="drift object-cover opacity-55" />
        {clip && <HeroVideo src={clip.src} poster={clip.poster} className="media-bg object-cover opacity-55" />}
        <div
          className="media-shade"
          style={{ background: "linear-gradient(to right, rgb(10 26 51 / .94), rgb(10 26 51 / .7) 55%, rgb(10 26 51 / .35))" }}
        />
        <div
          className={`relative z-[2] grid gap-10 px-[clamp(24px,5vw,64px)] pb-14 pt-24 md:pb-20 md:pt-32 ${
            aside ? "lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-14 lg:pt-14" : ""
          }`}
        >
          <div className="grid gap-5">
            <p className="label">{label}</p>
            <h1 className={aside ? "max-w-[20ch] text-[clamp(2.2rem,2.6vw+1rem,3.4rem)]" : "max-w-[16ch] text-[clamp(2.4rem,5vw+0.5rem,4.75rem)]"}>
              {title}
            </h1>
            <p className="lede !text-on-dark-muted">{lede}</p>
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}
