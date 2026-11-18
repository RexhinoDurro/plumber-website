import Image from "next/image";
import { byId } from "@/content/media";

type Elbow = "tl" | "tr" | "bl" | "br" | "none";

const elbowClass: Record<Elbow, string> = {
  tl: "rounded-tl-elbow",
  tr: "rounded-tr-elbow",
  bl: "rounded-bl-elbow",
  br: "rounded-br-elbow",
  none: "",
};

/** A photo frame with one big rounded "pipe-elbow" corner. Pass a built-in photo `id`, or `src` + `alt`. */
export function Photo({
  id,
  src,
  alt,
  elbow = "none",
  sizes = "(max-width: 860px) 100vw, 50vw",
  className = "",
  priority = false,
}: {
  id?: string;
  src?: string;
  alt?: string;
  elbow?: Elbow;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const p = id ? byId(id) : { src: src ?? "", alt: alt ?? "" };
  // Uploaded photos come from the backend host; only Pexels goes through the image optimizer.
  const remote = !p.src.startsWith("https://images.pexels.com/");
  return (
    <div className={`photo ${elbowClass[elbow]} ${className}`}>
      <Image src={p.src} alt={p.alt} fill sizes={sizes} priority={priority} unoptimized={remote} />
    </div>
  );
}
