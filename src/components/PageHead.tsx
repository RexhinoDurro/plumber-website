import Image from "next/image";
import { byId } from "@/content/media";

/** Inner-page header: a full-bleed job photo under an ink overlay, with the elbow corner on the bottom right. */
export function PageHead({ label, title, lede, image }: { label: string; title: string; lede: string; image: string }) {
  const p = byId(image);
  return (
    <section className="wrap pt-6">
      <div className="on-dark grain relative isolate overflow-hidden rounded-md rounded-br-elbow bg-ink text-on-dark">
        <Image src={p.src} alt="" fill priority sizes="100vw" className="drift object-cover opacity-55" />
        <div
          className="media-shade"
          style={{ background: "linear-gradient(to right, rgb(10 26 51 / .94), rgb(10 26 51 / .7) 55%, rgb(10 26 51 / .35))" }}
        />
        <div className="relative z-[2] grid gap-5 px-[clamp(24px,5vw,64px)] pb-14 pt-24 md:pb-20 md:pt-32">
          <p className="label">{label}</p>
          <h1 className="max-w-[16ch] text-[clamp(2.4rem,5vw+0.5rem,4.75rem)]">{title}</h1>
          <p className="lede !text-on-dark-muted">{lede}</p>
        </div>
      </div>
    </section>
  );
}
